import React, { useState, useEffect, useCallback } from 'react'
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
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCat, setNewCat] = useState('水餃類')
  const [newQty, setNewQty] = useState('')
  const [newUnit, setNewUnit] = useState('份')
  const [newMinQty, setNewMinQty] = useState('')

  const fetchInventory = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('inventory')
      .select('*')
      .order('cat', { ascending: true })
    setItems(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchInventory() }, [fetchInventory])

  const handleUpdateQty = async (id, delta) => {
    const item = items.find(i => i.id === id)
    if (!item) return
    const updatedQty = Math.max(0, Number(item.qty) + delta)
    await supabase.from('inventory').update({ qty: updatedQty }).eq('id', id)
    fetchInventory()
  }

  const handleAddItem = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    await supabase.from('inventory').insert([{
      name: newName.trim(),
      cat: newCat,
      qty: Number(newQty) || 0,
      unit: newUnit.trim() || '份',
      min_qty: Number(newMinQty) || 0
    }])
    setNewName(''); setNewQty(''); setNewMinQty(''); setShowAdd(false)
    fetchInventory()
  }

  const handleDeleteItem = async (id) => {
    if (window.confirm('確定要刪除此食材品項？')) {
      await supabase.from('inventory').delete().eq('id', id)
      fetchInventory()
    }
  }

  const categories = ['全部', ...new Set(items.map(i => i.cat).filter(Boolean))]

  const filtered = items.filter(item => {
    const matchCat = filterCat === '全部' || item.cat === filterCat
    const matchSearch = !search || item.name?.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const total = items.length
  const outCount = items.filter(i => i.qty <= 0).length
  const lowCount = items.filter(i => i.qty > 0 && i.min_qty && i.qty <= i.min_qty).length

  return (
    <div className="min-h-screen pb-24" style={{ background: '#f4f6e4' }}>
      <div className="px-4 pt-5 pb-3 flex justify-between items-center" style={{ background: '#e6eac8', borderBottom: '1px solid #b5c265' }}>
        <h1 className="text-lg font-bold" style={{ color: '#1e2e08' }}>📦 庫存狀態</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: '#16a34a', color: '#fff' }}>
          {showAdd ? '✕ 關閉' : '+ 新增食材'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAddItem} className="m-4 p-4 rounded-xl space-y-3 shadow" style={{ background: '#fff', border: '1px solid #b5c265' }}>
          <div className="text-sm font-semibold" style={{ color: '#1e2e08' }}>新增庫存品項</div>
          <div className="grid grid-cols-2 gap-2">
            <input required placeholder="品項名稱*" value={newName} onChange={e => setNewName(e.target.value)} className="px-3 py-2 rounded-lg text-sm border outline-none" style={{ background: '#f4f6e4', borderColor: '#b5c265' }} />
            <select value={newCat} onChange={e => setNewCat(e.target.value)} className="px-3 py-2 rounded-lg text-sm border outline-none" style={{ background: '#f4f6e4', borderColor: '#b5c265' }}>
              {Object.keys(CAT_ICONS).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input type="number" placeholder="目前數量" value={newQty} onChange={e => setNewQty(e.target.value)} className="px-3 py-2 rounded-lg text-sm border outline-none" style={{ background: '#f4f6e4', borderColor: '#b5c265' }} />
            <input placeholder="單位(包/斤)" value={newUnit} onChange={e => setNewUnit(e.target.value)} className="px-3 py-2 rounded-lg text-sm border outline-none" style={{ background: '#f4f6e4', borderColor: '#b5c265' }} />
            <input type="number" placeholder="安全水位" value={newMinQty} onChange={e => setNewMinQty(e.target.value)} className="px-3 py-2 rounded-lg text-sm border outline-none" style={{ background: '#f4f6e4', borderColor: '#b5c265' }} />
          </div>
          <button type="submit" className="w-full py-2 rounded-lg text-sm font-semibold" style={{ background: '#16a34a', color: '#fff' }}>
            確認儲存
          </button>
        </form>
      )}

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

      <div className="px-4 mb-2">
        <input type="text" placeholder="搜尋食材..." value={search} onChange={e => setSearch(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: '#fff', border: '1px solid #b5c265', color: '#1e2e08' }} />
      </div>
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)} className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: filterCat === cat ? '#16a34a' : '#fff', color: filterCat === cat ? '#fff' : '#5a6b20', border: '1px solid #b5c265' }}>
            {cat === '全部' ? cat : `${CAT_ICONS[cat] || ''} ${cat}`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12 text-sm" style={{ color: '#5a6b20' }}>載入中...</div>
      ) : (
        <div className="px-4 space-y-2">
          {filtered.map(item => {
            const status = getStatus(item.qty, item.min_qty)
            const s = STATUS_COLORS[status]
            return (
              <div key={item.id} className="flex items-center justify-between px-4 py-3 rounded-xl shadow-sm" style={{ background: '#fff', border: '1px solid #b5c265' }}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{CAT_ICONS[item.cat] || '📦'}</span>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: '#1e2e08' }}>{item.name}</div>
                    <div className="text-xs" style={{ color: '#5a6b20' }}>{item.cat}（安全水位: {item.min_qty || 0}）</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: '#f4f6e4' }}>
                    <button onClick={() => handleUpdateQty(item.id, -1)} className="w-6 h-6 rounded font-bold text-xs" style={{ background: '#fff', color: '#5a6b20' }}>-</button>
                    <span className="text-sm font-bold w-10 text-center" style={{ color: '#1e2e08' }}>
                      {item.qty} <span className="text-xs font-normal">{item.unit || ''}</span>
                    </span>
                    <button onClick={() => handleUpdateQty(item.id, 1)} className="w-6 h-6 rounded font-bold text-xs" style={{ background: '#fff', color: '#5a6b20' }}>+</button>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: s.bg, color: s.text }}>{s.label}</span>
                  <button onClick={() => handleDeleteItem(item.id)} className="text-xs p-1" style={{ color: '#dc2626' }}>✕</button>
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
