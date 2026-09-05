/**
 * 胖寶ERP 每日LINE Bot推播提醒
 * Netlify Scheduled Function
 *
 * cron: "0 14 * * *"  → UTC 14:00 = 台灣 22:00
 *
 * 環境變數（在 Netlify Dashboard → Site Settings → Environment Variables 設定）：
 *   LINE_CHANNEL_ACCESS_TOKEN  - LINE Bot Channel Access Token
 *   LINE_GROUP_ID              - 推播目標群組 ID
 *   SUPABASE_URL               - https://kbfjtzbkhclsttemkars.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY  - Supabase service role key（非 anon key）
 */

const LINE_API = 'https://api.line.me/v2/bot/message/push';

// 取得台灣今日日期字串 YYYY-MM-DD
function getTaiwanToday() {
  const now = new Date();
  // 台灣 UTC+8
  const twTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return twTime.toISOString().split('T')[0];
}

// 取得台灣今日日期顯示格式
function getTaiwanTodayDisplay() {
  const now = new Date();
  const twTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const y = twTime.getUTCFullYear();
  const m = String(twTime.getUTCMonth() + 1).padStart(2, '0');
  const d = String(twTime.getUTCDate()).padStart(2, '0');
  return `${y}年${m}月${d}日`;
}

// 查詢 Supabase（用 REST API，不依賴 supabase-js 套件）
async function supabaseQuery(url, serviceRoleKey, table, params) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${url}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`Supabase query failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// 寫入 notification_logs
async function logNotification(supabaseUrl, serviceRoleKey, payload) {
  const res = await fetch(`${supabaseUrl}/rest/v1/notification_logs`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    console.error('Failed to write notification_logs:', await res.text());
  }
}

// 推播 LINE 訊息
async function sendLineMessage(token, groupId, text) {
  const res = await fetch(LINE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: groupId,
      messages: [{ type: 'text', text }],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LINE API error: ${res.status} ${err}`);
  }
}

export async function handler(event) {
  const {
    LINE_CHANNEL_ACCESS_TOKEN,
    LINE_GROUP_ID,
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
  } = process.env;

  // 環境變數檢查
  if (!LINE_CHANNEL_ACCESS_TOKEN || !LINE_GROUP_ID || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('缺少必要環境變數');
    return { statusCode: 500, body: 'Missing environment variables' };
  }

  const today = getTaiwanToday();
  const todayDisplay = getTaiwanTodayDisplay();

  try {
    // ── 第一階段：確認今天尚未發過通知 ──────────────────────
    const existingLogs = await supabaseQuery(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      'notification_logs',
      {
        select: 'id',
        sent_at: `gte.${today}T00:00:00+08:00`,
        status: 'eq.success',
        type: 'eq.daily_reminder',
        limit: 1,
      }
    );

    if (existingLogs.length > 0) {
      console.log(`今日（${today}）已發送過通知，跳過。`);
      await logNotification(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        type: 'daily_reminder',
        status: 'skipped',
        message: `今日已發送過，跳過（${today}）`,
      });
      return { statusCode: 200, body: 'Already sent today, skipped.' };
    }

    // ── 第二階段（智慧判斷）：查詢今日 transactions ──────────
    const transactions = await supabaseQuery(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      'transactions',
      {
        select: 'id',
        date: `gte.${today}`,
        limit: 1,
      }
    );

    if (transactions.length > 0) {
      console.log(`今日（${today}）已有交易記錄，不發通知。`);
      await logNotification(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        type: 'daily_reminder',
        status: 'skipped',
        message: `今日已有 ${transactions.length} 筆交易記錄，略過通知（${today}）`,
      });
      return { statusCode: 200, body: 'Records found today, notification skipped.' };
    }

    // ── 發送 LINE 推播 ────────────────────────────────────────
    const message = [
      '🔔 胖寶ERP提醒',
      '',
      '今天還沒有更新記錄喔！',
      '請記得填入今日的：',
      '• 💸 成本支出',
      '• 💰 營收金額',
      '',
      `📅 ${todayDisplay}`,
    ].join('\n');

    await sendLineMessage(LINE_CHANNEL_ACCESS_TOKEN, LINE_GROUP_ID, message);

    console.log(`LINE 推播成功（${today}）`);

    await logNotification(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      type: 'daily_reminder',
      status: 'success',
      message: `推播成功（${today}）`,
    });

    return { statusCode: 200, body: 'Notification sent.' };

  } catch (err) {
    console.error('推播失敗：', err.message);

    // 盡力記錄錯誤
    try {
      await logNotification(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        type: 'daily_reminder',
        status: 'failed',
        error: err.message,
      });
    } catch (_) {
      // 記錄失敗不影響回傳
    }

    return { statusCode: 500, body: `Error: ${err.message}` };
  }
}
