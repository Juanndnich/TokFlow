import { SessionStore } from '../../core/session-store'
import { ViewerCountResolver } from '../../core/viewer-resolver'
import { LikeTracker } from '../../core/like-tracker'
import { GiftAggregator } from '../../core/gift-aggregator'
import { BackoffController } from '../../core/backoff'
import { RotatingLogger } from './logger'
import { SettingsService } from './settings'
import { ConnectionStatus } from '../../shared/types'
import { dnsLookupCheck } from './net-check'

export class TikTokLiveService {
  private connection: any = null
  private currentUsername = ''
  private isConnecting = false
  private isManualDisconnect = false
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
      const { WebcastPushConnection } = await this.loadTikTokModule()

      // Ambil opsi dari pengaturan
      const settings = this.settingsService.getSettings(false)
      const rawApiKey = this.settingsService.getRawApiKey()

      const clientOptions: Record<string, any> = {
        processInitialData: true,
        enableExtendedGiftInfo: true,
        requestPollingIntervalMs: settings.connection.enableHttpPolling ? 1000 : undefined
      }

      if (rawApiKey && rawApiKey.trim().length > 0) {
        clientOptions.signApiKey = rawApiKey.trim()
      }

      if (this.connection) {
        try {
          this.connection.disconnect()
        } catch {
          // Abaikan
        }
        this.connection = null
      }

      this.connection = new WebcastPushConnection(this.currentUsername, clientOptions)
      this.setupEventListeners(this.connection)

      const state = await this.connection.connect()
      this.isConnecting = false

      if (state && state.isConnected) {
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
    // Mendukung WebcastPushConnection baik dari default maupun named export
    const WebcastPushConnection = (mod as any).WebcastPushConnection || (mod as any).TikTokLiveConnection || (mod as any).default?.WebcastPushConnection || (mod as any).default
    if (!WebcastPushConnection) {
      throw new Error('Gagal memuat konstruktor WebcastPushConnection dari tiktok-live-connector')
    }
    return { WebcastPushConnection }
  }

  private setupEventListeners(conn: any): void {
    conn.on('connected', () => {
      this.sessionStore.setStatus('connected', 'Terhubung ke live stream')
      this.reconnectController.reset()
      this.startRoomInfoPolling()
    })

    conn.on('disconnected', (data: any) => {
      this.logger.warn('TikTokService', `WebSocket terputus: ${JSON.stringify(data || {})}`)
      this.stopRoomInfoPolling()
      if (!this.isManualDisconnect) {
        this.scheduleReconnect('Koneksi terputus dari server')
      }
    })

    conn.on('streamEnd', () => {
      this.logger.info('TikTokService', `Live stream @${this.currentUsername} telah berakhir`)
      this.stopRoomInfoPolling()
      this.sessionStore.setStatus('offline', 'Siaran live telah berakhir')
    })

    conn.on('error', (err: any) => {
      this.logger.error('TikTokService', `Event error: ${err?.message || err}`)
      if (!this.isManualDisconnect) {
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

    if (errorMsg.includes('LIVE has ended') || errorMsg.includes('offline') || errorMsg.includes('not live')) {
      this.sessionStore.setStatus('offline', 'Akun tidak sedang melakukan siaran langsung')
      return { success: false, error: 'Akun tidak sedang live' }
    }

    if (this.isOfflineNetworkError(err)) {
      this.handleNoInternet()
      return { success: false, error: 'Tidak ada koneksi internet' }
    }

    this.scheduleReconnect(errorMsg)
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
    // Poll info room tiap >= 10 dtk hanya saat terhubung
    this.roomInfoTimer = setInterval(async () => {
      if (this.sessionStore.getStatus() !== 'connected' || !this.connection) return
      try {
        if (typeof this.connection.getRoomInfo === 'function') {
          const info = await this.connection.getRoomInfo()
          if (info && info.user_count !== undefined) {
            const count = parseInt(info.user_count, 10)
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
    this.stopAllTimers()

    if (this.connection) {
      try {
        this.connection.disconnect()
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
