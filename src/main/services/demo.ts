import { SessionStore } from '../../core/session-store'
import { ViewerCountResolver } from '../../core/viewer-resolver'
import { LikeTracker } from '../../core/like-tracker'
import { GiftAggregator } from '../../core/gift-aggregator'

const DEMO_USERS = [
  { userId: 'u_budi', uniqueId: 'budi_gaming', nickname: 'Budi Gaming' },
  { userId: 'u_siti', uniqueId: 'siti_zahra', nickname: 'Siti Zahra' },
  { userId: 'u_andi', uniqueId: 'andi_live', nickname: 'Andi Santoso' },
  { userId: 'u_dewi', uniqueId: 'dewi_stream', nickname: 'Dewi Ayu' },
  { userId: 'u_rizky', uniqueId: 'rizky_pro', nickname: 'Rizky Pratama' },
  { userId: 'u_mega', uniqueId: 'mega_chan', nickname: 'Mega Cantika' }
]

const DEMO_COMMENTS = [
  'Semangat live-nya kak! 🔥',
  'Halo bang, mabar yuk nanti',
  'Wah seru banget pembahasannya',
  'Gaskeun sampai 100K like!',
  'Keren overlay-nya rapi banget',
  'Salam dari Surabaya kak',
  'Mantap suaranya jernih',
  'Kak spill resepnya dong',
  'Ikutan giveaway-nya kak!',
  'Siap pantau terus sampai selesai'
]

const DEMO_GIFTS = [
  { giftId: 5655, giftName: 'Rose', diamondCount: 1 },
  { giftId: 5269, giftName: 'TikTok', diamondCount: 1 },
  { giftId: 5827, giftName: 'Finger Heart', diamondCount: 5 },
  { giftId: 5585, giftName: 'Doughnut', diamondCount: 30 },
  { giftId: 6023, giftName: 'Paper Crane', diamondCount: 99 }
]

export class DemoSimulator {
  private active = false
  private timer: NodeJS.Timeout | null = null
  private comboStreak = 0
  private currentDemoGift: typeof DEMO_GIFTS[0] | null = null
  private currentDemoUser: typeof DEMO_USERS[0] | null = null
  private currentDemoGroupId = ''
  private simulatedViewers = 240
  private simulatedLikes = 1500

  constructor(
    private sessionStore: SessionStore,
    private viewerResolver: ViewerCountResolver,
    private likeTracker: LikeTracker,
    private giftAggregator: GiftAggregator,
    private onMessageEmitted?: () => void
  ) {}

  isActive(): boolean {
    return this.active
  }

  start(): void {
    if (this.active) return
    this.active = true

    this.sessionStore.startSession('demo_streamer')
    this.sessionStore.setStatus('connected', 'Mode Demo Aktif')

    this.simulatedViewers = 240
    this.simulatedLikes = 1500
    this.viewerResolver.updateSourceA(this.simulatedViewers)
    this.likeTracker.updateTotal(this.simulatedLikes)

    this.timer = setInterval(() => {
      this.tick()
    }, 1200)
  }

  stop(): void {
    if (!this.active) return
    this.active = false
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.sessionStore.endSession()
  }

  private tick(): void {
    if (!this.active) return

    const rand = Math.random()

    // 1. Naikkan like
    this.simulatedLikes += Math.floor(Math.random() * 8) + 2
    this.likeTracker.updateTotal(this.simulatedLikes)

    // 2. Fluktuasi penonton (200 - 1500)
    const viewerDelta = Math.floor(Math.random() * 11) - 5 // -5 s/d +5
    this.simulatedViewers = Math.max(120, this.simulatedViewers + viewerDelta)
    this.viewerResolver.updateSourceA(this.simulatedViewers)

    const resolved = this.viewerResolver.resolve()
    this.sessionStore.updateMetrics(resolved.value, resolved.isStale, this.likeTracker.getLikes())

    // 3. Buat Chat
    if (rand < 0.75) {
      const user = DEMO_USERS[Math.floor(Math.random() * DEMO_USERS.length)]
      const comment = DEMO_COMMENTS[Math.floor(Math.random() * DEMO_COMMENTS.length)]
      this.sessionStore.addChat({
        id: `demo_chat_${Date.now()}_${Math.random()}`,
        userId: user.userId,
        uniqueId: user.uniqueId,
        nickname: user.nickname,
        comment,
        timestamp: Date.now()
      })
      this.onMessageEmitted?.()
    }

    // 4. Buat Gift & Combo Streak
    if (this.comboStreak > 0 && this.currentDemoGift && this.currentDemoUser) {
      // Lanjutkan combo
      this.comboStreak++
      const isEnd = this.comboStreak >= 5 || Math.random() < 0.25

      const result = this.giftAggregator.processGift({
        msgId: `demo_gift_${Date.now()}`,
        groupId: this.currentDemoGroupId,
        userId: this.currentDemoUser.userId,
        uniqueId: this.currentDemoUser.uniqueId,
        nickname: this.currentDemoUser.nickname,
        giftId: this.currentDemoGift.giftId,
        giftName: this.currentDemoGift.giftName,
        diamondCount: this.currentDemoGift.diamondCount,
        repeatCount: this.comboStreak,
        repeatEnd: isEnd,
        timestamp: Date.now()
      })

      if (result) {
        this.sessionStore.addGift(result.gift, result.deltaCoins, result.isNewCard)
        this.onMessageEmitted?.()
      }

      if (isEnd) {
        this.comboStreak = 0
        this.currentDemoGift = null
        this.currentDemoUser = null
      }
    } else if (rand < 0.35) {
      // Mulai combo gift baru
      this.currentDemoGift = DEMO_GIFTS[Math.floor(Math.random() * DEMO_GIFTS.length)]
      this.currentDemoUser = DEMO_USERS[Math.floor(Math.random() * DEMO_USERS.length)]
      this.currentDemoGroupId = `grp_${Date.now()}`
      this.comboStreak = 1

      const result = this.giftAggregator.processGift({
        msgId: `demo_gift_${Date.now()}`,
        groupId: this.currentDemoGroupId,
        userId: this.currentDemoUser.userId,
        uniqueId: this.currentDemoUser.uniqueId,
        nickname: this.currentDemoUser.nickname,
        giftId: this.currentDemoGift.giftId,
        giftName: this.currentDemoGift.giftName,
        diamondCount: this.currentDemoGift.diamondCount,
        repeatCount: 1,
        repeatEnd: false,
        timestamp: Date.now()
      })

      if (result) {
        this.sessionStore.addGift(result.gift, result.deltaCoins, result.isNewCard)
        this.onMessageEmitted?.()
      }
    }
  }
}
