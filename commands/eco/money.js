const {EmbedBuilder} = require('discord.js')

// Créer une instance de Client
const config = require('../../config.json')

const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  name: 'money',
  category:"eco",
  cooldown:5,
  usage:`**${config.prefix}**money <add/remove/membre>`,
  description:"permet de voir ou modifier la balance d'un membre",
  async execute(client,message, args) {

    let member = client.users.cache.get(message.author.id);
    if (args[0]) {
      member = client.users.cache.get(args[1]);
    } 
    if (message.mentions.members.first()) {
      member = client.users.cache.get(message.mentions.members.first().id);
    } else {
        member = message.author;
    }
    let userAvatar = member.displayAvatarURL({ format: 'png', dynamic: true });

    const bank = parseInt(await db.get(`bank_${member.id}`) || '0');
    const cash = parseInt(await db.get(`cash_${member.id}`) || '0');
    const loan = parseInt(await db.get(`loan_${member.id}`) || '0');
    const total = bank + cash;
    const check = await db.get(`check_${member.id}`)
    
    

   
    const tax = parseInt(await db.get(`tax_${member.id}`) || '0');


    if(!check) return message.channel.send(`${member.username} n'est pas inscrit.`)
    
        const ee = new EmbedBuilder()
    .setColor('DarkButNotBlack')
    .setAuthor( { name: `${member.username}`, iconURL: `${userAvatar}` })
    .addFields(
        { name: "🪙 Cash :", value: `${cash}`, inline: true},
        { name: "`🏦` Bank :", value:`${bank}` , inline: true},
        { name: "`💰` Totale :", value: `${total}`, inline: true},
        { name: "`🏦` loan :", value: `${loan}`, inline: true},
        { name : "`💴`Taxe :", value : `${tax}`, inline: false}
    )
    message.channel.send({embeds : [ee]})



       
  },
};

