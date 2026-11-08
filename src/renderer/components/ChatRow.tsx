import { JSX } from 'preact'
import { useState } from 'preact/hooks'
import { Pin, Copy, Check } from 'lucide-preact'
import { ChatMessage } from '../../shared/types'
import { getDeterministicColor, getInitials } from '../utils/avatar-color'
import { formatTimeHHMM } from '../../core/format'
import { STRINGS } from '../strings/id'

export interface ChatRowProps {
  chat: ChatMessage
  density: 'comfortable' | 'compact'
  fontSize: number
  onPin: (chat: ChatMessage) => void
  onCopy: (text: string) => void
}

export function ChatRow({
  chat,
  density,
  fontSize,
  onPin,
  onCopy
}: ChatRowProps): JSX.Element {
  const [copied, setCopied] = useState(false)
  const nameColor = getDeterministicColor(chat.uniqueId || chat.userId)
  const initials = getInitials(chat.nickname || chat.uniqueId)
  const isCompact = density === 'compact'

  const handleCopy = () => {
    onCopy(chat.comment)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <div
      role="listitem"
      tabIndex={0}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: isCompact ? '6px' : '10px',
        padding: isCompact ? '3px 6px' : '6px 8px',
        borderRadius: 'var(--radius-sm)',
        fontSize: `${fontSize}px`,
        lineHeight: 1.4,
        position: 'relative',
        transition: 'background-color var(--transition-fast)'
      }}
      className="tokflow-chat-row"
    >
      {/* Avatar bulat 28px dengan inisial fallback */}
      <div
        style={{
          width: '28px',
          height: '28px',
          minWidth: '28px',
          borderRadius: '50%',
          overflow: 'hidden',
          backgroundColor: '#1A2017',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 700,
          color: nameColor,
          border: '1px solid var(--border-subtle)',
          flexShrink: 0
        }}
      >
        {chat.profilePictureUrl ? (
          <img
            src={chat.profilePictureUrl}
            alt=""
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              // Fallback jika gambar CDN gagal dimuat
              ;(e.target as HTMLElement).style.display = 'none'
            }}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {/* Konten Komentar */}
      <div style={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '6px',
            marginBottom: isCompact ? '0' : '2px'
          }}
        >
          <span
            style={{
              fontWeight: 600,
              color: nameColor,
              fontSize: `${Math.max(11, fontSize - 1)}px`,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '180px'
            }}
          >
            {chat.nickname || chat.uniqueId}
          </span>
          <span
            className="font-mono"
            style={{
              fontSize: '10px',
              color: 'var(--text-dim)',
              flexShrink: 0
            }}
          >
            {formatTimeHHMM(chat.timestamp)}
          </span>
        </div>

        <div style={{ color: 'var(--text-primary)' }}>{chat.comment}</div>
      </div>

      {/* Aksi Hover / Focus: Pin & Salin */}
      <div
        className="tokflow-chat-actions"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          backgroundColor: 'var(--bg-panel-raised)',
          borderRadius: 'var(--radius-sm)',
          padding: '2px',
          border: '1px solid var(--border-subtle)',
          flexShrink: 0
        }}
      >
        <button
          type="button"
          aria-label={STRINGS.chat.pin}
          title={STRINGS.chat.pin}
          onClick={() => onPin(chat)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--accent-cyan)',
            padding: '3px',
            cursor: 'pointer',
            borderRadius: '4px',
            display: 'flex'
          }}
        >
          <Pin size={13} />
        </button>
        <button
          type="button"
          aria-label={STRINGS.chat.copy}
          title={STRINGS.chat.copy}
          onClick={handleCopy}
          style={{
            background: 'transparent',
            border: 'none',
            color: copied ? 'var(--brand-lime)' : 'var(--text-muted)',
            padding: '3px',
            cursor: 'pointer',
            borderRadius: '4px',
            display: 'flex'
          }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>
      </div>
    </div>
  )
}
