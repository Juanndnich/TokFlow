import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const svgPath = path.resolve('resources/icon.svg')
const png256 = path.resolve('resources/icon-256.png')
const png512 = path.resolve('resources/icon-512.png')
const iconIco = path.resolve('resources/icon.ico')

// Helper membuat format ICO Windows dengan PNG 256x256 embedded
function createIcoFromPng(pngBuffer) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // Reserved
  header.writeUInt16LE(1, 2) // Type: 1 = ICO
  header.writeUInt16LE(1, 4) // Count: 1 image

  const directoryEntry = Buffer.alloc(16)
  directoryEntry.writeUInt8(0, 0) // Width (0 means 256)
  directoryEntry.writeUInt8(0, 1) // Height (0 means 256)
  directoryEntry.writeUInt8(0, 2) // Color count (0 = no palette)
  directoryEntry.writeUInt8(0, 3) // Reserved
  directoryEntry.writeUInt16LE(1, 4) // Color planes
  directoryEntry.writeUInt16LE(32, 6) // Bits per pixel
  directoryEntry.writeUInt32LE(pngBuffer.length, 8) // Size of image data
  directoryEntry.writeUInt32LE(22, 12) // Offset of image data (6 header + 16 entry)

  return Buffer.concat([header, directoryEntry, pngBuffer])
}

async function generate() {
  console.log('🎨 Menghasilkan icon PNG & ICO dari SVG...')
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-gpu'] })
  const page = await browser.newPage()

  const svgContent = fs.readFileSync(svgPath, 'utf8')
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <body style="margin: 0; padding: 0; background: transparent; overflow: hidden;">
        ${svgContent}
      </body>
    </html>
  `)

  // Render 512x512
  await page.setViewportSize({ width: 512, height: 512 })
  const buf512 = await page.screenshot({ omitBackground: true })
  fs.writeFileSync(png512, buf512)
  console.log('✓ icon-512.png dihasilkan')

  // Render 256x256
  await page.setViewportSize({ width: 256, height: 256 })
  const buf256 = await page.screenshot({ omitBackground: true })
  fs.writeFileSync(png256, buf256)
  console.log('✓ icon-256.png dihasilkan')

  // Buat icon.ico
  const icoBuf = createIcoFromPng(buf256)
  fs.writeFileSync(iconIco, icoBuf)
  console.log('✓ icon.ico dihasilkan')

  await browser.close()
  console.log('🎉 Semua aset ikon berhasil dibuat!')
}

generate().catch((err) => {
  console.error('Gagal generate icons:', err)
  process.exit(1)
})
