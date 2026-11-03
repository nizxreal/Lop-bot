const msg = require('./messages')
const config = require('./config')
const P = config.prefix

// Setiap fitur: nama, cara pakai, contoh lengkap, dan keterangan singkat
const KATEGORI = [
  {
    kode: 'fun',
    judul: '🎲 FUN',
    items: [
      { nama: 'dadu', sintaks: 'dadu [sisi]', contoh: `${P}dadu 20`, ket: 'lempar dadu, default 6 sisi' },
      { nama: 'koin', sintaks: 'koin', contoh: `${P}koin`, ket: 'lempar koin, kepala atau ekor' },
      { nama: 'slot', sintaks: 'slot', contoh: `${P}slot`, ket: 'main slot, jackpot jika tiga simbol sama' },
      { nama: 'jodoh', sintaks: 'jodoh A & B', contoh: `${P}jodoh Andi & Sari`, ket: 'cek kecocokan dua nama' },
      { nama: 'apakah', sintaks: 'apakah <tanya>', contoh: `${P}apakah besok hujan?`, ket: 'tanya magic 8-ball' },
      { nama: 'quote', sintaks: 'quote', contoh: `${P}quote`, ket: 'kata bijak acak' },
      { nama: 'ramal', sintaks: 'ramal', contoh: `${P}ramal`, ket: 'ramalan hari ini' },
      { nama: 'tarot', sintaks: 'tarot [tanya]', contoh: `${P}tarot apakah aku dapat rezeki?`, ket: 'kartu tarot, bisa tegak atau terbalik' },
    ],
  },
  {
    kode: 'useful',
    judul: '🧰 USEFUL',
    items: [
      { nama: 'hitung', sintaks: 'hitung <ekspresi>', contoh: `${P}hitung 2+2*3`, ket: 'kalkulator, mendukung + - * / % ( ) ^' },
      { nama: 'cuaca', sintaks: 'cuaca <kota>', contoh: `${P}cuaca Jakarta`, ket: 'cuaca sekarang dari wttr.in' },
      { nama: 'waktu', sintaks: 'waktu', contoh: `${P}waktu`, ket: 'jam dan tanggal WIB sekarang' },
      { nama: 'grupinfo', sintaks: 'grupinfo', contoh: `${P}grupinfo`, ket: 'info grup: nama, anggota, admin, tanggal dibuat (hanya di grup)' },
      { nama: 'member', sintaks: 'member', contoh: `${P}member`, ket: 'jumlah anggota dan admin (hanya di grup)' },
      { nama: 'pilih', sintaks: 'pilih <a | b | c>', contoh: `${P}pilih nasi | mie | roti`, ket: 'pilih satu secara acak' },
      { nama: 'umur', sintaks: 'umur <YYYY-MM-DD>', contoh: `${P}umur 2000-05-17`, ket: 'hitung usia dari tanggal lahir' },
      { nama: 'id', sintaks: 'id', contoh: `${P}id`, ket: 'lihat ID chat dan pengirim' },
    ],
  },
  {
    kode: 'stiker',
    judul: '🎨 STIKER',
    items: [
      { nama: 'stiker', sintaks: 'stiker', contoh: `kirim gambar dengan caption ${P}stiker`, ket: 'gambar jadi stiker, dengan info paket Lop-bot' },
      { nama: 'textstiker', sintaks: 'textstiker <teks | baris 2>', contoh: `${P}textstiker tuk coba | memiliki | hatimu?`, ket: 'teks jadi stiker latar putih, baris dipisah |' },
      { nama: 'toimg', sintaks: 'toimg', contoh: `balas stiker dengan ${P}toimg`, ket: 'stiker jadi gambar PNG, animasi diambil frame pertamanya' },
    ],
  },
  {
    kode: 'downloader',
    judul: '📥 DOWNLOADER',
    items: [
      { nama: 'tiktok', sintaks: 'tiktok <link>', contoh: `${P}tiktok https://www.tiktok.com/@user/video/123`, ket: 'unduh video TikTok publik, maks 16 MB' },
      { nama: 'ig', sintaks: 'ig <link>', contoh: `${P}ig https://www.instagram.com/p/xxxx/`, ket: 'unduh post atau reel Instagram publik' },
      { nama: 'spotify', sintaks: 'spotify <link>', contoh: `${P}spotify https://open.spotify.com/track/xxxx`, ket: 'unduh lagu satuan, playlist belum didukung' },
    ],
  },
  {
    kode: 'moderasi',
    judul: '🛡️ MODERASI',
    items: [
      { nama: 'kick', sintaks: 'kick @user', contoh: `${P}kick @budi @sari`, ket: 'keluarkan anggota, bisa banyak sekaligus (admin)' },
      { nama: 'ban', sintaks: 'ban @user', contoh: `${P}ban @budi`, ket: 'keluarkan dan blokir, auto-kick jika masuk lagi (admin)' },
      { nama: 'unban', sintaks: 'unban @user', contoh: `${P}unban @budi`, ket: 'hapus dari daftar blokir (admin)' },
      { nama: 'tagall', sintaks: 'tagall [pesan]', contoh: `${P}tagall rapat jam 8 malam`, ket: 'tag semua anggota grup (admin)' },
    ],
  },
  {
    kode: 'sistem',
    judul: '⚙️ SISTEM',
    items: [
      { nama: 'ping', sintaks: 'ping', contoh: `${P}ping`, ket: 'cek bot aktif' },
      { nama: 'info', sintaks: 'info', contoh: `${P}info`, ket: 'uptime dan pemakaian RAM bot' },
      { nama: 'menu', sintaks: 'menu', contoh: `${P}menu`, ket: 'daftar semua command' },
      { nama: 'help', sintaks: 'help [nama]', contoh: `${P}help textstiker`, ket: 'contoh pemakaian, atau detail satu fitur' },
    ],
  },
]

// Nama alternatif yang juga dikenali bot
const ALIAS = {
  sticker: 'stiker',
  textsticker: 'textstiker',
  stickertoimg: 'toimg',
}

const garis = '───────────────────'

const kotak = (judul, baris) => [
  `╭───〖 ${judul} 〗`,
  ...baris.map((b) => `├  ${b}`),
  `╰${garis}`,
  '',
]

const cariFitur = (nama) => {
  const asli = ALIAS[nama] || nama
  for (const k of KATEGORI) {
    const hit = k.items.find((i) => i.nama === asli)
    if (hit) return hit
  }
  return null
}

const aliasDari = (nama) =>
  Object.keys(ALIAS).filter((a) => ALIAS[a] === nama)

// .help: semua fitur, dua baris per contoh
function buildSemua() {
  const hasil = [
    `╭───〖 📖 *HELP · CONTOH* 〗`,
    `├  ◦ ${P}help <nama>  → detail fitur`,
    `├  ◦ ${P}help <kategori>  → per kategori`,
    `╰${garis}`,
    '',
  ]
  for (const k of KATEGORI) {
    hasil.push(`*${k.judul}*`)
    for (const it of k.items) {
      hasil.push(`  ◦ *${P}${it.sintaks}*`)
      hasil.push(`      ↳ ${it.contoh}`)
    }
    hasil.push('')
  }
  hasil.push(msg.garis)
  return hasil.join('\n')
}

// .help <kategori>: lengkap dengan keterangan
function buildKategori(k) {
  const baris = []
  for (const it of k.items) {
    baris.push(`◦ *${P}${it.sintaks}*`)
    baris.push(`   contoh : ${it.contoh}`)
    baris.push(`   info   : ${it.ket}`)
  }
  return kotak(`📖 *${k.judul}*`, baris).join('\n')
}

// .help <nama>: detail satu fitur
function buildDetail(it) {
  const baris = [
    `Cara   : ${P}${it.sintaks}`,
    `Contoh : ${it.contoh}`,
    `Info   : ${it.ket}`,
  ]
  const alias = aliasDari(it.nama)
  if (alias.length) baris.push(`Alias  : ${alias.map((a) => P + a).join(', ')}`)
  return kotak(`📖 *${P}${it.nama}*`, baris).join('\n')
}

const handlers = {
  help: async ({ args, reply }) => {
    try {
      const arg = (args[0] || '').toLowerCase().replace(/^[.!]/, '')
      if (!arg) return reply(buildSemua())

      const kat = KATEGORI.find((k) => k.kode === arg)
      if (kat) return reply(buildKategori(kat))

      const it = cariFitur(arg)
      if (it) return reply(buildDetail(it))

      await reply(
        `⛔ *TIDAK DITEMUKAN*\nTidak ada fitur atau kategori bernama *${arg}*.\nKetik ${P}help untuk daftar lengkap.`
      )
    } catch (err) {
      console.error('Error di !help:', err)
    }
  },
}

module.exports = { handlers }
