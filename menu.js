const config = require('./config')
const msg = require('./messages')
const P = config.prefix

const badge = (cmd) => ((config.permissions[cmd] || 'all') === 'admin' ? ' 🛡️' : '')

const jamWIB = () =>
  parseInt(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta', hour: 'numeric', hour12: false }),
    10
  )

function sapaan() {
  const h = jamWIB()
  if (h >= 4 && h < 11) return 'Selamat pagi ☀️'
  if (h >= 11 && h < 15) return 'Selamat siang 🌤️'
  if (h >= 15 && h < 18) return 'Selamat sore 🌇'
  return 'Selamat malam 🌙'
}

function seksi(judul, baris) {
  return [
    `╭───〖 *${judul}* 〗`,
    ...baris.map((b) => `├  ◦ ${b}`),
    `╰───────────────────`,
    '',
  ]
}

function buildMenu() {
  return [
    `╭─────────────────────╮`,
    `│  *${sapaan()}!*`,
    `│  Aku *${config.botName}*`,
    `╰─────────────────────╯`,
    '',
    `  ❖ *${config.botName.toUpperCase()} · DASHBOARD* ❖`,
    msg.garis,
    '',
    ...seksi('🎲 FUN', [
      `${P}dadu [sisi]`,
      `${P}koin`,
      `${P}slot`,
      `${P}jodoh A & B`,
      `${P}apakah <tanya>`,
      `${P}quote`,
      `${P}ramal`,
      `${P}tarot [tanya]`,
    ]),
    ...seksi('🧰 USEFUL', [
      `${P}hitung <expr>`,
      `${P}cuaca <kota>`,
      `${P}waktu`,
      `${P}grupinfo`,
      `${P}member`,
      `${P}pilih a | b | c`,
      `${P}umur YYYY-MM-DD`,
      `${P}id`,
      `${P}value <nama_buah>`,
      `${P}profile`,
    ]),
    ...seksi('🎨 STIKER', [
      `${P}stiker  (kirim/reply gambar)`,
      `${P}textstiker <teks | baris 2>`,
      `${P}toimg  (reply stiker)`,
    ]),
    ...seksi('📥 DOWNLOADER', [
      `${P}tiktok <link>`,
      `${P}ig <link>`,
      `${P}spotify <link>`,
    ]),
    ...seksi('🛡️ MODERASI · khusus admin', [
      `${P}kick @user${badge('kick')}`,
      `${P}ban @user${badge('ban')}`,
      `${P}unban @user${badge('unban')}`,
      `${P}tagall [pesan]${badge('tagall')}`,
    ]),
    ...seksi('⚙️ SISTEM', [
      `${P}ping`,
      `${P}info`,
      `${P}menu`,
      `${P}help [nama]  (contoh pemakaian)`,
      `${P}flush`,
      `${P}shutdown`,
    ]),
    `╭───〖 📜 *ATURAN BOT* 〗`,
    `├  ◦ Tanpa spasi: ${P}dadu, bukan ${P} dadu`,
    `├  ◦ Cooldown: ${config.cooldownMs / 1000} detik / user`,
    `├  ◦ Moderasi butuh akses admin`,
    `├  ◦ Downloader: 1 antrean (maks 16 MB)`,
    `╰───────────────────`,
    '',
    '🛡️ = _Khusus Admin Grup_',
  ].join('\n')
}

const handlers = {
  menu: async ({ reply }) => {
    try {
      await reply(buildMenu())
    } catch (err) {
      console.error('Error di !menu:', err)
    }
  },

  info: async ({ reply }) => {
    try {
      const jam = Math.floor(process.uptime() / 3600)
      const menit = Math.floor((process.uptime() % 3600) / 60)
      const ram = (process.memoryUsage().rss / 1024 / 1024).toFixed(1)
      await reply(
        [
          `╭───〖 🤖 *${config.botName.toUpperCase()} INFO* 〗`,
          `├  ◦ Uptime : ${jam} jam ${menit} menit`,
          `├  ◦ RAM    : ${ram} MB`,
          `╰───────────────────`,
          '',
          '_made with code by LopSalvatore_',
        ].join('\n')
      )
    } catch (err) {
      console.error('Error di !info:', err)
    }
  },
}

module.exports = { handlers, buildMenu }
