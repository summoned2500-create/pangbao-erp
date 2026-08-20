import React, { useState, useEffect, useCallback } from 'react'
import { format, subDays, startOfMonth } from 'date-fns'
import { supabase } from '../supabase.js'
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
  const [filter, setFilter] = useState('all') // all | cost | revenue

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
    const [{ data: costs }, { data: revenues }] = await Promise.all([
      supabase.from('cost_entries').select('*').gte('date', fromDate).lte('date', toDate).order('date', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('revenue_entries').select('*').gte('date', fromDate).lte('date', toDate).order('date', { ascending: false }).order('created_at', { ascending: false }),
    ])
    const costItems = (costs || []).map(e => ({ ...e, type: 'cost' }))
    const revenueItems = (revenues || []).map(e => ({ ...e, type: 'revenue' }))
    const merged = [...costItems, ...revenueItems].sort((a, b) => b.date.localeCompare(a.date) || b.created_at?.localeCompare(a.created_at || '') || 0)
    setEntries(merged)
    setLoading(false)
  }, [fromDate, toDate])

  useEffect(() => { fetchData() }, [fetchData, refreshKey])

  const handleDelete = async (id, type) => {
    const table = type === 'cost' ? 'cost_entries' : 'revenue_entries'
    await supabase.from(table).delete().eq('id', id)
    fetchData()
  }

  const filtered = filter === 'all' ? entries : entries.filter(e => e.type === filter)
  const totalCost = entries.filter(e => e.type === 'cost').reduce((s, e) => s + Number(e.amount), 0)
  const totalRevenue = entries.filter(e => e.type === 'revenue').reduce((s, e) => s + Number(e.amount), 0)
  const profit = totalRevenue - totalCost

  return (
    <div style={{ background: '#0a1a0f', minHeight: '100%' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3" style={{ background: '#122018', borderBottom: '1px solid #2d4a32' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">📒</span>
          <span className="text-lg font-bold" style={{ color: '#4ade80' }}>帳戶明細</span>
        </div>

        {/* Range picker */}
        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
          {RANGES.map((r, i) => (
            <button key={r.label} onClick={() => applyRange(i)}
              className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all"
              style={{
                background: rangeIdx === i ? '#4ade80' : '#1a2e1f',
                color: rangeIdx === i ? '#0a1a0f' : '#86efac',
                border: rangeIdx === i ? 'none' : '1px solid #2d4a32',
              }}>
              {r.label}
            </button>
          ))}
        </div>

        {/* Custom date inputs */}
        {rangeIdx === 3 && (
          <div className="flex gap-2 mb-3">
            {[['from', fromDate, setFromDate], ['to', toDate, setToDate]].map(([key, val, set]) => (
              <input key={key} type="date" value={val}
                onChange={(e) => { set(e.target.value) }}
                className="flex-1 rounded-lg px-2 py-1.5 text-xs outline-none"
                style={{ background: '#1a2e1f', border: '1px solid #2d4a32', color: '#e2f5e8' }}
              />
            ))}
          </div>
        )}

        {/* Summary */}
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

      {/* Filter tabs */}
      <div className="flex gap-1.5 px-3 pt-3 pb-2">
        {[['all','全部'],['cost','成本'],['revenue','營收']].map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: filter === key ? '#4ade80' : '#1a2e1f',
              color: filter === key ? '#0a1a0f' : '#86efac',
              border: filter === key ? 'none' : '1px solid #2d4a32',
            }}>
            {label}
            {key !== 'all' && <span className="ml-1 opacity-70">
              ({key === 'cost' ? entries.filter(e=>e.type==='cost').length : entries.filter(e=>e.type==='revenue').length})
            </span>}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="px-3 pb-4">
        <AccountView entries={filtered} onDelete={handleDelete} loading={loading} />
      </div>
    </div>
  )
}
