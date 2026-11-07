const express = require('express')
const cors = require('cors')
const path = require('path')
const botManager = require('./botManager')
const {
  getGlobalSettings,
  updateGlobalSettings,
  getGroupSettings,
  updateGroupSettings,
  getGroupList
} = require('./db')

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json({ limit: '10mb' }))

const publicPath = path.join(__dirname, 'public')

app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'))
})
app.use(express.static(publicPath))

// --- Bot Manager API ---

// Ambil daftar slot bot & statusnya
app.get('/api/bots', (req, res) => {
  res.json({ status: true, data: botManager.getAllBots() })
})

// Minta pairing code / hubungkan bot ke nomor baru
app.post('/api/bots/connect', async (req, res) => {
  const { botId, phone } = req.body
  if (!botId || !phone) {
    return res.status(400).json({ status: false, message: 'botId dan phone wajib diisi!' })
  }
  try {
    const result = await botManager.startBot(botId, phone)
    res.json({ status: true, message: 'Permintaan koneksi diproses!', data: result })
  } catch (err) {
    res.status(500).json({ status: false, message: err.message })
  }
})

// Hentikan bot
app.post('/api/bots/stop', async (req, res) => {
  const { botId } = req.body
  const result = await botManager.stopBot(botId)
  res.json({ status: true, message: `Bot ${botId} dihentikan.`, data: result })
})

// Restart bot
app.post('/api/bots/restart', async (req, res) => {
  const { botId } = req.body
  await botManager.stopBot(botId)
  const result = await botManager.startBot(botId)
  res.json({ status: true, message: `Bot ${botId} di-restart.`, data: result })
})

// Hapus sesi / logout bot
app.post('/api/bots/logout', async (req, res) => {
  const { botId } = req.body
  const result = await botManager.logoutBot(botId)
  res.json(result)
})

// --- Settings & Group API ---

app.get('/api/groups', (req, res) => {
  res.json({ status: true, data: getGroupList() })
})

app.get('/api/settings', (req, res) => {
  res.json({ status: true, data: getGlobalSettings() })
})

app.post('/api/settings', (req, res) => {
  try {
    const updated = updateGlobalSettings(req.body)
    res.json({ status: true, message: 'Konfigurasi global diperbarui!', data: updated })
  } catch (err) {
    res.status(500).json({ status: false, message: err.message })
  }
})

app.get('/api/groups/:id', (req, res) => {
  const settings = getGroupSettings(req.params.id)
  res.json({ status: true, data: settings })
})

app.post('/api/groups/:id', (req, res) => {
  try {
    const updated = updateGroupSettings(req.params.id, req.body)
    res.json({ status: true, message: 'Konfigurasi grup tersimpan!', data: updated })
  } catch (err) {
    res.status(500).json({ status: false, message: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`🌐 Server Web & Bot Engine aktif di http://localhost:${PORT}`)
})
