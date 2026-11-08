import { JSX } from 'preact'
import { useState } from 'preact/hooks'
import { Pin, ChevronDown, ChevronUp, X } from 'lucide-preact'
import { ChatMessage } from '../../shared/types'
import { STRINGS } from '../strings/id'

export interface PinnedBannerProps {
  pinned?: ChatMessage
  onUnpin: () => void
}

export function PinnedBanner({ pinned, onUnpin }: PinnedBannerProps): JSX.Element | null {
  const [collapsed, setCollapsed] = useState(false)

  if (!pinned) return null

  return (
    <div
      style={{
        backgroundColor: 'rgba(45, 212, 191, 0.12)',
        borderLeft: '3px solid var(--accent-cyan)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        flexShrink: 0
      }}
      className="tokflow-pinned-banner"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Pin size={13} style={{ color: 'var(--accent-cyan)' }} />
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-cyan)' }}>
            {STRINGS.chat.pinnedTitle}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            • {pinned.nickname || pinned.uniqueId}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            aria-label={collapsed ? 'Perluas' : 'Ciutkan'}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex'
            }}
          >
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
          <button
            type="button"
            aria-label={STRINGS.chat.unpin}
            onClick={onUnpin}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex'
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div
          style={{
            fontSize: '12px',
            color: 'var(--text-primary)',
            lineHeight: 1.4,
            paddingLeft: '19px',
            wordBreak: 'break-word'
          }}
        >
          {pinned.comment}
        </div>
      )}
    </div>
  )
}
