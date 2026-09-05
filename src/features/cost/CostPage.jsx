import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { COST_CATEGORIES, formatCurrency } from '../../shared/theme.js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// ── 成本/毛利色彩判斷 ──────────────────────────────────────────
const marginColor = (pct) => {
  if (pct >= 40) return '#16a34a'
  if (pct >= 20) return '#ca8a04'
  return '#dc2626'
}

// ── 共用輸入框樣式 ────────────────────────────────────────────
const inputCls = 'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400'
const inputStyle = { background: '#f4f6e4', borderColor: '#b5c265' }
const btnPrimary = {
  background: 'linear-gradient(135deg,#16a34a,#15803d)',
  color: '#fff',
  borderRadius: '0.5rem',
  padding: '0.4rem 1rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  cursor: 'pointer',
  border: 'none',
}
const btnDanger = { ...btnPrimary, background: 'linear-gradient(135deg,#dc2626,#b91c1c)' }
const btnSecondary = {
  ...btnPrimary,
  background: 'none',
  border: '1px solid #b5c265',
  color: '#2a7a40',
}

const Card = ({ children, style }) => (
  <div style={{ background: '#e6eac8', border: '1px solid #b5c265', borderRadius: '0.75rem', padding: '1rem', ...style }}>
    {children}
  </div>
)

// ── 食材管理 Tab ──────────────────────────────────────────────
function IngredientsTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState(null)
  const [purchaseId, setPurchaseId] = useState(null)
  const [form, setForm] = useState({ name: '', unit: 'g', price_per_unit: '' })
  const [editPrice, setEditPrice] = useState('')
  const [purchaseForm, setPurchaseForm] = useState({ date: new Date().toISOString().slice(0, 10), quantity: '', unit_price: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('ingredients').select('*').order('name')
    setItems(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    await supabase.from('ingredients').insert({
      name: form.name.trim(),
      unit: form.unit,
      price_per_unit: parseFloat(form.price_per_unit) || 0,
    })
    setForm({ name: '', unit: 'g', price_per_unit: '' })
    setShowAdd(false)
    setSaving(false)
    load()
  }

  const handleEditPrice = async (id) => {
    setSaving(true)
    await supabase.from('ingredients').update({
      price_per_unit: parseFloat(editPrice) || 0,
    }).eq('id', id)
    setEditId(null)
    setSaving(false)
    load()
  }

  const handlePurchase = async (e) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('ingredient_purchases').insert({
      ingredient_id: purchaseId,
      date: purchaseForm.date,
      quantity: parseFloat(purchaseForm.quantity),
      unit_price: parseFloat(purchaseForm.unit_price),
    })
    setPurchaseId(null)
    setPurchaseForm({ date: new Date().toISOString().slice(0, 10), quantity: '', unit_price: '' })
    setSaving(false)
    load()
  }

  const handleDelete = async (id) => {
    if (!window.confirm('確定刪除此食材？相關配方也會一併移除。')) return
    await supabase.from('ingredients').delete().eq('id', id)
    load()
  }

  const UNITS = ['g', 'kg', '顆', '張', '包', 'ml', 'L']

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="font-semibold text-green-800">共 {items.length} 種食材</span>
        <button style={btnPrimary} onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? '取消' : '＋ 新增食材'}
        </button>
      </div>

      {showAdd && (
        <Card>
          <form onSubmit={handleAdd} className="space-y-2">
            <div className="text-sm font-semibold text-green-800 mb-2">新增食材</div>
            <input className={inputCls} style={inputStyle} placeholder="食材名稱" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <div className="flex gap-2">
              <select className={inputCls} style={inputStyle} value={form.unit}
                onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
              <input className={inputCls} style={inputStyle} type="number" step="0.0001" min="0"
                placeholder="初始單價(元)" value={form.price_per_unit}
                onChange={e => setForm(f => ({ ...f, price_per_unit: e.target.value }))} />
            </div>
            <button type="submit" style={btnPrimary} disabled={saving}>
              {saving ? '儲存中…' : '確認新增'}
            </button>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="text-center text-sm text-green-700 py-8">載入中…</div>
      ) : items.length === 0 ? (
        <div className="text-center text-sm text-green-700 py-8">尚無食材，請新增</div>
      ) : (
        items.map(item => (
          <Card key={item.id}>
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold text-green-900">{item.name}</div>
                <div className="text-xs text-green-700 mt-0.5">
                  單位：{item.unit}　最新進貨：{item.last_purchase_date || '尚無記錄'}
                </div>
              </div>
              <div className="text-right">
                {editId === item.id ? (
                  <div className="flex gap-1 items-center">
                    <input type="number" step="0.0001" min="0" value={editPrice}
                      onChange={e => setEditPrice(e.target.value)}
                      style={{ ...inputStyle, width: '90px', border: '1px solid #b5c265', borderRadius: '0.4rem', padding: '0.25rem 0.5rem', fontSize: '0.875rem', background: '#f4f6e4' }} />
                    <button style={btnPrimary} onClick={() => handleEditPrice(item.id)} disabled={saving}>✓</button>
                    <button style={btnSecondary} onClick={() => setEditId(null)}>✕</button>
                  </div>
                ) : (
                  <div className="font-bold text-green-800 cursor-pointer" onClick={() => { setEditId(item.id); setEditPrice(item.price_per_unit) }}>
                    NT${Number(item.price_per_unit).toFixed(4)}/{item.unit}
                    <span className="text-xs text-green-600 ml-1">✏️</span>
                  </div>
                )}
              </div>
            </div>

            {purchaseId === item.id ? (
              <form onSubmit={handlePurchase} className="mt-3 pt-3 border-t border-green-200 space-y-2">
                <div className="text-xs font-semibold text-green-800">記錄進貨</div>
                <div className="flex gap-2">
                  <input type="date" value={purchaseForm.date} className={inputCls} style={inputStyle}
                    onChange={e => setPurchaseForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="flex gap-2">
                  <input type="number" step="0.001" min="0" placeholder={`數量(${item.unit})`}
                    value={purchaseForm.quantity} className={inputCls} style={inputStyle}
                    onChange={e => setPurchaseForm(f => ({ ...f, quantity: e.target.value }))} required />
                  <input type="number" step="0.0001" min="0" placeholder="進貨單價"
                    value={purchaseForm.unit_price} className={inputCls} style={inputStyle}
                    onChange={e => setPurchaseForm(f => ({ ...f, unit_price: e.target.value }))} required />
                </div>
                <div className="flex gap-2">
                  <button type="submit" style={btnPrimary} disabled={saving}>{saving ? '儲存…' : '確認進貨'}</button>
                  <button type="button" style={btnSecondary} onClick={() => setPurchaseId(null)}>取消</button>
                </div>
              </form>
            ) : (
              <div className="flex gap-2 mt-2">
                <button style={{ ...btnSecondary, fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                  onClick={() => setPurchaseId(item.id)}>📥 記錄進貨</button>
                <button style={{ ...btnDanger, fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                  onClick={() => handleDelete(item.id)}>🗑</button>
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  )
}

// ── 產品配方 Tab ──────────────────────────────────────────────
function ProductsTab({ dailyUnits, setDailyUnits }) {
  const [products, setProducts] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [bomRows, setBomRows] = useState([])
  const [form, setForm] = useState({ name: '', unit_count: 20, sale_price: '', is_frozen: true })
  const [bomForm, setBomForm] = useState({ ingredient_id: '', quantity_per_unit: '' })
  const [saving, setSaving] = useState(false)
  // labour cost per piece = daily wage / daily units
  // We read from transactions (type=cost, category=薪資) last month avg, or user can set manually
  const [labourPerUnit, setLabourPerUnit] = useState(() => {
    const v = localStorage.getItem('pangbao_labour_per_unit')
    return v ? parseFloat(v) : 2.5
  })

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: prods }, { data: ingrs }] = await Promise.all([
      supabase.from('products').select('*').order('name'),
      supabase.from('ingredients').select('*').order('name'),
    ])
    setProducts(prods || [])
    setIngredients(ingrs || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const openProduct = async (product) => {
    if (selectedProduct?.id === product.id) { setSelectedProduct(null); return }
    const { data } = await supabase
      .from('product_ingredients')
      .select('*, ingredients(name, unit, price_per_unit)')
      .eq('product_id', product.id)
    setBomRows(data || [])
    setSelectedProduct(product)
  }

  const handleAddProduct = async (e) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('products').insert({
      name: form.name.trim(),
      unit_count: parseInt(form.unit_count),
      sale_price: parseFloat(form.sale_price) || 0,
      is_frozen: form.is_frozen,
    })
    setForm({ name: '', unit_count: 20, sale_price: '', is_frozen: true })
    setShowAdd(false)
    setSaving(false)
    load()
  }

  const handleAddBom = async (e) => {
    e.preventDefault()
    if (!bomForm.ingredient_id) return
    setSaving(true)
    await supabase.from('product_ingredients').upsert({
      product_id: selectedProduct.id,
      ingredient_id: bomForm.ingredient_id,
      quantity_per_unit: parseFloat(bomForm.quantity_per_unit),
    }, { onConflict: 'product_id,ingredient_id' })
    setBomForm({ ingredient_id: '', quantity_per_unit: '' })
    setSaving(false)
    const { data } = await supabase
      .from('product_ingredients')
      .select('*, ingredients(name, unit, price_per_unit)')
      .eq('product_id', selectedProduct.id)
    setBomRows(data || [])
  }

  const handleDeleteBom = async (id) => {
    await supabase.from('product_ingredients').delete().eq('id', id)
    setBomRows(rows => rows.filter(r => r.id !== id))
  }

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('確定刪除此產品？')) return
    await supabase.from('products').delete().eq('id', id)
    if (selectedProduct?.id === id) setSelectedProduct(null)
    load()
  }

  const calcCost = (bom) => {
    return bom.reduce((sum, r) => {
      const price = r.ingredients?.price_per_unit || 0
      return sum + price * r.quantity_per_unit
    }, 0)
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center flex-wrap">
        <div style={{ background: '#e6eac8', border: '1px solid #b5c265', borderRadius: '0.5rem', padding: '0.3rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
          <span className="text-green-800">每日產量</span>
          <input type="number" min="1" value={dailyUnits}
            onChange={e => { const v = parseInt(e.target.value) || 700; setDailyUnits(v); localStorage.setItem('pangbao_daily_units', v) }}
            style={{ width: '64px', border: '1px solid #b5c265', borderRadius: '0.35rem', padding: '0.15rem 0.4rem', background: '#f4f6e4', fontSize: '0.8rem' }} />
          <span className="text-green-700">顆</span>
        </div>
        <div style={{ background: '#e6eac8', border: '1px solid #b5c265', borderRadius: '0.5rem', padding: '0.3rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
          <span className="text-green-800">人工/顆</span>
          <input type="number" min="0" step="0.01" value={labourPerUnit}
            onChange={e => { const v = parseFloat(e.target.value) || 0; setLabourPerUnit(v); localStorage.setItem('pangbao_labour_per_unit', v) }}
            style={{ width: '64px', border: '1px solid #b5c265', borderRadius: '0.35rem', padding: '0.15rem 0.4rem', background: '#f4f6e4', fontSize: '0.8rem' }} />
          <span className="text-green-700">元</span>
        </div>
        <button style={btnPrimary} onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? '取消' : '＋ 新增產品'}
        </button>
      </div>

      {showAdd && (
        <Card>
          <form onSubmit={handleAddProduct} className="space-y-2">
            <div className="text-sm font-semibold text-green-800 mb-2">新增產品</div>
            <input className={inputCls} style={inputStyle} placeholder="產品名稱（如：高麗菜水餃）"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <div className="flex gap-2">
              <input type="number" min="1" className={inputCls} style={inputStyle} placeholder="每包顆數"
                value={form.unit_count} onChange={e => setForm(f => ({ ...f, unit_count: e.target.value }))} />
              <input type="number" min="0" step="0.01" className={inputCls} style={inputStyle} placeholder="售價(元)"
                value={form.sale_price} onChange={e => setForm(f => ({ ...f, sale_price: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 text-sm text-green-800">
              <input type="checkbox" checked={form.is_frozen}
                onChange={e => setForm(f => ({ ...f, is_frozen: e.target.checked }))} />
              冷凍產品（反之為熟食）
            </label>
            <button type="submit" style={btnPrimary} disabled={saving}>{saving ? '儲存…' : '確認新增'}</button>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="text-center text-sm text-green-700 py-8">載入中…</div>
      ) : products.length === 0 ? (
        <div className="text-center text-sm text-green-700 py-8">尚無產品，請新增</div>
      ) : (
        products.map(product => {
          const isOpen = selectedProduct?.id === product.id
          const ingCost = isOpen ? calcCost(bomRows) : 0
          const totalCostPerUnit = ingCost + labourPerUnit
          const salePerUnit = product.sale_price / product.unit_count
          const marginPct = salePerUnit > 0 ? ((salePerUnit - totalCostPerUnit) / salePerUnit * 100) : 0
          const col = isOpen ? marginColor(marginPct) : '#2a7a40'

          return (
            <Card key={product.id} style={{ border: `1px solid ${isOpen ? col : '#b5c265'}` }}>
              <div className="flex justify-between items-start cursor-pointer" onClick={() => openProduct(product)}>
                <div>
                  <div className="font-semibold text-green-900">{product.name}</div>
                  <div className="text-xs text-green-700 mt-0.5">
                    {product.is_frozen ? '❄️ 冷凍' : '🍲 熟食'}　{product.unit_count} 顆/包　售價 {formatCurrency(product.sale_price)}
                  </div>
                </div>
                <span className="text-green-600 text-sm mt-1">{isOpen ? '▲' : '▼'}</span>
              </div>

              {isOpen && (
                <div className="mt-3 pt-3 border-t border-green-200 space-y-3">
                  {/* 成本摘要 */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div style={{ background: '#f4f6e4', borderRadius: '0.4rem', padding: '0.5rem' }}>
                      <div className="text-green-700">食材成本/顆</div>
                      <div className="font-bold text-green-900">NT${ingCost.toFixed(3)}</div>
                    </div>
                    <div style={{ background: '#f4f6e4', borderRadius: '0.4rem', padding: '0.5rem' }}>
                      <div className="text-green-700">人工成本/顆</div>
                      <div className="font-bold text-green-900">NT${labourPerUnit.toFixed(2)}</div>
                    </div>
                    <div style={{ background: '#f4f6e4', borderRadius: '0.4rem', padding: '0.5rem' }}>
                      <div className="text-green-700">總成本/包</div>
                      <div className="font-bold text-green-900">{formatCurrency(totalCostPerUnit * product.unit_count)}</div>
                    </div>
                    <div style={{ background: '#f4f6e4', borderRadius: '0.4rem', padding: '0.5rem' }}>
                      <div className="text-green-700">毛利率</div>
                      <div className="font-bold" style={{ color: col }}>{marginPct.toFixed(1)}%</div>
                    </div>
                  </div>
                  <div className="text-xs" style={{ color: col }}>
                    毛利額/包：{formatCurrency(product.sale_price - totalCostPerUnit * product.unit_count)}
                  </div>

                  {/* BOM 列表 */}
                  <div className="text-xs font-semibold text-green-800">配方明細</div>
                  {bomRows.length === 0 ? (
                    <div className="text-xs text-green-600">尚未設定配方</div>
                  ) : (
                    bomRows.map(r => (
                      <div key={r.id} className="flex justify-between items-center text-xs py-1 border-b border-green-100">
                        <span>{r.ingredients?.name}（{r.quantity_per_unit} {r.ingredients?.unit}/顆）</span>
                        <div className="flex items-center gap-2">
                          <span className="text-green-700">NT${(r.ingredients?.price_per_unit * r.quantity_per_unit).toFixed(4)}</span>
                          <button onClick={() => handleDeleteBom(r.id)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
                        </div>
                      </div>
                    ))
                  )}

                  {/* 新增 BOM 行 */}
                  <form onSubmit={handleAddBom} className="flex gap-1 flex-wrap">
                    <select value={bomForm.ingredient_id} className={inputCls}
                      style={{ ...inputStyle, flex: '1', minWidth: '120px', fontSize: '0.75rem' }}
                      onChange={e => setBomForm(f => ({ ...f, ingredient_id: e.target.value }))}>
                      <option value="">選擇食材</option>
                      {ingredients.map(i => <option key={i.id} value={i.id}>{i.name}（{i.unit}）</option>)}
                    </select>
                    <input type="number" step="0.0001" min="0" placeholder="每顆用量"
                      value={bomForm.quantity_per_unit}
                      onChange={e => setBomForm(f => ({ ...f, quantity_per_unit: e.target.value }))}
                      style={{ width: '80px', ...inputStyle, border: '1px solid #b5c265', borderRadius: '0.4rem', padding: '0.25rem 0.4rem', fontSize: '0.75rem', background: '#f4f6e4' }} />
                    <button type="submit" style={{ ...btnPrimary, fontSize: '0.75rem', padding: '0.25rem 0.6rem' }} disabled={saving}>加入</button>
                  </form>

                  <button onClick={() => handleDeleteProduct(product.id)}
                    style={{ ...btnDanger, fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>🗑 刪除產品</button>
                </div>
              )}
            </Card>
          )
        })
      )}
    </div>
  )
}

// ── 成本報表 Tab ──────────────────────────────────────────────
const FOOD_CATEGORIES = ['餃子皮', '豬肉', '雞肉類', '蔬菜', '關東煮料']
const OVERHEAD_CATEGORIES = ['薪資', '房租', '水費', '電費', '稅金', '電信費', '桶裝瓦斯', '紙類雜項']

function ReportTab({ dailyUnits }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const from = `${year}-${String(month).padStart(2, '0')}-01`
    const toDate = new Date(year, month, 0)
    const to = `${year}-${String(month).padStart(2, '0')}-${String(toDate.getDate()).padStart(2, '0')}`
    const { data: txns } = await supabase
      .from('transactions')
      .select('type,category,amount')
      .gte('date', from)
      .lte('date', to)
    setData(txns || [])
    setLoading(false)
  }, [year, month])

  useEffect(() => { load() }, [load])

  const revenue = data ? data.filter(t => t.type === 'revenue').reduce((s, t) => s + Number(t.amount), 0) : 0
  const costs = data ? data.filter(t => t.type === 'cost') : []

  const sumBy = (cats) => costs.filter(t => cats.includes(t.category)).reduce((s, t) => s + Number(t.amount), 0)
  const foodCost = sumBy(FOOD_CATEGORIES)
  const salaryAndOverhead = sumBy(OVERHEAD_CATEGORIES)
  const otherCost = costs.filter(t => ![...FOOD_CATEGORIES, ...OVERHEAD_CATEGORIES].includes(t.category))
    .reduce((s, t) => s + Number(t.amount), 0)
  const totalCost = foodCost + salaryAndOverhead + otherCost
  const grossProfit = revenue - foodCost
  const netProfit = revenue - totalCost
  const grossPct = revenue > 0 ? (grossProfit / revenue * 100) : 0
  const netPct = revenue > 0 ? (netProfit / revenue * 100) : 0

  // 各成本細項
  const costBreakdown = COST_CATEGORIES.map(c => ({
    label: c.label,
    icon: c.icon,
    color: c.color,
    amount: costs.filter(t => t.category === c.value).reduce((s, t) => s + Number(t.amount), 0),
  })).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount)

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  return (
    <div className="space-y-3">
      {/* 月份選擇 */}
      <div className="flex gap-2 items-center">
        <select value={year} onChange={e => setYear(+e.target.value)}
          className={inputCls} style={{ ...inputStyle, width: '90px' }}>
          {years.map(y => <option key={y}>{y}</option>)}
        </select>
        <select value={month} onChange={e => setMonth(+e.target.value)}
          className={inputCls} style={{ ...inputStyle, width: '70px' }}>
          {months.map(m => <option key={m} value={m}>{m} 月</option>)}
        </select>
        <span className="text-xs text-green-700">的成本報表</span>
      </div>

      {loading ? (
        <div className="text-center text-sm text-green-700 py-8">載入中…</div>
      ) : !data ? null : (
        <>
          {/* 損益摘要 */}
          <Card>
            <div className="text-sm font-semibold text-green-800 mb-3">{year} 年 {month} 月 損益摘要</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-green-700">總營收</span><span className="font-bold text-green-900">{formatCurrency(revenue)}</span></div>
              <div className="flex justify-between"><span className="text-green-700">食材成本</span><span className="font-bold text-red-600">- {formatCurrency(foodCost)}</span></div>
              <div className="flex justify-between border-t border-green-200 pt-1">
                <span className="font-semibold text-green-800">毛利</span>
                <span className="font-bold" style={{ color: marginColor(grossPct) }}>
                  {formatCurrency(grossProfit)}（{grossPct.toFixed(1)}%）
                </span>
              </div>
              <div className="flex justify-between"><span className="text-green-700">薪資＋管銷</span><span className="text-orange-700">- {formatCurrency(salaryAndOverhead)}</span></div>
              <div className="flex justify-between"><span className="text-green-700">其他成本</span><span className="text-orange-700">- {formatCurrency(otherCost)}</span></div>
              <div className="flex justify-between border-t border-green-200 pt-1">
                <span className="font-semibold text-green-800">淨利</span>
                <span className="font-bold" style={{ color: marginColor(netPct) }}>
                  {formatCurrency(netProfit)}（{netPct.toFixed(1)}%）
                </span>
              </div>
            </div>
          </Card>

          {/* 成本結構橫條圖 */}
          {costBreakdown.length > 0 && (
            <Card>
              <div className="text-sm font-semibold text-green-800 mb-3">成本結構</div>
              <div className="space-y-2">
                {costBreakdown.map(c => {
                  const pct = totalCost > 0 ? (c.amount / totalCost * 100) : 0
                  return (
                    <div key={c.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span>{c.icon} {c.label}</span>
                        <span className="text-green-700">{formatCurrency(c.amount)} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div style={{ background: '#d4d9a8', borderRadius: '99px', height: '8px' }}>
                        <div style={{ background: c.color, width: `${pct}%`, height: '8px', borderRadius: '99px', transition: 'width 0.4s' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="text-right text-xs text-green-700 mt-2">總成本：{formatCurrency(totalCost)}</div>
            </Card>
          )}

          {revenue === 0 && totalCost === 0 && (
            <div className="text-center text-sm text-green-600 py-4">此月份尚無記帳資料</div>
          )}
        </>
      )}
    </div>
  )
}

// ── 主頁面 ────────────────────────────────────────────────────
const TABS = [
  { key: 'ingredients', label: '📦 食材管理' },
  { key: 'products', label: '🥟 產品配方' },
  { key: 'report', label: '📊 成本報表' },
]

export default function CostPage() {
  const [tab, setTab] = useState('ingredients')
  const [dailyUnits, setDailyUnits] = useState(() => {
    const v = localStorage.getItem('pangbao_daily_units')
    return v ? parseInt(v) : 700
  })

  return (
    <div className="min-h-screen pb-24" style={{ background: '#f4f6e4' }}>
      {/* Header */}
      <div style={{ background: '#e6eac8', borderBottom: '1px solid #b5c265', padding: '1rem 1rem 0' }}>
        <h1 className="text-xl font-bold text-green-900 mb-3">成本分析</h1>
        <div className="flex gap-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                padding: '0.4rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: tab === t.key ? 700 : 500,
                borderRadius: '0.5rem 0.5rem 0 0',
                border: '1px solid #b5c265',
                borderBottom: tab === t.key ? '1px solid #e6eac8' : '1px solid #b5c265',
                background: tab === t.key ? '#f4f6e4' : 'transparent',
                color: tab === t.key ? '#16a34a' : '#5a6b20',
                cursor: 'pointer',
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        {tab === 'ingredients' && <IngredientsTab />}
        {tab === 'products' && <ProductsTab dailyUnits={dailyUnits} setDailyUnits={setDailyUnits} />}
        {tab === 'report' && <ReportTab dailyUnits={dailyUnits} />}
      </div>
    </div>
  )
}
