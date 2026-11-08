import { JSX } from 'preact'

export interface ButtonProps extends JSX.HTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  disabled?: boolean
  children?: preact.ComponentChildren
}

export function Button({
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  disabled = false,
  children,
  className = '',
  style,
  ...rest
}: ButtonProps): JSX.Element {
  let bg = 'var(--bg-panel-raised)'
  let color = 'var(--text-primary)'
  let border = '1px solid var(--border-subtle)'

  if (variant === 'primary') {
    bg = 'var(--brand-lime)'
    color = 'var(--text-on-lime)'
    border = '1px solid var(--brand-lime)'
  } else if (variant === 'ghost') {
    bg = 'transparent'
    color = 'var(--text-muted)'
    border = '1px solid transparent'
  } else if (variant === 'danger') {
    bg = 'rgba(244, 63, 94, 0.15)'
    color = 'var(--color-danger)'
    border = '1px solid rgba(244, 63, 94, 0.3)'
  }

  let padding = '8px 14px'
  let fontSize = '13px'
  if (size === 'sm') {
    padding = '4px 10px'
    fontSize = '12px'
  } else if (size === 'lg') {
    padding = '12px 20px'
    fontSize = '15px'
  }

  return (
    <button
      {...rest}
      disabled={disabled || isLoading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        padding,
        fontSize,
        fontWeight: variant === 'primary' ? 600 : 500,
        borderRadius: 'var(--radius-sm)',
        backgroundColor: bg,
        color,
        border,
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all var(--transition-fast)',
        fontFamily: 'inherit',
        lineHeight: 1,
        outline: 'none',
        ...((style as any) || {})
      }}
      className={`tokflow-btn tokflow-btn-${variant} ${className}`}
    >
      {isLoading ? (
        <span
          style={{
            width: '12px',
            height: '12px',
            border: `2px solid ${color}`,
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite'
          }}
        />
      ) : null}
      {children}
    </button>
  )
}
