import { describe, it, expect } from 'vitest'
import { GoalTracker } from '../../src/core/goal-tracker'

describe('GoalTracker', () => {
  it('mengembalikan null bila target like atau koin bernilai 0', () => {
    const tracker = new GoalTracker(0, 0)
    expect(tracker.getLikeGoal(100)).toBeNull()
    expect(tracker.getCoinGoal(50)).toBeNull()
  })

  it('menghitung progres like secara akurat dan membatasi persentase maks 100%', () => {
    const tracker = new GoalTracker(1000, 500)
    const progress = tracker.getLikeGoal(250)
    expect(progress).not.toBeNull()
    expect(progress?.percentage).toBe(25)
    expect(progress?.isCompleted).toBe(false)

    const overGoal = tracker.getLikeGoal(1500)
    expect(overGoal?.percentage).toBe(100)
    expect(overGoal?.isCompleted).toBe(true)
  })

  it('menghitung progres koin secara akurat', () => {
    const tracker = new GoalTracker(1000, 500)
    const progress = tracker.getCoinGoal(500)
    expect(progress).not.toBeNull()
    expect(progress?.percentage).toBe(100)
    expect(progress?.isCompleted).toBe(true)
  })

  it('mendukung pembaruan target dinamis', () => {
    const tracker = new GoalTracker(100, 100)
    tracker.setTargets(200, 300)
    const like = tracker.getLikeGoal(100)
    expect(like?.percentage).toBe(50)
    const coin = tracker.getCoinGoal(150)
    expect(coin?.percentage).toBe(50)
  })
})
