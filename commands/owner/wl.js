const {EmbedBuilder} = require('discord.js')
const config = require('../../config.json')
const { QuickDB } = require("quick.db");
const db = new QuickDB();



module.exports = {
    name: 'wl',
    description: 'ajouter ou retirer des whiteliste  du bot',
    category:"owner",
    usage:`**${config.prefix}** wl <add/remove>`,
    async execute(client, message, args) {
    

        const check = db.get(`owner_${client.user.id}_${message.author.id}`, true)


        if (!config.owner.includes(message.author.id) || check == false) return message.channel.send("tu n'es pas un owner")
    
          if (args[0] && args[0] == 'add') {
            let member = client.users.cache.get(message.author.id);
            if (args[1]) {
              member = client.users.cache.get(args[1]);
            } else {
              return message.channel.send(`Aucun membre trouvé pour \`${args[1] || " "}\``)
    
            }
            if (message.mentions.members.first()) {
              member = client.users.cache.get(message.mentions.members.first().id);
            }
            if (!member) return message.channel.send(`Aucun membre trouvé pour \`${args[1] || " "}\``)
            if (await db.get(`wl_${client.user.id}_${member.id}`) === true) {
              return message.channel.send(`${member.username} est déjà wl`)
            }
    
            db.set(`wl_${client.user.id}_${member.id}`, true)
    
            message.channel.send(`${member.username} est maintenant wl`)
    
          }
    
          if (args[0] && args[0] == 'clear') {
            let members = await db.all(`wl_${client.user.id}_`)
    
            if (!Array.isArray(members)) {
              members = [members];
            }
    
            const membersWithId = members
            .filter(m => m.id.startsWith("wl_"))
          
           
          
            const numOwners = membersWithId.length ? membersWithId.length : 0;
            message.channel.send(`${numOwners} ${numOwners > 1 ? "personnes ont été supprimées " : "personne a été supprimée"} de la whiteliste`);
          
            let delOwner = 0;
            for (let i = 0; i < membersWithId.length; i++) {
              db.delete(membersWithId[i].id);
              delOwner++;
            }
          }
          
          if (args[0] && args[0] == 'remove') {
            if (args[1]) {
              let member = client.users.cache.get(message.author.id);
              if (args[1]) {
                member = client.users.cache.get(args[1]);
              } else {
                return message.channel.send(`Aucun membre trouvé pour \`${args[1] || " "}\``)
    
              }
              if (message.mentions.members.first()) {
                member = client.users.cache.get(message.mentions.members.first().id);
              }
              if (!member) return message.channel.send(`Aucun membre trouvé pour \`${args[1] || " "}\``)
              if (await db.get(`wl_${client.user.id}_${member.id}`) === null) return message.channel.send(`${member.username} n'est pas whitelisted`)
              db.delete(`wl_${client.user.id}_${member.id}`)
              message.channel.send(`${member.username} n'est plus whitelisted`)
            }
    
          }
          if (!args[0]) {
    
    
            let members = await db.all(`wl_${client.user.id}_`)
    
            if (!Array.isArray(members)) {
              members = [members];
            }
    
            const membersWithId = members
            .filter(m => m.id.startsWith("wl_"))
            .map((m, index) => {
              const memberId = m.id.split("_")[2];
              if (memberId) {
                return `${index + 1} - <@${memberId}> (${memberId})\n`;
              }
            });
          
          const messageContent = membersWithId.reduce((prev, current) => {
            return prev + current;
          }, "");
          
          let embed = new EmbedBuilder()
            .setTitle("Liste des membres")
            .setDescription(
              messageContent
                ? `Les membres suivants se trouvent dans la base de données :\n\n ${messageContent}`
                : "La liste est vide"
            )
            .setColor('Blue')
          
          message.channel.send({ embeds: [embed] });
          
              
        
    
          }
        
     
    },
};
