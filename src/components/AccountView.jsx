import React from 'react'
import { format } from 'date-fns'
import { formatCurrency, getCostCategory, getRevenueChannel } from '../theme.js'

export default function AccountView({ entries, onDelete, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="text-sm" style={{ color: '#4b7a56' }}>載入中...</div>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2">
        <span className="text-3xl">📭</span>
        <div className="text-sm" style={{ color: '#4b7a56' }}>此期間沒有資料</div>
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
                <span className="text-sm font-bold" style={{ color: '#4ade80' }}>
                  {format(d, 'M/d')}
                </span>
                <span className="text-xs" style={{ color: '#4b7a56' }}>
                  {['週日','週一','週二','週三','週四','週五','週六'][d.getDay()]}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                {dayCost > 0 && <span style={{ color: '#fca5a5' }}>-{formatCurrency(dayCost)}</span>}
                {dayRevenue > 0 && <span style={{ color: '#4ade80' }}>+{formatCurrency(dayRevenue)}</span>}
                <span style={{ color: dayProfit >= 0 ? '#86efac' : '#f87171', fontWeight: 600 }}>
                  {dayProfit >= 0 ? '▲' : '▼'}{formatCurrency(Math.abs(dayProfit))}
                </span>
              </div>
            </div>

            {/* Entries */}
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #2d4a32' }}>
              {dayEntries.map((e, i) => {
                const isCost = e.type === 'cost'
                const meta = isCost ? getCostCategory(e.category) : getRevenueChannel(e.channel)
                return (
                  <div key={e.id} className="flex items-center justify-between px-3 py-2.5"
                    style={{
                      background: '#122018',
                      borderBottom: i < dayEntries.length-1 ? '1px solid #1a2e1f' : 'none',
                    }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                        style={{ background: isCost ? '#2d1a1a' : '#1a2d1a' }}>
                        {meta.icon}
                      </div>
                      <div>
                        <div className="text-sm" style={{ color: '#e2f5e8' }}>
                          {isCost ? e.category : e.channel}
                        </div>
                        {e.note && <div className="text-xs" style={{ color: '#4b7a56' }}>{e.note}</div>}
                        <div className="text-xs" style={{ color: '#2d4a32' }}>
                          {isCost ? '成本' : '營收'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-sm" style={{ color: isCost ? '#fca5a5' : '#4ade80' }}>
                        {isCost ? '-' : '+'}{formatCurrency(e.amount)}
                      </div>
                      <button onClick={() => onDelete(e.id, e.type)}
                        className="w-7 h-7 flex items-center justify-center rounded-full transition-colors"
                        style={{ background: '#2d1a1a', color: '#f87171' }}>
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
