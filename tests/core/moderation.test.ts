import { describe, it, expect } from 'vitest'
import { LocalModerator } from '../../src/core/moderation'

describe('LocalModerator', () => {
  const moderator = new LocalModerator({
    hiddenUsers: ['bad_user', 'spammer123'],
    blockedWords: ['kata_kasar', 'promo_ilegal'],
    highlightedWords: ['vip', 'pertanyaan'],
    antiSpamDuplicateThreshold: 3
  })

  it('menyembunyikan pesan dari pengguna dalam daftar hiddenUsers', () => {
    const res = moderator.checkMessage('u1', 'bad_user', 'Halo semua')
    expect(res.shouldHide).toBe(true)
    expect(res.reason).toBe('hidden_user')
  })

  it('menyembunyikan pesan yang mengandung kata terlarang', () => {
    const res = moderator.checkMessage('u2', 'user_biasa', 'Ini ada link kata_kasar di sini')
    expect(res.shouldHide).toBe(true)
    expect(res.reason).toBe('blocked_word')
  })

  it('mendeteksi spam duplikat beruntun', () => {
    moderator.reset()
    // Pesan 1 & 2 lolos
    expect(moderator.checkMessage('u3', 'user3', 'Spam sama').shouldHide).toBe(false)
    expect(moderator.checkMessage('u3', 'user3', 'Spam sama').shouldHide).toBe(false)

    // Pesan 3 mencapai threshold (3) -> disembunyikan
    const res3 = moderator.checkMessage('u3', 'user3', 'Spam sama')
    expect(res3.shouldHide).toBe(true)
    expect(res3.reason).toBe('duplicate_spam')
  })

  it('menandai pesan yang mengandung highlighted words', () => {
    moderator.reset()
    const res = moderator.checkMessage('u4', 'user4', 'Saya punya pertanyaan penting')
    expect(res.shouldHide).toBe(false)
    expect(res.isHighlighted).toBe(true)
  })
})
