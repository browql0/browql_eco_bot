const { QuickDB } = require('quick.db');
const db = new QuickDB();
const config = require('../../config.json');

module.exports = {
  name: 'gamble',
  category: 'eco',
  cooldown: 5,
  usage: `**${config.prefix}**gamble <montant>`,
  description: "Permet de parier de l'argent avec 50% de chance de doubler la mise.",
  async execute(client, message, args) {
    let user = message.author;
    let amount = parseInt(args[0]);

    if (!amount || isNaN(amount) || amount <= 0) {
      return message.channel.send("❌ Merci d'indiquer un montant valide à parier.");
    }

    let cash = parseInt(await db.get(`cash_${user.id}`) || '0');
    if (amount > cash) {
      return message.channel.send("❌ Tu n'as pas assez d'argent en cash pour parier cette somme.");
    }

    // Lancer un pari (50% chance de gagner)
    let win = Math.random() < 0.35;
    if (win) {
      await db.add(`cash_${user.id}`, amount);
      message.channel.send(`🎉 Bravo ${user.username}, tu as gagné ${amount} 💰 ! (Total: ${cash + amount})`);
    } else {
      await db.sub(`cash_${user.id}`, amount);
      message.channel.send(`😢 Dommage ${user.username}, tu as perdu ${amount} 💰... (Total: ${cash - amount})`);
    }
  },
};
