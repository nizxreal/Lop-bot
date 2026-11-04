const { getNumber } = require('./group')
const config = require('./config')
const fs = require('fs')

const handlers = {
  profile: async ({ msg, jid, reply, isAdmin, sock }) => {
    try {
      const senderJid = msg.key.fromMe ? 'Owner' : (msg.key.participant || jid)
      const pushName = msg.pushName || 'Pengguna'
      const num = getNumber(senderJid)

      // Cek apakah pengirim benar-benar owner (berdasarkan msg.key.fromMe atau daftar config.owners)
      const isOwner = msg.key.fromMe || config.owners.includes(num)

      let role = '🌐 Member Biasa'
      if (isOwner) role = '👑 Owner Lop-Bot'
      else if (isAdmin) role = '🛡️ Admin Grup'

      const teks = [
        `👤 *USER PROFILE · LOP-BOT*`,
        `──────────────────`,
        `📌 *Nama:* ${pushName}`,
        `📞 *Nomor:* ${num}`,
        `🏅 *Role:* ${role}`,
        `──────────────────`,
        `_Data profil tersimpan di sesi aktif bot._`
      ].join('\n')

      const fotoPath = './myprofile.jpg'

      // FOTO HANYA DIKIRIM JIKA YANG KETIK ADALAH OWNER DAN FILE FOTONYA ADA
      if (isOwner && fs.existsSync(fotoPath)) {
        await sock.sendMessage(jid, {
          image: fs.readFileSync(fotoPath),
          caption: teks
        }, { quoted: msg })
      } else {
        // Untuk member lain, hanya kirim teks biasa tanpa foto
        await reply(teks)
      }

    } catch (err) {
      console.error('Error di !profile:', err)
      await reply('❌ Gagal memuat data profil.')
    }
  }
}

module.exports = { handlers }
