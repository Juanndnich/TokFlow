import {
  ChatMessage,
  ConnectionStatus,
  GiftMessage,
  SessionEvent,
  SessionSnapshot,
  SessionStats,
  SessionSummary,
  TopGifter
} from '../shared/types'

export type SessionEventListener = (event: SessionEvent) => void

export class SessionStore {
  private seq = 0
  private status: ConnectionStatus = 'disconnected'
  private statusMessage = ''
  private username = ''

  private startTime = 0
  private peakViewers = 0
  private totalComments = 0
  private totalLikes = 0
  private totalCoins = 0
  private currentViewers = 0
  private isViewerStale = false

  private pinnedComment?: ChatMessage

  private readonly recentChats: ChatMessage[] = []
  private readonly recentGifts: GiftMessage[] = []
  private readonly topGiftersMap = new Map<string, TopGifter>()

  private readonly listeners = new Set<SessionEventListener>()
  private readonly maxChats = 200
  private readonly maxGifts = 200

  private readonly clock: () => number

  constructor(clock: () => number = () => Date.now()) {
    this.clock = clock
  }

  getSeq(): number {
    return this.seq
  }

  getUsername(): string {
    return this.username
  }

  getStatus(): ConnectionStatus {
    return this.status
  }

  subscribe(listener: SessionEventListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(event: SessionEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event)
      } catch (err) {
        console.error('SessionStore listener error:', err)
      }
    }
  }

  startSession(username: string): void {
    this.reset()
    this.username = username
    this.startTime = this.clock()
    this.status = 'connecting'
    this.seq++

    this.emit({
      type: 'status_change',
      seq: this.seq,
      status: this.status,
      message: 'Menyambungkan ke TikTok Live...'
    })
  }

  setStatus(status: ConnectionStatus, message?: string): void {
    this.status = status
    this.statusMessage = message || ''
    this.seq++

    this.emit({
      type: 'status_change',
      seq: this.seq,
      status: this.status,
      message: this.statusMessage
    })
  }

  addChat(chatInput: Omit<ChatMessage, 'seq'>): ChatMessage {
    this.seq++
    this.totalComments++

    const chat: ChatMessage = {
      ...chatInput,
      seq: this.seq
    }

    this.recentChats.push(chat)
    if (this.recentChats.length > this.maxChats) {
      this.recentChats.shift()
    }

    this.emit({
      type: 'chat',
      seq: this.seq,
      chat
    })

    return chat
  }

  addGift(
    giftInput: Omit<GiftMessage, 'seq'>,
    deltaCoins: number,
    isNewCard: boolean
  ): GiftMessage {
    this.seq++
    this.totalCoins += deltaCoins

    const gift: GiftMessage = {
      ...giftInput,
      seq: this.seq
    }

    // Update Top Gifters map
    const existing = this.topGiftersMap.get(gift.userId)
    if (existing) {
      existing.coins += deltaCoins
      if (gift.nickname) existing.nickname = gift.nickname
      if (gift.userProfilePictureUrl) existing.profilePictureUrl = gift.userProfilePictureUrl
    } else {
      this.topGiftersMap.set(gift.userId, {
        userId: gift.userId,
        uniqueId: gift.uniqueId,
        nickname: gift.nickname,
        coins: deltaCoins,
        profilePictureUrl: gift.userProfilePictureUrl
      })
    }

    // Perbarui atau tambahkan kartu di recentGifts
    if (isNewCard) {
      this.recentGifts.push(gift)
      if (this.recentGifts.length > this.maxGifts) {
        this.recentGifts.shift()
      }
    } else {
      // Cari kartu dengan groupId sama untuk diperbarui di memori
      const idx = this.recentGifts.findIndex((g) => g.groupId === gift.groupId)
      if (idx !== -1) {
        this.recentGifts[idx] = gift
      } else {
        // Jika sebelumnya terpangkas, pulihkan kartu ke daftar
        this.recentGifts.push(gift)
        if (this.recentGifts.length > this.maxGifts) {
          this.recentGifts.shift()
        }
      }
    }

    const stats = this.getStats()
    this.emit({
      type: 'gift',
      seq: this.seq,
      gift,
      stats
    })

    return gift
  }

  updateMetrics(viewers: number, isStale: boolean, likes: number): void {
    let changed = false

    if (viewers !== this.currentViewers || isStale !== this.isViewerStale) {
      this.currentViewers = viewers
      this.isViewerStale = isStale
      if (viewers > this.peakViewers) {
        this.peakViewers = viewers
      }
      changed = true
    }

    if (likes !== this.totalLikes) {
      this.totalLikes = likes
      changed = true
    }

    if (changed) {
      this.seq++
      this.emit({
        type: 'stats_update',
        seq: this.seq,
        stats: this.getStats()
      })
    }
  }

  setPin(chat?: ChatMessage): void {
    this.seq++
    this.pinnedComment = chat

    this.emit({
      type: 'pin_chat',
      seq: this.seq,
      chat
    })
  }

  clearDisplay(): void {
    this.seq++
    this.recentChats.length = 0
    this.recentGifts.length = 0
    this.pinnedComment = undefined

    this.emit({
      type: 'clear_display',
      seq: this.seq
    })
  }

  getTopGifters(limit = 3): TopGifter[] {
    return Array.from(this.topGiftersMap.values())
      .sort((a, b) => b.coins - a.coins)
      .slice(0, limit)
  }

  getDurationSeconds(): number {
    if (this.startTime === 0) return 0
    return Math.floor((this.clock() - this.startTime) / 1000)
  }

  getStats(): SessionStats {
    return {
      viewers: this.currentViewers,
      isViewerStale: this.isViewerStale,
      likes: this.totalLikes,
      totalCoins: this.totalCoins,
      durationSeconds: this.getDurationSeconds(),
      peakViewers: this.peakViewers,
      totalComments: this.totalComments,
      topGifters: this.getTopGifters(3),
      pinnedComment: this.pinnedComment
    }
  }

  getSnapshot(): SessionSnapshot {
    return {
      seq: this.seq,
      status: this.status,
      statusMessage: this.statusMessage,
      username: this.username,
      stats: this.getStats(),
      recentChats: [...this.recentChats],
      recentGifts: [...this.recentGifts]
    }
  }

  endSession(): SessionSummary {
    const summary: SessionSummary = {
      id: `session_${this.startTime || this.clock()}`,
      username: this.username,
      startTime: this.startTime,
      endTime: this.clock(),
      durationSeconds: this.getDurationSeconds(),
      peakViewers: this.peakViewers,
      totalComments: this.totalComments,
      totalCoins: this.totalCoins,
      totalLikes: this.totalLikes,
      topGifters: this.getTopGifters(3)
    }

    this.seq++
    this.emit({
      type: 'session_reset',
      seq: this.seq,
      summary
    })

    this.reset()
    return summary
  }

  reset(): void {
    this.status = 'disconnected'
    this.statusMessage = ''
    this.startTime = 0
    this.peakViewers = 0
    this.totalComments = 0
    this.totalLikes = 0
    this.totalCoins = 0
    this.currentViewers = 0
    this.isViewerStale = false
    this.pinnedComment = undefined
    this.recentChats.length = 0
    this.recentGifts.length = 0
    this.topGiftersMap.clear()
  }
}
