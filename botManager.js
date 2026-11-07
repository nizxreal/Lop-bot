const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')
const pino = require('pino')
const fs = require('fs')
const path = require('path')
const config = require('./config')
const handlers = require('./commands')
const { getGlobalSettings } = require('./db')

// Hapus require modul lama yang sudah dihapus
// Hanya pertahankan core yang tersisa
const groupModule = require('./group')
const groupFeatures = require('./groupFeatures')

Object.assign(
  handlers,
  groupModule.handlers,
  groupFeatures.handlers
)

const { getNumber } = groupModule
const logger = pino({ level: 'silent' })
const sentIds = new Set()
const metaCache = new Map()
const META_TTL = 60_000

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

class BotManager {
  constructor() {
    this.sessions = new Map()
    this.statusMap = new Map()
  }

  getStatus(botId) {
    return this.statusMap.get(botId) || {
      id: botId,
      status: 'offline',
      phone: null,
      pairingCode: null,
      lastUpdated: Date.now()
    }
  }

  getAllBots() {
    const list = []
    for (const [id, stat] of this.statusMap.entries()) {
      list.push(stat)
    }
    return list
  }

  async startBot(botId = 'Bot1', targetPhone = null) {
    if (this.sessions.has(botId)) {
      return this.getStatus(botId)
    }

    const authFolder = path.join(__dirname, 'auth_' + botId)
    if (!fs.existsSync(authFolder)) {
      fs.mkdirSync(authFolder, { recursive: true })
    }

    const { state, saveCreds } = await useMultiFileAuthState(authFolder)
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
      version,
      auth: state,
      logger,
      browser: ['Ubuntu', 'Chrome', '120.0.0']
    })

    this.sessions.set(botId, sock)
    this.statusMap.set(botId, {
      id: botId,
      status: sock.authState.creds.registered ? 'connected' : 'pairing',
      phone: targetPhone || sock.user?.id?.split(':')[0] || null,
      pairingCode: null,
      lastUpdated: Date.now()
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

    if (!sock.authState.creds.registered && targetPhone) {
      setTimeout(async () => {
        try {
          const cleanPhone = targetPhone.replace(/\D/g, '')
          const code = await sock.requestPairingCode(cleanPhone)
          const cur = this.getStatus(botId)
          cur.pairingCode = code
          cur.status = 'pairing'
          cur.phone = cleanPhone
          this.statusMap.set(botId, cur)
          console.log(`[${botId}] Pairing Code untuk ${cleanPhone}: ${code}`)
        } catch (err) {
          console.error(`[${botId}] Gagal minta pairing code:`, err.message)
        }
      }, 3000)
    }

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
      const cur = this.getStatus(botId)

      if (connection === 'open') {
        cur.status = 'connected'
        cur.phone = sock.user.id.split(':')[0]
        cur.pairingCode = null
        this.statusMap.set(botId, cur)
        console.log(`[${botId}] Terhubung ke WhatsApp!`)

        try {
          const chats = await sock.groupFetchAllParticipating()
          const list = Object.values(chats).map((g) => ({
            id: g.id,
            subject: g.subject,
            membersCount: g.participants ? g.participants.length : 0
          }))
          saveGroupList(list)
        } catch (err) {}
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode
        if (statusCode === DisconnectReason.loggedOut) {
          cur.status = 'logged_out'
          this.sessions.delete(botId)
          this.statusMap.set(botId, cur)
          return
        }
        cur.status = 'reconnecting'
        this.statusMap.set(botId, cur)
        this.sessions.delete(botId)
        setTimeout(() => this.startBot(botId, cur.phone), 3000)
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

        // Check custom menu first (the user's private override)
        let handler = handlers[cmd]
        let isCustom = false

        if (!handler && fs.existsSync('./custom_menu.json')) {
          const customMenu = JSON.parse(fs.readFileSync('./custom_menu.json', 'utf8'))
          const customCmd = customMenu.find(c => c.name === cmd)
          if (customCmd) {
            handler = async (ctx) => {
              const req = {
                reply: ctx.reply,
                isGroup: ctx.isGroup,
                sender: ctx.msg.key.participant || ctx.msg.key.remoteJid,
                jid: ctx.jid
              }
              eval(customCmd.func)
            }
            isCustom = true
          }
        }

        if (!handler) continue

        const level = config.permissions[cmd] || 'all'
        if (!isCustom) {
            if (level === 'owner' && !isOwner) continue
            if (level === 'admin' && !isOwner && !isAdmin) continue
        }

        try {
          await handler({
            sock,
            msg,
            jid,
            args,
            reply: (t) => sock.sendMessage(jid, { text: t }, { quoted: msg }),
            isGroup,
            isOwner,
            isAdmin,
            isBotAdmin
          })
        } catch (err) {
          console.error(`[${botId}] Error di !${cmd}:`, err)
        }
      }
    })

    return this.getStatus(botId)
  }

  async stopBot(botId) {
    const sock = this.sessions.get(botId)
    if (sock) {
      try {
        await sock.end()
      } catch (e) {}
      this.sessions.delete(botId)
    }
    const cur = this.getStatus(botId)
    cur.status = 'stopped'
    cur.pairingCode = null
    this.statusMap.set(botId, cur)
    return cur
  }

  async logoutBot(botId) {
    const sock = this.sessions.get(botId)
    if (sock) {
      try {
        await sock.logout()
      } catch (e) {}
      this.sessions.delete(botId)
    }
    const authFolder = path.join(__dirname, 'auth_' + botId)
    if (fs.existsSync(authFolder)) {
      fs.rmSync(authFolder, { recursive: true, force: true })
    }
    this.statusMap.delete(botId)
    return { status: true, message: `Slot ${botId} berhasil dihapus.` }
  }
}

const botManager = new BotManager()

// Auto restore session yang sudah tersimpan
fs.readdirSync(__dirname).forEach((file) => {
  if (file.startsWith('auth_') && fs.lstatSync(path.join(__dirname, file)).isDirectory()) {
    const botId = file.replace('auth_', '')
    botManager.startBot(botId).catch(() => {})
  }
})

module.exports = botManager
