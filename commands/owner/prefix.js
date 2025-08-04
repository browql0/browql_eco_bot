const Discord = require('discord.js');
const config = require('../../config.json')

const { QuickDB } = require('quick.db');
const fs = require('fs')
const db = new QuickDB();
module.exports = {
  name: 'prefix',
  usage:`**${config.prefix}**prefix <nouveau prefix>`,
  category:"owner",
  description:"permet d'enlever tous les rôle d'un membre",
  async execute(client,message, args) {
    const check =  db.get(`ownermd_${client.user.id}_${message.author.id}`, true)


    if(config.owner.includes(message.author.id) || check) {

     
    

        let newPrefix = args[0]
        if (!args[0]) return
        if (args[1]) return
        if (config.prefix === newPrefix)
         return message.channel.send(`Le prefix est déjà \`${newPrefix}\``)
        else {
          config.prefix = newPrefix;
          fs.writeFileSync('./config.json', JSON.stringify(config));
                      message.channel.send(`Mon prefix est maintenant : \`${args[0]}\``)
        }

          
        

        
    }
}
}