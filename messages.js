// Semua teks balasan bot ada di sini.
// Ubah teks di sini saja, lalu jalankan: pm2 restart lopbot

const garis = '━━━━━━━━━━━━━━━━━━━━'

const kepala = (judul) => `*${judul}*\n${garis}`
const kaki = '\n' + garis

module.exports = {
  kepala,
  kaki,
  garis,

  pong: '🏓 *AKTIF*\nLop-bot siap dipakai.',

  error: '⛔ *GAGAL*\nPerintah tidak bisa dijalankan. Cek format di !menu, lalu coba lagi.',

  hanyaGrup: '⛔ *DITOLAK*\nPerintah ini hanya bisa dipakai di grup.',

  botBukanAdmin: '⛔ *DITOLAK*\nAkun bot belum jadi admin grup. Jadikan admin dulu, lalu ulangi perintahnya.',

  adminOnly: '🛡️ *DITOLAK*\nPerintah ini khusus admin grup.',

  dadu: (sisi, hasil) => `${kepala('🎲 DADU')}\nSisi: ${sisi}\nHasil: *${hasil}*${kaki}`,

  koin: (hasil) => `${kepala('🪙 KOIN')}\nHasil: *${hasil}*${kaki}`,

  slot: (a, b, c, jackpot) =>
    `${kepala('🎰 SLOT')}\n| ${a} | ${b} | ${c} |\n\n${jackpot ? '🎉 *JACKPOT!*' : 'Belum beruntung, coba lagi.'}${kaki}`,

  jodoh: (a, b, persen) => `${kepala('💘 JODOH')}\n${a} & ${b}\nKecocokan: *${persen}%*${kaki}`,

  apakah: (jawaban) => `${kepala('🔮 MAGIC 8-BALL')}\n${jawaban}${kaki}`,

  quote: (teks) => `${kepala('💬 KATA BIJAK')}\n_${teks}_${kaki}`,

  ramal: (teks) => `${kepala('🔮 RAMALAN HARI INI')}\n${teks}${kaki}`,

  tarot: (tanya, nama, posisi, makna) =>
    `${kepala('🔮 KARTU TAROT')}\n❓ ${tanya}\n\n*${nama}*\nPosisi: ${posisi}\n\n📜 ${makna}\n\n_Tarot hanya hiburan. Keputusan ada di tanganmu._${kaki}`,

  hitung: (expr, hasil) => `${kepala('🧮 HITUNG')}\n${expr} = *${hasil}*${kaki}`,

  waktu: (teks) => `${kepala('🕒 WAKTU WIB')}\n${teks}${kaki}`,

  ping: null, // dipakai pong di atas
  cuacaGagal: '❌ *GAGAL*\nData cuaca tidak bisa diambil. Coba lagi nanti.',
}
