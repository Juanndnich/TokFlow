export interface GoalProgress {
  current: number
  target: number
  percentage: number
  isCompleted: boolean
}

export class GoalTracker {
  constructor(
    private likeTarget = 0,
    private coinTarget = 0
  ) {}

  setTargets(likeTarget: number, coinTarget: number): void {
    this.likeTarget = Math.max(0, likeTarget)
    this.coinTarget = Math.max(0, coinTarget)
  }

  getLikeGoal(currentLikes: number): GoalProgress | null {
    if (this.likeTarget <= 0) return null
    const clampedCurrent = Math.max(0, currentLikes)
    const percentage = Math.min(100, Math.floor((clampedCurrent / this.likeTarget) * 100))
    return {
      current: clampedCurrent,
      target: this.likeTarget,
      percentage,
      isCompleted: clampedCurrent >= this.likeTarget
    }
  }

  getCoinGoal(currentCoins: number): GoalProgress | null {
    if (this.coinTarget <= 0) return null
    const clampedCurrent = Math.max(0, currentCoins)
    const percentage = Math.min(100, Math.floor((clampedCurrent / this.coinTarget) * 100))
    return {
      current: clampedCurrent,
      target: this.coinTarget,
      percentage,
      isCompleted: clampedCurrent >= this.coinTarget
    }
  }
}
