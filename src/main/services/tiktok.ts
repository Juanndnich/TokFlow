import { SessionStore } from '../../core/session-store'
import { ViewerCountResolver } from '../../core/viewer-resolver'
import { LikeTracker } from '../../core/like-tracker'
import { GiftAggregator } from '../../core/gift-aggregator'
import { BackoffController } from '../../core/backoff'
import { RotatingLogger } from './logger'
import { SettingsService } from './settings'
import { ConnectionStatus } from '../../shared/types'
import { dnsLookupCheck } from './net-check'

export interface TikTokConnectionInstance {
  connect: () => Promise<{ isConnected?: boolean; roomId?: string }>
  disconnect: () => Promise<void> | void
  removeAllListeners: () => void
  on: (event: string, handler: (data: unknown) => void) => void
  isConnected?: boolean
  fetchRoomInfo?: () => Promise<{ user_count?: number; data?: { user_count?: number } }>
  getRoomInfo?: () => Promise<{ user_count?: number; data?: { user_count?: number } }>
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export class TikTokLiveService {
  private connection: TikTokConnectionInstance | null = null
  private currentUsername = ''
  private isConnecting = false
  private isManualDisconnect = false
  private hasConnectedOnce = false
  private reconnectController = new BackoffController({
    baseDelayMs: 2000,
    maxDelayMs: 30000,
    jitterPercent: 0.2,
    maxAttempts: 8
  })
  private reconnectTimer: NodeJS.Timeout | null = null
  private internetCheckTimer: NodeJS.Timeout | null = null
  private roomInfoTimer: NodeJS.Timeout | null = null
  private isCheckingInternet = false

  constructor(
    private sessionStore: SessionStore,
    private viewerResolver: ViewerCountResolver,
    private likeTracker: LikeTracker,
    private giftAggregator: GiftAggregator,
    private settingsService: SettingsService,
    private logger: RotatingLogger,
    private onEventRecorded?: () => void
  ) {}

  async connect(username: string): Promise<{ success: boolean; error?: string }> {
    const cleanUser = username.replace(/^@/, '').trim()
    if (!cleanUser) {
      return { success: false, error: 'Username TikTok tidak boleh kosong' }
    }

    this.isManualDisconnect = false
    this.hasConnectedOnce = false
    this.currentUsername = cleanUser
    this.reconnectController.reset()
    this.stopAllTimers()

    this.sessionStore.startSession(cleanUser)
    this.logger.info('TikTokService', `Memulai koneksi ke @${cleanUser}`)

    return this.doConnect()
  }

  private async doConnect(): Promise<{ success: boolean; error?: string }> {
    if (this.isConnecting) {
      return { success: false, error: 'Sedang menyambungkan...' }
    }

    this.isConnecting = true
    this.sessionStore.setStatus('connecting', 'Menghubungkan ke live TikTok...')

    try {
      const { TikTokConnectionClass } = await this.loadTikTokModule()

      // Ambil opsi dari pengaturan
      const rawApiKey = this.settingsService.getRawApiKey()

      const clientOptions: Record<string, any> = {
        processInitialData: true,
        enableExtendedGiftInfo: true,
        fetchRoomInfoOnConnect: true
      }

      if (rawApiKey && rawApiKey.trim().length > 0) {
        clientOptions.signApiKey = rawApiKey.trim()
      }

      // Bersihkan koneksi lama dan lepaskan semua event listener agar tidak terjadi leak / cascade
      if (this.connection) {
        try {
          if (typeof this.connection.removeAllListeners === 'function') {
            this.connection.removeAllListeners()
          }
          if (typeof this.connection.disconnect === 'function') {
            this.connection.disconnect()
          }
        } catch {
          // Abaikan
        }
        this.connection = null
      }

      const conn = new TikTokConnectionClass(this.currentUsername, clientOptions)
      this.connection = conn
      this.setupEventListeners(conn)

      const state = await conn.connect()
      this.isConnecting = false

      if (state && (state.isConnected || conn.isConnected)) {
        this.hasConnectedOnce = true
        this.sessionStore.setStatus('connected', 'Terhubung ke live stream')
        this.reconnectController.reset()
        this.startRoomInfoPolling()
        this.logger.info('TikTokService', `Berhasil terhubung ke @${this.currentUsername}`)
        return { success: true }
      } else {
        this.sessionStore.setStatus('offline', 'Akun sedang tidak live')
        this.logger.info('TikTokService', `@${this.currentUsername} sedang offline`)
        return { success: true }
      }
    } catch (err: any) {
      this.isConnecting = false
      const errorMsg = err?.message || String(err)
      this.logger.error('TikTokService', `Gagal terhubung: ${errorMsg}`)

      return this.handleConnectionFailure(err)
    }
  }

  private async loadTikTokModule(): Promise<any> {
    const mod = await import('tiktok-live-connector')
    const TikTokConnectionClass =
      (mod as any).TikTokLiveConnection ||
      (mod as any).WebcastPushConnection ||
      (mod as any).default?.TikTokLiveConnection ||
      (mod as any).default?.WebcastPushConnection ||
      (mod as any).default

    if (!TikTokConnectionClass) {
      throw new Error('Gagal memuat konstruktor TikTokLiveConnection dari tiktok-live-connector')
    }
    return { TikTokConnectionClass }
  }

  private setupEventListeners(conn: any): void {
    conn.on('connected', () => {
      this.hasConnectedOnce = true
      this.sessionStore.setStatus('connected', 'Terhubung ke live stream')
      this.reconnectController.reset()
      this.startRoomInfoPolling()
    })

    conn.on('disconnected', (data: any) => {
      this.logger.warn('TikTokService', `WebSocket terputus: ${JSON.stringify(data || {})}`)
      this.stopRoomInfoPolling()

      // HANYA reconnect jika bukan disconnect manual, bukan offline, dan SUDAH pernah terhubung sebelumnya
      if (!this.isManualDisconnect && this.sessionStore.getStatus() !== 'offline' && this.hasConnectedOnce) {
        this.scheduleReconnect('Koneksi terputus dari server')
      }
    })

    conn.on('streamEnd', () => {
      this.logger.info('TikTokService', `Live stream @${this.currentUsername} telah berakhir`)
      this.hasConnectedOnce = false
      this.stopRoomInfoPolling()
      this.stopReconnectTimer()
      this.sessionStore.setStatus('offline', 'Siaran live telah berakhir')
    })

    conn.on('error', (err: any) => {
      this.logger.error('TikTokService', `Event error: ${err?.message || err}`)
      if (!this.isManualDisconnect && this.hasConnectedOnce) {
        this.handleConnectionFailure(err)
      }
    })

    // Chat event
    conn.on('chat', (data: any) => {
      try {
        const userId = data.user?.userId || data.user?.id || String(data.user?.secUid || 'user')
        const uniqueId = data.user?.uniqueId || userId
        const nickname = data.user?.nickname || uniqueId
        const comment = data.content || data.comment || ''
        const profilePictureUrl = data.user?.profilePicture?.urls?.[0] || data.user?.avatarThumb?.urlList?.[0]

        this.sessionStore.addChat({
          id: `chat_${data.common?.msgId || Date.now()}_${Math.random()}`,
          userId,
          uniqueId,
          nickname,
          comment,
          profilePictureUrl,
          timestamp: Date.now()
        })
        this.onEventRecorded?.()
      } catch (e) {
        this.logger.error('TikTokService', `Error memproses chat event: ${e}`)
      }
    })

    // Gift event
    conn.on('gift', (data: any) => {
      try {
        const userId = data.user?.userId || data.user?.id || 'unknown'
        const uniqueId = data.user?.uniqueId || userId
        const nickname = data.user?.nickname || uniqueId
        const giftId = Number(data.giftId || data.gift?.id || 0)
        const giftName = data.gift?.name || data.giftName || 'Gift'
        const diamondCount = Number(data.gift?.diamondCount || data.diamondCount || 0)
        const repeatCount = Number(data.repeatCount || 1)
        const repeatEnd = data.repeatEnd === 1 || data.repeatEnd === true
        const groupId = data.groupId ? String(data.groupId) : ''
        const giftPictureUrl = data.gift?.image?.urlList?.[0]
        const userProfilePictureUrl = data.user?.profilePicture?.urls?.[0]

        const res = this.giftAggregator.processGift({
          msgId: String(data.common?.msgId || Date.now()),
          groupId,
          userId,
          uniqueId,
          nickname,
          giftId,
          giftName,
          giftPictureUrl,
          diamondCount,
          repeatCount,
          repeatEnd,
          timestamp: Date.now()
        })

        if (res) {
          this.sessionStore.addGift(
            {
              ...res.gift,
              userProfilePictureUrl
            },
            res.deltaCoins,
            res.isNewCard
          )
          this.onEventRecorded?.()
        }
      } catch (e) {
        this.logger.error('TikTokService', `Error memproses gift event: ${e}`)
      }
    })

    // Room user count event (Sumber A)
    conn.on('roomUser', (data: any) => {
      try {
        // Field total (tag 3) = penonton AKTIF. DILARANG pakai totalUser (tag 7)
        const activeCount = parseInt(data.total, 10)
        if (!isNaN(activeCount) && activeCount >= 0) {
          this.viewerResolver.updateSourceA(activeCount)
          this.updateMetricsInStore()
        }
      } catch (e) {
        this.logger.error('TikTokService', `Error roomUser: ${e}`)
      }
    })

    // Member join event (Sumber B)
    conn.on('member', (data: any) => {
      try {
        const count = typeof data.memberCount === 'number' ? data.memberCount : parseInt(data.memberCount, 10)
        if (!isNaN(count) && count >= 0) {
          this.viewerResolver.updateSourceB(count)
          this.updateMetricsInStore()
        }
      } catch (e) {
        this.logger.error('TikTokService', `Error member: ${e}`)
      }
    })

    // Like event
    conn.on('like', (data: any) => {
      try {
        const roomTotal = parseInt(data.total, 10)
        if (!isNaN(roomTotal) && roomTotal >= 0) {
          this.likeTracker.updateTotal(roomTotal)
        } else if (typeof data.count === 'number') {
          this.likeTracker.addTapLikes(data.count)
        }
        this.updateMetricsInStore()
      } catch (e) {
        this.logger.error('TikTokService', `Error like: ${e}`)
      }
    })
  }

  private updateMetricsInStore(): void {
    const resolved = this.viewerResolver.resolve()
    this.sessionStore.updateMetrics(resolved.value, resolved.isStale, this.likeTracker.getLikes())
  }

  private isOfflineNetworkError(err: any): boolean {
    const str = `${err?.code || ''} ${err?.message || ''}`.toLowerCase()
    return (
      str.includes('enotfound') ||
      str.includes('econnreset') ||
      str.includes('etimedout') ||
      str.includes('fetch failed') ||
      str.includes('network')
    )
  }

  private async handleConnectionFailure(err: any): Promise<{ success: boolean; error: string }> {
    const errorMsg = err?.message || String(err)
    const errorName = err?.name || ''

    // 1. Deteksi akun offline / Room ID tidak ditemukan / streamer tidak sedang live
    if (
      errorName === 'UserOfflineError' ||
      errorMsg.includes('LIVE has ended') ||
      errorMsg.includes('offline') ||
      errorMsg.includes('not live') ||
      errorMsg.includes("isn't online") ||
      errorMsg.includes('is not online') ||
      errorMsg.includes('Room ID from all sources') ||
      errorMsg.includes('room_id') ||
      errorMsg.includes('InvalidUniqueIdError')
    ) {
      this.hasConnectedOnce = false
      this.stopReconnectTimer()
      this.sessionStore.setStatus('offline', 'Akun sedang tidak live atau tidak ditemukan')
      this.logger.info('TikTokService', `@${this.currentUsername} sedang offline atau tidak live`)
      return { success: false, error: 'Akun sedang tidak live atau tidak ditemukan' }
    }

    // 2. Deteksi rate limit signature
    if (
      errorName === 'SignatureRateLimitError' ||
      errorMsg.toLowerCase().includes('rate limit')
    ) {
      this.hasConnectedOnce = false
      this.stopReconnectTimer()
      this.sessionStore.setStatus(
        'error',
        'Batas permintaan tanda tangan TikTok tercapai (Rate Limit). Coba lagi beberapa saat.'
      )
      return { success: false, error: 'Rate limit tercapai' }
    }

    // 3. Deteksi masalah internet lokal
    if (this.isOfflineNetworkError(err)) {
      this.handleNoInternet()
      return { success: false, error: 'Tidak ada koneksi internet' }
    }

    // 4. Jika sebelumnya sudah connected, jadwalkan reconnect. Jika baru pertama kali connect gagal, jangan loop!
    if (this.hasConnectedOnce) {
      this.scheduleReconnect(errorMsg)
    } else {
      this.sessionStore.setStatus('error', `Gagal terhubung: ${errorMsg}`)
    }

    return { success: false, error: errorMsg }
  }

  private handleNoInternet(): void {
    this.sessionStore.setStatus('no_internet', 'Tidak ada koneksi internet. Mencoba menyambung otomatis...')
    this.stopReconnectTimer()

    if (!this.internetCheckTimer) {
      // Cek pemulihan hemat tiap 8 detik
      this.internetCheckTimer = setInterval(async () => {
        if (this.isCheckingInternet) return
        this.isCheckingInternet = true
        const isOnline = await dnsLookupCheck()
        this.isCheckingInternet = false

        if (isOnline) {
          this.logger.info('TikTokService', 'Internet kembali pulih. Melakukan koneksi ulang otomatis...')
          if (this.internetCheckTimer) {
            clearInterval(this.internetCheckTimer)
            this.internetCheckTimer = null
          }
          this.reconnectController.reset()
          this.doConnect()
        }
      }, 8000)
    }
  }

  private scheduleReconnect(reason: string): void {
    if (this.isManualDisconnect) return

    if (this.reconnectController.hasReachedLimit()) {
      this.sessionStore.setStatus(
        'error',
        `Koneksi terputus setelah 8 percobaan: ${reason}. Silakan coba lagi.`
      )
      return
    }

    const delayMs = this.reconnectController.nextDelay()
    if (delayMs === null) return

    const attempt = this.reconnectController.attempt
    this.sessionStore.setStatus(
      'connecting',
      `Menyambung ulang (${attempt}/8) dalam ${Math.round(delayMs / 1000)} dtk...`
    )

    this.stopReconnectTimer()
    this.reconnectTimer = setTimeout(() => {
      this.doConnect()
    }, delayMs)
  }

  private startRoomInfoPolling(): void {
    this.stopRoomInfoPolling()
    // Poll info room tiap >= 12 dtk hanya saat terhubung
    this.roomInfoTimer = setInterval(async () => {
      if (this.sessionStore.getStatus() !== 'connected' || !this.connection) return
      try {
        const fetchFn =
          typeof this.connection.fetchRoomInfo === 'function'
            ? this.connection.fetchRoomInfo.bind(this.connection)
            : typeof this.connection.getRoomInfo === 'function'
              ? this.connection.getRoomInfo.bind(this.connection)
              : null

        if (fetchFn) {
          const info = await fetchFn()
          const rawCount = info?.user_count ?? info?.data?.user_count
          if (rawCount !== undefined) {
            const count = parseInt(String(rawCount), 10)
            if (!isNaN(count) && count >= 0) {
              this.viewerResolver.updateSourceC(count)
              this.updateMetricsInStore()
            }
          }
        }
      } catch {
        // Backoff info room diam-diam tanpa mengganggu websocket
      }
    }, 12000)
  }

  private stopRoomInfoPolling(): void {
    if (this.roomInfoTimer) {
      clearInterval(this.roomInfoTimer)
      this.roomInfoTimer = null
    }
  }

  private stopReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private stopAllTimers(): void {
    this.stopReconnectTimer()
    this.stopRoomInfoPolling()
    if (this.internetCheckTimer) {
      clearInterval(this.internetCheckTimer)
      this.internetCheckTimer = null
    }
  }

  async disconnect(): Promise<void> {
    this.isManualDisconnect = true
    this.hasConnectedOnce = false
    this.isConnecting = false
    this.stopAllTimers()

    if (this.connection) {
      try {
        if (typeof this.connection.removeAllListeners === 'function') {
          this.connection.removeAllListeners()
        }
        if (typeof this.connection.disconnect === 'function') {
          this.connection.disconnect()
        }
      } catch {
        // Abaikan
      }
      this.connection = null
    }

    this.sessionStore.endSession()
    this.logger.info('TikTokService', 'Koneksi diputus secara manual oleh pengguna')
  }

  getStatus(): ConnectionStatus {
    return this.sessionStore.getStatus()
  }
}
