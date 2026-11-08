import { JSX } from 'preact'
import { useState, useEffect, useRef, useCallback } from 'preact/hooks'
import {
  MessageSquare,
  Gift,
  ExternalLink,
  ChevronDown,
  Maximize2,
  Users,
  Heart,
  Coins,
  Clock
} from 'lucide-preact'
import {
  AppSettings,
  ChatMessage,
  ConnectionStatus,
  GiftMessage,
  SessionEvent,
  SessionSnapshot,
  SessionStats
} from '../../shared/types'
import { DEFAULT_SETTINGS } from '../../core/settings-schema'
import { ConnectionBar } from '../components/ConnectionBar'
import { StatCard } from '../components/StatCard'
import { Tabs } from '../components/Tabs'
import { PinnedBanner } from '../components/PinnedBanner'
import { ChatRow } from '../components/ChatRow'
import { GiftRow } from '../components/GiftRow'
import { BottomBar } from '../components/BottomBar'
import { SettingsDrawer } from '../components/SettingsDrawer'
import { Toast } from '../components/Toast'
import { EmptyState } from '../components/EmptyState'
import { Banner } from '../components/Banner'
import { IconButton } from '../components/IconButton'
import { StatusPill } from '../components/StatusPill'
import { STRINGS } from '../strings/id'

export function App(): JSX.Element {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const [stats, setStats] = useState<SessionStats>({
    viewers: 0,
    isViewerStale: false,
    likes: 0,
    totalCoins: 0,
    durationSeconds: 0,
    peakViewers: 0,
    totalComments: 0,
    topGifters: []
  })

  const [chats, setChats] = useState<ChatMessage[]>([])
  const [gifts, setGifts] = useState<GiftMessage[]>([])
  const [pinnedChat, setPinnedChat] = useState<ChatMessage | undefined>()
  const [activeTab, setActiveTab] = useState<'chat' | 'gift'>('chat')
  const [unreadGifts, setUnreadGifts] = useState(0)

  const [isDemoActive, setIsDemoActive] = useState(false)
  const [isMiniMode, setIsMiniMode] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const [toast, setToast] = useState<string | null>(null)
  const [isScrolledUp, setIsScrolledUp] = useState(false)
  const [pendingScrollCount, setPendingScrollCount] = useState(0)

  const isUserScrolledUpRef = useRef(false)
  const chatContainerRef = useRef<HTMLDivElement | null>(null)
  const miniChatContainerRef = useRef<HTMLDivElement | null>(null)
  const giftContainerRef = useRef<HTMLDivElement | null>(null)
  const prevGiftScrollHeightRef = useRef<number>(0)
  const prevGiftScrollTopRef = useRef<number>(0)
  const isLoadedRef = useRef(false)
  const bufferRef = useRef<SessionEvent[]>([])
  const pendingChatBatchRef = useRef<ChatMessage[]>([])
  const rafIdRef = useRef<number | null>(null)

  // Tampilkan toast
  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => {
      setToast(null)
    }, 2400)
  }, [])

  // Batch update chat dengan requestAnimationFrame & fallback cepat untuk background window
  const flushChatBatch = useCallback(() => {
    if (pendingChatBatchRef.current.length === 0) return
    const incoming = [...pendingChatBatchRef.current]
    pendingChatBatchRef.current = []

    setChats((prev) => {
      const next = [...prev, ...incoming]
      return next.slice(-200) // Batasi DOM 200 pesan
    })

    if (isUserScrolledUpRef.current) {
      setPendingScrollCount((c) => c + incoming.length)
    }
  }, [])

  const scheduleChat = useCallback(
    (msg: ChatMessage) => {
      pendingChatBatchRef.current.push(msg)
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(() => {
          rafIdRef.current = null
          flushChatBatch()
        })
        // Fallback cepat 50ms untuk background / inactive window
        setTimeout(() => {
          if (rafIdRef.current !== null) {
            cancelAnimationFrame(rafIdRef.current)
            rafIdRef.current = null
            flushChatBatch()
          }
        }, 50)
      }
    },
    [flushChatBatch]
  )

  // Auto-scroll ke pesan terbaru segera setelah DOM Preact ter-render (hanya jika user tidak scroll ke atas)
  useEffect(() => {
    if (isUserScrolledUpRef.current) return
    const container = isMiniMode ? miniChatContainerRef.current : chatContainerRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [chats, isMiniMode])

  // Preservasi scroll position pada tab Gift agar tidak loncat/getar saat ada gift baru
  useEffect(() => {
    const el = giftContainerRef.current
    if (!el) return
    if (prevGiftScrollTopRef.current > 15 && prevGiftScrollHeightRef.current > 0) {
      const delta = el.scrollHeight - prevGiftScrollHeightRef.current
      if (delta > 0) {
        el.scrollTop += delta
      }
    }
    prevGiftScrollHeightRef.current = el.scrollHeight
    prevGiftScrollTopRef.current = el.scrollTop
  }, [gifts])

  // Handle Event dari Main Process
  const handleSessionEvent = useCallback(
    (evt: SessionEvent) => {
      if (evt.type === 'status_change') {
        setStatus(evt.status)
        setErrorMessage(evt.message)
      } else if (evt.type === 'stats_update') {
        setStats(evt.stats)
      } else if (evt.type === 'chat') {
        // Moderasi lokal (Fase 8)
        if (settings.features.enableModeration) {
          if (settings.moderation.hiddenUsers.includes(evt.chat.uniqueId.toLowerCase())) return
          const commentLower = evt.chat.comment.toLowerCase()
          if (settings.moderation.blockedWords.some((w: string) => commentLower.includes(w.toLowerCase()))) {
            return
          }
        }
        scheduleChat(evt.chat)
      } else if (evt.type === 'gift') {
        setStats(evt.stats)
        setGifts((prev) => {
          const idx = prev.findIndex((g) => g.groupId === evt.gift.groupId)
          if (idx !== -1) {
            const next = [...prev]
            next[idx] = evt.gift
            return next
          } else {
            return [evt.gift, ...prev].slice(0, 100) // Batasi 100 kartu
          }
        })
        if (activeTab !== 'gift') {
          setUnreadGifts((u) => u + 1)
        }
      } else if (evt.type === 'pin_chat') {
        setPinnedChat(evt.chat)
      } else if (evt.type === 'clear_display') {
        setChats([])
        setGifts([])
        setPinnedChat(undefined)
        setPendingScrollCount(0)
      } else if (evt.type === 'session_reset') {
        // Reset bersih tanpa memunculkan popup ringkasan
        setStatus('disconnected')
        setChats([])
        setGifts([])
        setPinnedChat(undefined)
        setIsDemoActive(false)
        setPendingScrollCount(0)
        isUserScrolledUpRef.current = false
        setIsScrolledUp(false)
      }
    },
    [activeTab, scheduleChat, settings]
  )

  const handleSessionEventRef = useRef(handleSessionEvent)
  handleSessionEventRef.current = handleSessionEvent

  // Inisialisasi Snapshot & IPC Subscription
  useEffect(() => {
    if (!window.tokflow) return

    // 1. Muat Pengaturan
    window.tokflow.getSettings().then((s: AppSettings) => setSettings(s))

    // 2. Subscribe session:event
    const unsubscribe = window.tokflow.onSessionEvent((event: SessionEvent) => {
      if (!isLoadedRef.current) {
        bufferRef.current.push(event)
      } else {
        handleSessionEventRef.current(event)
      }
    })

    // 3. Minta snapshot
    window.tokflow.getSnapshot().then((snapshot: SessionSnapshot) => {
      setStatus(snapshot.status)
      setStats(snapshot.stats)
      setChats(snapshot.recentChats)
      setGifts(snapshot.recentGifts)
      setPinnedChat(snapshot.stats.pinnedComment)
      isLoadedRef.current = true

      // 4. Proses buffered event
      for (const evt of bufferRef.current) {
        if (evt.seq > snapshot.seq) {
          handleSessionEventRef.current(evt)
        }
      }
      bufferRef.current = []

      // Auto scroll ke bawah
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
      }, 50)
    })

    return () => {
      unsubscribe()
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [handleSessionEvent])

  // Deteksi scroll user di chat list
  const handleChatScroll = (e: JSX.TargetedEvent<HTMLDivElement, Event>) => {
    const el = e.currentTarget
    if (!el) return
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    const userScrolledUp = distanceToBottom > 40
    isUserScrolledUpRef.current = userScrolledUp
    setIsScrolledUp(userScrolledUp)
    if (!userScrolledUp) {
      setPendingScrollCount(0)
    }
  }

  const scrollToBottom = () => {
    isUserScrolledUpRef.current = false
    setIsScrolledUp(false)
    setPendingScrollCount(0)
    const container = isMiniMode ? miniChatContainerRef.current : chatContainerRef.current
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      })
    }
  }

  // Koneksi & Demo
  const handleConnect = async (username: string) => {
    if (!window.tokflow) return
    setErrorMessage(undefined)
    await window.tokflow.connectTikTok(username)
  }

  const handleDisconnect = async () => {
    if (!window.tokflow) return
    await window.tokflow.disconnectTikTok()
  }

  const handleToggleDemo = async () => {
    if (!window.tokflow) return
    const next = !isDemoActive
    setIsDemoActive(next)
    await window.tokflow.toggleDemo(next)
  }

  const handleClearDisplay = async () => {
    if (!window.tokflow) return
    await window.tokflow.clearDisplay()
    showToast(STRINGS.gift.clearedToast)
  }

  const handlePin = async (chat: ChatMessage) => {
    if (!window.tokflow) return
    await window.tokflow.setPin(chat.id)
    showToast(STRINGS.chat.pin)
  }

  const handleUnpin = async () => {
    if (!window.tokflow) return
    await window.tokflow.setPin(null)
  }

  const handleCopy = async (text: string) => {
    if (!window.tokflow) return
    await window.tokflow.copyText(text)
    showToast(STRINGS.chat.copiedToast)
  }

  const handleSaveSettings = async (partial: Partial<AppSettings>) => {
    if (!window.tokflow) return
    const updated = { ...settings, ...partial }
    setSettings(updated)
    await window.tokflow.saveSettings(partial)
  }

  // Keyboard Shortcuts (Fase 8)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (!settings.features.enableHotkeys) return

      if (e.key === 'm' || e.key === 'M') {
        setIsMiniMode((prev) => !prev)
      } else if (e.key === 'c' || e.key === 'C') {
        handleClearDisplay()
      } else if (e.key === 'Tab') {
        e.preventDefault()
        setActiveTab((prev) => (prev === 'chat' ? 'gift' : 'chat'))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [settings.features.enableHotkeys])

  // --- TAMPILAN MODE MINI ---
  if (isMiniMode) {
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
      >
        {/* Header Mini */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 10px',
            backgroundColor: 'var(--bg-panel)',
            borderBottom: '1px solid var(--border-subtle)',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StatusPill status={status} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand-lime)' }}>
              TokFlow
            </span>
          </div>
          <IconButton label={STRINGS.bottomBar.miniMode} onClick={() => setIsMiniMode(false)}>
            <Maximize2 size={14} />
          </IconButton>
        </div>

        {/* Konten Chat Mini */}
        <div
          ref={miniChatContainerRef}
          onScroll={handleChatScroll}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}
        >
          {chats.length === 0 ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--text-muted)',
                fontSize: '12px'
              }}
            >
              {STRINGS.chat.emptyTitle}
            </div>
          ) : (
            chats.map((c) => (
              <ChatRow
                key={c.id}
                chat={c}
                density="compact"
                fontSize={settings.display.fontSize}
                onPin={handlePin}
                onCopy={handleCopy}
              />
            ))
          )}
        </div>
      </div>
    )
  }

  // --- TAMPILAN JENDELA UTAMA NORMAL ---
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
    >
      {/* 1. Bar Koneksi */}
      <ConnectionBar
        status={status}
        initialUsername={settings.connection.lastUsername}
        isDemoActive={isDemoActive}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onToggleDemo={handleToggleDemo}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Banner Error / Peringatan jika ada */}
      {status === 'error' && errorMessage && (
        <div style={{ padding: '8px 12px 0 12px', flexShrink: 0 }}>
          <Banner
            variant="error"
            message={errorMessage}
            onClose={() => setErrorMessage(undefined)}
          />
        </div>
      )}

      {status === 'offline' && (
        <div style={{ padding: '8px 12px 0 12px', flexShrink: 0 }}>
          <Banner variant="info" message={STRINGS.connection.status.offline} />
        </div>
      )}

      {status === 'no_internet' && (
        <div style={{ padding: '8px 12px 0 12px', flexShrink: 0 }}>
          <Banner
            variant="warning"
            message={STRINGS.connection.status.no_internet}
          />
        </div>
      )}

      {/* 2. Strip Statistik 4 Kartu */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          padding: '10px 12px',
          backgroundColor: 'var(--bg-base)',
          flexShrink: 0
        }}
      >
        <StatCard
          label={STRINGS.stats.viewers}
          value={stats.viewers}
          isStale={stats.isViewerStale}
          icon={<Users size={12} />}
        />
        <StatCard
          label={STRINGS.stats.likes}
          value={stats.likes}
          icon={<Heart size={12} />}
        />
        <StatCard
          label={STRINGS.stats.coins}
          value={stats.totalCoins}
          icon={<Coins size={12} />}
        />
        <StatCard
          label={STRINGS.stats.duration}
          value={stats.durationSeconds}
          isDuration
          icon={<Clock size={12} />}
        />
      </div>

      {/* 3. Tab Chat | Gift */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          backgroundColor: 'var(--bg-base)',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0
        }}
      >
        <Tabs
          activeTab={activeTab}
          onChange={(tab) => {
            setActiveTab(tab as 'chat' | 'gift')
            if (tab === 'gift') setUnreadGifts(0)
          }}
          tabs={[
            { id: 'chat', label: STRINGS.tabs.chat, icon: <MessageSquare size={14} /> },
            {
              id: 'gift',
              label: STRINGS.tabs.gift,
              icon: <Gift size={14} />,
              badgeCount: unreadGifts
            }
          ]}
        />

        {/* Tombol Pop-out Gift Monitor */}
        <IconButton
          label={STRINGS.tabs.popoutGift}
          onClick={() => window.tokflow?.openGiftMonitor()}
        >
          <ExternalLink size={14} />
        </IconButton>
      </div>

      {/* 4. Bilah Sematan Komentar (Pinned) */}
      <PinnedBanner pinned={pinnedChat} onUnpin={handleUnpin} />

      {/* 5 & 6. Konten Tab (Scrollable) */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {activeTab === 'chat' ? (
          <div
            ref={chatContainerRef}
            onScroll={handleChatScroll}
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              padding: '8px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            {chats.length === 0 ? (
              <EmptyState
                icon={<MessageSquare size={36} />}
                title={STRINGS.chat.emptyTitle}
                description={STRINGS.chat.emptyDesc}
              />
            ) : (
              chats.map((c) => (
                <ChatRow
                  key={c.id}
                  chat={c}
                  density={settings.display.density}
                  fontSize={settings.display.fontSize}
                  onPin={handlePin}
                  onCopy={handleCopy}
                />
              ))
            )}

            {/* Tombol Melayang "Ke Pesan Terbaru" */}
            {isScrolledUp && (
              <button
                type="button"
                onClick={scrollToBottom}
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'var(--brand-lime)',
                  color: '#0B0D0A',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: 'var(--shadow-md)',
                  cursor: 'pointer',
                  zIndex: 10
                }}
              >
                <ChevronDown size={14} />
                <span>
                  {pendingScrollCount > 0
                    ? STRINGS.chat.jumpToLatest(pendingScrollCount)
                    : STRINGS.chat.jumpToLatest(0)}
                </span>
              </button>
            )}
          </div>
        ) : (
          <div
            ref={giftContainerRef}
            onScroll={(e) => {
              const el = e.currentTarget
              if (el) {
                prevGiftScrollTopRef.current = el.scrollTop
                prevGiftScrollHeightRef.current = el.scrollHeight
              }
            }}
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              overflowAnchor: 'none',
              padding: '8px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            {gifts.length === 0 ? (
              <EmptyState
                icon={<Gift size={36} />}
                title={STRINGS.gift.emptyTitle}
                description={STRINGS.gift.emptyDesc}
              />
            ) : (
              gifts.map((g) => <GiftRow key={g.groupId} gift={g} fontSize={settings.display.fontSize} />)
            )}
          </div>
        )}
      </div>

      {/* 7. Bilah Bawah */}
      <BottomBar
        fontSize={settings.display.fontSize}
        alwaysOnTop={settings.display.alwaysOnTop}
        opacity={settings.display.windowOpacity}
        onFontSizeChange={(size) =>
          handleSaveSettings({ display: { ...settings.display, fontSize: size } })
        }
        onToggleAlwaysOnTop={() => {
          const next = !settings.display.alwaysOnTop
          handleSaveSettings({ display: { ...settings.display, alwaysOnTop: next } })
          window.tokflow?.setAlwaysOnTop(next)
        }}
        onOpacityChange={(opacity) => {
          handleSaveSettings({ display: { ...settings.display, windowOpacity: opacity } })
          window.tokflow?.setWindowOpacity(opacity)
        }}
        onClearDisplay={handleClearDisplay}
        onToggleMiniMode={() => setIsMiniMode(true)}
      />

      {/* 8. Drawer Pengaturan */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onCopyText={handleCopy}
        onShowToast={showToast}
      />

      {/* 9. Toast Notification */}
      <Toast message={toast || ''} visible={toast !== null} />
    </div>
  )
}
