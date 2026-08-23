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
  const [mainTab, setMainTab] = useState('assets')
  const [accounts, setAccounts] = useState([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [editingAcc, setEditingAcc] = useState(null)
  const [editBalance, setEditBalance] = useState('')

  const [rangeIdx, setRangeIdx] = useState(0)
  const [fromDate, setFromDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [entries, setEntries] = useState([])
  const [loadingEntries, setLoadingEntries] = useState(true)
  const [filter, setFilter] = useState('all')

  const fetchAccounts = useCallback(async () => {
    setLoadingAccounts(true)
    const { data } = await supabase.from('accounts').select('*').order('type')
    setAccounts(data || [])
    setLoadingAccounts(false)
  }, [])

  const fetchEntries = useCallback(async () => {
    setLoadingEntries(true)
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .gte('date', fromDate)
      .lte('date', toDate)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    setEntries(data || [])
    setLoadingEntries(false)
  }, [fromDate, toDate])

  useEffect(() => {
    fetchAccounts()
    fetchEntries()
  }, [fetchAccounts, fetchEntries, refreshKey])

  const applyRange = (idx) => {
    setRangeIdx(idx)
    if (RANGES[idx].getValue) {
      const { from, to } = RANGES[idx].getValue()
      setFromDate(from)
      setToDate(to)
    }
  }

  const handleSaveBalance = async (e) => {
    e.preventDefault()
    if (!editingAcc) return
    await supabase.from('accounts').update({ balance: Number(editBalance) || 0 }).eq('id', editingAcc.id)
    setEditingAcc(null)
    setEditBalance('')
    fetchAccounts()
  }

  const handleDelete = async (id) => {
    if (window.confirm('確定要刪除這筆紀錄嗎？')) {
      try {
        await deleteTransaction(id)
        fetchEntries()
      } catch (err) {
        alert('刪除失敗：' + err.message)
      }
    }
  }

  const totalAssets = accounts.filter(a => a.type !== 'credit').reduce((s, a) => s + Number(a.balance), 0)
  const totalLiabilities = accounts.filter(a => a.type === 'credit').reduce((s, a) => s + Math.abs(Number(a.balance)), 0)
  const netAssets = totalAssets - totalLiabilities

  const totalCost = entries.filter(e => e.type === 'cost').reduce((s, e) => s + Number(e.amount), 0)
  const totalRevenue = entries.filter(e => e.type === 'revenue').reduce((s, e) => s + Number(e.amount), 0)
  const profit = totalRevenue - totalCost

  const exportCSV = () => {
    const BOM = '﻿'
    const headers = '日期,類型,類別項目,金額,備註'
    const rows = entries.filter(e => filter === 'all' || e.type === filter).map(e => [
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

  const filteredEntries = filter === 'all' ? entries : entries.filter(e => e.type === filter)

  return (
    <div style={{ background: '#f4f6e4', minHeight: '100%' }}>
      <div className="px-4 pt-4 pb-2" style={{ background: '#e6eac8', borderBottom: '1px solid #b5c265' }}>
        <div className="flex mx-2 mb-3 rounded-xl overflow-hidden shadow-sm" style={{ background: '#ffffff', border: '1px solid #b5c265' }}>
          <button onClick={() => setMainTab('assets')} className="flex-1 py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            style={{ background: mainTab === 'assets' ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'transparent', color: mainTab === 'assets' ? '#ffffff' : '#2a7a40' }}>
            <span>💼</span> 帳戶資產
          </button>
          <button onClick={() => setMainTab('details')} className="flex-1 py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            style={{ background: mainTab === 'details' ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'transparent', color: mainTab === 'details' ? '#ffffff' : '#2a7a40' }}>
            <span>📋</span> 交易明細
          </button>
        </div>
      </div>

      {mainTab === 'assets' && (
        <div className="p-4 space-y-4">
          <div className="rounded-2xl p-4 shadow-sm" style={{ background: '#ffffff', border: '1px solid #b5c265' }}>
            <div className="text-xs font-medium mb-1" style={{ color: '#5a6b20' }}>淨資產</div>
            <div className="text-2xl font-bold mb-4" style={{ color: '#1e2e08' }}>{formatCurrency(netAssets)}</div>
            <div className="grid grid-cols-3 gap-2 pt-3" style={{ borderTop: '1px solid #f4f6e4' }}>
              <div>
                <div className="text-[11px]" style={{ color: '#5a6b20' }}>總資產</div>
                <div className="text-xs font-bold" style={{ color: '#16a34a' }}>{formatCurrency(totalAssets)}</div>
              </div>
              <div>
                <div className="text-[11px]" style={{ color: '#5a6b20' }}>負債</div>
                <div className="text-xs font-bold" style={{ color: '#ef4444' }}>{formatCurrency(totalLiabilities)}</div>
              </div>
              <div>
                <div className="text-[11px]" style={{ color: '#5a6b20' }}>本月收支</div>
                <div className="text-xs font-bold" style={{ color: profit >= 0 ? '#16a34a' : '#ef4444' }}>
                  {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                </div>
              </div>
            </div>
          </div>

          {editingAcc && (
            <form onSubmit={handleSaveBalance} className="p-4 rounded-xl space-y-3 shadow-md" style={{ background: '#ffffff', border: '1.5px solid #16a34a' }}>
              <div className="flex justify-between items-center text-xs font-bold" style={{ color: '#1e2e08' }}>
                <span>調整【{editingAcc.name}】目前餘額</span>
                <button type="button" onClick={() => setEditingAcc(null)} className="text-gray-400">✕</button>
              </div>
              <input type="number" step="1" required placeholder="輸入最新金額" value={editBalance} onChange={e => setEditBalance(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none border" style={{ background: '#f4f6e4', borderColor: '#b5c265', color: '#1e2e08' }} autoFocus />
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditingAcc(null)} className="flex-1 py-1.5 rounded-lg text-xs" style={{ background: '#f4f6e4', color: '#5a6b20' }}>取消</button>
                <button type="submit" className="flex-1 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: '#16a34a' }}>儲存餘額</button>
              </div>
            </form>
          )}

          {loadingAccounts ? (
            <div className="text-center py-10 text-xs" style={{ color: '#5a6b20' }}>載入帳戶中...</div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-10 text-xs" style={{ color: '#5a6b20' }}>尚未建立帳戶（請先在 Supabase 建立 accounts 資料表）</div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs font-bold px-1" style={{ color: '#2a7a40' }}>帳戶清單</div>
              <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: '1px solid #b5c265' }}>
                {accounts.map((acc, i) => (
                  <div key={acc.id} className="flex items-center justify-between px-4 py-3.5"
                    style={{ background: '#ffffff', borderBottom: i < accounts.length - 1 ? '1px solid #f4f6e4' : 'none' }}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{acc.icon || '💰'}</span>
                      <div>
                        <div className="font-semibold text-sm" style={{ color: '#1e2e08' }}>{acc.name}</div>
                        <div className="text-[11px]" style={{ color: '#5a6b20' }}>
                          {acc.type === 'cash' ? '現金帳戶' : acc.type === 'bank' ? '金融帳戶' : acc.type === 'credit' ? '信用卡' : '週轉帳戶'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm" style={{ color: acc.type === 'credit' ? '#ef4444' : '#1e2e08' }}>
                        {formatCurrency(acc.balance)}
                      </span>
                      <button onClick={() => { setEditingAcc(acc); setEditBalance(acc.balance) }}
                        className="px-2 py-1 rounded-lg text-[11px] font-semibold"
                        style={{ background: '#e6eac8', color: '#2a7a40' }}>調整</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {mainTab === 'details' && (
        <div>
          <div className="px-4 py-3" style={{ background: '#e6eac8', borderBottom: '1px solid #b5c265' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold" style={{ color: '#16a34a' }}>期間篩選與匯出</span>
              <button onClick={exportCSV} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: '#ffffff', color: '#2a7a40', border: '1px solid #b5c265' }}>
                ↓ 匯出 CSV
              </button>
            </div>
            <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
              {RANGES.map((r, i) => (
                <button key={r.label} onClick={() => applyRange(i)} className="px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ background: rangeIdx === i ? '#16a34a' : '#ffffff', color: rangeIdx === i ? '#ffffff' : '#2a7a40', border: rangeIdx === i ? 'none' : '1px solid #b5c265' }}>
                  {r.label}
                </button>
              ))}
            </div>
            {rangeIdx === 3 && (
              <div className="flex gap-2 mb-3">
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="flex-1 rounded-lg px-2 py-1 text-xs border outline-none" style={{ background: '#fff', borderColor: '#b5c265' }} />
                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="flex-1 rounded-lg px-2 py-1 text-xs border outline-none" style={{ background: '#fff', borderColor: '#b5c265' }} />
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg p-2 text-center" style={{ background: '#ffffff' }}>
                <div className="text-[11px]" style={{ color: '#5a6b20' }}>成本</div>
                <div className="text-xs font-bold" style={{ color: '#ef4444' }}>{formatCurrency(totalCost)}</div>
              </div>
              <div className="rounded-lg p-2 text-center" style={{ background: '#ffffff' }}>
                <div className="text-[11px]" style={{ color: '#5a6b20' }}>營收</div>
                <div className="text-xs font-bold" style={{ color: '#16a34a' }}>{formatCurrency(totalRevenue)}</div>
              </div>
              <div className="rounded-lg p-2 text-center" style={{ background: '#ffffff' }}>
                <div className="text-[11px]" style={{ color: '#5a6b20' }}>利潤</div>
                <div className="text-xs font-bold" style={{ color: profit >= 0 ? '#16a34a' : '#dc2626' }}>{formatCurrency(profit)}</div>
              </div>
            </div>
          </div>

          <div className="flex gap-1.5 px-4 pt-3 pb-2">
            {[['all','全部'],['cost','成本'],['revenue','營收']].map(([key, label]) => (
              <button key={key} onClick={() => setFilter(key)} className="px-3 py-1.5 rounded-full text-xs font-medium"
                style={{ background: filter === key ? '#16a34a' : '#ffffff', color: filter === key ? '#ffffff' : '#2a7a40', border: filter === key ? 'none' : '1px solid #b5c265' }}>
                {label}
              </button>
            ))}
          </div>

          <div className="px-4 pb-4">
            <AccountView entries={filteredEntries} onDelete={handleDelete} loading={loadingEntries} />
          </div>
        </div>
      )}
    </div>
  )
}
