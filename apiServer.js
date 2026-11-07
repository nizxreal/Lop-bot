const express = require('express')
const cors = require('cors')
const path = require('path')
const http = require('http')
const { Server } = require('socket.io')
const { getGlobalSettings, updateGlobalSettings, getGroupSettings, updateGroupSettings, getGroupList } = require('./db')

const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

const PORT = 3000

app.use(cors())
app.use(express.json({ limit: '10mb' }))

const publicPath = path.join(__dirname, 'public')

app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'))
})
app.use(express.static(publicPath))

let botStatus = { connected: false, number: null, pairingCode: null, groups: 0 }

io.on('connection', (socket) => {
  socket.emit('bot:status', botStatus)
})

app.post('/api/bot/status', (req, res) => {
  const { connected, number, pairingCode, groups } = req.body || {}
  botStatus = { ...botStatus, connected, number, pairingCode, groups }
  io.emit('bot:status', botStatus)
  res.json({ status: true, data: botStatus })
})

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
    res.json({ status: true, message: `Konfigurasi grup tersimpan!`, data: updated })
  } catch (err) {
    res.status(500).json({ status: false, message: err.message })
  }
})

server.listen(PORT, () => {
  console.log(`🌐 Web Dashboard berjalan di http://localhost:${PORT}`)
})

module.exports = { io }
