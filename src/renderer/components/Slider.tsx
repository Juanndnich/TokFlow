import { JSX } from 'preact'

export interface SliderProps {
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  label?: string
  unit?: string
  disabled?: boolean
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  unit = '',
  disabled = false
}: SliderProps): JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {(label || unit) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          {label && <span style={{ color: 'var(--text-muted)' }}>{label}</span>}
          <span className="font-mono" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
            {value}
            {unit}
          </span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number((e.target as HTMLInputElement).value))}
        style={{
          width: '100%',
          accentColor: 'var(--brand-lime)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1
        }}
      />
    </div>
  )
}
