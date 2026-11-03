const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
const config = require('./config')
const { toWebp, tambahInfo } = require('./stiker')

const P = config.prefix
const MAX_CHAR = 200

// Font di folder fonts/. Kalau file tidak ada atau tidak bisa dibaca, dipakai font default.
const FONT_FILE = path.join(__dirname, 'fonts', 'Inter-Regular.ttf')
const FONT = fs.existsSync(FONT_FILE) ? FONT_FILE : null

// Pengaturan efek burik. Semakin kecil BURIK_SIZE, semakin buram.
const BURIK_SIZE = '160x160!'
const BURIK_QUALITY = '25'

function jalankanConvert(args, input) {
  return new Promise((resolve, reject) => {
    const p = spawn('convert', args)
    const out = []
    let err = ''
    p.stdin.on('error', () => {})
    p.stdout.on('data', (d) => out.push(d))
    p.stderr.on('data', (d) => (err += d))
    p.on('error', reject)
    p.on('close', (code) =>
      code === 0 ? resolve(Buffer.concat(out)) : reject(new Error(err || 'convert gagal'))
    )
    p.stdin.end(input || undefined)
  })
}

// Teks -> PNG latar putih, tulisan hitam, rata kiri.
async function render(teks) {
  let isi = teks.split('|').map((s) => s.trim()).join('\n').replace(/%/g, '%%')
  if (isi.startsWith('@')) isi = ' ' + isi

  const buat = (font) => [
    '-background', 'white',
    '-fill', 'black',
    ...(font ? ['-font', font] : []),
    '-size', '480x',
    '-gravity', 'West',
    '-pointsize', '110',
    `caption:${isi}`,
    '-resize', '480x480>',
    '-background', 'white',
    '-gravity', 'center',
    '-extent', '512x512',
    'png:-',
  ]

  if (FONT) {
    try {
      return await jalankanConvert(buat(FONT))
    } catch (err) {
      console.error('Font gagal dibaca, memakai font default:', err.message.split('\n')[0])
    }
  }
  return jalankanConvert(buat(null))
}

// Efek meme: diperkecil, diperbesar lagi, diberi noise, lalu dikompres JPEG kualitas rendah
async function burikin(png) {
  return jalankanConvert(
    [
      'png:-',
      '-filter', 'Point',
      '-resize', BURIK_SIZE,
      '-resize', '512x512!',
      '-attenuate', '0.4',
      '+noise', 'Gaussian',
      '-quality', BURIK_QUALITY,
      'jpeg:-',
    ],
    png
  )
}

async function textstiker({ args, reply, send, jid, msg }) {
  const teks = args.join(' ').trim()

  if (!teks) {
    return reply(`⛔ *FORMAT SALAH*\nContoh: ${P}textstiker baris atas | baris bawah`)
  }
  if (teks.length > MAX_CHAR) {
    return reply(`⛔ *TERLALU PANJANG*\nMaksimal ${MAX_CHAR} karakter.`)
  }

  try {
    const png = await render(teks)
    const jpg = await burikin(png)
    const webp = await tambahInfo(await toWebp(jpg))
    await send(jid, { sticker: webp }, { quoted: msg })
  } catch (err) {
    console.error('Error di !textstiker:', err.message.split('\n')[0])
    await reply('❌ *GAGAL*\nStiker teks tidak bisa dibuat. Pastikan ImageMagick dan ffmpeg terpasang.')
  }
}

const handlers = {
  textstiker,
  textsticker: textstiker,
}

module.exports = { handlers }
