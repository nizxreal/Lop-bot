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
const groupFeatures = require('./groupFeatures')
const { getGlobalSettings, saveGroupList } = require('./db')

Object.assign(
  handlers,
  groupModule.handlers,
  groupFeatures.handlers,
  require('./menu').handlers,
  require('./lopbot').handlers,
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
  require('./value').handlers,
  require('./profile').handlers
)
const { getNumber } = groupModule
const logger = pino({ level: 'silent' })
const sentIds = new Set()
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
  }

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    if (connection === 'open') {
      console.log(`✅ Lop-Bot terhubung ke WhatsApp!`)
      try {
        const chats = await sock.groupFetchAllParticipating()
        const list = Object.values(chats).map(g => ({
          id: g.id,
          subject: g.subject,
          membersCount: g.participants ? g.participants.length : 0
        }))
        saveGroupList(list)
        console.log(`📋 Sinkronisasi ${list.length} grup ke Dashboard Web!`)
      } catch (err) {
        console.error('Gagal sinkron grup:', err.message)
      }
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode
      if (statusCode === DisconnectReason.loggedOut) {
        console.log('❌ Sesi logout.')
        process.exit(0)
      }
      startBot()
    }
  })

  sock.ev.on('group-participants.update', async (update) => {
    await groupFeatures.handleParticipantsUpdate(sock, update)
  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return

    for (const msg of messages) {
      if (!msg.message) continue
      if (sentIds.has(msg.key.id)) continue

      const globalSettings = getGlobalSettings()
      const dynamicPrefix = globalSettings.prefix || config.prefix

      const jid = msg.key.remoteJid
      const isGroup = jid.endsWith('@g.us')
      const text = getText(msg).trim()

      if (globalSettings.autoMute && jid) {
        sock.chatModify({ mute: 8 * 3600 * 1000 }, jid).catch(() => {})
      }

      const senderJid = msg.key.fromMe ? sock.user.id : isGroup ? msg.key.participant : jid
      const senderNums = [senderJid, msg.key.participantAlt].filter(Boolean).map(getNumber)
      const isOwner = msg.key.fromMe || senderNums.some((n) => config.owners.includes(n))

      let isAdmin = false
      let isBotAdmin = false
      if (isGroup) {
        const meta = await getMeta(jid).catch(() => null)
        isAdmin = isAdminP(findParticipant(meta, senderNums))
        isBotAdmin = isAdminP(findParticipant(meta, [getNumber(sock.user.id), getNumber(sock.user.lid)]))
      }

      const violated = await groupFeatures.handleGroupMessages({
        sock, msg, jid, text, isGroup, isAdmin, isBotAdmin, senderJid
      })
      if (violated) continue

      if (!text.startsWith(dynamicPrefix)) continue

      const [rawCmd, ...args] = text.slice(dynamicPrefix.length).split(/\s+/)
      const cmd = rawCmd.toLowerCase()
      const handler = handlers[cmd]
      if (!handler) continue

      const level = config.permissions[cmd] || 'all'
      if (level === 'owner' && !isOwner) continue
      if (level === 'admin' && !isOwner && !isAdmin) continue

      try {
        await handler({ sock, msg, jid, args, reply: (t) => sock.sendMessage(jid, { text: t }, { quoted: msg }), isGroup, isOwner, isAdmin, isBotAdmin })
      } catch (err) {
        console.error(`Error di !${cmd}:`, err)
      }
    }
  })
}

startBot()
