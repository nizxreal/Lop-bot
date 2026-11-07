# Panduan Instalasi Lop-Bot Multi-Slot (Termux)

Sistem ini mendukung multi-nomor (slot bot) yang bisa dikelola langsung dari Dashboard Web localhost.

---

## 1. Persiapan Awal di Termux

Jalankan perintah berikut di aplikasi Termux:

```bash
pkg update && pkg upgrade -y
pkg install nodejs-lts git ffmpeg -y
```

Pastikan Node.js dan npm terpasang:
```bash
node -v
npm -v
```

---

## 2. Clone & Jalankan Skrip Instalasi

Salin skrip **install.sh** ini ke HP kamu (tools: `cat > install.sh <<'EOS' ... EOS`).

Jalankan skripnya:

```bash
chmod +x install.sh
./install.sh
```

Skrip akan melakukan:
- clone repository ke folder `Lop-bot`
- install dependencies (`npm install`)
- buat `custom_menu.json` kosong
- menulis `run.sh` untuk menjalankan server

---

## 3. Jalankan Server Utama

```bash
cd Lop-bot
./run.sh
```

Server akan aktif di `http://localhost:3000`.

---

## 4. Cara Menautkan Nomor (Pairing Code)

1. Buka browser di HP kamu (Chrome/Kiwi), buka: `http://localhost:3000`.
2. Klik tombol **[+]** (Floating Action Button) di pojok kanan bawah.
3. Isi **Nama Slot** (misal: `Bot1`) dan **Nomor WhatsApp** (gunakan format internasional, misal: `628123456789`).
4. Klik **Hubungkan**.
5. Tunggu beberapa detik, **Kode Pairing** akan muncul di kotak hijau pada Tab Terminal.
6. Buka WhatsApp yang ingin dijadikan bot: **Perangkat Tertaut > Tautkan Perangkat > Tautkan dengan nomor telepon**.
7. Masukkan kode yang muncul di dashboard tadi.
8. Bot akan otomatis online dan sesi disimpan di folder `auth_Bot1`.

---

## 5. Mengubah Menu Lokal (Tanpa Akses Open-Source)

Untuk mengubah antarmuka menu di HP **tempat kamu instal server** (tanpa mengunduh ulang kode lengkap), edit file:

```bash
Lop-bot/custom_menu.json
```

File ini berisi array JSON dari objek menu:

```json
[
  { "name": "start", "func": "req.reply('Halo!')", "desc": "Mulai bot" },
  { "name": "help", "func": "req.reply('Bantuan')", "desc": "Lihat perintah" }
]
```

- **name**: nama perintah bot (seperti `!start`).
- **func**: string JavaScript yang akan dieksekusi saat pengguna mengetik perintah (variabel `req` menyediakan method `reply`, `isGroup`, `sender`).
- **desc**: deskripsi yang ditampilkan di UI (seperti Main Menu).

Tiap kali kamu merubah `custom_menu.json`, buka dashboard di HP **mana saja** untuk sinkronisasi. Hasil perubahan akan langsung muncul di UI Main Menu di mana pun kamu akses dashboardnya.

---

## 6. Kelola Beberapa Nomor

Kamu bisa menambahkan slot baru (misal: `Bot2`) dengan mengulangi langkah di atas. Tiap nomor akan berjalan secara independen di satu server localhost yang sama.

### Fitur Tersedia di Localhost:
- **Terminal**: Tambah/Hapus/Restart slot bot dan lihat kode pairing.
- **Settings**: Atur Public Mode, Anti-Call, Nama Bot, dan Prefix.
- **Grup**: Atur pesan Welcome & Goodbye untuk tiap grup WhatsApp.
