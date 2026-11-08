import { app, shell } from 'electron'
import { existsSync, mkdirSync, appendFileSync } from 'fs'
import { join } from 'path'
import { ViewerSourceStatus } from '../../shared/types'

export class ComparisonLogger {
  private readonly logDir: string
  private readonly logFile: string

  constructor(customLogDir?: string) {
    this.logDir = customLogDir || join(app.getPath('userData'), 'logs')
    this.logFile = join(this.logDir, 'tokflow-comparison.jsonl')
    this.ensureDir()
  }

  private ensureDir(): void {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true })
    }
  }

  logComparison(
    userViewers: number,
    userLikes: number,
    viewerStatus: ViewerSourceStatus,
    internalLikes: number
  ): void {
    this.ensureDir()
    const entry = {
      timestamp: new Date().toISOString(),
      tiktokInput: {
        viewers: Math.max(0, Math.floor(userViewers)),
        likes: Math.max(0, Math.floor(userLikes))
      },
      tokflowActual: {
        viewers: viewerStatus.currentViewer,
        activeSource: viewerStatus.activeSource,
        likes: internalLikes,
        sourceA: viewerStatus.sourceA,
        sourceB: viewerStatus.sourceB,
        sourceC: viewerStatus.sourceC
      }
    }

    try {
      appendFileSync(this.logFile, JSON.stringify(entry) + '\n', 'utf8')
    } catch (err) {
      console.error('Gagal menulis ke tokflow-comparison.jsonl:', err)
    }
  }

  async openLogFolder(): Promise<void> {
    this.ensureDir()
    await shell.openPath(this.logDir)
  }
}
