import { app, safeStorage } from 'electron'
import { existsSync, readFileSync, writeFileSync, copyFileSync, renameSync, mkdirSync } from 'fs'
import { join } from 'path'
import { AppSettings } from '../../shared/types'
import { DEFAULT_SETTINGS, validateAndMigrateSettings } from '../../core/settings-schema'

export function maskApiKey(key: string): string {
  if (!key || key.trim().length === 0) return ''
  const trimmed = key.trim()
  if (trimmed.length <= 6) return '******'
  const visibleStart = trimmed.slice(0, 3)
  const visibleEnd = trimmed.slice(-3)
  return `${visibleStart}****${visibleEnd}`
}

export class SettingsService {
  private readonly configPath: string
  private readonly backupPath: string
  private readonly tmpPath: string
  private cachedSettings: AppSettings
  private sessionMemoryApiKey = ''

  constructor(customDir?: string) {
    const dir = customDir || app.getPath('userData')
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    this.configPath = join(dir, 'settings.json')
    this.backupPath = join(dir, 'settings.json.bak')
    this.tmpPath = join(dir, 'settings.json.tmp')
    this.cachedSettings = this.load()
  }

  isSafeStorageAvailable(): boolean {
    return safeStorage.isEncryptionAvailable()
  }

  getSettings(masked = true): AppSettings {
    const settings = { ...this.cachedSettings }
    const effectiveKey = this.sessionMemoryApiKey || settings.connection.signApiKey

    return {
      ...settings,
      connection: {
        ...settings.connection,
        signApiKey: masked ? maskApiKey(effectiveKey) : effectiveKey
      }
    }
  }

  getRawApiKey(): string {
    return this.sessionMemoryApiKey || this.cachedSettings.connection.signApiKey
  }

  private load(): AppSettings {
    try {
      if (existsSync(this.configPath)) {
        const rawText = readFileSync(this.configPath, 'utf8')
        const parsed = JSON.parse(rawText)
        const validated = validateAndMigrateSettings(parsed)

        // Dekripsi signApiKey jika dienkripsi dengan safeStorage
        if (validated.connection.signApiKey && this.isSafeStorageAvailable()) {
          try {
            const buffer = Buffer.from(validated.connection.signApiKey, 'base64')
            validated.connection.signApiKey = safeStorage.decryptString(buffer)
          } catch {
            // Jika bukan base64 safeStorage, biarkan apa adanya atau reset
          }
        }

        return validated
      }
    } catch (err) {
      console.warn('Gagal membaca settings.json, mencoba memulihkan dari backup .bak:', err)
      if (existsSync(this.backupPath)) {
        try {
          const rawBak = readFileSync(this.backupPath, 'utf8')
          return validateAndMigrateSettings(JSON.parse(rawBak))
        } catch {
          // Backup juga rusak
        }
      }
    }

    return { ...DEFAULT_SETTINGS }
  }

  saveSettings(patch: Partial<AppSettings>): { success: boolean; error?: string } {
    try {
      const merged: AppSettings = {
        ...this.cachedSettings,
        ...patch,
        connection: {
          ...this.cachedSettings.connection,
          ...(patch.connection || {})
        },
        overlay: {
          ...this.cachedSettings.overlay,
          ...(patch.overlay || {})
        },
        display: {
          ...this.cachedSettings.display,
          ...(patch.display || {})
        },
        features: {
          ...this.cachedSettings.features,
          ...(patch.features || {})
        },
        moderation: {
          ...this.cachedSettings.moderation,
          ...(patch.moderation || {})
        },
        goals: {
          ...this.cachedSettings.goals,
          ...(patch.goals || {})
        },
        diagnostics: {
          ...this.cachedSettings.diagnostics,
          ...(patch.diagnostics || {})
        }
      }

      const validated = validateAndMigrateSettings(merged)

      // Penanganan khusus Sign API key
      const keyToSave = patch.connection?.signApiKey !== undefined
        ? patch.connection.signApiKey
        : (this.sessionMemoryApiKey || this.cachedSettings.connection.signApiKey)

      const diskSettings = JSON.parse(JSON.stringify(validated)) as AppSettings

      if (keyToSave && keyToSave.trim().length > 0 && !keyToSave.includes('****')) {
        if (this.isSafeStorageAvailable()) {
          const encrypted = safeStorage.encryptString(keyToSave)
          diskSettings.connection.signApiKey = encrypted.toString('base64')
          validated.connection.signApiKey = keyToSave
          this.sessionMemoryApiKey = ''
        } else {
          // safeStorage TIDAK tersedia: JANGAN simpan ke disk! Simpan di memori sesi saja
          diskSettings.connection.signApiKey = ''
          validated.connection.signApiKey = keyToSave
          this.sessionMemoryApiKey = keyToSave
        }
      } else if (patch.connection?.signApiKey === '') {
        diskSettings.connection.signApiKey = ''
        validated.connection.signApiKey = ''
        this.sessionMemoryApiKey = ''
      } else {
        // Pertahankan kunci terenkripsi yang ada di disk
        if (this.isSafeStorageAvailable() && validated.connection.signApiKey) {
          const encrypted = safeStorage.encryptString(validated.connection.signApiKey)
          diskSettings.connection.signApiKey = encrypted.toString('base64')
        }
      }

      this.atomicWrite(diskSettings)
      this.cachedSettings = validated
      return { success: true }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      return { success: false, error: message }
    }
  }

  private atomicWrite(settings: AppSettings): void {
    const jsonStr = JSON.stringify(settings, null, 2)

    // 1. Buat cadangan .bak dari berkas lama jika ada
    if (existsSync(this.configPath)) {
      try {
        copyFileSync(this.configPath, this.backupPath)
      } catch (err) {
        console.warn('Gagal membuat settings.json.bak:', err)
      }
    }

    // 2. Tulis ke berkas sementara .tmp
    writeFileSync(this.tmpPath, jsonStr, 'utf8')

    // 3. Rename atomik ke configPath
    renameSync(this.tmpPath, this.configPath)
  }
}
