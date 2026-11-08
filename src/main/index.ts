import { app, BrowserWindow } from 'electron'
import { join } from 'path'

// Handle smoke test early if requested in command line arguments
const isSmokeTest = process.argv.includes('--smoke-test')

let mainWindow: BrowserWindow | null = null

async function verifyTikTokModule(): Promise<boolean> {
  try {
    const tiktok = await import('tiktok-live-connector')
    return !!tiktok && typeof tiktok === 'object'
  } catch (err) {
    console.error('Failed to import tiktok-live-connector:', err)
    return false
  }
}

function createWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 440,
    height: 760,
    minWidth: 360,
    minHeight: 520,
    show: !isSmokeTest,
    frame: true, // Native Windows title bar - Frameless DILARANG per AGENTS.md
    backgroundColor: '#0B0D0A',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  })

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock && !isSmokeTest) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(async () => {
    const win = createWindow()

    if (isSmokeTest) {
      console.log('Smoke test running...')
      const tiktokOk = await verifyTikTokModule()
      if (!tiktokOk) {
        console.error('Smoke test failed: tiktok-live-connector could not be imported.')
        app.exit(1)
        return
      }
      console.log('Smoke test: tiktok-live-connector successfully loaded.')
      console.log('Smoke test: window successfully created.')
      win.destroy()
      console.log('Smoke test passed cleanly.')
      app.exit(0)
    }
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}
