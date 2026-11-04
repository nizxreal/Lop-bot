const config = require('./config')
const db = require('./db')
const rb = require('./roblox')
const { getNumber } = require('./group')

const P = config.prefix
const SESI_MS = 5 * 60_000
const COOLDOWN_MS = 10_000
const REFRESH_MS = 24 * 3600_000
const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/
const PERINTAH_BATAL = ['batal', 'cancel']

const sesi = new Map()
const cooldown = new Map()

// Tanggal dalam format Indonesia, contoh: 5 November 2026
const tgl = (v) =>
  new Date(v).toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

const isOwnerDm = (msg, jid) => {
  const nums = [jid, msg.key.remoteJidAlt].filter(Boolean).map(getNumber)
  return msg.key.fromMe || nums.some((n) => config.owners.includes(n))
}

// Kunci data: nomor telepon bila ada, supaya cocok dengan pengirim
const kunciDari = (msg, jid) => getNumber(msg.key.remoteJidAlt || jid)

function kenaCooldown(jid, owner) {
  if (owner) return false
  const last = cooldown.get(jid) || 0
  if (Date.now() - last < COOLDOWN_MS) return true
  cooldown.set(jid, Date.now())
  return false
}

function sesiAktif(jid) {
  const s = sesi.get(jid)
  if (!s) return null
  if (Date.now() - s.mulai > SESI_MS) {
    sesi.delete(jid)
    return null
  }
  return s
}

const kartuRegistrasi = (row) =>
  [
    '🎮 *AKUN ROBLOX*',
    `Username : ${row.rb_username}`,
    `Nama     : ${row.rb_display}`,
    `Terdaftar: ${tgl(row.daftar_at)}`,
  ].join('\n')

// Ambil ulang username dan nama dari API kalau sudah lebih dari 24 jam
async function segarkan(row) {
  if (Date.now() - row.rb_updated < REFRESH_MS) return row
  try {
    const r = await rb.ambilUser(row.rb_id)
    db.updateRoblox(row.num, r)
    return db.getUser(row.num)
  } catch (err) {
    console.error('Gagal segarkan Roblox:', err.message)
    return row
  }
}

const CONSENT = () =>
  [
    '📝 *PENDAFTARAN LOP-BOT*',
    '──────────────────',
    'Data yang disimpan:',
    '• Username Roblox',
    '• Nama tampilan Roblox',
    '• Tanggal daftar',
    '',
    'Data ini ditampilkan di profil kamu. Tidak ada password atau data login yang diminta.',
    '',
    'Balas *1* untuk setuju, *2* untuk batal, atau ketik *batal*/*cancel* kapan saja.',
  ].join('\n')

async function handleDm({ sock, msg, jid, text }) {
  if (jid.endsWith('@g.us')) return false
  const owner = isOwnerDm(msg, jid)
  const t = text.trim()
  const cmd = t.startsWith(P) ? t.slice(P.length).split(/\s+/)[0].toLowerCase() : ''
  const kunci = kunciDari(msg, jid)
  const kirim = (x) => sock.sendMessage(jid, { text: x }, { quoted: msg })

  const s = sesiAktif(jid)
  const inputBatal = PERINTAH_BATAL.includes(t.toLowerCase()) || PERINTAH_BATAL.includes(cmd)
  if (s && inputBatal) {
    sesi.delete(jid)
    await kirim('🚫 *DIBATALKAN*\nPendaftaran dihentikan. Data tidak disimpan.')
    return true
  }

  // Sedang dalam sesi pendaftaran: pesan tanpa prefix dianggap jawaban
  if (s && !cmd) {
    await lanjutkan(s, t, jid, kirim)
    return true
  }

  if (cmd === 'daftar') {
    if (kenaCooldown(jid, owner)) return true
    const ada = db.getUser(kunci)
    if (ada) {
      await kirim(`ℹ️ Kamu sudah terdaftar sebagai *${ada.rb_username}*.\nKetik ${P}profile untuk melihat profil, atau ${P}daftarhapus untuk keluar.`)
      return true
    }
    sesi.set(jid, { langkah: 'setuju', mulai: Date.now(), kunci })
    await kirim(CONSENT())
    return true
  }

  if (cmd === 'daftarhapus') {
    if (kenaCooldown(jid, owner)) return true
    sesi.delete(jid)
    const n = db.hapus(kunci)
    await kirim(n ? '🗑️ *DATA DIHAPUS*\nData pendaftaranmu sudah dihapus dari bot.' : 'ℹ️ Kamu belum terdaftar.')
    return true
  }

  // Pengguna biasa melihat profilnya sendiri. Owner tetap lewat profile.js (dengan foto).
  if (cmd === 'profile' && !owner) {
    if (kenaCooldown(jid, owner)) return true
    const row = db.getUser(kunci)
    const isi = row
      ? kartuRegistrasi(await segarkan(row))
      : `Kamu belum terdaftar. Ketik ${P}daftar untuk mendaftar.`
    await kirim(isi)
    return true
  }

  return false
}

async function lanjutkan(s, t, jid, kirim) {
  if (s.langkah === 'setuju') {
    if (t === '1') {
      s.langkah = 'username'
      return kirim('Balas dengan *username Roblox* kamu, tanpa @.\nKetik *batal* atau *cancel* kapan saja untuk membatalkan.')
    }
    if (t === '2') {
      sesi.delete(jid)
      return kirim('🚫 *DIBATALKAN*\nData tidak disimpan.')
    }
    return kirim('Balas *1* untuk setuju, *2* untuk batal, atau ketik *batal*/*cancel* untuk membatalkan.')
  }

  if (s.langkah === 'username') {
    const username = t.replace(/^@/, '')
    if (!USERNAME_RE.test(username)) {
      return kirim('⛔ Format salah. Gunakan 3 sampai 20 huruf, angka, atau garis bawah.\nKetik *batal* atau *cancel* untuk membatalkan.')
    }
    let akun
    try {
      akun = await rb.cariUser(username)
    } catch (err) {
      console.error('Roblox cariUser gagal:', err.message)
      return kirim('❌ Roblox sedang tidak bisa dihubungi. Coba lagi nanti, atau ketik *batal*/*cancel* untuk membatalkan.')
    }
    if (!akun) return kirim('⛔ Username tidak ditemukan. Coba lagi, atau ketik *batal*/*cancel* untuk membatalkan.')

    let detail
    try {
      detail = await rb.ambilUser(akun.id)
    } catch (err) {
      console.error('Roblox ambilUser gagal:', err.message)
      return kirim('❌ Data akun gagal diambil. Coba lagi nanti, atau ketik *batal*/*cancel* untuk membatalkan.')
    }

    if (db.cariByRbId(detail.id, s.kunci)) {
      sesi.delete(jid)
      return kirim('⛔ Akun Roblox ini sudah dipakai oleh pendaftar lain.')
    }

    s.data = detail
    s.langkah = 'konfirmasi'
    return kirim([
      '🔍 *KONFIRMASI AKUN*',
      `Username : ${detail.name}`,
      `Nama     : ${detail.displayName}`,
      '',
      'Apakah ini akun kamu? Balas *1* jika benar, *2* jika ingin memasukkan username lain, atau ketik *batal*/*cancel* untuk membatalkan.',
    ].join('\n'))
  }

  if (s.langkah === 'konfirmasi') {
    if (t === '1') {
      db.simpan(s.kunci, s.data)
      sesi.delete(jid)
      return kirim(`✅ *TERDAFTAR*\nAkun Roblox *${s.data.name}* sudah tersimpan.\nKetik ${P}profile untuk melihat profil.`)
    }
    if (t === '2') {
      s.langkah = 'username'
      return kirim('Balas dengan username Roblox yang benar.\nKetik *batal* atau *cancel* kapan saja untuk membatalkan.')
    }
    return kirim('Balas *1* jika benar, *2* jika ingin memasukkan username lain, atau ketik *batal*/*cancel* untuk membatalkan.')
  }
}

module.exports = {
  handleDm,
  kartuRegistrasi,
  segarkan,
  getRegistered: (num) => db.getUser(num),
}
