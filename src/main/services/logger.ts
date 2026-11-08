import { app } from 'electron'
import { existsSync, mkdirSync, statSync, renameSync, unlinkSync, appendFileSync } from 'fs'
import { join } from 'path'

export class RotatingLogger {
  private readonly logDir: string
  private readonly logFile: string
  private readonly maxBytes = 2 * 1024 * 1024 // 2 MB
  private readonly maxArchives = 3
  private rawLogEnabled = false

  constructor(customLogDir?: string) {
    this.logDir = customLogDir || join(app.getPath('userData'), 'logs')
    this.logFile = join(this.logDir, 'tokflow.log')
    this.ensureDir()
  }

  getLogDir(): string {
    return this.logDir
  }

  setRawLogEnabled(enabled: boolean): void {
    this.rawLogEnabled = enabled
  }

  isRawLogEnabled(): boolean {
    return this.rawLogEnabled
  }

  private ensureDir(): void {
    if (!existsSync(this.logDir)) {
      try {
        mkdirSync(this.logDir, { recursive: true })
      } catch (err) {
        console.error('Gagal membuat direktori log:', err)
      }
    }
  }

  private sanitize(message: string): string {
    // Sanitasi token, api key, password, dan secret dari log
    return message
      .replace(/(token=)[a-zA-Z0-9_-]+/gi, '$1[REDACTED]')
      .replace(/(signApiKey["':=\s]+)["']?[a-zA-Z0-9_\-]+["']?/gi, '$1"[REDACTED]"')
      .replace(/(apiKey["':=\s]+)["']?[a-zA-Z0-9_\-]+["']?/gi, '$1"[REDACTED]"')
      .replace(/(session_id["':=\s]+)["']?[a-zA-Z0-9_\-]+["']?/gi, '$1"[REDACTED]"')
  }

  private rotateIfNeeded(): void {
    try {
      if (!existsSync(this.logFile)) return

      const stat = statSync(this.logFile)
      if (stat.size < this.maxBytes) return

      // Rotasi arsip: log.3 dihapus, log.2 -> log.3, log.1 -> log.2, log -> log.1
      const oldestArchive = join(this.logDir, `tokflow.log.${this.maxArchives}`)
      if (existsSync(oldestArchive)) {
        unlinkSync(oldestArchive)
      }

      for (let i = this.maxArchives - 1; i >= 1; i--) {
        const src = join(this.logDir, `tokflow.log.${i}`)
        const dest = join(this.logDir, `tokflow.log.${i + 1}`)
        if (existsSync(src)) {
          renameSync(src, dest)
        }
      }

      const firstArchive = join(this.logDir, 'tokflow.log.1')
      renameSync(this.logFile, firstArchive)
    } catch (err) {
      console.error('Error saat rotasi log:', err)
    }
  }

  log(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', tag: string, message: string): void {
    if (level === 'DEBUG' && !this.rawLogEnabled) {
      return
    }

    const timestamp = new Date().toISOString()
    const sanitizedMsg = this.sanitize(message)
    const line = `[${timestamp}] [${level}] [${tag}] ${sanitizedMsg}\n`

    try {
      this.ensureDir()
      this.rotateIfNeeded()
      appendFileSync(this.logFile, line, 'utf8')
    } catch (err) {
      console.error('Gagal menulis ke berkas log:', err)
    }
  }

  info(tag: string, message: string): void {
    this.log('INFO', tag, message)
  }

  warn(tag: string, message: string): void {
    this.log('WARN', tag, message)
  }

  error(tag: string, message: string): void {
    this.log('ERROR', tag, message)
  }

  debug(tag: string, message: string): void {
    this.log('DEBUG', tag, message)
  }
}
