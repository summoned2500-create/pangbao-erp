# 胖寶 ERP — 完整程式碼

## 專案結構
```
src/
  main.jsx
  App.jsx
  index.css
  supabase.js
  theme.js
  pages/
    CalendarPage.jsx
    AccountPage.jsx
    ChartPage.jsx
  components/
    Navbar.jsx
    CalendarView.jsx
    DayDetailView.jsx
    QuickAddModal.jsx
    AddCostForm.jsx
    AddRevenueForm.jsx
    QuickTextParser.jsx
    AccountView.jsx
    ChartView.jsx
```

---

## package.json
```json
{
  "name": "pangbao-erp",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.64.0",
    "date-fns": "^3.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "recharts": "^2.10.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33",
    "tailwindcss": "^3.4.1",
    "vite": "^5.0.11"
  }
}
```

---

## Supabase SQL（建表）
```sql
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL CHECK (type IN ('cost', 'revenue')),
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all access" ON transactions FOR ALL USING (true) WITH CHECK (true);
```

---

## src/main.jsx
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('App error:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ background: '#0a1a0f', color: '#e2f5e8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24 }}>
          <div style={{ fontSize: 48 }}>🥟</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#4ade80' }}>胖寶 ERP 載入失敗</div>
          <div style={{ fontSize: 13, color: '#4b7a56', maxWidth: 300, textAlign: 'center' }}>
            {this.state.error?.message || '發生錯誤，請重新整理頁面'}
          </div>
          <button onClick={() => window.location.reload()} style={{ marginTop: 8, padding: '8px 24px', background: '#2d4a32', color: '#4ade80', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
            重新整理
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
```

---

## src/App.jsx
```jsx
import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import CalendarPage from './pages/CalendarPage.jsx'
import AccountPage from './pages/AccountPage.jsx'
import ChartPage from './pages/ChartPage.jsx'
import QuickAddModal from './components/QuickAddModal.jsx'

export default function App() {
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleAdded = () => {
    setRefreshKey((k) => k + 1)
    setQuickAddOpen(false)
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col" style={{ background: '#0a1a0f' }}>
        <div className="flex-1 overflow-auto pb-20">
          <Routes>
            <Route path="/" element={<Navigate to="/calendar" replace />} />
            <Route path="/calendar" element={<CalendarPage refreshKey={refreshKey} />} />
            <Route path="/account" element={<AccountPage refreshKey={refreshKey} />} />
            <Route path="/chart" element={<ChartPage refreshKey={refreshKey} />} />
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

## src/index.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  -webkit-tap-highlight-color: transparent;
}

body {
  background-color: #0a1a0f;
  color: #e2f5e8;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang TC', 'Microsoft JhengHei', sans-serif;
  overscroll-behavior: none;
}

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: #122018; }
::-webkit-scrollbar-thumb { background: #2d4a32; border-radius: 2px; }

input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button { opacity: 1; }
```

---

## src/supabase.js
```js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('缺少 Supabase 環境變數，請設定 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

export async function fetchTransactionsByMonth(year, month) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .gte('date', startDate)
    .lt('date', endDate)
    .order('date', { ascending: true })

  if (error) { console.error('Error fetching transactions:', error); return [] }
  return data
}

export async function insertTransaction(record) {
  const { data, error } = await supabase
    .from('transactions')
    .insert([record])
    .select()
  if (error) throw error
  return data[0]
}

export async function deleteTransaction(id) {
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) throw error
}
```

---

## src/theme.js
```js
export const COST_CATEGORIES = [
  { value: '餃子皮', label: '餃子皮', color: '#86efac', icon: '🥟' },
  { value: '豬肉', label: '豬肉', color: '#fca5a5', icon: '🥩' },
  { value: '蔬菜', label: '蔬菜', color: '#6ee7b7', icon: '🥬' },
  { value: '桶裝瓦斯', label: '桶裝瓦斯', color: '#fbbf24', icon: '🔥' },
  { value: '紙類雜項', label: '紙類雜項', color: '#a5b4fc', icon: '📦' },
]

export const ICHEF_CHANNELS = [
  { value: 'iCHEF 門市日結總額', label: '日結總額', color: '#4ade80', icon: '🍽️', hint: '選此項無需再記各支付細項' },
  { value: '門市現金', label: '門市現金', color: '#86efac', icon: '💵' },
  { value: 'LINE Pay', label: 'LINE Pay', color: '#22c55e', icon: '💚' },
  { value: '全支付', label: '全支付', color: '#34d399', icon: '📱' },
  { value: '台灣 Pay', label: '台灣 Pay', color: '#6ee7b7', icon: '🇹🇼' },
  { value: '信用卡/其他', label: '信用卡/其他', color: '#a5b4fc', icon: '💳' },
]

export const DELIVERY_CHANNELS = [
  { value: 'Uber Eats 外送', label: 'Uber Eats', color: '#fbbf24', icon: '🛵', commission: 0.35 },
]

export const REVENUE_CHANNELS = [...ICHEF_CHANNELS, ...DELIVERY_CHANNELS]

export const formatCurrency = (amount) => {
  if (amount == null) return 'NT$0'
  return `NT$${Number(amount).toLocaleString('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export const getCostCategory = (value) =>
  COST_CATEGORIES.find((c) => c.value === value) || { label: value, color: '#86efac', icon: '💰' }

export const getRevenueChannel = (value) =>
  REVENUE_CHANNELS.find((c) => c.value === value) || { label: value, color: '#4ade80', icon: '💰' }
```

---

## src/pages/CalendarPage.jsx
```jsx
import React, { useState, useEffect, useCallback } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { supabase } from '../supabase.js'
import CalendarView from '../components/CalendarView.jsx'
import DayDetailView from '../components/DayDetailView.jsx'
import { formatCurrency } from '../theme.js'

export default function CalendarPage({ refreshKey }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [dailyData, setDailyData] = useState({})
  const [loading, setLoading] = useState(true)
  const [monthSummary, setMonthSummary] = useState({ cost: 0, revenue: 0 })

  const fetchMonthData = useCallback(async () => {
    setLoading(true)
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd')

    const { data } = await supabase
      .from('transactions')
      .select('date, type, amount')
      .gte('date', start)
      .lte('date', end)

    const dayMap = {}
    let totalCost = 0, totalRevenue = 0

    ;(data || []).forEach(({ date, type, amount }) => {
      if (!dayMap[date]) dayMap[date] = { cost: 0, revenue: 0 }
      if (type === 'cost') { dayMap[date].cost += Number(amount); totalCost += Number(amount) }
      else { dayMap[date].revenue += Number(amount); totalRevenue += Number(amount) }
    })

    setDailyData(dayMap)
    setMonthSummary({ cost: totalCost, revenue: totalRevenue })
    setLoading(false)
  }, [currentMonth])

  useEffect(() => { fetchMonthData() }, [fetchMonthData, refreshKey])

  const prevMonth = () => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextMonth = () => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  const profit = monthSummary.revenue - monthSummary.cost

  return (
    <div className="flex flex-col min-h-full" style={{ background: '#0a1a0f' }}>
      <div className="px-4 pt-4 pb-3" style={{ background: '#122018', borderBottom: '1px solid #2d4a32' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🥟</span>
            <span className="text-lg font-bold" style={{ color: '#4ade80' }}>胖寶 ERP</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: '#1a2e1f', color: '#86efac' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className="text-sm font-semibold w-20 text-center" style={{ color: '#e2f5e8' }}>{format(currentMonth, 'yyyy/MM')}</span>
            <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: '#1a2e1f', color: '#86efac' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: '月成本', value: monthSummary.cost, color: '#fca5a5', prefix: '-' },
            { label: '月營收', value: monthSummary.revenue, color: '#4ade80', prefix: '+' },
            { label: '月利潤', value: profit, color: profit >= 0 ? '#86efac' : '#f87171', prefix: profit >= 0 ? '+' : '-' },
          ].map(({ label, value, color, prefix }) => (
            <div key={label} className="rounded-lg p-2 text-center" style={{ background: '#1a2e1f' }}>
              <div className="text-xs mb-0.5" style={{ color: '#4b7a56' }}>{label}</div>
              <div className="text-xs font-bold" style={{ color }}>{prefix}{formatCurrency(Math.abs(value))}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3">
        {loading ? (
          <div className="flex items-center justify-center h-64"><div className="text-sm" style={{ color: '#4b7a56' }}>載入中...</div></div>
        ) : (
          <CalendarView currentMonth={currentMonth} dailyData={dailyData} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        )}
      </div>

      <div className="flex items-center justify-center gap-4 pb-4 text-xs" style={{ color: '#4b7a56' }}>
        <span className="flex items-center gap-1"><span style={{ color: '#4ade80' }}>+</span>營收</span>
        <span className="flex items-center gap-1"><span style={{ color: '#fca5a5' }}>-</span>成本</span>
        <span className="flex items-center gap-1"><span style={{ color: '#86efac' }}>▲</span>利潤</span>
      </div>

      {selectedDate && (
        <DayDetailView date={selectedDate} onClose={() => setSelectedDate(null)} onDataChanged={fetchMonthData} />
      )}
    </div>
  )
}
```

---

## src/pages/AccountPage.jsx
```jsx
import React, { useState, useEffect, useCallback } from 'react'
import { format, subDays, startOfMonth } from 'date-fns'
import { supabase, deleteTransaction } from '../supabase.js'
import AccountView from '../components/AccountView.jsx'
import { formatCurrency } from '../theme.js'

const RANGES = [
  { label: '本月', getValue: () => ({ from: format(startOfMonth(new Date()), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') }) },
  { label: '近7天', getValue: () => ({ from: format(subDays(new Date(), 6), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') }) },
  { label: '近30天', getValue: () => ({ from: format(subDays(new Date(), 29), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') }) },
  { label: '自訂', getValue: null },
]

export default function AccountPage({ refreshKey }) {
  const [rangeIdx, setRangeIdx] = useState(0)
  const [fromDate, setFromDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const applyRange = (idx) => {
    setRangeIdx(idx)
    if (RANGES[idx].getValue) {
      const { from, to } = RANGES[idx].getValue()
      setFromDate(from)
      setToDate(to)
    }
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .gte('date', fromDate)
      .lte('date', toDate)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    setEntries(data || [])
    setLoading(false)
  }, [fromDate, toDate])

  useEffect(() => { fetchData() }, [fetchData, refreshKey])

  const handleDelete = async (id) => { await deleteTransaction(id); fetchData() }

  const filtered = filter === 'all' ? entries : entries.filter(e => e.type === filter)
  const totalCost = entries.filter(e => e.type === 'cost').reduce((s, e) => s + Number(e.amount), 0)
  const totalRevenue = entries.filter(e => e.type === 'revenue').reduce((s, e) => s + Number(e.amount), 0)
  const profit = totalRevenue - totalCost

  const exportCSV = () => {
    const BOM = '﻿'
    const headers = '日期,類型,類別項目,金額,備註'
    const rows = filtered.map(e => [
      e.date,
      e.type === 'revenue' ? '營收' : '成本',
      e.category,
      e.amount,
      (e.note || '').replace(/,/g, '，'),
    ].join(','))
    const csv = BOM + [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `胖寶ERP_${fromDate}_${toDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ background: '#0a1a0f', minHeight: '100%' }}>
      <div className="px-4 pt-4 pb-3" style={{ background: '#122018', borderBottom: '1px solid #2d4a32' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📒</span>
            <span className="text-lg font-bold" style={{ color: '#4ade80' }}>帳戶明細</span>
          </div>
          <button onClick={exportCSV} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: '#1a2e1f', color: '#86efac', border: '1px solid #2d4a32' }}>
            ↓ 匯出 CSV
          </button>
        </div>
        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
          {RANGES.map((r, i) => (
            <button key={r.label} onClick={() => applyRange(i)}
              className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0"
              style={{ background: rangeIdx === i ? '#4ade80' : '#1a2e1f', color: rangeIdx === i ? '#0a1a0f' : '#86efac', border: rangeIdx === i ? 'none' : '1px solid #2d4a32' }}>
              {r.label}
            </button>
          ))}
        </div>
        {rangeIdx === 3 && (
          <div className="flex gap-2 mb-3">
            {[['from', fromDate, setFromDate], ['to', toDate, setToDate]].map(([key, val, set]) => (
              <input key={key} type="date" value={val} onChange={(e) => set(e.target.value)}
                className="flex-1 rounded-lg px-2 py-1.5 text-xs outline-none"
                style={{ background: '#1a2e1f', border: '1px solid #2d4a32', color: '#e2f5e8' }} />
            ))}
          </div>
        )}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: '成本', value: totalCost, color: '#fca5a5' },
            { label: '營收', value: totalRevenue, color: '#4ade80' },
            { label: '利潤', value: profit, color: profit >= 0 ? '#86efac' : '#f87171' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg p-2 text-center" style={{ background: '#1a2e1f' }}>
              <div className="text-xs mb-0.5" style={{ color: '#4b7a56' }}>{label}</div>
              <div className="text-xs font-bold" style={{ color }}>{formatCurrency(value)}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-1.5 px-3 pt-3 pb-2">
        {[['all','全部'],['cost','成本'],['revenue','營收']].map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)}
            className="px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: filter === key ? '#4ade80' : '#1a2e1f', color: filter === key ? '#0a1a0f' : '#86efac', border: filter === key ? 'none' : '1px solid #2d4a32' }}>
            {label}
            {key !== 'all' && <span className="ml-1 opacity-70">({key === 'cost' ? entries.filter(e=>e.type==='cost').length : entries.filter(e=>e.type==='revenue').length})</span>}
          </button>
        ))}
      </div>
      <div className="px-3 pb-4">
        <AccountView entries={filtered} onDelete={handleDelete} loading={loading} />
      </div>
    </div>
  )
}
```

---

## src/pages/ChartPage.jsx
```jsx
import React, { useState, useEffect, useCallback } from 'react'
import { format, subDays, startOfYear, eachWeekOfInterval, eachMonthOfInterval, endOfMonth, endOfWeek } from 'date-fns'
import { supabase } from '../supabase.js'
import ChartView from '../components/ChartView.jsx'
import { formatCurrency } from '../theme.js'

export default function ChartPage({ refreshKey }) {
  const [period, setPeriod] = useState('daily')
  const [chartType, setChartType] = useState('bar')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalCost, setTotalCost] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)

  const fetchData = useCallback(async () => {
    setLoading(true)
    let fromDate, toDate
    if (period === 'daily') { fromDate = format(subDays(new Date(), 29), 'yyyy-MM-dd'); toDate = format(new Date(), 'yyyy-MM-dd') }
    else if (period === 'weekly') { fromDate = format(subDays(new Date(), 83), 'yyyy-MM-dd'); toDate = format(new Date(), 'yyyy-MM-dd') }
    else { fromDate = format(startOfYear(new Date()), 'yyyy-MM-dd'); toDate = format(new Date(), 'yyyy-MM-dd') }

    const { data: rows } = await supabase
      .from('transactions').select('date, type, amount').gte('date', fromDate).lte('date', toDate)

    const costMap = {}, revMap = {}
    ;(rows || []).forEach(({ date, type, amount }) => {
      if (type === 'cost') costMap[date] = (costMap[date] || 0) + Number(amount)
      else revMap[date] = (revMap[date] || 0) + Number(amount)
    })

    let chartData = []
    if (period === 'daily') {
      for (let i = 29; i >= 0; i--) {
        const d = format(subDays(new Date(), i), 'yyyy-MM-dd')
        chartData.push({ label: format(new Date(d + 'T00:00:00'), 'M/d'), 成本: costMap[d] || 0, '營收': revMap[d] || 0 })
      }
    } else if (period === 'weekly') {
      const weeks = eachWeekOfInterval({ start: subDays(new Date(), 83), end: new Date() }, { weekStartsOn: 1 })
      chartData = weeks.map((weekStart) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
        let cost = 0, revenue = 0
        Object.entries(costMap).forEach(([date, amt]) => { const d = new Date(date + 'T00:00:00'); if (d >= weekStart && d <= weekEnd) cost += amt })
        Object.entries(revMap).forEach(([date, amt]) => { const d = new Date(date + 'T00:00:00'); if (d >= weekStart && d <= weekEnd) revenue += amt })
        return { label: format(weekStart, 'M/d'), 成本: cost, '營收': revenue }
      })
    } else {
      const months = eachMonthOfInterval({ start: startOfYear(new Date()), end: new Date() })
      chartData = months.map((monthStart) => {
        const monthEnd = endOfMonth(monthStart)
        let cost = 0, revenue = 0
        Object.entries(costMap).forEach(([date, amt]) => { const d = new Date(date + 'T00:00:00'); if (d >= monthStart && d <= monthEnd) cost += amt })
        Object.entries(revMap).forEach(([date, amt]) => { const d = new Date(date + 'T00:00:00'); if (d >= monthStart && d <= monthEnd) revenue += amt })
        return { label: format(monthStart, 'M月'), 成本: cost, '營收': revenue }
      })
    }

    setData(chartData)
    setTotalCost(Object.values(costMap).reduce((s, v) => s + v, 0))
    setTotalRevenue(Object.values(revMap).reduce((s, v) => s + v, 0))
    setLoading(false)
  }, [period])

  useEffect(() => { fetchData() }, [fetchData, refreshKey])

  const profit = totalRevenue - totalCost

  return (
    <div style={{ background: '#0a1a0f', minHeight: '100%' }}>
      <div className="px-4 pt-4 pb-3" style={{ background: '#122018', borderBottom: '1px solid #2d4a32' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">📈</span>
          <span className="text-lg font-bold" style={{ color: '#4ade80' }}>圖表分析</span>
        </div>
        <div className="flex justify-between items-center gap-2">
          <div className="flex gap-1.5">
            {[['daily','日'],['weekly','週'],['monthly','月']].map(([key, label]) => (
              <button key={key} onClick={() => setPeriod(key)}
                className="px-3 py-1.5 rounded-full text-xs font-medium"
                style={{ background: period === key ? '#4ade80' : '#1a2e1f', color: period === key ? '#0a1a0f' : '#86efac', border: period === key ? 'none' : '1px solid #2d4a32' }}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {[['bar','▐▌'],['line','〰']].map(([key, icon]) => (
              <button key={key} onClick={() => setChartType(key)}
                className="w-8 h-8 rounded-lg text-sm font-bold"
                style={{ background: chartType === key ? '#4ade80' : '#1a2e1f', color: chartType === key ? '#0a1a0f' : '#86efac', border: chartType === key ? 'none' : '1px solid #2d4a32' }}>
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 px-3 pt-3">
        {[
          { label: period === 'daily' ? '近30天成本' : period === 'weekly' ? '近12週成本' : '今年成本', value: totalCost, color: '#fca5a5' },
          { label: period === 'daily' ? '近30天營收' : period === 'weekly' ? '近12週營收' : '今年營收', value: totalRevenue, color: '#4ade80' },
          { label: '利潤', value: profit, color: profit >= 0 ? '#86efac' : '#f87171' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-3 text-center" style={{ background: '#122018', border: '1px solid #2d4a32' }}>
            <div className="text-xs mb-1 leading-tight" style={{ color: '#4b7a56' }}>{label}</div>
            <div className="text-xs font-bold" style={{ color }}>{formatCurrency(Math.abs(value))}</div>
          </div>
        ))}
      </div>
      <div className="px-3 pt-3 pb-6">
        {loading ? (
          <div className="flex items-center justify-center h-52"><div className="text-sm" style={{ color: '#4b7a56' }}>載入中...</div></div>
        ) : (
          <ChartView data={data} chartType={chartType} period={period} />
        )}
      </div>
    </div>
  )
}
```

---

## src/components/QuickAddModal.jsx
```jsx
import React, { useState } from 'react'
import AddCostForm from './AddCostForm.jsx'
import AddRevenueForm from './AddRevenueForm.jsx'
import QuickTextParser from './QuickTextParser.jsx'

export default function QuickAddModal({ onClose, onAdded }) {
  const [tab, setTab] = useState('cost')
  const today = new Date()

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-lg rounded-t-2xl shadow-2xl overflow-hidden"
        style={{ background: '#122018', border: '1px solid #2d4a32', maxHeight: '92vh' }}>
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🥟</span>
            <span className="font-bold" style={{ color: '#4ade80' }}>快速新增</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#1a2e1f', color: '#86efac' }}>
              今天 {today.getMonth()+1}/{today.getDate()}
            </span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ background: '#1a2e1f', color: '#86efac' }}>✕</button>
        </div>
        <div className="flex mx-4 mb-4 rounded-lg overflow-hidden" style={{ background: '#1a2e1f', border: '1px solid #2d4a32' }}>
          {[['cost','💸 成本'],['revenue','💰 營收'],['quick','⚡ 打烊速記']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className="flex-1 py-2 text-xs font-semibold transition-all"
              style={{ background: tab === key ? 'linear-gradient(135deg,#4ade80,#22c55e)' : 'transparent', color: tab === key ? '#0a1a0f' : '#86efac' }}>
              {label}
            </button>
          ))}
        </div>
        <div className="px-4 pb-6 overflow-y-auto" style={{ maxHeight: '70vh' }}>
          {tab === 'cost' && <AddCostForm date={today} onAdded={onAdded} compact />}
          {tab === 'revenue' && <AddRevenueForm date={today} onAdded={onAdded} compact />}
          {tab === 'quick' && <QuickTextParser date={today} onAdded={onAdded} onClose={onClose} />}
        </div>
      </div>
    </div>
  )
}
```

---

## src/components/AddCostForm.jsx
```jsx
import React, { useState } from 'react'
import { insertTransaction } from '../supabase.js'
import { COST_CATEGORIES } from '../theme.js'
import { format } from 'date-fns'

export default function AddCostForm({ date, onAdded, compact = false }) {
  const [category, setCategory] = useState(COST_CATEGORIES[0].value)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || isNaN(amount) || Number(amount) <= 0) { setError('請輸入有效金額'); return }
    setLoading(true); setError('')
    try {
      await insertTransaction({ date: format(date, 'yyyy-MM-dd'), type: 'cost', category, amount: Number(amount), note: note.trim() })
      setAmount(''); setNote('')
      onAdded && onAdded()
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs mb-1" style={{ color: '#86efac' }}>類別</label>
        <div className="grid grid-cols-3 gap-1.5">
          {COST_CATEGORIES.map((cat) => (
            <button type="button" key={cat.value} onClick={() => setCategory(cat.value)}
              className="flex items-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition-all"
              style={{ background: category === cat.value ? cat.color + '33' : '#1a2e1f', border: `1px solid ${category === cat.value ? cat.color : '#2d4a32'}`, color: category === cat.value ? cat.color : '#86efac' }}>
              <span>{cat.icon}</span><span className="truncate">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs mb-1" style={{ color: '#86efac' }}>金額（NT$）</label>
        <input type="number" step="0.01" min="0" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
          style={{ background: '#1a2e1f', border: '1px solid #2d4a32', color: '#e2f5e8' }}
          onFocus={(e) => e.target.style.borderColor = '#4ade80'} onBlur={(e) => e.target.style.borderColor = '#2d4a32'} />
      </div>
      <div>
        <label className="block text-xs mb-1" style={{ color: '#86efac' }}>備註（選填）</label>
        <input type="text" placeholder="備註..." value={note} onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
          style={{ background: '#1a2e1f', border: '1px solid #2d4a32', color: '#e2f5e8' }}
          onFocus={(e) => e.target.style.borderColor = '#4ade80'} onBlur={(e) => e.target.style.borderColor = '#2d4a32'} />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all active:scale-95"
        style={{ background: loading ? '#2d4a32' : 'linear-gradient(135deg,#4ade80,#22c55e)', color: '#0a1a0f' }}>
        {loading ? '新增中...' : '✓ 新增成本'}
      </button>
    </form>
  )
}
```

---

## src/components/AddRevenueForm.jsx
```jsx
import React, { useState } from 'react'
import { insertTransaction } from '../supabase.js'
import { ICHEF_CHANNELS, DELIVERY_CHANNELS } from '../theme.js'
import { format } from 'date-fns'

const UBER_COMMISSION = 0.35

export default function AddRevenueForm({ date, onAdded, compact = false }) {
  const [channel, setChannel] = useState(ICHEF_CHANNELS[0].value)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [uberDeduct, setUberDeduct] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isUber = channel === 'Uber Eats 外送'
  const rawAmount = Number(amount) || 0
  const netAmount = isUber && uberDeduct ? Math.round(rawAmount * (1 - UBER_COMMISSION)) : rawAmount
  const commission = rawAmount - netAmount

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || isNaN(amount) || rawAmount <= 0) { setError('請輸入有效金額'); return }
    setLoading(true); setError('')
    let finalNote = note.trim()
    if (isUber && uberDeduct && rawAmount > 0) {
      const deductNote = `[Uber Eats 原始訂單: $${rawAmount.toLocaleString('zh-TW')} / 平台抽成 35%: -$${commission.toLocaleString('zh-TW')}]`
      finalNote = finalNote ? `${finalNote} ${deductNote}` : deductNote
    }
    try {
      await insertTransaction({ date: format(date, 'yyyy-MM-dd'), type: 'revenue', category: channel, amount: netAmount, note: finalNote })
      setAmount(''); setNote('')
      onAdded && onAdded()
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-xs font-semibold" style={{ color: '#4ade80' }}>🍽️ 門市營收 (iCHEF)</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {ICHEF_CHANNELS.map((ch) => (
            <button type="button" key={ch.value} onClick={() => { setChannel(ch.value); setError('') }}
              className="flex flex-col items-center gap-0.5 px-1 py-2 rounded-lg text-xs font-medium transition-all"
              style={{ background: channel === ch.value ? ch.color + '33' : '#1a2e1f', border: `1px solid ${channel === ch.value ? ch.color : '#2d4a32'}`, color: channel === ch.value ? ch.color : '#86efac' }}>
              <span>{ch.icon}</span><span className="truncate w-full text-center leading-tight">{ch.label}</span>
            </button>
          ))}
        </div>
        {channel === 'iCHEF 門市日結總額' && (
          <div className="mt-1 px-2 py-1 rounded-lg text-xs" style={{ background: '#1a2e1f', color: '#4b7a56' }}>
            💡 選擇日結總額後，無需再單獨記各支付細項
          </div>
        )}
      </div>
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-xs font-semibold" style={{ color: '#fbbf24' }}>🛵 外送營收</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {DELIVERY_CHANNELS.map((ch) => (
            <button type="button" key={ch.value} onClick={() => { setChannel(ch.value); setError('') }}
              className="flex flex-col items-center gap-0.5 px-1 py-2 rounded-lg text-xs font-medium transition-all"
              style={{ background: channel === ch.value ? ch.color + '33' : '#1a2e1f', border: `1px solid ${channel === ch.value ? ch.color : '#2d4a32'}`, color: channel === ch.value ? ch.color : '#86efac' }}>
              <span>{ch.icon}</span><span className="truncate w-full text-center">{ch.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs mb-1" style={{ color: '#86efac' }}>
          {isUber && uberDeduct ? '訂單金額（NT$，扣除佣金前）' : '金額（NT$）'}
        </label>
        <input type="number" step="1" min="0" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
          style={{ background: '#1a2e1f', border: '1px solid #2d4a32', color: '#e2f5e8' }}
          onFocus={(e) => e.target.style.borderColor = '#4ade80'} onBlur={(e) => e.target.style.borderColor = '#2d4a32'} />
      </div>
      {isUber && (
        <div className="rounded-lg p-3 space-y-2" style={{ background: '#1a2e1f', border: '1px solid #fbbf2433' }}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={uberDeduct} onChange={(e) => setUberDeduct(e.target.checked)}
              style={{ accentColor: '#fbbf24', width: 16, height: 16 }} />
            <span className="text-xs" style={{ color: '#fbbf24' }}>自動計算實收淨額（扣除 35% 平台佣金）</span>
          </label>
          {uberDeduct && rawAmount > 0 && (
            <div className="text-xs space-y-0.5 pl-6" style={{ color: '#4b7a56' }}>
              <div>訂單金額：<span style={{ color: '#e2f5e8' }}>NT${rawAmount.toLocaleString('zh-TW')}</span></div>
              <div>平台抽成 35%：<span style={{ color: '#fca5a5' }}>-NT${commission.toLocaleString('zh-TW')}</span></div>
              <div>實收淨額：<span style={{ color: '#4ade80', fontWeight: 700 }}>NT${netAmount.toLocaleString('zh-TW')}</span></div>
            </div>
          )}
        </div>
      )}
      <div>
        <label className="block text-xs mb-1" style={{ color: '#86efac' }}>備註（選填）</label>
        <input type="text" placeholder="備註..." value={note} onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
          style={{ background: '#1a2e1f', border: '1px solid #2d4a32', color: '#e2f5e8' }}
          onFocus={(e) => e.target.style.borderColor = '#4ade80'} onBlur={(e) => e.target.style.borderColor = '#2d4a32'} />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all active:scale-95"
        style={{ background: loading ? '#2d4a32' : 'linear-gradient(135deg,#4ade80,#22c55e)', color: '#0a1a0f' }}>
        {loading ? '新增中...' : `✓ 新增營收${isUber && uberDeduct && netAmount > 0 ? `（NT$${netAmount.toLocaleString('zh-TW')}）` : ''}`}
      </button>
    </form>
  )
}
```

---

## src/components/QuickTextParser.jsx
（打烊速記批次解析，程式碼已在專案中，見 src/components/QuickTextParser.jsx）

---

## 注意事項
- Vercel 環境變數需設定 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`（使用 Legacy anon key，`eyJ` 開頭）
- Uber Eats 抽成為 **35%**
- 所有資料統一存入 `transactions` 表，以 `type` 欄位區分成本/營收
