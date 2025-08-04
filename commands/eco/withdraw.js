const Discord = require('discord.js');

// Créer une instance de Client
const config = require('../../config.json')

const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  name: 'withdraw',
  category:"eco",
  cooldown:5,
  usage:`**${config.prefix}**withdraw <all/nomre>`,
  description: 'Retire de l\'argent de la banque',
  async execute(client,message, args) {

       const member = message.author;
   
    const bank = parseInt(await db.get(`bank_${member.id}`) || '0');
    const cash = parseInt(await db.get(`cash_${member.id}`) || '0');
    const total = bank + cash;
    const check = await db.get(`check_${member.id}`)


    if(!check) return message.channel.send(`${member.username} n'est pas inscrit.`)
    if (!args[0]) {
        return message.reply('Veuillez indiquer le montant à retirer');
      }
     
      if (args[0] === 'all') {
        if(bank === '0') return message.channel.send('vous n\'avez pas de cash')

        await db.set(`cash_${member.id}`, cash + bank);
        await db.set(`bank_${member.id}`, 0);
        return message.reply(`Vous avez retiré tout votre argent du bank vers le cash. Votre nouveau solde en cash est de ${cash + bank} 🪙.`);
      

    }else {
        const amount = parseInt(args[0])

        if (bank < amount) {
            return message.reply(`Vous n'avez pas suffisamment d'argent dans votre compte bancaire pour effectuer ce retrait.`);
          }
      
          // Effectuer le retrait
        await   db.sub(`bank_${member.id}`, amount);
        await   db.add(`cash_${member.id}`, amount);
       
      
          // Confirmer le retrait au membre
          message.reply(`Vous avez retiré ${amount}🪙 de votre compte bancaire. Votre nouveau solde est de ${bank - amount}🪙.`);
    }

   



       
  },
};

