import { JSX } from 'preact'

export interface BannerProps {
  variant?: 'info' | 'warning' | 'error' | 'success'
  message: string
  actionText?: string
  onAction?: () => void
  onClose?: () => void
}

export function Banner({
  variant = 'info',
  message,
  actionText,
  onAction,
  onClose
}: BannerProps): JSX.Element {
  let bg = 'rgba(59, 130, 246, 0.15)'
  let border = 'rgba(59, 130, 246, 0.3)'
  let color = 'var(--color-info)'

  if (variant === 'warning') {
    bg = 'rgba(245, 184, 61, 0.15)'
    border = 'rgba(245, 184, 61, 0.3)'
    color = 'var(--color-warning)'
  } else if (variant === 'error') {
    bg = 'rgba(244, 63, 94, 0.15)'
    border = 'rgba(244, 63, 94, 0.3)'
    color = 'var(--color-danger)'
  } else if (variant === 'success') {
    bg = 'rgba(16, 185, 129, 0.15)'
    border = 'rgba(16, 185, 129, 0.3)'
    color = 'var(--color-success)'
  }

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        backgroundColor: bg,
        border: `1px solid ${border}`,
        borderRadius: 'var(--radius-sm)',
        fontSize: '12px',
        color: 'var(--text-primary)',
        gap: '8px'
      }}
      className="tokflow-banner"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: color,
            flexShrink: 0
          }}
        />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{message}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {actionText && onAction && (
          <button
            onClick={onAction}
            style={{
              background: 'transparent',
              border: 'none',
              color,
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              padding: '2px 4px',
              fontFamily: 'inherit'
            }}
          >
            {actionText}
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Tutup"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '14px',
              padding: 0
            }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}
