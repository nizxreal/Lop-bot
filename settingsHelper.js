const fs = require('fs')

function getSettings() {
  try {
    if (!fs.existsSync('./settings.json')) return {}
    return JSON.parse(fs.readFileSync('./settings.json', 'utf-8'))
  } catch (e) {
    return {}
  }
}

function saveSettings(data) {
  fs.writeFileSync('./settings.json', JSON.stringify(data, null, 2))
}

function parsePlaceholders(template, data = {}) {
  let result = template || ''
  const map = {
    '$pushname': data.pushname || 'Pengguna',
    '$botname': data.botname || 'Lop-Bot',
    '$prefix': data.prefix || '.',
    '$category': data.category || '',
    '$totalfitur': data.totalfitur || '0',
    '$uptime': data.uptime || '0m',
    '$runtime': data.uptime || '0m',
    '$isPrem': data.isPrem ? 'Ya' : 'Tidak',
    '$ownernumber': data.ownernumber || '',
    '$isPublic': data.isPublic ? 'Public' : 'Self',
    '$isGroup': data.isGroup ? 'Grup' : 'Private',
    '$isOwner': data.isOwner ? 'Ya' : 'Tidak',
    '$usernumber': data.usernumber || ''
  }

  for (const [key, value] of Object.entries(map)) {
    result = result.replaceAll(key, value)
  }
  return result
}

module.exports = { getSettings, saveSettings, parsePlaceholders }
