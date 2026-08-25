import React, { useState, useEffect, useCallback } from 'react'
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns'
import { supabase } from '../../shared/lib/supabase.js'
import { formatCurrency } from '../../shared/theme.js'

const BADGES = [
  {
    key: 'legend',
    icon: '👑',
    title: '傳說老闆',
    desc: '營收達成 ≥ 110%，成本控制優良',
    check: (r, c) => r >= 1.1 && c <= 1.0,
    color: '#f59e0b',
    bg: '#fef3c7',
  },
  {
    key: 'king',
    icon: '🏆',
    title: '利潤王',
    desc: '營收達成 ≥ 100%，成本控制達標',
    check: (r, c) => r >= 1.0 && c <= 1.0,
    color: '#16a34a',
    bg: '#dcfce7',
  },
  {
    key: 'good',
    icon: '🥇',
    title: '表現優秀',
    desc: '營收達成 ≥ 90%',
    check: (r, c) => r >= 0.9,
    color: '#2563eb',
    bg: '#dbeafe',
  },
  {
    key: 'stable',
    icon: '🥈',
    title: '穩健經營',
    desc: '營收達成 ≥ 70%',
    check: (r, c) => r >= 0.7,
    color: '#7c3aed',
    bg: '#ede9fe',
  },
  {
    key: 'try',
    icon: '📈',
    title: '繼續加油',
    desc: '保持努力，明月再戰',
    check: () => true,
    color: '#dc2626',
    bg: '#fee2e2',
  },
]

function getBadge(revenueRate, costRate) {
  return BADGES.find(b => b.check(revenueRate, costRate))
}

function getRateColor(rate) {
  if (rate >= 1.1) return '#f59e0b'
  if (rate >= 1.0) return '#16a34a'
  if (rate >= 0.9) return '#2563eb'
  if (rate >= 0.7) return '#d97706'
  return '#dc2626'
}

function ProgressRing({ rate, size = 96, stroke = 8, color }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const progress = Math.min(rate, 1.2)
  const offset = circ - (progress / 1.2) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e6eac8" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  )
}

export default function GoalPage() {
  const [month, setMonth] = useState(new Date())
  const [target, setTarget] = useState(null)
  const [actual, setActual] = useState({ revenue: 0, cost: 0 })
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editRevenue, setEditRevenue] = useState('')
  const [editCost, setEditCost] = useState('')
  const [saving, setSaving] = useState(false)
  const [history, setHistory] = useState([])
  const [prediction, setPrediction] = useState(null)

  const year = month.getFullYear()
  const mon = month.getMonth() + 1
  const monthLabel = `${year} 年 ${mon} 月`

  const fetchData = useCallback(async () => {
    setLoading(true)
    const start = format(startOfMonth(month), 'yyyy-MM-dd')
    const end = format(endOfMonth(month), 'yyyy-MM-dd')

    const [{ data: tgt }, { data: txns }] = await Promise.all([
      supabase.from('monthly_targets').select('*').eq('year', year).eq('month', mon).single(),
      supabase.from('transactions').select('type,amount').gte('date', start).lte('date', end),
    ])

    setTarget(tgt || null)
    const revenue = (txns || []).filter(t => t.type === 'revenue').reduce((s, t) => s + Number(t.amount), 0)
    const cost = (txns || []).filter(t => t.type === 'cost').reduce((s, t) => s + Number(t.amount), 0)
    setActual({ revenue, cost })
    setLoading(false)
  }, [month, year, mon])

  const fetchHistory = useCallback(async () => {
    const promises = Array.from({ length: 6 }, (_, i) => {
      const m = subMonths(new Date(), i + 1)
      const y = m.getFullYear()
      const mo = m.getMonth() + 1
      const start = format(startOfMonth(m), 'yyyy-MM-dd')
      const end = format(endOfMonth(m), 'yyyy-MM-dd')
      return Promise.all([
        supabase.from('monthly_targets').select('*').eq('year', y).eq('month', mo).single(),
        supabase.from('transactions').select('type,amount').gte('date', start).lte('date', end),
      ]).then(([{ data: tgt }, { data: txns }]) => {
        const rev = (txns || []).filter(t => t.type === 'revenue').reduce((s, t) => s + Number(t.amount), 0)
        const cost = (txns || []).filter(t => t.type === 'cost').reduce((s, t) => s + Number(t.amount), 0)
        return { year: y, month: mo, target: tgt, revenue: rev, cost }
      })
    })
    const results = await Promise.all(promises)
    const filtered = results.filter(r => r.revenue > 0 || r.target)
    setHistory(filtered)

    // 用過去 3 個月有資料的月份計算預測
    const withData = results.filter(r => r.revenue > 0).slice(0, 3)
    if (withData.length >= 2) {
      const avgRev = withData.reduce((s, r) => s + r.revenue, 0) / withData.length
      const avgCost = withData.reduce((s, r) => s + r.cost, 0) / withData.length
      // 計算趨勢：最近月 vs 前幾月均值
      const trend = withData.length >= 2
        ? (withData[0].revenue - withData[withData.length - 1].revenue) / withData[withData.length - 1].revenue
        : 0
      const trendAdj = Math.max(-0.1, Math.min(0.15, trend)) // 限制在 -10% ~ +15%
      setPrediction({
        revenue: Math.round(avgRev * (1 + trendAdj / 2)),
        cost: Math.round(avgCost),
        months: withData.map(r => `${r.year}/${String(r.month).padStart(2,'0')}`),
        trend: trendAdj,
      })
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { fetchHistory() }, [fetchHistory])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('monthly_targets').upsert({
      year, month: mon,
      revenue_target: Number(editRevenue) || 0,
      cost_target: Number(editCost) || 0,
    }, { onConflict: 'year,month' })
    setSaving(false)
    setEditing(false)
    fetchData()
  }

  const revenueRate = target?.revenue_target > 0 ? actual.revenue / target.revenue_target : 0
  const costRate = target?.cost_target > 0 ? actual.cost / target.cost_target : 0
  const profitRate = actual.revenue > 0 ? actual.cost / actual.revenue : 0
  const targetProfitRate = (target?.revenue_target > 0 && target?.cost_target > 0)
    ? target.cost_target / target.revenue_target : 0

  const badge = (target && (actual.revenue > 0 || actual.cost > 0))
    ? getBadge(revenueRate, costRate)
    : null

  return (
    <div className="min-h-screen pb-24" style={{ background: '#f4f6e4' }}>
      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex items-center justify-between" style={{ background: '#e6eac8', borderBottom: '1px solid #b5c265' }}>
        <h1 className="text-lg font-bold" style={{ color: '#1e2e08' }}>🎯 月度目標</h1>
        <button onClick={() => { setEditing(true); setEditRevenue(target?.revenue_target || ''); setEditCost(target?.cost_target || '') }}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: '#16a34a', color: '#fff' }}>
          {target ? '修改目標' : '設定目標'}
        </button>
      </div>

      {/* Month Nav */}
      <div className="flex items-center justify-center gap-4 py-3 px-4" style={{ background: '#e6eac8', borderBottom: '1px solid #b5c265' }}>
        <button onClick={() => setMonth(m => subMonths(m, 1))} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: '#fff', color: '#2a7a40' }}>‹</button>
        <span className="text-sm font-bold" style={{ color: '#1e2e08' }}>{monthLabel}</span>
        <button onClick={() => setMonth(m => addMonths(m, 1))} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: '#fff', color: '#2a7a40' }}>›</button>
      </div>

      {/* Edit Form */}
      {editing && (
        <form onSubmit={handleSave} className="m-4 p-4 rounded-xl space-y-3 shadow-md" style={{ background: '#fff', border: '1.5px solid #16a34a' }}>
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold" style={{ color: '#1e2e08' }}>設定 {monthLabel} 目標</span>
            <button type="button" onClick={() => setEditing(false)} style={{ color: '#9ca3af' }}>✕</button>
          </div>
          {prediction && (
            <div className="rounded-xl p-3 space-y-1" style={{ background: '#f4f6e4', border: '1px solid #b5c265' }}>
              <div className="text-xs font-semibold" style={{ color: '#2a7a40' }}>
                🤖 AI 預測（根據 {prediction.months.join('、')}）
              </div>
              <div className="text-xs" style={{ color: '#5a6b20' }}>
                趨勢：{prediction.trend > 0 ? `📈 成長 ${Math.round(prediction.trend * 100)}%` : prediction.trend < 0 ? `📉 下降 ${Math.round(Math.abs(prediction.trend) * 100)}%` : '➡️ 持平'}
              </div>
              <button type="button"
                onClick={() => { setEditRevenue(prediction.revenue); setEditCost(prediction.cost) }}
                className="w-full py-1.5 rounded-lg text-xs font-semibold mt-1"
                style={{ background: '#16a34a', color: '#fff' }}>
                套用建議目標（營收 {formatCurrency(prediction.revenue)} / 成本 {formatCurrency(prediction.cost)}）
              </button>
            </div>
          )}
          <div>
            <label className="text-xs mb-1 block" style={{ color: '#5a6b20' }}>預估營收（NT$）</label>
            <input type="number" required placeholder="0" value={editRevenue} onChange={e => setEditRevenue(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none border" style={{ background: '#f4f6e4', borderColor: '#b5c265' }} autoFocus />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: '#5a6b20' }}>預估成本（NT$）</label>
            <input type="number" required placeholder="0" value={editCost} onChange={e => setEditCost(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none border" style={{ background: '#f4f6e4', borderColor: '#b5c265' }} />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditing(false)} className="flex-1 py-2 rounded-lg text-sm" style={{ background: '#f4f6e4', color: '#5a6b20' }}>取消</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg text-sm font-bold text-white" style={{ background: '#16a34a' }}>
              {saving ? '儲存中...' : '確認儲存'}
            </button>
          </div>
        </form>
      )}

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="text-center py-12 text-sm" style={{ color: '#5a6b20' }}>載入中...</div>
        ) : !target ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: '#fff', border: '1px solid #b5c265' }}>
            <div className="text-4xl mb-3">🎯</div>
            <div className="text-sm font-semibold mb-1" style={{ color: '#1e2e08' }}>尚未設定本月目標</div>
            <div className="text-xs mb-4" style={{ color: '#5a6b20' }}>設定目標後，即可追蹤達成率並解鎖稱號</div>
            <button onClick={() => { setEditing(true); setEditRevenue(''); setEditCost('') }}
              className="px-6 py-2 rounded-xl text-sm font-bold text-white" style={{ background: '#16a34a' }}>
              立即設定目標
            </button>
          </div>
        ) : (
          <>
            {/* Badge */}
            {badge && (
              <div className="rounded-2xl p-4 flex items-center gap-4 shadow-sm" style={{ background: badge.bg, border: `1.5px solid ${badge.color}` }}>
                <span className="text-5xl">{badge.icon}</span>
                <div>
                  <div className="text-base font-black" style={{ color: badge.color }}>{badge.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: badge.color + 'cc' }}>{badge.desc}</div>
                  <div className="text-xs mt-1" style={{ color: '#5a6b20' }}>{monthLabel} 月度稱號</div>
                </div>
              </div>
            )}

            {/* Revenue Achievement */}
            <div className="rounded-2xl p-4 shadow-sm" style={{ background: '#fff', border: '1px solid #b5c265' }}>
              <div className="text-xs font-semibold mb-3" style={{ color: '#5a6b20' }}>📊 營收達成率</div>
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0" style={{ width: 96, height: 96 }}>
                  <ProgressRing rate={revenueRate} color={getRateColor(revenueRate)} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-black" style={{ color: getRateColor(revenueRate) }}>
                      {Math.round(revenueRate * 100)}%
                    </span>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: '#5a6b20' }}>目標</span>
                    <span className="font-semibold" style={{ color: '#1e2e08' }}>{formatCurrency(target.revenue_target)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: '#5a6b20' }}>實際</span>
                    <span className="font-bold" style={{ color: getRateColor(revenueRate) }}>{formatCurrency(actual.revenue)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: '#5a6b20' }}>差距</span>
                    <span className="font-semibold" style={{ color: actual.revenue >= target.revenue_target ? '#16a34a' : '#dc2626' }}>
                      {actual.revenue >= target.revenue_target ? '+' : ''}{formatCurrency(actual.revenue - target.revenue_target)}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="rounded-full overflow-hidden" style={{ background: '#f4f6e4', height: 6 }}>
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${Math.min(revenueRate * 100, 100)}%`,
                      background: getRateColor(revenueRate)
                    }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Cost Control */}
            <div className="rounded-2xl p-4 shadow-sm" style={{ background: '#fff', border: '1px solid #b5c265' }}>
              <div className="text-xs font-semibold mb-3" style={{ color: '#5a6b20' }}>🎯 成本控制率</div>
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0" style={{ width: 96, height: 96 }}>
                  <ProgressRing rate={costRate} color={costRate <= 1 ? '#16a34a' : '#dc2626'} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-black" style={{ color: costRate <= 1 ? '#16a34a' : '#dc2626' }}>
                      {Math.round(costRate * 100)}%
                    </span>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: '#5a6b20' }}>目標成本</span>
                    <span className="font-semibold" style={{ color: '#1e2e08' }}>{formatCurrency(target.cost_target)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: '#5a6b20' }}>實際成本</span>
                    <span className="font-bold" style={{ color: costRate <= 1 ? '#16a34a' : '#dc2626' }}>{formatCurrency(actual.cost)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: '#5a6b20' }}>實際成本率</span>
                    <span className="font-bold" style={{ color: profitRate <= targetProfitRate ? '#16a34a' : '#dc2626' }}>
                      {actual.revenue > 0 ? `${Math.round(profitRate * 100)}%` : '-'}
                      {targetProfitRate > 0 && ` / 目標 ${Math.round(targetProfitRate * 100)}%`}
                    </span>
                  </div>
                  <div className="rounded-full overflow-hidden" style={{ background: '#f4f6e4', height: 6 }}>
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${Math.min(costRate * 100, 100)}%`,
                      background: costRate <= 1 ? '#16a34a' : '#dc2626'
                    }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '實際利潤', value: formatCurrency(actual.revenue - actual.cost), color: actual.revenue - actual.cost >= 0 ? '#16a34a' : '#dc2626' },
                { label: '目標利潤', value: formatCurrency(target.revenue_target - target.cost_target), color: '#1e2e08' },
                { label: '利潤達成', value: (target.revenue_target - target.cost_target) > 0 ? `${Math.round((actual.revenue - actual.cost) / (target.revenue_target - target.cost_target) * 100)}%` : '-', color: '#5a6b20' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl p-3 text-center" style={{ background: '#fff', border: '1px solid #b5c265' }}>
                  <div className="text-[11px] mb-1" style={{ color: '#5a6b20' }}>{label}</div>
                  <div className="text-xs font-bold" style={{ color }}>{value}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* History */}
        {history.length > 0 && (
          <div>
            <div className="text-xs font-bold px-1 mb-2" style={{ color: '#5a6b20' }}>📅 近 6 個月歷史</div>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #b5c265' }}>
              {history.map((h, i) => {
                const rRate = h.target?.revenue_target > 0 ? h.revenue / h.target.revenue_target : null
                const hBadge = (h.target && h.revenue > 0) ? getBadge(rRate, h.target?.cost_target > 0 ? h.cost / h.target.cost_target : 0) : null
                return (
                  <div key={`${h.year}-${h.month}`}
                    className="flex items-center justify-between px-4 py-3"
                    style={{ background: '#fff', borderBottom: i < history.length - 1 ? '1px solid #f4f6e4' : 'none' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{hBadge?.icon || '—'}</span>
                      <div>
                        <div className="text-xs font-semibold" style={{ color: '#1e2e08' }}>{h.year}/{String(h.month).padStart(2,'0')}</div>
                        <div className="text-[11px]" style={{ color: '#5a6b20' }}>{hBadge?.title || '未設目標'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold" style={{ color: '#16a34a' }}>{formatCurrency(h.revenue)}</div>
                      {rRate !== null && (
                        <div className="text-[11px]" style={{ color: getRateColor(rRate) }}>達成 {Math.round(rRate * 100)}%</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
