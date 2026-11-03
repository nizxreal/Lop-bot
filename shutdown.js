const { exec } = require('child_process')

const handlers = {
  shutdown: async ({ reply, isOwner }) => {
    try {
      if (!isOwner) {
        return reply('Ngapain ngetik .shutdown? Situ bukan owner, nggak usah sok asik nyuruh aku mati 😒')
      }

      await reply('Baik Bos, Lop-bot mematikan sistem secara total. Sampai jumpa! 👋')

      const command = 'pm2 flush && pm2 kill'

      exec(command, (err) => {
        if (err) {
          console.error('Gagal mengeksekusi shutdown:', err)
          process.exit(0)
        }
      })
    } catch (err) {
      console.error('Error di !shutdown:', err)
    }
  },
}

module.exports = { handlers }
