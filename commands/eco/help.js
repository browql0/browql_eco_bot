const {EmbedBuilder} = require('discord.js')
const config = require('../../config.json')

module.exports = {
    name: 'help',
    description: 'Affiche la liste des commandes disponibles',
    category:"public",
    usage:`**${config.prefix}** help  ||<command>`,
    execute(client, message, args) {
        const command = client.commands.get(args[0]) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(args[0]));
        if(!args[0]) {
            const commands = Array.from(client.commands.values());
            const categories = new Set(commands.map(c => c.category));
          
            let helpEmbed = new EmbedBuilder()
            .setTitle('Liste des commandes')
            .setColor('DarkButNotBlack')
            for (const category of categories) {
                let cmdList = commands.filter(cmd => cmd.category === category)
                                       .map(cmd => `\`${cmd.name}\``);
                helpEmbed.addFields(
                    {name: `${category}`, value: `${cmdList}` }
                    
                    );
            }
            message.channel.send({embeds : [helpEmbed]});
           }else if(args[0] == command.name){
            const ee = new EmbedBuilder()
            .setColor('DarkButNotBlack')
            .setTitle(`${command.name}`)
            .setDescription(`**description :**\n${command.description}\n**categorie :**\n${command.category}\n**usage :**\n${command.usage}\n**cooldown :**\n${command.cooldown}`)
            
            message.channel.send({embeds : [ee]})

        }
     
    },
};
