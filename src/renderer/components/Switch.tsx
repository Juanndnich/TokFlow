import { JSX } from 'preact'

export interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  description?: string
}

export function Switch({
  checked,
  onChange,
  label,
  disabled = false,
  description
}: SwitchProps): JSX.Element {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
        gap: '12px',
        opacity: disabled ? 0.5 : 1
      }}
    >
      {(label || description) && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {label && <span style={{ fontSize: '13px', fontWeight: 500 }}>{label}</span>}
          {description && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{description}</span>
          )}
        </div>
      )}
      <div
        role="switch"
        aria-checked={checked}
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && onChange(!checked)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault()
            onChange(!checked)
          }
        }}
        style={{
          width: '36px',
          height: '20px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: checked ? 'var(--brand-lime)' : 'var(--bg-panel-raised)',
          border: `1px solid ${checked ? 'var(--brand-lime)' : 'var(--border-subtle)'}`,
          position: 'relative',
          transition: 'all var(--transition-fast)',
          flexShrink: 0
        }}
      >
        <div
          style={{
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            backgroundColor: checked ? 'var(--text-on-lime)' : 'var(--text-muted)',
            position: 'absolute',
            top: '2px',
            left: checked ? '18px' : '2px',
            transition: 'left var(--transition-fast)'
          }}
        />
      </div>
    </label>
  )
}
