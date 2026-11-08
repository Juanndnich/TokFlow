import { execSync } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'

const SHOTS_DIR = path.resolve('docs/shots')
const USER_DATA = path.resolve('.userData')

if (!fs.existsSync(SHOTS_DIR)) {
  fs.mkdirSync(SHOTS_DIR, { recursive: true })
}
if (!fs.existsSync(USER_DATA)) {
  fs.mkdirSync(USER_DATA, { recursive: true })
}

function runTokFlow() {
  console.log('Menjalankan TokFlow binary dalam shots mode via PowerShell...')
  execSync('powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run-shots.ps1', {
    stdio: 'inherit'
  })
}

async function main() {
  try {
    console.log('🔄 1/3 Membangun aplikasi...')
    execSync('npm run build', { stdio: 'inherit' })

    console.log('📦 2/3 Menyingkronkan app.asar...')
    execSync('node scripts/sync-app.mjs', { stdio: 'inherit' })

    console.log('📸 3/3 Menjalankan suite tangkapan layar otomatis TokFlow...')
    runTokFlow()

    console.log('🎉 Sukses! Semua tangkapan layar tersedia di docs/shots/')
  } catch (err) {
    console.error('❌ Gagal dalam proses shots:', err.message)
    process.exit(1)
  }
}

main()
