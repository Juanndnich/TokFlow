# Catatan Keputusan Arsitektur (DECISIONS.md)

Dokumen ini mencatat keputusan penting, tanggal, alasan, dan alternatif yang dipertimbangkan selama pengembangan TokFlow.

---

## Format Entri

```markdown
### [YYYY-MM-DD] Judul Keputusan

- **Status:** Diterima / Ditolak / Diganti
- **Konteks:** Masalah atau kebutuhan yang dihadapi.
- **Keputusan:** Solusi yang dipilih.
- **Alasan:** Mengapa memilih solusi ini (keamanan, performa, reliabilitas).
- **Alternatif yang Dipertimbangkan:** Solusi lain dan alasan tidak dipilih.
- **Konsekuensi / Dampak:** Efek terhadap arsitektur atau pengembangan.
```

---

### [2026-11-08] Inisialisasi Keputusan Awal & Stack Teknologi

- **Status:** Diterima
- **Konteks:** Menentukan stack teknologi dan arsitektur awal sesuai mandat `AGENTS.md`.
- **Keputusan:**
  - Runtime & GUI: Electron + TypeScript `strict: true` + Preact (`@preact/preset-vite`) + `electron-vite`.
  - Testing: Vitest (unit tests di `src/core` dan proses utama), Playwright (UI testing & visual snapshots).
  - Styling: Pure CSS dengan design tokens tunggal di `src/renderer/styles/tokens.css` tanpa Tailwind atau CSS framework berat.
  - Ikon & Font: `lucide-preact` dengan impor terisolasi (tree-shakeable), font lokal `@fontsource-variable/inter` dan `@fontsource-variable/jetbrains-mono`.
- **Alasan:** Memenuhi kriteria ringan, hemat konsumsi RAM/CPU, aman, dan tanpa dependensi CDN runtime.
- **Alternatif yang Dipertimbangkan:**
  - Tailwind CSS: Ditolak karena overhead build/runtime dan instruksi eksplisit AGENTS.md untuk menggunakan design tokens murni.
  - React biasa: Ditolak demi Preact yang jauh lebih kecil footprint bundle dan memori.
- **Konsekuensi:** Performa tinggi, kontrol penuh terhadap CSS dan ukuran bundle minimal.

---

### [2026-11-08] Pemilihan Versi tiktok-live-connector

- **Status:** Diterima
- **Konteks:** Memilih versi stabil `tiktok-live-connector` sesuai hasil pengecekan registry npm.
- **Keputusan:** Mengunci versi persis `tiktok-live-connector`: `"2.5.0"` (tanpa `^` atau `~`).
- **Alasan:** Versi 2.5.0 merupakan `latest` tag resmi stabil yang terdaftar di npm registry saat ini, menyertakan pembaruan protokol Webcast TikTok terbaru dan penanganan koneksi WebSocket yang lebih andal.
- **Alternatif yang Dipertimbangkan:**
  - Versi 2.4.4: Versi sebelumnya, namun 2.5.0 memiliki perbaikan penting pada pemetaan payload room info.
  - Tag pre-release/alpha: Ditolak demi stabilitas produksi.
- **Konsekuensi:** Versi dikunci persis di `package.json` dan `package-lock.json`. Karena tiktok-live-connector berorientasi Node.js dengan dependensi seperti protobufjs dan websocket, paket ini akan di-externalize di electron-vite main build atau diimpor secara tepat agar tidak menyebabkan masalah bundling.

---

### [2026-11-08] Verifikasi Type Definition & Nama Field tiktok-live-connector v2.5.0

- **Status:** Diterima
- **Konteks:** Memastikan kesesuaian nama event dan field langsung dari file deklarasi TypeScript terpasang (`node_modules/tiktok-live-connector` & `node_modules/tiktok-live-proto/dist/node/v3.d.ts`), bukan dari asumsi/ingatan.
- **Hasil Verifikasi:**
  1. **Event Chat (`WebcastEvent.CHAT` / `'chat'`):** Payload `WebcastChatMessage`.
     - Isi pesan: `content: string`.
     - Pengirim: `user: User` (`userId: string`, `uniqueId: string`, `nickname: string`, `profilePicture: ImageModel`).
     - Metadata: `common: CommonMessageData` (`msgId: string`, `createTime: string`).
  2. **Event Gift (`WebcastEvent.GIFT` / `'gift'`):** Payload `WebcastGiftMessage`.
     - Kunci kelompok: `groupId: string` (string unik dari TikTok).
     - Hitungan streak: `repeatCount: number`, `comboCount: number`.
     - Penutup streak: `repeatEnd: number` (1 = selesai/end, 0 = ongoing).
     - Diamond/Koin: `gift.diamondCount: number`.
     - Pengirim: `user: User` (`userId`, `uniqueId`, `nickname`).
  3. **Event Viewer Room User (`WebcastEvent.ROOM_USER` / `'roomUser'`):** Payload `WebcastRoomUserSeqMessage`.
     - Penonton AKTIF: `total: string` (tag 3, dikonversi dengan `parseInt`).
     - Akumulasi pengunjung: `totalUser: string` (tag 7, **DILARANG** dipakai sebagai penonton aktif).
  4. **Event Member Join (`WebcastEvent.MEMBER` / `'member'`):** Payload `WebcastMemberMessage`.
     - Penonton Sumber B: `memberCount: number`.
  5. **Event Like (`WebcastEvent.LIKE` / `'like'`):** Payload `WebcastLikeMessage`.
     - Total room like: `total: string` (monotonik, Math.max).
     - Individual tap: `count: number` (hanya digunakan jika total room belum tersedia).
  6. **Event Social (`WebcastEvent.FOLLOW` / `WebcastEvent.SHARE`):** Payload `WebcastSocialMessage`.
- **Konsekuensi:** Semua transformer data di main process menggunakan pemetaan field terverifikasi di atas secara ketat.

---

### [2026-11-08] Verifikasi Visual Otomatis Menggunakan Native capturePage() di Sandbox Windows

- **Status:** Diterima
- **Konteks:** Eksekusi Playwright-Electron pada lingkungan sandbox Windows menghadapi kendala permission pada lock file Chromium dan port debugging remote.
- **Keputusan:** Mengimplementasikan runner visual suite langsung di dalam proses Electron menggunakan `win.webContents.capturePage()` dengan flag `--shots-mode`.
- **Alasan:** `capturePage()` adalah API resmi bawaan Electron yang 100% andal, bekerja sempurna di background/headless, menghasilkan PNG beresolusi piksel presisi tanpa ketergantungan driver eksternal, dan langsung menghasilkan 13 varian resolusi yang diwajibkan serta file audit `drawer-audit.json`.
- **Konsekuensi:** Eksekusi `npm run shots` berjalan sangat cepat, stabil di lingkungan Windows sandbox maupun CI.

---

### [2026-11-08] Mekanisme Pengukuran Performa Riil via app.getAppMetrics()

- **Status:** Diterima
- **Konteks:** Mandat kejujuran di `AGENTS.md` melarang klaim konsumsi RAM/CPU tanpa pengukuran riil dan metode yang dapat diulang.
- **Keputusan:** Menggunakan `app.getAppMetrics()` untuk mengumpulkan `workingSetSize` dan `percentCPUUsage` dari seluruh proses (Main, Renderer, GPU, Utility).
- **Alasan:** `app.getAppMetrics()` mencerminkan penggunaan memori riil Windows working set dari arsitektur multi-proses Electron secara menyeluruh, bukan sekadar heap memory Node.js.
- **Konsekuensi:** Hasil dilaporkan secara transparan apa adanya di `docs/PERFORMANCE.md` untuk 3 kondisi: Idle, Demo Laju Tinggi (20 msg/s), dan Gift Monitor terbuka.
