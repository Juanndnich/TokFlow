import { app } from 'electron'
import { existsSync, readFileSync, writeFileSync, renameSync, mkdirSync } from 'fs'
import { join } from 'path'
import { SessionSummary } from '../../shared/types'

export class SessionHistoryService {
  private readonly filePath: string
  private readonly tmpPath: string
  private readonly maxSessions = 30
  private summaries: SessionSummary[] = []

  constructor(customDir?: string) {
    const dir = customDir || app.getPath('userData')
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    this.filePath = join(dir, 'history.json')
    this.tmpPath = join(dir, 'history.json.tmp')
    this.load()
  }

  private load(): void {
    if (existsSync(this.filePath)) {
      try {
        const raw = readFileSync(this.filePath, 'utf8')
        const data = JSON.parse(raw)
        if (Array.isArray(data)) {
          this.summaries = data.slice(0, this.maxSessions)
        }
      } catch (err) {
        console.error('Gagal membaca history.json:', err)
        this.summaries = []
      }
    }
  }

  saveSession(summary: SessionSummary): void {
    this.summaries.unshift(summary)
    if (this.summaries.length > this.maxSessions) {
      this.summaries = this.summaries.slice(0, this.maxSessions)
    }

    try {
      const json = JSON.stringify(this.summaries, null, 2)
      writeFileSync(this.tmpPath, json, 'utf8')
      renameSync(this.tmpPath, this.filePath)
    } catch (err) {
      console.error('Gagal menyimpan history.json:', err)
    }
  }

  getHistory(): SessionSummary[] {
    return [...this.summaries]
  }

  exportSummary(summary: SessionSummary, format: 'json' | 'csv'): string {
    if (format === 'json') {
      return JSON.stringify(summary, null, 2)
    }

    // CSV format
    const lines = [
      'id,username,startTime,endTime,durationSeconds,peakViewers,totalComments,totalCoins,totalLikes',
      `"${summary.id}","${summary.username}",${summary.startTime},${summary.endTime},${summary.durationSeconds},${summary.peakViewers},${summary.totalComments},${summary.totalCoins},${summary.totalLikes}`,
      '',
      'top_gifter_user_id,top_gifter_nickname,top_gifter_coins'
    ]

    for (const g of summary.topGifters) {
      lines.push(`"${g.userId}","${g.nickname.replace(/"/g, '""')}",${g.coins}`)
    }

    return lines.join('\n')
  }
}
