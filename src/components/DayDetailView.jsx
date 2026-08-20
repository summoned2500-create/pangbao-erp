import React, { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { supabase } from '../supabase.js'
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
    const [{ data: costs }, { data: revenues }] = await Promise.all([
      supabase.from('cost_entries').select('*').eq('date', dateStr).order('created_at', { ascending: false }),
      supabase.from('revenue_entries').select('*').eq('date', dateStr).order('created_at', { ascending: false }),
    ])
    setCostEntries(costs || [])
    setRevenueEntries(revenues || [])
    setLoading(false)
  }, [dateStr])

  useEffect(() => { fetchData() }, [fetchData])

  const totalCost = costEntries.reduce((s, e) => s + Number(e.amount), 0)
  const totalRevenue = revenueEntries.reduce((s, e) => s + Number(e.amount), 0)
  const profit = totalRevenue - totalCost

  const deleteCost = async (id) => {
    await supabase.from('cost_entries').delete().eq('id', id)
    fetchData()
    onDataChanged && onDataChanged()
  }

  const deleteRevenue = async (id) => {
    await supabase.from('revenue_entries').delete().eq('id', id)
    fetchData()
    onDataChanged && onDataChanged()
  }

  const handleAdded = () => {
    fetchData()
    onDataChanged && onDataChanged()
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col" style={{ background: '#0a1a0f' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: '#122018', borderBottom: '1px solid #2d4a32' }}>
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ background: '#1a2e1f', color: '#4ade80' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div>
          <div className="font-bold" style={{ color: '#e2f5e8' }}>
            {format(date, 'yyyy 年 M 月 d 日')}
          </div>
          <div className="text-xs" style={{ color: '#4b7a56' }}>
            {['週日','週一','週二','週三','週四','週五','週六'][date.getDay()]}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 p-3" style={{ background: '#122018' }}>
        {[
          { label: '總成本', value: totalCost, color: '#fca5a5' },
          { label: '總營收', value: totalRevenue, color: '#4ade80' },
          { label: '利潤', value: profit, color: profit >= 0 ? '#86efac' : '#f87171' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-3 text-center" style={{ background: '#1a2e1f', border: '1px solid #2d4a32' }}>
            <div className="text-xs mb-1" style={{ color: '#4b7a56' }}>{label}</div>
            <div className="font-bold text-sm" style={{ color }}>
              {value >= 0 ? '' : '-'}{formatCurrency(Math.abs(value))}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex mx-3 mb-0 rounded-xl overflow-hidden" style={{ background: '#1a2e1f', border: '1px solid #2d4a32' }}>
        {[['summary','📊 小計'],['cost','💸 成本'],['revenue','💰 營收']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex-1 py-2.5 text-xs font-semibold transition-all"
            style={{
              background: tab === key ? 'linear-gradient(135deg,#4ade80,#22c55e)' : 'transparent',
              color: tab === key ? '#0a1a0f' : '#86efac',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-sm" style={{ color: '#4b7a56' }}>載入中...</div>
          </div>
        ) : (
          <>
            {/* Summary Tab */}
            {tab === 'summary' && (
              <div className="space-y-3">
                {costEntries.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold mb-2 px-1" style={{ color: '#fca5a5' }}>成本明細</div>
                    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #2d4a32' }}>
                      {costEntries.map((e, i) => {
                        const cat = getCostCategory(e.category)
                        return (
                          <div key={e.id} className="flex items-center justify-between px-3 py-2.5"
                            style={{ borderBottom: i < costEntries.length-1 ? '1px solid #1a2e1f' : 'none', background: '#122018' }}>
                            <div className="flex items-center gap-2">
                              <span>{cat.icon}</span>
                              <div>
                                <div className="text-sm" style={{ color: '#e2f5e8' }}>{e.category}</div>
                                {e.note && <div className="text-xs" style={{ color: '#4b7a56' }}>{e.note}</div>}
                              </div>
                            </div>
                            <div className="font-semibold text-sm" style={{ color: '#fca5a5' }}>{formatCurrency(e.amount)}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                {revenueEntries.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold mb-2 px-1" style={{ color: '#4ade80' }}>營收明細</div>
                    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #2d4a32' }}>
                      {revenueEntries.map((e, i) => {
                        const ch = getRevenueChannel(e.channel)
                        return (
                          <div key={e.id} className="flex items-center justify-between px-3 py-2.5"
                            style={{ borderBottom: i < revenueEntries.length-1 ? '1px solid #1a2e1f' : 'none', background: '#122018' }}>
                            <div className="flex items-center gap-2">
                              <span>{ch.icon}</span>
                              <div>
                                <div className="text-sm" style={{ color: '#e2f5e8' }}>{e.channel}</div>
                                {e.note && <div className="text-xs" style={{ color: '#4b7a56' }}>{e.note}</div>}
                              </div>
                            </div>
                            <div className="font-semibold text-sm" style={{ color: '#4ade80' }}>{formatCurrency(e.amount)}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                {costEntries.length === 0 && revenueEntries.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-32 gap-2">
                    <span className="text-3xl">📭</span>
                    <div className="text-sm" style={{ color: '#4b7a56' }}>今天還沒有記帳資料</div>
                  </div>
                )}
              </div>
            )}

            {/* Cost Tab */}
            {tab === 'cost' && (
              <div className="space-y-4">
                <AddCostForm date={date} onAdded={handleAdded} />
                {costEntries.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold mb-2 px-1" style={{ color: '#4b7a56' }}>已記錄成本</div>
                    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #2d4a32' }}>
                      {costEntries.map((e, i) => {
                        const cat = getCostCategory(e.category)
                        return (
                          <div key={e.id} className="flex items-center justify-between px-3 py-2.5"
                            style={{ borderBottom: i < costEntries.length-1 ? '1px solid #1a2e1f' : 'none', background: '#122018' }}>
                            <div className="flex items-center gap-2">
                              <span>{cat.icon}</span>
                              <div>
                                <div className="text-sm" style={{ color: '#e2f5e8' }}>{e.category}</div>
                                {e.note && <div className="text-xs" style={{ color: '#4b7a56' }}>{e.note}</div>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="font-semibold text-sm" style={{ color: '#fca5a5' }}>{formatCurrency(e.amount)}</div>
                              <button onClick={() => deleteCost(e.id)}
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
                )}
              </div>
            )}

            {/* Revenue Tab */}
            {tab === 'revenue' && (
              <div className="space-y-4">
                <AddRevenueForm date={date} onAdded={handleAdded} />
                {revenueEntries.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold mb-2 px-1" style={{ color: '#4b7a56' }}>已記錄營收</div>
                    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #2d4a32' }}>
                      {revenueEntries.map((e, i) => {
                        const ch = getRevenueChannel(e.channel)
                        return (
                          <div key={e.id} className="flex items-center justify-between px-3 py-2.5"
                            style={{ borderBottom: i < revenueEntries.length-1 ? '1px solid #1a2e1f' : 'none', background: '#122018' }}>
                            <div className="flex items-center gap-2">
                              <span>{ch.icon}</span>
                              <div>
                                <div className="text-sm" style={{ color: '#e2f5e8' }}>{e.channel}</div>
                                {e.note && <div className="text-xs" style={{ color: '#4b7a56' }}>{e.note}</div>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="font-semibold text-sm" style={{ color: '#4ade80' }}>{formatCurrency(e.amount)}</div>
                              <button onClick={() => deleteRevenue(e.id)}
                                className="w-7 h-7 flex items-center justify-center rounded-full"
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
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
