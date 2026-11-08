import { JSX } from 'preact'
import { useState } from 'preact/hooks'

export interface TooltipProps {
  content: string
  children: preact.ComponentChildren
}

export function Tooltip({ content, children }: TooltipProps): JSX.Element {
  const [visible, setVisible] = useState(false)

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#1A2017',
            color: 'var(--text-primary)',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '11px',
            whiteSpace: 'nowrap',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-md)',
            zIndex: 1000,
            pointerEvents: 'none'
          }}
        >
          {content}
        </div>
      )}
    </div>
  )
}
