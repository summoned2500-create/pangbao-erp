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
