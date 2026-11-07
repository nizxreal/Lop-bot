#!/data/data/com.termux/files/usr/bin/bash

set -e

# Jika termux tidak tersedia di PATH, gunakan lokasi default
if [ ! "$(command -v termux-setup-storage)" ]; then
  echo "Termux setup tidak ditemukan, abaikan"
fi

# Info pengguna
echo "Memasang Lop-Bot Server untuk Termux (dimungkinkan bagi orang lain tanpa perlu clone)"

# Buat folder
PROJECT_FOLDER="Lop-bot"

if [ -d "$PROJECT_FOLDER" ]; then
  echo "Folder '$PROJECT_FOLDER' sudah ada. Dilanjutkan."
else
  echo "Folder tidak ada. Tunggu untuk cloning..."
fi

# Cloning dari repository (Anda perlu memberi URL sesuai keinginan)
REPO_URL="https://github.com/your-username/Lop-bot.git"
if [ ! -d "$PROJECT_FOLDER" ]; then
  git clone "$REPO_URL" "$PROJECT_FOLDER" || {
    echo "Gagal clone. Pastikan repository ada di GitHub."
    exit 1
  }
fi

cd "$PROJECT_FOLDER"

# Install dependencies
if [ -f "package.json" ]; then
  echo "Menginstall dependensi..."
  npm install > npm_install.log 2>&1
else
  echo "package.json tidak ditemukan!"
  exit 1
fi

# Script helper untuk menjalankan server
cat > run.sh <<'EOS'
#!/data/data/com.termux/files/usr/bin/bash
cd "$(dirname "$0")"
nohup node server.js > server.log 2>&1 &
echo "Server berjalan di http://localhost:3000"
EOS
chmod +x run.sh

# Persiapan data pengguna
cat > custom_menu.json <<'EOS'
[]
EOS

echo ""
echo "========================================"
echo "Instalasi selesai. Jalankan perintah ini di session Termux yang sama:"
echo "  cd Lop-bot"
echo "  ./run.sh"
echo ""
echo "Lalu di HP lain buka:
  http://localhost:3000"
echo ""
echo "Anda bisa mengedit daftar menu dengan mengubah file 'custom_menu.json'."
echo "Format JSON:
[
  { "name": "start", "func": "req.reply('Halo!')", "desc": "Mulai bot" },
  { "name": "help", "func": "req.reply('Bantuan')", "desc": "Lihat perintah" }
]"

echo "Untuk menghapus menu, hapus entrynya dari file tersebut."
