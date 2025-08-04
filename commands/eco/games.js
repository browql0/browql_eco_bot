const { QuickDB } = require('quick.db');
const db = new QuickDB();
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config.json');

module.exports = {
  name: 'games',
  category: 'eco',
  description: "🎰 Accédez au casino et choisissez un jeu !",
  async execute(client, message, args) {
    const embed = new EmbedBuilder()
      .setColor('DarkButNotBlack')
      .setTitle("🎰 Bienvenue au Casino !")
      .setDescription("Choisissez un jeu parmi ceux disponibles ci-dessous :")
      .addFields(
        { name: "💣 Minesweeper", value: "Jouez au démineur et tentez de gagner gros !", inline: true },
        { name: "🍒 slot", value: "Joue à la machine à sous et tente de gagner gros !", inline: true },
        

      );

    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('mines')
          .setLabel('💣 Mines')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('slot')
          .setLabel('🍒 slot')
          .setStyle(ButtonStyle.Primary)
          
       
      );

    const casinoMessage = await message.channel.send({ embeds: [embed], components: [buttons] });

    const filter = i => i.user.id === message.author.id;
    const collector = casinoMessage.createMessageComponentCollector({ filter, time: 30000 });

    collector.on('collect', async interaction => {
      if (interaction.customId === 'mines') {
        await interaction.deferUpdate();
        require('./games/minesweeper').execute(client, message, args);
      } else if (interaction.customId === 'slot') {
        await interaction.deferUpdate();
        require('./games/slots').execute(client, message, args);
      } 
    })
  },
};
