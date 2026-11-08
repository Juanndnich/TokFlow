import { describe, it, expect } from 'vitest'
import { calculateBackoff, BackoffController } from '../../src/core/backoff'

describe('Backoff & Jitter', () => {
  it('menghasilkan nilai eksponensial dalam rentang base dan max', () => {
    // Dengan randomFn = 0.5 (tepat di tengah nilai tanpa jitter multiplier)
    const midRandom = () => 0.5

    const delay1 = calculateBackoff(1, {
      baseDelayMs: 2000,
      maxDelayMs: 30000,
      randomFn: midRandom
    })
    const delay2 = calculateBackoff(2, {
      baseDelayMs: 2000,
      maxDelayMs: 30000,
      randomFn: midRandom
    })
    const delay3 = calculateBackoff(3, {
      baseDelayMs: 2000,
      maxDelayMs: 30000,
      randomFn: midRandom
    })
    const delay5 = calculateBackoff(5, {
      baseDelayMs: 2000,
      maxDelayMs: 30000,
      randomFn: midRandom
    })
    const delay10 = calculateBackoff(10, {
      baseDelayMs: 2000,
      maxDelayMs: 30000,
      randomFn: midRandom
    })

    expect(delay1).toBe(2000)
    expect(delay2).toBe(4000)
    expect(delay3).toBe(8000)
    expect(delay5).toBe(30000) // Dibatasi maks 30 dtk
    expect(delay10).toBe(30000)
  })

  it('menerapkan jitter ±20%', () => {
    // Batas bawah (random = 0 -> multiplier 0.8)
    const minDelay = calculateBackoff(1, {
      baseDelayMs: 2000,
      jitterPercent: 0.2,
      randomFn: () => 0
    })
    // Batas atas (random = 1 -> multiplier 1.2)
    const maxDelay = calculateBackoff(1, {
      baseDelayMs: 2000,
      jitterPercent: 0.2,
      randomFn: () => 1
    })

    expect(minDelay).toBe(1600)
    expect(maxDelay).toBe(2400)
  })

  it('BackoffController berhenti setelah batas maksimal percobaan', () => {
    const controller = new BackoffController({ maxAttempts: 4 })

    expect(controller.hasReachedLimit()).toBe(false)
    expect(controller.nextDelay()).not.toBeNull() // 1
    expect(controller.nextDelay()).not.toBeNull() // 2
    expect(controller.nextDelay()).not.toBeNull() // 3
    expect(controller.nextDelay()).not.toBeNull() // 4
    expect(controller.hasReachedLimit()).toBe(true)
    expect(controller.nextDelay()).toBeNull()

    controller.reset()
    expect(controller.hasReachedLimit()).toBe(false)
    expect(controller.attempt).toBe(0)
  })
})
