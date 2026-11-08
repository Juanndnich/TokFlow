import { GiftMessage } from '../shared/types'

export interface RawGiftInput {
  msgId: string
  groupId?: string
  userId: string
  uniqueId: string
  nickname: string
  giftId: number
  giftName: string
  giftPictureUrl?: string
  diamondCount: number
  repeatCount: number
  repeatEnd?: boolean
  giftType?: number // 1 = streakable biasanya
  timestamp?: number
}

export interface ComboStreakState {
  groupId: string
  userId: string
  uniqueId: string
  nickname: string
  giftId: number
  giftName: string
  giftPictureUrl?: string
  diamondCount: number
  repeatCount: number
  accumulatedCoins: number
  firstSeenTime: number
  lastUpdatedTime: number
  isEnded: boolean
}

export class GiftAggregator {
  // Dedupe cache: key -> boolean
  private readonly processedEvents = new Map<string, number>()
  // Active combo tracking: groupId -> ComboStreakState
  private readonly activeCombos = new Map<string, ComboStreakState>()
  // Fallback map: userId_giftId -> { lastTime, groupId }
  private readonly fallbackGroupMap = new Map<string, { lastTime: number; groupId: string }>()

  private totalAccumulatedCoins = 0
  private readonly clock: () => number

  constructor(clock: () => number = () => Date.now()) {
    this.clock = clock
  }

  /**
   * Menghasilkan fallback groupId yang stabil jika groupId TikTok kosong.
   * Toleransi streak 6 detik untuk pasangan userId dan giftId yang sama.
   */
  resolveGroupId(userId: string, giftId: number, rawGroupId?: string, now = this.clock()): string {
    if (rawGroupId && String(rawGroupId).trim().length > 0 && String(rawGroupId) !== '0') {
      return String(rawGroupId)
    }

    const pairKey = `${userId}_${giftId}`
    const existing = this.fallbackGroupMap.get(pairKey)

    if (existing && now - existing.lastTime <= 6000) {
      existing.lastTime = now
      return existing.groupId
    }

    const newGroupId = `${pairKey}_${now}`
    this.fallbackGroupMap.set(pairKey, { lastTime: now, groupId: newGroupId })
    return newGroupId
  }

  /**
   * Memproses raw event gift. Mengembalikan GiftMessage jika event baru/valid, atau null jika duplikat.
   */
  processGift(raw: RawGiftInput): {
    gift: GiftMessage
    deltaCoins: number
    isNewCard: boolean
  } | null {
    const now = raw.timestamp ?? this.clock()

    // 1. Dedupe check
    // Kunci dedupe: gift:${msgId}:${repeatEnd ? 'end' : repeatCount}
    const dedupeKey = `gift:${raw.msgId}:${raw.repeatEnd ? 'end' : raw.repeatCount}`
    if (this.processedEvents.has(dedupeKey)) {
      return null
    }
    this.processedEvents.set(dedupeKey, now)

    // Bersihkan processedEvents yang terlalu lama (> 60 detik) untuk menghemat memori
    if (this.processedEvents.size > 2000) {
      for (const [key, time] of this.processedEvents.entries()) {
        if (now - time > 60000) {
          this.processedEvents.delete(key)
        }
      }
    }

    const groupId = this.resolveGroupId(raw.userId, raw.giftId, raw.groupId, now)
    const diamondPerUnit = Math.max(0, raw.diamondCount || 0)
    const currentRepeat = Math.max(1, raw.repeatCount || 1)

    let deltaCoins = 0
    let isNewCard = false
    let combo = this.activeCombos.get(groupId)

    if (!combo) {
      // Streak baru
      isNewCard = true
      deltaCoins = diamondPerUnit * currentRepeat
      combo = {
        groupId,
        userId: raw.userId,
        uniqueId: raw.uniqueId,
        nickname: raw.nickname,
        giftId: raw.giftId,
        giftName: raw.giftName,
        giftPictureUrl: raw.giftPictureUrl,
        diamondCount: diamondPerUnit,
        repeatCount: currentRepeat,
        accumulatedCoins: deltaCoins,
        firstSeenTime: now,
        lastUpdatedTime: now,
        isEnded: !!raw.repeatEnd
      }
      this.activeCombos.set(groupId, combo)
    } else {
      // Lanjutan streak yang sudah ada
      isNewCard = false
      const prevRepeat = combo.repeatCount
      const repeatDelta = Math.max(0, currentRepeat - prevRepeat)
      deltaCoins = diamondPerUnit * repeatDelta
      combo.repeatCount = Math.max(combo.repeatCount, currentRepeat)
      combo.accumulatedCoins += deltaCoins
      combo.lastUpdatedTime = now
      if (raw.repeatEnd) {
        combo.isEnded = true
      }
    }

    this.totalAccumulatedCoins += deltaCoins

    const giftMessage: GiftMessage = {
      id: `${groupId}_${combo.repeatCount}`,
      seq: 0, // Akan diisi monotonic oleh SessionStore
      groupId,
      userId: raw.userId,
      uniqueId: raw.uniqueId,
      nickname: raw.nickname,
      giftId: raw.giftId,
      giftName: raw.giftName,
      giftPictureUrl: raw.giftPictureUrl,
      diamondCount: diamondPerUnit,
      repeatCount: combo.repeatCount,
      totalCoins: combo.accumulatedCoins,
      timestamp: now,
      isComboEnding: !!raw.repeatEnd
    }

    return {
      gift: giftMessage,
      deltaCoins,
      isNewCard
    }
  }

  /**
   * Bersihkan combo yang sudah tidak aktif / kedaluwarsa (> 15 dtk sejak update terakhir).
   */
  cleanupExpiredCombos(now = this.clock()): void {
    for (const [groupId, combo] of this.activeCombos.entries()) {
      if (combo.isEnded || now - combo.lastUpdatedTime > 15000) {
        this.activeCombos.delete(groupId)
      }
    }
  }

  getActiveCombo(groupId: string): ComboStreakState | undefined {
    return this.activeCombos.get(groupId)
  }

  getTotalCoins(): number {
    return this.totalAccumulatedCoins
  }

  reset(): void {
    this.processedEvents.clear()
    this.activeCombos.clear()
    this.fallbackGroupMap.clear()
    this.totalAccumulatedCoins = 0
  }
}
