import { JSX } from 'preact'

export interface InputProps extends JSX.HTMLAttributes<HTMLInputElement> {
  prefixText?: string
  error?: string
  fullWidth?: boolean
  disabled?: boolean
}

export function Input({
  prefixText,
  error,
  fullWidth = true,
  disabled,
  style,
  className = '',
  ...rest
}: InputProps): JSX.Element {
  return (
    <div style={{ display: fullWidth ? 'flex' : 'inline-flex', flexDirection: 'column', gap: '4px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--bg-base)',
          border: `1px solid ${error ? 'var(--color-danger)' : 'var(--border-subtle)'}`,
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          transition: 'border-color var(--transition-fast)',
          opacity: disabled ? 0.5 : 1
        }}
        className="tokflow-input-container"
      >
        {prefixText ? (
          <span
            style={{
              padding: '0 8px 0 12px',
              color: 'var(--text-muted)',
              fontSize: '13px',
              userSelect: 'none'
            }}
          >
            {prefixText}
          </span>
        ) : null}
        <input
          {...rest}
          disabled={disabled}
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: '13px',
            padding: prefixText ? '8px 12px 8px 0' : '8px 12px',
            width: '100%',
            fontFamily: 'inherit',
            ...((style as any) || {})
          }}
          className={`tokflow-input ${className}`}
        />
      </div>
      {error ? (
        <span style={{ fontSize: '11px', color: 'var(--color-danger)' }}>{error}</span>
      ) : null}
    </div>
  )
}
