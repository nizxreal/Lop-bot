const config = require('./config')
const { spawn } = require('child_process')

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

const MENU = `╭━━━ *${config.botName}* ━━━╮
┃
┃ 🎉 *FUN*
┃ !dadu [sisi]       → lempar dadu
┃ !koin              → lempar koin
┃ !slot              → main slot machine
┃ !jodoh A & B       → cek kecocokan
┃ !apakah <tanya>    → tanya magic 8-ball
┃ !quote             → kata bijak
┃ !ramal             → ramalan hari ini
┃
┃ 🛠️ *USEFUL*
┃ !hitung <expr>     → kalkulator
┃ !cuaca <kota>      → cuaca sekarang
┃ !waktu             → jam WIB sekarang
┃ !ingatkan <menit> <pesan>
┃ !stiker            → kirim/reply gambar jadi stiker
┃
┃ ⚙️ *LAINNYA*
┃ !ping              → cek bot aktif
┃ !info              → info bot
┃ !menu              → tampilkan menu ini
┃
╰━━━━━━━━━━━━━━━━━━━━╯`

const EIGHT_BALL = [
  'Ya, pasti.', 'Sepertinya iya.', 'Bisa jadi.', 'Coba tanya lagi nanti.',
  'Jangan harap banyak.', 'Tidak.', 'Sangat meragukan.', 'Iya, tanpa keraguan!',
]

const SLOT_ICONS = ['🍒', '🍋', '🔔', '⭐', '💎', '7️⃣']

// Konversi gambar ke stiker webp 512x512 pakai ffmpeg
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

const handlers = {
  // ===== FUN =====
  dadu: async ({ args, reply }) => {
    const sisi = Math.min(Math.max(parseInt(args[0]) || 6, 2), 100)
    await reply(`🎲 Dadu ${sisi} sisi: *${randInt(1, sisi)}*`)
  },

  koin: async ({ reply }) => {
    await reply(`🪙 Hasilnya: *${pick(['Kepala', 'Ekor'])}*`)
  },

  slot: async ({ reply }) => {
    const [a, b, c] = [pick(SLOT_ICONS), pick(SLOT_ICONS), pick(SLOT_ICONS)]
    const menang = a === b && b === c
    await reply(`🎰 | ${a} | ${b} | ${c} |\n\n${menang ? '🎉 JACKPOT!' : 'Coba lagi!'}`)
  },

  jodoh: async ({ args, reply }) => {
    const [a, b] = args.join(' ').split('&').map((s) => s.trim())
    if (!a || !b) return reply('Format: *!jodoh Andi & Sari*')
    // Hasil deterministik: pasangan nama yang sama selalu dapat persentase sama
    const seed = [...(a + b).toLowerCase()].reduce((s, ch) => s + ch.charCodeAt(0), 0)
    await reply(`💘 *${a}* & *${b}*\nKecocokan: *${seed % 101}%*`)
  },

  apakah: async ({ args, reply }) => {
    if (!args.length) return reply('Format: *!apakah pertanyaanmu*')
    await reply(`🔮 ${pick(EIGHT_BALL)}`)
  },

  quote: async ({ reply }) => reply(`💬 _${pick(config.quotes)}_`),

  ramal: async ({ reply }) => reply(`🔮 *Ramalan hari ini*\n${pick(config.ramalan)}`),

  // ===== USEFUL =====
  hitung: async ({ args, reply }) => {
    const expr = args.join(' ').replace(/\^/g, '**')
    if (!expr || !/^[\d+\-*/().%\s]+$/.test(expr.replace(/\*\*/g, ''))) {
      return reply('Format: *!hitung 2+2*  (hanya angka dan + - * / % ( ) ^)')
    }
    try {
      const hasil = Function(`"use strict"; return (${expr})`)()
      await reply(`🧮 ${args.join(' ')} = *${hasil}*`)
    } catch {
      await reply('❌ Ekspresi tidak valid.')
    }
  },

  cuaca: async ({ args, reply }) => {
    const kota = args.join(' ')
    if (!kota) return reply('Format: *!cuaca Jakarta*')
    try {
      const res = await fetch(`https://wttr.in/${encodeURIComponent(kota)}?format=3&lang=id`)
      await reply(`🌤️ ${(await res.text()).trim()}`)
    } catch {
      await reply('❌ Gagal mengambil data cuaca.')
    }
  },

  waktu: async ({ reply }) => {
    const now = new Date().toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      dateStyle: 'full',
      timeStyle: 'long',
    })
    await reply(`🕒 ${now}`)
  },

  ingatkan: async ({ args, reply, send, jid }) => {
    const menit = parseFloat(args[0])
    const pesan = args.slice(1).join(' ')
    if (!menit || !pesan) return reply('Format: *!ingatkan 10 minum air*')
    await reply(`⏰ Oke, aku ingatkan ${menit} menit lagi.`)
    setTimeout(() => send(jid, { text: `⏰ *Pengingat:* ${pesan}` }), menit * 60_000)
  },

  stiker: async ({ msg, jid, sock, send, reply }) => {
    const { downloadMediaMessage } = require('@whiskeysockets/baileys')
    const ctxInfo = msg.message?.extendedTextMessage?.contextInfo
    const quoted = ctxInfo?.quotedMessage
    const img = msg.message?.imageMessage || quoted?.imageMessage
    if (!img) return reply('Kirim gambar dengan caption *!stiker*, atau reply gambar dengan *!stiker*.')

    try {
      const wrapper = msg.message?.imageMessage
        ? msg
        : { key: { remoteJid: jid, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: quoted }

      const buf = await downloadMediaMessage(wrapper, 'buffer', {}, {
        reuploadRequest: sock.updateMediaMessage,
      })
      const webp = await toWebp(buf)
      await send(jid, { sticker: webp }, { quoted: msg })
    } catch (e) {
      console.error(e)
      await reply('❌ Gagal membuat stiker. Pastikan ffmpeg sudah terinstal.')
    }
  },

  // ===== LAINNYA =====
  menu: async ({ reply }) => reply(MENU),

  ping: async ({ reply }) => reply(require('./messages').pong),

  info: async ({ reply }) => {
    const jam = Math.floor(process.uptime() / 3600)
    const menit = Math.floor((process.uptime() % 3600) / 60)
    const ram = (process.memoryUsage().rss / 1024 / 1024).toFixed(1)
    await reply(`🤖 *${config.botName}*\nUptime: ${jam} jam ${menit} menit\nRAM: ${ram} MB`)
  },
}

module.exports = handlers
