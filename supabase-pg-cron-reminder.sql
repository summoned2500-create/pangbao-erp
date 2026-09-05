-- ============================================================
-- 胖寶ERP LINE Bot 每日提醒排程
-- Supabase pg_cron + pg_net 版本
-- 每天台灣時間 22:00（UTC 14:00）自動發送 LINE Push Message
-- ============================================================


-- ============================================================
-- 區塊 1：啟用擴充功能
-- ============================================================

-- 啟用 pg_cron（排程功能）和 pg_net（HTTP 請求功能）
-- IF NOT EXISTS 確保已啟用時不會報錯
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;


-- ============================================================
-- 區塊 2：建立 notification_logs 資料表（若不存在）
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_logs (
    id          BIGSERIAL PRIMARY KEY,
    sent_at     DATE        NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Taipei')::DATE,
    type        TEXT        NOT NULL DEFAULT 'daily_reminder',  -- 通知類型
    status      TEXT        NOT NULL,                           -- 'success' | 'skipped' | 'error'
    message     TEXT,                                           -- 發送的訊息內容（或跳過原因）
    error       TEXT,                                           -- 錯誤訊息（若失敗）
    request_id  BIGINT,                                         -- pg_net 回傳的非同步請求 ID
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 建立索引：加快每日查詢速度
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at
    ON notification_logs (sent_at, type, status);

-- 啟用 Row Level Security
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- 只允許 service_role 存取（pg_cron function 以 postgres role 執行，可繞過 RLS）
-- 一般前端/匿名用戶無法讀寫此表
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'notification_logs'
          AND policyname = 'service_role_only'
    ) THEN
        CREATE POLICY service_role_only ON notification_logs
            USING (auth.role() = 'service_role');
    END IF;
END $$;


-- ============================================================
-- 區塊 3：建立發送通知的 Function
-- ============================================================

CREATE OR REPLACE FUNCTION send_erp_reminder()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER  -- 以 function 擁有者權限執行，可存取 vault
AS $$
DECLARE
    v_today         DATE;
    v_line_token    TEXT;
    v_line_group_id TEXT;
    v_message       TEXT;
    v_request_id    BIGINT;
    v_already_sent  BOOLEAN;
    v_has_records   BOOLEAN;
BEGIN
    -- 取得今日台灣日期
    v_today := (NOW() AT TIME ZONE 'Asia/Taipei')::DATE;

    -- ----------------------------------------------------------
    -- 步驟 1：檢查今日是否已成功發送過通知 → 有就跳過
    -- ----------------------------------------------------------
    SELECT EXISTS (
        SELECT 1
        FROM notification_logs
        WHERE sent_at = v_today
          AND type    = 'daily_reminder'
          AND status  = 'success'
    ) INTO v_already_sent;

    IF v_already_sent THEN
        -- 記錄跳過原因（可選，避免日誌過多可移除此行）
        INSERT INTO notification_logs (sent_at, type, status, message)
        VALUES (v_today, 'daily_reminder', 'skipped', '今日已發送過通知，略過');
        RETURN;
    END IF;

    -- ----------------------------------------------------------
    -- 步驟 2：檢查今日 transactions 是否有記錄 → 有就跳過
    -- ----------------------------------------------------------
    SELECT EXISTS (
        SELECT 1
        FROM transactions
        WHERE date = v_today
    ) INTO v_has_records;

    IF v_has_records THEN
        INSERT INTO notification_logs (sent_at, type, status, message)
        VALUES (v_today, 'daily_reminder', 'skipped', '今日已有交易記錄，不發送提醒');
        RETURN;
    END IF;

    -- ----------------------------------------------------------
    -- 步驟 3：從 Supabase Vault 讀取 LINE 憑證
    -- ----------------------------------------------------------
    -- 方式 A：使用 Vault（推薦，需先在 Dashboard → Vault 新增 secret）
    BEGIN
        SELECT decrypted_secret
        INTO v_line_token
        FROM vault.decrypted_secrets
        WHERE name = 'LINE_TOKEN'
        LIMIT 1;

        SELECT decrypted_secret
        INTO v_line_group_id
        FROM vault.decrypted_secrets
        WHERE name = 'LINE_GROUP_ID'
        LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
        -- Vault 不可用時記錄錯誤並結束
        INSERT INTO notification_logs (sent_at, type, status, error)
        VALUES (v_today, 'daily_reminder', 'error',
                'Vault 讀取失敗：' || SQLERRM || ' — 請確認已在 Vault 設定 LINE_TOKEN 和 LINE_GROUP_ID');
        RETURN;
    END;

    -- 驗證憑證是否存在
    IF v_line_token IS NULL OR v_line_group_id IS NULL THEN
        INSERT INTO notification_logs (sent_at, type, status, error)
        VALUES (v_today, 'daily_reminder', 'error',
                'Vault 中找不到 LINE_TOKEN 或 LINE_GROUP_ID，請確認 secret 名稱正確');
        RETURN;
    END IF;

    -- ----------------------------------------------------------
    -- 步驟 4：組合 LINE 訊息內容
    -- ----------------------------------------------------------
    v_message := format(
        '{"to":"%s","messages":[{"type":"text","text":"🔔 胖寶ERP提醒\n\n今天還沒有更新記錄喔！\n請記得填入今日的：\n• 💸 成本支出\n• 💰 營收金額\n\n📅 %s"}]}',
        v_line_group_id,
        TO_CHAR(v_today AT TIME ZONE 'Asia/Taipei', 'YYYY年MM月DD日')
    );

    -- ----------------------------------------------------------
    -- 步驟 5：呼叫 LINE Push Message API（非同步）
    -- ----------------------------------------------------------
    SELECT net.http_post(
        url     := 'https://api.line.me/v2/bot/message/push',
        headers := jsonb_build_object(
            'Content-Type',  'application/json',
            'Authorization', 'Bearer ' || v_line_token
        ),
        body    := v_message::JSONB
    ) INTO v_request_id;

    -- ----------------------------------------------------------
    -- 步驟 6：記錄發送結果到 notification_logs
    -- pg_net 是非同步的，request_id 可供後續查詢實際回應
    -- ----------------------------------------------------------
    INSERT INTO notification_logs (sent_at, type, status, message, request_id)
    VALUES (
        v_today,
        'daily_reminder',
        'success',
        '已發送 LINE 提醒',
        v_request_id
    );

EXCEPTION WHEN OTHERS THEN
    -- 捕捉任何未預期錯誤
    INSERT INTO notification_logs (sent_at, type, status, error)
    VALUES (v_today, 'daily_reminder', 'error', SQLERRM);
END;
$$;


-- ============================================================
-- 區塊 4：設定 pg_cron 排程
-- 每天 UTC 14:00 = 台灣時間 22:00
-- ============================================================

-- 先移除舊排程（若存在），避免重複
SELECT cron.unschedule('erp-daily-reminder')
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'erp-daily-reminder'
);

-- 建立新排程
SELECT cron.schedule(
    'erp-daily-reminder',           -- 排程名稱（唯一識別）
    '0 14 * * *',                   -- Cron 表達式：每天 UTC 14:00
    'SELECT send_erp_reminder();'   -- 執行的 SQL
);

-- 確認排程已建立
SELECT jobid, jobname, schedule, command, active
FROM cron.job
WHERE jobname = 'erp-daily-reminder';


-- ============================================================
-- 區塊 5：Vault 設定說明
-- ============================================================

/*
【必要設定】在 Supabase Dashboard 新增 Vault Secrets：

步驟：
  1. 前往 Supabase Dashboard → 左側選單 → Vault
  2. 點擊「New Secret」
  3. 新增第一個 secret：
       名稱（Name）：LINE_TOKEN
       值（Secret）：你的 LINE Channel Access Token
       （取得方式：LINE Developers Console → Messaging API → Channel access token）
  4. 新增第二個 secret：
       名稱（Name）：LINE_GROUP_ID
       值（Secret）：你的推播目標 ID（群組 ID 或用戶 ID）
       （格式：群組 ID 以 C 開頭，如 Cxxxxxxxxxx）

【備用方案】若 Vault 無法使用，可改用 pg_settings 存入參數：

  -- 在 Supabase SQL Editor 執行：
  ALTER DATABASE postgres SET app.line_token = '你的TOKEN';
  ALTER DATABASE postgres SET app.line_group_id = '你的GROUP_ID';

  -- 並將 Function 中的 Vault 讀取改為：
  v_line_token    := current_setting('app.line_token', true);
  v_line_group_id := current_setting('app.line_group_id', true);

【注意】pg_settings 方式的 Token 會以明文儲存在資料庫設定中，
安全性低於 Vault，建議優先使用 Vault。
*/


-- ============================================================
-- 區塊 6：測試與驗證 SQL
-- ============================================================

-- 【測試 1】手動觸發發送（立即執行，不等排程）
-- SELECT send_erp_reminder();

-- 【測試 2】查看最近的發送記錄
SELECT
    id,
    sent_at,
    type,
    status,
    message,
    error,
    request_id,
    created_at
FROM notification_logs
ORDER BY created_at DESC
LIMIT 20;

-- 【測試 3】查看 pg_net 非同步請求的實際回應
-- （需要等待幾秒讓非同步請求完成）
-- SELECT
--     id,
--     status_code,
--     content::TEXT AS response_body,
--     error_msg,
--     created
-- FROM net._http_response
-- WHERE id = <request_id>  -- 替換為 notification_logs.request_id 的值
-- LIMIT 1;

-- 【測試 4】確認排程狀態
SELECT jobid, jobname, schedule, command, active
FROM cron.job
WHERE jobname = 'erp-daily-reminder';

-- 【測試 5】查看 pg_cron 執行歷史
-- SELECT
--     jobid,
--     runid,
--     job_pid,
--     database,
--     username,
--     command,
--     status,
--     return_message,
--     start_time,
--     end_time
-- FROM cron.job_run_details
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'erp-daily-reminder')
-- ORDER BY start_time DESC
-- LIMIT 10;

-- 【清除測試資料】重置今日日誌（測試時使用）
-- DELETE FROM notification_logs
-- WHERE sent_at = (NOW() AT TIME ZONE 'Asia/Taipei')::DATE;
