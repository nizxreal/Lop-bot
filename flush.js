const { exec } = require('child_process')

const handlers = {
  flush: async ({ reply, isOwner }) => {
    try {
      if (!isOwner) return

      exec('pm2 flush lopbot', async (err) => {
        if (err) {
          console.error('Gagal membersihkan log:', err.message)
          return reply('❌ *GAGAL*\nLog Lop-Bot tidak bisa dibersihkan.')
        }
        await reply('🧹 *LOG DIBERSIHKAN*\nLog Lop-Bot sudah kosong.')
      })
    } catch (err) {
      console.error('Error di !flush:', err)
    }
  },
}

module.exports = { handlers }
