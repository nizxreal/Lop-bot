// API publik Roblox, tanpa login dan tanpa kunci
const BASE = 'https://users.roblox.com/v1'

async function cariUser(username) {
  const res = await fetch(`${BASE}/usernames/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernames: [username], excludeBannedUsers: true }),
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = (await res.json()).data || []
  return data[0] || null
}

async function ambilUser(id) {
  const res = await fetch(`${BASE}/users/${id}`, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

function umur(iso) {
  const lahir = new Date(iso)
  const now = new Date()
  let tahun = now.getFullYear() - lahir.getFullYear()
  let bulan = now.getMonth() - lahir.getMonth()
  if (now.getDate() < lahir.getDate()) bulan--
  if (bulan < 0) { tahun--; bulan += 12 }
  if (tahun < 0) return '-'
  return `${tahun} tahun ${bulan} bulan`
}

module.exports = { cariUser, ambilUser, umur }
