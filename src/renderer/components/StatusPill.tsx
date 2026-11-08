import { JSX } from 'preact'
import { ConnectionStatus } from '../../shared/types'
import { STRINGS } from '../strings/id'

export interface StatusPillProps {
  status: ConnectionStatus
  customLabel?: string
}

export function StatusPill({ status, customLabel }: StatusPillProps): JSX.Element {
  let dotColor = '#8A9585' // Abu (disconnected)
  let isPulsing = false

  if (status === 'connecting') {
    dotColor = '#F5B83D' // Kuning berdenyut
    isPulsing = true
  } else if (status === 'connected') {
    dotColor = '#10B981' // Hijau
  } else if (status === 'error') {
    dotColor = '#F43F5E' // Merah
  } else if (status === 'offline') {
    dotColor = '#3B82F6' // Biru
  } else if (status === 'no_internet') {
    dotColor = '#8B7CF6' // Ungu
  }

  const label = customLabel || STRINGS.connection.status[status] || status

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 8px',
        backgroundColor: 'var(--bg-panel-raised)',
        borderRadius: 'var(--radius-full)',
        border: '1px solid var(--border-subtle)',
        fontSize: '11px',
        color: 'var(--text-muted)'
      }}
      className="tokflow-status-pill"
    >
      <span
        style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          backgroundColor: dotColor,
          display: 'inline-block',
          animation: isPulsing ? 'pulse 1.2s infinite' : 'none'
        }}
      />
      <span style={{ fontWeight: 500 }}>{label}</span>
    </div>
  )
}
