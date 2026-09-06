import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../shared/lib/supabase.js'

const inputCls = 'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400'
const inputStyle = { background: '#f4f6e4', borderColor: '#b5c265' }
const btnPrimary = {
  background: 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff',
  borderRadius: '0.5rem', padding: '0.4rem 1rem', fontSize: '0.875rem',
  fontWeight: 600, cursor: 'pointer', border: 'none',
}
const btnDanger = { ...btnPrimary, background: 'linear-gradient(135deg,#dc2626,#b91c1c)' }
const btnSecondary = { ...btnPrimary, background: 'none', border: '1px solid #b5c265', color: '#2a7a40' }

const Card = ({ children, style }) => (
  <div style={{ background: '#e6eac8', border: '1px solid #b5c265', borderRadius: '0.75rem', padding: '1rem', ...style }}>
    {children}
  </div>
)

const PLATFORMS = [
  { value: 'line',      label: 'LINE 官方帳號', icon: '💚' },
  { value: 'facebook',  label: 'Facebook 粉專', icon: '👍' },
  { value: 'instagram', label: 'Instagram',      icon: '📸' },
  { value: 'google',    label: 'Google 商家',    icon: '🔍' },
  { value: 'all',       label: '全平台',          icon: '📣' },
]

const STATUS_LABEL = {
  draft:     { label: '草稿',   color: '#6b7280' },
  ready:     { label: '排程中', color: '#d97706' },
  published: { label: '已發布', color: '#16a34a' },
  failed:    { label: '失敗',   color: '#dc2626' },
}

function formatDatetimeLocal(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).replace(/\//g, '-').replace(' ', 'T').slice(0, 16)
}

const defaultForm = () => ({
  platform: 'line',
  title: '',
  content: '',
  media_url: '',
  target_audience: '',
  scheduled_at: '',
  status: 'draft',
})

export default function MarketingPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(defaultForm())
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all') // all | draft | ready | published | failed

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('marketing_posts')
      .select('*')
      .order('scheduled_at', { ascending: false })
    setPosts(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.content.trim()) { alert('請輸入文案內容'); return }
    if (!form.scheduled_at) { alert('請選擇排程時間'); return }
    setSaving(true)
    try {
      const payload = {
        platform: form.platform,
        title: form.title.trim() || null,
        content: form.content.trim(),
        media_url: form.media_url.trim() || null,
        target_audience: form.target_audience.trim() || 'all',
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        status: form.status,
      }
      await supabase.from('marketing_posts').insert(payload)
      setForm(defaultForm())
      setShowAdd(false)
      load()
    } catch (err) {
      alert('儲存失敗：' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    await supabase.from('marketing_posts').update({ status: newStatus }).eq('id', id)
    load()
  }

  const handleDelete = async (id) => {
    if (!window.confirm('確定刪除此貼文？')) return
    await supabase.from('marketing_posts').delete().eq('id', id)
    load()
  }

  const filtered = filter === 'all' ? posts : posts.filter(p => p.status === filter)

  return (
    <div className="min-h-screen pb-24" style={{ background: '#f4f6e4' }}>
      {/* Header */}
      <div style={{ background: '#e6eac8', borderBottom: '1px solid #b5c265', padding: '1rem' }}>
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-xl font-bold text-green-900">行銷排程</h1>
          <button style={btnPrimary} onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? '取消' : '＋ 新增貼文'}
          </button>
        </div>

        {/* 狀態篩選 */}
        <div className="flex gap-1 flex-wrap">
          {[
            { key: 'all', label: '全部' },
            { key: 'draft', label: '草稿' },
            { key: 'ready', label: '排程中' },
            { key: 'published', label: '已發布' },
            { key: 'failed', label: '失敗' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{
                padding: '0.25rem 0.6rem', fontSize: '0.75rem', borderRadius: '99px',
                border: '1px solid #b5c265', cursor: 'pointer',
                background: filter === f.key ? '#16a34a' : 'transparent',
                color: filter === f.key ? '#fff' : '#5a6b20',
                fontWeight: filter === f.key ? 600 : 400,
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* 新增表單 */}
        {showAdd && (
          <Card>
            <div className="text-sm font-semibold text-green-800 mb-3">新增排程貼文</div>
            <form onSubmit={handleSubmit} className="space-y-2">
              {/* 平台 */}
              <div>
                <div className="text-xs text-green-700 mb-1">發布平台</div>
                <div className="flex gap-1 flex-wrap">
                  {PLATFORMS.map(p => (
                    <button type="button" key={p.value}
                      onClick={() => setForm(f => ({ ...f, platform: p.value }))}
                      style={{
                        padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: '99px',
                        border: '1px solid #b5c265', cursor: 'pointer',
                        background: form.platform === p.value ? '#16a34a' : 'transparent',
                        color: form.platform === p.value ? '#fff' : '#5a6b20',
                        fontWeight: form.platform === p.value ? 600 : 400,
                      }}>
                      {p.icon} {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 標題 */}
              <input className={inputCls} style={inputStyle} placeholder="標題（選填）"
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />

              {/* 文案內容 */}
              <textarea className={inputCls} style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' }}
                placeholder="文案內容（必填）"
                value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} required />

              {/* 圖片網址 */}
              <input className={inputCls} style={inputStyle}
                placeholder="圖片 HTTPS URL（IG 必填，需公開可直連）"
                value={form.media_url} onChange={e => setForm(f => ({ ...f, media_url: e.target.value }))} />

              {/* 排程時間 */}
              <div>
                <div className="text-xs text-green-700 mb-1">排程發布時間</div>
                <input type="datetime-local" className={inputCls} style={inputStyle}
                  value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} required />
              </div>

              {/* 狀態 */}
              <div className="flex gap-3 items-center text-sm text-green-800">
                <span>存為：</span>
                <label className="flex items-center gap-1">
                  <input type="radio" name="status" value="draft" checked={form.status === 'draft'}
                    onChange={() => setForm(f => ({ ...f, status: 'draft' }))} />
                  草稿
                </label>
                <label className="flex items-center gap-1">
                  <input type="radio" name="status" value="ready" checked={form.status === 'ready'}
                    onChange={() => setForm(f => ({ ...f, status: 'ready' }))} />
                  排程中（時間到自動發）
                </label>
              </div>

              <div className="flex gap-2 pt-1">
                <button type="submit" style={btnPrimary} disabled={saving}>{saving ? '儲存…' : '確認新增'}</button>
                <button type="button" style={btnSecondary} onClick={() => { setShowAdd(false); setForm(defaultForm()) }}>取消</button>
              </div>
            </form>
          </Card>
        )}

        {/* 貼文列表 */}
        {loading ? (
          <div className="text-center text-sm text-green-700 py-8">載入中…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-sm text-green-600 py-8">尚無貼文</div>
        ) : (
          filtered.map(post => {
            const st = STATUS_LABEL[post.status] || STATUS_LABEL.draft
            const pl = PLATFORMS.find(p => p.value === post.platform) || PLATFORMS[0]
            return (
              <Card key={post.id}>
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: '#f4f6e4', border: '1px solid #b5c265', color: '#2a7a40' }}>
                        {pl.icon} {pl.label}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: st.color + '20', color: st.color }}>
                        {st.label}
                      </span>
                    </div>
                    {post.title && <div className="font-semibold text-green-900 text-sm">{post.title}</div>}
                    <div className="text-xs text-green-800 mt-1 line-clamp-2">{post.content}</div>
                    <div className="text-xs text-green-600 mt-1">
                      🕐 {new Date(post.scheduled_at).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}
                      {post.published_at && ` ✓ 已發 ${new Date(post.published_at).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}`}
                    </div>
                    {post.error_log && <div className="text-xs text-red-600 mt-1">⚠️ {post.error_log}</div>}
                  </div>
                </div>

                {/* 操作按鈕 */}
                <div className="flex gap-2 mt-2 flex-wrap">
                  {post.status === 'draft' && (
                    <button style={{ ...btnPrimary, fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                      onClick={() => handleStatusChange(post.id, 'ready')}>
                      ▶ 啟用排程
                    </button>
                  )}
                  {post.status === 'ready' && (
                    <button style={{ ...btnSecondary, fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                      onClick={() => handleStatusChange(post.id, 'draft')}>
                      ⏸ 暫停
                    </button>
                  )}
                  {post.status === 'failed' && (
                    <button style={{ ...btnPrimary, fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                      onClick={() => handleStatusChange(post.id, 'ready')}>
                      🔄 重試
                    </button>
                  )}
                  <button style={{ ...btnDanger, fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                    onClick={() => handleDelete(post.id)}>🗑</button>
                </div>
              </Card>
            )
          })
        )}

        {/* 使用說明 */}
        <Card style={{ border: '1px dashed #b5c265', background: 'transparent' }}>
          <div className="text-xs text-green-700 space-y-1">
            <div className="font-semibold text-green-800 mb-1">📋 使用說明</div>
            <div>• LINE 官方帳號：狀態設為「排程中」，時間到自動廣播（每月免費 200 則）</div>
            <div>• FB / IG / Google：需搭配 Make.com 自動化（免費版每月 1000 次）</div>
            <div>• IG 貼文圖片網址必須是公開可直連的 HTTPS 連結</div>
            <div>• 全平台選項：LINE 自動發，其他平台由 Make.com 處理</div>
          </div>
        </Card>
      </div>
    </div>
  )
}
