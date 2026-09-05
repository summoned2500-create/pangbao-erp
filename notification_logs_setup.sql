-- =====================================================
-- 胖寶ERP：notification_logs 資料表
-- 在 Supabase SQL Editor 執行此腳本
-- =====================================================

CREATE TABLE IF NOT EXISTS notification_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sent_at timestamptz DEFAULT now(),
  type text NOT NULL DEFAULT 'daily_reminder',
  status text NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
  message text,
  error text,
  created_at timestamptz DEFAULT now()
);

-- 啟用 RLS（Row Level Security）
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- 只允許 service role 存取（anon / authenticated 無法讀寫）
CREATE POLICY "Service role only" ON notification_logs USING (false);

-- 索引：加速查詢今日記錄
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at
  ON notification_logs (sent_at DESC);

-- 確認建立成功
SELECT 'notification_logs 資料表建立完成 ✅' AS result;
