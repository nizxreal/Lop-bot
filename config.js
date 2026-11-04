module.exports = {
  prefix: '.',
  v4SpreadsheetUrl: 'LINK_SPREADSHEET_KAMU',
  botName: 'Lop-bot',

  // Nomor owner selain kamu (format 62 tanpa +). Ganti dengan nomor asli.
  // Akunmu sendiri otomatis dianggap owner.
  owners: [
    '122681529753647',
    '6285878041275',
  ],

  // Jeda minimal (ms) antar perintah dari satu pengirim, untuk mencegah spam
  cooldownMs: 3000,

  // Level izin per perintah: 'all', 'admin', atau 'owner'
  // Perintah yang tidak ada di sini otomatis 'all'
  permissions: {
    flush: 'owner',
    shutdown: 'owner',
    hiddenmenu: 'owner',
    tiktok: 'all',
    ig: 'all',
    spotify: 'all',
    kick: 'admin',
    ban: 'admin',
    unban: 'admin',
    tagall: 'admin',
    ingatkan: 'owner',
  },

  quotes: [
    'Jangan menyerah, hari esok punya cerita baru.',
    'Kesempatan tidak datang dua kali, tapi kesempatan baru selalu ada.',
    'Kerja keras mengalahkan bakat ketika bakat tidak bekerja keras.',
    'Lakukan hari ini apa yang kamu rencanakan kemarin.',
    'Sederhana itu indah, rumit itu melelahkan.',
  ],

  ramalan: [
    'Hari ini kamu akan menerima kabar baik. 🌟',
    'Hati-hati dengan keputusan impulsif. ⚠️',
    'Ada rezeki tak terduga menanti. 💰',
    'Seseorang diam-diam mengagumimu. 💕',
    'Waktunya istirahat, tubuhmu butuh itu. 😴',
  ],
}
