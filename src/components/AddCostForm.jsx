import React, { useState } from 'react'
import { insertTransaction } from '../supabase.js'
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
    try {
      await insertTransaction({
        date: format(date, 'yyyy-MM-dd'),
        type: 'cost',
        category,
        amount: Number(amount),
        note: note.trim(),
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

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs mb-1" style={{ color: '#2a7a40' }}>類別</label>
        <div className="grid grid-cols-3 gap-1.5">
          {COST_CATEGORIES.map((cat) => (
            <button type="button" key={cat.value}
              onClick={() => setCategory(cat.value)}
              className="flex items-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: category === cat.value ? cat.color + '33' : '#ffffff',
                border: `1px solid ${category === cat.value ? cat.color : '#b5c265'}`,
                color: category === cat.value ? cat.color : '#2a7a40',
              }}>
              <span>{cat.icon}</span>
              <span className="truncate">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs mb-1" style={{ color: '#2a7a40' }}>金額（NT$）</label>
        <input type="number" step="0.01" min="0" placeholder="0"
          value={amount} onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
          style={{ background: '#ffffff', border: '1px solid #b5c265', color: '#1e2e08' }}
          onFocus={(e) => e.target.style.borderColor = '#16a34a'}
          onBlur={(e) => e.target.style.borderColor = '#b5c265'}
        />
      </div>
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
        {loading ? '新增中...' : '✓ 新增成本'}
      </button>
    </form>
  )
}
