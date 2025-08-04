const Discord = require("discord.js");
const config = require('../../config.json')

const { QuickDB } = require('quick.db');
const db = new QuickDB();


module.exports = {
  name: "steal",
  description: "Vol de cash à un membre mentionné",
  category: "eco",
  cooldown: 600,
  usage: `**${config.prefix}**steal <membre>`,
async  execute(client, message, args) {
    
    let member = client.users.cache.get(message.author.id);
    if (args[0]) {
      member = client.users.cache.get(args[1]);
    } 
    if (message.mentions.members.first()) {
      member = client.users.cache.get(message.mentions.members.first().id);
    } 
    const check = await db.get(`check_${member.id}`)
    if(!check) return message.channel.send(`${member.username} n'est pas inscrit.`)

    if (!member) {
      return message.reply("Veuillez mentionner un membre valide à voler");
    }
    if (member.id === message.author.id) {
      return message.reply("Vous ne pouvez pas vous voler vous-même");
    }

    const victimCash = parseInt(await db.get(`cash_${member.id}`) || '0');
    if (victimCash === 0) {
      return message.reply("La victime ne possède pas de cash");
    }

    const stealAmount = Math.floor(Math.random() * victimCash) + 1;
    const stealSuccess = Math.random() < 0.5;
    if (stealSuccess) {
      const thiefCash = parseInt(await db.get(`cash_${message.author.id}`) || '0');
      await db.set(`cash_${message.author.id}`, thiefCash + stealAmount);
      await db.set(`cash_${member.id}`, victimCash - stealAmount);

      message.reply(`Vous avez volé ${stealAmount} cash à ${member}`);
    } else {
      const fineAmount = stealAmount * 2;
      const thiefCash = parseInt(await db.get(`cash_${message.author.id}`) || '0');
      if (thiefCash < fineAmount) {
        return message.reply(`Vous avez été attrapé et devez payer une amende de ${fineAmount}, mais vous n'avez pas assez de cash`);
      }

      await db.set(`cash_${message.author.id}`, thiefCash - fineAmount);
      message.reply(`Vous avez été attrapé et devez payer une amende de ${fineAmount}`);
      
    }
  },
};
