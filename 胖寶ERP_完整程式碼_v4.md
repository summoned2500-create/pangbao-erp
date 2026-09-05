# 胖寶ERP 完整程式碼 v4（2026-09-06）

> React 18 + Vite + Tailwind CSS  
> Supabase: `https://kbfjtzbkhclsttemkars.supabase.co`  
> 部署：GitHub main → Vercel 自動部署  
> 網址：https://pangbao-erp.vercel.app

---

## 專案結構

```
胖寶ERP/
├── public/
│   └── logo.png                    ← 胖寶書法 logo
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── features/
│   │   ├── auth/
│   │   │   ├── auth.js
│   │   │   └── LoginPage.jsx
│   │   ├── calendar/
│   │   │   ├── CalendarPage.jsx
│   │   │   ├── CalendarView.jsx
│   │   │   └── DayDetailView.jsx
│   │   ├── account/
│   │   │   ├── AccountPage.jsx
│   │   │   └── AccountView.jsx
│   │   ├── chart/
│   │   │   ├── ChartPage.jsx
│   │   │   └── ChartView.jsx
│   │   ├── inventory/
│   │   │   └── InventoryPage.jsx
│   │   ├── staff/
│   │   │   └── StaffPage.jsx
│   │   ├── goal/
│   │   │   └── GoalPage.jsx
│   │   ├── cost/
│   │   │   └── CostPage.jsx        ← 成本分析（食材/配方/報表）
│   │   └── transaction/
│   │       ├── QuickAddModal.jsx
│   │       ├── QuickTextParser.jsx
│   │       ├── AddCostForm.jsx
│   │       └── AddRevenueForm.jsx
│   └── shared/
│       ├── components/
│       │   └── Navbar.jsx
│       ├── lib/
│       │   └── supabase.js         ← 唯一 Supabase client（必須從這裡 import）
│       └── theme.js
├── supabase-pg-cron-reminder.sql   ← 每日 LINE 提醒排程
├── notification_logs_setup.sql
└── cost-analysis-setup.sql         ← 5 張成本分析資料表
```

---

## Supabase 資料表

### 主要資料表
- **transactions**：所有成本與營收記錄（type: 'cost'|'revenue'）
- **notification_logs**：LINE 提醒發送紀錄（dedup 用）

### 成本分析資料表（cost-analysis-setup.sql）
- **ingredients**：食材（name, unit, price_per_unit, last_purchase_price, last_purchase_date）
- **products**：產品（name, unit_count, sale_price, is_frozen, is_active）
- **product_ingredients**：BOM 配方（product_id, ingredient_id, quantity_per_unit）
- **daily_production**：每日產量（date, total_units, default 700）
- **ingredient_purchases**：進貨記錄（ingredient_id, date, quantity, unit_price, total_amount）

### 每日 LINE 提醒
- pg_cron job：`erp-daily-reminder`，每天 UTC 14:00（台灣 22:00）
- 當天有交易紀錄就不發；同一天不重複發
- LINE_TOKEN / LINE_GROUP_ID 存在 Supabase Vault

---

## src/shared/lib/supabase.js

```js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kbfjtzbkhclsttemkars.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiZmp0emJraGNsc3R0ZW1rYXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNDI4MTEsImV4cCI6MjA5MDcxODgxMX0.arC20m9UILHOQJkgD7i93Zdt-sfzHyIOMnCDVtqSLKw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function fetchTransactionsByMonth(year, month) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`
  const { data, error } = await supabase
    .from('transactions').select('*')
    .gte('date', startDate).lt('date', endDate)
    .order('date', { ascending: true })
  if (error) { console.error('Error fetching transactions:', error); return [] }
  return data
}

export async function insertTransaction(record) {
  const { data, error } = await supabase.from('transactions').insert([record]).select()
  if (error) throw error
  return data[0]
}

export async function deleteTransaction(id) {
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) throw error
}
```

> ⚠️ 所有新頁面必須從這裡 import supabase，不能自己 createClient

---

## src/shared/theme.js

```js
export const COST_CATEGORIES = [
  { value: '餃子皮',   label: '餃子皮',   color: '#2a7a40', icon: '🥟' },
  { value: '豬肉',     label: '豬肉',     color: '#ef4444', icon: '🥩' },
  { value: '雞肉類',   label: '雞肉類',   color: '#f59e0b', icon: '🍗' },
  { value: '蔬菜',     label: '蔬菜',     color: '#6ee7b7', icon: '🥬' },
  { value: '桶裝瓦斯', label: '桶裝瓦斯', color: '#d97706', icon: '🔥' },
  { value: '紙類雜項', label: '紙類雜項', color: '#a5b4fc', icon: '📦' },
  { value: '關東煮料', label: '關東煮料', color: '#f97316', icon: '🍢' },
  { value: '薪資',     label: '薪資',     color: '#7c3aed', icon: '👷' },
  { value: '房租',     label: '房租',     color: '#0369a1', icon: '🏠' },
  { value: '水費',     label: '水費',     color: '#0891b2', icon: '💧' },
  { value: '電費',     label: '電費',     color: '#ca8a04', icon: '⚡' },
  { value: '稅金',     label: '稅金',     color: '#dc2626', icon: '🧾' },
  { value: '電信費',   label: '電信費',   color: '#6366f1', icon: '📡' },
]

export const ICHEF_CHANNELS = [
  { value: 'iCHEF 門市日結總額', label: '日結總額', color: '#16a34a', icon: '🍽️', hint: '選此項無需再記各支付細項' },
  { value: '門市現金',   label: '門市現金',   color: '#2a7a40', icon: '💵' },
  { value: 'LINE Pay',   label: 'LINE Pay',   color: '#15803d', icon: '💚' },
  { value: '全支付',     label: '全支付',     color: '#34d399', icon: '📱' },
  { value: '台灣 Pay',   label: '台灣 Pay',   color: '#6ee7b7', icon: '🇹🇼' },
  { value: '信用卡/其他', label: '信用卡/其他', color: '#a5b4fc', icon: '💳' },
]

export const DELIVERY_CHANNELS = [
  { value: 'Uber Eats 外送', label: 'Uber Eats', color: '#d97706', icon: '🛵', commission: 0.35 },
]

export const REVENUE_CHANNELS = [...ICHEF_CHANNELS, ...DELIVERY_CHANNELS]

export const formatCurrency = (amount) => {
  if (amount == null) return 'NT$0'
  return `NT$${Number(amount).toLocaleString('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export const getCostCategory = (value) =>
  COST_CATEGORIES.find((c) => c.value === value) || { label: value, color: '#2a7a40', icon: '💰' }

export const getRevenueChannel = (value) =>
  REVENUE_CHANNELS.find((c) => c.value === value) || { label: value, color: '#16a34a', icon: '💰' }
```

---

## src/features/auth/auth.js

```js
const PASSWORD = import.meta.env.VITE_APP_PASSWORD || 'pangbao2024'
const KEY = 'pb_authed'

export const login = (pwd) => {
  if (pwd === PASSWORD) { sessionStorage.setItem(KEY, '1'); return true }
  return false
}
export const isAuthed = () => sessionStorage.getItem(KEY) === '1'
export const logout = () => sessionStorage.removeItem(KEY)
```

---

## src/features/auth/LoginPage.jsx

```jsx
import React, { useState } from 'react'
import { login } from './auth.js'

export default function LoginPage({ onLogin }) {
  const [pwd, setPwd] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (login(pwd)) { onLogin() }
    else { setError(true); setPwd('') }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4f6e4' }}>
      <div className="w-full max-w-sm mx-4 rounded-2xl p-8 shadow-lg" style={{ background: '#ffffff', border: '1px solid #b5c265' }}>
        <div className="text-center mb-8">
          <img src="/logo.png" alt="胖寶餃子" className="mx-auto mb-3"
            style={{ width: '120px', height: '120px', objectFit: 'contain' }} />
          <h1 className="text-2xl font-bold" style={{ color: '#1e2e08' }}>胖寶 ERP</h1>
          <p className="text-sm mt-1" style={{ color: '#5a6b20' }}>請輸入密碼以繼續</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="password" value={pwd}
            onChange={(e) => { setPwd(e.target.value); setError(false) }}
            placeholder="密碼" autoFocus
            className="w-full px-4 py-3 rounded-xl outline-none text-sm"
            style={{ background: '#f4f6e4', border: error ? '1.5px solid #dc2626' : '1.5px solid #b5c265', color: '#1e2e08' }} />
          {error && <p className="text-xs text-center" style={{ color: '#dc2626' }}>密碼錯誤，請再試一次</p>}
          <button type="submit" className="w-full py-3 rounded-xl font-semibold text-sm"
            style={{ background: '#16a34a', color: '#ffffff' }}>登入</button>
        </form>
      </div>
    </div>
  )
}
```

---

## src/App.jsx

```jsx
import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { isAuthed } from './features/auth/auth.js'
import LoginPage from './features/auth/LoginPage.jsx'
import Navbar from './shared/components/Navbar.jsx'
import CalendarPage from './features/calendar/CalendarPage.jsx'
import AccountPage from './features/account/AccountPage.jsx'
import ChartPage from './features/chart/ChartPage.jsx'
import InventoryPage from './features/inventory/InventoryPage.jsx'
import StaffPage from './features/staff/StaffPage.jsx'
import GoalPage from './features/goal/GoalPage.jsx'
import CostPage from './features/cost/CostPage.jsx'
import QuickAddModal from './features/transaction/QuickAddModal.jsx'

export default function App() {
  const [authed, setAuthed] = useState(isAuthed())
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleAdded = () => { setRefreshKey((k) => k + 1); setQuickAddOpen(false) }

  if (!authed) return <LoginPage onLogin={() => setAuthed(true)} />

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col" style={{ background: '#f4f6e4' }}>
        <div className="flex-1 overflow-auto pb-20">
          <Routes>
            <Route path="/" element={<Navigate to="/calendar" replace />} />
            <Route path="/calendar" element={<CalendarPage refreshKey={refreshKey} />} />
            <Route path="/account" element={<AccountPage refreshKey={refreshKey} />} />
            <Route path="/chart" element={<ChartPage refreshKey={refreshKey} />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/staff" element={<StaffPage />} />
            <Route path="/goal" element={<GoalPage />} />
            <Route path="/cost" element={<CostPage />} />
          </Routes>
        </div>
        <Navbar onQuickAdd={() => setQuickAddOpen(true)} />
        {quickAddOpen && (
          <QuickAddModal onClose={() => setQuickAddOpen(false)} onAdded={handleAdded} />
        )}
      </div>
    </BrowserRouter>
  )
}
```

---

## src/shared/components/Navbar.jsx

```jsx
import React, { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'

const CalIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const ListIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
)
const TargetIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
)
const BoxIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
)
const CostIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 6v2m0 8v2M8.5 9a2.5 2.5 0 0 1 4.5 1.5c0 1.5-1 2-2.5 2.5S8 14.5 8 16a2.5 2.5 0 0 0 4.5 1.5"/>
  </svg>
)
const PeopleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

export default function Navbar({ onQuickAdd }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [fabOpen, setFabOpen] = useState(false)

  const navItems = [
    { to: '/calendar', label: '記帳', Icon: CalIcon },
    { to: '/account', label: '帳戶', Icon: ListIcon },
    { to: '/goal',    label: '目標', Icon: TargetIcon },
    { to: '/inventory', label: '庫存', Icon: BoxIcon },
    { to: '/cost',    label: '成本', Icon: CostIcon },
  ]

  const handleQuickAdd = () => { setFabOpen(false); onQuickAdd() }
  const handleStaff = () => { setFabOpen(false); navigate('/staff') }

  return (
    <>
      {fabOpen && <div className="fixed inset-0 z-40" onClick={() => setFabOpen(false)} />}

      {fabOpen && (
        <div className="fixed z-50 flex flex-col gap-2 items-center"
          style={{ bottom: '80px', left: '50%', transform: 'translateX(-50%)' }}>
          <button onClick={handleStaff}
            className="flex items-center gap-2 px-4 py-2 rounded-full shadow-lg text-sm font-semibold active:scale-95 transition-all"
            style={{ background: '#e6eac8', border: '1px solid #b5c265', color: '#2a7a40' }}>
            <PeopleIcon />員工管理
          </button>
          <button onClick={handleQuickAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-full shadow-lg text-sm font-semibold active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff' }}>
            ＋ 新增記帳
          </button>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 pb-safe"
        style={{ background: '#e6eac8', borderTop: '1px solid #b5c265', height: '64px' }}>
        {navItems.map(({ to, label, Icon }) => {
          const active = location.pathname.startsWith(to)
          return (
            <NavLink key={to} to={to}
              className="flex flex-col items-center justify-center flex-1 py-1 gap-0.5 rounded-xl transition-colors"
              style={{ color: active ? '#16a34a' : '#5a6b20' }}>
              <Icon />
              <span className="text-xs font-medium">{label}</span>
            </NavLink>
          )
        })}

        <button onClick={() => setFabOpen(!fabOpen)}
          className="flex flex-col items-center justify-center flex-1 py-1 gap-0.5 rounded-xl transition-all active:scale-95">
          <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
            style={{
              background: fabOpen ? 'linear-gradient(135deg,#dc2626,#b91c1c)' : 'linear-gradient(135deg,#16a34a,#15803d)',
              marginTop: '-20px',
              boxShadow: '0 4px 16px rgba(74,222,128,0.4)',
              transition: 'background 0.2s',
            }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-6 h-6"
              style={{ transform: fabOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
          <span className="text-xs font-medium" style={{ color: '#5a6b20' }}>{fabOpen ? '關閉' : '新增'}</span>
        </button>
      </nav>
    </>
  )
}
```

---

## src/features/cost/CostPage.jsx

（完整內容見下，約 380 行）

```jsx
import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../shared/lib/supabase.js'
import { COST_CATEGORIES, formatCurrency } from '../../shared/theme.js'

const marginColor = (pct) => {
  if (pct >= 40) return '#16a34a'
  if (pct >= 20) return '#ca8a04'
  return '#dc2626'
}

const inputCls = 'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400'
const inputStyle = { background: '#f4f6e4', borderColor: '#b5c265' }
const btnPrimary = {
  background: 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff',
  borderRadius: '0.5rem', padding: '0.4rem 1rem', fontSize: '0.875rem',
  fontWeight: 600, cursor: 'pointer', border: 'none',
}
const btnDanger = { ...btnPrimary, background: 'linear-gradient(135deg,#dc2626,#b91c1c)' }
const btnSecondary = { ...btnPrimary, background: 'none', border: '1px solid #b5c265', color: '#2a7a40' }

const Card = ({ children, style }) => (
  <div style={{ background: '#e6eac8', border: '1px solid #b5c265', borderRadius: '0.75rem', padding: '1rem', ...style }}>
    {children}
  </div>
)

// ── Tab 1：食材管理 ────────────────────────────────────────────
function IngredientsTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState(null)
  const [purchaseId, setPurchaseId] = useState(null)
  const [form, setForm] = useState({ name: '', unit: 'g', price_per_unit: '' })
  const [editPrice, setEditPrice] = useState('')
  const [purchaseForm, setPurchaseForm] = useState({ date: new Date().toISOString().slice(0, 10), quantity: '', unit_price: '' })
  const [saving, setSaving] = useState(false)
  const UNITS = ['g', 'kg', '顆', '張', '包', 'ml', 'L']

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('ingredients').select('*').order('name')
    setItems(data || [])
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    await supabase.from('ingredients').insert({ name: form.name.trim(), unit: form.unit, price_per_unit: parseFloat(form.price_per_unit) || 0 })
    setForm({ name: '', unit: 'g', price_per_unit: '' }); setShowAdd(false); setSaving(false); load()
  }

  const handleEditPrice = async (id) => {
    setSaving(true)
    await supabase.from('ingredients').update({ price_per_unit: parseFloat(editPrice) || 0 }).eq('id', id)
    setEditId(null); setSaving(false); load()
  }

  const handlePurchase = async (e) => {
    e.preventDefault(); setSaving(true)
    await supabase.from('ingredient_purchases').insert({
      ingredient_id: purchaseId, date: purchaseForm.date,
      quantity: parseFloat(purchaseForm.quantity), unit_price: parseFloat(purchaseForm.unit_price),
    })
    setPurchaseId(null); setPurchaseForm({ date: new Date().toISOString().slice(0, 10), quantity: '', unit_price: '' })
    setSaving(false); load()
  }

  const handleDelete = async (id) => {
    if (!window.confirm('確定刪除此食材？相關配方也會一併移除。')) return
    await supabase.from('ingredients').delete().eq('id', id); load()
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="font-semibold text-green-800">共 {items.length} 種食材</span>
        <button style={btnPrimary} onClick={() => setShowAdd(!showAdd)}>{showAdd ? '取消' : '＋ 新增食材'}</button>
      </div>
      {showAdd && (
        <Card>
          <form onSubmit={handleAdd} className="space-y-2">
            <div className="text-sm font-semibold text-green-800 mb-2">新增食材</div>
            <input className={inputCls} style={inputStyle} placeholder="食材名稱" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <div className="flex gap-2">
              <select className={inputCls} style={inputStyle} value={form.unit}
                onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
              <input className={inputCls} style={inputStyle} type="number" step="0.0001" min="0"
                placeholder="初始單價(元)" value={form.price_per_unit}
                onChange={e => setForm(f => ({ ...f, price_per_unit: e.target.value }))} />
            </div>
            <button type="submit" style={btnPrimary} disabled={saving}>{saving ? '儲存中…' : '確認新增'}</button>
          </form>
        </Card>
      )}
      {loading ? <div className="text-center text-sm text-green-700 py-8">載入中…</div>
        : items.length === 0 ? <div className="text-center text-sm text-green-700 py-8">尚無食材，請新增</div>
        : items.map(item => (
          <Card key={item.id}>
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold text-green-900">{item.name}</div>
                <div className="text-xs text-green-700 mt-0.5">
                  單位：{item.unit}　最新進貨：{item.last_purchase_date || '尚無記錄'}
                </div>
              </div>
              <div className="text-right">
                {editId === item.id ? (
                  <div className="flex gap-1 items-center">
                    <input type="number" step="0.0001" min="0" value={editPrice}
                      onChange={e => setEditPrice(e.target.value)}
                      style={{ ...inputStyle, width: '90px', border: '1px solid #b5c265', borderRadius: '0.4rem', padding: '0.25rem 0.5rem', fontSize: '0.875rem', background: '#f4f6e4' }} />
                    <button style={btnPrimary} onClick={() => handleEditPrice(item.id)} disabled={saving}>✓</button>
                    <button style={btnSecondary} onClick={() => setEditId(null)}>✕</button>
                  </div>
                ) : (
                  <div className="font-bold text-green-800 cursor-pointer"
                    onClick={() => { setEditId(item.id); setEditPrice(item.price_per_unit) }}>
                    NT${Number(item.price_per_unit).toFixed(4)}/{item.unit}
                    <span className="text-xs text-green-600 ml-1">✏️</span>
                  </div>
                )}
              </div>
            </div>
            {purchaseId === item.id ? (
              <form onSubmit={handlePurchase} className="mt-3 pt-3 border-t border-green-200 space-y-2">
                <div className="text-xs font-semibold text-green-800">記錄進貨</div>
                <input type="date" value={purchaseForm.date} className={inputCls} style={inputStyle}
                  onChange={e => setPurchaseForm(f => ({ ...f, date: e.target.value }))} />
                <div className="flex gap-2">
                  <input type="number" step="0.001" min="0" placeholder={`數量(${item.unit})`}
                    value={purchaseForm.quantity} className={inputCls} style={inputStyle}
                    onChange={e => setPurchaseForm(f => ({ ...f, quantity: e.target.value }))} required />
                  <input type="number" step="0.0001" min="0" placeholder="進貨單價"
                    value={purchaseForm.unit_price} className={inputCls} style={inputStyle}
                    onChange={e => setPurchaseForm(f => ({ ...f, unit_price: e.target.value }))} required />
                </div>
                <div className="flex gap-2">
                  <button type="submit" style={btnPrimary} disabled={saving}>{saving ? '儲存…' : '確認進貨'}</button>
                  <button type="button" style={btnSecondary} onClick={() => setPurchaseId(null)}>取消</button>
                </div>
              </form>
            ) : (
              <div className="flex gap-2 mt-2">
                <button style={{ ...btnSecondary, fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                  onClick={() => setPurchaseId(item.id)}>📥 記錄進貨</button>
                <button style={{ ...btnDanger, fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                  onClick={() => handleDelete(item.id)}>🗑</button>
              </div>
            )}
          </Card>
        ))}
    </div>
  )
}

// ── Tab 2：產品配方 ────────────────────────────────────────────
function ProductsTab({ dailyUnits, setDailyUnits }) {
  const [products, setProducts] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [bomRows, setBomRows] = useState([])
  const [form, setForm] = useState({ name: '', unit_count: 20, sale_price: '', is_frozen: true })
  const [bomForm, setBomForm] = useState({ ingredient_id: '', quantity_per_unit: '' })
  const [saving, setSaving] = useState(false)
  const [labourPerUnit, setLabourPerUnit] = useState(() => {
    const v = localStorage.getItem('pangbao_labour_per_unit')
    return v ? parseFloat(v) : 2.5
  })

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: prods }, { data: ingrs }] = await Promise.all([
      supabase.from('products').select('*').order('name'),
      supabase.from('ingredients').select('*').order('name'),
    ])
    setProducts(prods || []); setIngredients(ingrs || []); setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const openProduct = async (product) => {
    if (selectedProduct?.id === product.id) { setSelectedProduct(null); return }
    const { data } = await supabase.from('product_ingredients')
      .select('*, ingredients(name, unit, price_per_unit)').eq('product_id', product.id)
    setBomRows(data || []); setSelectedProduct(product)
  }

  const handleAddProduct = async (e) => {
    e.preventDefault(); setSaving(true)
    await supabase.from('products').insert({
      name: form.name.trim(), unit_count: parseInt(form.unit_count),
      sale_price: parseFloat(form.sale_price) || 0, is_frozen: form.is_frozen,
    })
    setForm({ name: '', unit_count: 20, sale_price: '', is_frozen: true })
    setShowAdd(false); setSaving(false); load()
  }

  const handleAddBom = async (e) => {
    e.preventDefault()
    if (!bomForm.ingredient_id) return
    setSaving(true)
    await supabase.from('product_ingredients').upsert({
      product_id: selectedProduct.id, ingredient_id: bomForm.ingredient_id,
      quantity_per_unit: parseFloat(bomForm.quantity_per_unit),
    }, { onConflict: 'product_id,ingredient_id' })
    setBomForm({ ingredient_id: '', quantity_per_unit: '' }); setSaving(false)
    const { data } = await supabase.from('product_ingredients')
      .select('*, ingredients(name, unit, price_per_unit)').eq('product_id', selectedProduct.id)
    setBomRows(data || [])
  }

  const handleDeleteBom = async (id) => {
    await supabase.from('product_ingredients').delete().eq('id', id)
    setBomRows(rows => rows.filter(r => r.id !== id))
  }

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('確定刪除此產品？')) return
    await supabase.from('products').delete().eq('id', id)
    if (selectedProduct?.id === id) setSelectedProduct(null); load()
  }

  const calcCost = (bom) => bom.reduce((sum, r) => sum + (r.ingredients?.price_per_unit || 0) * r.quantity_per_unit, 0)

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center flex-wrap">
        <div style={{ background: '#e6eac8', border: '1px solid #b5c265', borderRadius: '0.5rem', padding: '0.3rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
          <span className="text-green-800">每日產量</span>
          <input type="number" min="1" value={dailyUnits}
            onChange={e => { const v = parseInt(e.target.value) || 700; setDailyUnits(v); localStorage.setItem('pangbao_daily_units', v) }}
            style={{ width: '64px', border: '1px solid #b5c265', borderRadius: '0.35rem', padding: '0.15rem 0.4rem', background: '#f4f6e4', fontSize: '0.8rem' }} />
          <span className="text-green-700">顆</span>
        </div>
        <div style={{ background: '#e6eac8', border: '1px solid #b5c265', borderRadius: '0.5rem', padding: '0.3rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
          <span className="text-green-800">人工/顆</span>
          <input type="number" min="0" step="0.01" value={labourPerUnit}
            onChange={e => { const v = parseFloat(e.target.value) || 0; setLabourPerUnit(v); localStorage.setItem('pangbao_labour_per_unit', v) }}
            style={{ width: '64px', border: '1px solid #b5c265', borderRadius: '0.35rem', padding: '0.15rem 0.4rem', background: '#f4f6e4', fontSize: '0.8rem' }} />
          <span className="text-green-700">元</span>
        </div>
        <button style={btnPrimary} onClick={() => setShowAdd(!showAdd)}>{showAdd ? '取消' : '＋ 新增產品'}</button>
      </div>

      {showAdd && (
        <Card>
          <form onSubmit={handleAddProduct} className="space-y-2">
            <div className="text-sm font-semibold text-green-800 mb-2">新增產品</div>
            <input className={inputCls} style={inputStyle} placeholder="產品名稱（如：高麗菜水餃）"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <div className="flex gap-2">
              <input type="number" min="1" className={inputCls} style={inputStyle} placeholder="每包顆數"
                value={form.unit_count} onChange={e => setForm(f => ({ ...f, unit_count: e.target.value }))} />
              <input type="number" min="0" step="0.01" className={inputCls} style={inputStyle} placeholder="售價(元)"
                value={form.sale_price} onChange={e => setForm(f => ({ ...f, sale_price: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 text-sm text-green-800">
              <input type="checkbox" checked={form.is_frozen}
                onChange={e => setForm(f => ({ ...f, is_frozen: e.target.checked }))} />
              冷凍產品（反之為熟食）
            </label>
            <button type="submit" style={btnPrimary} disabled={saving}>{saving ? '儲存…' : '確認新增'}</button>
          </form>
        </Card>
      )}

      {loading ? <div className="text-center text-sm text-green-700 py-8">載入中…</div>
        : products.length === 0 ? <div className="text-center text-sm text-green-700 py-8">尚無產品，請新增</div>
        : products.map(product => {
          const isOpen = selectedProduct?.id === product.id
          const ingCost = isOpen ? calcCost(bomRows) : 0
          const totalCostPerUnit = ingCost + labourPerUnit
          const salePerUnit = product.sale_price / product.unit_count
          const marginPct = salePerUnit > 0 ? ((salePerUnit - totalCostPerUnit) / salePerUnit * 100) : 0
          const col = isOpen ? marginColor(marginPct) : '#2a7a40'
          return (
            <Card key={product.id} style={{ border: `1px solid ${isOpen ? col : '#b5c265'}` }}>
              <div className="flex justify-between items-start cursor-pointer" onClick={() => openProduct(product)}>
                <div>
                  <div className="font-semibold text-green-900">{product.name}</div>
                  <div className="text-xs text-green-700 mt-0.5">
                    {product.is_frozen ? '❄️ 冷凍' : '🍲 熟食'}　{product.unit_count} 顆/包　售價 {formatCurrency(product.sale_price)}
                  </div>
                </div>
                <span className="text-green-600 text-sm mt-1">{isOpen ? '▲' : '▼'}</span>
              </div>
              {isOpen && (
                <div className="mt-3 pt-3 border-t border-green-200 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { label: '食材成本/顆', val: `NT$${ingCost.toFixed(3)}` },
                      { label: '人工成本/顆', val: `NT$${labourPerUnit.toFixed(2)}` },
                      { label: '總成本/包',   val: formatCurrency(totalCostPerUnit * product.unit_count) },
                      { label: '毛利率',      val: `${marginPct.toFixed(1)}%`, color: col },
                    ].map(({ label, val, color }) => (
                      <div key={label} style={{ background: '#f4f6e4', borderRadius: '0.4rem', padding: '0.5rem' }}>
                        <div className="text-green-700">{label}</div>
                        <div className="font-bold" style={{ color: color || '#14532d' }}>{val}</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs" style={{ color: col }}>
                    毛利額/包：{formatCurrency(product.sale_price - totalCostPerUnit * product.unit_count)}
                  </div>
                  <div className="text-xs font-semibold text-green-800">配方明細</div>
                  {bomRows.length === 0
                    ? <div className="text-xs text-green-600">尚未設定配方</div>
                    : bomRows.map(r => (
                      <div key={r.id} className="flex justify-between items-center text-xs py-1 border-b border-green-100">
                        <span>{r.ingredients?.name}（{r.quantity_per_unit} {r.ingredients?.unit}/顆）</span>
                        <div className="flex items-center gap-2">
                          <span className="text-green-700">NT${(r.ingredients?.price_per_unit * r.quantity_per_unit).toFixed(4)}</span>
                          <button onClick={() => handleDeleteBom(r.id)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
                        </div>
                      </div>
                    ))}
                  <form onSubmit={handleAddBom} className="flex gap-1 flex-wrap">
                    <select value={bomForm.ingredient_id} className={inputCls}
                      style={{ ...inputStyle, flex: '1', minWidth: '120px', fontSize: '0.75rem' }}
                      onChange={e => setBomForm(f => ({ ...f, ingredient_id: e.target.value }))}>
                      <option value="">選擇食材</option>
                      {ingredients.map(i => <option key={i.id} value={i.id}>{i.name}（{i.unit}）</option>)}
                    </select>
                    <input type="number" step="0.0001" min="0" placeholder="每顆用量"
                      value={bomForm.quantity_per_unit}
                      onChange={e => setBomForm(f => ({ ...f, quantity_per_unit: e.target.value }))}
                      style={{ width: '80px', ...inputStyle, border: '1px solid #b5c265', borderRadius: '0.4rem', padding: '0.25rem 0.4rem', fontSize: '0.75rem', background: '#f4f6e4' }} />
                    <button type="submit" style={{ ...btnPrimary, fontSize: '0.75rem', padding: '0.25rem 0.6rem' }} disabled={saving}>加入</button>
                  </form>
                  <button onClick={() => handleDeleteProduct(product.id)}
                    style={{ ...btnDanger, fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>🗑 刪除產品</button>
                </div>
              )}
            </Card>
          )
        })}
    </div>
  )
}

// ── Tab 3：成本報表 ────────────────────────────────────────────
const FOOD_CATEGORIES = ['餃子皮', '豬肉', '雞肉類', '蔬菜', '關東煮料']
const OVERHEAD_CATEGORIES = ['薪資', '房租', '水費', '電費', '稅金', '電信費', '桶裝瓦斯', '紙類雜項']

function ReportTab({ dailyUnits }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const from = `${year}-${String(month).padStart(2, '0')}-01`
    const toDate = new Date(year, month, 0)
    const to = `${year}-${String(month).padStart(2, '0')}-${String(toDate.getDate()).padStart(2, '0')}`
    const { data: txns } = await supabase.from('transactions').select('type,category,amount').gte('date', from).lte('date', to)
    setData(txns || []); setLoading(false)
  }, [year, month])
  useEffect(() => { load() }, [load])

  const revenue = data ? data.filter(t => t.type === 'revenue').reduce((s, t) => s + Number(t.amount), 0) : 0
  const costs = data ? data.filter(t => t.type === 'cost') : []
  const sumBy = (cats) => costs.filter(t => cats.includes(t.category)).reduce((s, t) => s + Number(t.amount), 0)
  const foodCost = sumBy(FOOD_CATEGORIES)
  const salaryAndOverhead = sumBy(OVERHEAD_CATEGORIES)
  const otherCost = costs.filter(t => ![...FOOD_CATEGORIES, ...OVERHEAD_CATEGORIES].includes(t.category)).reduce((s, t) => s + Number(t.amount), 0)
  const totalCost = foodCost + salaryAndOverhead + otherCost
  const grossProfit = revenue - foodCost
  const netProfit = revenue - totalCost
  const grossPct = revenue > 0 ? (grossProfit / revenue * 100) : 0
  const netPct = revenue > 0 ? (netProfit / revenue * 100) : 0
  const costBreakdown = COST_CATEGORIES.map(c => ({
    label: c.label, icon: c.icon, color: c.color,
    amount: costs.filter(t => t.category === c.value).reduce((s, t) => s + Number(t.amount), 0),
  })).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount)

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <select value={year} onChange={e => setYear(+e.target.value)} className={inputCls} style={{ ...inputStyle, width: '90px' }}>
          {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => <option key={y}>{y}</option>)}
        </select>
        <select value={month} onChange={e => setMonth(+e.target.value)} className={inputCls} style={{ ...inputStyle, width: '70px' }}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m} 月</option>)}
        </select>
        <span className="text-xs text-green-700">的成本報表</span>
      </div>
      {loading ? <div className="text-center text-sm text-green-700 py-8">載入中…</div>
        : data && (
          <>
            <Card>
              <div className="text-sm font-semibold text-green-800 mb-3">{year} 年 {month} 月 損益摘要</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-green-700">總營收</span><span className="font-bold text-green-900">{formatCurrency(revenue)}</span></div>
                <div className="flex justify-between"><span className="text-green-700">食材成本</span><span className="font-bold text-red-600">- {formatCurrency(foodCost)}</span></div>
                <div className="flex justify-between border-t border-green-200 pt-1">
                  <span className="font-semibold text-green-800">毛利</span>
                  <span className="font-bold" style={{ color: marginColor(grossPct) }}>{formatCurrency(grossProfit)}（{grossPct.toFixed(1)}%）</span>
                </div>
                <div className="flex justify-between"><span className="text-green-700">薪資＋管銷</span><span className="text-orange-700">- {formatCurrency(salaryAndOverhead)}</span></div>
                <div className="flex justify-between"><span className="text-green-700">其他成本</span><span className="text-orange-700">- {formatCurrency(otherCost)}</span></div>
                <div className="flex justify-between border-t border-green-200 pt-1">
                  <span className="font-semibold text-green-800">淨利</span>
                  <span className="font-bold" style={{ color: marginColor(netPct) }}>{formatCurrency(netProfit)}（{netPct.toFixed(1)}%）</span>
                </div>
              </div>
            </Card>
            {costBreakdown.length > 0 && (
              <Card>
                <div className="text-sm font-semibold text-green-800 mb-3">成本結構</div>
                <div className="space-y-2">
                  {costBreakdown.map(c => {
                    const pct = totalCost > 0 ? (c.amount / totalCost * 100) : 0
                    return (
                      <div key={c.label}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span>{c.icon} {c.label}</span>
                          <span className="text-green-700">{formatCurrency(c.amount)} ({pct.toFixed(1)}%)</span>
                        </div>
                        <div style={{ background: '#d4d9a8', borderRadius: '99px', height: '8px' }}>
                          <div style={{ background: c.color, width: `${pct}%`, height: '8px', borderRadius: '99px', transition: 'width 0.4s' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="text-right text-xs text-green-700 mt-2">總成本：{formatCurrency(totalCost)}</div>
              </Card>
            )}
            {revenue === 0 && totalCost === 0 && <div className="text-center text-sm text-green-600 py-4">此月份尚無記帳資料</div>}
          </>
        )}
    </div>
  )
}

// ── 主頁面 ────────────────────────────────────────────────────
const TABS = [
  { key: 'ingredients', label: '📦 食材管理' },
  { key: 'products',    label: '🥟 產品配方' },
  { key: 'report',      label: '📊 成本報表' },
]

export default function CostPage() {
  const [tab, setTab] = useState('ingredients')
  const [dailyUnits, setDailyUnits] = useState(() => {
    const v = localStorage.getItem('pangbao_daily_units')
    return v ? parseInt(v) : 700
  })
  return (
    <div className="min-h-screen pb-24" style={{ background: '#f4f6e4' }}>
      <div style={{ background: '#e6eac8', borderBottom: '1px solid #b5c265', padding: '1rem 1rem 0' }}>
        <h1 className="text-xl font-bold text-green-900 mb-3">成本分析</h1>
        <div className="flex gap-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                padding: '0.4rem 0.75rem', fontSize: '0.8rem',
                fontWeight: tab === t.key ? 700 : 500,
                borderRadius: '0.5rem 0.5rem 0 0',
                border: '1px solid #b5c265',
                borderBottom: tab === t.key ? '1px solid #e6eac8' : '1px solid #b5c265',
                background: tab === t.key ? '#f4f6e4' : 'transparent',
                color: tab === t.key ? '#16a34a' : '#5a6b20',
                cursor: 'pointer',
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-3">
        {tab === 'ingredients' && <IngredientsTab />}
        {tab === 'products' && <ProductsTab dailyUnits={dailyUnits} setDailyUnits={setDailyUnits} />}
        {tab === 'report' && <ReportTab dailyUnits={dailyUnits} />}
      </div>
    </div>
  )
}
```

---

## 重要規則

1. **新頁面一律從 `../../shared/lib/supabase.js` import supabase**，不能自己 createClient
2. **Push 到 main 分支才會部署**，先 commit 到本機，由使用者決定是否 push
3. **不要更動** `supabase.js` 裡的 hardcoded URL 和 anon key（fallback 用）
4. **不要部署** `archive/netlify-reminder-unused/`，否則每晚雙重推播
5. **停用提醒排程**：`select cron.unschedule('erp-daily-reminder');`
