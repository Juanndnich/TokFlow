# Rencana Proyek TokFlow (PLAN.md)

Dokumen ini memuat tahapan (Fase 0 - 9) dan ceklis detail implementasi TokFlow sesuai aturan di `AGENTS.md`.

---

## Ringkasan Alur Kerja

- **Fase 0: Fondasi Repo**
  - [ ] Git init & konfigurasi repositori
  - [ ] Scaffold `electron-vite` + Preact (`@preact/preset-vite`) + TypeScript `strict: true`
  - [ ] Konfigurasi ESLint & Prettier
  - [ ] Konfigurasi Vitest untuk pengujian unit
  - [ ] Konfigurasi Playwright untuk pengujian UI / screenshot
  - [ ] Penentuan dan penguncian versi `tiktok-live-connector` (cek `npm view`)
  - [ ] Struktur direktori (`src/core`, `src/main`, `src/preload`, `src/shared`, `src/renderer`, `src/overlay`, `tests`, `scripts`, `docs`, `resources`, `.github`)
  - [ ] Berkas repositori: `package.json`, `.gitignore`, `.gitattributes`, `.editorconfig`, `.nvmrc`, `LICENSE` (MIT), `CHANGELOG.md`, `SECURITY.md`, `CONTRIBUTING.md`, `README.md`
  - [ ] CI/CD: `.github/workflows/ci.yml`, `.github/dependabot.yml`, templat isu & PR
  - [ ] Verifikasi impor `tiktok-live-connector` dalam build
  - [ ] Gerbang kualitas Fase 0 (typecheck, lint, test, build, audit)
  - [ ] Commit & Tag `fase-0`

- **Fase 1: Inti Logika Murni + Tes (`src/core`)**
  - [ ] `backoff.ts`: Exponential backoff + jitter (2s - 30s, jitter ±20%, max 8 percobaan)
  - [ ] `viewer-resolver.ts`: Prioritas sumber (A: room-user <=20s, C: info room <=30s, B: join memberCount), guard lonjakan (>3x dan selisih >500 ditahan 15s), integer >= 0, dilarang pakai `totalUser`
  - [ ] `like-tracker.ts`: Monotonik Math.max, utamakan total like room, tap hanya bila total tidak ada
  - [ ] `gift-aggregator.ts`: Dedupe `repeatEnd` vs `repeatCount`, delta koin (`diamondCount * max(1, repeat - prev)`), groupId fallback `userId_giftId_streakStartTime`, combo tracking Map, pembersihan berkala 15s, pemulihan kartu terpangkas
  - [ ] `session-store.ts`: Monotonic `seq`, snapshot + buffered delta, race condition handling, batas daftar (gift 200, chat 200), total koin akumulasi tidak terpotong saat pruning
  - [ ] `format.ts`: Format angka mono (bawah 10.000 titik pemisah 1.250; mulai 10.000 ringkas 15,2K), format durasi mm:ss / hh:mm:ss
  - [ ] `settings-schema.ts`: Skema pengaturan Zod/tipe ketat, versi skema, migrasi, validasi default
  - [ ] Tes unit komprehensif di `tests/core/`
  - [ ] Gerbang kualitas Fase 1
  - [ ] Commit & Tag `fase-1`

- **Fase 2: Main Process**
  - [ ] Window manager: Main window (min 360x520, awal 440x760) dengan title bar native Windows, frameless DILARANG
  - [ ] Single instance lock: fokus ke jendela aktif jika instance kedua dibuka
  - [ ] Pengaturan atomik: tulis ke `.tmp` lalu rename, cadangan `.bak`, integrasi `safeStorage` untuk Sign API key
  - [ ] Logger berputar: max 2MB x 3 arsip, sanitasi token/kunci, tanpa chat content kecuali debug aktif, tanpa telemetri
  - [ ] IPC bertipe ketat: validasi tipe, panjang, dan rentang di main process
  - [ ] Layanan TikTok: koneksi lifecycle, reconnect backoff, deteksi offline internet (ENOTFOUND/ECONNRESET dll), polling fallback default MATI
  - [ ] Integrasi `SessionStore` & `ViewerCountResolver` di main process
  - [ ] Mode Demo simulator: alur data sama persis melalui `SessionStore`
  - [ ] Diagnostik: `app.getAppMetrics` (total RAM semua proses, CPU), pesan/dtk, dedupe counter
  - [ ] Log pembanding JSONL: catat perbandingan angka penonton/like pengguna vs internal
  - [ ] Riwayat sesi: simpan hingga 30 ringkasan sesi terakhir secara atomik
  - [ ] Dukungan CLI argumen `--smoke-test`
  - [ ] Verifikasi nama event dan field TikTok dari type definition terpasang & catat di `docs/DECISIONS.md`
  - [ ] Gerbang kualitas Fase 2
  - [ ] Commit & Tag `fase-2`

- **Fase 3: Sistem Desain & Prasarana Tangkapan Layar**
  - [ ] `tokens.css`: Variabel CSS warna, tipografi, radius, shadow, transisi
  - [ ] Font lokal: `@fontsource-variable/inter` dan `@fontsource-variable/jetbrains-mono` dibundel tanpa CDN
  - [ ] Ikon: `lucide-preact` pohon-goyang (tree-shaking), TANPA emoji di seluruh UI
  - [ ] Komponen UI dasar: Button, IconButton, Input, Switch, Slider, Select, Tabs, Badge, StatusPill, Card, Tooltip, Toast, Drawer, Modal, Skeleton, EmptyState, Banner, StatCard
  - [ ] Rute pengujian `/dev/styleguide` (khusus development)
  - [ ] Skrip tangkapan layar `npm run shots` (menggunakan Playwright / capturePage)
  - [ ] Tangkapan layar awal, inspeksi visual, perbaikan cacat
  - [ ] Gerbang kualitas Fase 3
  - [ ] Commit & Tag `fase-3`

- **Fase 4: UI Jendela Utama**
  - [ ] Bar koneksi: input username (@ tetap), Connect/Disconnect (lime), Demo, Pengaturan, StatusPill
  - [ ] Strip statistik 4 kartu: Penonton (penanda basi >20s), Like, Koin, Durasi
  - [ ] Tab Chat | Gift (badge gift baru, tombol pop-out Gift)
  - [ ] Bilah sematan (pin) komentar (cyan)
  - [ ] Daftar chat: batching per frame (`requestAnimationFrame`), avatar bulat 28px/inisial fallback, warna nama dari hash unik, jam redup, Pin, Salin, auto-scroll cerdas dengan floating button "Ke pesan terbaru (N baru)", DOM max 200
  - [ ] Kartu gift: combo badge `xN`, koin kuning peringatan, animasi combo, DOM max 100
  - [ ] Bilah bawah: A-/A+ font size, Always on top, transparansi 30-100%, Hapus tampilan, Mode Mini
  - [ ] Mode Mini: chat + status kecil + tombol keluar (minimalis, nyaman hingga 300px)
  - [ ] Modal Ringkasan Sesi: podium Top 3 gifter (ikon non-emoji), ekspor JSON/CSV
  - [ ] Verifikasi visual multi-resolusi: 360x520, 440x760, 1000x700
  - [ ] Gerbang kualitas Fase 4
  - [ ] Commit & Tag `fase-4`

- **Fase 5: Drawer Pengaturan**
  - [ ] Drawer struktur: Header tetap (tombol Tutup 32px), Badan (`overflow-y: auto`, `min-height: 0`), Footer tetap
  - [ ] Bagian Koneksi: Sign API key tersamar + tombol tes, sakelar polling HTTP + peringatan
  - [ ] Bagian Overlay OBS: URL lengkap, Salin, Buka, port aktif, regenerasi token, kontrol tampilan overlay
  - [ ] Bagian Tampilan: Kepadatan chat (Nyaman/Padat), ukuran font
  - [ ] Bagian Fitur Plus: Toggle tiap fitur
  - [ ] Bagian Diagnostik: RAM total, CPU, pesan/dtk, dedupe counter, status koneksi, versi lib, port, tabel sumber penonton, Catat pembanding, buka folder log, sakelar log mentah
  - [ ] Bagian Tentang: Versi, lisensi, repo link (placeholder ditangani), disclaimer TikTok tidak resmi
  - [ ] Uji otomatis 520px height: tombol Tutup terlihat, scroll penuh sampai dasar, Esc/scrim tutup, tanpa scroll horizontal
  - [ ] Tangkapan layar atas & bawah drawer di 520px
  - [ ] Gerbang kualitas Fase 5
  - [ ] Commit & Tag `fase-5`

- **Fase 6: Gift Monitor**
  - [ ] Jendela terpisah untuk daftar gift & total koin
  - [ ] Protokol snapshot + buffered delta saat jendela dibuka
  - [ ] Sinkronisasi dua arah (Hapus & Reset tersinkronisasi dengan jendela utama)
  - [ ] Tombol Dock Back (tutup pop-out kembali ke jendela utama)
  - [ ] Pengujian skenario demo (buka saat ada gift, buka saat combo berjalan, tutup-buka)
  - [ ] Gerbang kualitas Fase 6
  - [ ] Commit & Tag `fase-6`

- **Fase 7: Overlay OBS**
  - [ ] Server HTTP lokal: bind 127.0.0.1 saja, port fallback 8899-8909
  - [ ] Keamanan: token 32 hex via `crypto.randomBytes`, perbandingan `timingSafeEqual`, validasi header `Host` & `Origin`, whitelist path file statis, batas koneksi SSE
  - [ ] Halaman statis overlay: latar transparan, animasi gift & chat, durasi auto-hilang, SSE auto-reconnect, reset saat sesi baru
  - [ ] Pengujian keamanan unit & visual overlay
  - [ ] Gerbang kualitas Fase 7
  - [ ] Commit & Tag `fase-7`

- **Fase 8: Fitur Plus**
  - [ ] Moderasi lokal: hide user, blocked words, highlighted words, anti-spam duplikasi
  - [ ] Event follow & share (baris khusus di chat); join default MATI
  - [ ] Goal bar: like / coin goal dengan progress bar di UI dan overlay
  - [ ] Hotkeys dalam aplikasi: pin, clear, switch tab, mini mode
  - [ ] Riwayat sesi UI: daftar 30 sesi lama + ekspor JSON/CSV
  - [ ] Cek pembaruan manual (GitHub Releases API opt-in, semver compare, sembunyikan jika repo placeholder)
  - [ ] Tes unit moderasi dan goal
  - [ ] Gerbang kualitas Fase 8
  - [ ] Commit & Tag `fase-8`

- **Fase 9: Rilis & Pengemasan Akhir**
  - [ ] Pengukuran performa: RAM total & CPU (idle, demo high rate 20 msg/s selama 2 menit, gift monitor terbuka)
  - [ ] Verifikasi keamanan rantai pasok & kode
  - [ ] Pembuatan aset ikon: SVG, PNG 256/512, ICO
  - [ ] Alur rilis GitHub Actions: `.github/workflows/release.yml`
  - [ ] Berkas `THIRD_PARTY_LICENSES.md` & `SHA256SUMS.txt`
  - [ ] Paket Windows: `npm run dist` menghasilkan installer NSIS & executable portable
  - [ ] Smoke test terhadap `release/win-unpacked`
  - [ ] Dokumentasi lengkap `README.md` (Indonesia) & `CHANGELOG.md`
  - [ ] Tag `v0.1.0` secara lokal
  - [ ] Laporan Akhir komprehensif
