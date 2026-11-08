import asar from '@electron/asar'
import fs from 'node:fs'
import path from 'node:path'

const asarPath = path.resolve('release/win-unpacked/resources/app.asar')
const stagingDir = path.resolve('release/win-unpacked/resources/app_staging')
const outDir = path.resolve('out')

async function syncApp() {
  console.log('📦 Menyingkronkan build terbaru ke release/win-unpacked...')
  if (!fs.existsSync(stagingDir)) {
    console.log('Mengekstrak asar ke staging...')
    asar.extractAll(asarPath, stagingDir)
  }

  // Timpa folder out di staging dengan out terbaru
  const stagingOut = path.join(stagingDir, 'out')
  console.log('Menyalin out terbaru ke staging...')
  fs.cpSync(outDir, stagingOut, { recursive: true, force: true })

  // Backup asar lama jika ada
  if (fs.existsSync(asarPath)) {
    fs.unlinkSync(asarPath)
  }

  // Pack staging menjadi app.asar baru
  console.log('Mengemas ulang app.asar...')
  await asar.createPackage(stagingDir, asarPath)
  console.log('✅ app.asar berhasil diperbarui dengan build terbaru!')
}

syncApp().catch((err) => {
  console.error('Gagal sync asar:', err)
  process.exit(1)
})
