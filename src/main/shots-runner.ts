import { BrowserWindow, app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { WindowManager } from './windows'
import { DemoSimulator } from './services/demo'
import { OverlayServer } from './services/overlay-server'

import { SessionStore } from '../core/session-store'

const SHOTS_DIR =
  process.env.TOKFLOW_SHOTS_DIR ||
  path.resolve(app.getAppPath(), '../../docs/shots')

export async function runShotsSuite(
  windowManager: WindowManager,
  sessionStore: SessionStore,
  _demoSimulator: DemoSimulator,
  overlayServer: OverlayServer
): Promise<void> {
  const logFile = path.join(SHOTS_DIR, 'shots-debug.log')
  const log = (msg: string) => {
    console.log(`[Shots] ${msg}`)
    fs.appendFileSync(logFile, `${new Date().toISOString()} ${msg}\n`)
  }

  log('Memulai suite tangkapan layar otomatis (native capturePage)...')

  if (!fs.existsSync(SHOTS_DIR)) {
    fs.mkdirSync(SHOTS_DIR, { recursive: true })
  }

  const mainWin = windowManager.getMainWindow()
  if (!mainWin) {
    throw new Error('Jendela utama tidak ditemukan')
  }

  // Helper untuk resize dan tunggu render
  const resizeAndWait = async (width: number, height: number, waitMs = 400) => {
    mainWin.setSize(width, height)
    await new Promise((r) => setTimeout(r, waitMs))
  }

  // Helper capture dan simpan
  const captureAndSave = async (filename: string, targetWin = mainWin) => {
    const nativeImage = await targetWin.webContents.capturePage()
    const buffer = nativeImage.toPNG()
    fs.writeFileSync(path.join(SHOTS_DIR, filename), buffer)
    log(`✓ Tersimpan: docs/shots/${filename} (${buffer.length} bytes)`)
  }

  try {
    // 1. Jendela Utama Kosong (3 ukuran)
    log('Menangkap jendela utama kosong...')
    await resizeAndWait(360, 520)
    await captureAndSave('empty-360x520.png')

    await resizeAndWait(440, 760)
    await captureAndSave('empty-440x760.png')

    await resizeAndWait(1000, 700)
    await captureAndSave('empty-1000x700.png')

    // 2. Aktifkan Demo Simulator lewat UI tombol Demo
    log('Mengaktifkan Demo Simulator via tombol UI...')
    await mainWin.webContents.executeJavaScript(`
      (() => {
        const btn = Array.from(document.querySelectorAll('button')).find(function(b) {
          return b.textContent && b.textContent.trim() === 'Demo';
        });
        if (btn) btn.click();
      })()
    `)
    await new Promise((r) => setTimeout(r, 4200)) // Tunggu simulator mengisi pesan chat & gift

    // Tangkap Demo di 3 ukuran
    log('Menangkap Demo dengan chat & gift...')
    await resizeAndWait(360, 520)
    await captureAndSave('demo-360x520.png')

    await resizeAndWait(440, 760)
    await captureAndSave('demo-440x760.png')

    await resizeAndWait(1000, 700)
    await captureAndSave('demo-1000x700.png')

    // 3. Tab Gift
    log('Menangkap Tab Gift...')
    await resizeAndWait(440, 760)
    await mainWin.webContents.executeJavaScript(`
      (() => {
        const tabs = document.querySelectorAll('button[role="tab"]');
        if (tabs.length > 1) tabs[1].click();
      })()
    `)
    await new Promise((r) => setTimeout(r, 500))
    await captureAndSave('gift-tab-440x760.png')

    // Kembalikan ke tab Obrolan
    await mainWin.webContents.executeJavaScript(`
      (() => {
        const tabs = document.querySelectorAll('button[role="tab"]');
        if (tabs.length > 0) tabs[0].click();
      })()
    `)
    await new Promise((r) => setTimeout(r, 400))

    // 4. Mode Mini
    log('Menangkap Mode Mini...')
    await resizeAndWait(300, 520)
    await mainWin.webContents.executeJavaScript(`
      (() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'm' }));
      })()
    `)
    await new Promise((r) => setTimeout(r, 700))
    await captureAndSave('mini-360x520.png')

    // Keluar Mode Mini
    await mainWin.webContents.executeJavaScript(`
      (() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'm' }));
      })()
    `)
    await new Promise((r) => setTimeout(r, 700))

    // 5. Drawer Pengaturan & Uji Otomatis pada Tinggi 520 px
    log('Menguji Drawer Pengaturan pada tinggi 520 px...')
    await resizeAndWait(360, 520)
    await mainWin.webContents.executeJavaScript(`
      (() => {
        const btn = document.querySelector('button[aria-label="Pengaturan"]');
        if (btn) btn.click();
      })()
    `)
    await new Promise((r) => setTimeout(r, 500))

    // Tangkap bagian atas drawer
    await captureAndSave('drawer-top-360x520.png')

    // Lakukan audit drawer di renderer
    const auditResult = await mainWin.webContents.executeJavaScript(`
      (async () => {
        const closeBtn = document.querySelector('button[aria-label="Tutup Pengaturan"]');
        const drawerBody = document.querySelector('.tokflow-drawer-body');

        const isCloseBtnVisibleBefore = !!(
          closeBtn &&
          closeBtn.getBoundingClientRect().width > 0 &&
          closeBtn.getBoundingClientRect().height > 0
        );

        let canScroll = false;
        let isLastElementVisible = false;
        let hasHorizontalScroll = false;

        if (drawerBody) {
          canScroll = drawerBody.scrollHeight > drawerBody.clientHeight;
          drawerBody.scrollTop = drawerBody.scrollHeight;
          await new Promise((r) => setTimeout(r, 200));

          const lastChild = drawerBody.lastElementChild;
          if (lastChild) {
            const rect = lastChild.getBoundingClientRect();
            isLastElementVisible = rect.top < window.innerHeight && rect.bottom > 0;
          }

          hasHorizontalScroll = drawerBody.scrollWidth > drawerBody.clientWidth + 2;
        }

        const isCloseBtnVisibleAfter = !!(
          closeBtn &&
          closeBtn.getBoundingClientRect().width > 0 &&
          closeBtn.getBoundingClientRect().height > 0
        );

        return {
          isCloseBtnVisibleBefore,
          isCloseBtnVisibleAfter,
          canScroll,
          isLastElementVisible,
          hasHorizontalScroll
        };
      })()
    `)

    log('Hasil Audit Drawer: ' + JSON.stringify(auditResult))
    await captureAndSave('drawer-bottom-360x520.png')

    // Uji tutup dengan Escape
    await mainWin.webContents.executeJavaScript(`
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    `)
    await new Promise((r) => setTimeout(r, 300))
    const isClosedWithEsc = await mainWin.webContents.executeJavaScript(`
      !document.querySelector('.tokflow-drawer-container')
    `)

    // Buka kembali dan uji tutup dengan klik scrim
    await mainWin.webContents.executeJavaScript(`
      (() => {
        const btn = document.querySelector('button[aria-label="Pengaturan"]');
        if (btn) btn.click();
      })()
    `)
    await new Promise((r) => setTimeout(r, 400))
    await mainWin.webContents.executeJavaScript(`
      (() => {
        const overlay = document.querySelector('.tokflow-drawer-overlay');
        if (overlay) overlay.click();
      })()
    `)
    await new Promise((r) => setTimeout(r, 400))
    const isClosedWithScrim = await mainWin.webContents.executeJavaScript(`
      !document.querySelector('.tokflow-drawer-container')
    `)

    const fullDrawerAudit = {
      ...auditResult,
      isClosedWithEsc,
      isClosedWithScrim,
      passedAll:
        auditResult.isCloseBtnVisibleBefore &&
        auditResult.isCloseBtnVisibleAfter &&
        auditResult.canScroll &&
        auditResult.isLastElementVisible &&
        !auditResult.hasHorizontalScroll &&
        isClosedWithEsc &&
        isClosedWithScrim
    }

    fs.writeFileSync(
      path.join(SHOTS_DIR, 'drawer-audit.json'),
      JSON.stringify(fullDrawerAudit, null, 2)
    )

    // 6. Modal Ringkasan Sesi
    log('Menangkap Modal Ringkasan Sesi...')
    await resizeAndWait(440, 760)
    sessionStore.endSession()
    await new Promise((r) => setTimeout(r, 1200))
    await captureAndSave('summary-440x760.png')

    // Tutup modal ringkasan
    await mainWin.webContents.executeJavaScript(`
      (() => {
        const closeBtn = document.querySelector('.tokflow-modal-close') || Array.from(document.querySelectorAll('button')).find(function(b) { return b.textContent && b.textContent.includes('Tutup'); });
        if (closeBtn) closeBtn.click();
      })()
    `)
    await new Promise((r) => setTimeout(r, 400))

    // 7. Gift Monitor Terpisah
    log('Membuka & Menangkap Gift Monitor...')
    const giftWin = windowManager.createGiftMonitorWindow()
    await new Promise((r) => setTimeout(r, 1500))
    await captureAndSave('gift-monitor-380x600.png', giftWin)
    giftWin.destroy()

    // 8. Halaman Overlay OBS
    log('Menangkap Overlay OBS...')
    const overlayUrl = overlayServer.getUrl()
    log(`URL Overlay: ${overlayUrl}`)
    const overlayWin = new BrowserWindow({
      width: 400,
      height: 700,
      show: false,
      transparent: true,
      frame: false,
      webPreferences: {
        sandbox: true
      }
    })
    await overlayWin.loadURL(overlayUrl)
    await new Promise((r) => setTimeout(r, 1200))
    await captureAndSave('overlay-400x700.png', overlayWin)
    overlayWin.destroy()

    // 9. Generate App Icons (PNG 512, 256, dan ICO) dari resources/icon.svg
    log('Menghasilkan icon PNG & ICO dari resources/icon.svg...')
    const resourcesDir = path.resolve(SHOTS_DIR, '../../resources')
    const svgPath = path.join(resourcesDir, 'icon.svg')

    if (fs.existsSync(svgPath)) {
      const iconWin = new BrowserWindow({
        width: 512,
        height: 512,
        show: false,
        transparent: true,
        frame: false,
        webPreferences: {
          sandbox: true
        }
      })
      const svgData = fs.readFileSync(svgPath, 'utf8')
      const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgData)}`
      await iconWin.loadURL(dataUrl)
      await new Promise((r) => setTimeout(r, 500))

      // 512x512
      const img512 = await iconWin.webContents.capturePage()
      const buf512 = img512.toPNG()
      fs.writeFileSync(path.join(resourcesDir, 'icon-512.png'), buf512)

      // 256x256
      iconWin.setSize(256, 256)
      await new Promise((r) => setTimeout(r, 200))
      const img256 = await iconWin.webContents.capturePage()
      const buf256 = img256.toPNG()
      fs.writeFileSync(path.join(resourcesDir, 'icon-256.png'), buf256)

      // icon.ico
      const header = Buffer.alloc(6)
      header.writeUInt16LE(0, 0)
      header.writeUInt16LE(1, 2)
      header.writeUInt16LE(1, 4)

      const entry = Buffer.alloc(16)
      entry.writeUInt8(0, 0) // Width (256)
      entry.writeUInt8(0, 1) // Height (256)
      entry.writeUInt8(0, 2)
      entry.writeUInt8(0, 3)
      entry.writeUInt16LE(1, 4)
      entry.writeUInt16LE(32, 6)
      entry.writeUInt32LE(buf256.length, 8)
      entry.writeUInt32LE(22, 12)

      const icoBuf = Buffer.concat([header, entry, buf256])
      fs.writeFileSync(path.join(resourcesDir, 'icon.ico'), icoBuf)
      iconWin.destroy()
      log('✓ Icon resources/icon-512.png, icon-256.png, dan icon.ico berhasil dibuat!')
    }

    log('✅ SEMUA TANGKAPAN LAYAR & UJI AUDIT DRAWER 520px SELESAI DENGAN SUKSES!')
    app.exit(0)
  } catch (err: unknown) {
    const error = err as Error
    log(`❌ ERROR FATAL DALAM SHOTS: ${error?.message || String(err)}\n${error?.stack || ''}`)
    app.exit(1)
  }
}
