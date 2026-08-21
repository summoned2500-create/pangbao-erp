import React, { useState, useEffect, useCallback } from 'react'
import { format, subDays, startOfYear, eachWeekOfInterval, eachMonthOfInterval, endOfMonth, endOfWeek } from 'date-fns'
import { supabase } from '../supabase.js'
import ChartView from '../components/ChartView.jsx'
import { formatCurrency } from '../theme.js'

export default function ChartPage({ refreshKey }) {
  const [period, setPeriod] = useState('daily')
  const [chartType, setChartType] = useState('bar')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalCost, setTotalCost] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)

  const fetchData = useCallback(async () => {
    setLoading(true)
    let fromDate, toDate

    if (period === 'daily') {
      fromDate = format(subDays(new Date(), 29), 'yyyy-MM-dd')
      toDate = format(new Date(), 'yyyy-MM-dd')
    } else if (period === 'weekly') {
      fromDate = format(subDays(new Date(), 83), 'yyyy-MM-dd')
      toDate = format(new Date(), 'yyyy-MM-dd')
    } else {
      fromDate = format(startOfYear(new Date()), 'yyyy-MM-dd')
      toDate = format(new Date(), 'yyyy-MM-dd')
    }

    const { data: rows } = await supabase
      .from('transactions')
      .select('date, type, amount')
      .gte('date', fromDate)
      .lte('date', toDate)

    const costMap = {}
    const revMap = {}

    ;(rows || []).forEach(({ date, type, amount }) => {
      if (type === 'cost') costMap[date] = (costMap[date] || 0) + Number(amount)
      else revMap[date] = (revMap[date] || 0) + Number(amount)
    })

    let chartData = []

    if (period === 'daily') {
      for (let i = 29; i >= 0; i--) {
        const d = format(subDays(new Date(), i), 'yyyy-MM-dd')
        chartData.push({
          label: format(new Date(d + 'T00:00:00'), 'M/d'),
          成本: costMap[d] || 0,
          '營收': revMap[d] || 0,
        })
      }
    } else if (period === 'weekly') {
      const start = subDays(new Date(), 83)
      const weeks = eachWeekOfInterval({ start, end: new Date() }, { weekStartsOn: 1 })
      chartData = weeks.map((weekStart) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
        let cost = 0, revenue = 0
        for (const [date, amt] of Object.entries(costMap)) {
          const d = new Date(date + 'T00:00:00')
          if (d >= weekStart && d <= weekEnd) cost += amt
        }
        for (const [date, amt] of Object.entries(revMap)) {
          const d = new Date(date + 'T00:00:00')
          if (d >= weekStart && d <= weekEnd) revenue += amt
        }
        return { label: format(weekStart, 'M/d'), 成本: cost, '營收': revenue }
      })
    } else {
      const start = startOfYear(new Date())
      const months = eachMonthOfInterval({ start, end: new Date() })
      chartData = months.map((monthStart) => {
        const monthEnd = endOfMonth(monthStart)
        let cost = 0, revenue = 0
        for (const [date, amt] of Object.entries(costMap)) {
          const d = new Date(date + 'T00:00:00')
          if (d >= monthStart && d <= monthEnd) cost += amt
        }
        for (const [date, amt] of Object.entries(revMap)) {
          const d = new Date(date + 'T00:00:00')
          if (d >= monthStart && d <= monthEnd) revenue += amt
        }
        return { label: format(monthStart, 'M月'), 成本: cost, '營收': revenue }
      })
    }

    setData(chartData)
    setTotalCost(Object.values(costMap).reduce((s, v) => s + v, 0))
    setTotalRevenue(Object.values(revMap).reduce((s, v) => s + v, 0))
    setLoading(false)
  }, [period])

  useEffect(() => { fetchData() }, [fetchData, refreshKey])

  const profit = totalRevenue - totalCost

  return (
    <div style={{ background: '#0a1a0f', minHeight: '100%' }}>
      <div className="px-4 pt-4 pb-3" style={{ background: '#122018', borderBottom: '1px solid #2d4a32' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">📈</span>
          <span className="text-lg font-bold" style={{ color: '#4ade80' }}>圖表分析</span>
        </div>

        <div className="flex justify-between items-center gap-2">
          <div className="flex gap-1.5">
            {[['daily','日'],['weekly','週'],['monthly','月']].map(([key, label]) => (
              <button key={key} onClick={() => setPeriod(key)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  background: period === key ? '#4ade80' : '#1a2e1f',
                  color: period === key ? '#0a1a0f' : '#86efac',
                  border: period === key ? 'none' : '1px solid #2d4a32',
                }}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {[['bar','▐▌'],['line','〰']].map(([key, icon]) => (
              <button key={key} onClick={() => setChartType(key)}
                className="w-8 h-8 rounded-lg text-sm font-bold transition-all"
                style={{
                  background: chartType === key ? '#4ade80' : '#1a2e1f',
                  color: chartType === key ? '#0a1a0f' : '#86efac',
                  border: chartType === key ? 'none' : '1px solid #2d4a32',
                }}>
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 px-3 pt-3">
        {[
          { label: period === 'daily' ? '近30天成本' : period === 'weekly' ? '近12週成本' : '今年成本', value: totalCost, color: '#fca5a5' },
          { label: period === 'daily' ? '近30天營收' : period === 'weekly' ? '近12週營收' : '今年營收', value: totalRevenue, color: '#4ade80' },
          { label: '利潤', value: profit, color: profit >= 0 ? '#86efac' : '#f87171' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-3 text-center" style={{ background: '#122018', border: '1px solid #2d4a32' }}>
            <div className="text-xs mb-1 leading-tight" style={{ color: '#4b7a56' }}>{label}</div>
            <div className="text-xs font-bold" style={{ color }}>{formatCurrency(Math.abs(value))}</div>
          </div>
        ))}
      </div>

      <div className="px-3 pt-3 pb-6">
        {loading ? (
          <div className="flex items-center justify-center h-52">
            <div className="text-sm" style={{ color: '#4b7a56' }}>載入中...</div>
          </div>
        ) : (
          <ChartView data={data} chartType={chartType} period={period} />
        )}
      </div>
    </div>
  )
}
