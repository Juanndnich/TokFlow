import { JSX } from 'preact'

export interface InputProps {
  type?: string
  placeholder?: string
  value?: string | number
  defaultValue?: string | number
  disabled?: boolean
  prefixText?: string
  error?: string
  fullWidth?: boolean
  style?: preact.JSX.CSSProperties | string
  className?: string
  id?: string
  name?: string
  onInput?: (e: JSX.TargetedEvent<HTMLInputElement, Event>) => void
  onChange?: (e: JSX.TargetedEvent<HTMLInputElement, Event>) => void
  onKeyDown?: (e: KeyboardEvent) => void
  onFocus?: (e: FocusEvent) => void
  onBlur?: (e: FocusEvent) => void
}

export function Input({
  type = 'text',
  placeholder,
  value,
  defaultValue,
  disabled,
  prefixText,
  error,
  fullWidth = true,
  style,
  className = '',
  onInput,
  onChange,
  onKeyDown,
  onFocus,
  onBlur,
  id,
  name
}: InputProps): JSX.Element {
  return (
    <div style={{ display: fullWidth ? 'flex' : 'inline-flex', flexDirection: 'column', gap: '4px', width: fullWidth ? '100%' : 'auto' }}>
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
        className={`tokflow-input-container ${className}`}
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
          type={type}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          disabled={disabled}
          id={id}
          name={name}
          onInput={onInput}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
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
            ...(style ? (style as Record<string, unknown>) : {})
          }}
        />
      </div>
      {error ? (
        <span style={{ fontSize: '11px', color: 'var(--color-danger)', paddingLeft: '4px' }}>
          {error}
        </span>
      ) : null}
    </div>
  )
}
