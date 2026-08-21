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
    <div className="flex flex-col min-h-full" style={{ background: '#0a1a0f' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3" style={{ background: '#122018', borderBottom: '1px solid #2d4a32' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🥟</span>
            <span className="text-lg font-bold" style={{ color: '#4ade80' }}>胖寶 ERP</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
              style={{ background: '#1a2e1f', color: '#86efac' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <span className="text-sm font-semibold w-20 text-center" style={{ color: '#e2f5e8' }}>
              {format(currentMonth, 'yyyy/MM')}
            </span>
            <button onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
              style={{ background: '#1a2e1f', color: '#86efac' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
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
            <div className="text-sm" style={{ color: '#4b7a56' }}>載入中...</div>
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

      <div className="flex items-center justify-center gap-4 pb-4 text-xs" style={{ color: '#4b7a56' }}>
        <span className="flex items-center gap-1"><span style={{ color: '#4ade80' }}>+</span>營收</span>
        <span className="flex items-center gap-1"><span style={{ color: '#fca5a5' }}>-</span>成本</span>
        <span className="flex items-center gap-1"><span style={{ color: '#86efac' }}>▲</span>利潤</span>
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
