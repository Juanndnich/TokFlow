import { JSX } from 'preact'

export interface IconButtonProps extends JSX.HTMLAttributes<HTMLButtonElement> {
  label: string
  size?: number
  disabled?: boolean
  variant?: 'ghost' | 'panel' | 'danger'
  children?: preact.ComponentChildren
}

export function IconButton({
  label,
  size = 32,
  disabled = false,
  variant = 'ghost',
  children,
  style,
  ...rest
}: IconButtonProps): JSX.Element {
  let bg = 'transparent'
  let border = 'none'

  if (variant === 'panel') {
    bg = 'var(--bg-panel-raised)'
    border = '1px solid var(--border-subtle)'
  } else if (variant === 'danger') {
    bg = 'rgba(244, 63, 94, 0.1)'
  }

  return (
    <button
      {...rest}
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: bg,
        border,
        color: variant === 'danger' ? 'var(--color-danger)' : 'var(--text-muted)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all var(--transition-fast)',
        padding: 0,
        ...(style ? (style as Record<string, unknown>) : {})
      }}
      className="tokflow-icon-btn"
    >
      {children}
    </button>
  )
}
