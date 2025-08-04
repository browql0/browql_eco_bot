const Discord = require('discord.js');

// Créer une instance de Client
const config = require('../../config.json')

const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  name: 'deposit',
  category:"eco",
  cooldown:5,
  usage:`**${config.prefix}**deposit <all/nomre>`,
  description: "Permet à un utilisateur de déposer de l'argent de leur cash vers leur compte bancaire",
  async execute(client,message, args) {

       const member = message.author;
   
    const bank = parseInt(await db.get(`bank_${member.id}`) || '0');
    const cash = parseInt(await db.get(`cash_${member.id}`) || '0');
    const total = bank + cash;
    const check = await db.get(`check_${member.id}`)


    if(!check) return message.channel.send(`${member.username} n'est pas inscrit.`)
    if (args[0].toLowerCase() === "all") {
        if(cash === '0') return message.channel.send('vous n\'avez pas de cash')
       await db.add(`bank_${member.id}`, cash);
       await db.delete(`cash_${member.id}`);
        return message.reply(`vous avez deposé tous ce que vous aviez dans votre bank(${cash})`);
      }else {
        const depositAmount = parseInt(args[0]);


        if (depositAmount > cash) {
          return message.reply("Vous n'avez pas suffisamment d'argent en espèces pour effectuer ce dépôt");
        }
    
        await db.add(`bank_${member.id}`, depositAmount);
        await db.sub(`cash_${member.id}`, depositAmount);
        message.channel.send(`vous avez deposé ${depositAmount} 🪙 de votre bank`)
      }

   




       
  },
};

