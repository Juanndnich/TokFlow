import { describe, it, expect } from 'vitest'
import { GiftAggregator } from '../../src/core/gift-aggregator'

describe('GiftAggregator', () => {
  it('menghitung koin berbasis DELTA repeatCount', () => {
    const aggregator = new GiftAggregator()

    // Streak x1 (1 diamond per gift)
    const r1 = aggregator.processGift({
      msgId: 'msg_1',
      groupId: 'grp_1',
      userId: 'user_a',
      uniqueId: 'usera',
      nickname: 'User A',
      giftId: 101,
      giftName: 'Rose',
      diamondCount: 1,
      repeatCount: 1,
      repeatEnd: false
    })

    expect(r1).not.toBeNull()
    expect(r1?.deltaCoins).toBe(1)
    expect(r1?.gift.totalCoins).toBe(1)
    expect(r1?.isNewCard).toBe(true)

    // Streak berlanjut ke x5
    const r2 = aggregator.processGift({
      msgId: 'msg_2',
      groupId: 'grp_1',
      userId: 'user_a',
      uniqueId: 'usera',
      nickname: 'User A',
      giftId: 101,
      giftName: 'Rose',
      diamondCount: 1,
      repeatCount: 5,
      repeatEnd: false
    })

    expect(r2).not.toBeNull()
    expect(r2?.deltaCoins).toBe(4) // 5 - 1 = 4 delta
    expect(r2?.gift.totalCoins).toBe(5)
    expect(r2?.isNewCard).toBe(false)
    expect(aggregator.getTotalCoins()).toBe(5)
  })

  it('tidak membuang repeatEnd dan melakukan dedupe event persis', () => {
    const aggregator = new GiftAggregator()

    // Event x10 belum repeatEnd
    aggregator.processGift({
      msgId: 'msg_10',
      groupId: 'grp_10',
      userId: 'user_b',
      uniqueId: 'userb',
      nickname: 'User B',
      giftId: 202,
      giftName: 'Heart',
      diamondCount: 5,
      repeatCount: 10,
      repeatEnd: false
    })

    // Event penutup repeatEnd dengan msgId sama TIDAK terbuang
    const endResult = aggregator.processGift({
      msgId: 'msg_10',
      groupId: 'grp_10',
      userId: 'user_b',
      uniqueId: 'userb',
      nickname: 'User B',
      giftId: 202,
      giftName: 'Heart',
      diamondCount: 5,
      repeatCount: 10,
      repeatEnd: true
    })

    expect(endResult).not.toBeNull()
    expect(endResult?.gift.isComboEnding).toBe(true)

    // Pengiriman ulang event repeatEnd yang sama akan didedupe
    const duplicate = aggregator.processGift({
      msgId: 'msg_10',
      groupId: 'grp_10',
      userId: 'user_b',
      uniqueId: 'userb',
      nickname: 'User B',
      giftId: 202,
      giftName: 'Heart',
      diamondCount: 5,
      repeatCount: 10,
      repeatEnd: true
    })

    expect(duplicate).toBeNull()
  })

  it('menghasilkan groupId fallback yang stabil dengan toleransi streak 6 detik', () => {
    let now = 100000
    const aggregator = new GiftAggregator(() => now)

    const g1 = aggregator.resolveGroupId('u1', 99, '', now)
    expect(g1).toContain('u1_99_')

    // Panggilan 3 detik kemudian untuk user & gift yang sama -> groupId sama
    now += 3000
    const g2 = aggregator.resolveGroupId('u1', 99, '', now)
    expect(g2).toBe(g1)

    // Panggilan setelah 7 detik (> 6 detik) -> groupId baru
    now += 7000
    const g3 = aggregator.resolveGroupId('u1', 99, '', now)
    expect(g3).not.toBe(g1)
  })

  it('membersihkan combo kedaluwarsa setelah 15 detik', () => {
    let now = 100000
    const aggregator = new GiftAggregator(() => now)

    aggregator.processGift({
      msgId: 'm1',
      groupId: 'g_active',
      userId: 'u1',
      uniqueId: 'u1',
      nickname: 'U1',
      giftId: 1,
      giftName: 'Rose',
      diamondCount: 1,
      repeatCount: 1,
      timestamp: now
    })

    expect(aggregator.getActiveCombo('g_active')).toBeDefined()

    // 16 detik kemudian
    now += 16000
    aggregator.cleanupExpiredCombos(now)
    expect(aggregator.getActiveCombo('g_active')).toBeUndefined()
  })
})
