import { createServer, Server, IncomingMessage, ServerResponse } from 'http'
import { randomBytes, timingSafeEqual } from 'crypto'
import { readFileSync, existsSync } from 'fs'
import { resolve, join } from 'path'
import { app } from 'electron'
import { SessionStore } from '../../core/session-store'
import { SessionEvent } from '../../shared/types'
import { RotatingLogger } from './logger'

export class OverlayServer {
  private server: Server | null = null
  private activePort = 8899
  private token = ''
  private readonly sseClients = new Set<ServerResponse>()
  private readonly maxSseClients = 10
  private staticDir: string

  constructor(
    private sessionStore: SessionStore,
    private logger: RotatingLogger,
    initialToken?: string
  ) {
    this.token = initialToken || this.generateToken()
    // Path folder overlay statis dengan fallback multi-lokasi
    const candidates = [
      resolve(__dirname, '../overlay'),
      resolve(__dirname, '../../src/overlay'),
      join(app.getAppPath(), 'out/overlay'),
      join(app.getAppPath(), 'src/overlay'),
      resolve(process.cwd(), 'out/overlay'),
      resolve(process.cwd(), 'src/overlay')
    ]
    this.staticDir = candidates.find((d) => existsSync(join(d, 'index.html'))) || candidates[0]

    // Sambungkan SessionStore ke broadcaster SSE
    this.sessionStore.subscribe((event) => {
      this.broadcastEvent(event)
    })
  }

  generateToken(): string {
    this.token = randomBytes(16).toString('hex')
    return this.token
  }

  getToken(): string {
    return this.token
  }

  getPort(): number {
    return this.activePort
  }

  getActiveClientCount(): number {
    return this.sseClients.size
  }

  getUrl(): string {
    return `http://127.0.0.1:${this.activePort}/overlay?token=${this.token}`
  }

  private isTokenValid(candidateToken?: string): boolean {
    if (!candidateToken || candidateToken.length !== this.token.length) {
      return false
    }
    try {
      const a = Buffer.from(candidateToken, 'utf8')
      const b = Buffer.from(this.token, 'utf8')
      return timingSafeEqual(a, b)
    } catch {
      return false
    }
  }

  private isHostValid(req: IncomingMessage): boolean {
    const host = req.headers.host || ''
    const allowedHosts = [`127.0.0.1:${this.activePort}`, `localhost:${this.activePort}`]
    return allowedHosts.includes(host)
  }

  private isOriginValid(req: IncomingMessage): boolean {
    const origin = req.headers.origin
    if (!origin) return true // Permintaan GET dari browser source OBS tidak selalu membawa header Origin
    try {
      const parsed = new URL(origin)
      const allowed = ['127.0.0.1', 'localhost']
      return allowed.includes(parsed.hostname) && Number(parsed.port) === this.activePort
    } catch {
      return false
    }
  }

  async start(preferredPort = 8899): Promise<number> {
    for (let port = preferredPort; port <= 8909; port++) {
      try {
        await this.bindPort(port)
        this.activePort = port
        this.logger.info('OverlayServer', `Server overlay berjalan di 127.0.0.1:${port}`)
        return port
      } catch {
        this.logger.warn('OverlayServer', `Port ${port} sibuk, mencoba port berikutnya...`)
      }
    }

    throw new Error('Semua port overlay dari 8899 hingga 8909 sedang digunakan.')
  }

  private bindPort(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const srv = createServer((req, res) => this.handleRequest(req, res))

      srv.once('error', (err) => {
        reject(err)
      })

      // Bind HANYA ke 127.0.0.1 (Anti-eksposur jaringan lokal)
      srv.listen(port, '127.0.0.1', () => {
        this.server = srv
        resolve()
      })
    })
  }

  private handleRequest(req: IncomingMessage, res: ServerResponse): void {
    // 1. Validasi Host Header (Cegah DNS Rebinding)
    if (!this.isHostValid(req)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' })
      res.end('Forbidden: Invalid Host header')
      return
    }

    // 2. Validasi Origin Header (Tolak origin tidak dikenal)
    if (!this.isOriginValid(req)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' })
      res.end('Forbidden: Invalid Origin header')
      return
    }

    // 3. Parsing URL dan Token
    const parsedUrl = new URL(req.url || '/', `http://127.0.0.1:${this.activePort}`)
    const tokenQuery = parsedUrl.searchParams.get('token') || ''

    if (!this.isTokenValid(tokenQuery)) {
      res.writeHead(401, { 'Content-Type': 'text/plain' })
      res.end('Unauthorized: Missing or invalid token')
      return
    }

    const pathname = parsedUrl.pathname

    if (pathname === '/events') {
      this.handleSse(req, res)
      return
    }

    if (pathname === '/overlay' || pathname === '/overlay/index.html') {
      this.serveStaticFile('index.html', 'text/html; charset=utf-8', res)
      return
    }

    if (pathname === '/overlay/style.css') {
      this.serveStaticFile('style.css', 'text/css; charset=utf-8', res)
      return
    }

    if (pathname === '/overlay/overlay.js') {
      this.serveStaticFile('overlay.js', 'application/javascript; charset=utf-8', res)
      return
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not Found')
  }

  private serveStaticFile(filename: string, contentType: string, res: ServerResponse): void {
    // Daftar putih eksplisit untuk mencegah path traversal
    const allowedFiles = ['index.html', 'style.css', 'overlay.js']
    if (!allowedFiles.includes(filename)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' })
      res.end('Forbidden file access')
      return
    }

    const fullPath = join(this.staticDir, filename)
    if (existsSync(fullPath)) {
      try {
        const content = readFileSync(fullPath)
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          // CSP Ketat pada overlay HTML
          'Content-Security-Policy':
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' http://127.0.0.1:*;"
        })
        res.end(content)
      } catch {
        res.writeHead(500, { 'Content-Type': 'text/plain' })
        res.end('Internal Server Error')
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('Overlay asset not found')
    }
  }

  private handleSse(req: IncomingMessage, res: ServerResponse): void {
    if (this.sseClients.size >= this.maxSseClients) {
      res.writeHead(503, { 'Content-Type': 'text/plain' })
      res.end('Too Many SSE Connections')
      return
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    })

    this.sseClients.add(res)

    // Kirim snapshot awal saat client baru tersambung
    const snapshot = this.sessionStore.getSnapshot()
    res.write(`data: ${JSON.stringify({ type: 'init', snapshot })}\n\n`)

    req.on('close', () => {
      this.sseClients.delete(res)
    })
  }

  private broadcastEvent(event: SessionEvent): void {
    if (this.sseClients.size === 0) return

    const data = `data: ${JSON.stringify(event)}\n\n`
    for (const client of this.sseClients) {
      try {
        client.write(data)
      } catch {
        this.sseClients.delete(client)
      }
    }
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      for (const client of this.sseClients) {
        client.end()
      }
      this.sseClients.clear()

      if (this.server) {
        this.server.close(() => {
          this.server = null
          resolve()
        })
      } else {
        resolve()
      }
    })
  }
}
