const { spawn } = require('child_process')
const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const config = require('./config')

const P = config.prefix

// Stiker webp -> PNG (frame pertama), lewat ffmpeg
function webpKePng(buf) {
  return new Promise((resolve, reject) => {
    const ff = spawn('ffmpeg', [
      '-y', '-loglevel', 'error',
      '-i', 'pipe:0',
      '-frames:v', '1',
      '-f', 'image2',
      '-c:v', 'png',
      'pipe:1',
    ])
    const out = []
    let err = ''
    ff.stdout.on('data', (d) => out.push(d))
    ff.stderr.on('data', (d) => (err += d))
    ff.stdin.on('error', () => {})
    ff.on('error', reject)
    ff.on('close', (code) =>
      code === 0 && out.length
        ? resolve(Buffer.concat(out))
        : reject(new Error(err || 'ffmpeg gagal'))
    )
    ff.stdin.end(buf)
  })
}

async function toimg({ msg, jid, sock, send, reply }) {
  const ctxInfo = msg.message?.extendedTextMessage?.contextInfo
  const quoted = ctxInfo?.quotedMessage
  const stiker = msg.message?.stickerMessage || quoted?.stickerMessage

  if (!stiker) {
    return reply(`⛔ *FORMAT SALAH*\nBalas stiker dengan ${P}toimg`)
  }

  try {
    const wrapper = msg.message?.stickerMessage
      ? msg
      : { key: { remoteJid: jid, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: quoted }

    const buf = await downloadMediaMessage(wrapper, 'buffer', {}, {
      reuploadRequest: sock.updateMediaMessage,
    })
    const png = await webpKePng(buf)
    await send(jid, { image: png }, { quoted: msg })
  } catch (err) {
    console.error('Error di !toimg:', err.message.split('\n')[0])
    await reply('❌ *GAGAL*\nStiker tidak bisa diubah jadi gambar. Coba stiker lain.')
  }
}

const handlers = {
  toimg,
  stickertoimg: toimg,
}

module.exports = { handlers }
