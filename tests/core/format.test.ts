import { describe, it, expect } from 'vitest'
import { formatNumberCompact, formatNumberFull, formatDuration } from '../../src/core/format'

describe('Format Utils', () => {
  it('memformat angka di bawah 10.000 dengan pemisah titik', () => {
    expect(formatNumberCompact(0)).toBe('0')
    expect(formatNumberCompact(500)).toBe('500')
    expect(formatNumberCompact(1250)).toBe('1.250')
    expect(formatNumberCompact(9999)).toBe('9.999')
  })

  it('memformat angka mulai 10.000 menjadi ringkas (K dan M)', () => {
    expect(formatNumberCompact(10000)).toBe('10,0K')
    expect(formatNumberCompact(15240)).toBe('15,2K')
    expect(formatNumberCompact(999900)).toBe('999,9K')
    expect(formatNumberCompact(1200000)).toBe('1,2M')
  })

  it('memformat angka penuh untuk keperluan tooltip', () => {
    expect(formatNumberFull(15240)).toBe('15.240')
    expect(formatNumberFull(1200000)).toBe('1.200.000')
  })

  it('memformat durasi dalam mm:ss atau hh:mm:ss', () => {
    expect(formatDuration(0)).toBe('00:00')
    expect(formatDuration(59)).toBe('00:59')
    expect(formatDuration(65)).toBe('01:05')
    expect(formatDuration(3600)).toBe('01:00:00')
    expect(formatDuration(3665)).toBe('01:01:05')
    expect(formatDuration(-10)).toBe('00:00')
  })
})
