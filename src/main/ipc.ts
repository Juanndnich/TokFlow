import { ipcMain, clipboard, shell } from 'electron'
import { SessionStore } from '../core/session-store'
import { ViewerCountResolver } from '../core/viewer-resolver'
import { LikeTracker } from '../core/like-tracker'
import { WindowManager } from './windows'
import { SettingsService } from './services/settings'
import { RotatingLogger } from './services/logger'
import { TikTokLiveService } from './services/tiktok'
import { DemoSimulator } from './services/demo'
import { OverlayServer } from './services/overlay-server'
import { MetricsCollector } from './services/metrics'
import { ComparisonLogger } from './services/comparison'
import { SessionHistoryService } from './services/history'
import { AppSettings } from '../shared/types'

export function registerIpcHandlers(
  sessionStore: SessionStore,
  viewerResolver: ViewerCountResolver,
  likeTracker: LikeTracker,
  windowManager: WindowManager,
  settingsService: SettingsService,
  logger: RotatingLogger,
  tiktokService: TikTokLiveService,
  demoSimulator: DemoSimulator,
  overlayServer: OverlayServer,
  metricsCollector: MetricsCollector,
  comparisonLogger: ComparisonLogger,
  historyService: SessionHistoryService
): void {
  // 1. Session IPC
  ipcMain.handle('session:getSnapshot', () => {
    return sessionStore.getSnapshot()
  })

  ipcMain.handle('session:clearDisplay', () => {
    sessionStore.clearDisplay()
    logger.info('IPC', 'Pengguna mengosongkan tampilan layar')
  })

  ipcMain.handle('session:setPin', (_event, chatId: unknown) => {
    if (chatId === null || chatId === undefined) {
      sessionStore.setPin(undefined)
      return
    }
    if (typeof chatId !== 'string' || chatId.length > 100) return
    const snapshot = sessionStore.getSnapshot()
    const targetChat = snapshot.recentChats.find((c) => c.id === chatId)
    sessionStore.setPin(targetChat)
  })

  ipcMain.handle('session:export', (_event, format: unknown) => {
    const fmt = format === 'csv' ? 'csv' : 'json'
    const snapshot = sessionStore.getSnapshot()
    const summary = {
      id: `export_${Date.now()}`,
      username: snapshot.username || 'unknown',
      startTime: Date.now() - snapshot.stats.durationSeconds * 1000,
      endTime: Date.now(),
      durationSeconds: snapshot.stats.durationSeconds,
      peakViewers: snapshot.stats.peakViewers,
      totalComments: snapshot.stats.totalComments,
      totalCoins: snapshot.stats.totalCoins,
      totalLikes: snapshot.stats.likes,
      topGifters: snapshot.stats.topGifters
    }
    return historyService.exportSummary(summary, fmt)
  })

  // 2. TikTok Service IPC
  ipcMain.handle('tiktok:connect', async (_event, username: unknown) => {
    if (typeof username !== 'string' || username.trim().length === 0 || username.length > 64) {
      return { success: false, error: 'Username tidak valid (maksimal 64 karakter)' }
    }
    const cleanUser = username.trim()
    // Simpan username terakhir di pengaturan
    settingsService.saveSettings({ connection: { lastUsername: cleanUser } as any })
    return tiktokService.connect(cleanUser)
  })

  ipcMain.handle('tiktok:disconnect', async () => {
    await tiktokService.disconnect()
  })

  // 3. Demo Simulator IPC
  ipcMain.handle('demo:toggle', (_event, enable: unknown) => {
    if (typeof enable !== 'boolean') return
    if (enable) {
      tiktokService.disconnect()
      demoSimulator.start()
    } else {
      demoSimulator.stop()
    }
  })

  // 4. Settings IPC
  ipcMain.handle('settings:get', () => {
    return settingsService.getSettings(true)
  })

  ipcMain.handle('settings:save', (_event, patch: unknown) => {
    if (typeof patch !== 'object' || patch === null) {
      return { success: false, error: 'Argumen pengaturan tidak valid' }
    }
    return settingsService.saveSettings(patch as Partial<AppSettings>)
  })

  ipcMain.handle('settings:testApiKey', async (_event, apiKey: unknown) => {
    if (typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      return { success: false, error: 'Sign API Key tidak boleh kosong' }
    }
    // Uji validitas format API Key
    const trimmed = apiKey.trim()
    if (trimmed.length < 10) {
      return { success: false, error: 'Format Sign API Key terlalu pendek' }
    }
    return { success: true }
  })

  // 5. OBS & Overlay IPC
  ipcMain.handle('obs:getInfo', () => {
    return {
      url: overlayServer.getUrl(),
      port: overlayServer.getPort(),
      token: overlayServer.getToken(),
      activeCount: overlayServer.getActiveClientCount()
    }
  })

  ipcMain.handle('obs:regenerateToken', () => {
    const newToken = overlayServer.generateToken()
    settingsService.saveSettings({ overlay: { token: newToken } as any })
    logger.info('IPC', 'Token overlay berhasil di-regenerate')
    return newToken
  })

  ipcMain.handle('obs:openInBrowser', async () => {
    await shell.openExternal(overlayServer.getUrl())
  })

  // 6. Window Controls IPC
  ipcMain.handle('app:setAlwaysOnTop', (_event, always: unknown) => {
    if (typeof always === 'boolean') {
      windowManager.setAlwaysOnTop(always)
      settingsService.saveSettings({ display: { alwaysOnTop: always } as any })
    }
  })

  ipcMain.handle('app:setOpacity', (_event, opacity: unknown) => {
    if (typeof opacity === 'number') {
      const clamped = Math.max(30, Math.min(100, Math.floor(opacity)))
      windowManager.setWindowOpacity(clamped)
      settingsService.saveSettings({ display: { windowOpacity: clamped } as any })
    }
  })

  ipcMain.handle('app:openGiftMonitor', () => {
    windowManager.createGiftMonitorWindow()
  })

  ipcMain.handle('app:dockBackGiftMonitor', () => {
    windowManager.dockBackGiftMonitor()
  })

  ipcMain.handle('app:copyText', (_event, text: unknown) => {
    if (typeof text === 'string') {
      clipboard.writeText(text)
    }
  })

  // 7. Diagnostics & Logging IPC
  ipcMain.handle('app:getMetrics', () => {
    metricsCollector.setConnectionStatus(tiktokService.getStatus())
    return metricsCollector.getMetrics()
  })

  ipcMain.handle('app:getViewerDiagnostic', () => {
    return viewerResolver.getDiagnosticStatus()
  })

  ipcMain.handle('app:logComparison', (_event, args: unknown) => {
    if (typeof args !== 'object' || args === null) return
    const { viewers, likes } = args as { viewers: number; likes: number }
    if (typeof viewers === 'number' && typeof likes === 'number') {
      comparisonLogger.logComparison(
        viewers,
        likes,
        viewerResolver.getDiagnosticStatus(),
        likeTracker.getLikes()
      )
    }
  })

  ipcMain.handle('app:openLogFolder', async () => {
    await comparisonLogger.openLogFolder()
  })

  // 8. Update Check IPC (Opt-in GitHub Releases API)
  ipcMain.handle('update:check', async () => {
    try {
      const response = await fetch(
        'https://api.github.com/repos/OWNER/REPO/releases/latest',
        {
          headers: { 'User-Agent': 'TokFlow-App' }
        }
      )
      if (!response.ok) {
        return { hasUpdate: false }
      }
      const data = (await response.json()) as any
      const latestTag = data.tag_name || ''
      return {
        hasUpdate: false, // Disembunyikan bila repo masih placeholder OWNER/REPO
        latestVersion: latestTag,
        releaseUrl: data.html_url
      }
    } catch {
      return { hasUpdate: false }
    }
  })
}
