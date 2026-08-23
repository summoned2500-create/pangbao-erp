import React from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { formatCurrency } from '../../shared/theme.js'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="rounded-xl p-3 shadow-xl" style={{ background: '#ffffff', border: '1px solid #b5c265', minWidth: 140 }}>
      <div className="text-xs mb-2" style={{ color: '#2a7a40' }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex justify-between gap-4 text-xs mb-0.5">
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ color: '#1e2e08', fontWeight: 600 }}>{formatCurrency(p.value)}</span>
        </div>
      ))}
      {payload.length === 2 && (
        <div className="flex justify-between gap-4 text-xs mt-1 pt-1" style={{ borderTop: '1px solid #b5c265' }}>
          <span style={{ color: '#2a7a40' }}>利潤</span>
          <span style={{ color: payload[1].value - payload[0].value >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
            {formatCurrency(payload[1].value - payload[0].value)}
          </span>
        </div>
      )}
    </div>
  )
}

export default function ChartView({ data, chartType, period }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-52 gap-2">
        <span className="text-3xl">📊</span>
        <div className="text-sm" style={{ color: '#5a6b20' }}>此期間沒有資料</div>
      </div>
    )
  }

  const commonProps = {
    data,
    margin: { top: 8, right: 8, left: 0, bottom: 4 },
  }

  const axisStyle = { fill: '#5a6b20', fontSize: 10 }

  return (
    <div className="space-y-6">
      {/* Main Chart */}
      <div className="rounded-xl p-3" style={{ background: '#e6eac8', border: '1px solid #b5c265' }}>
        <div className="text-xs font-semibold mb-3 px-1" style={{ color: '#2a7a40' }}>
          成本 vs 營收
        </div>
        <ResponsiveContainer width="100%" height={200}>
          {chartType === 'bar' ? (
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" vertical={false} />
              <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? (v/1000)+'k' : v} width={36} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#2a7a40' }} />
              <Bar dataKey="成本" fill="#ef4444" radius={[4,4,0,0]} maxBarSize={32} />
              <Bar dataKey="營收" fill="#16a34a" radius={[4,4,0,0]} maxBarSize={32} />
            </BarChart>
          ) : (
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" vertical={false} />
              <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? (v/1000)+'k' : v} width={36} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#2a7a40' }} />
              <Line type="monotone" dataKey="成本" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: '#ef4444' }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="營收" stroke="#16a34a" strokeWidth={2} dot={{ r: 3, fill: '#16a34a' }} activeDot={{ r: 5 }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Profit Chart */}
      <div className="rounded-xl p-3" style={{ background: '#e6eac8', border: '1px solid #b5c265' }}>
        <div className="text-xs font-semibold mb-3 px-1" style={{ color: '#2a7a40' }}>利潤趨勢</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data.map(d => ({ ...d, 利潤: d['營收'] - d['成本'] }))} margin={commonProps.margin}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" vertical={false} />
            <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? (v/1000)+'k' : v} width={36} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="利潤" radius={[4,4,0,0]} maxBarSize={32}
              fill="#16a34a"
              label={false}
              isAnimationActive={true}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #b5c265' }}>
        <div className="px-3 py-2" style={{ background: '#ffffff', borderBottom: '1px solid #b5c265' }}>
          <div className="grid grid-cols-4 text-xs font-semibold" style={{ color: '#5a6b20' }}>
            <span>期間</span>
            <span className="text-right" style={{ color: '#ef4444' }}>成本</span>
            <span className="text-right" style={{ color: '#16a34a' }}>營收</span>
            <span className="text-right">利潤</span>
          </div>
        </div>
        {data.map((d, i) => {
          const p = d['營收'] - d['成本']
          return (
            <div key={i} className="px-3 py-2" style={{ background: '#e6eac8', borderBottom: i < data.length-1 ? '1px solid #ffffff' : 'none' }}>
              <div className="grid grid-cols-4 text-xs">
                <span style={{ color: '#2a7a40' }}>{d.label}</span>
                <span className="text-right" style={{ color: '#ef4444' }}>{formatCurrency(d['成本'])}</span>
                <span className="text-right" style={{ color: '#16a34a' }}>{formatCurrency(d['營收'])}</span>
                <span className="text-right" style={{ color: p >= 0 ? '#2a7a40' : '#dc2626', fontWeight: 600 }}>{formatCurrency(p)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
