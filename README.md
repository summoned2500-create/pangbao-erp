# 🥟 胖寶 ERP — Phase 1 記帳系統

一個專為水餃小店「胖寶」設計的網頁版記帳系統。深色主題 + 手機優先，支援電腦/平板/手機。

---

## 🚀 快速開始

### 1. 建立 Supabase 專案

前往 [supabase.com](https://supabase.com) 建立新專案，然後在 **SQL Editor** 執行以下 SQL：

```sql
-- 成本記錄表
CREATE TABLE cost_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL,
  category text NOT NULL,
  amount numeric(10, 2) NOT NULL,
  note text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- 營收記錄表
CREATE TABLE revenue_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL,
  channel text NOT NULL,
  amount numeric(10, 2) NOT NULL,
  note text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- 建立索引（加速日期查詢）
CREATE INDEX idx_cost_entries_date ON cost_entries(date);
CREATE INDEX idx_revenue_entries_date ON revenue_entries(date);

-- 開啟 Row Level Security（RLS）
ALTER TABLE cost_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_entries ENABLE ROW LEVEL SECURITY;

-- 允許匿名讀寫（個人/小店使用）
CREATE POLICY "allow_all_cost" ON cost_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_revenue" ON revenue_entries FOR ALL USING (true) WITH CHECK (true);
```

> ⚠️ 上方 RLS policy 為開放所有人讀寫（適合個人使用）。若需要登入驗證，請修改 policy 加上 `auth.uid()` 條件。

### 2. 取得 Supabase 金鑰

在 Supabase 控制台 → **Settings → API** 找到：
- `Project URL`（即 `VITE_SUPABASE_URL`）
- `anon / public` key（即 `VITE_SUPABASE_ANON_KEY`）

### 3. 設定環境變數

複製 `.env.example` 為 `.env.local`：

```bash
cp .env.example .env.local
```

填入你的 Supabase 資訊：

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. 安裝與啟動

```bash
npm install
npm run dev
```

瀏覽器開啟 `http://localhost:5173`

---

## 📦 部署到 Vercel

### 方法一：GitHub 連結（推薦）

1. 將此專案 push 到 GitHub repo
2. 前往 [vercel.com](https://vercel.com)，點 **New Project**，選擇你的 repo
3. 在 **Environment Variables** 加入：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. 點 **Deploy** — 完成！

### 方法二：Vercel CLI

```bash
npm install -g vercel
vercel
# 依指示輸入環境變數
```

---

## 📱 功能說明

| 功能 | 說明 |
|------|------|
| 📅 月曆記帳 | 月曆檢視每日成本/營收/利潤，點日期進入當日詳情 |
| 💸 成本輸入 | 分類：餃子皮、豬肉、蔬菜、桶裝瓦斯、紙類雜項 |
| 💰 營收輸入 | 管道：現金、LINE Pay、全支付、台灣 Pay、iCHEF、Uber Eats |
| 📒 帳戶明細 | 篩選日期範圍，列表所有記錄，可刪除單筆 |
| 📊 圖表分析 | 日/週/月切換，長條圖/折線圖，成本 vs 營收 vs 利潤 |
| ➕ 快速新增 | 底部 + 按鈕，直接新增今日成本或營收 |

---

## 🗂️ 資料表結構

### `cost_entries`（成本記錄）

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | uuid | 主鍵（自動產生） |
| date | date | 記帳日期（YYYY-MM-DD）|
| category | text | 分類（餃子皮/豬肉/蔬菜/桶裝瓦斯/紙類雜項）|
| amount | numeric | 金額（支援小數）|
| note | text | 備註（可空白）|
| created_at | timestamptz | 建立時間（自動）|

### `revenue_entries`（營收記錄）

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | uuid | 主鍵（自動產生） |
| date | date | 記帳日期（YYYY-MM-DD）|
| channel | text | 收款管道（現金/LINE Pay/全支付/台灣 Pay/iCHEF/Uber Eats）|
| amount | numeric | 金額（支援小數）|
| note | text | 備註（可空白）|
| created_at | timestamptz | 建立時間（自動）|

---

## 🛠️ 技術架構

- **Frontend**: React 18 + Vite 5
- **樣式**: Tailwind CSS 3
- **資料庫**: Supabase（PostgreSQL）
- **圖表**: Recharts
- **路由**: React Router v6
- **日期**: date-fns v3
- **部署**: Vercel

---

## 📁 專案結構

```
胖寶ERP/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── .env.example          ← 複製為 .env.local 填入 Supabase 金鑰
├── README.md
└── src/
    ├── main.jsx
    ├── index.css
    ├── App.jsx            ← 路由 + 全域 QuickAdd
    ├── supabase.js        ← Supabase client
    ├── theme.js           ← 分類/管道定義 + 格式化工具
    ├── components/
    │   ├── Navbar.jsx         ← 底部導覽列
    │   ├── CalendarView.jsx   ← 月曆格子元件
    │   ├── DayDetailView.jsx  ← 單日詳情（全螢幕）
    │   ├── AccountView.jsx    ← 帳目列表元件
    │   ├── ChartView.jsx      ← Recharts 圖表元件
    │   ├── QuickAddModal.jsx  ← 快速新增 Modal
    │   ├── AddCostForm.jsx    ← 新增成本表單
    │   └── AddRevenueForm.jsx ← 新增營收表單
    └── pages/
        ├── CalendarPage.jsx   ← 記帳頁（月曆）
        ├── AccountPage.jsx    ← 帳戶頁（明細列表）
        └── ChartPage.jsx      ← 圖表頁
```

---

## 🔧 未來規劃（Phase 2+）

- [ ] 使用者登入（Supabase Auth）
- [ ] 員工薪資管理
- [ ] 庫存管理
- [ ] 匯出 Excel/PDF 報表
- [ ] 推播通知（每日記帳提醒）
- [ ] 多店管理

---

Made with ❤️ for 胖寶水餃
