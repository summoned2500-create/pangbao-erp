# 胖寶ERP — 給 Claude 的專案說明

水餃店「胖寶餃子」的網頁記帳系統。React 18 + Vite + Tailwind，資料存 Supabase，
GitHub `summoned2500-create/pangbao-erp`，`main` 分支 push 後由 Vercel 自動部署。
使用者（Kuo）用繁體中文溝通，非全職工程師，請用白話解釋、改動前先說明。

## 目前狀態（2026-09-05）

- 主要資料表：`transactions`（成本與營收）、`notification_logs`（提醒紀錄）。
  README 裡的 cost_entries / revenue_entries 是早期設計，已不使用。
- 成本分類最近新增：雞肉類、電信費、關東煮料、薪資、房租、水費、電費、稅金。
- **每日 LINE 提醒已上線**：Supabase pg_cron 排程 `erp-daily-reminder`，
  每天 UTC 14:00（台灣 22:00）呼叫 `send_erp_reminder()`。
  當天若已有交易紀錄就不發；同一天不重複發。LINE Token / 群組 ID 存在 Supabase Vault。
  SQL 見 `supabase-pg-cron-reminder.sql`、`notification_logs_setup.sql`。
- `archive/netlify-reminder-unused/` 是同功能的 Netlify 版本，**已封存、請勿部署**，否則每晚雙重推播。
- `backups/` 是 transactions 的每日 JSON 備份。

## 慣例

- Commit 訊息用 `feat:` / `fix:` / `chore:` 前綴，內容可中文。
- 改完程式先 commit 到本機，是否 push 由使用者決定（push 會觸發 Vercel 部署）。
- 不要把 `.env.local` / `.env.production` 或任何金鑰寫進 git。
- 要停用提醒排程：`select cron.unschedule('erp-daily-reminder');`

## 待辦 / 想法

- （尚無；由使用者補充）
