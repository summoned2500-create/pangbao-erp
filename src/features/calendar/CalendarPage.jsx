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
