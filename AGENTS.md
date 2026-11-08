# AGENTS.md - TokFlow

Dokumen ini adalah aturan permanen proyek. BACA SELURUHNYA di awal setiap sesi, lalu baca `docs/PROGRESS.md`. Bila ada pertentangan antara prompt sesi dan dokumen ini, ikuti dokumen ini dan catat pertentangannya di `docs/DECISIONS.md`.

Bila pengguna mengetik "Lanjutkan": baca AGENTS.md dan docs/PROGRESS.md, laporkan satu paragraf kita ada di fase berapa, lalu teruskan dari fase terakhir yang belum lulus gerbang kualitas.

---

## 1. Misi

TokFlow adalah aplikasi desktop Windows yang RINGAN, AMAN, dan RAPI untuk streamer TikTok Live, terutama yang memakai PC berperforma rendah. Fungsinya: menampilkan chat, gift, jumlah penonton, dan jumlah like secara realtime, dengan overlay untuk OBS Studio.

Prinsip, berurutan dari yang terpenting:

1. Dapat dipercaya: angka dan perilaku harus benar, dan batasnya diakui jujur.
2. Aman: data pengguna dan jaringan lokal tidak boleh terekspos.
3. Ringan: hemat RAM, CPU, dan baterai.
4. Rapi: tampilan konsisten, jelas, nyaman dipakai berjam-jam.
5. Siap dipakai: repo bisa langsung di-push ke GitHub dan menghasilkan `.exe` otomatis.

## 2. Aturan kerja

1. Bekerja otonom per fase sesuai prompt sesi. Ambil keputusan sendiri, catat di `docs/DECISIONS.md` (tanggal, keputusan, alasan, alternatif). Berhenti hanya bila benar-benar buntu dan jelaskan penyebabnya.
2. Git: `git init` di awal. Commit kecil dan sering dengan pesan jelas (format `tipe: ringkasan`, mis. `feat:`, `fix:`, `test:`, `docs:`, `chore:`). Di akhir tiap fase buat tag `fase-N`. Jangan menulis ulang riwayat. JANGAN push ke remote apa pun; pengguna yang akan push.
3. Perbarui `docs/PROGRESS.md` di akhir tiap fase: fase selesai, hasil cek, masalah terbuka, langkah berikutnya.
4. Jangan menambah fitur di luar daftar. Jangan menambah dependensi tanpa mencatat alasan, ukuran, dan lisensinya di DECISIONS.md. Utamakan MIT/Apache-2.0/BSD/ISC/OFL. Laporkan bila ada GPL/LGPL/AGPL atau lisensi tidak jelas. Semua versi dikunci lewat `package-lock.json`.
5. KEJUJURAN (wajib):
   - Dilarang mengklaim angka (RAM, CPU, FPS, akurasi) tanpa mengukur dan menunjukkan cara mengukurnya.
   - Dilarang kata mutlak seperti "100%", "zero-drop", "tanpa celah" di kode, README, atau laporan.
   - Dilarang menyatakan UI "selesai" hanya karena kompilasi lolos; harus diverifikasi lewat tangkapan layar (bagian 10).
   - Dilarang menyatakan sesuatu "teruji" bila tes tidak benar-benar dijalankan. Bila suatu hal tidak bisa kamu verifikasi di lingkunganmu (mis. live TikTok nyata, GPU tertentu), katakan terus terang dan berikan langkah verifikasi untuk pengguna.
6. Bila ada kegagalan, cari akar masalahnya; jangan menambal gejala, jangan menonaktifkan tes agar lulus, jangan menyembunyikan error.
7. Nama event dan field dari library TikTok harus dibaca dari type definition dan README paket yang TERPASANG, bukan dari ingatan.
8. Bahasa: kode dan komentar teknis boleh Inggris; semua teks UI, README, dan dokumen untuk pengguna berbahasa Indonesia yang ramah. Semua teks UI dikumpulkan di satu berkas `strings` (tidak tersebar).

## 3. Stack (tetap, jangan diganti tanpa izin tertulis pengguna)

- Electron (versi stabil terbaru saat dibuat) + TypeScript `strict: true`.
- Build: `electron-vite`. UI: Preact (`@preact/preset-vite`). Gaya: CSS biasa dengan design token (tanpa Tailwind, tanpa library komponen berat).
- Tes: `vitest`. Tangkapan layar/UI test: Playwright (devDependency, mode Electron). Lint/format: ESLint + Prettier.
- Paket Windows: `electron-builder` (target NSIS installer dan portable).
- Library TikTok: `tiktok-live-connector`. Cek `npm view tiktok-live-connector versions dist-tags`, pasang versi stabil terbaru yang terbukti berjalan, KUNCI persis (tanpa `^`/`~`), catat alasan di DECISIONS.md. Jika paket hanya ESM atau punya masalah bundling, gunakan `import()` dinamis atau konfigurasi externalize, dan WAJIB buktikan bekerja di build terpaket (bukan hanya mode dev).
- Ikon UI: `lucide-preact`, impor per-ikon saja (tree-shaking). DILARANG emoji di seluruh UI.
- Font: paket `@fontsource-variable/inter` dan `@fontsource-variable/jetbrains-mono` (woff2 dibundel lokal, tanpa CDN). Catat lisensi OFL di berkas lisensi pihak ketiga.
- Title bar: pakai title bar BAWAAN Windows. DILARANG frameless/custom title bar.
- Node untuk CI: 20 LTS atau 22 LTS (samakan dengan `engines` di package.json).

## 4. Arsitektur

- Proses `main` memegang SEMUA logika bisnis: koneksi TikTok, `SessionStore`, `ViewerCountResolver`, server overlay, pengaturan, log, Demo simulator. Renderer TIDAK menyentuh jaringan TikTok dan tidak memegang logika bisnis; ia hanya menampilkan state dari main.
- `src/core/` berisi logika MURNI tanpa import Electron/Node-spesifik, 100% bisa dites unit: `backoff`, `viewer-resolver`, `like-tracker`, `gift-aggregator`, `session-store`, `format`, `settings-schema`, `moderation` (Fase 8).
- IPC bertipe kuat: daftar saluran terpusat dalam satu berkas tipe bersama; main memvalidasi tipe, panjang, dan rentang SEMUA argumen; preload hanya mengekspos API minimal lewat `contextBridge`. `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`.
- Satu sumber kebenaran: `SessionStore` di main. Setiap mutasi menaikkan `seq` monotonik. Protokol jendela baru (utama maupun Gift Monitor): (1) subscribe `session:event` dan tampung ke buffer, (2) minta `session:getSnapshot`, (3) terapkan snapshot, (4) terapkan event buffer yang `seq` > `snapshot.seq`, buang sisanya. Total koin disimpan sebagai akumulasi (bukan dihitung ulang dari daftar yang dipangkas). Jendela yang dibuka belakangan HARUS langsung terisi lengkap dan identik.
- Demo simulator memakai jalur data yang SAMA dengan data asli (masuk lewat SessionStore), sehingga menguji seluruh UI.
- Satu bundel renderer, beberapa rute: jendela utama dan Gift Monitor. Overlay OBS adalah halaman statis terpisah yang dilayani server lokal.

## 5. Logika inti (wajib benar)

### 5.1 Koneksi

- Reconnect WebSocket: exponential backoff + jitter (mulai 2 dtk, maks 30 dtk, jitter plus-minus 20%), maksimal 8 percobaan, lalu berhenti dengan status jelas dan tombol "Coba lagi".
- Deteksi tanpa internet (ENOTFOUND, ECONNRESET, ETIMEDOUT, fetch failed, dan sejenisnya): status "Tidak ada internet", hentikan loop reconnect, cek pemulihan hemat tiap 8 detik, sambung otomatis saat pulih.
- Status yang berbeda dan jelas: Terputus, Menyambung, Terhubung, Offline (akun tidak sedang live), Tidak ada internet, Error (dengan penyebab dalam bahasa ramah).
- Polling HTTP fallback: DEFAULT MATI, opsional di Pengaturan dengan peringatan risiko blokir IP. Bila aktif: interval minimal 1000 ms, backoff saat 429/error, berhenti otomatis setelah 5 kegagalan beruntun. DILARANG polling lebih cepat dari 1x per detik dalam kondisi apa pun (juga untuk fetch info room). Jangan reset cursor saat berpindah mode; dedupe berdasarkan msgId.
- Sign API key (opsional): simpan dengan Electron `safeStorage`. Bila `safeStorage` tidak tersedia, JANGAN simpan ke disk (simpan di memori sesi itu dan beri tahu pengguna). Tidak pernah masuk log, git, atau UI selain tersamar.

### 5.2 Jumlah penonton

- Pada event room-user (`WebcastRoomUserSeqMessage`): field `total` (tag 3) = penonton AKTIF saat ini; `totalUser` (tag 7) = AKUMULATIF pengunjung. DILARANG memakai field akumulatif sebagai jumlah penonton. Verifikasi nama field sebenarnya dari type definition yang terpasang.
- `ViewerCountResolver` dengan tiga sumber: (A) viewer saat ini dari room-user, (B) `memberCount` dari event join, (C) `user_count` dari fetch info room (poll tiap >= 10 dtk, hanya saat terhubung, backoff 15/30/60 dtk saat error).
- Prioritas: A bila segar (<= 20 dtk); jika tidak, C bila segar (<= 30 dtk); jika tidak, B.
- Validasi bilangan bulat >= 0. Guard lonjakan: bila nilai baru > 3x nilai sebelumnya DAN selisih > 500, tahan nilai lama sampai ada pembacaan kedua yang mengonfirmasi dalam 15 dtk.
- Diagnostik: tabel "Sumber Penonton & Like" (nilai terakhir, umur data, sumber aktif) dan fitur "Catat pembanding": pengguna mengetik angka penonton/like dari aplikasi TikTok, aplikasi menulis satu baris JSONL (waktu, angka TikTok, nilai tiap sumber, sumber aktif) ke `logs/tokflow-comparison.jsonl`; tersedia tombol buka folder log.
- UI memberi penanda halus bila nilai penonton belum diperbarui > 20 dtk. Jangan mengklaim akurasi mutlak: angka TikTok sendiri bisa tertunda dan dibulatkan.

### 5.3 Like

- Utamakan total like room; jangan jumlahkan ganda antara total dan jumlah tap. Jumlah tap hanya dipakai bila total room tidak tersedia. Total bersifat monotonik dalam satu sesi (`Math.max`).

### 5.4 Gift

- `groupId`: pakai dari TikTok; bila kosong, fallback stabil `userId_giftId_streakStartTime` (toleransi streak 6 dtk). DILARANG memakai `comboCount` dalam kunci.
- Dedupe berdasarkan jenis event: kunci `gift:${msgId}:${repeatEnd ? 'end' : repeatCount}` agar event penutup streak tidak terbuang.
- Koin dihitung dari DELTA: `diamondCount * max(1, repeatCount - prevRepeat)` per streak. Gift non-streak dihitung sekali. Verifikasi aturan streakable (giftType) dari paket terpasang dan catat di DECISIONS.md.
- State combo di `Map` data (bukan DOM); streak kedaluwarsa dibersihkan berkala (tiap 15 dtk); kartu yang terpangkas dari tampilan dipulihkan dari data tanpa menggandakan koin.
- Satu kartu per streak; badge `xN` bertambah dengan animasi kecil.

### 5.5 Sesi

- `SessionStore` menyimpan: daftar gift (maks 200), combo aktif, total koin, gifter untuk Top 3, jumlah komentar, puncak penonton, durasi, pesan terpasang (pin).
- Saat sesi berakhir/disconnect: tampilkan Ringkasan Sesi (durasi, puncak penonton, total komentar, total koin, Top 3 gifter, ekspor JSON/CSV), lalu reset bersih semua jendela (chat, gift, koin, pin, overlay).
- Riwayat sesi: simpan ringkasan maksimal 30 sesi terakhir secara atomik di berkas lokal.

### 5.6 Fitur Plus (Fase 8; hanya dikerjakan bila semua gerbang fase sebelumnya lulus; tiap fitur dapat dimatikan di Pengaturan)

- Moderasi lokal: sembunyikan pengguna, daftar kata disembunyikan/disorot, anti-spam pesan duplikat beruntun (ambang dapat diatur). Hanya memengaruhi tampilan lokal.
- Event tambahan: follow dan share sebagai baris khusus; join DEFAULT MATI (terlalu ramai).
- Goal bar: target like atau koin dengan progres, tampil di aplikasi dan di overlay.
- Hotkey dalam aplikasi: pin, hapus tampilan, ganti tab, mode mini (daftar tombol ditampilkan di Pengaturan).
- Riwayat sesi: daftar sesi lama dengan ekspor.
- Cek pembaruan: DEFAULT MATI (opt-in). Tombol manual "Cek pembaruan" memanggil `https://api.github.com/repos/<owner>/<repo>/releases/latest`, membandingkan semver, lalu menampilkan banner dengan tautan halaman rilis. TIDAK mengunduh atau memasang otomatis. Slug repo dibaca dari `package.json` (`repository`); bila masih placeholder, fitur disembunyikan.

## 6. Keamanan

- Server overlay: bind HANYA ke `127.0.0.1`; coba port 8899 sampai 8909; laporkan port aktual atau kegagalan ke UI. TANPA CORS wildcard. Token acak 32 heks (dibuat dengan `crypto.randomBytes`) per instalasi, dapat di-regenerate, wajib di URL untuk `/overlay` dan `/events`, dibandingkan dengan `timingSafeEqual`. Validasi header `Host` (hanya `127.0.0.1`/`localhost` dengan port yang benar) untuk mencegah DNS rebinding; tolak `Origin` tak dikenal. Hanya layani berkas statis dari daftar putih eksplisit (cegah path traversal). Batasi jumlah koneksi SSE dan ukuran buffer.
- CSP ketat di SEMUA HTML: tanpa inline script, tanpa `eval`. `default-src 'self'`; `img-src 'self' data: https:` (foto profil CDN TikTok); `font-src 'self'`; `style-src 'self'` (hindari inline style bila bisa; bila perlu gunakan nonce/hash dan catat); `connect-src` seminimal mungkin. Gambar yang gagal dimuat jatuh ke avatar inisial berwarna.
- Electron: blokir `will-navigate`; `setWindowOpenHandler` menolak semua; tolak semua permission request (`setPermissionRequestHandler` dan `setPermissionCheckHandler`); `shell.openExternal` hanya untuk URL https pada daftar putih eksplisit (github.com, tiktok.com, eulerstream.com); tidak memuat konten remote ke jendela; DevTools dinonaktifkan pada build produksi.
- Data dinamis (nama, komentar, gift) TIDAK PERNAH lewat `innerHTML`/`dangerouslySetInnerHTML`. URL gambar hanya skema `https:` atau `data:image/`. Batasi panjang teks yang ditampilkan.
- Pengaturan: tulis atomik (`.tmp` lalu rename), cadangan `.bak`, validasi skema dan nilai default saat korup, simpan versi skema dengan migrasi.
- Log: berkas berputar (2 MB x 3 arsip), sanitasi token/key, tidak mencatat isi chat kecuali mode debug dinyalakan eksplisit oleh pengguna (dan beri tahu di UI saat aktif). TANPA telemetri apa pun.
- Single instance lock: instance kedua memfokuskan jendela yang ada.
- Rantai pasok: `npm audit --omit=dev` tanpa temuan kritis/tinggi (perbaiki atau jelaskan); tanpa skrip `postinstall` yang tidak dikenal; GitHub Actions dipin ke versi mayor yang stabil dan memakai `permissions` minimal; rilis menyertakan berkas checksum SHA-256.

## 7. Sistem desain

Token CSS tunggal di `src/renderer/styles/tokens.css`, dipakai semua jendela dan overlay.

- Warna: latar `#0B0D0A`; panel `#12160F`; panel terangkat `#1A2017`; garis `#252D21`; lime utama `#B6F23C` (teks di atas lime `#0B0D0A`); aksen `#8B7CF6` dan `#2DD4BF`; bahaya `#F43F5E`; peringatan `#F5B83D`; teks `#E8EDE4`; teks redup `#8A9585`. Kontras minimal WCAG AA (periksa dan catat hasilnya).
- Tipografi: Inter untuk UI (skala 11/12/13/14/16/20/28 px); angka dan timer memakai JetBrains Mono dengan `font-variant-numeric: tabular-nums`.
- Grid 8 px; radius 6/10/14; bayangan halus; animasi 120-200 ms; hormati `prefers-reduced-motion`.
- Scrollbar tipis bertema; seleksi teks lime redup; cincin fokus lime jelas.
- Komponen dasar (dibuat sekali, dipakai di mana-mana): Button (primary/secondary/ghost/danger, ukuran, loading, disabled), IconButton, Input, Switch, Slider, Select, Tabs, Badge, StatusPill, Card, Tooltip, Toast, Drawer, Modal, Skeleton, EmptyState, Banner, StatCard. Setiap komponen punya state: hover, fokus, aktif, disabled, loading, error.
- Halaman `/dev/styleguide` (hanya mode dev) menampilkan semua token dan komponen beserta state-nya.

## 8. Layout dan fitur UI

### 8.1 Aturan layout anti-bug (wajib)

- `html, body, #root { height: 100%; margin: 0; overflow: hidden; }`. Aplikasi adalah kolom flex setinggi jendela. HANYA area yang dirancang yang boleh scroll (daftar chat, daftar gift, badan drawer, badan modal). Setiap anak flex yang berisi area scroll WAJIB `min-height: 0`.
- Drawer/Modal terdiri dari tiga bagian: header (judul + tombol Tutup; TIDAK ikut scroll, selalu terlihat), badan (`flex: 1; min-height: 0; overflow-y: auto`), footer opsional (tetap). Tombol Tutup (ikon X, area sentuh 32 px) SELALU terlihat. Esc menutup; klik scrim menutup; fokus terkurung (focus trap) dan dikembalikan saat ditutup. Lebar drawer `min(420px, 100%)`.
- Jendela utama minimum 360x520, ukuran awal 440x760. Pada ukuran minimum tidak boleh ada konten terpotong, tombol hilang, scroll ganda, atau scroll horizontal.

### 8.2 Jendela utama (atas ke bawah)

1. Bar koneksi: input username (awalan "@" sebagai teks tetap), tombol Connect/Disconnect (lime), tombol Demo, tombol Pengaturan. StatusPill bertitik warna + teks (abu terputus, kuning berdenyut menyambung, hijau terhubung, merah error, biru offline, ungu "Tidak ada internet"). Enter = Connect. Simpan username terakhir.
2. Strip statistik 4 kartu: Penonton, Like, Koin, Durasi. Angka mono dengan transisi halus; di bawah 10.000 tampil penuh dengan pemisah titik (1.250); mulai 10.000 ringkas (15,2K) dengan tooltip angka lengkap. Tetap satu baris dan terbaca pada lebar sempit. Penanda "belum diperbarui" untuk penonton basi.
3. Tab Chat | Gift (badge jumlah gift baru) + tombol Pop-out Gift; navigasi keyboard (panah kiri/kanan).
4. Bilah sematan komentar (aksen cyan): ciutkan/lepas.
5. Daftar chat: baris kompak, avatar bulat 28 px (fallback inisial berwarna), warna nama dari palet tetap (hash stabil dari uniqueId), jam kecil redup, teks komentar dengan pembungkus baris rapi. Aksi saat hover/fokus: Pin, Salin. Kepadatan Nyaman/Padat. Auto-scroll berhenti saat pengguna scroll ke atas dan muncul tombol melayang "Ke pesan terbaru (N baru)". DOM dibatasi 200 pesan.
6. Kartu gift: ikon/gambar gift, pengirim, nama gift, badge `xN`, koin (warna peringatan), animasi kecil saat combo naik. DOM dibatasi 100 kartu; total koin di header tab konsisten dengan Gift Monitor.
7. Bilah bawah: A-/A+ (11 sampai 18 px, tersimpan), Always on top, slider transparansi 30-100%, Hapus tampilan, Mode Mini.
8. Mode Mini: hanya chat + status kecil + tombol keluar; nyaman sampai lebar sekitar 300 px.
9. Drawer Pengaturan (dari kanan), bagian bertajuk dengan pemisah: Koneksi (Sign API key tersamar + tombol uji, polling fallback + peringatan); Overlay OBS (URL lengkap + Salin + Buka, port aktif, regenerasi token dengan konfirmasi, ukuran font/lebar/durasi hilang); Tampilan (kepadatan, ukuran font); Fitur Plus (sakelar tiap fitur); Diagnostik (RAM total semua proses via `app.getAppMetrics`, CPU, pesan/dtk, event terbuang karena dedupe, status koneksi, versi pustaka, port, tabel sumber penonton, Catat pembanding, buka folder log, sakelar log mentah); Tentang (versi, lisensi, tautan repo, disclaimer: pustaka TikTok tidak resmi dan dapat berhenti bekerja sewaktu-waktu).
10. Modal Ringkasan Sesi dengan podium Top 3 (ikon, bukan emoji), Ekspor JSON/CSV, Tutup.
11. Mode Demo: simulator realistis (chat beragam, gift dengan combo, penonton naik-turun, like).
12. State kosong ramah (ilustrasi SVG sederhana + teks bantuan), skeleton saat memuat, banner error dengan tombol aksi, toast untuk salin/simpan.
13. Semua kontrol dapat dioperasikan keyboard; tooltip untuk semua ikon; `aria-live` sopan untuk status koneksi; urutan fokus logis.

### 8.3 Gift Monitor (jendela terpisah)

Tema sama; daftar gift + total koin + tombol Hapus + Dock Back. Terisi lengkap saat dibuka, tersinkron dua arah dengan jendela utama (Hapus di satu jendela menghapus di semua; reset saat sesi berakhir). Tidak dibuat sebelum dibutuhkan.

## 9. Overlay OBS

Halaman statis di server lokal: latar transparan; chat dan gift dengan animasi masuk halus; hilang otomatis (durasi dapat diatur); ukuran font dan lebar dapat diatur; SSE dengan reconnect otomatis di sisi klien; mengosongkan tampilan saat sesi baru; memakai token desain yang sama; hemat render (tanpa animasi berat). Disediakan petunjuk singkat penambahan Browser Source di OBS (lebar 400, tinggi 700) di README.

## 10. Verifikasi dan kualitas

Gerbang tiap fase (semua harus lulus sebelum lanjut): `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, dan `npm audit --omit=dev` tanpa temuan kritis/tinggi.

Tes unit minimal:

- backoff + jitter; resolver penonton (prioritas, basi, guard lonjakan, `totalUser` tidak pernah dipakai); like monotonik tanpa hitung ganda.
- gift: dedupe `repeatEnd` dengan msgId sama, delta koin, groupId fallback stabil, pemulihan kartu terpangkas.
- SessionStore: `seq` monoton, snapshot + buffered delta termasuk race (event datang saat snapshot diambil), total koin tidak terpotong saat pruning.
- format angka; validasi dan migrasi pengaturan; penulisan atomik dan pemulihan dari berkas korup.
- keamanan overlay: token salah/hilang ditolak, Host asing ditolak, path traversal ditolak, tidak ada header CORS wildcard, batas koneksi SSE.

Verifikasi visual (WAJIB):

- Skrip `npm run shots` meluncurkan aplikasi pada mode Demo dan menyimpan tangkapan layar ke `docs/shots/` pada ukuran 360x520, 440x760, dan 1000x700 untuk: jendela utama kosong, Demo dengan chat+gift, tab Gift, Mode Mini, drawer Pengaturan (bagian atas dan setelah di-scroll ke bawah), modal Ringkasan Sesi, Gift Monitor, halaman overlay. Jika Playwright-Electron tidak bisa dipakai, gunakan `webContents.capturePage()`.
- Kamu HARUS MELIHAT tangkapan layar itu dan memperbaiki cacat (terpotong, tumpang tindih, kontras buruk, tombol hilang) sampai bersih.
- Uji otomatis drawer Pengaturan pada tinggi 520 px: (a) tombol Tutup terlihat sebelum dan sesudah scroll, (b) badan drawer dapat di-scroll dari paling atas sampai paling bawah dan elemen terakhir terlihat, (c) Esc dan klik scrim menutup, (d) tidak ada scroll horizontal.

Performa: render chat dibatching per frame (`requestAnimationFrame`); daftar ber-key; `contain` seperlunya; hentikan animasi dan batasi render saat jendela tidak terlihat TANPA menghentikan pencatatan data; avatar lazy dengan batas cache; tidak ada loop sibuk. Ukur dan laporkan RAM total semua proses dan CPU pada tiga kondisi: idle, Demo laju tinggi (20 pesan/dtk selama 2 menit), dan Gift Monitor terbuka. Target sasaran (bukan klaim): total RAM sekitar 150-250 MB; laporkan angka sebenarnya apa pun hasilnya.

Smoke test terpaket: aplikasi mendukung argumen `--smoke-test` (membuat jendela, memuat UI, memastikan modul TikTok dapat di-import, lalu keluar dengan kode 0; kode non-nol bila gagal). Jalankan terhadap hasil `release/win-unpacked` setelah `npm run dist`.

## 11. Repo siap GitHub

Repo harus langsung bisa di-push dan menghasilkan rilis tanpa pekerjaan tambahan:

- `.github/workflows/ci.yml`: pada push dan pull request ke `main`, runner `windows-latest`, Node sesuai `engines`, `npm ci`, typecheck, lint, test, build. `permissions: contents: read`.
- `.github/workflows/release.yml`: pada push tag `v*`, runner `windows-latest`, `npm ci`, test, build, `electron-builder --win --publish never`, hitung SHA-256 semua artefak ke `SHA256SUMS.txt`, lalu buat GitHub Release (`permissions: contents: write`) dengan artefak installer, portable, dan checksum, serta catatan rilis dari `CHANGELOG.md`. Pin versi mayor aksi (`actions/checkout`, `actions/setup-node`, dan aksi rilis).
- `.github/dependabot.yml` (npm dan github-actions, mingguan), templat isu sederhana (bug dan permintaan fitur), dan `.github/pull_request_template.md`.
- Berkas akar: `README.md` (Indonesia: apa ini, fitur, tangkapan layar, instal, cara pakai, OBS, uji dengan live nyata, build, rilis, pemecahan masalah, batasan dan disclaimer), `LICENSE` (MIT), `SECURITY.md` (cara melapor kerentanan), `CHANGELOG.md` (format Keep a Changelog), `CONTRIBUTING.md` ringkas, `THIRD_PARTY_LICENSES.md` (dihasilkan skrip dari dependensi produksi), `.gitignore` (node_modules, out, dist, release, logs, .env, \*.log), `.gitattributes`, `.editorconfig`, `.nvmrc`.
- `package.json`: `name`, `version`, `description`, `author`, `license`, `repository` (placeholder `OWNER/REPO` sampai diisi pengguna), `engines`, dan skrip: `dev`, `build`, `start` (pratinjau build), `typecheck`, `lint`, `format`, `test`, `shots`, `dist`, `smoke`, `licenses`.
- Ikon aplikasi: buat logo SVG sederhana, hasilkan PNG 256+ dan 512 (mis. render SVG lewat Playwright), dan pakai untuk jendela, installer, dan portable.
- Catat di README: installer tanpa tanda tangan kode memicu peringatan Windows SmartScreen (klik "More info", lalu "Run anyway"); bagian cara memverifikasi checksum.

## 12. Struktur proyek (saran; boleh disesuaikan dan dicatat)

```
src/core/        logika murni + tes
src/main/        app, windows, services, ipc, overlay-server
src/preload/     contextBridge
src/shared/      tipe IPC dan konstanta bersama
src/renderer/    app, routes, components, styles, icons, strings
src/overlay/     halaman statis overlay
tests/           unit, keamanan, ui
scripts/         shots, licenses, icons
docs/            PLAN, PROGRESS, DECISIONS, shots
resources/       ikon dan aset build
.github/         workflows, dependabot, templat
```

## 13. Larangan ringkas

- Jangan push ke remote. Jangan memasang kode remote atau telemetri.
- Jangan memakai emoji di UI. Jangan memuat font/skrip/gambar dari CDN untuk UI aplikasi.
- Jangan menyalin kode dari proyek lain tanpa mencatat sumber dan lisensinya.
- Jangan menyimpan stream key, API key, atau token di kode, log, atau git.
- Jangan menonaktifkan tes, lint, atau aturan keamanan agar "lulus".
- Jangan menambah fitur di luar daftar tanpa izin.

## 14. Definisi selesai (v0.1.0)

Semua gerbang lulus; tangkapan layar bersih; uji drawer 520 px lulus; smoke test terpaket lulus; `npm run dist` menghasilkan installer dan portable; README dan CHANGELOG jujur dan lengkap; `docs/PROGRESS.md` mutakhir; tag `v0.1.0` dibuat secara lokal; laporan akhir menyebut dengan jelas apa yang BELUM bisa diverifikasi tanpa live TikTok nyata beserta langkah verifikasinya.
