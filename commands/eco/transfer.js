const Discord = require('discord.js');

// Créer une instance de Client
const config = require('../../config.json')

const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  name: 'transfer',
  category:"eco",
  cooldown:5,
  usage:`**${config.prefix}**transfer <somme> <membre>`,
  description: 'Transférer de l\'argent à un autre membre',
  async execute(client,message, args) {

    let member = client.users.cache.get(message.author.id);
    if (args[0]) {
      member = client.users.cache.get(args[1]);
    } 
    if (message.mentions.members.first()) {
      member = client.users.cache.get(message.mentions.members.first().id);
    
    }

    const bank = parseInt(await db.get(`bank_${member.id}`) || '0');
    const cash = parseInt(await db.get(`cash_${member.id}`) || '0');
    const total = bank + cash
        const check = await db.get(`check_${member.id}`)


    if(!check) return message.channel.send(`${member.username} n'est pas inscrit.`)
    let amount = parseInt(args[0]);

        if (!member) {
            return message.reply('Veuillez mentionner un membre valide pour effectuer le transfert');
        }

        if (!amount) {
            return message.reply('Veuillez spécifier un montant à transférer');
        }

        let senderBank = parseInt(await db.get(`bank_${message.author.id}`) || '0');
        let receiverBank = parseInt(await db.get(`bank_${member.id}`) || '0');

        if (senderBank < amount) {
            return message.reply(`Vous n'avez pas assez d'argent pour effectuer ce transfert. Votre solde est de ${senderBank}`);
        }

        db.sub(`bank_${message.author.id}`, amount);
        db.add(`bank_${member.id}`, amount);
        const taxAmount = total * 0.1;
    await db.set(`tax_${member.id}`, taxAmount)

        message.channel.send(`${message.author} a transféré ${amount} à ${member}.\nLe nouveau solde de ${message.author} est de ${senderBank - amount} et le nouveau solde de ${member} est de ${receiverBank + amount}`);



       
  },
};

