import { contextBridge, ipcRenderer } from 'electron'
import { AppSettings, SessionEvent, SessionSnapshot, ViewerSourceStatus } from '../shared/types'

export interface TokFlowApi {
  // Session IPC
  onSessionEvent: (callback: (event: SessionEvent) => void) => () => void
  getSnapshot: () => Promise<SessionSnapshot>
  connectTikTok: (username: string) => Promise<{ success: boolean; error?: string }>
  disconnectTikTok: () => Promise<void>
  toggleDemo: (enable: boolean) => Promise<void>
  clearDisplay: () => Promise<void>
  setPin: (chatId: string | null) => Promise<void>
  copyText: (text: string) => Promise<void>

  // Settings IPC
  getSettings: () => Promise<AppSettings>
  saveSettings: (settings: Partial<AppSettings>) => Promise<{ success: boolean; error?: string }>
  testApiKey: (key: string) => Promise<{ success: boolean; error?: string }>

  // Window & Overlay IPC
  getOverlayInfo: () => Promise<{ url: string; port: number; token: string; activeCount: number }>
  regenerateOverlayToken: () => Promise<string>
  openOverlayInBrowser: () => Promise<void>
  setAlwaysOnTop: (always: boolean) => Promise<void>
  setWindowOpacity: (opacityPercent: number) => Promise<void>
  openGiftMonitor: () => Promise<void>
  dockBackGiftMonitor: () => Promise<void>

  // Diagnostics & Export IPC
  getMetrics: () => Promise<{
    totalRamMB: number
    cpuPercent: number
    messagesPerSecond: number
    droppedEventsCount: number
    activePort: number
    connectionStatus: string
    libraryVersion: string
  }>
  getViewerDiagnostic: () => Promise<ViewerSourceStatus>
  logComparison: (tiktokViewers: number, tiktokLikes: number) => Promise<void>
  openLogFolder: () => Promise<void>
  exportSession: (format: 'json' | 'csv') => Promise<string>
  checkUpdates: () => Promise<{ hasUpdate: boolean; latestVersion?: string; releaseUrl?: string }>
}

const api: TokFlowApi = {
  onSessionEvent: (callback) => {
    const handler = (_: Electron.IpcRendererEvent, event: SessionEvent) => callback(event)
    ipcRenderer.on('session:event', handler)
    return () => {
      ipcRenderer.removeListener('session:event', handler)
    }
  },
  getSnapshot: () => ipcRenderer.invoke('session:getSnapshot'),
  connectTikTok: (username) => ipcRenderer.invoke('tiktok:connect', username),
  disconnectTikTok: () => ipcRenderer.invoke('tiktok:disconnect'),
  toggleDemo: (enable) => ipcRenderer.invoke('demo:toggle', enable),
  clearDisplay: () => ipcRenderer.invoke('session:clearDisplay'),
  setPin: (chatId) => ipcRenderer.invoke('session:setPin', chatId),
  copyText: (text) => ipcRenderer.invoke('app:copyText', text),

  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  testApiKey: (key) => ipcRenderer.invoke('settings:testApiKey', key),

  getOverlayInfo: () => ipcRenderer.invoke('obs:getInfo'),
  regenerateOverlayToken: () => ipcRenderer.invoke('obs:regenerateToken'),
  openOverlayInBrowser: () => ipcRenderer.invoke('obs:openInBrowser'),
  setAlwaysOnTop: (always) => ipcRenderer.invoke('app:setAlwaysOnTop', always),
  setWindowOpacity: (opacity) => ipcRenderer.invoke('app:setOpacity', opacity),
  openGiftMonitor: () => ipcRenderer.invoke('app:openGiftMonitor'),
  dockBackGiftMonitor: () => ipcRenderer.invoke('app:dockBackGiftMonitor'),

  getMetrics: () => ipcRenderer.invoke('app:getMetrics'),
  getViewerDiagnostic: () => ipcRenderer.invoke('app:getViewerDiagnostic'),
  logComparison: (viewers, likes) => ipcRenderer.invoke('app:logComparison', { viewers, likes }),
  openLogFolder: () => ipcRenderer.invoke('app:openLogFolder'),
  exportSession: (format) => ipcRenderer.invoke('session:export', format),
  checkUpdates: () => ipcRenderer.invoke('update:check')
}

contextBridge.exposeInMainWorld('tokflow', api)
