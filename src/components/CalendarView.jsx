import React from 'react'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { formatCurrency } from '../theme.js'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export default function CalendarView({ currentMonth, dailyData, selectedDate, onSelectDate }) {
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart)
  const calEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #2d4a32' }}>
      {/* Weekday headers */}
      <div className="grid grid-cols-7" style={{ background: '#1a2e1f' }}>
        {WEEKDAYS.map((d, i) => (
          <div key={d} className="py-2 text-center text-xs font-semibold"
            style={{ color: i === 0 ? '#fca5a5' : i === 6 ? '#93c5fd' : '#86efac' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7" style={{ background: '#122018' }}>
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
                background: isSelected ? '#243d28' : 'transparent',
                borderBottom: '1px solid #1a2e1f',
                opacity: inMonth ? 1 : 0.25,
                cursor: inMonth ? 'pointer' : 'default',
              }}>
              {/* Date number */}
              <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-0.5`}
                style={{
                  background: todayDay ? '#4ade80' : 'transparent',
                  color: todayDay ? '#0a1a0f' : isSelected ? '#4ade80' : dayOfWeek === 0 ? '#fca5a5' : dayOfWeek === 6 ? '#93c5fd' : '#e2f5e8',
                  fontWeight: todayDay || isSelected ? 700 : 400,
                }}>
                {format(day, 'd')}
              </div>

              {/* Daily data */}
              {data && inMonth && (
                <div className="w-full px-0.5 space-y-0.5">
                  {data.revenue > 0 && (
                    <div className="text-center text-xs leading-tight rounded" style={{ color: '#4ade80', fontSize: '9px' }}>
                      +{data.revenue >= 1000 ? (data.revenue/1000).toFixed(1)+'k' : data.revenue}
                    </div>
                  )}
                  {data.cost > 0 && (
                    <div className="text-center text-xs leading-tight rounded" style={{ color: '#fca5a5', fontSize: '9px' }}>
                      -{data.cost >= 1000 ? (data.cost/1000).toFixed(1)+'k' : data.cost}
                    </div>
                  )}
                  {profit !== null && (data.revenue > 0 || data.cost > 0) && (
                    <div className="text-center text-xs leading-tight rounded" style={{
                      color: profit >= 0 ? '#86efac' : '#f87171',
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
