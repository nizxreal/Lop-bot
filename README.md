# Panduan Menjalankan Lop-Bot di Termux (Android)

Lop-bot dilengkapi antarmuka web (Dashboard lokal) mirip control panel zxcoderid yang bisa diakses via browser Android.

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

## 2. Salin Folder / Clone Project

Jika menyalin folder proyek dari memori internal atau SD card ke direktori Termux:
```bash
termux-setup-storage
cp -r /sdcard/Lop-bot ~/Lop-bot
cd ~/Lop-bot
```

Atau jika menggunakan git:
```bash
cd ~
git clone <url-repo-kamu> Lop-bot
cd Lop-bot
```

---

## 3. Install Dependencies

Di dalam folder `~/Lop-bot`:
```bash
npm install
```

---

## 4. Menjalankan Bot & Web Dashboard

### Cara 1: Jalankan Keduanya Sekaligus
```bash
npm run dev
```
Perintah ini akan menjalankan bot WA sekaligus Web Dashboard di background.

### Cara 2: Menjalankan di Dua Sesi Termux (Direkomendasikan)
Buka 2 window Termux (geser layar dari kiri ke kanan lalu pilih **New Session**):

- **Window 1 (Web Dashboard):**
  ```bash
  cd ~/Lop-bot
  node apiServer.js
  ```
  Dashboard berjalan di port `3000`.

- **Window 2 (Bot WhatsApp):**
  ```bash
  cd ~/Lop-bot
  node index.js
  ```
  Ikuti instruksi input nomor WA untuk meminta kode pairing jika sesi belum terdaftar.

---

## 5. Mengakses Web Dashboard

Buka browser di HP kamu (Chrome / Firefox / Kiwi Browser), lalu buka alamat:

```text
http://localhost:3000
```

### Fitur Dashboard yang Tersedia:
- **Dashboard**: Memantau status bot engine, port, dan koneksi WA.
- **Terminal**: Melihat status koneksi bot dan pairing code.
- **Settings**: Saklar Publik/Grup/Private, Anti-Call, Auto-Read, Auto-Bio, Prefix, Nama Bot, dan Template Caption Menu dengan placeholder chip (`$pushname`, `$botname`, `$prefix`, dll).
- **Banner & Grup**: Mengatur pesan welcome/goodbye, gambar banner, serta aturan moderasi tiap grup.
