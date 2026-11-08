import { describe, it, expect } from 'vitest'
import { SessionStore } from '../../src/core/session-store'
import { SessionEvent } from '../../src/shared/types'

describe('SessionStore', () => {
  it('menaikkan seq secara monotonik pada setiap mutasi', () => {
    const store = new SessionStore()
    expect(store.getSeq()).toBe(0)

    store.startSession('streamer_1')
    const seqStart = store.getSeq()
    expect(seqStart).toBeGreaterThan(0)

    store.addChat({
      id: 'c1',
      userId: 'u1',
      uniqueId: 'u1',
      nickname: 'User 1',
      comment: 'Halo!',
      timestamp: Date.now()
    })
    expect(store.getSeq()).toBe(seqStart + 1)

    store.updateMetrics(50, false, 120)
    expect(store.getSeq()).toBe(seqStart + 2)
  })

  it('mempertahankan total koin secara akumulatif saat daftar gift dipangkas (> 200 item)', () => {
    const store = new SessionStore()
    store.startSession('streamer_test')

    // Masukkan 250 gift (masing-masing 10 koin)
    for (let i = 1; i <= 250; i++) {
      store.addGift(
        {
          id: `gift_${i}`,
          groupId: `grp_${i}`,
          userId: `user_${i}`,
          uniqueId: `user_${i}`,
          nickname: `User ${i}`,
          giftId: 100,
          giftName: 'Coin',
          diamondCount: 10,
          repeatCount: 1,
          totalCoins: 10,
          timestamp: Date.now()
        },
        10,
        true
      )
    }

    const snapshot = store.getSnapshot()
    // Recent gifts dipangkas maksimal 200
    expect(snapshot.recentGifts.length).toBe(200)
    // Namun total koin TIDAK terpotong (harus tetap 250 * 10 = 2500)
    expect(snapshot.stats.totalCoins).toBe(2500)
  })

  it('mendukung protokol sinkronisasi snapshot + buffered delta untuk jendela baru', () => {
    const store = new SessionStore()
    store.startSession('test_streamer')

    // Simulasi aktivitas awal
    store.addChat({
      id: 'c0',
      userId: 'u0',
      uniqueId: 'u0',
      nickname: 'U0',
      comment: 'Chat awal',
      timestamp: Date.now()
    })

    // Skenario Client / Jendela Baru:
    // 1. Subscribe session:event dan tampung ke buffer
    const buffer: SessionEvent[] = []
    const unsubscribe = store.subscribe((evt) => {
      buffer.push(evt)
    })

    // 2. Race condition: Sebelum getSnapshot dipanggil, event lain masuk
    store.addChat({
      id: 'c1_race',
      userId: 'u1',
      uniqueId: 'u1',
      nickname: 'U1',
      comment: 'Pesan balapan 1',
      timestamp: Date.now()
    })

    // 3. Jendela meminta snapshot
    const snapshot = store.getSnapshot()

    // 4. Setelah snapshot diambil, event baru berikutnya masuk lagi
    store.addChat({
      id: 'c2_after',
      userId: 'u2',
      uniqueId: 'u2',
      nickname: 'U2',
      comment: 'Pesan setelah snapshot',
      timestamp: Date.now()
    })

    // 5. Protokol penerapan di client:
    // Terapkan snapshot terlebih dahulu
    const clientChats = [...snapshot.recentChats]
    let clientSeq = snapshot.seq

    // Terapkan event dari buffer HANYA yang seq > snapshot.seq, buang sisanya
    for (const evt of buffer) {
      if (evt.seq > snapshot.seq) {
        if (evt.type === 'chat') {
          clientChats.push(evt.chat)
          clientSeq = evt.seq
        }
      }
    }

    // Pastikan semua chat sinkron dan tidak ada pesan yang hilang atau ganda
    expect(clientChats.some((c) => c.id === 'c0')).toBe(true)
    expect(clientChats.some((c) => c.id === 'c1_race')).toBe(true)
    expect(clientChats.some((c) => c.id === 'c2_after')).toBe(true)
    expect(clientChats.length).toBe(3)
    expect(clientSeq).toBe(store.getSeq())

    unsubscribe()
  })

  it('mengakhiri sesi dan mereset data dengan bersih', () => {
    const store = new SessionStore()
    store.startSession('streamer_a')

    store.addChat({
      id: 'c1',
      userId: 'u1',
      uniqueId: 'u1',
      nickname: 'User 1',
      comment: 'Hai',
      timestamp: Date.now()
    })

    store.addGift(
      {
        id: 'g1',
        groupId: 'grp1',
        userId: 'u1',
        uniqueId: 'u1',
        nickname: 'User 1',
        giftId: 1,
        giftName: 'Rose',
        diamondCount: 50,
        repeatCount: 1,
        totalCoins: 50,
        timestamp: Date.now()
      },
      50,
      true
    )

    const summary = store.endSession()
    expect(summary.totalCoins).toBe(50)
    expect(summary.totalComments).toBe(1)
    expect(summary.topGifters.length).toBe(1)

    // Setelah reset bersih
    const snapshot = store.getSnapshot()
    expect(snapshot.status).toBe('disconnected')
    expect(snapshot.stats.totalCoins).toBe(0)
    expect(snapshot.recentChats.length).toBe(0)
    expect(snapshot.recentGifts.length).toBe(0)
  })
})
