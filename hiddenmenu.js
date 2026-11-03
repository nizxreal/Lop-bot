const config = require('./config')
const msg = require('./messages')
const P = config.prefix

// Label akses dibaca dari config.permissions, jadi selalu sesuai
const lvl = (cmd) => {
  const l = config.permissions[cmd] || 'all'
  if (l === 'owner') return '👑 owner'
  if (l === 'admin') return '🛡️ admin'
  return '🌐 semua'
}

// [nama command, contoh penulisan]
const DAFTAR = [
  ['🎲 FUN', [
    ['dadu', 'dadu [sisi]'], ['koin', 'koin'], ['slot', 'slot'],
    ['jodoh', 'jodoh A & B'], ['apakah', 'apakah <tanya>'], ['quote', 'quote'],
    ['ramal', 'ramal'], ['tarot', 'tarot [tanya]'],
  ]],
  ['🧰 USEFUL', [
    ['hitung', 'hitung <expr>'], ['cuaca', 'cuaca <kota>'], ['waktu', 'waktu'],
  ]],
  ['🎨 STIKER', [
    ['stiker', 'stiker'], ['textstiker', 'textstiker <teks>'],
  ]],
  ['📥 DOWNLOADER', [
    ['tiktok', 'tiktok <link>'], ['ig', 'ig <link>'], ['spotify', 'spotify <link>'],
  ]],
  ['🛡️ MODERASI', [
    ['kick', 'kick @user'], ['ban', 'ban @user'], ['unban', 'unban @user'],
    ['tagall', 'tagall [pesan]'],
  ]],
  ['⚙️ SISTEM', [
    ['ping', 'ping'], ['info', 'info'], ['menu', 'menu'],
  ]],
]

function buildHidden() {
  const baris = [
    '*🔒 HIDDEN MENU · OWNER*',
    msg.garis,
    'Semua command beserta level aksesnya.',
    '',
  ]
  for (const [judul, cmds] of DAFTAR) {
    baris.push(`*${judul}*`)
    for (const [cmd, tulis] of cmds) {
      baris.push(`  › ${P}${tulis}  [${lvl(cmd)}]`)
    }
    baris.push('')
  }
  baris.push(msg.garis)
  baris.push('🌐 semua  ·  🛡️ admin grup  ·  👑 owner')
  baris.push(`Jeda ${config.cooldownMs / 1000} detik, owner dikecualikan.`)
  return baris.join('\n')
}

const handlers = {
  hiddenmenu: async ({ reply }) => {
    try {
      await reply(buildHidden())
    } catch (err) {
      console.error('Error di !hiddenmenu:', err)
    }
  },
}

module.exports = { handlers }
