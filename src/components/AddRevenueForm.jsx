import React, { useState } from 'react'
import { supabase } from '../supabase.js'
import { REVENUE_CHANNELS } from '../theme.js'
import { format } from 'date-fns'

export default function AddRevenueForm({ date, onAdded, compact = false }) {
  const [channel, setChannel] = useState(REVENUE_CHANNELS[0].value)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setError('請輸入有效金額')
      return
    }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.from('revenue_entries').insert([{
      date: format(date, 'yyyy-MM-dd'),
      channel,
      amount: Number(amount),
      note: note.trim(),
    }])
    setLoading(false)
    if (err) { setError(err.message); return }
    setAmount('')
    setNote('')
    onAdded && onAdded()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs mb-1" style={{ color: '#86efac' }}>收款管道</label>
        <div className="grid grid-cols-3 gap-1.5">
          {REVENUE_CHANNELS.map((ch) => (
            <button type="button" key={ch.value}
              onClick={() => setChannel(ch.value)}
              className="flex items-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: channel === ch.value ? ch.color + '33' : '#1a2e1f',
                border: `1px solid ${channel === ch.value ? ch.color : '#2d4a32'}`,
                color: channel === ch.value ? ch.color : '#86efac',
              }}>
              <span>{ch.icon}</span>
              <span className="truncate">{ch.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs mb-1" style={{ color: '#86efac' }}>金額（NT$）</label>
        <input type="number" step="0.01" min="0" placeholder="0"
          value={amount} onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
          style={{ background: '#1a2e1f', border: '1px solid #2d4a32', color: '#e2f5e8' }}
          onFocus={(e) => e.target.style.borderColor = '#4ade80'}
          onBlur={(e) => e.target.style.borderColor = '#2d4a32'}
        />
      </div>
      <div>
        <label className="block text-xs mb-1" style={{ color: '#86efac' }}>備註（選填）</label>
        <input type="text" placeholder="備註..."
          value={note} onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
          style={{ background: '#1a2e1f', border: '1px solid #2d4a32', color: '#e2f5e8' }}
          onFocus={(e) => e.target.style.borderColor = '#4ade80'}
          onBlur={(e) => e.target.style.borderColor = '#2d4a32'}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all active:scale-95"
        style={{ background: loading ? '#2d4a32' : 'linear-gradient(135deg,#4ade80,#22c55e)', color: '#0a1a0f' }}>
        {loading ? '新增中...' : '✓ 新增營收'}
      </button>
    </form>
  )
}
