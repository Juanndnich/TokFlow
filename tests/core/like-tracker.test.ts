import { describe, it, expect } from 'vitest'
import { LikeTracker } from '../../src/core/like-tracker'

describe('LikeTracker', () => {
  it('menjaga nilai tetap monotonik (Math.max)', () => {
    const tracker = new LikeTracker()

    tracker.updateTotal(500)
    expect(tracker.getLikes()).toBe(500)

    // Nilai lebih rendah diabaikan
    tracker.updateTotal(400)
    expect(tracker.getLikes()).toBe(500)

    tracker.updateTotal(750)
    expect(tracker.getLikes()).toBe(750)
  })

  it('menggunakan tap count hanya jika total room belum pernah ada', () => {
    const tracker = new LikeTracker()

    tracker.addTapLikes(15)
    tracker.addTapLikes(20)
    expect(tracker.getLikes()).toBe(35)

    // Begitu total room masuk, total room mengambil alih sepenuhnya
    tracker.updateTotal(100)
    expect(tracker.getLikes()).toBe(100)

    // Tap like berikutnya TIDAK ditambahkan ganda ke total room
    tracker.addTapLikes(50)
    expect(tracker.getLikes()).toBe(100)
  })

  it('menolak input tidak valid', () => {
    const tracker = new LikeTracker()
    tracker.updateTotal(-100)
    expect(tracker.getLikes()).toBe(0)

    tracker.updateTotal(NaN)
    expect(tracker.getLikes()).toBe(0)
  })
})
