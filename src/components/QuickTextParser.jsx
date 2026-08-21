import React, { useState } from 'react'
import { insertTransaction } from '../supabase.js'
import { COST_CATEGORIES, REVENUE_CHANNELS } from '../theme.js'
import { format } from 'date-fns'

// 建立關鍵字對應表
const KEYWORD_MAP = []

for (const cat of COST_CATEGORIES) {
  KEYWORD_MAP.push({ keywords: [cat.value, cat.label], category: cat.value, type: 'cost' })
}
// 額外成本關鍵字
KEYWORD_MAP.push({ keywords: ['瓦斯', '桶裝瓦斯'], category: '桶裝瓦斯', type: 'cost' })
KEYWORD_MAP.push({ keywords: ['豬肉', '肉'], category: '豬肉', type: 'cost' })
KEYWORD_MAP.push({ keywords: ['餃子皮', '皮'], category: '餃子皮', type: 'cost' })
KEYWORD_MAP.push({ keywords: ['蔬菜', '菜'], category: '蔬菜', type: 'cost' })
KEYWORD_MAP.push({ keywords: ['紙類', '雜項', '紙'], category: '紙類雜項', type: 'cost' })

for (const ch of REVENUE_CHANNELS) {
  KEYWORD_MAP.push({ keywords: [ch.value, ch.label], category: ch.value, type: 'revenue' })
}
// 額外營收關鍵字
KEYWORD_MAP.push({ keywords: ['現金', '門市現金', '市現金'], category: '門市現金', type: 'revenue' })
KEYWORD_MAP.push({ keywords: ['line pay', 'linepay', 'line'], category: 'LINE Pay', type: 'revenue' })
KEYWORD_MAP.push({ keywords: ['全支付'], category: '全支付', type: 'revenue' })
KEYWORD_MAP.push({ keywords: ['台灣pay', '台灣 pay', '台灣pay'], category: '台灣 Pay', type: 'revenue' })
KEYWORD_MAP.push({ keywords: ['信用卡', '其他'], category: '信用卡/其他', type: 'revenue' })
KEYWORD_MAP.push({ keywords: ['uber', 'ubereats', 'uber eats', '外送'], category: 'Uber Eats 外送', type: 'revenue' })
KEYWORD_MAP.push({ keywords: ['ichef', 'i chef', '日結', '門市日結'], category: 'iCHEF 門市日結總額', type: 'revenue' })

function parseText(text) {
  const results = []
  // 以逗號或換行分割
  const segments = text.split(/[,，\n]+/).map(s => s.trim()).filter(Boolean)

  for (const seg of segments) {
    // 找數字
    const numMatch = seg.match(/(\d+(?:\.\d+)?)/)
    if (!numMatch) continue
    const amount = Number(numMatch[1])
    if (!amount) continue

    const lower = seg.toLowerCase().replace(/\s+/g, ' ')

    // 找最長關鍵字符合
    let matched = null
    let matchLen = 0
    for (const entry of KEYWORD_MAP) {
      for (const kw of entry.keywords) {
        if (lower.includes(kw.toLowerCase()) && kw.length > matchLen) {
          matched = entry
          matchLen = kw.length
        }
      }
    }

    if (matched) {
      results.push({ ...matched, amount, raw: seg })
    }
  }
  return results
}

export default function QuickTextParser({ date, onAdded, onClose }) {
  const [text, setText] = useState('')
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleParse = () => {
    setError('')
    setDone(false)
    const results = parseText(text)
    if (!results.length) {
      setError('無法解析任何項目，請確認格式（例：現金 3500, 豬肉 1500）')
      return
    }
    setPreview(results)
  }

  const handleSave = async () => {
    if (!preview?.length) return
    setLoading(true)
    setError('')
    try {
      for (const item of preview) {
        await insertTransaction({
          date: format(date, 'yyyy-MM-dd'),
          type: item.type,
          category: item.category,
          amount: item.amount,
          note: '',
        })
      }
      setDone(true)
      setText('')
      setPreview(null)
      onAdded && onAdded()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="text-xs px-1" style={{ color: '#4b7a56' }}>
        輸入格式範例：<span style={{ color: '#86efac' }}>門市現金 3500, LINE Pay 1800, Uber 2400, 豬肉 1500, 瓦斯 850</span>
      </div>

      <textarea
        rows={3}
        placeholder="門市現金 3500, LINE Pay 1800, Uber Eats 2400, 豬肉 1500, 瓦斯 850"
        value={text}
        onChange={(e) => { setText(e.target.value); setPreview(null); setDone(false) }}
        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
        style={{ background: '#1a2e1f', border: '1px solid #2d4a32', color: '#e2f5e8' }}
        onFocus={(e) => e.target.style.borderColor = '#4ade80'}
        onBlur={(e) => e.target.style.borderColor = '#2d4a32'}
      />

      {!preview && (
        <button onClick={handleParse} disabled={!text.trim()}
          className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all active:scale-95"
          style={{ background: text.trim() ? 'linear-gradient(135deg,#fbbf24,#f59e0b)' : '#2d4a32', color: '#0a1a0f' }}>
          ⚡ 解析
        </button>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      {preview && (
        <div className="space-y-2">
          <div className="text-xs font-semibold px-1" style={{ color: '#86efac' }}>解析結果（共 {preview.length} 筆）</div>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #2d4a32' }}>
            {preview.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2"
                style={{ borderBottom: i < preview.length-1 ? '1px solid #1a2e1f' : 'none', background: '#122018' }}>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{
                    background: item.type === 'revenue' ? '#4ade8022' : '#fca5a522',
                    color: item.type === 'revenue' ? '#4ade80' : '#fca5a5',
                  }}>
                    {item.type === 'revenue' ? '營' : '成'}
                  </span>
                  <span className="text-sm" style={{ color: '#e2f5e8' }}>{item.category}</span>
                </div>
                <span className="text-sm font-semibold" style={{ color: item.type === 'revenue' ? '#4ade80' : '#fca5a5' }}>
                  NT${item.amount.toLocaleString('zh-TW')}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setPreview(null)}
              className="flex-1 py-2.5 rounded-lg font-semibold text-sm"
              style={{ background: '#1a2e1f', color: '#86efac', border: '1px solid #2d4a32' }}>
              重新輸入
            </button>
            <button onClick={handleSave} disabled={loading}
              className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all active:scale-95"
              style={{ background: loading ? '#2d4a32' : 'linear-gradient(135deg,#4ade80,#22c55e)', color: '#0a1a0f' }}>
              {loading ? '儲存中...' : '✓ 確認儲存'}
            </button>
          </div>
        </div>
      )}

      {done && (
        <div className="text-center text-sm py-2" style={{ color: '#4ade80' }}>✓ 全部儲存成功！</div>
      )}
    </div>
  )
}
