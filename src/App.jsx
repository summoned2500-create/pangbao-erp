import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { isAuthed } from './features/auth/auth.js'
import LoginPage from './features/auth/LoginPage.jsx'
import Navbar from './shared/components/Navbar.jsx'
import CalendarPage from './features/calendar/CalendarPage.jsx'
import AccountPage from './features/account/AccountPage.jsx'
import ChartPage from './features/chart/ChartPage.jsx'
import InventoryPage from './features/inventory/InventoryPage.jsx'
import StaffPage from './features/staff/StaffPage.jsx'
import GoalPage from './features/goal/GoalPage.jsx'
import QuickAddModal from './features/transaction/QuickAddModal.jsx'

export default function App() {
  const [authed, setAuthed] = useState(isAuthed())
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleAdded = () => {
    setRefreshKey((k) => k + 1)
    setQuickAddOpen(false)
  }

  if (!authed) {
    return <LoginPage onLogin={() => setAuthed(true)} />
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col" style={{ background: '#f4f6e4' }}>
        <div className="flex-1 overflow-auto pb-20">
          <Routes>
            <Route path="/" element={<Navigate to="/calendar" replace />} />
            <Route path="/calendar" element={<CalendarPage refreshKey={refreshKey} />} />
            <Route path="/account" element={<AccountPage refreshKey={refreshKey} />} />
            <Route path="/chart" element={<ChartPage refreshKey={refreshKey} />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/staff" element={<StaffPage />} />
            <Route path="/goal" element={<GoalPage />} />
          </Routes>
        </div>
        <Navbar onQuickAdd={() => setQuickAddOpen(true)} />
        {quickAddOpen && (
          <QuickAddModal onClose={() => setQuickAddOpen(false)} onAdded={handleAdded} />
        )}
      </div>
    </BrowserRouter>
  )
}
