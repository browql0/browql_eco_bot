const Discord = require('discord.js');

// Créer une instance de Client
const config = require('../../config.json')

const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  name: 'repay',
  category:"eco",
  cooldown:5,
  usage:`**${config.prefix}**repay <somme>`,
  description: "Permet à un utilisateur de rembourser une partie ou la totalité de son prêt à la banque.",
  async execute(client,message, args) {

    let member = message.author
    const bank = parseInt(await db.get(`bank_${member.id}`) || '0');
    const cash = parseInt(await db.get(`cash_${member.id}`) || '0');
    const total = bank + cash;
    const check = await db.get(`check_${member.id}`)


    if(!check) return message.channel.send(`${member.username} n'est pas inscrit.`)
    if(args[0] == "all") {
        const loan = await db.get(`loan_${message.author.id}`);
        if (!loan) return message.reply("Vous n'avez pas de prêt en cours.");
        await db.delete(`loan_${message.author.id}`);
        await db.sub(`cash_${message.author.id}`, loan);
        message.reply(`Vous avez remboursé la totalité de votre prêt (${loan} 🪙).`);
    }else {
        const amount = parseInt(args[0]);
        const loan = parseInt(await db.get(`loan_${message.author.id}`) || '0');
        if (!loan) return message.reply(`Vous n'avez pas de prêt en cours.`);
        if (!amount) return message.reply("Vous devez entrer une somme d'argent à rembourser.");
        if(amount > cash)return message.channel.send(`vous n'avez pas cette somme`)
    
        if (amount > loan) return message.reply(`Vous ne pouvez pas rembourser un montant supérieur à votre prêt actuel (${loan} 🪙)`);
    
        await db.sub(`loan_${message.author.id}`, amount);
        await db.sub(`cash_${message.author.id}`, amount);
        message.reply(`Vous avez remboursé ${amount} 🪙 de votre prêt à la banque.`);
    }

   
  },
};
