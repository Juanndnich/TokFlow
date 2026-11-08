# Panduan Kontribusi TokFlow

Terima kasih atas minat Anda berkontribusi pada TokFlow! Proyek ini bertujuan menyediakan aplikasi live streaming helper yang ringan, aman, dan dapat diandalkan bagi pengguna Windows.

## Aturan Utama

1. **Bahasa:** Semua teks antarmuka (UI), dokumentasi pengguna, dan pesan rilis menggunakan Bahasa Indonesia yang ramah. Kode dan komentar teknis dapat menggunakan Bahasa Inggris.
2. **Kualitas:** Semua perubahan wajib lolos pemeriksaan:
   - `npm run typecheck`
   - `npm run lint`
   - `npm test`
   - `npm run build`
   - `npm audit --omit=dev`
3. **Keamanan:**
   - Dilarang menambahkan telemetri atau panggilan API remote yang tidak terdokumentasi.
   - Jangan pernah menyertakan stream key, token otentikasi, atau data rahasia ke dalam repositori.
   - Tidak menggunakan `innerHTML` atau bypass keamanan CSP.
4. **Dependensi:** Hindari menambahkan pustaka eksternal kecuali benar-benar diperlukan dan berlisensi permisif (MIT, Apache-2.0, BSD, ISC, OFL).

## Alur Pengembangan

1. Fork repositori dan buat branch fitur (`feat/nama-fitur` atau `fix/nama-perbaikan`).
2. Jalankan `npm install` untuk memasang dependensi.
3. Lakukan perubahan dengan commit yang bermakna (`feat:`, `fix:`, `test:`, `docs:`, `chore:`).
4. Pastikan seluruh pengujian lolos sebelum mengajukan Pull Request.
