import fs from 'node:fs'
import path from 'node:path'

const srcOverlay = path.resolve('src/overlay')
const outOverlay = path.resolve('out/overlay')

if (fs.existsSync(srcOverlay)) {
  fs.mkdirSync(outOverlay, { recursive: true })
  fs.cpSync(srcOverlay, outOverlay, { recursive: true })
  console.log('✓ src/overlay berhasil disalin ke out/overlay')
}
