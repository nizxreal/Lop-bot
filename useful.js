const msg = require('./messages')
const config = require('./config')
const P = config.prefix

const kotak = (judul, baris) =>
  [`╭───〖 ${judul} 〗`, ...baris.map((b) => `├  ◦ ${b}`), `╰───────────────────`].join('\n')

const isAdmin = (p) => p?.admin === 'admin' || p?.admin === 'superadmin'

const tglIndo = (detik) =>
  new Date(detik * 1000).toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

// Bungkus handler supaya error tercatat di log dan tetap ada balasan
const aman = (nama, fn) => async (c) => {
  try {
    return await fn(c)
  } catch (err) {
    console.error(`Error di !${nama}:`, err.message)
    return c.reply(msg.error)
  }
}

const handlers = {
  grupinfo: aman('grupinfo', async ({ sock, jid, isGroup, reply }) => {
    if (!isGroup) return reply(msg.hanyaGrup)
    const meta = await sock.groupMetadata(jid)
    const admin = meta.participants.filter(isAdmin).length
    const desc = (meta.desc || 'Tidak ada deskripsi').slice(0, 200)
    await reply(
      [
        kotak(`🏷️ *${meta.subject}*`, [
          `Anggota : ${meta.participants.length} orang`,
          `Admin   : ${admin} orang`,
          `Dibuat  : ${meta.creation ? tglIndo(meta.creation) : '-'}`,
          `ID      : ${jid}`,
        ]),
        '',
        `📝 _${desc}_`,
      ].join('\n')
    )
  }),

  member: aman('member', async ({ sock, jid, isGroup, reply }) => {
    if (!isGroup) return reply(msg.hanyaGrup)
    const meta = await sock.groupMetadata(jid)
    const total = meta.participants.length
    const admin = meta.participants.filter(isAdmin).length
    await reply(
      kotak('👥 *JUMLAH MEMBER*', [
        `Total   : ${total}`,
        `Admin   : ${admin}`,
        `Biasa   : ${total - admin}`,
      ])
    )
  }),

  pilih: aman('pilih', async ({ args, reply }) => {
    const pilihan = args.join(' ').split('|').map((s) => s.trim()).filter(Boolean)
    if (pilihan.length < 2) {
      return reply(`⛔ *FORMAT SALAH*\nContoh: ${P}pilih nasi | mie | roti`)
    }
    if (pilihan.length > 20) {
      return reply('⛔ *TERLALU BANYAK*\nMaksimal 20 pilihan.')
    }
    const hasil = pilihan[Math.floor(Math.random() * pilihan.length)]
    await reply(kotak('🎯 *PILIH*', [`Pilihan : ${pilihan.join(' · ')}`, `Hasil   : *${hasil}*`]))
  }),

  umur: aman('umur', async ({ args, reply }) => {
    const m = (args[0] || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
    const salah = `⛔ *FORMAT SALAH*\nContoh: ${P}umur 2000-05-17`
    if (!m) return reply(salah)

    const y = Number(m[1])
    const mo = Number(m[2]) - 1
    const d = Number(m[3])
    const lahir = new Date(Date.UTC(y, mo, d))
    if (lahir.getUTCMonth() !== mo) return reply(salah)

    // Hari ini menurut WIB
    const wib = new Date(Date.now() + 7 * 3600000)
    const today = new Date(Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate()))
    if (lahir > today) return reply('⛔ *TANGGAL SALAH*\nTanggal lahir belum terjadi.')

    let tahun = today.getUTCFullYear() - y
    let bulan = today.getUTCMonth() - mo
    let hari = today.getUTCDate() - d
    if (hari < 0) {
      bulan--
      hari += new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0)).getUTCDate()
    }
    if (bulan < 0) {
      tahun--
      bulan += 12
    }
    await reply(
      kotak('🎂 *UMUR*', [
        `Lahir : ${m[0]}`,
        `Usia  : ${tahun} tahun ${bulan} bulan ${hari} hari`,
      ])
    )
  }),

  id: aman('id', async ({ msg: pesan, jid, isGroup, reply }) => {
    const pengirim = pesan.key.participant || pesan.key.remoteJid
    await reply(
      kotak('🪪 *ID*', [
        `Tipe     : ${isGroup ? 'grup' : 'pribadi'}`,
        `Chat     : ${jid}`,
        `Pengirim : ${pengirim}`,
      ])
    )
  }),
}

module.exports = { handlers }
