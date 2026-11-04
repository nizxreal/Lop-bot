const config = require('./config')
const { handlers: valueHandlers, fruitDatabase } = require('./value')

const P = config.prefix
const URUTAN = ['Mythical', 'Legendary', 'Epic', 'Rare']

const kotak = (judul, baris) =>
  [`╭───〖 ${judul} 〗`, ...baris.map((b) => `├  ◦ ${b}`), '╰───────────────────'].join('\n')

const menuBf = () =>
  kotak('🍈 *BLOX FRUITS*', [
    `${P}bf <buah>  → cek nilai buah`,
    `${P}bflist  → daftar semua buah`,
    `${P}v4guide  → gambar guide race V4`,
    `${P}menubf  → tampilkan menu ini`,
    '',
    '_Nilai bersifat lokal, bukan harga real-time._',
  ])

const listBf = () => {
  const baris = []
  for (const rarity of URUTAN) {
    const buah = Object.values(fruitDatabase).filter((f) => f.rarity === rarity)
    if (!buah.length) continue
    baris.push(`*${rarity}*`)
    for (const f of buah) baris.push(`  ◦ ${f.name}  ·  💲${f.perm}`)
    baris.push('')
  }
  return ['*🍈 DAFTAR BUAH BLOX FRUITS*', '──────────────────', ...baris].join('\n')
}

const handlers = {
  // .bf tanpa nama buah menampilkan menu, dengan nama buah langsung mencari nilainya
  bf: async (ctx) => {
    try {
      if (!ctx.args.length) return ctx.reply(menuBf())
      return valueHandlers.value(ctx)
    } catch (err) {
      console.error('Error di !bf:', err)
      await ctx.reply('❌ Terjadi kesalahan saat membuka menu Blox Fruits.')
    }
  },

  menubf: async ({ reply }) => {
    try {
      await reply(menuBf())
    } catch (err) {
      console.error('Error di !menubf:', err)
    }
  },

  bflist: async ({ reply }) => {
    try {
      await reply(listBf())
    } catch (err) {
      console.error('Error di !bflist:', err)
      await reply('❌ Daftar buah tidak bisa ditampilkan.')
    }
  },
}

module.exports = { handlers }
