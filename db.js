const fs = require('fs')
const DB_FILE = './database.json'

function initDB() {
  if (!fs.existsSync(DB_FILE)) {
    const defaultData = {
      global: {
        prefix: '.',
        botName: 'Lop-Bot',
        ownerNumber: '',
        bannerUrl: 'https://files.catbox.moe/k93y9i.jpg',
        channelName: 'LopBot Official Channel',
        channelJid: '120363000000000000@newsletter',
        channelLink: 'https://whatsapp.com/channel/',
        cooldownMs: 3000,
        publicMode: true,
        onlyGroup: false,
        onlyPrivate: false,
        antiCall: true,
        autoRead: false,
        autoBio: false,
        autoMute: false,
        menuCaption: "🤖 *BOT INFO*\n• Nama : $botname\n• Mode : $isPublic\n• Uptime : $uptime\n• Prefix : $prefix\n• Owner : $ownernumber\n\n👤 *USER INFO*\n• Nama : $pushname\n• Owner : $isOwner\n\n📑 *KATEGORI*\n$category"
      },
      users: {},
      groups: {},
      groupList: []
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2))
  }
}

function readDB() {
  initDB()
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'))
  } catch (e) {
    return { global: {}, users: {}, groups: {}, groupList: [] }
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2))
}

function saveGroupList(groups) {
  const db = readDB()
  db.groupList = groups
  writeDB(db)
}

function getGroupList() {
  const db = readDB()
  return db.groupList || []
}

function getGlobalSettings() {
  const db = readDB()
  return db.global || {}
}

function updateGlobalSettings(newSettings) {
  const db = readDB()
  db.global = { ...db.global, ...newSettings }
  writeDB(db)
  return db.global
}

function getGroupSettings(groupId) {
  const db = readDB()
  if (!db.groups[groupId]) {
    db.groups[groupId] = {
      welcomeEnabled: false,
      welcomeMsg: "Selamat datang @user di grup *{$group}*!",
      goodbyeEnabled: false,
      goodbyeMsg: "Selamat jalan @user!",
      antiLinkEnabled: false,
      antiLinkAction: "warn",
      allowedDomains: ["github.com", "youtube.com"],
      maxWarnings: 3,
      antiSpamEnabled: false,
      spamMaxMsgs: 5,
      spamWindowSec: 3,
      rules: "Belum ada aturan yang ditetapkan untuk grup ini.",
      warnings: {}
    }
    writeDB(db)
  }
  return db.groups[groupId]
}

function updateGroupSettings(groupId, newSettings) {
  const db = readDB()
  const current = getGroupSettings(groupId)
  db.groups[groupId] = { ...current, ...newSettings }
  writeDB(db)
  return db.groups[groupId]
}

function getUser(num) {
  const db = readDB()
  return db.users[num] || null
}

function simpan(num, data) {
  const db = readDB()
  db.users[num] = {
    num,
    rb_id: data.id,
    rb_username: data.name,
    rb_display: data.displayName,
    daftar_at: Date.now(),
    rb_updated: Date.now()
  }
  writeDB(db)
}

function hapus(num) {
  const db = readDB()
  if (db.users[num]) {
    delete db.users[num]
    writeDB(db)
    return true
  }
  return false
}

function cariByRbId(rbId, currentNum) {
  const db = readDB()
  return Object.values(db.users).find(u => u.rb_id === rbId && u.num !== currentNum)
}

function updateRoblox(num, data) {
  const db = readDB()
  if (db.users[num]) {
    db.users[num].rb_username = data.name
    db.users[num].rb_display = data.displayName
    db.users[num].rb_updated = Date.now()
    writeDB(db)
  }
}

module.exports = {
  saveGroupList,
  getGroupList,
  getGlobalSettings,
  updateGlobalSettings,
  getGroupSettings,
  updateGroupSettings,
  getUser,
  simpan,
  hapus,
  cariByRbId,
  updateRoblox
}
