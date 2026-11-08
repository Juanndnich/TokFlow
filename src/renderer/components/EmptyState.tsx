import { JSX } from 'preact'

export interface EmptyStateProps {
  title: string
  description?: string
  icon?: preact.ComponentChildren
  action?: preact.ComponentChildren
}

export function EmptyState({
  title,
  description,
  icon,
  action
}: EmptyStateProps): JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        textAlign: 'center',
        height: '100%',
        minHeight: '160px',
        color: 'var(--text-muted)'
      }}
      className="tokflow-empty-state"
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--bg-panel-raised)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '12px',
          border: '1px solid var(--border-subtle)',
          color: 'var(--brand-lime)'
        }}
      >
        {icon || (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </div>

      <h3
        style={{
          margin: '0 0 4px 0',
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--text-primary)'
        }}
      >
        {title}
      </h3>

      {description && (
        <p
          style={{
            margin: 0,
            fontSize: '12px',
            color: 'var(--text-muted)',
            maxWidth: '260px',
            lineHeight: 1.4
          }}
        >
          {description}
        </p>
      )}

      {action && <div style={{ marginTop: '16px' }}>{action}</div>}
    </div>
  )
}
