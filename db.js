const { DatabaseSync } = require('node:sqlite')
const path = require('path')

const db = new DatabaseSync(path.join(__dirname, 'data.db'))

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    num TEXT PRIMARY KEY,
    rb_id INTEGER NOT NULL,
    rb_username TEXT NOT NULL,
    rb_display TEXT NOT NULL,
    daftar_at INTEGER NOT NULL,
    rb_updated INTEGER NOT NULL
  )
`)

const getUser = (num) => db.prepare('SELECT * FROM users WHERE num = ?').get(num) ?? null

const cariByRbId = (rbId, num) =>
  db.prepare('SELECT num FROM users WHERE rb_id = ? AND num <> ?').get(rbId, num) ?? null

// Tanggal daftar tidak berubah saat data diperbarui
function simpan(num, r) {
  const now = Date.now()
  db.prepare(`
    INSERT INTO users (num, rb_id, rb_username, rb_display, daftar_at, rb_updated)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(num) DO UPDATE SET
      rb_id = excluded.rb_id,
      rb_username = excluded.rb_username,
      rb_display = excluded.rb_display,
      rb_updated = excluded.rb_updated
  `).run(num, r.id, r.name, r.displayName, now, now)
}

function updateRoblox(num, r) {
  db.prepare('UPDATE users SET rb_username = ?, rb_display = ?, rb_updated = ? WHERE num = ?')
    .run(r.name, r.displayName, Date.now(), num)
}

const hapus = (num) => db.prepare('DELETE FROM users WHERE num = ?').run(num).changes

module.exports = { getUser, cariByRbId, simpan, updateRoblox, hapus }
