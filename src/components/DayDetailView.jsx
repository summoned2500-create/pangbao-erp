import React, { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { supabase, deleteTransaction } from '../supabase.js'
import { formatCurrency, getCostCategory, getRevenueChannel } from '../theme.js'
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
