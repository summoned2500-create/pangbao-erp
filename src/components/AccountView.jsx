import React from 'react'
import { format } from 'date-fns'
import { formatCurrency, getCostCategory, getRevenueChannel } from '../theme.js'

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
