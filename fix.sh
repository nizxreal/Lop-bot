#!/bin/bash
cd "$HOME/Lop-bot" || { echo "❌ Folder ~/Lop-bot tidak ditemukan"; exit 1; }

echo "🔄 Memulai pemulihan instan Lop-Bot..."
pm2 delete lopbot 2>/dev/null
sleep 1
pm2 start index.js --name lopbot
pm2 save
echo "✅ Lop-Bot berhasil dipulihkan!"
pm2 logs lopbot --lines 5 --nostream
