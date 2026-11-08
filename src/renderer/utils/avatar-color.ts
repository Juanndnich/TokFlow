/**
 * Hash deterministik warna nama dan inisial avatar dari uniqueId.
 * Palet warna kontras tinggi yang ramah pembacaan pada tema gelap.
 */

const NAME_COLORS = [
  '#B6F23C', // Lime
  '#2DD4BF', // Cyan
  '#8B7CF6', // Purple
  '#F5B83D', // Amber
  '#EC4899', // Pink
  '#38BDF8', // Sky Blue
  '#A78BFA', // Violet
  '#34D399', // Emerald
  '#FB923C'  // Orange
]

export function getDeterministicColor(str: string): string {
  if (!str) return NAME_COLORS[0]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % NAME_COLORS.length
  return NAME_COLORS[index]
}

export function getInitials(name: string): string {
  if (!name) return '?'
  const clean = name.replace(/^@/, '').trim()
  if (!clean) return '?'
  const parts = clean.split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return clean.slice(0, 2).toUpperCase()
}
