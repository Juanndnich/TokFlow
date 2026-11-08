import { JSX } from 'preact'
import { Trophy, Award, Medal, Download } from 'lucide-preact'
import { SessionSummary } from '../../shared/types'
import { Modal } from './Modal'
import { Button } from './Button'
import { formatDuration, formatNumberCompact } from '../../core/format'
import { STRINGS } from '../strings/id'

export interface SessionSummaryModalProps {
  isOpen: boolean
  onClose: () => void
  summary?: SessionSummary
  onExport: (format: 'json' | 'csv') => void
}

export function SessionSummaryModal({
  isOpen,
  onClose,
  summary,
  onExport
}: SessionSummaryModalProps): JSX.Element | null {
  if (!summary) return null

  const topGifters = summary.topGifters || []

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={STRINGS.summary.title}
      footer={
        <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button size="sm" variant="secondary" onClick={() => onExport('json')}>
              <Download size={13} />
              {STRINGS.summary.exportJson}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onExport('csv')}>
              <Download size={13} />
              {STRINGS.summary.exportCsv}
            </Button>
          </div>
          <Button variant="primary" size="sm" onClick={onClose}>
            {STRINGS.summary.close}
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Ringkasan Statistik 4 Kotak */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--bg-panel-raised)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{STRINGS.summary.duration}</div>
            <div className="font-mono" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {formatDuration(summary.durationSeconds)}
            </div>
          </div>

          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--bg-panel-raised)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{STRINGS.summary.peakViewers}</div>
            <div className="font-mono" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand-lime)' }}>
              {formatNumberCompact(summary.peakViewers)}
            </div>
          </div>

          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--bg-panel-raised)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{STRINGS.summary.totalComments}</div>
            <div className="font-mono" style={{ fontSize: '18px', fontWeight: 700 }}>
              {formatNumberCompact(summary.totalComments)}
            </div>
          </div>

          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--bg-panel-raised)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{STRINGS.summary.totalCoins}</div>
            <div className="font-mono" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-warning)' }}>
              {summary.totalCoins.toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        {/* Podium Top 3 Gifter (Ikon, BUKAN emoji) */}
        <div>
          <h4
            style={{
              margin: '0 0 10px 0',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Trophy size={15} style={{ color: 'var(--color-warning)' }} />
            {STRINGS.summary.podiumTitle}
          </h4>

          {topGifters.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Belum ada data gift pada sesi ini.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topGifters.map((g, idx) => {
                let badgeColor = 'var(--color-warning)' // Juara 1: Emas
                let IconComponent = Trophy
                if (idx === 1) {
                  badgeColor = '#94A3B8' // Juara 2: Perak
                  IconComponent = Award
                } else if (idx === 2) {
                  badgeColor = '#D97706' // Juara 3: Perunggu
                  IconComponent = Medal
                }

                return (
                  <div
                    key={g.userId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg-panel-raised)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: badgeColor, display: 'flex' }}>
                        <IconComponent size={18} />
                      </span>
                      <span style={{ fontWeight: 600, fontSize: '13px' }}>{g.nickname || g.uniqueId}</span>
                    </div>

                    <div className="font-mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-warning)' }}>
                      {g.coins.toLocaleString('id-ID')}
                      <span style={{ fontSize: '10px', marginLeft: '3px', fontWeight: 400 }}>koin</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
