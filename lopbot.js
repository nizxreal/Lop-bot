const { getGlobalSettings } = require('./db')
const config = require('./config')

const botStartTime = Date.now()

function getUptime() {
  const totalSeconds = Math.floor((Date.now() - botStartTime) / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${hours}j ${minutes}m ${seconds}d`
}

const handlers = {
  lopbot: async ({ sock, msg, jid, isOwner }) => {
    const globalSettings = getGlobalSettings()
    
    const pushName = msg.pushName || 'User'
    const botName = globalSettings.botName || 'Lop-Bot'
    const prefix = globalSettings.prefix || config.prefix || '.'
    const uptime = getUptime()
    const ownerStatus = isOwner ? 'Ya' : 'Tidak'
    const isPublicText = globalSettings.publicMode ? 'Publik' : 'Private'
    const ownerNumberText = globalSettings.ownerNumber || (config.owners && config.owners[0]) || '-'

    const categoryList = `📌 *GRUP & MODERASI*
• ${prefix}rules — Menampilkan aturan grup
• ${prefix}warn @user — Peringatan member
• ${prefix}poll Judul | Opt1 | Opt2 — Polling

🛠️ *UTILITY & TOOLS*
• ${prefix}stiker — Buat stiker
• ${prefix}toimg — Stiker ke gambar
• ${prefix}profile — Cek profil
• ${prefix}value — Cek nilai/status`

    let template = globalSettings.menuCaption || `🤖 *BOT INFO*\n• Nama : $botname\n• Mode : $isPublic\n• Uptime : $uptime\n• Prefix : $prefix\n• Owner : $ownernumber\n\n👤 *USER INFO*\n• Nama : $pushname\n• Owner : $isOwner\n\n📑 *KATEGORI*\n$category`

    const finalCaption = template
      .replace(/\$pushname/g, pushName)
      .replace(/\$botname/g, botName)
      .replace(/\$prefix/g, prefix)
      .replace(/\$uptime/g, uptime)
      .replace(/\$isPublic/g, isPublicText)
      .replace(/\$ownernumber/g, ownerNumberText)
      .replace(/\$isOwner/g, ownerStatus)
      .replace(/\$category/g, categoryList)

    const bannerUrl = globalSettings.bannerUrl || 'https://files.catbox.moe/k93y9i.jpg'
    const channelName = globalSettings.channelName || 'LopBot Official Channel'
    const channelJid = globalSettings.channelJid || '120363000000000000@newsletter'
    const channelLink = globalSettings.channelLink || 'https://whatsapp.com/channel/'

    const contextInfo = {
      isForwarded: true,
      forwardingScore: 999,
      forwardedNewsletterMessageInfo: {
        newsletterJid: channelJid,
        newsletterName: channelName,
        serverMessageId: 100
      },
      externalAdReply: {
        title: botName,
        body: 'CloudBot - WhatsApp Gateway',
        mediaType: 1,
        renderLargerThumbnail: true,
        thumbnailUrl: bannerUrl,
        sourceUrl: channelLink
      }
    }

    if (bannerUrl) {
      await sock.sendMessage(jid, {
        image: { url: bannerUrl },
        caption: finalCaption,
        contextInfo: contextInfo
      }, { quoted: msg })
    } else {
      await sock.sendMessage(jid, {
        text: finalCaption,
        contextInfo: contextInfo
      }, { quoted: msg })
    }
  }
}

module.exports = { handlers }
