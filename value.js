const fs = require('fs')
const path = require('path')

// Database lokal buah Blox Fruits beserta value, perm value, dan demand terkini
const fruitDatabase = {
  kitsune: { name: "Kitsune", rarity: "Mythical", physical: "110,000,000", perm: "4,000,000,000", demand: "10/10 🟢" },
  dragon: { name: "Dragon (Rework)", rarity: "Mythical", physical: "3,500,000,000", perm: "5,000,000,000", demand: "10/10 🔥" },
  leopard: { name: "Leopard", rarity: "Mythical", physical: "55,000,000", perm: "3,000,000,000", demand: "9/10 🟢" },
  dough: { name: "Dough", rarity: "Mythical", physical: "25,000,000", perm: "2,400,000,000", demand: "10/10 🔥" },
  trex: { name: "T-Rex", rarity: "Mythical", physical: "20,000,000", perm: "2,200,000,000", demand: "8/10 🟡" },
  spirit: { name: "Spirit", rarity: "Mythical", physical: "12,000,000", perm: "2,100,000,000", demand: "7/10 🟡" },
  venom: { name: "Venom", rarity: "Mythical", physical: "12,000,000", perm: "2,000,000,000", demand: "7/10 🟡" },
  control: { name: "Control", rarity: "Legendary", physical: "8,000,000", perm: "1,500,000,000", demand: "8/10 🟢" },
  buddha: { name: "Buddha", rarity: "Legendary", physical: "7,500,000", perm: "1,650,000,000", demand: "10/10 🔥" },
  portal: { name: "Portal", rarity: "Legendary", physical: "8,000,000", perm: "2,000,000,000", demand: "10/10 🔥" },
  mammoth: { name: "Mammoth", rarity: "Mythical", physical: "15,000,000", perm: "2,300,000,000", demand: "7/10 🟡" },
  shadow: { name: "Shadow", rarity: "Legendary", physical: "6,000,000", perm: "1,800,000,000", demand: "6/10 🟠" },
  blizzard: { name: "Blizzard", rarity: "Legendary", physical: "6,000,000", perm: "1,500,000,000", demand: "7/10 🟡" },
  sound: { name: "Sound", rarity: "Legendary", physical: "5,000,000", perm: "1,300,000,000", demand: "7/10 🟡" },
  pain: { name: "Pain", rarity: "Legendary", physical: "2,000,000", perm: "1,100,000,000", demand: "4/10 🔴" },
  quake: { name: "Quake", rarity: "Epic", physical: "1,000,000", perm: "800,000", demand: "5/10 🟠" },
  magma: { name: "Magma", rarity: "Epic", physical: "1,200,000", perm: "950,000", demand: "9/10 🟢" },
  light: { name: "Light", rarity: "Rare", physical: "800,000", perm: "600,000", demand: "6/10 🟠" }
}

const valueHandler = async ({ reply, args }) => {
  try {
    if (!args.length) {
      return reply('❓ *Cara penggunaan:* `.value <nama_buah>`\nContoh: `.value kitsune`, `.value buddha`, `.value leopard`')
    }

    const query = args.join(' ').toLowerCase().replace(/[^a-z0-9]/g, '')
    
    // Pencarian buah yang cocok di database lokal
    const foundKey = Object.keys(fruitDatabase).find(k => k.includes(query) || query.includes(k))

    if (!foundKey) {
      return reply(`❌ Buah *"${args.join(' ')}"* tidak ditemukan di database!\n\nKetik nama buah yang benar seperti: kitsune, leopard, buddha, dough, dragon, dll.`)
    }

    const fruit = fruitDatabase[foundKey]

    const teks = [
      `🍈 *BLOX FRUITS MARKET VALUE*`,
      `──────────────────`,
      `📌 *Nama:* ${fruit.name}`,
      `✨ *Rarity:* ${fruit.rarity}`,
      `💰 *Physical Value:* 💲${fruit.physical}`,
      `🔮 *Permanent Value:* 💲${fruit.perm}`,
      `🔥 *Demand:* ${fruit.demand}`,
      `──────────────────`,
      `_💡 Update nilai berdasarkan standard trading saat ini._`,
    ].join('\n')

    await reply(teks)
  } catch (err) {
    console.error('Error di !value:', err)
    await reply('❌ Terjadi kesalahan sistem saat memproses command.')
  }
}

const handlers = {
  value: valueHandler,
  val: valueHandler,
  bf: valueHandler,
}

module.exports = { handlers }
