const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys')
const pino = require('pino')
const readline = require('readline')
const config = require('./config')
const handlers = require('./commands')
const groupModule = require('./group')

Object.assign(
  handlers,
  groupModule.handlers,
  require('./menu').handlers,
  require('./tarot').handlers,
  require('./download').handlers,
  require('./hiddenmenu').handlers,
  require('./teksgambar').handlers,
  require('./stiker').handlers,
  require('./teksstiker').handlers,
  require('./toimg').handlers,
  require('./help').handlers,
  require('./useful').handlers,
  require('./shutdown').handlers,
  require('./flush').handlers,
  require('./value').handlers
)
const { loadBanned, getNumber } = groupModule

const logger = pino({ level: 'silent' })
const sentIds = new Set()
const lastUse = new Map()
const metaCache = new Map()
const META_TTL = 60_000

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  )
}

function getText(msg) {
  const m = msg.message?.ephemeralMessage?.message ?? msg.message
  return (
    m?.conversation ||
    m?.extendedTextMessage?.text ||
    m?.imageMessage?.caption ||
    m?.videoMessage?.caption ||
    ''
  )
}

const isAdminP = (p) => p?.admin === 'admin' || p?.admin === 'superadmin'

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth')
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    logger,
    browser: ['Ubuntu', 'Chrome', '120.0.0'],
  })

  const isSelfChat = (jid) => {
    const myIds = [sock.user?.id, sock.user?.lid].filter(Boolean).map(getNumber)
    return myIds.includes(getNumber(jid))
  }

  const getMeta = async (jid) => {
    const cached = metaCache.get(jid)
    if (cached && Date.now() - cached.at < META_TTL) return cached.data
    const data = await sock.groupMetadata(jid)
    metaCache.set(jid, { data, at: Date.now() })
    return data
  }

  const findParticipant = (meta, numbers) =>
    meta?.participants.find((p) =>
      [p.id, p.lid].filter(Boolean).some((x) => numbers.includes(getNumber(x)))
    )

  if (!sock.authState.creds.registered) {
    const nomor = (await ask('Masukkan nomor WA kamu (contoh 628123456789): ')).replace(/\D/g, '')
    await new Promise((r) => setTimeout(r, 3000))
    const kode = await sock.requestPairingCode(nomor)
    console.log(`\n🔑 Kode pairing kamu: ${kode}`)
    console.log('WhatsApp > Perangkat tertaut > Tautkan perangkat > Tautkan dengan nomor telepon\n')
  }

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'open') console.log(`✅ ${config.botName} terhubung!`)

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode
      if (statusCode === DisconnectReason.loggedOut) {
        console.log('❌ Sesi logout. Hapus folder auth/ lalu jalankan ulang.')
        process.exit(0)
      }
      console.log('🔄 Koneksi putus, mencoba menyambung ulang...')
      startBot()
    }
  })

  sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
    if (action !== 'add') return
    const banned = loadBanned()
    const hit = participants.filter((p) => banned.includes(getNumber(p)))
    if (!hit.length) return
    try {
      await sock.groupParticipantsUpdate(id, hit, 'remove')
      console.log(`🔨 Auto-kick anggota yang di-ban di ${id}`)
    } catch (e) {
      console.error('Gagal auto-kick:', e.message)
    }
  })

  const send = async (jid, content, opts) => {
    const res = await sock.sendMessage(jid, content, opts)
    if (res?.key?.id) {
      sentIds.add(res.key.id)
      if (sentIds.size > 500) sentIds.clear()
    }
    return res
  }

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return

    for (const msg of messages) {
      if (!msg.message) continue
      if (sentIds.has(msg.key.id)) continue

      const jid = msg.key.remoteJid
      const isGroup = jid.endsWith('@g.us')
      const text = getText(msg).trim()
      if (!text.startsWith(config.prefix)) continue

      if (!isGroup && !(msg.key.fromMe ? isSelfChat(jid) : [jid, msg.key.remoteJidAlt].filter(Boolean).map(getNumber).some((n) => config.owners.includes(n)))) continue

      const senderJid = msg.key.fromMe
        ? sock.user.id
        : isGroup
          ? msg.key.participant
          : jid
      const senderNums = [senderJid, msg.key.participantAlt].filter(Boolean).map(getNumber)
      const isOwner = msg.key.fromMe || senderNums.some((n) => config.owners.includes(n))

      let isAdmin = false
      let isBotAdmin = false
      if (isGroup) {
        const meta = await getMeta(jid).catch(() => null)
        isAdmin = isAdminP(findParticipant(meta, senderNums))
        isBotAdmin = isAdminP(findParticipant(meta, [getNumber(sock.user.id), getNumber(sock.user.lid)]))
      }

      const [rawCmd, ...args] = text.slice(config.prefix.length).split(/\s+/)
      const cmd = rawCmd.toLowerCase(); console.log('[CMD]', cmd)
      const handler = handlers[cmd]
      if (!handler) continue

      const level = config.permissions[cmd] || 'all'
      if (level === 'owner' && !isOwner) continue
      if (level === 'admin' && !isOwner && !isAdmin) continue

      const key = senderNums[0]
      const now = Date.now()
      if (!isOwner && now - (lastUse.get(key) || 0) < config.cooldownMs) continue
      lastUse.set(key, now)

      const reply = (t) => send(jid, { text: t }, { quoted: msg })

      try {
        await handler({
          sock, msg, jid, args, reply, send,
          isGroup, isOwner, isAdmin, isBotAdmin,
        })
      } catch (err) {
        console.error(`Error di !${cmd}:`, err)
        await reply(require('./messages').error)
      }
    }
  })
}

startBot()
