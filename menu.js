const { getGlobalSettings } = require('./db')
const config = require('./config')

const handlers = {
  menu: async ({ reply }) => {
    const globalSettings = getGlobalSettings()
    const p = globalSettings.prefix || config.prefix || '.'

    const menuText = `╭─────────────────────╮
│  *Selamat malam 🌙!*
│  Aku *Lop-bot*
╰─────────────────────╯

  ❖ *LOP-BOT · DASHBOARD* ❖
━━━━━━━━━━━━━━━━━━━━

╭───〖 *🎲 FUN* 〗
├  ◦ ${p}dadu [sisi]
├  ◦ ${p}koin
├  ◦ ${p}slot
├  ◦ ${p}jodoh A & B
├  ◦ ${p}apakah <tanya>
├  ◦ ${p}quote
├  ◦ ${p}ramal
├  ◦ ${p}tarot [tanya]
╰───────────────────

╭───〖 *🧰 USEFUL* 〗
├  ◦ ${p}hitung <expr>
├  ◦ ${p}cuaca <kota>
├  ◦ ${p}waktu
├  ◦ ${p}grupinfo  (hanya di grup)
├  ◦ ${p}member  (hanya di grup)
├  ◦ ${p}pilih a | b | c
├  ◦ ${p}umur YYYY-MM-DD
├  ◦ ${p}id
╰───────────────────

╭───〖 *🍈 BLOX FRUITS* 〗
├  ◦ ${p}menubf  (menu Blox Fruits & akun Roblox)
├  ◦ ${p}bf <buah>  (cek nilai)
├  ◦ ${p}bflist  (daftar buah)
├  ◦ ${p}v4guide  (guide race V4)
╰───────────────────

╭───〖 *🎨 STIKER* 〗
├  ◦ ${p}stiker  (kirim/reply gambar)
├  ◦ ${p}textstiker <teks | baris 2>
├  ◦ ${p}toimg  (reply stiker)
╰───────────────────

╭───〖 *📥 DOWNLOADER* 〗
├  ◦ ${p}tiktok <link>
├  ◦ ${p}ig <link>
├  ◦ ${p}spotify <link>
╰───────────────────

╭───〖 *🛡️ MODERASI · khusus admin* 〗
├  ◦ ${p}kick @user 🛡️
├  ◦ ${p}ban @user 🛡️
├  ◦ ${p}unban @user 🛡️
├  ◦ ${p}tagall [pesan] 🛡️
╰───────────────────

╭───〖 *⚙️ SISTEM* 〗
├  ◦ ${p}ping
├  ◦ ${p}info
├  ◦ ${p}menu
├  ◦ ${p}help [nama]  (contoh pemakaian)
├  ◦ ${p}profile  (profil kamu)
╰───────────────────

╭───〖 📜 *ATURAN BOT* 〗
├  ◦ Tanpa spasi: ${p}dadu, bukan ${p} dadu
├  ◦ Cooldown: 3 detik / user
├  ◦ Moderasi butuh akses admin
├  ◦ Downloader: 1 antrean (maks 16 MB)
╰───────────────────

🛡️ = _Khusus Admin Grup_`

    await reply(menuText)
  },

  help: async (ctx) => {
    return handlers.menu(ctx)
  }
}

module.exports = { handlers }
