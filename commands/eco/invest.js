const { QuickDB } = require('quick.db');
const db = new QuickDB();
const { EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
  name: 'invest',
  category: 'eco',
  cooldown: 5,
  usage: `**${config.prefix}**invest <montant>`,
  description: "Investis de l'argent et vois si tu fais un profit ou une perte !",
  async execute(client, message, args) {
    let user = message.author;
    let amount = parseInt(args[0]);
    if (!amount || amount <= 0) return message.channel.send("📈 Spécifie un montant valide à investir !");
    
    let cash = parseInt(await db.get(`cash_${user.id}`) || '0');
    if (amount > cash) return message.channel.send("❌ Tu n'as pas assez d'argent pour investir ce montant !");
    
    // Simuler le marché (gains/pertes entre -50% et +100%)
    let percentageChange = (Math.random() * 150) - 100; // Entre -50% et +100%
    let profitLoss = Math.floor((amount * percentageChange) / 100);
    let finalAmount = amount + profitLoss;
    
    let finalCash = cash - amount + finalAmount;
    await db.set(`cash_${user.id}`, finalCash);
    
    // Création de l'embed
    const embed = new EmbedBuilder()
      .setColor('DarkButNotBlack')
      .setTitle("📈 Investissement en Bourse 📉")
      .setDescription(`Tu as investi **${amount} 💰** dans le marché.`)
      .addFields(
        { name: "Résultat", value: profitLoss >= 0 ? `+${profitLoss} 💰` : `${profitLoss} 💰`, inline: true },
        { name: "Nouveau solde", value: `${finalCash} 💰`, inline: false }
      )
      .setFooter({ text: percentageChange >= 0 ? "📊 Un bon investissement !" : "📉 Mauvaise décision..." });
    
    message.channel.send({ embeds: [embed] });
  },
};