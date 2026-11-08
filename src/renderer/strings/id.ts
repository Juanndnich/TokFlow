export const STRINGS = {
  app: {
    title: 'TokFlow',
    subtitle: 'Teman Live TikTok yang Ringan, Aman, dan Rapi'
  },
  connection: {
    usernamePlaceholder: 'username_tiktok',
    connect: 'Connect',
    disconnect: 'Disconnect',
    connecting: 'Menyambungkan...',
    demo: 'Demo',
    stopDemo: 'Stop Demo',
    settings: 'Pengaturan',
    status: {
      disconnected: 'Terputus',
      connecting: 'Menyambung',
      connected: 'Terhubung',
      offline: 'Offline',
      no_internet: 'Tidak ada internet',
      error: 'Error'
    }
  },
  stats: {
    viewers: 'Penonton',
    likes: 'Total Like',
    coins: 'Total Koin',
    duration: 'Durasi Live',
    staleIndicator: 'Data belum diperbarui >20 dtk'
  },
  tabs: {
    chat: 'Obrolan',
    gift: 'Gift',
    popoutGift: 'Buka Gift Monitor Terpisah'
  },
  chat: {
    emptyTitle: 'Belum ada obrolan',
    emptyDesc: 'Komentar penonton akan muncul di sini secara realtime.',
    pin: 'Sematkan',
    unpin: 'Lepas Sematan',
    copy: 'Salin Teks',
    copiedToast: 'Teks obrolan berhasil disalin',
    jumpToLatest: (n: number) => `Ke pesan terbaru (${n} baru)`,
    pinnedTitle: 'Pesan Tersemat'
  },
  gift: {
    emptyTitle: 'Belum ada gift',
    emptyDesc: 'Gift dan streak combo penonton akan tampil di sini.',
    badgeCombo: (count: number) => `x${count}`,
    coinsUnit: 'koin',
    clearGifts: 'Hapus Tampilan Gift',
    clearedToast: 'Tampilan gift berhasil dibersihkan'
  },
  bottomBar: {
    fontSizeDec: 'Perkecil Font (A-)',
    fontSizeInc: 'Perbesar Font (A+)',
    alwaysOnTop: 'Selalu di atas',
    opacityTooltip: 'Transparansi jendela',
    clearDisplay: 'Hapus Tampilan',
    miniMode: 'Mode Mini',
    exitMiniMode: 'Keluar Mode Mini'
  },
  drawer: {
    title: 'Pengaturan',
    close: 'Tutup Pengaturan',
    sections: {
      connection: 'Koneksi & TikTok',
      overlay: 'Overlay OBS',
      display: 'Tampilan & Antarmuka',
      features: 'Fitur Plus',
      diagnostics: 'Diagnostik & Performa',
      about: 'Tentang Aplikasi'
    },
    fields: {
      signApiKey: 'Sign API Key (Opsional)',
      signApiKeyHelp: 'Disimpan secara aman dengan proteksi SafeStorage lokal.',
      testKey: 'Uji Key',
      keyValid: 'Key valid',
      keyInvalid: 'Key tidak valid',
      httpPolling: 'Fallback HTTP Polling (Darurat)',
      httpPollingWarning: 'Peringatan: Polling terus-menerus berisiko memicu blokir rate-limit IP dari TikTok. Gunakan hanya jika WebSocket terblokir.',
      overlayUrl: 'URL Browser Source OBS',
      copyUrl: 'Salin URL',
      openUrl: 'Buka di Browser',
      activePort: 'Port Aktif',
      regenerateToken: 'Buat Ulang Token',
      regenerateConfirm: 'Apakah Anda yakin ingin membuat ulang token? URL Browser Source di OBS harus diperbarui.',
      density: 'Kepadatan Tampilan',
      densityComfortable: 'Nyaman',
      densityCompact: 'Padat',
      fontSize: 'Ukuran Font UI',
      overlayFontSize: 'Ukuran Font Overlay',
      overlayWidth: 'Lebar Kontainer Overlay',
      autoHideSeconds: 'Durasi Hilang Otomatis (detik)',
      enableModeration: 'Moderasi Lokal (Saring kata & blokir spam)',
      enableFollowEvents: 'Tampilkan Notifikasi Follow',
      enableShareEvents: 'Tampilkan Notifikasi Share',
      enableJoinEvents: 'Tampilkan Notifikasi Bergabung (Join)',
      enableGoals: 'Aktifkan Goal Bar Like / Koin',
      enableHotkeys: 'Aktifkan Hotkey Keyboard',
      enableCheckUpdates: 'Periksa Pembaruan Otomatis (Opt-in)',
      checkUpdatesBtn: 'Cek Pembaruan Sekarang',
      ramTotal: 'Total Konsumsi RAM',
      cpuUsage: 'Penggunaan CPU',
      messagesPerSec: 'Kecepatan Pesan',
      droppedEvents: 'Event Terbuang (Dedupe)',
      libraryVersion: 'Versi Library TikTok',
      viewerSourcesTitle: 'Sumber Penonton & Like',
      sourceA: 'Sumber A (Room User Total)',
      sourceB: 'Sumber B (Member Join)',
      sourceC: 'Sumber C (Room Info Poll)',
      activeSourceLabel: 'Sumber Aktif',
      comparisonTitle: 'Catat Angka Pembanding',
      comparisonHelp: 'Bandingkan angka di layar dengan angka resmi di aplikasi TikTok untuk verifikasi.',
      tiktokViewerInput: 'Angka Penonton di TikTok',
      tiktokLikeInput: 'Angka Like di TikTok',
      saveComparison: 'Simpan ke Log JSONL',
      openLogFolder: 'Buka Folder Log',
      rawLogToggle: 'Aktifkan Log Mentah (Debug)',
      rawLogNotice: 'Mode log mentah aktif: detail teknis dicatat ke berkas log lokal.'
    },
    about: {
      version: 'Versi 0.1.0 (Produksi)',
      license: 'Lisensi MIT (Terbuka dan Bebas)',
      disclaimer: 'Penafian: TokFlow memanfaatkan pustaka protokol publik tidak resmi. TikTok dapat memperbarui protokol sewaktu-waktu.',
      githubLink: 'Repositori GitHub'
    }
  },
  summary: {
    title: 'Ringkasan Sesi Live',
    duration: 'Durasi',
    peakViewers: 'Puncak Penonton',
    totalComments: 'Total Komentar',
    totalCoins: 'Total Koin',
    totalLikes: 'Total Like',
    podiumTitle: 'Top 3 Pemberi Gift',
    exportJson: 'Ekspor JSON',
    exportCsv: 'Ekspor CSV',
    close: 'Tutup Ringkasan'
  },
  giftMonitor: {
    title: 'Gift Monitor',
    totalCoins: 'Total Koin Sesi',
    dockBack: 'Kembali ke Jendela Utama',
    clear: 'Hapus Tampilan'
  }
}
