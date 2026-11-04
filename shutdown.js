const { exec } = require('child_process')

const handlers = {
  shutdown: async ({ reply, isOwner }) => {
    try {
      if (!isOwner) return

      await reply('🛑 *LOP-BOT DIMATIKAN*\nBot berhenti. Untuk menyalakan lagi, buka Termux dan jalankan: pm2 start lopbot')

      // Hanya menghentikan Lop-Bot, proses pm2 lain tidak ikut mati
      exec('pm2 stop lopbot', (err) => {
        if (err) console.error('Gagal menghentikan Lop-Bot:', err.message)
      })
    } catch (err) {
      console.error('Error di !shutdown:', err)
    }
  },
}

module.exports = { handlers }
