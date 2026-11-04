const fs = require('fs')
const path = require('path')
const config = require('./config')
const { getNumber } = require('./group')
const daftar = require('./daftar')

const FOTO = path.join(__dirname, 'myprofile.jpg')
const samarkan = (num) => (num.length > 4 ? '•••• ' + num.slice(-4) : num)

// Kalimat acak untuk owner yang belum terdaftar
const KALIMAT_OWNER = [
  '👑 _Kamu pemilik bot. Akses penuh aktif, tidak perlu daftar._',
  '⚡ _Sang pemilik terdeteksi. Semua fitur sudah terbuka._',
  '🔥 _Owner tidak perlu antre. Gas terus, Bos._',
]
const pilihKalimat = () => KALIMAT_OWNER[Math.floor(Math.random() * KALIMAT_OWNER.length)]

const handlers = {
  profile: async ({ msg, jid, isGroup, isOwner, isAdmin, reply, sock }) => {
    try {
      const senderJid = msg.key.fromMe ? sock.user.id : (msg.key.participant || jid)
      const num = getNumber(senderJid)
      const pushName = msg.pushName || 'Pengguna'

      let role = '🌐 Member Biasa'
      if (isOwner) role = '👑 Owner Lop-Bot'
      else if (isAdmin) role = '🛡️ Admin Grup'

      const tampilNomor = isOwner && !isGroup ? num : samarkan(num)

      const baris = [
        '👤 *USER PROFILE · LOP-BOT*',
        '──────────────────',
        `📌 *Nama:* ${pushName}`,
        `📞 *Nomor:* ${tampilNomor}`,
        `🏅 *Role:* ${role}`,
        '──────────────────',
      ]

      const row = daftar.getRegistered(num)
      if (row) {
        const fresh = await daftar.segarkan(row)
        baris.push(daftar.kartuRegistrasi(fresh), '──────────────────')
      } else if (isOwner) {
        baris.push(pilihKalimat(), '──────────────────')
      } else {
        baris.push(`_Belum terdaftar. Chat pribadi bot lalu ketik ${config.prefix}daftar._`, '──────────────────')
      }

      const teks = baris.join('\n')

      // Foto pribadi hanya untuk owner
      if (isOwner && fs.existsSync(FOTO)) {
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
