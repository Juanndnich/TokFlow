import { app } from 'electron'
import { SessionStore } from '../core/session-store'
import { ViewerCountResolver } from '../core/viewer-resolver'
import { LikeTracker } from '../core/like-tracker'
import { GiftAggregator } from '../core/gift-aggregator'
import { RotatingLogger } from './services/logger'
import { SettingsService } from './services/settings'
import { SessionHistoryService } from './services/history'
import { ComparisonLogger } from './services/comparison'
import { MetricsCollector } from './services/metrics'
import { OverlayServer } from './services/overlay-server'
import { WindowManager } from './windows'
import { TikTokLiveService } from './services/tiktok'
import { DemoSimulator } from './services/demo'
import { registerIpcHandlers } from './ipc'
import { runShotsSuite } from './shots-runner'
import { runPerformanceMeasurement } from './perf-runner'

import path from 'path'

const isSmokeTest = process.argv.includes('--smoke-test')
const isShotsMode = process.argv.includes('--shots-mode')
const isMeasurePerf = process.argv.includes('--measure-perf')

// Konfigurasi userData directory agar selalu aman di lingkungan Windows sandbox
try {
  const customUserData =
    process.env.TOKFLOW_USER_DATA || path.join(process.cwd(), '.userData')
  app.setPath('userData', customUserData)
} catch {
  // Abaikan
}

async function verifyTikTokModule(): Promise<boolean> {
  try {
    const mod = await import('tiktok-live-connector')
    return !!mod && typeof mod === 'object'
  } catch (err) {
    console.error('Smoke test: Gagal memuat tiktok-live-connector:', err)
    return false
  }
}

// Single instance lock (abaikan di mode smoke test, shots, atau perf)
const gotTheLock =
  isSmokeTest || isShotsMode || isMeasurePerf
    ? true
    : app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  // Inisialisasi Service Inti
  const sessionStore = new SessionStore()
  const viewerResolver = new ViewerCountResolver()
  const likeTracker = new LikeTracker()
  const giftAggregator = new GiftAggregator()
  const logger = new RotatingLogger()
  const settingsService = new SettingsService()
  const historyService = new SessionHistoryService()
  const comparisonLogger = new ComparisonLogger(logger.getLogDir())
  const metricsCollector = new MetricsCollector()
  const windowManager = new WindowManager()

  // Ambil pengaturan token overlay yang tersimpan
  const currentSettings = settingsService.getSettings(false)
  const overlayServer = new OverlayServer(
    sessionStore,
    logger,
    currentSettings.overlay.token || undefined
  )

  const tiktokService = new TikTokLiveService(
    sessionStore,
    viewerResolver,
    likeTracker,
    giftAggregator,
    settingsService,
    logger,
    () => metricsCollector.recordMessage()
  )

  const demoSimulator = new DemoSimulator(
    sessionStore,
    viewerResolver,
    likeTracker,
    giftAggregator,
    () => metricsCollector.recordMessage()
  )

  // Sambungkan SessionStore ke semua jendela (broadcast)
  sessionStore.subscribe((event) => {
    windowManager.broadcast('session:event', event)

    // Simpan ringkasan jika sesi berakhir
    if (event.type === 'session_reset' && event.summary) {
      historyService.saveSession(event.summary)
    }
  })

  // Registrasi IPC handlers
  registerIpcHandlers(
    sessionStore,
    viewerResolver,
    likeTracker,
    windowManager,
    settingsService,
    logger,
    tiktokService,
    demoSimulator,
    overlayServer,
    metricsCollector,
    comparisonLogger,
    historyService
  )

  app.on('second-instance', () => {
    const mainWin = windowManager.getMainWindow()
    if (mainWin) {
      if (mainWin.isMinimized()) mainWin.restore()
      mainWin.focus()
    }
  })

  app.whenReady().then(async () => {
    logger.info('App', 'TokFlow sedang memulai...')

    if (isSmokeTest) {
      console.log('Smoke test running...')
      const tiktokOk = await verifyTikTokModule()
      if (!tiktokOk) {
        console.error('Smoke test: Gagal memuat modul tiktok-live-connector')
        app.exit(1)
        return
      }
      const win = windowManager.createMainWindow(true)
      console.log('Smoke test: Window berhasil dibuat.')
      win.destroy()
      console.log('Smoke test lolos dengan kode 0.')
      app.exit(0)
      return
    }

    // Jalankan server overlay lokal
    try {
      const port = await overlayServer.start(currentSettings.overlay.port)
      metricsCollector.setActivePort(port)
      // Simpan port aktual dan token jika berubah
      settingsService.saveSettings({
        overlay: {
          ...currentSettings.overlay,
          port,
          token: overlayServer.getToken()
        }
      })
    } catch (err) {
      logger.error('App', `Gagal menjalankan server overlay: ${err}`)
    }

    // Buat jendela utama
    const mainWin = windowManager.createMainWindow()

    // Terapkan preferensi jendela awal
    if (currentSettings.display.alwaysOnTop) {
      mainWin.setAlwaysOnTop(true)
    }
    if (currentSettings.display.windowOpacity < 100) {
      windowManager.setWindowOpacity(currentSettings.display.windowOpacity)
    }

    if (isShotsMode) {
      const executeShots = async () => {
        try {
          await runShotsSuite(windowManager, sessionStore, demoSimulator, overlayServer)
        } catch (err) {
          console.error('Gagal menjalankan shots suite:', err)
          app.exit(1)
        }
      }
      if (mainWin.webContents.isLoading()) {
        mainWin.webContents.once('did-finish-load', executeShots)
      } else {
        setTimeout(executeShots, 500)
      }
    }

    if (isMeasurePerf) {
      const executePerf = async () => {
        try {
          await runPerformanceMeasurement(windowManager, sessionStore, demoSimulator)
        } catch (err) {
          console.error('Gagal mengukur performa:', err)
          app.exit(1)
        }
      }
      if (mainWin.webContents.isLoading()) {
        mainWin.webContents.once('did-finish-load', executePerf)
      } else {
        setTimeout(executePerf, 500)
      }
    }
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('will-quit', async () => {
    await overlayServer.stop()
    await tiktokService.disconnect()
  })
}
