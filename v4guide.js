const fs = require('fs')
const path = require('path')

const FOTO = path.join(__dirname, 'guides', 'v4guide.jpeg')
const CAPTION = 'Race V4 Guide'

const handlers = {
  v4guide: async ({ send, jid, msg, reply }) => {
    try {
      if (!fs.existsSync(FOTO)) {
        return reply('⛔ *BELUM ADA*\nFile guides/v4guide.jpeg belum tersedia.')
      }
      await send(jid, { image: fs.readFileSync(FOTO), caption: CAPTION }, { quoted: msg })
    } catch (err) {
      console.error('Error di !v4guide:', err.message)
      await reply('❌ *GAGAL*\nGambar guide tidak bisa dikirim.')
    }
  },
}

module.exports = { handlers }
