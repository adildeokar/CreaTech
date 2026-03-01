// Minimal entry - if this works, the issue is in App/Layout/deps
import { createRoot } from 'react-dom/client'

const rootEl = document.getElementById('root')
if (!rootEl) {
  document.body.innerHTML = '<div style="padding:20px;color:red;">#root not found</div>'
} else {
  createRoot(rootEl).render(
    <div style={{ padding: 24, background: '#0f1419', color: '#e2e8f0', minHeight: '100vh', fontFamily: 'system-ui' }}>
      <h1 style={{ color: '#0d9488' }}>PRECYCLE</h1>
      <p>Precast Cycle Intelligence Engine</p>
    </div>,
  )
}
