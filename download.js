const axios = require('axios')
const config = require('./config')

const MAX_BYTES = 16 * 1024 * 1024 // batas 16 MB
const SCRAPE_TIMEOUT = 40_000
const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

// Sumber per platform. Hanya metode yang ringan dan tidak mengevaluasi kode dari situs luar.
const SOURCES = {
  tiktok: {
    re: /https?:\/\/\S*(tiktok\.com|tt\.site)\S*/i,
    paths: ['tiktok/snaptik', 'tiktok/ssstik'],
    label: 'TikTok',
  },
  ig: {
    re: /https?:\/\/\S*instagram\.com\S*/i,
    paths: ['instagram/direct', 'instagram/snapsave', 'instagram/indown'],
    label: 'Instagram',
  },
  spotify: {
    re: /https?:\/\/open\.spotify\.com\S*/i,
    paths: ['spotify/spotmate', 'spotify/spotidown', 'spotify/soundloaders'],
    label: 'Spotify',
  },
}

let busy = false

const withTimeout = (p, ms) =>
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))])

// Coba sumber satu per satu sampai ada yang berhasil
async function scrapeWithFallback(paths, url) {
  for (const p of paths) {
    try {
      const mod = require(`@coflyn/scrapr/lib/${p}`)
      const res = await withTimeout(mod.scrape(url), SCRAPE_TIMEOUT)
      if (res?.status && res.result?.downloads?.some((d) => d.url)) return res.result
    } catch (err) {
      console.error(`Scraper ${p} gagal:`, err.message)
    }
  }
  return null
}

// Unduh ke memori, dibatasi 16 MB
async function unduh(url) {
  const res = await axios.get(url, {
    responseType: 'arraybuffer',
    maxContentLength: MAX_BYTES,
    maxBodyLength: MAX_BYTES,
    timeout: 60_000,
    headers: { 'User-Agent': UA },
  })
  return Buffer.from(res.data)
}

async function jalankan(kind, { args, reply, send, jid, msg: pesan }) {
  const src = SOURCES[kind]
  const url = (args[0] || '').trim()

  if (!url || !src.re.test(url)) {
    return reply(`⛔ *FORMAT SALAH*\nContoh: ${config.prefix}${kind} <link ${src.label}>`)
  }
  if (busy) {
    return reply('⏳ *SIBUK*\nMasih ada unduhan yang berjalan. Coba lagi sebentar.')
  }

  busy = true
  try {
    await reply(`⏳ *MENGAMBIL*\nSumber: ${src.label}`)

    const hasil = await scrapeWithFallback(src.paths, url)
    if (!hasil) {
      return reply(`❌ *GAGAL*\nSemua sumber ${src.label} tidak merespons. Coba lagi nanti.`)
    }
    if (hasil.type === 'playlist') {
      return reply('⛔ *DITOLAK*\nPlaylist belum didukung. Kirim link lagu satuan.')
    }

    const item = hasil.downloads.find((d) => d.url)
    const judul = String(hasil.title || src.label).slice(0, 200)
    const buf = await unduh(item.url)

    if (hasil.type === 'image') {
      await send(jid, { image: buf, caption: judul }, { quoted: pesan })
    } else if (hasil.type === 'audio') {
      await send(jid, { audio: buf, mimetype: 'audio/mpeg' }, { quoted: pesan })
    } else {
      await send(jid, { video: buf, caption: judul, mimetype: 'video/mp4' }, { quoted: pesan })
    }
  } catch (err) {
    console.error(`Error di !${kind}:`, err.message)
    await reply('❌ *GAGAL*\nFile tidak bisa dikirim. Pastikan link publik dan ukuran di bawah 16 MB.')
  } finally {
    busy = false
  }
}

const handlers = {
  tiktok: (c) => jalankan('tiktok', c),
  ig: (c) => jalankan('ig', c),
  spotify: (c) => jalankan('spotify', c),
}

module.exports = { handlers }
