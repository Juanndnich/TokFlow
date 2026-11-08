import { describe, it, expect } from 'vitest'
import { validateAndMigrateSettings, DEFAULT_SETTINGS } from '../../src/core/settings-schema'

describe('Settings Schema & Migration', () => {
  it('mengembalikan default settings bila input rusak atau non-objek', () => {
    expect(validateAndMigrateSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(validateAndMigrateSettings(undefined)).toEqual(DEFAULT_SETTINGS)
    expect(validateAndMigrateSettings('corrupted string')).toEqual(DEFAULT_SETTINGS)
    expect(validateAndMigrateSettings([])).toEqual(DEFAULT_SETTINGS)
  })

  it('memvalidasi dan mengembalikan nilai valid yang diberikan', () => {
    const input = {
      version: 1,
      connection: {
        lastUsername: 'streamer_keren',
        signApiKey: 'key_123',
        enableHttpPolling: true
      },
      overlay: {
        port: 8905,
        token: 'token123',
        fontSize: 16,
        width: 450,
        autoHideSeconds: 10
      },
      display: {
        density: 'compact',
        fontSize: 12,
        windowOpacity: 90,
        alwaysOnTop: true
      }
    }

    const validated = validateAndMigrateSettings(input)
    expect(validated.connection.lastUsername).toBe('streamer_keren')
    expect(validated.connection.enableHttpPolling).toBe(true)
    expect(validated.overlay.port).toBe(8905)
    expect(validated.display.density).toBe('compact')
    expect(validated.display.fontSize).toBe(12)
    expect(validated.display.alwaysOnTop).toBe(true)
  })

  it('memperbaiki nilai di luar rentang batas ke nilai default yang aman', () => {
    const input = {
      overlay: {
        port: 9999, // Harus 8899 - 8909
        fontSize: 100 // Harus 10 - 32
      },
      display: {
        fontSize: 30, // Harus 11 - 18
        windowOpacity: 10 // Harus 30 - 100
      }
    }

    const validated = validateAndMigrateSettings(input)
    expect(validated.overlay.port).toBe(DEFAULT_SETTINGS.overlay.port)
    expect(validated.overlay.fontSize).toBe(32) // Diclaming ke maks 32
    expect(validated.display.fontSize).toBe(DEFAULT_SETTINGS.display.fontSize)
    expect(validated.display.windowOpacity).toBe(DEFAULT_SETTINGS.display.windowOpacity)
  })

  it('memulihkan field parsial yang hilang tanpa crash', () => {
    const input = {
      connection: {
        lastUsername: 'test'
      }
    }
    const validated = validateAndMigrateSettings(input)
    expect(validated.connection.lastUsername).toBe('test')
    expect(validated.overlay.port).toBe(8899)
    expect(validated.features.enableModeration).toBe(false)
  })
})
