import React, { useState } from 'react'
import { login } from './auth.js'

export default function LoginPage({ onLogin }) {
  const [pwd, setPwd] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (login(pwd)) {
      onLogin()
    } else {
      setError(true)
      setPwd('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4f6e4' }}>
      <div className="w-full max-w-sm mx-4 rounded-2xl p-8 shadow-lg" style={{ background: '#ffffff', border: '1px solid #b5c265' }}>
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🥟</div>
          <h1 className="text-2xl font-bold" style={{ color: '#1e2e08' }}>胖寶 ERP</h1>
          <p className="text-sm mt-1" style={{ color: '#5a6b20' }}>請輸入密碼以繼續</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={pwd}
            onChange={(e) => { setPwd(e.target.value); setError(false) }}
            placeholder="密碼"
            autoFocus
            className="w-full px-4 py-3 rounded-xl outline-none text-sm"
            style={{
              background: '#f4f6e4',
              border: error ? '1.5px solid #dc2626' : '1.5px solid #b5c265',
              color: '#1e2e08',
            }}
          />
          {error && (
            <p className="text-xs text-center" style={{ color: '#dc2626' }}>密碼錯誤，請再試一次</p>
          )}
          <button
            type="submit"
            className="w-full py-3 rounded-xl font-semibold text-sm"
            style={{ background: '#16a34a', color: '#ffffff' }}
          >
            登入
          </button>
        </form>
      </div>
    </div>
  )
}
