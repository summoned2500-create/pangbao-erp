import React, { useState } from 'react'
import { supabase } from '../supabase.js'
import { COST_CATEGORIES } from '../theme.js'
import { format } from 'date-fns'

export default function AddCostForm({ date, onAdded, compact = false }) {
  const [category, setCategory] = useState(COST_CATEGORIES[0].value)
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
    const { error: err } = await supabase.from('cost_entries').insert([{
      date: format(date, 'yyyy-MM-dd'),
      category,
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
        <label className="block text-xs mb-1" style={{ color: '#86efac' }}>類別</label>
        <div className="grid grid-cols-3 gap-1.5">
          {COST_CATEGORIES.map((cat) => (
            <button type="button" key={cat.value}
              onClick={() => setCategory(cat.value)}
              className="flex items-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: category === cat.value ? cat.color + '33' : '#1a2e1f',
                border: `1px solid ${category === cat.value ? cat.color : '#2d4a32'}`,
                color: category === cat.value ? cat.color : '#86efac',
              }}>
              <span>{cat.icon}</span>
              <span className="truncate">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs mb-1" style={{ color: '#86efac' }}>金額（NT$）</label>
        <input type="number" step="0.01" min="0" placeholder="0"
          value={amount} onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
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
        {loading ? '新增中...' : '✓ 新增成本'}
      </button>
    </form>
  )
}
