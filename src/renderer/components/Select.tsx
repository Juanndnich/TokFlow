import { JSX } from 'preact'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  label?: string
  disabled?: boolean
}

export function Select({
  value,
  options,
  onChange,
  label,
  disabled = false
}: SelectProps): JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
      {label && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{label}</span>}
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
        style={{
          padding: '8px 12px',
          backgroundColor: 'var(--bg-base)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-primary)',
          fontSize: '13px',
          outline: 'none',
          fontFamily: 'inherit',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} style={{ background: '#12160F' }}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
