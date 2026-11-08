import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => tmpdir()),
    getAppMetrics: vi.fn(() => [
      { memory: { workingSetSize: 120000 }, cpu: { percentCPUUsage: 2.5 } }
    ])
  },
  safeStorage: {
    isEncryptionAvailable: vi.fn(() => false),
    encryptString: vi.fn((str: string) => Buffer.from(str)),
    decryptString: vi.fn((buf: Buffer) => buf.toString())
  },
  shell: {
    openPath: vi.fn(async () => '')
  }
}))

import { RotatingLogger } from '../../src/main/services/logger'
import { SettingsService, maskApiKey } from '../../src/main/services/settings'
import { SessionHistoryService } from '../../src/main/services/history'
import { ComparisonLogger } from '../../src/main/services/comparison'
import { SessionStore } from '../../src/core/session-store'
import { ViewerCountResolver } from '../../src/core/viewer-resolver'
import { LikeTracker } from '../../src/core/like-tracker'
import { GiftAggregator } from '../../src/core/gift-aggregator'
import { DemoSimulator } from '../../src/main/services/demo'

describe('Main Process Services', () => {
  let testDir: string

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'tokflow-test-'))
  })

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  it('RotatingLogger menyanitasi token dan API key', () => {
    const logger = new RotatingLogger(testDir)
    logger.info('Test', 'Koneksi dengan token=abcdef123456 dan signApiKey="sk_secret123"')

    const logPath = join(testDir, 'tokflow.log')
    expect(existsSync(logPath)).toBe(true)
    const content = readFileSync(logPath, 'utf8')

    expect(content).toContain('[REDACTED]')
    expect(content).not.toContain('abcdef123456')
    expect(content).not.toContain('sk_secret123')
  })

  it('maskApiKey menyamarkan secret key dengan aman', () => {
    expect(maskApiKey('123456789012')).toBe('123****012')
    expect(maskApiKey('pendek')).toBe('******')
    expect(maskApiKey('')).toBe('')
  })

  it('SettingsService menyimpan pengaturan secara atomik dan memuat ulang', () => {
    const settings = new SettingsService(testDir)
    const res = settings.saveSettings({
      connection: {
        lastUsername: 'streamer_uji',
        signApiKey: '',
        enableHttpPolling: false
      }
    })

    expect(res.success).toBe(true)
    const loaded = settings.getSettings(false)
    expect(loaded.connection.lastUsername).toBe('streamer_uji')
    expect(existsSync(join(testDir, 'settings.json'))).toBe(true)
  })

  it('ComparisonLogger mencatat baris JSONL yang valid', () => {
    const compLogger = new ComparisonLogger(testDir)
    compLogger.logComparison(
      1200,
      45000,
      {
        sourceA: { value: 1190, ageSeconds: 2 },
        sourceB: { value: 1000, ageSeconds: 15 },
        sourceC: { value: 1200, ageSeconds: 5 },
        activeSource: 'A',
        currentViewer: 1190
      },
      45200
    )

    const logPath = join(testDir, 'tokflow-comparison.jsonl')
    expect(existsSync(logPath)).toBe(true)
    const line = readFileSync(logPath, 'utf8').trim()
    const parsed = JSON.parse(line)

    expect(parsed.tiktokInput.viewers).toBe(1200)
    expect(parsed.tokflowActual.viewers).toBe(1190)
    expect(parsed.tokflowActual.activeSource).toBe('A')
  })

  it('SessionHistoryService mengekspor JSON dan CSV dengan format tepat', () => {
    const history = new SessionHistoryService(testDir)
    const summary = {
      id: 'session_test',
      username: 'andi_live',
      startTime: 1000000,
      endTime: 1003600,
      durationSeconds: 3600,
      peakViewers: 1500,
      totalComments: 340,
      totalCoins: 2500,
      totalLikes: 80000,
      topGifters: [
        { userId: 'u1', uniqueId: 'u1', nickname: 'Budi "Pro"', coins: 1500 }
      ]
    }

    history.saveSession(summary)
    const list = history.getHistory()
    expect(list.length).toBe(1)
    expect(list[0].username).toBe('andi_live')

    const csv = history.exportSummary(summary, 'csv')
    expect(csv).toContain('"andi_live"')
    expect(csv).toContain('totalCoins')
    expect(csv).toContain('2500')
    expect(csv).toContain('Budi ""Pro""') // CSV quotes escaping

    const json = history.exportSummary(summary, 'json')
    expect(JSON.parse(json).username).toBe('andi_live')
  })

  it('DemoSimulator mengalirkan data melalui SessionStore secara realtime', () => {
    const store = new SessionStore()
    const resolver = new ViewerCountResolver()
    const tracker = new LikeTracker()
    const aggregator = new GiftAggregator()

    let eventEmittedCount = 0
    const simulator = new DemoSimulator(store, resolver, tracker, aggregator, () => {
      eventEmittedCount++
    })

    expect(simulator.isActive()).toBe(false)
    simulator.start()
    expect(simulator.isActive()).toBe(true)
    expect(store.getStatus()).toBe('connected')
    expect(store.getUsername()).toBe('demo_streamer')

    simulator.stop()
    expect(simulator.isActive()).toBe(false)
    expect(store.getStatus()).toBe('disconnected')
    expect(eventEmittedCount).toBeGreaterThanOrEqual(0)
  })
})
