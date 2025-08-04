const {EmbedBuilder} = require('discord.js')
const config = require('../../config.json')

module.exports = {
    name: 'test',
    description: 'command de test ',
    category:"owner",
    usage:`**${config.prefix}** test`,
    execute(client, message, args) {
        
       message.channel.send('je suis 100% opperationel')
     
    },
};
