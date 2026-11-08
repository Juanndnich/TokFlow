/**
 * Backoff kalkulasi dengan exponential backoff dan jitter.
 * Mulai 2 dtk, maks 30 dtk, jitter ±20%, maks 8 percobaan.
 */

export interface BackoffOptions {
  baseDelayMs?: number
  maxDelayMs?: number
  jitterPercent?: number
  maxAttempts?: number
  randomFn?: () => number
}

export function calculateBackoff(attempt: number, options: BackoffOptions = {}): number {
  const base = options.baseDelayMs ?? 2000
  const max = options.maxDelayMs ?? 30000
  const jitter = options.jitterPercent ?? 0.2 // ±20%
  const random = options.randomFn ?? Math.random

  // attempt dimulai dari 0 atau 1: attempt 1 = 2000 * 2^0 = 2000ms
  const exponent = Math.max(0, attempt - 1)
  const rawDelay = Math.min(max, base * Math.pow(2, exponent))

  // Jitter: variasi dalam rentang [1 - jitter, 1 + jitter] -> [0.8, 1.2]
  const jitterMultiplier = 1 - jitter + random() * (jitter * 2)
  const delayed = Math.round(rawDelay * jitterMultiplier)

  return Math.min(max, Math.max(0, delayed))
}

export class BackoffController {
  private currentAttempt = 0
  private readonly maxAttempts: number
  private readonly options: BackoffOptions

  constructor(options: BackoffOptions = {}) {
    this.options = options
    this.maxAttempts = options.maxAttempts ?? 8
  }

  get attempt(): number {
    return this.currentAttempt
  }

  hasReachedLimit(): boolean {
    return this.currentAttempt >= this.maxAttempts
  }

  nextDelay(): number | null {
    if (this.hasReachedLimit()) {
      return null
    }
    this.currentAttempt++
    return calculateBackoff(this.currentAttempt, this.options)
  }

  reset(): void {
    this.currentAttempt = 0
  }
}
