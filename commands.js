const config = require('./config')

const handlers = {
  ping: async ({ reply }) => reply('pong!'),
  
  checkid: async ({ msg, jid, reply }) => {
    const sender = msg.key.participant || msg.key.remoteJid
    const isGroup = jid.endsWith('@g.us')
    await reply(`📌 *INFO ID*

👤 *User:* ${sender}
${isGroup ? `👥 *Group:* ${jid}` : '💬 *Private Chat'}`)
  },

  // Media Downloaders (External APIs needed - placeholders)
  tiktok: async ({ args, reply }) => reply('🔗 Fitur ini membutuhkan API downloader. (Contoh: tikwm.com)'),
  ig: async ({ args, reply }) => reply('🔗 Fitur ini membutuhkan API Instagram downloader.'),
  spotify: async ({ args, reply }) => reply('🎵 Fitur ini membutuhkan API Spotify downloader.'),

  // Sticker Tools
  stiker: async ({ msg, jid, sock, reply }) => reply('🖼️ Kirim gambar/video dengan caption !stiker untuk konversi.'),
  toimg: async ({ msg, jid, sock, reply }) => reply('♻️ Reply stiker dengan !toimg untuk jadi gambar.'),
  
  // Brat
  brat: async ({ args, reply }) => reply('✍️ Fitur Brat sedang disiapkan menggunakan API generator.'),

  menu: async ({ reply }) => {
    reply(`🤖 *${config.botName}*
    
🛠 *Core Commands*
!ping, !checkid, !menu
    
📸 *Sticker Tools*
!stiker, !toimg
    
📥 *Downloader*
!tiktok, !ig, !spotify
    
✍ *Tools*
!brat`)
  }
}

module.exports = handlers
