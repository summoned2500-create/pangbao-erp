import React, { useState, useEffect } from 'react'
import { supabase } from '../../shared/lib/supabase.js'

const CAT_ICONS = {
  '水餃類': '🥟',
  '醬料類': '🫙',
  '餐具類': '🍴',
  '飲品類': '🧃',
  '葉菜類': '🥬',
  '麵糰類': '🫓',
  '雜項類': '📦',
}

const STATUS_COLORS = {
  high:   { bg: '#dcfce7', text: '#15803d', label: '充足' },
  medium: { bg: '#fef9c3', text: '#854d0e', label: '偏低' },
  low:    { bg: '#fee2e2', text: '#dc2626', label: '不足' },
  out:    { bg: '#f3f4f6', text: '#6b7280', label: '缺貨' },
}

function getStatus(qty, minQty) {
  if (qty <= 0) return 'out'
  if (minQty && qty <= minQty) return 'low'
  if (minQty && qty <= minQty * 2) return 'medium'
  return 'high'
}

export default function InventoryPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterCat, setFilterCat] = useState('全部')
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function fetchInventory() {
      setLoading(true)
      const { data } = await supabase
        .from('inventory')
        .select('*')
        .order('cat', { ascending: true })
      setItems(data || [])
      setLoading(false)
    }
    fetchInventory()
  }, [])

  const categories = ['全部', ...new Set(items.map(i => i.cat).filter(Boolean))]

  const filtered = items.filter(item => {
    const matchCat = filterCat === '全部' || item.cat === filterCat
    const matchSearch = !search || item.name?.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const total = items.length
  const outCount = items.filter(i => i.qty <= 0).length
  const lowCount = items.filter(i => i.qty > 0 && i.min_qty && i.qty <= i.min_qty).length
  const okCount = total - outCount - lowCount

  return (
    <div className="min-h-screen pb-24" style={{ background: '#f4f6e4' }}>
      {/* Header */}
      <div className="px-4 pt-5 pb-3" style={{ background: '#e6eac8', borderBottom: '1px solid #b5c265' }}>
        <h1 className="text-lg font-bold" style={{ color: '#1e2e08' }}>📦 庫存狀態</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 px-4 py-3">
        {[
          { label: '總種類', value: total, color: '#1e2e08', bg: '#fff' },
          { label: '庫存低', value: lowCount, color: '#854d0e', bg: '#fef9c3' },
          { label: '缺貨', value: outCount, color: '#dc2626', bg: '#fee2e2' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="rounded-xl p-3 text-center shadow-sm" style={{ background: bg, border: '1px solid #b5c265' }}>
            <div className="text-xs mb-1" style={{ color: '#5a6b20' }}>{label}</div>
            <div className="text-xl font-bold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="px-4 mb-2">
        <input
          type="text"
          placeholder="搜尋食材..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: '#fff', border: '1px solid #b5c265', color: '#1e2e08' }}
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{
              background: filterCat === cat ? '#16a34a' : '#fff',
              color: filterCat === cat ? '#fff' : '#5a6b20',
              border: '1px solid #b5c265',
            }}
          >
            {cat === '全部' ? cat : `${CAT_ICONS[cat] || ''} ${cat}`}
          </button>
        ))}
      </div>

      {/* Items List */}
      {loading ? (
        <div className="flex justify-center py-12 text-sm" style={{ color: '#5a6b20' }}>載入中...</div>
      ) : (
        <div className="px-4 space-y-2">
          {filtered.map(item => {
            const status = getStatus(item.qty, item.min_qty)
            const s = STATUS_COLORS[status]
            return (
              <div key={item.id} className="flex items-center justify-between px-4 py-3 rounded-xl shadow-sm"
                style={{ background: '#fff', border: '1px solid #b5c265' }}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{CAT_ICONS[item.cat] || '📦'}</span>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: '#1e2e08' }}>{item.name}</div>
                    <div className="text-xs" style={{ color: '#5a6b20' }}>{item.cat}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: '#1e2e08' }}>
                    {item.qty} {item.unit || ''}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: s.bg, color: s.text }}>
                    {s.label}
                  </span>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="text-center py-10 text-sm" style={{ color: '#5a6b20' }}>沒有符合的食材</div>
          )}
        </div>
      )}
    </div>
  )
}
