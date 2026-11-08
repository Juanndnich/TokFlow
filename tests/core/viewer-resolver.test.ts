import { describe, it, expect } from 'vitest'
import { ViewerCountResolver } from '../../src/core/viewer-resolver'

describe('ViewerCountResolver', () => {
  it('mengutamakan Sumber A jika masih segar (<= 20 dtk)', () => {
    let now = 100000
    const resolver = new ViewerCountResolver(() => now)

    resolver.updateSourceC(50) // C di waktu 100.000
    resolver.updateSourceA(120) // A di waktu 100.000
    resolver.updateSourceB(45)

    const result = resolver.resolve()
    expect(result.value).toBe(120)
    expect(result.activeSource).toBe('A')
    expect(result.isStale).toBe(false)
  })

  it('beralih ke Sumber C jika Sumber A basi (> 20 dtk) namun C segar (<= 30 dtk)', () => {
    let now = 100000
    const resolver = new ViewerCountResolver(() => now)

    resolver.updateSourceA(100) // t = 100.000
    now += 25000 // t = 125.000 (A sudah berusia 25 dtk -> basi)

    resolver.updateSourceC(110) // C di waktu 125.000
    const result = resolver.resolve()

    expect(result.value).toBe(110)
    expect(result.activeSource).toBe('C')
    expect(result.isStale).toBe(false)
  })

  it('beralih ke Sumber B jika A dan C basi', () => {
    let now = 100000
    const resolver = new ViewerCountResolver(() => now)

    resolver.updateSourceA(80)
    resolver.updateSourceC(85)
    now += 35000 // A usia 35s, C usia 35s

    resolver.updateSourceB(95)
    const result = resolver.resolve()

    expect(result.value).toBe(95)
    expect(result.activeSource).toBe('B')
  })

  it('menahan lonjakan angka (Spike Guard) sampai terkonfirmasi pembacaan kedua', () => {
    let now = 100000
    const resolver = new ViewerCountResolver(() => now)

    resolver.updateSourceA(100)
    expect(resolver.resolve().value).toBe(100)

    // Lonjakan besar: 100 -> 1000 (> 3x dan selisih > 500)
    now += 2000
    resolver.updateSourceA(1000)

    // Pembacaan pertama: nilai lama ditahan
    const firstCheck = resolver.resolve()
    expect(firstCheck.value).toBe(100)

    // Pembacaan kedua dalam 15 dtk: lonjakan terkonfirmasi
    now += 3000
    resolver.updateSourceA(1020)
    const secondCheck = resolver.resolve()
    expect(secondCheck.value).toBe(1020)
  })

  it('menolak lonjakan jika pembacaan kedua lewat dari 15 detik', () => {
    let now = 100000
    const resolver = new ViewerCountResolver(() => now)

    resolver.updateSourceA(100)
    resolver.resolve()

    // Lonjakan pertama
    now += 2000
    resolver.updateSourceA(1500)
    expect(resolver.resolve().value).toBe(100)

    // Pembacaan kedua baru datang setelah 20 detik (> 15 detik batas konfirmasi)
    now += 20000
    resolver.updateSourceA(1500)
    // Masih ditahan sebagai kandidat baru
    expect(resolver.resolve().value).toBe(100)
  })

  it('menolak angka negatif, NaN, dan non-integer', () => {
    let now = 100000
    const resolver = new ViewerCountResolver(() => now)

    resolver.updateSourceA(-50)
    expect(resolver.resolve().value).toBe(0)

    resolver.updateSourceA(NaN)
    expect(resolver.resolve().value).toBe(0)

    resolver.updateSourceA(45.7)
    expect(resolver.resolve().value).toBe(45)
  })
})
