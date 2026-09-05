# Netlify 排程提醒（未啟用，僅存檔）

這是每日 LINE 提醒的 Netlify Scheduled Function 版本。
正式上線的是 Supabase pg_cron 版本（見專案根目錄 `supabase-pg-cron-reminder.sql`，
排程名稱 `erp-daily-reminder`，每天台灣 22:00 執行）。

**請勿同時部署此版本**，否則每晚會收到兩則提醒。
若日後要改用 Netlify，先在 Supabase SQL Editor 執行：
`select cron.unschedule('erp-daily-reminder');`
