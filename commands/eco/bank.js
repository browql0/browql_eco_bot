const Discord = require('discord.js');

// Créer une instance de Client
const config = require('../../config.json')

const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  name: 'bank',
  category:"eco",
  cooldown:5,
  usage:`**${config.prefix}**bank`,
  description:"permet de s'inscrire au jeux economie et avoir 500 🪙 gratuit",
  async execute(client,message, args) {

   
        const member = message.author;
    

        const bank = parseInt(await db.get(`bank_${member.id}`) || '0');
        const cash = parseInt(await db.get(`cash_${member.id}`) || '0');
        const total = bank + cash;
        const check = await db.get(`check_${member.id}`)

    if(check) return message.channel.send(`${member.username} est deja inscrit.`)
    await db.add(`check_${member.id}`, member.id)
    await db.add(`cash_${member.id}`, 500)
    message.channel.send('vous venez d\'avoir 500 🪙')
    



       
  },
};

