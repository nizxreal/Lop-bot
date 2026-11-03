const { spawn } = require('child_process')
const config = require('./config')

const P = config.prefix
const MAX_CHAR = 200

// Membuat PNG dari teks memakai ImageMagick. Argumen dikirim sebagai array, tanpa shell.
function render(teks) {
  return new Promise((resolve, reject) => {
    const aman = teks.replace(/%/g, '%%')
    const args = [
      '-background', '#1e1e2e',
      '-fill', '#ffffff',
      '-size', '800x',
      '-gravity', 'center',
      '-pointsize', '36',
      `caption:${aman}`,
      '-bordercolor', '#1e1e2e',
      '-border', '30',
      'png:-',
    ]
    const p = spawn('convert', args)
    const out = []
    let err = ''
    p.stdout.on('data', (d) => out.push(d))
    p.stderr.on('data', (d) => (err += d))
    p.on('error', reject)
    p.on('close', (code) =>
      code === 0 ? resolve(Buffer.concat(out)) : reject(new Error(err || 'convert gagal'))
    )
  })
}

const handlers = {
  teksgambar: async ({ args, reply, send, jid, msg }) => {
    const teks = args.join(' ').trim()

    if (!teks) {
      return reply(`⛔ *FORMAT SALAH*\nContoh: ${P}teksgambar Selamat pagi semua`)
    }
    if (teks.length > MAX_CHAR) {
      return reply(`⛔ *TERLALU PANJANG*\nMaksimal ${MAX_CHAR} karakter.`)
    }

    try {
      const png = await render(teks)
      await send(jid, { image: png }, { quoted: msg })
    } catch (err) {
      console.error('Error di !teksgambar:', err.message)
      await reply('❌ *GAGAL*\nGambar tidak bisa dibuat. Pastikan ImageMagick sudah terpasang.')
    }
  },
}

module.exports = { handlers }
