import React, { useState, useEffect, useCallback } from 'react'
import { format, startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval, isSameDay, parseISO } from 'date-fns'
import { supabase } from '../../shared/lib/supabase.js'

const LEAVE_TYPES = ['特休', '病假', '事假', '補休', '其他']

// ── helpers ──────────────────────────────────────────────
function calcHours(start, end) {
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60)
}

// ── sub-components ───────────────────────────────────────

function EmployeeTab({ employees, onRefresh }) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    if (!name.trim()) return
    await supabase.from('employees').insert([{ name: name.trim(), role: role.trim() }])
    setName(''); setRole(''); setAdding(false)
    onRefresh()
  }

  const handleDelete = async (id) => {
    if (!window.confirm('確定刪除這位員工？相關工時和請假紀錄也會一併刪除。')) return
    await supabase.from('employees').delete().eq('id', id)
    onRefresh()
  }

  return (
    <div className="space-y-3">
      <button onClick={() => setAdding(true)}
        className="w-full py-2.5 rounded-xl text-sm font-semibold"
        style={{ background: '#16a34a', color: '#fff' }}>
        + 新增員工
      </button>

      {adding && (
        <div className="rounded-xl p-4 space-y-2" style={{ background: '#fff', border: '1px solid #b5c265' }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="姓名*"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: '#f4f6e4', border: '1px solid #b5c265', color: '#1e2e08' }} />
          <input value={role} onChange={e => setRole(e.target.value)} placeholder="職位（選填）"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: '#f4f6e4', border: '1px solid #b5c265', color: '#1e2e08' }} />
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="flex-1 py-2 rounded-lg text-sm"
              style={{ background: '#f4f6e4', color: '#5a6b20', border: '1px solid #b5c265' }}>取消</button>
            <button onClick={handleAdd} className="flex-1 py-2 rounded-lg text-sm font-semibold"
              style={{ background: '#16a34a', color: '#fff' }}>儲存</button>
          </div>
        </div>
      )}

      {employees.map(emp => (
        <div key={emp.id} className="flex items-center justify-between px-4 py-3 rounded-xl"
          style={{ background: '#fff', border: '1px solid #b5c265' }}>
          <div>
            <div className="font-semibold text-sm" style={{ color: '#1e2e08' }}>👤 {emp.name}</div>
            {emp.role && <div className="text-xs" style={{ color: '#5a6b20' }}>{emp.role}</div>}
          </div>
          <button onClick={() => handleDelete(emp.id)}
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ background: '#fee2e2', color: '#dc2626' }}>✕</button>
        </div>
      ))}
    </div>
  )
}

function HoursTab({ employees }) {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [empId, setEmpId] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [note, setNote] = useState('')
  const [records, setRecords] = useState([])

  const fetchRecords = useCallback(async () => {
    const { data } = await supabase
      .from('work_hours')
      .select('*, employees(name)')
      .eq('date', date)
      .order('created_at', { ascending: false })
    setRecords(data || [])
  }, [date])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  const handleSave = async () => {
    if (!empId || !date) return
    const hours = start && end ? calcHours(start, end) : 0
    await supabase.from('work_hours').insert([{
      employee_id: Number(empId), date, start_time: start || null,
      end_time: end || null, hours, note: note.trim() || null
    }])
    setStart(''); setEnd(''); setNote(''); setEmpId('')
    fetchRecords()
  }

  return (
    <div className="space-y-4">
      {/* Input Card */}
      <div className="rounded-xl p-4 space-y-3" style={{ background: '#fff', border: '1px solid #b5c265' }}>
        <div className="text-sm font-semibold" style={{ color: '#1e2e08' }}>記錄工時</div>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: '#f4f6e4', border: '1px solid #b5c265', color: '#1e2e08' }} />
        <select value={empId} onChange={e => setEmpId(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: '#f4f6e4', border: '1px solid #b5c265', color: '#1e2e08' }}>
          <option value="">選擇員工</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <div className="flex gap-2">
          <div className="flex-1">
            <div className="text-xs mb-1" style={{ color: '#5a6b20' }}>上班時間</div>
            <input type="time" value={start} onChange={e => setStart(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: '#f4f6e4', border: '1px solid #b5c265', color: '#1e2e08' }} />
          </div>
          <div className="flex-1">
            <div className="text-xs mb-1" style={{ color: '#5a6b20' }}>下班時間</div>
            <input type="time" value={end} onChange={e => setEnd(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: '#f4f6e4', border: '1px solid #b5c265', color: '#1e2e08' }} />
          </div>
        </div>
        {start && end && (
          <div className="text-sm text-center font-semibold" style={{ color: '#16a34a' }}>
            共 {calcHours(start, end).toFixed(1)} 小時
          </div>
        )}
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="備註（選填）"
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: '#f4f6e4', border: '1px solid #b5c265', color: '#1e2e08' }} />
        <button onClick={handleSave}
          className="w-full py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: '#16a34a', color: '#fff' }}>儲存</button>
      </div>

      {/* Records */}
      {records.length > 0 && (
        <div>
          <div className="text-xs font-semibold mb-2 px-1" style={{ color: '#5a6b20' }}>{date} 的紀錄</div>
          {records.map(r => (
            <div key={r.id} className="flex items-center justify-between px-4 py-3 rounded-xl mb-2"
              style={{ background: '#fff', border: '1px solid #b5c265' }}>
              <div>
                <div className="font-semibold text-sm" style={{ color: '#1e2e08' }}>{r.employees?.name}</div>
                <div className="text-xs" style={{ color: '#5a6b20' }}>
                  {r.start_time?.slice(0,5)} – {r.end_time?.slice(0,5)}
                  {r.note ? ` ・ ${r.note}` : ''}
                </div>
              </div>
              <div className="font-bold text-sm" style={{ color: '#16a34a' }}>{Number(r.hours).toFixed(1)}h</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ChartTab({ employees }) {
  const [month, setMonth] = useState(new Date())
  const [data, setData] = useState([])

  useEffect(() => {
    async function fetch() {
      const start = format(startOfMonth(month), 'yyyy-MM-dd')
      const end = format(endOfMonth(month), 'yyyy-MM-dd')
      const { data: rows } = await supabase
        .from('work_hours')
        .select('employee_id, hours, employees(name)')
        .gte('date', start).lte('date', end)
      // aggregate by employee
      const map = {}
      for (const r of rows || []) {
        const name = r.employees?.name || '?'
        map[name] = (map[name] || 0) + Number(r.hours)
      }
      setData(Object.entries(map).map(([name, hours]) => ({ name, hours })))
    }
    fetch()
  }, [month])

  const maxH = Math.max(...data.map(d => d.hours), 1)

  return (
    <div className="space-y-4">
      {/* Month Nav */}
      <div className="flex items-center justify-between px-2">
        <button onClick={() => setMonth(m => subMonths(m, 1))}
          className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ background: '#fff', border: '1px solid #b5c265', color: '#5a6b20' }}>‹</button>
        <span className="font-semibold text-sm" style={{ color: '#1e2e08' }}>{format(month, 'yyyy 年 M 月')}</span>
        <button onClick={() => setMonth(m => addMonths(m, 1))}
          className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ background: '#fff', border: '1px solid #b5c265', color: '#5a6b20' }}>›</button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: '#5a6b20' }}>本月尚無工時紀錄</div>
      ) : (
        <div className="rounded-xl p-4 space-y-4" style={{ background: '#fff', border: '1px solid #b5c265' }}>
          <div className="text-sm font-semibold" style={{ color: '#1e2e08' }}>月工時統計</div>
          {data.map(({ name, hours }) => (
            <div key={name}>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: '#1e2e08' }}>{name}</span>
                <span className="font-bold" style={{ color: '#16a34a' }}>{hours.toFixed(1)} h</span>
              </div>
              <div className="h-4 rounded-full overflow-hidden" style={{ background: '#f4f6e4' }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${(hours / maxH) * 100}%`, background: 'linear-gradient(90deg, #16a34a, #4ade80)' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function LeaveTab({ employees }) {
  const [empId, setEmpId] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [type, setType] = useState(LEAVE_TYPES[0])
  const [note, setNote] = useState('')
  const [leaves, setLeaves] = useState([])

  const fetchLeaves = useCallback(async () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const { data } = await supabase
      .from('leaves')
      .select('*, employees(name)')
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(20)
    setLeaves(data || [])
  }, [])

  useEffect(() => { fetchLeaves() }, [fetchLeaves])

  const handleSave = async () => {
    if (!empId || !date) return
    await supabase.from('leaves').insert([{
      employee_id: Number(empId), date, leave_type: type, note: note.trim() || null
    }])
    setEmpId(''); setNote(''); fetchLeaves()
  }

  const handleDelete = async (id) => {
    await supabase.from('leaves').delete().eq('id', id)
    fetchLeaves()
  }

  const today = format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="space-y-4">
      {/* Input */}
      <div className="rounded-xl p-4 space-y-3" style={{ background: '#fff', border: '1px solid #b5c265' }}>
        <div className="text-sm font-semibold" style={{ color: '#1e2e08' }}>新增請假</div>
        <select value={empId} onChange={e => setEmpId(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: '#f4f6e4', border: '1px solid #b5c265', color: '#1e2e08' }}>
          <option value="">選擇員工</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: '#f4f6e4', border: '1px solid #b5c265', color: '#1e2e08' }} />
        <select value={type} onChange={e => setType(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: '#f4f6e4', border: '1px solid #b5c265', color: '#1e2e08' }}>
          {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="備註（選填）"
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: '#f4f6e4', border: '1px solid #b5c265', color: '#1e2e08' }} />
        <button onClick={handleSave}
          className="w-full py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: '#16a34a', color: '#fff' }}>儲存</button>
      </div>

      {/* Upcoming Leaves */}
      <div>
        <div className="text-xs font-semibold mb-2 px-1" style={{ color: '#5a6b20' }}>即將請假提醒</div>
        {leaves.length === 0 ? (
          <div className="text-center py-8 text-sm" style={{ color: '#5a6b20' }}>暫無請假紀錄</div>
        ) : leaves.map(l => {
          const isToday = l.date === today
          return (
            <div key={l.id} className="flex items-center justify-between px-4 py-3 rounded-xl mb-2"
              style={{ background: isToday ? '#fef9c3' : '#fff', border: `1px solid ${isToday ? '#d97706' : '#b5c265'}` }}>
              <div>
                <div className="font-semibold text-sm" style={{ color: '#1e2e08' }}>
                  {isToday ? '📅 今天 · ' : ''}{l.employees?.name}
                </div>
                <div className="text-xs" style={{ color: '#5a6b20' }}>
                  {l.date} ・ {l.leave_type}{l.note ? ` ・ ${l.note}` : ''}
                </div>
              </div>
              <button onClick={() => handleDelete(l.id)}
                className="w-7 h-7 flex items-center justify-center rounded-full text-xs"
                style={{ background: '#fee2e2', color: '#dc2626' }}>✕</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────
export default function StaffPage() {
  const [tab, setTab] = useState('employees')
  const [employees, setEmployees] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchEmployees = useCallback(async () => {
    const { data } = await supabase.from('employees').select('*').order('created_at')
    setEmployees(data || [])
  }, [])

  useEffect(() => { fetchEmployees() }, [fetchEmployees, refreshKey])

  const tabs = [
    { key: 'employees', label: '員工' },
    { key: 'hours', label: '工時' },
    { key: 'chart', label: '圖表' },
    { key: 'leave', label: '請假' },
  ]

  return (
    <div className="min-h-screen pb-24" style={{ background: '#f4f6e4' }}>
      <div className="px-4 pt-5 pb-3" style={{ background: '#e6eac8', borderBottom: '1px solid #b5c265' }}>
        <h1 className="text-lg font-bold" style={{ color: '#1e2e08' }}>👥 員工管理</h1>
      </div>

      {/* Tabs */}
      <div className="flex mx-4 mt-3 mb-4 rounded-xl overflow-hidden" style={{ background: '#e6eac8', border: '1px solid #b5c265' }}>
        {tabs.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex-1 py-2 text-xs font-semibold"
            style={{
              background: tab === key ? '#16a34a' : 'transparent',
              color: tab === key ? '#fff' : '#5a6b20',
            }}>
            {label}
          </button>
        ))}
      </div>

      <div className="px-4">
        {tab === 'employees' && <EmployeeTab employees={employees} onRefresh={() => setRefreshKey(k => k + 1)} />}
        {tab === 'hours' && <HoursTab employees={employees} />}
        {tab === 'chart' && <ChartTab employees={employees} />}
        {tab === 'leave' && <LeaveTab employees={employees} />}
      </div>
    </div>
  )
}
