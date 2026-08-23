import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const CalIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const ListIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
)
const ChartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
)

export default function Navbar({ onQuickAdd }) {
  const location = useLocation()

  const navItems = [
    { to: '/calendar', label: '記帳', Icon: CalIcon },
    { to: '/account', label: '帳戶', Icon: ListIcon },
    { to: '/chart', label: '圖表', Icon: ChartIcon },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 pb-safe"
      style={{ background: '#e6eac8', borderTop: '1px solid #b5c265', height: '64px' }}>
      {navItems.map(({ to, label, Icon }) => {
        const active = location.pathname.startsWith(to)
        return (
          <NavLink key={to} to={to}
            className="flex flex-col items-center justify-center flex-1 py-1 gap-0.5 rounded-xl transition-colors"
            style={{ color: active ? '#16a34a' : '#5a6b20' }}>
            <Icon />
            <span className="text-xs font-medium">{label}</span>
          </NavLink>
        )
      })}
      {/* Quick Add Button */}
      <button onClick={onQuickAdd}
        className="flex flex-col items-center justify-center flex-1 py-1 gap-0.5 rounded-xl transition-all active:scale-95"
        style={{ color: '#f4f6e4' }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
          style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', marginTop: '-20px', boxShadow: '0 4px 16px rgba(74,222,128,0.4)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </div>
        <span className="text-xs font-medium" style={{ color: '#5a6b20' }}>新增</span>
      </button>
    </nav>
  )
}
