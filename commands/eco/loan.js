const Discord = require('discord.js');

// Créer une instance de Client
const config = require('../../config.json');

const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  name: 'loan',
  category: 'eco',
  cooldown: 5,
  usage: `**${config.prefix}**loan <somme>`,
  description: "Permet à un utilisateur de demander un prêt à la banque pour une certaine somme d'argent",
  async execute(client, message, args) {
    let member = message.author;
    const bank = parseInt(await db.get(`bank_${member.id}`) || '0');
    const cash = parseInt(await db.get(`cash_${member.id}`) || '0');
    const total = bank + cash;
    const check = await db.get(`check_${member.id}`);

    if (!check) return message.channel.send(`${member.username} n'est pas inscrit.`);

    const amount = parseInt(args[0]);
    if (amount > 2000) return message.channel.send('Vous ne pouvez pas emprunter ce montant, le maximum est de 2000 🪙');
    if (!amount) return message.reply("Vous devez entrer une somme d'argent à emprunter.");

    const loan = parseInt(await db.get(`loan_${message.author.id}`) || '0');

    if (loan) return message.reply(`Vous avez déjà un prêt en cours. Veuillez rembourser votre prêt actuel (${loan} 🪙) avant de demander un nouveau prêt.`);

    await db.add(`loan_${message.author.id}`, amount);
    await db.add(`cash_${message.author.id}`, amount);
    message.reply(`Vous avez demandé un prêt de ${amount} auprès de la banque.`);
  },
};
