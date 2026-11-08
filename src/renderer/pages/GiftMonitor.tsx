import { JSX } from 'preact'
import { useState, useEffect, useRef } from 'preact/hooks'
import { Trash2, ArrowLeft } from 'lucide-preact'
import { GiftMessage, SessionEvent, SessionSnapshot } from '../../shared/types'
import { GiftRow } from '../components/GiftRow'
import { IconButton } from '../components/IconButton'
import { EmptyState } from '../components/EmptyState'
import { STRINGS } from '../strings/id'

export function GiftMonitor(): JSX.Element {
  const [gifts, setGifts] = useState<GiftMessage[]>([])
  const [totalCoins, setTotalCoins] = useState(0)
  const isLoadedRef = useRef(false)
  const bufferRef = useRef<SessionEvent[]>([])
  const listRef = useRef<HTMLDivElement | null>(null)

  const applyEvent = (evt: SessionEvent) => {
    if (evt.type === 'gift') {
      setTotalCoins(evt.stats.totalCoins)
      setGifts((prev) => {
        const idx = prev.findIndex((g) => g.groupId === evt.gift.groupId)
        if (idx !== -1) {
          const next = [...prev]
          next[idx] = evt.gift
          return next
        } else {
          const next = [evt.gift, ...prev]
          return next.slice(0, 100)
        }
      })
    } else if (evt.type === 'clear_display') {
      setGifts([])
    } else if (evt.type === 'session_reset') {
      setGifts([])
      setTotalCoins(0)
    }
  }

  const applyEventRef = useRef(applyEvent)
  applyEventRef.current = applyEvent

  useEffect(() => {
    if (!window.tokflow) return

    // 1. Subscribe session:event dan tampung ke buffer
    const unsubscribe = window.tokflow.onSessionEvent((event: SessionEvent) => {
      if (!isLoadedRef.current) {
        bufferRef.current.push(event)
      } else {
        applyEventRef.current(event)
      }
    })

    // 2. Minta snapshot
    window.tokflow.getSnapshot().then((snapshot: SessionSnapshot) => {
      setGifts(snapshot.recentGifts)
      setTotalCoins(snapshot.stats.totalCoins)
      isLoadedRef.current = true

      // 3. Terapkan event di buffer yang seq > snapshot.seq
      for (const evt of bufferRef.current) {
        if (evt.seq > snapshot.seq) {
          applyEventRef.current(evt)
        }
      }
      bufferRef.current = []
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const handleClear = () => {
    window.tokflow?.clearDisplay()
  }

  const handleDockBack = () => {
    window.tokflow?.dockBackGiftMonitor()
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--bg-base)',
        color: 'var(--text-primary)',
        overflow: 'hidden'
      }}
      className="tokflow-gift-monitor"
    >
      {/* Header Gift Monitor */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          backgroundColor: 'var(--bg-panel)',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconButton label={STRINGS.giftMonitor.dockBack} size={28} onClick={handleDockBack}>
            <ArrowLeft size={16} />
          </IconButton>
          <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--brand-lime)' }}>
            {STRINGS.giftMonitor.title}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Akumulasi Total Koin */}
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>
              {STRINGS.giftMonitor.totalCoins}
            </span>
            <span
              className="font-mono"
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--color-warning)'
              }}
            >
              {totalCoins.toLocaleString('id-ID')}
            </span>
          </div>

          <IconButton label={STRINGS.giftMonitor.clear} size={28} onClick={handleClear} variant="danger">
            <Trash2 size={14} />
          </IconButton>
        </div>
      </header>

      {/* Daftar Gift Scrollable */}
      <div
        ref={listRef}
        role="list"
        aria-label="Daftar Gift"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '10px'
        }}
      >
        {gifts.length === 0 ? (
          <EmptyState
            title={STRINGS.gift.emptyTitle}
            description={STRINGS.gift.emptyDesc}
          />
        ) : (
          gifts.map((g) => <GiftRow key={g.groupId} gift={g} fontSize={13} />)
        )}
      </div>
    </div>
  )
}
