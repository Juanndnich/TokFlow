# Changelog

Semua perubahan penting pada proyek TokFlow akan dicatat dalam berkas ini.
Format ini mengacu pada [Keep a Changelog](https://keepachangelog.com/id/1.0.0/), dan proyek ini menganut [Semantic Versioning](https://semver.org/lang/id/).

## [Unreleased]

## [0.1.1] - 2026-11-08

### Diperbaiki & Dioptimalkan

- **Ikon Aplikasi Resmi:** Integrasi ikon baru TokFlow multi-resolusi untuk aplikasi Windows, taskbar, dan installer.
- **Tampilan Bersih & Minimalis:** Menghapus menu bar bawaan (`File Edit View Window Help`) sehingga jendela aplikasi menjadi ramping dan modern.
- **Anti-Jitter Scroll:** Memperbaiki getaran/loncatan saat menggulir chat dan gift ke atas dengan penguncian scroll sinkron.
- **Slider Transparansi Mulus:** Menghilangkan lag dan getar saat menggeser tingkat transparansi jendela.
- **Penghapusan Modal Ringkasan Sesi:** Sesi terputus langsung melakukan reset bersih tanpa popup yang mengganggu.
- **Otomatisasi Rilis:** Penambahan dukungan manual `workflow_dispatch` pada pipeline rilis GitHub Actions.

## [0.1.0] - 2026-11-08

### Ditambahkan

- Peluncuran versi perdana TokFlow.
- Dukungan pemantauan live TikTok: Chat realtime, Gift dengan combo tracker, Viewer count resolver cerdas, dan Like tracker.
- Server lokal OBS Overlay dengan enkripsi token akses dan Server-Sent Events (SSE).
- Window Gift Monitor terpisah (pop-out).
- Mode Mini untuk streamer dengan ruang layar terbatas.
- Simulator mode Demo realistis tanpa perlu akun TikTok live nyata.
- Penyimpanan pengaturan atomik lokal dengan proteksi SafeStorage.
- Diagnostik sistem, visualisasi sumber metrik, dan pencatatan perbandingan JSONL.
