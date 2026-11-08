/**
 * Format angka dan durasi untuk antarmuka TokFlow.
 * Aturan:
 * - Di bawah 10.000: tampil penuh dengan pemisah titik (misal 1.250, 9.999).
 * - Mulai 10.000: ringkas (misal 10,0K, 15,2K, 1,2M).
 */

export function formatNumberCompact(num: number): string {
  if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) {
    return '0'
  }

  const val = Math.max(0, Math.floor(num))

  if (val < 10000) {
    // Format ribuan dengan titik (ID locale)
    return val.toLocaleString('id-ID')
  }

  if (val < 1000000) {
    const thousands = val / 1000
    // Ambil 1 desimal jika bukan angka bulat, ganti titik desimal dengan koma (ID)
    const formatted = thousands.toFixed(1).replace('.', ',')
    return `${formatted}K`
  }

  const millions = val / 1000000
  const formatted = millions.toFixed(1).replace('.', ',')
  return `${formatted}M`
}

export function formatNumberFull(num: number): string {
  if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) {
    return '0'
  }
  return Math.max(0, Math.floor(num)).toLocaleString('id-ID')
}

export function formatDuration(seconds: number): string {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
    return '00:00'
  }

  const totalSec = Math.floor(seconds)
  const hrs = Math.floor(totalSec / 3600)
  const mins = Math.floor((totalSec % 3600) / 60)
  const secs = totalSec % 60

  const pad = (n: number) => n.toString().padStart(2, '0')

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`
  }
  return `${pad(mins)}:${pad(secs)}`
}

export function formatTimeHHMM(timestamp: number): string {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const hrs = date.getHours().toString().padStart(2, '0')
  const mins = date.getMinutes().toString().padStart(2, '0')
  return `${hrs}:${mins}`
}
