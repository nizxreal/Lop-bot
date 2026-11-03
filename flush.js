const { exec } = require('child_process')

const handlers = {
  flush: async ({ reply, isOwner }) => {
    try {
      if (!isOwner) {
        return reply('Ngapain ngetik .flush? Log Lop-Bot bukan urusan kamu 😒')
      }

      exec('pm2 flush', (err) => {
        if (err) {
          console.error('Gagal melakukan pembersihan log:', err)
          return reply('❌ Gagal membersihkan log Lop-Bot.')
        }
        reply('🧹 *Cache & Log Lop-Bot berhasil dibersihkan bersih!*')
      })
    } catch (err) {
      console.error('Error di !flush:', err)
    }
  },
}

module.exports = { handlers }
