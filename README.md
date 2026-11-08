# TokFlow ⚡

Aplikasi desktop Windows yang **ringan**, **aman**, dan **rapi** untuk streamer TikTok Live, dirancang khusus agar tetap lancar di PC berspesifikasi rendah hingga menengah.

Menampilkan obrolan, gift, jumlah penonton, dan like secara realtime, lengkap dengan overlay siap pakai untuk OBS Studio.

---

## 🌟 Fitur Utama

- **Ringan & Hemat Daya:** Dibangun menggunakan Preact dan arsitektur proses terpisah, menjaga konsumsi RAM dan CPU tetap minimal saat streaming.
- **Dapat Dipercaya:**
  - **Viewer Resolver Multi-Sumber:** Menggabungkan event room, join member, dan polling informasi ruangan secara cerdas dengan perlindungan lonjakan (spike guard).
  - **Gift & Combo Tracking:** Pelacakan combo gift akurat berbasis delta koin tanpa duplikasi saat streak berlangsung.
- **Aman Sejak Awal:**
  - Server overlay OBS terikat eksklusif ke `127.0.0.1` dengan proteksi token acak 32 heksadesimal dan pencegahan DNS rebinding.
  - CSP ketat, isolasi konteks penuh, tanpa `eval`, dan tanpa telemetri pihak ketiga.
- **Tampilan OBS Siap Pakai:** Halaman overlay transparan dengan koneksi Server-Sent Events (SSE) yang otomatis pulih jika terputus.
- **Jendela Fleksibel:**
  - Jendela utama dengan tab Chat dan Gift yang rapi.
  - Mode Mini ringkas untuk menghemat ruang monitor.
  - Pop-out Gift Monitor terpisah dengan sinkronisasi dua arah.
- **Mode Demo Bawaan:** Uji coba seluruh tampilan dan interaksi animasi tanpa perlu terhubung ke live sungguhan.

---

## 📥 Instalasi & Penggunaan

### Menggunakan Installer (.exe)

1. Unduh installer TokFlow dari halaman rilis GitHub.
2. Jalankan `TokFlow-Setup-0.1.0.exe` atau versi portable `TokFlow-0.1.0-portable.exe`.
3. _Catatan Windows SmartScreen:_ Karena aplikasi ini didistribusikan secara independen tanpa sertifikat berbayar, Windows SmartScreen mungkin memunculkan peringatan. Klik **More info** (Informasi selengkapnya), lalu pilih **Run anyway** (Tetap jalankan).
4. Verifikasi berkas rilis menggunakan checksum yang tercantum pada berkas `SHA256SUMS.txt`.

### Menyiapkan Overlay di OBS Studio

1. Buka OBS Studio, tambahkan sumber baru: **Browser** (Browser Source).
2. Di aplikasi TokFlow, buka **Pengaturan** > bagian **Overlay OBS**.
3. Salin URL Overlay (contoh: `http://127.0.0.1:8899/overlay?token=...`).
4. Tempelkan URL tersebut ke kolom URL di OBS Studio.
5. Atur resolusi yang disarankan: Lebar `400` dan Tinggi `700`.
6. Centang opsi _Shutdown source when not visible_ jika diinginkan.

---

## 🛠️ Pengembangan & Build Mandiri

### Prasyarat

- Node.js versi 20 LTS atau 22 LTS
- Git

### Menjalankan Mode Pengembangan

```bash
# Pasang dependensi
npm install

# Jalankan dalam mode pengembangan
npm run dev
```

### Memeriksa Kualitas Kode

```bash
# Pemeriksaan tipe TypeScript
npm run typecheck

# Linting kode
npm run lint

# Menjalankan tes unit
npm test

# Menghasilkan tangkapan layar verifikasi UI
npm run shots
```

### Membuat Paket Rilis Windows

```bash
# Membuat installer NSIS dan versi portable
npm run dist
```

Hasil kompilasi executable akan tersedia di folder `release/`.

---

## ⚠️ Batasan & Penafian (Disclaimer)

- **Bukan Produk Resmi:** TokFlow tidak berafiliasi dengan, didukung oleh, atau secara resmi terhubung dengan TikTok atau ByteDance.
- **Pustaka Tidak Resmi:** Aplikasi ini memanfaatkan pustaka reverse-engineering protokol live publik. Perubahan protokol dari pihak TikTok di masa mendatang dapat memengaruhi fungsionalitas hingga pustaka pendukung diperbarui.
- **Akurasi Angka:** Angka penonton dan like dari TikTok Live mengalami penundaan dan pembulatan di sisi server TikTok sendiri; TokFlow menyajikan pembacaan terbaik dari aliran event yang diterima tanpa manipulasi data.

---

## 📄 Lisensi

Didistribusikan di bawah Lisensi MIT. Lihat berkas [LICENSE](LICENSE) untuk informasi lebih lanjut.
Daftar lisensi komponen pihak ketiga tersedia di [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).
