const { getGroupSettings, updateGroupSettings } = require('./db')

const userMsgTracker = new Map() // Anti-spam tracker

async function handleGroupMessages({ sock, msg, jid, text, isGroup, isAdmin, isBotAdmin, senderJid }) {
  if (!isGroup) return false
  const config = getGroupSettings(jid)

  // 1. Anti-Spam (Bypass Admin)
  if (config.antiSpamEnabled && !isAdmin) {
    const now = Date.now()
    const key = `${jid}_${senderJid}`
    const timestamps = (userMsgTracker.get(key) || []).filter(t => now - t < config.spamWindowSec * 1000)
    timestamps.push(now)
    userMsgTracker.set(key, timestamps)

    if (timestamps.length > config.spamMaxMsgs) {
      if (isBotAdmin) {
        await sock.sendMessage(jid, { delete: msg.key })
      }
      return true
    }
  }

  // 2. Anti-Link (Bypass Admin)
  const urlRegex = /(https?:\/\/[^\s]+|chat\.whatsapp\.com\/[^\s]+)/gi
  if (config.antiLinkEnabled && !isAdmin && urlRegex.test(text)) {
    const foundUrls = text.match(urlRegex) || []
    const isWhitelisted = foundUrls.every(url => 
      (config.allowedDomains || []).some(domain => url.includes(domain))
    )

    if (!isWhitelisted) {
      if (config.antiLinkAction === 'delete' && isBotAdmin) {
        await sock.sendMessage(jid, { delete: msg.key })
      } else if (config.antiLinkAction === 'kick' && isBotAdmin) {
        await sock.sendMessage(jid, { delete: msg.key })
        await sock.groupParticipantsUpdate(jid, [senderJid], 'remove')
      } else if (config.antiLinkAction === 'warn') {
        if (isBotAdmin) await sock.sendMessage(jid, { delete: msg.key })
        
        const currentWarn = (config.warnings[senderJid] || 0) + 1
        config.warnings[senderJid] = currentWarn
        updateGroupSettings(jid, { warnings: config.warnings })

        await sock.sendMessage(jid, {
          text: `⚠️ @${senderJid.split('@')[0]} mendapatkan peringatan (${currentWarn}/${config.maxWarnings}) karena mengirimkan tautan terlarang!`,
          mentions: [senderJid]
        })

        if (currentWarn >= config.maxWarnings && isBotAdmin) {
          delete config.warnings[senderJid]
          updateGroupSettings(jid, { warnings: config.warnings })
          await sock.groupParticipantsUpdate(jid, [senderJid], 'remove')
        }
      }
      return true
    }
  }

  return false
}

// Handler Welcome & Goodbye
async function handleParticipantsUpdate(sock, { id, participants, action }) {
  const config = getGroupSettings(id)
  const meta = await sock.groupMetadata(id).catch(() => null)
  const groupName = meta ? meta.subject : 'Grup'

  for (const participant of participants) {
    if (action === 'add' && config.welcomeEnabled) {
      const msgText = config.welcomeMsg
        .replace(/@user/g, `@${participant.split('@')[0]}`)
        .replace(/\{\$group\}/g, groupName)
      await sock.sendMessage(id, { text: msgText, mentions: [participant] })
    } else if (action === 'remove' && config.goodbyeEnabled) {
      const msgText = config.goodbyeMsg
        .replace(/@user/g, `@${participant.split('@')[0]}`)
        .replace(/\{\$group\}/g, groupName)
      await sock.sendMessage(id, { text: msgText, mentions: [participant] })
    }
  }
}

// Handlers Command Grup Tambahan (.rules, .poll, .warn)
const handlers = {
  rules: async ({ reply, jid }) => {
    const config = getGroupSettings(jid)
    await reply(`📜 *ATURAN GRUP*\n──────────────────\n${config.rules}`)
  },
  warn: async ({ msg, reply, jid, isAdmin, isBotAdmin, sock }) => {
    if (!isAdmin) return reply('❌ Fitur ini khusus Admin.')
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
    if (!mentioned.length) return reply('Tag member yang ingin diberi peringatan.')
    
    const target = mentioned[0]
    const config = getGroupSettings(jid)
    const currentWarn = (config.warnings[target] || 0) + 1
    config.warnings[target] = currentWarn
    updateGroupSettings(jid, { warnings: config.warnings })

    await reply(`⚠️ @${target.split('@')[0]} diberi peringatan oleh Admin (${currentWarn}/${config.maxWarnings}).`)
    if (currentWarn >= config.maxWarnings && isBotAdmin) {
      delete config.warnings[target]
      updateGroupSettings(jid, { warnings: config.warnings })
      await sock.groupParticipantsUpdate(jid, [target], 'remove')
    }
  },
  poll: async ({ sock, jid, args, reply }) => {
    const raw = args.join(' ')
    const parts = raw.split('|').map(s => s.trim()).filter(Boolean)
    if (parts.length < 3) return reply('Gunakan format: .poll Judul Polling | Pilihan 1 | Pilihan 2')
    
    const [name, ...options] = parts
    await sock.sendMessage(jid, {
      poll: { name, values: options, selectableCount: 1 }
    })
  }
}

module.exports = { handleGroupMessages, handleParticipantsUpdate, handlers }
