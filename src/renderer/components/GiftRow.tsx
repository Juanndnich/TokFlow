import { JSX } from 'preact'
import { memo } from 'preact/compat'
import { GiftMessage } from '../../shared/types'
import { getDeterministicColor } from '../utils/avatar-color'
import { Gift } from 'lucide-preact'

export interface GiftRowProps {
  gift: GiftMessage
  fontSize: number
}

export const GiftRow = memo(function GiftRow({ gift, fontSize }: GiftRowProps): JSX.Element {
  const nameColor = getDeterministicColor(gift.uniqueId || gift.userId)

  return (
    <div
      role="listitem"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 10px',
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '6px',
        fontSize: `${fontSize}px`,
        gap: '10px'
      }}
      className="tokflow-gift-row"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        {/* Ikon Gift / Gambar */}
        <div
          style={{
            width: '32px',
            height: '32px',
            minWidth: '32px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: '#1A2017',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
            color: 'var(--color-warning)'
          }}
        >
          {gift.giftPictureUrl ? (
            <img
              src={gift.giftPictureUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => {
                ;(e.target as HTMLElement).style.display = 'none'
              }}
            />
          ) : (
            <Gift size={18} />
          )}
        </div>

        {/* Informasi Pengirim & Nama Gift */}
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: 600,
              color: nameColor,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: `${Math.max(12, fontSize - 1)}px`
            }}
          >
            {gift.nickname || gift.uniqueId}
          </div>
          <div
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            Mengirim <strong style={{ color: 'var(--text-primary)' }}>{gift.giftName}</strong>
          </div>
        </div>
      </div>

      {/* Nilai Combo & Koin */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* Badge xN dengan animasi kecil */}
        {gift.repeatCount > 1 ? (
          <span
            className="font-mono tokflow-combo-badge"
            style={{
              backgroundColor: 'rgba(182, 242, 60, 0.15)',
              color: 'var(--brand-lime)',
              border: '1px solid rgba(182, 242, 60, 0.3)',
              borderRadius: 'var(--radius-full)',
              padding: '2px 8px',
              fontSize: '12px',
              fontWeight: 700
            }}
          >
            x{gift.repeatCount}
          </span>
        ) : null}

        {/* Total Koin Gift */}
        <div
          className="font-mono"
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--color-warning)',
            textAlign: 'right'
          }}
        >
          {gift.totalCoins.toLocaleString('id-ID')}
          <span style={{ fontSize: '10px', marginLeft: '3px', fontWeight: 400 }}>koin</span>
        </div>
      </div>
    </div>
  )
})
