const Discord = require('discord.js');

const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  name: 'tax',
  category: 'eco',
  usage: '**[prefix]**tax',
  description: "Impose une taxe sur les utilisateurs qui détiennent une certaine quantité d'argent en banque ou en cash",
  async execute(client, message, args) {
    let member = message.author
    const bank = parseInt(await db.get(`bank_${member.id}`) || '0');
    const cash = parseInt(await db.get(`cash_${member.id}`) || '0');
    const total = bank + cash;
    const check = db.get(`check_${member.id}`)
    const tax = parseInt(await db.get(`tax_${member.id}`))

    if(!check) return message.channel.send(`${member.username} n'est pas inscrit.`)

    if (total < tax) return message.reply(`Vous n'avez pas assez d'argent pour payer les taxes de ${tax}.`);

    const taxAmount = total * 0.1;

    await db.sub(`bank_${member.id}`, taxAmount);
    await db.sub(`cash_${member.id}`, taxAmount);
    await db.delete(`tax_${member.id}`)

    message.reply(`Vous avez payé une taxe de ${taxAmount} 🪙.`);
  },
};
