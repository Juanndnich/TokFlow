/**
 * Resolver jumlah penonton dengan multi-sumber dan spike guard.
 * Sumber:
 * - A: Room-user event (WebcastRoomUserSeqMessage) `total`
 * - B: Member join event `memberCount`
 * - C: Room info fetch `user_count`
 *
 * Prioritas: A jika <= 20s; lalu C jika <= 30s; lalu B.
 * Spike Guard: jika nilai baru > 3x nilai lama DAN selisih > 500,
 * tahan nilai lama sampai pembacaan kedua mengonfirmasi dalam 15 dtk.
 */

export interface SourceReading {
  value: number
  timestamp: number
}

export interface SpikeCandidate {
  value: number
  firstSeenAt: number
}

export class ViewerCountResolver {
  private readingA: SourceReading | null = null
  private readingB: SourceReading | null = null
  private readingC: SourceReading | null = null

  private currentResolvedValue = 0
  private lastResolvedTime = 0
  private pendingSpikeCandidate: SpikeCandidate | null = null

  private readonly clock: () => number

  constructor(clock: () => number = () => Date.now()) {
    this.clock = clock
  }

  /**
   * Catat pembacaan dari Sumber A (room-user seq message total).
   * Catatan: Field akumulatif (totalUser) dilarang digunakan di sini.
   */
  updateSourceA(count: number): void {
    if (this.isValidCount(count)) {
      this.readingA = { value: Math.floor(count), timestamp: this.clock() }
    }
  }

  /**
   * Catat pembacaan dari Sumber B (member count dari join).
   */
  updateSourceB(count: number): void {
    if (this.isValidCount(count)) {
      this.readingB = { value: Math.floor(count), timestamp: this.clock() }
    }
  }

  /**
   * Catat pembacaan dari Sumber C (room info fetch user_count).
   */
  updateSourceC(count: number): void {
    if (this.isValidCount(count)) {
      this.readingC = { value: Math.floor(count), timestamp: this.clock() }
    }
  }

  private isValidCount(n: unknown): boolean {
    return typeof n === 'number' && !isNaN(n) && n >= 0 && isFinite(n)
  }

  /**
   * Menghasilkan jumlah penonton terkini, sumber aktif, dan status kesegaran data.
   */
  resolve(): {
    value: number
    activeSource: 'A' | 'B' | 'C' | 'none'
    isStale: boolean
  } {
    const now = this.clock()

    // 1. Tentukan sumber kandidat berdasarkan prioritas dan usia data
    let candidateValue: number | null = null
    let activeSource: 'A' | 'B' | 'C' | 'none' = 'none'

    const ageA = this.readingA ? (now - this.readingA.timestamp) / 1000 : Infinity
    const ageC = this.readingC ? (now - this.readingC.timestamp) / 1000 : Infinity
    const ageB = this.readingB ? (now - this.readingB.timestamp) / 1000 : Infinity

    if (this.readingA && ageA <= 20) {
      candidateValue = this.readingA.value
      activeSource = 'A'
    } else if (this.readingC && ageC <= 30) {
      candidateValue = this.readingC.value
      activeSource = 'C'
    } else if (this.readingB && ageB <= 45) {
      candidateValue = this.readingB.value
      activeSource = 'B'
    } else if (this.readingA) {
      // Fallback ke pembacaan terakhir A meskipun basi
      candidateValue = this.readingA.value
      activeSource = 'A'
    } else if (this.readingC) {
      candidateValue = this.readingC.value
      activeSource = 'C'
    } else if (this.readingB) {
      candidateValue = this.readingB.value
      activeSource = 'B'
    }

    if (candidateValue === null) {
      return {
        value: this.currentResolvedValue,
        activeSource: 'none',
        isStale: true
      }
    }

    // 2. Terapkan Spike Guard
    // Lonjakan jika: nilai baru > 3x nilai sebelumnya DAN selisih > 500
    const prev = this.currentResolvedValue
    const diff = candidateValue - prev
    const isSpike = prev > 0 && candidateValue > prev * 3 && diff > 500

    if (isSpike) {
      if (this.pendingSpikeCandidate) {
        // Cek apakah pembacaan kedua mengonfirmasi dalam rentang 15 dtk
        const spikeAge = (now - this.pendingSpikeCandidate.firstSeenAt) / 1000
        if (spikeAge <= 15) {
          // Terkonfirmasi oleh pembacaan kedua
          this.currentResolvedValue = candidateValue
          this.lastResolvedTime = now
          this.pendingSpikeCandidate = null
        } else {
          // Kedaluwarsa, mulai observasi baru
          this.pendingSpikeCandidate = { value: candidateValue, firstSeenAt: now }
        }
      } else {
        // Tahan nilai lama, catat kandidat lonjakan
        this.pendingSpikeCandidate = { value: candidateValue, firstSeenAt: now }
      }
    } else {
      // Bukan lonjakan yang mencurigakan, terapkan langsung
      this.currentResolvedValue = candidateValue
      this.lastResolvedTime = now
      this.pendingSpikeCandidate = null
    }

    const lastAgeSeconds = this.lastResolvedTime > 0 ? (now - this.lastResolvedTime) / 1000 : 999
    const isStale = lastAgeSeconds > 20

    return {
      value: this.currentResolvedValue,
      activeSource,
      isStale
    }
  }

  getDiagnosticStatus(): {
    sourceA: { value: number; ageSeconds: number }
    sourceB: { value: number; ageSeconds: number }
    sourceC: { value: number; ageSeconds: number }
    activeSource: 'A' | 'B' | 'C' | 'none'
    currentViewer: number
  } {
    const now = this.clock()
    const { activeSource } = this.resolve()

    return {
      sourceA: {
        value: this.readingA?.value ?? 0,
        ageSeconds: this.readingA ? Math.round((now - this.readingA.timestamp) / 1000) : -1
      },
      sourceB: {
        value: this.readingB?.value ?? 0,
        ageSeconds: this.readingB ? Math.round((now - this.readingB.timestamp) / 1000) : -1
      },
      sourceC: {
        value: this.readingC?.value ?? 0,
        ageSeconds: this.readingC ? Math.round((now - this.readingC.timestamp) / 1000) : -1
      },
      activeSource,
      currentViewer: this.currentResolvedValue
    }
  }

  reset(): void {
    this.readingA = null
    this.readingB = null
    this.readingC = null
    this.currentResolvedValue = 0
    this.lastResolvedTime = 0
    this.pendingSpikeCandidate = null
  }
}
