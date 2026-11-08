import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'

const WHITELISTED_DOMAINS = [
  'github.com',
  'tiktok.com',
  'www.tiktok.com',
  'eulerstream.com'
]

export function isUrlWhitelisted(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr)
    if (parsed.protocol !== 'https:') return false
    return WHITELISTED_DOMAINS.some(
      (domain) => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
    )
  } catch {
    return false
  }
}

export class WindowManager {
  private mainWindow: BrowserWindow | null = null
  private giftMonitorWindow: BrowserWindow | null = null

  getMainWindow(): BrowserWindow | null {
    return this.mainWindow
  }

  getGiftMonitorWindow(): BrowserWindow | null {
    return this.giftMonitorWindow
  }

  createMainWindow(isSmokeTest = false): BrowserWindow {
    this.mainWindow = new BrowserWindow({
      width: 440,
      height: 760,
      minWidth: 360,
      minHeight: 520,
      show: !isSmokeTest,
      frame: true, // Native title bar Windows (Frameless DILARANG)
      backgroundColor: '#0B0D0A',
      title: 'TokFlow',
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        webSecurity: true
      }
    })

    this.applySecurityPolicies(this.mainWindow)

    if (process.env.ELECTRON_RENDERER_URL) {
      this.mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
    } else {
      this.mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }

    this.mainWindow.on('closed', () => {
      this.mainWindow = null
      // Tutup juga Gift Monitor jika jendela utama ditutup
      if (this.giftMonitorWindow) {
        this.giftMonitorWindow.close()
        this.giftMonitorWindow = null
      }
    })

    return this.mainWindow
  }

  createGiftMonitorWindow(): BrowserWindow {
    if (this.giftMonitorWindow) {
      if (this.giftMonitorWindow.isMinimized()) this.giftMonitorWindow.restore()
      this.giftMonitorWindow.focus()
      return this.giftMonitorWindow
    }

    this.giftMonitorWindow = new BrowserWindow({
      width: 380,
      height: 600,
      minWidth: 320,
      minHeight: 400,
      frame: true,
      backgroundColor: '#0B0D0A',
      title: 'TokFlow - Gift Monitor',
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        webSecurity: true
      }
    })

    this.applySecurityPolicies(this.giftMonitorWindow)

    if (process.env.ELECTRON_RENDERER_URL) {
      this.giftMonitorWindow.loadURL(`${process.env.ELECTRON_RENDERER_URL}#gift-monitor`)
    } else {
      this.giftMonitorWindow.loadFile(join(__dirname, '../renderer/index.html'), {
        hash: 'gift-monitor'
      })
    }

    this.giftMonitorWindow.on('closed', () => {
      this.giftMonitorWindow = null
    })

    return this.giftMonitorWindow
  }

  dockBackGiftMonitor(): void {
    if (this.giftMonitorWindow) {
      this.giftMonitorWindow.close()
      this.giftMonitorWindow = null
    }
    if (this.mainWindow) {
      this.mainWindow.focus()
    }
  }

  setAlwaysOnTop(always: boolean): void {
    this.mainWindow?.setAlwaysOnTop(always)
    this.giftMonitorWindow?.setAlwaysOnTop(always)
  }

  setWindowOpacity(opacityPercent: number): void {
    const val = Math.max(0.3, Math.min(1.0, opacityPercent / 100))
    this.mainWindow?.setOpacity(val)
  }

  private applySecurityPolicies(win: BrowserWindow): void {
    // Blokir navigasi remote
    win.webContents.on('will-navigate', (event, url) => {
      if (url !== win.webContents.getURL()) {
        event.preventDefault()
      }
    })

    // Tolak semua window.open
    win.webContents.setWindowOpenHandler(({ url }) => {
      if (isUrlWhitelisted(url)) {
        shell.openExternal(url).catch(() => {})
      }
      return { action: 'deny' }
    })

    // Tolak semua permission request (kamera, mikrofon, geolokasi, dll)
    const session = win.webContents.session
    session.setPermissionRequestHandler((_wc, _permission, callback) => {
      callback(false)
    })
    session.setPermissionCheckHandler(() => false)

    // Matikan devtools pada mode produksi
    if (app.isPackaged) {
      win.webContents.on('devtools-opened', () => {
        win.webContents.closeDevTools()
      })
    }
  }

  broadcast(channel: string, ...args: any[]): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, ...args)
    }
    if (this.giftMonitorWindow && !this.giftMonitorWindow.isDestroyed()) {
      this.giftMonitorWindow.webContents.send(channel, ...args)
    }
  }
}
