const fs = require('fs')
const path = require('path')
const config = require('./config')
const { getNumber } = require('./group')

const FOTO = path.join(__dirname, 'myprofile.jpg')

// Untuk selain pemilik bot, nomor disamarkan (hanya 4 digit terakhir)
const samarkan = (num) => (num.length > 4 ? '•••• ' + num.slice(-4) : num)

const handlers = {
  profile: async ({ msg, jid, reply, isAdmin, sock }) => {
    try {
      const pemilik = msg.key.fromMe
      const senderJid = pemilik ? sock.user.id : (msg.key.participant || jid)
      const num = getNumber(senderJid)
      const isOwner = pemilik || config.owners.includes(num)
      const pushName = msg.pushName || 'Pengguna'

      let role = '🌐 Member Biasa'
      if (isOwner) role = '👑 Owner Lop-Bot'
      else if (isAdmin) role = '🛡️ Admin Grup'

      const teks = [
        '👤 *USER PROFILE · LOP-BOT*',
        '──────────────────',
        `📌 *Nama:* ${pushName}`,
        `📞 *Nomor:* ${pemilik ? num : samarkan(num)}`,
        `🏅 *Role:* ${role}`,
        '──────────────────',
      ].join('\n')

      // Foto hanya dikirim untuk akun pemilik bot (pesan dari akunmu sendiri)
      if (pemilik && fs.existsSync(FOTO)) {
        await sock.sendMessage(jid, { image: fs.readFileSync(FOTO), caption: teks }, { quoted: msg })
      } else {
        await reply(teks)
      }
    } catch (err) {
      console.error('Error di !profile:', err)
      await reply('❌ Gagal memuat data profil.')
    }
  },
}

module.exports = { handlers }
