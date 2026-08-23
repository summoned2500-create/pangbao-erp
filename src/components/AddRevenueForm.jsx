import React, { useState } from 'react'
import { insertTransaction } from '../supabase.js'
import { ICHEF_CHANNELS, DELIVERY_CHANNELS } from '../theme.js'
import { format } from 'date-fns'

const UBER_COMMISSION = 0.35

export default function AddRevenueForm({ date, onAdded, compact = false }) {
  const [channel, setChannel] = useState(ICHEF_CHANNELS[0].value)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [uberDeduct, setUberDeduct] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isUber = channel === 'Uber Eats 外送'
  const rawAmount = Number(amount) || 0
  const netAmount = isUber && uberDeduct
    ? Math.round(rawAmount * (1 - UBER_COMMISSION))
    : rawAmount
  const commission = rawAmount - netAmount

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || isNaN(amount) || rawAmount <= 0) {
      setError('請輸入有效金額')
      return
    }
    setLoading(true)
    setError('')

    let finalNote = note.trim()
    if (isUber && uberDeduct && rawAmount > 0) {
      const deductNote = `[Uber Eats 原始訂單: $${rawAmount.toLocaleString('zh-TW')} / 平台抽成 35%: -$${commission.toLocaleString('zh-TW')}]`
      finalNote = finalNote ? `${finalNote} ${deductNote}` : deductNote
    }

    try {
      await insertTransaction({
        date: format(date, 'yyyy-MM-dd'),
        type: 'revenue',
        category: channel,
        amount: netAmount,
        note: finalNote,
      })
      setAmount('')
      setNote('')
      onAdded && onAdded()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const selectChannel = (val) => {
    setChannel(val)
    setError('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">

      {/* iCHEF 門市 */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-xs font-semibold" style={{ color: '#16a34a' }}>🍽️ 門市營收 (iCHEF)</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {ICHEF_CHANNELS.map((ch) => (
            <button type="button" key={ch.value}
              onClick={() => selectChannel(ch.value)}
              className="flex flex-col items-center gap-0.5 px-1 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: channel === ch.value ? ch.color + '33' : '#ffffff',
                border: `1px solid ${channel === ch.value ? ch.color : '#b5c265'}`,
                color: channel === ch.value ? ch.color : '#2a7a40',
              }}>
              <span>{ch.icon}</span>
              <span className="truncate w-full text-center leading-tight">{ch.label}</span>
            </button>
          ))}
        </div>
        {channel === 'iCHEF 門市日結總額' && (
          <div className="mt-1 px-2 py-1 rounded-lg text-xs" style={{ background: '#ffffff', color: '#5a6b20' }}>
            💡 選擇日結總額後，無需再單獨記各支付細項
          </div>
        )}
      </div>

      {/* Uber Eats 外送 */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-xs font-semibold" style={{ color: '#d97706' }}>🛵 外送營收</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {DELIVERY_CHANNELS.map((ch) => (
            <button type="button" key={ch.value}
              onClick={() => selectChannel(ch.value)}
              className="flex flex-col items-center gap-0.5 px-1 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: channel === ch.value ? ch.color + '33' : '#ffffff',
                border: `1px solid ${channel === ch.value ? ch.color : '#b5c265'}`,
                color: channel === ch.value ? ch.color : '#2a7a40',
              }}>
              <span>{ch.icon}</span>
              <span className="truncate w-full text-center">{ch.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 金額 */}
      <div>
        <label className="block text-xs mb-1" style={{ color: '#2a7a40' }}>
          {isUber && uberDeduct ? '訂單金額（NT$，扣除佣金前）' : '金額（NT$）'}
        </label>
        <input type="number" step="1" min="0" placeholder="0"
          value={amount} onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
          style={{ background: '#ffffff', border: '1px solid #b5c265', color: '#1e2e08' }}
          onFocus={(e) => e.target.style.borderColor = '#16a34a'}
          onBlur={(e) => e.target.style.borderColor = '#b5c265'}
        />
      </div>

      {/* Uber Eats 扣除 Toggle */}
      {isUber && (
        <div className="rounded-lg p-3 space-y-2" style={{ background: '#ffffff', border: '1px solid #d9770633' }}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={uberDeduct} onChange={(e) => setUberDeduct(e.target.checked)}
              style={{ accentColor: '#d97706', width: 16, height: 16 }}
            />
            <span className="text-xs" style={{ color: '#d97706' }}>
              自動計算實收淨額（扣除 35% 平台佣金）
            </span>
          </label>
          {uberDeduct && rawAmount > 0 && (
            <div className="text-xs space-y-0.5 pl-6" style={{ color: '#5a6b20' }}>
              <div>訂單金額：<span style={{ color: '#1e2e08' }}>NT${rawAmount.toLocaleString('zh-TW')}</span></div>
              <div>平台抽成 35%：<span style={{ color: '#ef4444' }}>-NT${commission.toLocaleString('zh-TW')}</span></div>
              <div>實收淨額：<span style={{ color: '#16a34a', fontWeight: 700 }}>NT${netAmount.toLocaleString('zh-TW')}</span></div>
            </div>
          )}
        </div>
      )}

      {/* 備註 */}
      <div>
        <label className="block text-xs mb-1" style={{ color: '#2a7a40' }}>備註（選填）</label>
        <input type="text" placeholder="備註..."
          value={note} onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
          style={{ background: '#ffffff', border: '1px solid #b5c265', color: '#1e2e08' }}
          onFocus={(e) => e.target.style.borderColor = '#16a34a'}
          onBlur={(e) => e.target.style.borderColor = '#b5c265'}
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button type="submit" disabled={loading}
        className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all active:scale-95"
        style={{ background: loading ? '#b5c265' : 'linear-gradient(135deg,#16a34a,#15803d)', color: '#f4f6e4' }}>
        {loading ? '新增中...' : `✓ 新增營收${isUber && uberDeduct && netAmount > 0 ? `（NT$${netAmount.toLocaleString('zh-TW')}）` : ''}`}
      </button>
    </form>
  )
}
