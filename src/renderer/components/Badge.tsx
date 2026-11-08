import { JSX } from 'preact'

export interface BadgeProps {
  variant?: 'lime' | 'warning' | 'purple' | 'cyan' | 'neutral'
  children: preact.ComponentChildren
}

export function Badge({ variant = 'neutral', children }: BadgeProps): JSX.Element {
  let bg = 'var(--bg-panel-raised)'
  let color = 'var(--text-primary)'
  let border = 'var(--border-subtle)'

  if (variant === 'lime') {
    bg = 'rgba(182, 242, 60, 0.15)'
    color = 'var(--brand-lime)'
    border = 'rgba(182, 242, 60, 0.3)'
  } else if (variant === 'warning') {
    bg = 'rgba(245, 184, 61, 0.15)'
    color = 'var(--color-warning)'
    border = 'rgba(245, 184, 61, 0.3)'
  } else if (variant === 'purple') {
    bg = 'rgba(139, 124, 246, 0.15)'
    color = 'var(--accent-purple)'
    border = 'rgba(139, 124, 246, 0.3)'
  } else if (variant === 'cyan') {
    bg = 'rgba(45, 212, 191, 0.15)'
    color = 'var(--accent-cyan)'
    border = 'rgba(45, 212, 191, 0.3)'
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        fontSize: '11px',
        fontWeight: 600,
        borderRadius: 'var(--radius-full)',
        backgroundColor: bg,
        color,
        border: `1px solid ${border}`,
        lineHeight: 1
      }}
      className="font-mono"
    >
      {children}
    </span>
  )
}
