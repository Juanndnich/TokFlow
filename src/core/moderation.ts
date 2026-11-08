/**
 * Logika moderasi lokal (Fase 8).
 * Hanya memengaruhi tampilan lokal, tidak memodifikasi data upstream.
 */

export interface ModerationConfig {
  hiddenUsers: string[]
  blockedWords: string[]
  highlightedWords: string[]
  antiSpamDuplicateThreshold: number
}

export interface ModerationResult {
  shouldHide: boolean
  isHighlighted: boolean
  reason?: 'hidden_user' | 'blocked_word' | 'duplicate_spam'
}

export class LocalModerator {
  private config: ModerationConfig
  private readonly recentUserMessages = new Map<string, { lastText: string; count: number }>()

  constructor(config: ModerationConfig) {
    this.config = config
  }

  updateConfig(config: ModerationConfig): void {
    this.config = config
  }

  checkMessage(userId: string, uniqueId: string, text: string): ModerationResult {
    const lowerUser = (uniqueId || userId).toLowerCase()
    const lowerText = text.toLowerCase()

    // 1. Cek user yang disembunyikan
    if (this.config.hiddenUsers.some((u) => u.toLowerCase() === lowerUser)) {
      return { shouldHide: true, isHighlighted: false, reason: 'hidden_user' }
    }

    // 2. Cek kata terlarang (blocked words)
    if (this.config.blockedWords.some((w) => w && lowerText.includes(w.toLowerCase()))) {
      return { shouldHide: true, isHighlighted: false, reason: 'blocked_word' }
    }

    // 3. Cek anti-spam duplikat
    const userSpam = this.recentUserMessages.get(userId)
    if (userSpam && userSpam.lastText === lowerText) {
      userSpam.count++
      if (userSpam.count >= this.config.antiSpamDuplicateThreshold) {
        return { shouldHide: true, isHighlighted: false, reason: 'duplicate_spam' }
      }
    } else {
      this.recentUserMessages.set(userId, { lastText: lowerText, count: 1 })
    }

    // 4. Cek highlight kata penting
    const isHighlighted = this.config.highlightedWords.some(
      (w) => w && lowerText.includes(w.toLowerCase())
    )

    return {
      shouldHide: false,
      isHighlighted
    }
  }

  reset(): void {
    this.recentUserMessages.clear()
  }
}
