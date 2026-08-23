import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('App error:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ background: '#f4f6e4', color: '#1e2e08', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24 }}>
          <div style={{ fontSize: 48 }}>🥟</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#16a34a' }}>胖寶 ERP 載入失敗</div>
          <div style={{ fontSize: 13, color: '#5a6b20', maxWidth: 300, textAlign: 'center' }}>
            {this.state.error?.message || '發生錯誤，請重新整理頁面'}
          </div>
          <button onClick={() => window.location.reload()} style={{ marginTop: 8, padding: '8px 24px', background: '#b5c265', color: '#16a34a', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
            重新整理
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
