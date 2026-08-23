# 胖寶 ERP — 完整程式碼 v2

## 架構說明
```
src/
├── App.jsx
├── main.jsx
├── index.css
├── shared/
│   ├── lib/supabase.js
│   ├── theme.js
│   └── components/Navbar.jsx
└── features/
    ├── auth/         (auth.js, LoginPage.jsx)
    ├── calendar/     (CalendarPage, CalendarView, DayDetailView)
    ├── account/      (AccountPage, AccountView)
    ├── chart/        (ChartPage, ChartView)
    ├── transaction/  (AddCostForm, AddRevenueForm, QuickAddModal, QuickTextParser)
    ├── inventory/    (InventoryPage)
    └── staff/        (StaffPage)
```

## Supabase 資料表
- `transactions` — 收支記錄
- `inventory` — 庫存食材
- `employees` — 員工
- `work_hours` — 工時記錄
- `leaves` — 請假記錄

---

## App.jsx
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
import QuickAddModal from './features/transaction/QuickAddModal.jsx'

export default function App() {
  const [authed, setAuthed] = useState(isAuthed())
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleAdded = () => {
    setRefreshKey((k) => k + 1)
    setQuickAddOpen(false)
  }

  if (!authed) {
    return <LoginPage onLogin={() => setAuthed(true)} />
  }

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

## main.jsx
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
        <div style={{ background: '#f4f6e4', color: '#1e2e08', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24 }}>
          <div style={{ fontSize: 48 }}>🥟</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#16a34a' }}>胖寶 ERP 載入失敗</div>
          <div style={{ fontSize: 13, color: '#5a6b20', maxWidth: 300, textAlign: 'center' }}>
            {this.state.error?.message || '發生錯誤，請重新整理頁面'}
          </div>
          <button onClick={() => window.location.reload()} style={{ marginTop: 8, padding: '8px 24px', background: '#b5c265', color: '#16a34a', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
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

## index.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  -webkit-tap-highlight-color: transparent;
}

body {
  background-color: #f4f6e4;
  color: #1e2e08;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang TC', 'Microsoft JhengHei', sans-serif;
  overscroll-behavior: none;
}

::-webkit-scrollbar {
  width: 4px;
}
::-webkit-scrollbar-track {
  background: #e6eac8;
}
::-webkit-scrollbar-thumb {
  background: #b5c265;
  border-radius: 2px;
}

input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button {
  opacity: 1;
}

```

## shared/lib/supabase.js
```js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kbfjtzbkhclsttemkars.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiZmp0emJraGNsc3R0ZW1rYXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNDI4MTEsImV4cCI6MjA5MDcxODgxMX0.arC20m9UILHOQJkgD7i93Zdt-sfzHyIOMnCDVtqSLKw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 取得指定月份的所有交易資料
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

  if (error) {
    console.error('Error fetching transactions:', error)
    return []
  }
  return data
}

// 新增單筆交易
export async function insertTransaction(record) {
  const { data, error } = await supabase
    .from('transactions')
    .insert([record])
    .select()

  if (error) throw error
  return data[0]
}

// 刪除交易
export async function deleteTransaction(id) {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)

  if (error) throw error
}

```

## shared/theme.js
```js
export const COST_CATEGORIES = [
  { value: '餃子皮', label: '餃子皮', color: '#2a7a40', icon: '🥟' },
  { value: '豬肉', label: '豬肉', color: '#ef4444', icon: '🥩' },
  { value: '蔬菜', label: '蔬菜', color: '#6ee7b7', icon: '🥬' },
  { value: '桶裝瓦斯', label: '桶裝瓦斯', color: '#d97706', icon: '🔥' },
  { value: '紙類雜項', label: '紙類雜項', color: '#a5b4fc', icon: '📦' },
]

// 門市營收 (iCHEF POS 管道)
export const ICHEF_CHANNELS = [
  { value: 'iCHEF 門市日結總額', label: '日結總額', color: '#16a34a', icon: '🍽️', hint: '選此項無需再記各支付細項' },
  { value: '門市現金', label: '門市現金', color: '#2a7a40', icon: '💵' },
  { value: 'LINE Pay', label: 'LINE Pay', color: '#15803d', icon: '💚' },
  { value: '全支付', label: '全支付', color: '#34d399', icon: '📱' },
  { value: '台灣 Pay', label: '台灣 Pay', color: '#6ee7b7', icon: '🇹🇼' },
  { value: '信用卡/其他', label: '信用卡/其他', color: '#a5b4fc', icon: '💳' },
]

// 外送營收
export const DELIVERY_CHANNELS = [
  { value: 'Uber Eats 外送', label: 'Uber Eats', color: '#d97706', icon: '🛵', commission: 0.32 },
]

// 全部營收管道（供顯示用）
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

## shared/components/Navbar.jsx
```jsx
import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'

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
const ChartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
)
const PeopleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const BoxIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
)

export default function Navbar({ onQuickAdd }) {
  const location = useLocation()

  const navItems = [
    { to: '/calendar', label: '記帳', Icon: CalIcon },
    { to: '/account', label: '帳戶', Icon: ListIcon },
    { to: '/chart', label: '圖表', Icon: ChartIcon },
    { to: '/inventory', label: '庫存', Icon: BoxIcon },
    { to: '/staff', label: '員工', Icon: PeopleIcon },
  ]

  return (
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
      {/* Quick Add Button */}
      <button onClick={onQuickAdd}
        className="flex flex-col items-center justify-center flex-1 py-1 gap-0.5 rounded-xl transition-all active:scale-95"
        style={{ color: '#f4f6e4' }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
          style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', marginTop: '-20px', boxShadow: '0 4px 16px rgba(74,222,128,0.4)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </div>
        <span className="text-xs font-medium" style={{ color: '#5a6b20' }}>新增</span>
      </button>
    </nav>
  )
}

```

## features/auth/auth.js
```js
// 簡單密碼保護（個人使用）
const PASSWORD = import.meta.env.VITE_APP_PASSWORD || 'pangbao2024'
const KEY = 'pb_authed'

export const login = (pwd) => {
  if (pwd === PASSWORD) {
    sessionStorage.setItem(KEY, '1')
    return true
  }
  return false
}

export const isAuthed = () => sessionStorage.getItem(KEY) === '1'

export const logout = () => sessionStorage.removeItem(KEY)

```

## features/auth/LoginPage.jsx
```jsx
import React, { useState } from 'react'
import { login } from './auth.js'

export default function LoginPage({ onLogin }) {
  const [pwd, setPwd] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (login(pwd)) {
      onLogin()
    } else {
      setError(true)
      setPwd('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4f6e4' }}>
      <div className="w-full max-w-sm mx-4 rounded-2xl p-8 shadow-lg" style={{ background: '#ffffff', border: '1px solid #b5c265' }}>
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🥟</div>
          <h1 className="text-2xl font-bold" style={{ color: '#1e2e08' }}>胖寶 ERP</h1>
          <p className="text-sm mt-1" style={{ color: '#5a6b20' }}>請輸入密碼以繼續</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={pwd}
            onChange={(e) => { setPwd(e.target.value); setError(false) }}
            placeholder="密碼"
            autoFocus
            className="w-full px-4 py-3 rounded-xl outline-none text-sm"
            style={{
              background: '#f4f6e4',
              border: error ? '1.5px solid #dc2626' : '1.5px solid #b5c265',
              color: '#1e2e08',
            }}
          />
          {error && (
            <p className="text-xs text-center" style={{ color: '#dc2626' }}>密碼錯誤，請再試一次</p>
          )}
          <button
            type="submit"
            className="w-full py-3 rounded-xl font-semibold text-sm"
            style={{ background: '#16a34a', color: '#ffffff' }}
          >
            登入
          </button>
        </form>
      </div>
    </div>
  )
}

```

## features/calendar/CalendarPage.jsx
```jsx
import React, { useState, useEffect, useCallback } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { supabase } from '../../shared/lib/supabase.js'
import CalendarView from './CalendarView.jsx'
import DayDetailView from './DayDetailView.jsx'
import { formatCurrency } from '../../shared/theme.js'

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
      if (type === 'cost') {
        dayMap[date].cost += Number(amount)
        totalCost += Number(amount)
      } else {
        dayMap[date].revenue += Number(amount)
        totalRevenue += Number(amount)
      }
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
    <div className="flex flex-col min-h-full" style={{ background: '#f4f6e4' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3" style={{ background: '#e6eac8', borderBottom: '1px solid #b5c265' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🥟</span>
            <span className="text-lg font-bold" style={{ color: '#16a34a' }}>胖寶 ERP</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
              style={{ background: '#ffffff', color: '#2a7a40' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <span className="text-sm font-semibold w-20 text-center" style={{ color: '#1e2e08' }}>
              {format(currentMonth, 'yyyy/MM')}
            </span>
            <button onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
              style={{ background: '#ffffff', color: '#2a7a40' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: '月成本', value: monthSummary.cost, color: '#ef4444', prefix: '-' },
            { label: '月營收', value: monthSummary.revenue, color: '#16a34a', prefix: '+' },
            { label: '月利潤', value: profit, color: profit >= 0 ? '#2a7a40' : '#dc2626', prefix: profit >= 0 ? '+' : '-' },
          ].map(({ label, value, color, prefix }) => (
            <div key={label} className="rounded-lg p-2 text-center" style={{ background: '#ffffff' }}>
              <div className="text-xs mb-0.5" style={{ color: '#5a6b20' }}>{label}</div>
              <div className="text-xs font-bold" style={{ color }}>
                {prefix}{formatCurrency(Math.abs(value))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-sm" style={{ color: '#5a6b20' }}>載入中...</div>
          </div>
        ) : (
          <CalendarView
            currentMonth={currentMonth}
            dailyData={dailyData}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        )}
      </div>

      <div className="flex items-center justify-center gap-4 pb-4 text-xs" style={{ color: '#5a6b20' }}>
        <span className="flex items-center gap-1"><span style={{ color: '#16a34a' }}>+</span>營收</span>
        <span className="flex items-center gap-1"><span style={{ color: '#ef4444' }}>-</span>成本</span>
        <span className="flex items-center gap-1"><span style={{ color: '#2a7a40' }}>▲</span>利潤</span>
      </div>

      {selectedDate && (
        <DayDetailView
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
          onDataChanged={fetchMonthData}
        />
      )}
    </div>
  )
}

```

## features/calendar/CalendarView.jsx
```jsx
import React from 'react'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { formatCurrency } from '../../shared/theme.js'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export default function CalendarView({ currentMonth, dailyData, selectedDate, onSelectDate }) {
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart)
  const calEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #b5c265' }}>
      {/* Weekday headers */}
      <div className="grid grid-cols-7" style={{ background: '#ffffff' }}>
        {WEEKDAYS.map((d, i) => (
          <div key={d} className="py-2 text-center text-xs font-semibold"
            style={{ color: i === 0 ? '#ef4444' : i === 6 ? '#3b82f6' : '#2a7a40' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7" style={{ background: '#e6eac8' }}>
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const data = dailyData[key]
          const inMonth = isSameMonth(day, currentMonth)
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          const todayDay = isToday(day)
          const profit = data ? (data.revenue - data.cost) : null
          const dayOfWeek = day.getDay()

          return (
            <button key={key} onClick={() => inMonth && onSelectDate(day)}
              disabled={!inMonth}
              className="relative flex flex-col items-center pt-1.5 pb-1 min-h-[64px] transition-all"
              style={{
                background: isSelected ? '#dde8b0' : 'transparent',
                borderBottom: '1px solid #ffffff',
                opacity: inMonth ? 1 : 0.25,
                cursor: inMonth ? 'pointer' : 'default',
              }}>
              {/* Date number */}
              <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-0.5`}
                style={{
                  background: todayDay ? '#16a34a' : 'transparent',
                  color: todayDay ? '#f4f6e4' : isSelected ? '#16a34a' : dayOfWeek === 0 ? '#ef4444' : dayOfWeek === 6 ? '#3b82f6' : '#1e2e08',
                  fontWeight: todayDay || isSelected ? 700 : 400,
                }}>
                {format(day, 'd')}
              </div>

              {/* Daily data */}
              {data && inMonth && (
                <div className="w-full px-0.5 space-y-0.5">
                  {data.revenue > 0 && (
                    <div className="text-center text-xs leading-tight rounded" style={{ color: '#16a34a', fontSize: '9px' }}>
                      +{data.revenue >= 1000 ? (data.revenue/1000).toFixed(1)+'k' : data.revenue}
                    </div>
                  )}
                  {data.cost > 0 && (
                    <div className="text-center text-xs leading-tight rounded" style={{ color: '#ef4444', fontSize: '9px' }}>
                      -{data.cost >= 1000 ? (data.cost/1000).toFixed(1)+'k' : data.cost}
                    </div>
                  )}
                  {profit !== null && (data.revenue > 0 || data.cost > 0) && (
                    <div className="text-center text-xs leading-tight rounded" style={{
                      color: profit >= 0 ? '#2a7a40' : '#dc2626',
                      fontSize: '9px',
                      fontWeight: 600,
                    }}>
                      {profit >= 0 ? '▲' : '▼'}{Math.abs(profit) >= 1000 ? (Math.abs(profit)/1000).toFixed(1)+'k' : Math.abs(profit)}
                    </div>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

```

## features/calendar/DayDetailView.jsx
```jsx
import React, { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { supabase, deleteTransaction } from '../../shared/lib/supabase.js'
import { formatCurrency, getCostCategory, getRevenueChannel } from '../../shared/theme.js'
import AddCostForm from './AddCostForm.jsx'
import AddRevenueForm from './AddRevenueForm.jsx'

export default function DayDetailView({ date, onClose, onDataChanged }) {
  const [tab, setTab] = useState('summary')
  const [costEntries, setCostEntries] = useState([])
  const [revenueEntries, setRevenueEntries] = useState([])
  const [loading, setLoading] = useState(true)

  const dateStr = format(date, 'yyyy-MM-dd')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('date', dateStr)
      .order('created_at', { ascending: false })
    const all = data || []
    setCostEntries(all.filter(e => e.type === 'cost'))
    setRevenueEntries(all.filter(e => e.type === 'revenue'))
    setLoading(false)
  }, [dateStr])

  useEffect(() => { fetchData() }, [fetchData])

  const totalCost = costEntries.reduce((s, e) => s + Number(e.amount), 0)
  const totalRevenue = revenueEntries.reduce((s, e) => s + Number(e.amount), 0)
  const profit = totalRevenue - totalCost

  const handleDelete = async (id) => {
    await deleteTransaction(id)
    fetchData()
    onDataChanged && onDataChanged()
  }

  const handleAdded = () => {
    fetchData()
    onDataChanged && onDataChanged()
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col" style={{ background: '#f4f6e4' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: '#e6eac8', borderBottom: '1px solid #b5c265' }}>
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ background: '#ffffff', color: '#16a34a' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div>
          <div className="font-bold" style={{ color: '#1e2e08' }}>
            {format(date, 'yyyy 年 M 月 d 日')}
          </div>
          <div className="text-xs" style={{ color: '#5a6b20' }}>
            {['週日','週一','週二','週三','週四','週五','週六'][date.getDay()]}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 p-3" style={{ background: '#e6eac8' }}>
        {[
          { label: '總成本', value: totalCost, color: '#ef4444' },
          { label: '總營收', value: totalRevenue, color: '#16a34a' },
          { label: '利潤', value: profit, color: profit >= 0 ? '#2a7a40' : '#dc2626' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-3 text-center" style={{ background: '#ffffff', border: '1px solid #b5c265' }}>
            <div className="text-xs mb-1" style={{ color: '#5a6b20' }}>{label}</div>
            <div className="font-bold text-sm" style={{ color }}>
              {value >= 0 ? '' : '-'}{formatCurrency(Math.abs(value))}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex mx-3 mb-0 rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #b5c265' }}>
        {[['summary','📊 小計'],['cost','💸 成本'],['revenue','💰 營收']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex-1 py-2.5 text-xs font-semibold transition-all"
            style={{
              background: tab === key ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'transparent',
              color: tab === key ? '#f4f6e4' : '#2a7a40',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-sm" style={{ color: '#5a6b20' }}>載入中...</div>
          </div>
        ) : (
          <>
            {tab === 'summary' && (
              <div className="space-y-3">
                {costEntries.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold mb-2 px-1" style={{ color: '#ef4444' }}>成本明細</div>
                    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #b5c265' }}>
                      {costEntries.map((e, i) => {
                        const cat = getCostCategory(e.category)
                        return (
                          <div key={e.id} className="flex items-center justify-between px-3 py-2.5"
                            style={{ borderBottom: i < costEntries.length-1 ? '1px solid #ffffff' : 'none', background: '#e6eac8' }}>
                            <div className="flex items-center gap-2">
                              <span>{cat.icon}</span>
                              <div>
                                <div className="text-sm" style={{ color: '#1e2e08' }}>{e.category}</div>
                                {e.note && <div className="text-xs" style={{ color: '#5a6b20' }}>{e.note}</div>}
                              </div>
                            </div>
                            <div className="font-semibold text-sm" style={{ color: '#ef4444' }}>{formatCurrency(e.amount)}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                {revenueEntries.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold mb-2 px-1" style={{ color: '#16a34a' }}>營收明細</div>
                    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #b5c265' }}>
                      {revenueEntries.map((e, i) => {
                        const ch = getRevenueChannel(e.category)
                        return (
                          <div key={e.id} className="flex items-center justify-between px-3 py-2.5"
                            style={{ borderBottom: i < revenueEntries.length-1 ? '1px solid #ffffff' : 'none', background: '#e6eac8' }}>
                            <div className="flex items-center gap-2">
                              <span>{ch.icon}</span>
                              <div>
                                <div className="text-sm" style={{ color: '#1e2e08' }}>{e.category}</div>
                                {e.note && <div className="text-xs" style={{ color: '#5a6b20' }}>{e.note}</div>}
                              </div>
                            </div>
                            <div className="font-semibold text-sm" style={{ color: '#16a34a' }}>{formatCurrency(e.amount)}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                {costEntries.length === 0 && revenueEntries.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-32 gap-2">
                    <span className="text-3xl">📭</span>
                    <div className="text-sm" style={{ color: '#5a6b20' }}>今天還沒有記帳資料</div>
                  </div>
                )}
              </div>
            )}

            {tab === 'cost' && (
              <div className="space-y-4">
                <AddCostForm date={date} onAdded={handleAdded} />
                {costEntries.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold mb-2 px-1" style={{ color: '#5a6b20' }}>已記錄成本</div>
                    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #b5c265' }}>
                      {costEntries.map((e, i) => {
                        const cat = getCostCategory(e.category)
                        return (
                          <div key={e.id} className="flex items-center justify-between px-3 py-2.5"
                            style={{ borderBottom: i < costEntries.length-1 ? '1px solid #ffffff' : 'none', background: '#e6eac8' }}>
                            <div className="flex items-center gap-2">
                              <span>{cat.icon}</span>
                              <div>
                                <div className="text-sm" style={{ color: '#1e2e08' }}>{e.category}</div>
                                {e.note && <div className="text-xs" style={{ color: '#5a6b20' }}>{e.note}</div>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="font-semibold text-sm" style={{ color: '#ef4444' }}>{formatCurrency(e.amount)}</div>
                              <button onClick={() => handleDelete(e.id)}
                                className="w-7 h-7 flex items-center justify-center rounded-full"
                                style={{ background: '#fee2e2', color: '#dc2626' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                                  <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === 'revenue' && (
              <div className="space-y-4">
                <AddRevenueForm date={date} onAdded={handleAdded} />
                {revenueEntries.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold mb-2 px-1" style={{ color: '#5a6b20' }}>已記錄營收</div>
                    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #b5c265' }}>
                      {revenueEntries.map((e, i) => {
                        const ch = getRevenueChannel(e.category)
                        return (
                          <div key={e.id} className="flex items-center justify-between px-3 py-2.5"
                            style={{ borderBottom: i < revenueEntries.length-1 ? '1px solid #ffffff' : 'none', background: '#e6eac8' }}>
                            <div className="flex items-center gap-2">
                              <span>{ch.icon}</span>
                              <div>
                                <div className="text-sm" style={{ color: '#1e2e08' }}>{e.category}</div>
                                {e.note && <div className="text-xs" style={{ color: '#5a6b20' }}>{e.note}</div>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="font-semibold text-sm" style={{ color: '#16a34a' }}>{formatCurrency(e.amount)}</div>
                              <button onClick={() => handleDelete(e.id)}
                                className="w-7 h-7 flex items-center justify-center rounded-full"
                                style={{ background: '#fee2e2', color: '#dc2626' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                                  <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

```

## features/account/AccountPage.jsx
```jsx
import React, { useState, useEffect, useCallback } from 'react'
import { format, subDays, startOfMonth } from 'date-fns'
import { supabase, deleteTransaction } from '../../shared/lib/supabase.js'
import AccountView from './AccountView.jsx'
import { formatCurrency } from '../../shared/theme.js'

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

  const handleDelete = async (id) => {
    if (window.confirm('確定要刪除這筆紀錄嗎？')) {
      try {
        await deleteTransaction(id)
        fetchData()
      } catch (err) {
        alert('刪除失敗：' + err.message)
      }
    }
  }

  const filtered = filter === 'all' ? entries : entries.filter(e => e.type === filter)
  const totalCost = entries.filter(e => e.type === 'cost').reduce((s, e) => s + Number(e.amount), 0)
  const totalRevenue = entries.filter(e => e.type === 'revenue').reduce((s, e) => s + Number(e.amount), 0)
  const profit = totalRevenue - totalCost

  // CSV 匯出
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
    <div style={{ background: '#f4f6e4', minHeight: '100%' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3" style={{ background: '#e6eac8', borderBottom: '1px solid #b5c265' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📒</span>
            <span className="text-lg font-bold" style={{ color: '#16a34a' }}>帳戶明細</span>
          </div>
          <button onClick={exportCSV}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
            style={{ background: '#ffffff', color: '#2a7a40', border: '1px solid #b5c265' }}>
            ↓ 匯出 CSV
          </button>
        </div>

        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
          {RANGES.map((r, i) => (
            <button key={r.label} onClick={() => applyRange(i)}
              className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all"
              style={{
                background: rangeIdx === i ? '#16a34a' : '#ffffff',
                color: rangeIdx === i ? '#f4f6e4' : '#2a7a40',
                border: rangeIdx === i ? 'none' : '1px solid #b5c265',
              }}>
              {r.label}
            </button>
          ))}
        </div>

        {rangeIdx === 3 && (
          <div className="flex gap-2 mb-3">
            {[['from', fromDate, setFromDate], ['to', toDate, setToDate]].map(([key, val, set]) => (
              <input key={key} type="date" value={val}
                onChange={(e) => { set(e.target.value) }}
                className="flex-1 rounded-lg px-2 py-1.5 text-xs outline-none"
                style={{ background: '#ffffff', border: '1px solid #b5c265', color: '#1e2e08' }}
              />
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: '成本', value: totalCost, color: '#ef4444' },
            { label: '營收', value: totalRevenue, color: '#16a34a' },
            { label: '利潤', value: profit, color: profit >= 0 ? '#2a7a40' : '#dc2626' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg p-2 text-center" style={{ background: '#ffffff' }}>
              <div className="text-xs mb-0.5" style={{ color: '#5a6b20' }}>{label}</div>
              <div className="text-xs font-bold" style={{ color }}>{formatCurrency(value)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-1.5 px-3 pt-3 pb-2">
        {[['all','全部'],['cost','成本'],['revenue','營收']].map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: filter === key ? '#16a34a' : '#ffffff',
              color: filter === key ? '#f4f6e4' : '#2a7a40',
              border: filter === key ? 'none' : '1px solid #b5c265',
            }}>
            {label}
            {key !== 'all' && <span className="ml-1 opacity-70">
              ({key === 'cost' ? entries.filter(e=>e.type==='cost').length : entries.filter(e=>e.type==='revenue').length})
            </span>}
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

## features/account/AccountView.jsx
```jsx
import React from 'react'
import { format } from 'date-fns'
import { formatCurrency, getCostCategory, getRevenueChannel } from '../../shared/theme.js'

export default function AccountView({ entries, onDelete, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="text-sm" style={{ color: '#5a6b20' }}>載入中...</div>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2">
        <span className="text-3xl">📭</span>
        <div className="text-sm" style={{ color: '#5a6b20' }}>此期間沒有資料</div>
      </div>
    )
  }

  // Group by date
  const grouped = {}
  entries.forEach((e) => {
    const d = e.date
    if (!grouped[d]) grouped[d] = []
    grouped[d].push(e)
  })
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <div className="space-y-4">
      {sortedDates.map((dateStr) => {
        const dayEntries = grouped[dateStr]
        const dayCost = dayEntries.filter(e => e.type === 'cost').reduce((s, e) => s + Number(e.amount), 0)
        const dayRevenue = dayEntries.filter(e => e.type === 'revenue').reduce((s, e) => s + Number(e.amount), 0)
        const dayProfit = dayRevenue - dayCost
        const d = new Date(dateStr + 'T00:00:00')

        return (
          <div key={dateStr}>
            {/* Date header */}
            <div className="flex items-center justify-between px-1 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color: '#16a34a' }}>
                  {format(d, 'M/d')}
                </span>
                <span className="text-xs" style={{ color: '#5a6b20' }}>
                  {['週日','週一','週二','週三','週四','週五','週六'][d.getDay()]}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                {dayCost > 0 && <span style={{ color: '#ef4444' }}>-{formatCurrency(dayCost)}</span>}
                {dayRevenue > 0 && <span style={{ color: '#16a34a' }}>+{formatCurrency(dayRevenue)}</span>}
                <span style={{ color: dayProfit >= 0 ? '#2a7a40' : '#dc2626', fontWeight: 600 }}>
                  {dayProfit >= 0 ? '▲' : '▼'}{formatCurrency(Math.abs(dayProfit))}
                </span>
              </div>
            </div>

            {/* Entries */}
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #b5c265' }}>
              {dayEntries.map((e, i) => {
                const isCost = e.type === 'cost'
                const meta = isCost ? getCostCategory(e.category) : getRevenueChannel(e.category)
                return (
                  <div key={e.id} className="flex items-center justify-between px-3 py-2.5"
                    style={{
                      background: '#e6eac8',
                      borderBottom: i < dayEntries.length-1 ? '1px solid #ffffff' : 'none',
                    }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                        style={{ background: isCost ? '#fee2e2' : '#f0f4dc' }}>
                        {meta.icon}
                      </div>
                      <div>
                        <div className="text-sm" style={{ color: '#1e2e08' }}>
                          {e.category}
                        </div>
                        {e.note && <div className="text-xs" style={{ color: '#5a6b20' }}>{e.note}</div>}
                        <div className="text-xs" style={{ color: '#b5c265' }}>
                          {isCost ? '成本' : '營收'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-sm" style={{ color: isCost ? '#ef4444' : '#16a34a' }}>
                        {isCost ? '-' : '+'}{formatCurrency(e.amount)}
                      </div>
                      <button onClick={() => onDelete(e.id, e.type)}
                        className="w-7 h-7 flex items-center justify-center rounded-full transition-colors"
                        style={{ background: '#fee2e2', color: '#dc2626' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                          <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

```

## features/chart/ChartPage.jsx
```jsx
import React, { useState, useEffect, useCallback } from 'react'
import { format, subDays, startOfYear, eachWeekOfInterval, eachMonthOfInterval, endOfMonth, endOfWeek } from 'date-fns'
import { supabase } from '../../shared/lib/supabase.js'
import ChartView from './ChartView.jsx'
import { formatCurrency } from '../../shared/theme.js'

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

    if (period === 'daily') {
      fromDate = format(subDays(new Date(), 29), 'yyyy-MM-dd')
      toDate = format(new Date(), 'yyyy-MM-dd')
    } else if (period === 'weekly') {
      fromDate = format(subDays(new Date(), 83), 'yyyy-MM-dd')
      toDate = format(new Date(), 'yyyy-MM-dd')
    } else {
      fromDate = format(startOfYear(new Date()), 'yyyy-MM-dd')
      toDate = format(new Date(), 'yyyy-MM-dd')
    }

    const { data: rows } = await supabase
      .from('transactions')
      .select('date, type, amount')
      .gte('date', fromDate)
      .lte('date', toDate)

    const costMap = {}
    const revMap = {}

    ;(rows || []).forEach(({ date, type, amount }) => {
      if (type === 'cost') costMap[date] = (costMap[date] || 0) + Number(amount)
      else revMap[date] = (revMap[date] || 0) + Number(amount)
    })

    let chartData = []

    if (period === 'daily') {
      for (let i = 29; i >= 0; i--) {
        const d = format(subDays(new Date(), i), 'yyyy-MM-dd')
        chartData.push({
          label: format(new Date(d + 'T00:00:00'), 'M/d'),
          成本: costMap[d] || 0,
          '營收': revMap[d] || 0,
        })
      }
    } else if (period === 'weekly') {
      const start = subDays(new Date(), 83)
      const weeks = eachWeekOfInterval({ start, end: new Date() }, { weekStartsOn: 1 })
      chartData = weeks.map((weekStart) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
        let cost = 0, revenue = 0
        for (const [date, amt] of Object.entries(costMap)) {
          const d = new Date(date + 'T00:00:00')
          if (d >= weekStart && d <= weekEnd) cost += amt
        }
        for (const [date, amt] of Object.entries(revMap)) {
          const d = new Date(date + 'T00:00:00')
          if (d >= weekStart && d <= weekEnd) revenue += amt
        }
        return { label: format(weekStart, 'M/d'), 成本: cost, '營收': revenue }
      })
    } else {
      const start = startOfYear(new Date())
      const months = eachMonthOfInterval({ start, end: new Date() })
      chartData = months.map((monthStart) => {
        const monthEnd = endOfMonth(monthStart)
        let cost = 0, revenue = 0
        for (const [date, amt] of Object.entries(costMap)) {
          const d = new Date(date + 'T00:00:00')
          if (d >= monthStart && d <= monthEnd) cost += amt
        }
        for (const [date, amt] of Object.entries(revMap)) {
          const d = new Date(date + 'T00:00:00')
          if (d >= monthStart && d <= monthEnd) revenue += amt
        }
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
    <div style={{ background: '#f4f6e4', minHeight: '100%' }}>
      <div className="px-4 pt-4 pb-3" style={{ background: '#e6eac8', borderBottom: '1px solid #b5c265' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">📈</span>
          <span className="text-lg font-bold" style={{ color: '#16a34a' }}>圖表分析</span>
        </div>

        <div className="flex justify-between items-center gap-2">
          <div className="flex gap-1.5">
            {[['daily','日'],['weekly','週'],['monthly','月']].map(([key, label]) => (
              <button key={key} onClick={() => setPeriod(key)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  background: period === key ? '#16a34a' : '#ffffff',
                  color: period === key ? '#f4f6e4' : '#2a7a40',
                  border: period === key ? 'none' : '1px solid #b5c265',
                }}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {[['bar','▐▌'],['line','〰']].map(([key, icon]) => (
              <button key={key} onClick={() => setChartType(key)}
                className="w-8 h-8 rounded-lg text-sm font-bold transition-all"
                style={{
                  background: chartType === key ? '#16a34a' : '#ffffff',
                  color: chartType === key ? '#f4f6e4' : '#2a7a40',
                  border: chartType === key ? 'none' : '1px solid #b5c265',
                }}>
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 px-3 pt-3">
        {[
          { label: period === 'daily' ? '近30天成本' : period === 'weekly' ? '近12週成本' : '今年成本', value: totalCost, color: '#ef4444' },
          { label: period === 'daily' ? '近30天營收' : period === 'weekly' ? '近12週營收' : '今年營收', value: totalRevenue, color: '#16a34a' },
          { label: '利潤', value: profit, color: profit >= 0 ? '#2a7a40' : '#dc2626' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-3 text-center" style={{ background: '#e6eac8', border: '1px solid #b5c265' }}>
            <div className="text-xs mb-1 leading-tight" style={{ color: '#5a6b20' }}>{label}</div>
            <div className="text-xs font-bold" style={{ color }}>{formatCurrency(Math.abs(value))}</div>
          </div>
        ))}
      </div>

      <div className="px-3 pt-3 pb-6">
        {loading ? (
          <div className="flex items-center justify-center h-52">
            <div className="text-sm" style={{ color: '#5a6b20' }}>載入中...</div>
          </div>
        ) : (
          <ChartView data={data} chartType={chartType} period={period} />
        )}
      </div>
    </div>
  )
}

```

## features/chart/ChartView.jsx
```jsx
import React from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { formatCurrency } from '../../shared/theme.js'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="rounded-xl p-3 shadow-xl" style={{ background: '#ffffff', border: '1px solid #b5c265', minWidth: 140 }}>
      <div className="text-xs mb-2" style={{ color: '#2a7a40' }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex justify-between gap-4 text-xs mb-0.5">
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ color: '#1e2e08', fontWeight: 600 }}>{formatCurrency(p.value)}</span>
        </div>
      ))}
      {payload.length === 2 && (
        <div className="flex justify-between gap-4 text-xs mt-1 pt-1" style={{ borderTop: '1px solid #b5c265' }}>
          <span style={{ color: '#2a7a40' }}>利潤</span>
          <span style={{ color: payload[1].value - payload[0].value >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
            {formatCurrency(payload[1].value - payload[0].value)}
          </span>
        </div>
      )}
    </div>
  )
}

export default function ChartView({ data, chartType, period }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-52 gap-2">
        <span className="text-3xl">📊</span>
        <div className="text-sm" style={{ color: '#5a6b20' }}>此期間沒有資料</div>
      </div>
    )
  }

  const commonProps = {
    data,
    margin: { top: 8, right: 8, left: 0, bottom: 4 },
  }

  const axisStyle = { fill: '#5a6b20', fontSize: 10 }

  return (
    <div className="space-y-6">
      {/* Main Chart */}
      <div className="rounded-xl p-3" style={{ background: '#e6eac8', border: '1px solid #b5c265' }}>
        <div className="text-xs font-semibold mb-3 px-1" style={{ color: '#2a7a40' }}>
          成本 vs 營收
        </div>
        <ResponsiveContainer width="100%" height={200}>
          {chartType === 'bar' ? (
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" vertical={false} />
              <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? (v/1000)+'k' : v} width={36} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#2a7a40' }} />
              <Bar dataKey="成本" fill="#ef4444" radius={[4,4,0,0]} maxBarSize={32} />
              <Bar dataKey="營收" fill="#16a34a" radius={[4,4,0,0]} maxBarSize={32} />
            </BarChart>
          ) : (
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" vertical={false} />
              <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? (v/1000)+'k' : v} width={36} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#2a7a40' }} />
              <Line type="monotone" dataKey="成本" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: '#ef4444' }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="營收" stroke="#16a34a" strokeWidth={2} dot={{ r: 3, fill: '#16a34a' }} activeDot={{ r: 5 }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Profit Chart */}
      <div className="rounded-xl p-3" style={{ background: '#e6eac8', border: '1px solid #b5c265' }}>
        <div className="text-xs font-semibold mb-3 px-1" style={{ color: '#2a7a40' }}>利潤趨勢</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data.map(d => ({ ...d, 利潤: d['營收'] - d['成本'] }))} margin={commonProps.margin}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" vertical={false} />
            <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? (v/1000)+'k' : v} width={36} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="利潤" radius={[4,4,0,0]} maxBarSize={32}
              fill="#16a34a"
              label={false}
              isAnimationActive={true}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #b5c265' }}>
        <div className="px-3 py-2" style={{ background: '#ffffff', borderBottom: '1px solid #b5c265' }}>
          <div className="grid grid-cols-4 text-xs font-semibold" style={{ color: '#5a6b20' }}>
            <span>期間</span>
            <span className="text-right" style={{ color: '#ef4444' }}>成本</span>
            <span className="text-right" style={{ color: '#16a34a' }}>營收</span>
            <span className="text-right">利潤</span>
          </div>
        </div>
        {data.map((d, i) => {
          const p = d['營收'] - d['成本']
          return (
            <div key={i} className="px-3 py-2" style={{ background: '#e6eac8', borderBottom: i < data.length-1 ? '1px solid #ffffff' : 'none' }}>
              <div className="grid grid-cols-4 text-xs">
                <span style={{ color: '#2a7a40' }}>{d.label}</span>
                <span className="text-right" style={{ color: '#ef4444' }}>{formatCurrency(d['成本'])}</span>
                <span className="text-right" style={{ color: '#16a34a' }}>{formatCurrency(d['營收'])}</span>
                <span className="text-right" style={{ color: p >= 0 ? '#2a7a40' : '#dc2626', fontWeight: 600 }}>{formatCurrency(p)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

```

## features/transaction/AddCostForm.jsx
```jsx
import React, { useState } from 'react'
import { insertTransaction } from '../../shared/lib/supabase.js'
import { COST_CATEGORIES } from '../../shared/theme.js'
import { format } from 'date-fns'

export default function AddCostForm({ date, onAdded, compact = false }) {
  const [category, setCategory] = useState(COST_CATEGORIES[0].value)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setError('請輸入有效金額')
      return
    }
    setLoading(true)
    setError('')
    try {
      await insertTransaction({
        date: format(date, 'yyyy-MM-dd'),
        type: 'cost',
        category,
        amount: Number(amount),
        note: note.trim(),
      })
      setAmount('')
      setNote('')
      onAdded && onAdded()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs mb-1" style={{ color: '#2a7a40' }}>類別</label>
        <div className="grid grid-cols-3 gap-1.5">
          {COST_CATEGORIES.map((cat) => (
            <button type="button" key={cat.value}
              onClick={() => setCategory(cat.value)}
              className="flex items-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: category === cat.value ? cat.color + '33' : '#ffffff',
                border: `1px solid ${category === cat.value ? cat.color : '#b5c265'}`,
                color: category === cat.value ? cat.color : '#2a7a40',
              }}>
              <span>{cat.icon}</span>
              <span className="truncate">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs mb-1" style={{ color: '#2a7a40' }}>金額（NT$）</label>
        <input type="number" step="0.01" min="0" placeholder="0"
          value={amount} onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
          style={{ background: '#ffffff', border: '1px solid #b5c265', color: '#1e2e08' }}
          onFocus={(e) => e.target.style.borderColor = '#16a34a'}
          onBlur={(e) => e.target.style.borderColor = '#b5c265'}
        />
      </div>
      <div>
        <label className="block text-xs mb-1" style={{ color: '#2a7a40' }}>備註（選填）</label>
        <input type="text" placeholder="備註..."
          value={note} onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
          style={{ background: '#ffffff', border: '1px solid #b5c265', color: '#1e2e08' }}
          onFocus={(e) => e.target.style.borderColor = '#16a34a'}
          onBlur={(e) => e.target.style.borderColor = '#b5c265'}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all active:scale-95"
        style={{ background: loading ? '#b5c265' : 'linear-gradient(135deg,#16a34a,#15803d)', color: '#f4f6e4' }}>
        {loading ? '新增中...' : '✓ 新增成本'}
      </button>
    </form>
  )
}

```

## features/transaction/AddRevenueForm.jsx
```jsx
import React, { useState } from 'react'
import { insertTransaction } from '../../shared/lib/supabase.js'
import { ICHEF_CHANNELS, DELIVERY_CHANNELS } from '../../shared/theme.js'
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
  const netAmount = isUber && uberDeduct
    ? Math.round(rawAmount * (1 - UBER_COMMISSION))
    : rawAmount
  const commission = rawAmount - netAmount

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || isNaN(amount) || rawAmount <= 0) {
      setError('請輸入有效金額')
      return
    }
    setLoading(true)
    setError('')

    let finalNote = note.trim()
    if (isUber && uberDeduct && rawAmount > 0) {
      const deductNote = `[Uber Eats 原始訂單: $${rawAmount.toLocaleString('zh-TW')} / 平台抽成 35%: -$${commission.toLocaleString('zh-TW')}]`
      finalNote = finalNote ? `${finalNote} ${deductNote}` : deductNote
    }

    try {
      await insertTransaction({
        date: format(date, 'yyyy-MM-dd'),
        type: 'revenue',
        category: channel,
        amount: netAmount,
        note: finalNote,
      })
      setAmount('')
      setNote('')
      onAdded && onAdded()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const selectChannel = (val) => {
    setChannel(val)
    setError('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">

      {/* iCHEF 門市 */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-xs font-semibold" style={{ color: '#16a34a' }}>🍽️ 門市營收 (iCHEF)</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {ICHEF_CHANNELS.map((ch) => (
            <button type="button" key={ch.value}
              onClick={() => selectChannel(ch.value)}
              className="flex flex-col items-center gap-0.5 px-1 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: channel === ch.value ? ch.color + '33' : '#ffffff',
                border: `1px solid ${channel === ch.value ? ch.color : '#b5c265'}`,
                color: channel === ch.value ? ch.color : '#2a7a40',
              }}>
              <span>{ch.icon}</span>
              <span className="truncate w-full text-center leading-tight">{ch.label}</span>
            </button>
          ))}
        </div>
        {channel === 'iCHEF 門市日結總額' && (
          <div className="mt-1 px-2 py-1 rounded-lg text-xs" style={{ background: '#ffffff', color: '#5a6b20' }}>
            💡 選擇日結總額後，無需再單獨記各支付細項
          </div>
        )}
      </div>

      {/* Uber Eats 外送 */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-xs font-semibold" style={{ color: '#d97706' }}>🛵 外送營收</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {DELIVERY_CHANNELS.map((ch) => (
            <button type="button" key={ch.value}
              onClick={() => selectChannel(ch.value)}
              className="flex flex-col items-center gap-0.5 px-1 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: channel === ch.value ? ch.color + '33' : '#ffffff',
                border: `1px solid ${channel === ch.value ? ch.color : '#b5c265'}`,
                color: channel === ch.value ? ch.color : '#2a7a40',
              }}>
              <span>{ch.icon}</span>
              <span className="truncate w-full text-center">{ch.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 金額 */}
      <div>
        <label className="block text-xs mb-1" style={{ color: '#2a7a40' }}>
          {isUber && uberDeduct ? '訂單金額（NT$，扣除佣金前）' : '金額（NT$）'}
        </label>
        <input type="number" step="1" min="0" placeholder="0"
          value={amount} onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
          style={{ background: '#ffffff', border: '1px solid #b5c265', color: '#1e2e08' }}
          onFocus={(e) => e.target.style.borderColor = '#16a34a'}
          onBlur={(e) => e.target.style.borderColor = '#b5c265'}
        />
      </div>

      {/* Uber Eats 扣除 Toggle */}
      {isUber && (
        <div className="rounded-lg p-3 space-y-2" style={{ background: '#ffffff', border: '1px solid #d9770633' }}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={uberDeduct} onChange={(e) => setUberDeduct(e.target.checked)}
              style={{ accentColor: '#d97706', width: 16, height: 16 }}
            />
            <span className="text-xs" style={{ color: '#d97706' }}>
              自動計算實收淨額（扣除 35% 平台佣金）
            </span>
          </label>
          {uberDeduct && rawAmount > 0 && (
            <div className="text-xs space-y-0.5 pl-6" style={{ color: '#5a6b20' }}>
              <div>訂單金額：<span style={{ color: '#1e2e08' }}>NT${rawAmount.toLocaleString('zh-TW')}</span></div>
              <div>平台抽成 35%：<span style={{ color: '#ef4444' }}>-NT${commission.toLocaleString('zh-TW')}</span></div>
              <div>實收淨額：<span style={{ color: '#16a34a', fontWeight: 700 }}>NT${netAmount.toLocaleString('zh-TW')}</span></div>
            </div>
          )}
        </div>
      )}

      {/* 備註 */}
      <div>
        <label className="block text-xs mb-1" style={{ color: '#2a7a40' }}>備註（選填）</label>
        <input type="text" placeholder="備註..."
          value={note} onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
          style={{ background: '#ffffff', border: '1px solid #b5c265', color: '#1e2e08' }}
          onFocus={(e) => e.target.style.borderColor = '#16a34a'}
          onBlur={(e) => e.target.style.borderColor = '#b5c265'}
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button type="submit" disabled={loading}
        className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all active:scale-95"
        style={{ background: loading ? '#b5c265' : 'linear-gradient(135deg,#16a34a,#15803d)', color: '#f4f6e4' }}>
        {loading ? '新增中...' : `✓ 新增營收${isUber && uberDeduct && netAmount > 0 ? `（NT$${netAmount.toLocaleString('zh-TW')}）` : ''}`}
      </button>
    </form>
  )
}

```

## features/transaction/QuickAddModal.jsx
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
        style={{ background: '#e6eac8', border: '1px solid #b5c265', maxHeight: '92vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🥟</span>
            <span className="font-bold" style={{ color: '#16a34a' }}>快速新增</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#ffffff', color: '#2a7a40' }}>
              今天 {today.getMonth()+1}/{today.getDate()}
            </span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style={{ background: '#ffffff', color: '#2a7a40' }}>✕</button>
        </div>

        {/* Tabs */}
        <div className="flex mx-4 mb-4 rounded-lg overflow-hidden" style={{ background: '#ffffff', border: '1px solid #b5c265' }}>
          {[
            ['cost', '💸 成本'],
            ['revenue', '💰 營收'],
            ['quick', '⚡ 打烊速記'],
          ].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className="flex-1 py-2 text-xs font-semibold transition-all"
              style={{
                background: tab === key ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'transparent',
                color: tab === key ? '#f4f6e4' : '#2a7a40',
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Form */}
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

## features/transaction/QuickTextParser.jsx
```jsx
import React, { useState } from 'react'
import { insertTransaction } from '../../shared/lib/supabase.js'
import { COST_CATEGORIES, REVENUE_CHANNELS } from '../../shared/theme.js'
import { format } from 'date-fns'

// 建立關鍵字對應表
const KEYWORD_MAP = []

for (const cat of COST_CATEGORIES) {
  KEYWORD_MAP.push({ keywords: [cat.value, cat.label], category: cat.value, type: 'cost' })
}
// 額外成本關鍵字
KEYWORD_MAP.push({ keywords: ['瓦斯', '桶裝瓦斯'], category: '桶裝瓦斯', type: 'cost' })
KEYWORD_MAP.push({ keywords: ['豬肉', '肉'], category: '豬肉', type: 'cost' })
KEYWORD_MAP.push({ keywords: ['餃子皮', '皮'], category: '餃子皮', type: 'cost' })
KEYWORD_MAP.push({ keywords: ['蔬菜', '菜'], category: '蔬菜', type: 'cost' })
KEYWORD_MAP.push({ keywords: ['紙類', '雜項', '紙'], category: '紙類雜項', type: 'cost' })

for (const ch of REVENUE_CHANNELS) {
  KEYWORD_MAP.push({ keywords: [ch.value, ch.label], category: ch.value, type: 'revenue' })
}
// 額外營收關鍵字
KEYWORD_MAP.push({ keywords: ['現金', '門市現金', '市現金'], category: '門市現金', type: 'revenue' })
KEYWORD_MAP.push({ keywords: ['line pay', 'linepay', 'line'], category: 'LINE Pay', type: 'revenue' })
KEYWORD_MAP.push({ keywords: ['全支付'], category: '全支付', type: 'revenue' })
KEYWORD_MAP.push({ keywords: ['台灣pay', '台灣 pay', '台灣pay'], category: '台灣 Pay', type: 'revenue' })
KEYWORD_MAP.push({ keywords: ['信用卡', '其他'], category: '信用卡/其他', type: 'revenue' })
KEYWORD_MAP.push({ keywords: ['uber', 'ubereats', 'uber eats', '外送'], category: 'Uber Eats 外送', type: 'revenue' })
KEYWORD_MAP.push({ keywords: ['ichef', 'i chef', '日結', '門市日結'], category: 'iCHEF 門市日結總額', type: 'revenue' })

function parseText(text) {
  const results = []
  // 以逗號或換行分割
  const segments = text.split(/[,，\n]+/).map(s => s.trim()).filter(Boolean)

  for (const seg of segments) {
    // 找數字
    const numMatch = seg.match(/(\d+(?:\.\d+)?)/)
    if (!numMatch) continue
    const amount = Number(numMatch[1])
    if (!amount) continue

    const lower = seg.toLowerCase().replace(/\s+/g, ' ')

    // 找最長關鍵字符合
    let matched = null
    let matchLen = 0
    for (const entry of KEYWORD_MAP) {
      for (const kw of entry.keywords) {
        if (lower.includes(kw.toLowerCase()) && kw.length > matchLen) {
          matched = entry
          matchLen = kw.length
        }
      }
    }

    if (matched) {
      results.push({ ...matched, amount, raw: seg })
    }
  }
  return results
}

export default function QuickTextParser({ date, onAdded, onClose }) {
  const [text, setText] = useState('')
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleParse = () => {
    setError('')
    setDone(false)
    const results = parseText(text)
    if (!results.length) {
      setError('無法解析任何項目，請確認格式（例：現金 3500, 豬肉 1500）')
      return
    }
    setPreview(results)
  }

  const handleSave = async () => {
    if (!preview?.length) return
    setLoading(true)
    setError('')
    try {
      for (const item of preview) {
        await insertTransaction({
          date: format(date, 'yyyy-MM-dd'),
          type: item.type,
          category: item.category,
          amount: item.amount,
          note: '',
        })
      }
      setDone(true)
      setText('')
      setPreview(null)
      onAdded && onAdded()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="text-xs px-1" style={{ color: '#5a6b20' }}>
        輸入格式範例：<span style={{ color: '#2a7a40' }}>門市現金 3500, LINE Pay 1800, Uber 2400, 豬肉 1500, 瓦斯 850</span>
      </div>

      <textarea
        rows={3}
        placeholder="門市現金 3500, LINE Pay 1800, Uber Eats 2400, 豬肉 1500, 瓦斯 850"
        value={text}
        onChange={(e) => { setText(e.target.value); setPreview(null); setDone(false) }}
        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
        style={{ background: '#ffffff', border: '1px solid #b5c265', color: '#1e2e08' }}
        onFocus={(e) => e.target.style.borderColor = '#16a34a'}
        onBlur={(e) => e.target.style.borderColor = '#b5c265'}
      />

      {!preview && (
        <button onClick={handleParse} disabled={!text.trim()}
          className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all active:scale-95"
          style={{ background: text.trim() ? 'linear-gradient(135deg,#d97706,#b45309)' : '#b5c265', color: '#f4f6e4' }}>
          ⚡ 解析
        </button>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      {preview && (
        <div className="space-y-2">
          <div className="text-xs font-semibold px-1" style={{ color: '#2a7a40' }}>解析結果（共 {preview.length} 筆）</div>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #b5c265' }}>
            {preview.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2"
                style={{ borderBottom: i < preview.length-1 ? '1px solid #ffffff' : 'none', background: '#e6eac8' }}>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{
                    background: item.type === 'revenue' ? '#16a34a22' : '#ef444422',
                    color: item.type === 'revenue' ? '#16a34a' : '#ef4444',
                  }}>
                    {item.type === 'revenue' ? '營' : '成'}
                  </span>
                  <span className="text-sm" style={{ color: '#1e2e08' }}>{item.category}</span>
                </div>
                <span className="text-sm font-semibold" style={{ color: item.type === 'revenue' ? '#16a34a' : '#ef4444' }}>
                  NT${item.amount.toLocaleString('zh-TW')}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setPreview(null)}
              className="flex-1 py-2.5 rounded-lg font-semibold text-sm"
              style={{ background: '#ffffff', color: '#2a7a40', border: '1px solid #b5c265' }}>
              重新輸入
            </button>
            <button onClick={handleSave} disabled={loading}
              className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all active:scale-95"
              style={{ background: loading ? '#b5c265' : 'linear-gradient(135deg,#16a34a,#15803d)', color: '#f4f6e4' }}>
              {loading ? '儲存中...' : '✓ 確認儲存'}
            </button>
          </div>
        </div>
      )}

      {done && (
        <div className="text-center text-sm py-2" style={{ color: '#16a34a' }}>✓ 全部儲存成功！</div>
      )}
    </div>
  )
}

```

## features/inventory/InventoryPage.jsx
```jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../../shared/lib/supabase.js'

const CAT_ICONS = {
  '水餃類': '🥟',
  '醬料類': '🫙',
  '餐具類': '🍴',
  '飲品類': '🧃',
  '葉菜類': '🥬',
  '麵糰類': '🫓',
  '雜項類': '📦',
}

const STATUS_COLORS = {
  high:   { bg: '#dcfce7', text: '#15803d', label: '充足' },
  medium: { bg: '#fef9c3', text: '#854d0e', label: '偏低' },
  low:    { bg: '#fee2e2', text: '#dc2626', label: '不足' },
  out:    { bg: '#f3f4f6', text: '#6b7280', label: '缺貨' },
}

function getStatus(qty, minQty) {
  if (qty <= 0) return 'out'
  if (minQty && qty <= minQty) return 'low'
  if (minQty && qty <= minQty * 2) return 'medium'
  return 'high'
}

export default function InventoryPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterCat, setFilterCat] = useState('全部')
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function fetchInventory() {
      setLoading(true)
      const { data } = await supabase
        .from('inventory')
        .select('*')
        .order('cat', { ascending: true })
      setItems(data || [])
      setLoading(false)
    }
    fetchInventory()
  }, [])

  const categories = ['全部', ...new Set(items.map(i => i.cat).filter(Boolean))]

  const filtered = items.filter(item => {
    const matchCat = filterCat === '全部' || item.cat === filterCat
    const matchSearch = !search || item.name?.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const total = items.length
  const outCount = items.filter(i => i.qty <= 0).length
  const lowCount = items.filter(i => i.qty > 0 && i.min_qty && i.qty <= i.min_qty).length
  const okCount = total - outCount - lowCount

  return (
    <div className="min-h-screen pb-24" style={{ background: '#f4f6e4' }}>
      {/* Header */}
      <div className="px-4 pt-5 pb-3" style={{ background: '#e6eac8', borderBottom: '1px solid #b5c265' }}>
        <h1 className="text-lg font-bold" style={{ color: '#1e2e08' }}>📦 庫存狀態</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 px-4 py-3">
        {[
          { label: '總種類', value: total, color: '#1e2e08', bg: '#fff' },
          { label: '庫存低', value: lowCount, color: '#854d0e', bg: '#fef9c3' },
          { label: '缺貨', value: outCount, color: '#dc2626', bg: '#fee2e2' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="rounded-xl p-3 text-center shadow-sm" style={{ background: bg, border: '1px solid #b5c265' }}>
            <div className="text-xs mb-1" style={{ color: '#5a6b20' }}>{label}</div>
            <div className="text-xl font-bold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="px-4 mb-2">
        <input
          type="text"
          placeholder="搜尋食材..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: '#fff', border: '1px solid #b5c265', color: '#1e2e08' }}
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{
              background: filterCat === cat ? '#16a34a' : '#fff',
              color: filterCat === cat ? '#fff' : '#5a6b20',
              border: '1px solid #b5c265',
            }}
          >
            {cat === '全部' ? cat : `${CAT_ICONS[cat] || ''} ${cat}`}
          </button>
        ))}
      </div>

      {/* Items List */}
      {loading ? (
        <div className="flex justify-center py-12 text-sm" style={{ color: '#5a6b20' }}>載入中...</div>
      ) : (
        <div className="px-4 space-y-2">
          {filtered.map(item => {
            const status = getStatus(item.qty, item.min_qty)
            const s = STATUS_COLORS[status]
            return (
              <div key={item.id} className="flex items-center justify-between px-4 py-3 rounded-xl shadow-sm"
                style={{ background: '#fff', border: '1px solid #b5c265' }}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{CAT_ICONS[item.cat] || '📦'}</span>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: '#1e2e08' }}>{item.name}</div>
                    <div className="text-xs" style={{ color: '#5a6b20' }}>{item.cat}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: '#1e2e08' }}>
                    {item.qty} {item.unit || ''}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: s.bg, color: s.text }}>
                    {s.label}
                  </span>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="text-center py-10 text-sm" style={{ color: '#5a6b20' }}>沒有符合的食材</div>
          )}
        </div>
      )}
    </div>
  )
}

```

## features/staff/StaffPage.jsx
```jsx
import React, { useState, useEffect, useCallback } from 'react'
import { format, startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval, isSameDay, parseISO } from 'date-fns'
import { supabase } from '../../shared/lib/supabase.js'

const LEAVE_TYPES = ['特休', '病假', '事假', '補休', '其他']

// ── helpers ──────────────────────────────────────────────
function calcHours(start, end) {
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60)
}

// ── sub-components ───────────────────────────────────────

function EmployeeTab({ employees, onRefresh }) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    if (!name.trim()) return
    await supabase.from('employees').insert([{ name: name.trim(), role: role.trim() }])
    setName(''); setRole(''); setAdding(false)
    onRefresh()
  }

  const handleDelete = async (id) => {
    if (!window.confirm('確定刪除這位員工？相關工時和請假紀錄也會一併刪除。')) return
    await supabase.from('employees').delete().eq('id', id)
    onRefresh()
  }

  return (
    <div className="space-y-3">
      <button onClick={() => setAdding(true)}
        className="w-full py-2.5 rounded-xl text-sm font-semibold"
        style={{ background: '#16a34a', color: '#fff' }}>
        + 新增員工
      </button>

      {adding && (
        <div className="rounded-xl p-4 space-y-2" style={{ background: '#fff', border: '1px solid #b5c265' }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="姓名*"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: '#f4f6e4', border: '1px solid #b5c265', color: '#1e2e08' }} />
          <input value={role} onChange={e => setRole(e.target.value)} placeholder="職位（選填）"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: '#f4f6e4', border: '1px solid #b5c265', color: '#1e2e08' }} />
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="flex-1 py-2 rounded-lg text-sm"
              style={{ background: '#f4f6e4', color: '#5a6b20', border: '1px solid #b5c265' }}>取消</button>
            <button onClick={handleAdd} className="flex-1 py-2 rounded-lg text-sm font-semibold"
              style={{ background: '#16a34a', color: '#fff' }}>儲存</button>
          </div>
        </div>
      )}

      {employees.map(emp => (
        <div key={emp.id} className="flex items-center justify-between px-4 py-3 rounded-xl"
          style={{ background: '#fff', border: '1px solid #b5c265' }}>
          <div>
            <div className="font-semibold text-sm" style={{ color: '#1e2e08' }}>👤 {emp.name}</div>
            {emp.role && <div className="text-xs" style={{ color: '#5a6b20' }}>{emp.role}</div>}
          </div>
          <button onClick={() => handleDelete(emp.id)}
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ background: '#fee2e2', color: '#dc2626' }}>✕</button>
        </div>
      ))}
    </div>
  )
}

function HoursTab({ employees }) {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [empId, setEmpId] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [note, setNote] = useState('')
  const [records, setRecords] = useState([])

  const fetchRecords = useCallback(async () => {
    const { data } = await supabase
      .from('work_hours')
      .select('*, employees(name)')
      .eq('date', date)
      .order('created_at', { ascending: false })
    setRecords(data || [])
  }, [date])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  const handleSave = async () => {
    if (!empId || !date) return
    const hours = start && end ? calcHours(start, end) : 0
    await supabase.from('work_hours').insert([{
      employee_id: Number(empId), date, start_time: start || null,
      end_time: end || null, hours, note: note.trim() || null
    }])
    setStart(''); setEnd(''); setNote(''); setEmpId('')
    fetchRecords()
  }

  return (
    <div className="space-y-4">
      {/* Input Card */}
      <div className="rounded-xl p-4 space-y-3" style={{ background: '#fff', border: '1px solid #b5c265' }}>
        <div className="text-sm font-semibold" style={{ color: '#1e2e08' }}>記錄工時</div>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: '#f4f6e4', border: '1px solid #b5c265', color: '#1e2e08' }} />
        <select value={empId} onChange={e => setEmpId(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: '#f4f6e4', border: '1px solid #b5c265', color: '#1e2e08' }}>
          <option value="">選擇員工</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <div className="flex gap-2">
          <div className="flex-1">
            <div className="text-xs mb-1" style={{ color: '#5a6b20' }}>上班時間</div>
            <input type="time" value={start} onChange={e => setStart(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: '#f4f6e4', border: '1px solid #b5c265', color: '#1e2e08' }} />
          </div>
          <div className="flex-1">
            <div className="text-xs mb-1" style={{ color: '#5a6b20' }}>下班時間</div>
            <input type="time" value={end} onChange={e => setEnd(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: '#f4f6e4', border: '1px solid #b5c265', color: '#1e2e08' }} />
          </div>
        </div>
        {start && end && (
          <div className="text-sm text-center font-semibold" style={{ color: '#16a34a' }}>
            共 {calcHours(start, end).toFixed(1)} 小時
          </div>
        )}
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="備註（選填）"
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: '#f4f6e4', border: '1px solid #b5c265', color: '#1e2e08' }} />
        <button onClick={handleSave}
          className="w-full py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: '#16a34a', color: '#fff' }}>儲存</button>
      </div>

      {/* Records */}
      {records.length > 0 && (
        <div>
          <div className="text-xs font-semibold mb-2 px-1" style={{ color: '#5a6b20' }}>{date} 的紀錄</div>
          {records.map(r => (
            <div key={r.id} className="flex items-center justify-between px-4 py-3 rounded-xl mb-2"
              style={{ background: '#fff', border: '1px solid #b5c265' }}>
              <div>
                <div className="font-semibold text-sm" style={{ color: '#1e2e08' }}>{r.employees?.name}</div>
                <div className="text-xs" style={{ color: '#5a6b20' }}>
                  {r.start_time?.slice(0,5)} – {r.end_time?.slice(0,5)}
                  {r.note ? ` ・ ${r.note}` : ''}
                </div>
              </div>
              <div className="font-bold text-sm" style={{ color: '#16a34a' }}>{Number(r.hours).toFixed(1)}h</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ChartTab({ employees }) {
  const [month, setMonth] = useState(new Date())
  const [data, setData] = useState([])

  useEffect(() => {
    async function fetch() {
      const start = format(startOfMonth(month), 'yyyy-MM-dd')
      const end = format(endOfMonth(month), 'yyyy-MM-dd')
      const { data: rows } = await supabase
        .from('work_hours')
        .select('employee_id, hours, employees(name)')
        .gte('date', start).lte('date', end)
      // aggregate by employee
      const map = {}
      for (const r of rows || []) {
        const name = r.employees?.name || '?'
        map[name] = (map[name] || 0) + Number(r.hours)
      }
      setData(Object.entries(map).map(([name, hours]) => ({ name, hours })))
    }
    fetch()
  }, [month])

  const maxH = Math.max(...data.map(d => d.hours), 1)

  return (
    <div className="space-y-4">
      {/* Month Nav */}
      <div className="flex items-center justify-between px-2">
        <button onClick={() => setMonth(m => subMonths(m, 1))}
          className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ background: '#fff', border: '1px solid #b5c265', color: '#5a6b20' }}>‹</button>
        <span className="font-semibold text-sm" style={{ color: '#1e2e08' }}>{format(month, 'yyyy 年 M 月')}</span>
        <button onClick={() => setMonth(m => addMonths(m, 1))}
          className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ background: '#fff', border: '1px solid #b5c265', color: '#5a6b20' }}>›</button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: '#5a6b20' }}>本月尚無工時紀錄</div>
      ) : (
        <div className="rounded-xl p-4 space-y-4" style={{ background: '#fff', border: '1px solid #b5c265' }}>
          <div className="text-sm font-semibold" style={{ color: '#1e2e08' }}>月工時統計</div>
          {data.map(({ name, hours }) => (
            <div key={name}>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: '#1e2e08' }}>{name}</span>
                <span className="font-bold" style={{ color: '#16a34a' }}>{hours.toFixed(1)} h</span>
              </div>
              <div className="h-4 rounded-full overflow-hidden" style={{ background: '#f4f6e4' }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${(hours / maxH) * 100}%`, background: 'linear-gradient(90deg, #16a34a, #4ade80)' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function LeaveTab({ employees }) {
  const [empId, setEmpId] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [type, setType] = useState(LEAVE_TYPES[0])
  const [note, setNote] = useState('')
  const [leaves, setLeaves] = useState([])

  const fetchLeaves = useCallback(async () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const { data } = await supabase
      .from('leaves')
      .select('*, employees(name)')
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(20)
    setLeaves(data || [])
  }, [])

  useEffect(() => { fetchLeaves() }, [fetchLeaves])

  const handleSave = async () => {
    if (!empId || !date) return
    await supabase.from('leaves').insert([{
      employee_id: Number(empId), date, leave_type: type, note: note.trim() || null
    }])
    setEmpId(''); setNote(''); fetchLeaves()
  }

  const handleDelete = async (id) => {
    await supabase.from('leaves').delete().eq('id', id)
    fetchLeaves()
  }

  const today = format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="space-y-4">
      {/* Input */}
      <div className="rounded-xl p-4 space-y-3" style={{ background: '#fff', border: '1px solid #b5c265' }}>
        <div className="text-sm font-semibold" style={{ color: '#1e2e08' }}>新增請假</div>
        <select value={empId} onChange={e => setEmpId(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: '#f4f6e4', border: '1px solid #b5c265', color: '#1e2e08' }}>
          <option value="">選擇員工</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: '#f4f6e4', border: '1px solid #b5c265', color: '#1e2e08' }} />
        <select value={type} onChange={e => setType(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: '#f4f6e4', border: '1px solid #b5c265', color: '#1e2e08' }}>
          {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="備註（選填）"
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: '#f4f6e4', border: '1px solid #b5c265', color: '#1e2e08' }} />
        <button onClick={handleSave}
          className="w-full py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: '#16a34a', color: '#fff' }}>儲存</button>
      </div>

      {/* Upcoming Leaves */}
      <div>
        <div className="text-xs font-semibold mb-2 px-1" style={{ color: '#5a6b20' }}>即將請假提醒</div>
        {leaves.length === 0 ? (
          <div className="text-center py-8 text-sm" style={{ color: '#5a6b20' }}>暫無請假紀錄</div>
        ) : leaves.map(l => {
          const isToday = l.date === today
          return (
            <div key={l.id} className="flex items-center justify-between px-4 py-3 rounded-xl mb-2"
              style={{ background: isToday ? '#fef9c3' : '#fff', border: `1px solid ${isToday ? '#d97706' : '#b5c265'}` }}>
              <div>
                <div className="font-semibold text-sm" style={{ color: '#1e2e08' }}>
                  {isToday ? '📅 今天 · ' : ''}{l.employees?.name}
                </div>
                <div className="text-xs" style={{ color: '#5a6b20' }}>
                  {l.date} ・ {l.leave_type}{l.note ? ` ・ ${l.note}` : ''}
                </div>
              </div>
              <button onClick={() => handleDelete(l.id)}
                className="w-7 h-7 flex items-center justify-center rounded-full text-xs"
                style={{ background: '#fee2e2', color: '#dc2626' }}>✕</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────
export default function StaffPage() {
  const [tab, setTab] = useState('employees')
  const [employees, setEmployees] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchEmployees = useCallback(async () => {
    const { data } = await supabase.from('employees').select('*').order('created_at')
    setEmployees(data || [])
  }, [])

  useEffect(() => { fetchEmployees() }, [fetchEmployees, refreshKey])

  const tabs = [
    { key: 'employees', label: '員工' },
    { key: 'hours', label: '工時' },
    { key: 'chart', label: '圖表' },
    { key: 'leave', label: '請假' },
  ]

  return (
    <div className="min-h-screen pb-24" style={{ background: '#f4f6e4' }}>
      <div className="px-4 pt-5 pb-3" style={{ background: '#e6eac8', borderBottom: '1px solid #b5c265' }}>
        <h1 className="text-lg font-bold" style={{ color: '#1e2e08' }}>👥 員工管理</h1>
      </div>

      {/* Tabs */}
      <div className="flex mx-4 mt-3 mb-4 rounded-xl overflow-hidden" style={{ background: '#e6eac8', border: '1px solid #b5c265' }}>
        {tabs.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex-1 py-2 text-xs font-semibold"
            style={{
              background: tab === key ? '#16a34a' : 'transparent',
              color: tab === key ? '#fff' : '#5a6b20',
            }}>
            {label}
          </button>
        ))}
      </div>

      <div className="px-4">
        {tab === 'employees' && <EmployeeTab employees={employees} onRefresh={() => setRefreshKey(k => k + 1)} />}
        {tab === 'hours' && <HoursTab employees={employees} />}
        {tab === 'chart' && <ChartTab employees={employees} />}
        {tab === 'leave' && <LeaveTab employees={employees} />}
      </div>
    </div>
  )
}

```
