#!/bin/bash
echo "🔄 Memulai pemulihan instan Lop-Bot..."
pm2 kill
sleep 1
pm2 start index.js --name "lopbot"
pm2 save
echo "✅ Lop-Bot berhasil dipulihkan!"
pm2 logs lopbot --lines 5 --nostream
