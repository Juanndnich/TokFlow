/**
 * Pelacak total like live room.
 * Aturan:
 * - Utamakan total like room (totalLikeCount).
 * - DILARANG menjumlahkan ganda total room dengan tap like.
 * - Tap like (likeCount / delta) hanya ditambahkan bila total room tidak pernah tersedia.
 * - Total like bersifat monotonik (selalu naik atau tetap, Math.max).
 */

export class LikeTracker {
  private currentLikes = 0
  private hasSeenRoomTotal = false

  /**
   * Pembaruan dari total like room (misal dari event like atau room info).
   */
  updateTotal(total: number): number {
    if (typeof total === 'number' && !isNaN(total) && isFinite(total) && total >= 0) {
      this.hasSeenRoomTotal = true
      this.currentLikes = Math.max(this.currentLikes, Math.floor(total))
    }
    return this.currentLikes
  }

  /**
   * Pembaruan dari event tap like individual.
   * Hanya digunakan jika total room belum pernah diterima.
   */
  addTapLikes(count: number): number {
    if (typeof count === 'number' && !isNaN(count) && isFinite(count) && count > 0) {
      if (!this.hasSeenRoomTotal) {
        this.currentLikes += Math.floor(count)
      }
    }
    return this.currentLikes
  }

  getLikes(): number {
    return this.currentLikes
  }

  reset(): void {
    this.currentLikes = 0
    this.hasSeenRoomTotal = false
  }
}
