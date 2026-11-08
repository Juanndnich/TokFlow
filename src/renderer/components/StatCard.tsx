import { JSX } from 'preact'
import { formatNumberCompact, formatNumberFull, formatDuration } from '../../core/format'

export interface StatCardProps {
  label: string
  value: number
  isDuration?: boolean
  isStale?: boolean
  icon?: preact.ComponentChildren
}

export function StatCard({
  label,
  value,
  isDuration = false,
  isStale = false,
  icon
}: StatCardProps): JSX.Element {
  const displayValue = isDuration ? formatDuration(value) : formatNumberCompact(value)
  const fullValue = isDuration ? formatDuration(value) : formatNumberFull(value)

  return (
    <div
      title={isDuration ? undefined : `${label}: ${fullValue}`}
      style={{
        flex: 1,
        minWidth: 0,
        backgroundColor: 'var(--bg-panel)',
        border: `1px solid ${isStale ? 'var(--color-warning)' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--radius-sm)',
        padding: '6px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        position: 'relative',
        transition: 'border-color var(--transition-fast)'
      }}
      className="tokflow-stat-card"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: 'var(--text-muted)'
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {label}
        </span>
        {icon}
      </div>

      <div
        className="font-mono"
        style={{
          fontSize: '15px',
          fontWeight: 700,
          color: isStale ? 'var(--color-warning)' : 'var(--text-primary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: 1.2
        }}
      >
        {displayValue}
      </div>

      {isStale && (
        <span
          title="Data penonton belum diperbarui >20 dtk"
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-warning)'
          }}
        />
      )}
    </div>
  )
}
