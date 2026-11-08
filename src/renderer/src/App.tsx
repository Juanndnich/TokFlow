import { JSX } from 'preact'

export function App(): JSX.Element {
  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header>
        <h1 style={{ margin: 0, fontSize: '18px', color: 'var(--brand-lime)' }}>TokFlow</h1>
        <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '12px' }}>
          Live Stream Companion
        </p>
      </header>
    </div>
  )
}
