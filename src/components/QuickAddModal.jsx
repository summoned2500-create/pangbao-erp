import React, { useState } from 'react'
import AddCostForm from './AddCostForm.jsx'
import AddRevenueForm from './AddRevenueForm.jsx'

export default function QuickAddModal({ onClose, onAdded }) {
  const [tab, setTab] = useState('cost')
  const today = new Date()

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-lg rounded-t-2xl shadow-2xl overflow-hidden"
        style={{ background: '#122018', border: '1px solid #2d4a32', maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🥟</span>
            <span className="font-bold" style={{ color: '#4ade80' }}>快速新增</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#1a2e1f', color: '#86efac' }}>
              今天 {today.getMonth()+1}/{today.getDate()}
            </span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style={{ background: '#1a2e1f', color: '#86efac' }}>✕</button>
        </div>

        {/* Tabs */}
        <div className="flex mx-4 mb-4 rounded-lg overflow-hidden" style={{ background: '#1a2e1f', border: '1px solid #2d4a32' }}>
          {[['cost','💸 成本'],['revenue','💰 營收']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className="flex-1 py-2 text-sm font-semibold transition-all"
              style={{
                background: tab === key ? 'linear-gradient(135deg,#4ade80,#22c55e)' : 'transparent',
                color: tab === key ? '#0a1a0f' : '#86efac',
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="px-4 pb-6 overflow-y-auto" style={{ maxHeight: '60vh' }}>
          {tab === 'cost'
            ? <AddCostForm date={today} onAdded={onAdded} compact />
            : <AddRevenueForm date={today} onAdded={onAdded} compact />
          }
        </div>
      </div>
    </div>
  )
}
