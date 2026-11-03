const { spawn } = require('child_process')
const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const webp = require('node-webpmux')

// Info yang tampil di bagian bawah stiker (nama paket dan pembuat)
const PACK = {
  packname: 'Lop-bot',
  author: 'LopSalvatore · NizxReal',
}

// Gambar -> webp 512x512 lewat ffmpeg
function toWebp(buf) {
  return new Promise((resolve, reject) => {
    const ff = spawn('ffmpeg', [
      '-y', '-i', 'pipe:0',
      '-vf', 'scale=512:512:force_original_aspect_ratio=increase,crop=512:512,fps=15',
      '-c:v', 'libwebp', '-q:v', '70', '-loop', '0', '-an',
      '-f', 'webp', 'pipe:1',
    ])
    const out = []
    ff.stdout.on('data', (d) => out.push(d))
    ff.stdin.on('error', () => {})
    ff.stderr.resume()
    ff.on('close', (code) =>
      code === 0 ? resolve(Buffer.concat(out)) : reject(new Error('ffmpeg gagal'))
    )
    ff.stdin.end(buf)
  })
}

// Format EXIF yang dibaca WhatsApp untuk nama paket dan pembuat
function buatExif(info) {
  const header = Buffer.from([
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00,
    0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
  ])
  const json = Buffer.from(
    JSON.stringify({
      'sticker-pack-id': 'lop-bot-pack-1',
      'sticker-pack-name': info.packname,
      'sticker-pack-publisher': info.author,
      emojis: ['🤖'],
    }),
    'utf-8'
  )
  const exif = Buffer.concat([header, json])
  exif.writeUIntLE(json.length, 14, 4)
  return exif
}

async function tambahInfo(buf) {
  const img = new webp.Image()
  await img.load(buf)
  img.exif = buatExif(PACK)
  return img.save(null)
}

async function stiker({ msg, jid, sock, send, reply }) {
  const ctxInfo = msg.message?.extendedTextMessage?.contextInfo
  const quoted = ctxInfo?.quotedMessage
  const img = msg.message?.imageMessage || quoted?.imageMessage

  if (!img) {
    return reply('Kirim gambar dengan caption *.sticker*, atau reply gambar dengan *.sticker*.')
  }

  try {
    const wrapper = msg.message?.imageMessage
      ? msg
      : { key: { remoteJid: jid, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: quoted }

    const buf = await downloadMediaMessage(wrapper, 'buffer', {}, {
      reuploadRequest: sock.updateMediaMessage,
    })
    const webpBuf = await tambahInfo(await toWebp(buf))
    await send(jid, { sticker: webpBuf }, { quoted: msg })
  } catch (err) {
    console.error('Error di !sticker:', err.message)
    await reply('❌ *GAGAL*\nStiker tidak bisa dibuat. Pastikan ffmpeg terpasang.')
  }
}

module.exports = { handlers: { stiker, sticker: stiker }, toWebp, tambahInfo }
