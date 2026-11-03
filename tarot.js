const config = require('./config')

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

// Kartu Major Arcana: nama, emoji, makna tegak, makna terbalik
const CARDS = [
  { nama: 'The Fool', emoji: '🃏', tegak: 'Awal baru, berani melangkah tanpa takut salah.', terbalik: 'Ceroboh atau takut mengambil risiko.' },
  { nama: 'The Magician', emoji: '🪄', tegak: 'Kamu punya semua alat untuk mewujudkan rencana.', terbalik: 'Potensi belum dipakai, atau niat yang kurang jelas.' },
  { nama: 'The High Priestess', emoji: '🌙', tegak: 'Dengarkan intuisimu, jawabannya ada di dalam dirimu.', terbalik: 'Mengabaikan firasat, atau rahasia yang belum terungkap.' },
  { nama: 'The Empress', emoji: '🌸', tegak: 'Kelimpahan, kreativitas, dan kehangatan.', terbalik: 'Terlalu memanjakan diri, atau kreativitas yang mampet.' },
  { nama: 'The Emperor', emoji: '🏰', tegak: 'Disiplin, struktur, dan kepemimpinan yang tegas.', terbalik: 'Kaku berlebihan, atau kehilangan kendali.' },
  { nama: 'The Lovers', emoji: '💞', tegak: 'Pilihan penting yang selaras dengan nilaimu.', terbalik: 'Keraguan dalam memilih, atau hubungan yang timpang.' },
  { nama: 'The Chariot', emoji: '🏇', tegak: 'Kemenangan lewat tekad dan fokus.', terbalik: 'Arah yang kabur, atau energi yang saling tarik.' },
  { nama: 'Strength', emoji: '🦁', tegak: 'Keberanian yang lembut dan kesabaran.', terbalik: 'Lemah hati, atau amarah yang belum reda.' },
  { nama: 'The Hermit', emoji: '🕯️', tegak: 'Waktunya merenung dan mencari jawaban sendiri.', terbalik: 'Terlalu menyendiri, atau enggan meminta bantuan.' },
  { nama: 'Wheel of Fortune', emoji: '🎡', tegak: 'Roda keberuntungan sedang berputar ke arahmu.', terbalik: 'Nasib sedang sial, tapi ini hanya fase.' },
  { nama: 'Justice', emoji: '⚖️', tegak: 'Keputusan yang adil dan konsekuensi yang jelas.', terbalik: 'Ketidakadilan, atau keputusan yang belum matang.' },
  { nama: 'The Star', emoji: '⭐', tegak: 'Harapan, ketenangan, dan kepercayaan diri.', terbalik: 'Putus asa sesaat, tapi cahaya masih ada.' },
  { nama: 'The Moon', emoji: '🌕', tegak: 'Ada hal yang belum jelas, hati-hati dengan ilusi.', terbalik: 'Kebingungan mulai reda, kebenaran mulai terlihat.' },
  { nama: 'The Sun', emoji: '☀️', tegak: 'Kebahagiaan, kejelasan, dan energi positif.', terbalik: 'Optimisme yang berlebihan, atau kebahagiaan yang tertunda.' },
  { nama: 'Judgement', emoji: '🎺', tegak: 'Panggilan untuk bangkit dan memulai babak baru.', terbalik: 'Ragu untuk berubah, atau menyesali masa lalu.' },
  { nama: 'The World', emoji: '🌍', tegak: 'Pencapaian dan penyelesaian sebuah siklus.', terbalik: 'Belum tuntas, masih ada satu langkah lagi.' },
]

const handlers = {
  tarot: async ({ args, reply }) => {
    const card = pick(CARDS)
    const terbalik = Math.random() < 0.3 // peluang 30% kartu terbalik
    const posisi = terbalik ? 'Terbalik 🔄' : 'Tegak ⬆️'
    const makna = terbalik ? card.terbalik : card.tegak
    const tanya = args.join(' ').trim()

    const teks = [
      '🔮 *KARTU TAROT LOP-BOT* 🔮',
      '━━━━━━━━━━━━━━━━━━',
      tanya ? `❓ Pertanyaan: _${tanya}_` : '❓ Pertanyaan: _(ambil saja takdirmu)_',
      '',
      `${card.emoji} *${card.nama}*`,
      `Posisi: ${posisi}`,
      '',
      `📜 ${makna}`,
      '',
      '━━━━━━━━━━━━━━━━━━',
      '✨ _Tarot hanya hiburan, keputusan tetap di tanganmu._',
    ].join('\n')

    await reply(teks)
  },
}

module.exports = { handlers }
