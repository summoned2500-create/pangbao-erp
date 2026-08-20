import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import CalendarPage from './pages/CalendarPage.jsx'
import AccountPage from './pages/AccountPage.jsx'
import ChartPage from './pages/ChartPage.jsx'
import QuickAddModal from './components/QuickAddModal.jsx'

export default function App() {
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleAdded = () => {
    setRefreshKey((k) => k + 1)
    setQuickAddOpen(false)
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col" style={{ background: '#0a1a0f' }}>
        <div className="flex-1 overflow-auto pb-20">
          <Routes>
            <Route path="/" element={<Navigate to="/calendar" replace />} />
            <Route path="/calendar" element={<CalendarPage refreshKey={refreshKey} />} />
            <Route path="/account" element={<AccountPage refreshKey={refreshKey} />} />
            <Route path="/chart" element={<ChartPage refreshKey={refreshKey} />} />
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
