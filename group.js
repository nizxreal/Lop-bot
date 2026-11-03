const fs = require('fs')
const path = require('path')
const config = require('./config')

const BAN_FILE = path.join(__dirname, 'banned.json')
const getNumber = (jid = '') => jid.split('@')[0].split(':')[0]

function loadBanned() {
  try {
    return JSON.parse(fs.readFileSync(BAN_FILE, 'utf8'))
  } catch {
    return []
  }
}

function saveBanned(list) {
  fs.writeFileSync(BAN_FILE, JSON.stringify(list, null, 2))
}

// Ambil target dari @mention, atau dari pesan yang di-reply
function getTargets(msg) {
  const ctx =
    msg.message?.extendedTextMessage?.contextInfo ||
    msg.message?.imageMessage?.contextInfo
  if (ctx?.mentionedJid?.length) return ctx.mentionedJid
  if (ctx?.participant) return [ctx.participant]
  return []
}

// Jangan pernah mengeluarkan diri sendiri atau owner
function filterTargets(targets, sock) {
  const me = getNumber(sock.user.id)
  return targets.filter((t) => {
    const n = getNumber(t)
    return n !== me && !config.owners.includes(n)
  })
}

function checkGroupAndBotAdmin(ctx) {
  if (!ctx.isGroup) return require('./messages').hanyaGrup
  if (!ctx.isBotAdmin) return require('./messages').botBukanAdmin
  return null
}

const handlers = {
  kick: async (ctx) => {
    const err = checkGroupAndBotAdmin(ctx)
    if (err) return ctx.reply(err)

    const targets = filterTargets(getTargets(ctx.msg), ctx.sock)
    if (!targets.length) {
      return ctx.reply('Format: *!kick @nama* atau reply pesan orang yang mau dikeluarkan.')
    }

    await ctx.sock.groupParticipantsUpdate(ctx.jid, targets, 'remove')
    await ctx.reply(`✅ ${targets.length} anggota dikeluarkan.`)
  },

  ban: async (ctx) => {
    const err = checkGroupAndBotAdmin(ctx)
    if (err) return ctx.reply(err)

    const targets = filterTargets(getTargets(ctx.msg), ctx.sock)
    if (!targets.length) {
      return ctx.reply('Format: *!ban @nama* atau reply pesan orang yang mau di-ban.')
    }

    const list = loadBanned()
    for (const t of targets) {
      const n = getNumber(t)
      if (!list.includes(n)) list.push(n)
    }
    saveBanned(list)

    await ctx.sock.groupParticipantsUpdate(ctx.jid, targets, 'remove')
    await ctx.reply(`🔨 ${targets.length} anggota di-ban dan dikeluarkan.`)
  },

  unban: async (ctx) => {
    const targets = getTargets(ctx.msg)
    if (!targets.length) {
      return ctx.reply('Format: *!unban @nama* atau reply pesan orangnya.')
    }

    const unbanNumbers = targets.map(getNumber)
    const list = loadBanned().filter((n) => !unbanNumbers.includes(n))
    saveBanned(list)
    await ctx.reply(`♻️ ${unbanNumbers.length} nomor dihapus dari daftar ban.`)
  },

  tagall: async (ctx) => {
    if (!ctx.isGroup) return ctx.reply(require('./messages').hanyaGrup)
    if (!ctx.isBotAdmin) return ctx.reply(require('./messages').botBukanAdmin)

    const meta = await ctx.sock.groupMetadata(ctx.jid)
    const ids = meta.participants.map((p) => p.id)
    const pesan = ctx.args.join(' ') || 'Perhatian semua!'
    const daftar = ids.map((id) => '@' + getNumber(id)).join(' ')

    await ctx.sock.sendMessage(ctx.jid, {
      text: `📢 ${pesan}\n\n${daftar}`,
      mentions: ids,
    })
  },
}

module.exports = { handlers, loadBanned, getNumber }
