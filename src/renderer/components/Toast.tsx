import { JSX } from 'preact'

export interface ToastProps {
  message: string
  visible: boolean
}

export function Toast({ message, visible }: ToastProps): JSX.Element | null {
  if (!visible) return null

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        bottom: '60px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#1A2017',
        color: 'var(--brand-lime)',
        border: '1px solid var(--brand-lime)',
        padding: '6px 14px',
        borderRadius: 'var(--radius-full)',
        fontSize: '12px',
        fontWeight: 500,
        boxShadow: 'var(--shadow-lg)',
        zIndex: 2000,
        pointerEvents: 'none',
        animation: 'fadeIn 0.15s ease'
      }}
    >
      {message}
    </div>
  )
}
