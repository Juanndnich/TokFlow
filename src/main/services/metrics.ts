import { app } from 'electron'
import { AppMetrics, ConnectionStatus } from '../../shared/types'

export class MetricsCollector {
  private messageCount = 0
  private lastCountTime = Date.now()
  private currentMsgPerSec = 0
  private droppedEvents = 0
  private activePort = 8899
  private connectionStatus: ConnectionStatus = 'disconnected'
  private readonly libVersion = '2.5.0'

  constructor() {
    // Hitung pesan per detik setiap detik
    setInterval(() => {
      const now = Date.now()
      const deltaSec = (now - this.lastCountTime) / 1000
      if (deltaSec > 0) {
        this.currentMsgPerSec = Math.round(this.messageCount / deltaSec)
      }
      this.messageCount = 0
      this.lastCountTime = now
    }, 1000)
  }

  recordMessage(): void {
    this.messageCount++
  }

  recordDroppedEvent(): void {
    this.droppedEvents++
  }

  setActivePort(port: number): void {
    this.activePort = port
  }

  setConnectionStatus(status: ConnectionStatus): void {
    this.connectionStatus = status
  }

  getMetrics(): AppMetrics {
    let totalMemoryKB = 0
    let totalCpuPercent = 0

    try {
      const metrics = app.getAppMetrics()
      for (const m of metrics) {
        totalMemoryKB += m.memory.workingSetSize || 0
        totalCpuPercent += m.cpu.percentCPUUsage || 0
      }
    } catch (err) {
      console.warn('Gagal membaca app.getAppMetrics():', err)
    }

    const totalRamMB = Math.round((totalMemoryKB / 1024) * 10) / 10

    return {
      totalRamMB,
      cpuPercent: Math.round(totalCpuPercent * 10) / 10,
      messagesPerSecond: this.currentMsgPerSec,
      droppedEventsCount: this.droppedEvents,
      activePort: this.activePort,
      connectionStatus: this.connectionStatus,
      libraryVersion: this.libVersion
    }
  }
}
