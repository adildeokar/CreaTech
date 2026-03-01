import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import App from './App'
import './index.css'

const rootEl = document.getElementById('root')
if (!rootEl) {
  document.body.innerHTML = '<div style="padding:20px;color:red;">#root not found</div>'
  throw new Error('Root element #root not found')
}

function showError(err: unknown) {
  const el = document.getElementById('root')
  if (!el) return
  const msg = err instanceof Error ? err.message : String(err)
  const stack = err instanceof Error ? err.stack : ''
  el.innerHTML = `
    <div style="padding:24px;background:#1a1f26;color:#e2e8f0;font-family:system-ui;min-height:100vh;">
      <h1 style="color:#f59e0b;">PRECYCLE failed to load</h1>
      <pre style="background:#0f1419;padding:16px;border-radius:8px;overflow:auto;white-space:pre-wrap;">${msg}\n\n${stack}</pre>
    </div>
  `
}

try {
  const root = createRoot(rootEl)
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </StrictMode>,
  )
} catch (err) {
  showError(err)
  const w = window as unknown as { __PRECYCLE_ERROR__?: (msg: string, stack: string) => void }
  if (typeof w.__PRECYCLE_ERROR__ === 'function') {
    w.__PRECYCLE_ERROR__(
      err instanceof Error ? err.message : String(err),
      err instanceof Error ? (err.stack ?? '') : '',
    )
  }
}
