import { JSX } from 'preact'

export interface CardProps extends JSX.HTMLAttributes<HTMLDivElement> {
  variant?: 'base' | 'raised'
  padding?: string
  children: preact.ComponentChildren
}

export function Card({
  variant = 'base',
  padding = '12px',
  children,
  style,
  className = '',
  ...rest
}: CardProps): JSX.Element {
  return (
    <div
      {...rest}
      style={{
        backgroundColor: variant === 'raised' ? 'var(--bg-panel-raised)' : 'var(--bg-panel)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding,
        ...(style ? (style as Record<string, unknown>) : {})
      }}
      className={`tokflow-card ${className}`}
    >
      {children}
    </div>
  )
}
