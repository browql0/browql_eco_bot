const { QuickDB } = require('quick.db');
const db = new QuickDB();
const { EmbedBuilder } = require('discord.js');
const config = require('../../../config.json');

module.exports = {
  name: 'slot',
  category: 'eco',
  cooldown: 15,
  usage: `**${config.prefix}**slots <montant>`,
  description: "Joue à la machine à sous et tente de gagner gros !",
  async execute(client, message, args) {
    let user = message.author;
    let bet = parseInt(args[0]) || 100;
    if (!bet || bet <= 0) return message.channel.send("💰 Spécifie un montant valide à parier !");
    
    let cash = parseInt(await db.get(`cash_${user.id}`) || '0');
    if (bet > cash) return message.channel.send("❌ Tu n'as pas assez d'argent pour parier ce montant !");
    
    // Liste des emojis pour les rouleaux
    const slots = ['🍒', '🍋', '🍉', '🍇', '🔔', '⭐', '💎'];
    
    // Tirage des rouleaux
    let reel1 = slots[Math.floor(Math.random() * slots.length)];
    let reel2 = slots[Math.floor(Math.random() * slots.length)];
    let reel3 = slots[Math.floor(Math.random() * slots.length)];
    
    let result = `${reel1} | ${reel2} | ${reel3}`;
    let winAmount = 0;
    
    // Vérification du gain
    if (reel1 === reel2 && reel2 === reel3) {
      winAmount = bet * 3; // Jackpot (x3)
    } else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
      winAmount = bet * 1.5; // Gain normal (x1.5)
    }
    
    // Mise à jour du solde
    let finalCash = cash - bet + winAmount;
    await db.set(`cash_${user.id}`, finalCash);
    
    // Création de l'embed
    const embed = new EmbedBuilder()
       .setColor('DarkButNotBlack')
      .setTitle("🎰 Machine à Sous 🎰")
      .setDescription(`**${result}**`)
      .addFields(
        { name: "Pari", value: `${bet} 💰`, inline: true },
        { name: "Gain", value: winAmount > 0 ? `+${winAmount} 💰` : "0 💰", inline: true },
        { name: "Nouveau solde", value: `${finalCash} 💰`, inline: false }
      );
    
    message.channel.send({ embeds: [embed] });
  },
};