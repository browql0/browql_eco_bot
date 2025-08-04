const { QuickDB } = require('quick.db');
const db = new QuickDB();
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config.json');

module.exports = {
  name: 'casino',
  category: 'eco',
  description: "🎰 Accédez au casino et choisissez un jeu !",
  async execute(client, message, args) {
    const embed = new EmbedBuilder()
      .setColor('DarkButNotBlack')
      .setTitle("🎰 Bienvenue au Casino !")
      .setDescription("Choisissez un jeu parmi ceux disponibles ci-dessous :")
      .addFields(
        { name: "🎲 Dice Game", value: "Pariez et lancez un dé !", inline: true },
        { name: "🃏 Blackjack", value: "Jouez contre le croupier !", inline: true },
        { name: "🎡 Roulette", value: "Misez sur une couleur et tentez votre chance !", inline: true },
        { name: "💎 Plinko", value: " Un jeton tombe dans un labyrinthe de clous !", inline: true },
        { name: "✈️ Aviator", value: "cash out avant que l’avion ne s’écrase. 🎮", inline: true }

      );

    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('dice')
          .setLabel('🎲 Dice Game')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('blackjack')
          .setLabel('🃏 Blackjack')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('roulette')
          .setLabel('🎡 Roulette')
          .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
          .setCustomId('plinko')
          .setLabel('💎 Plinko')
          .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
          .setCustomId('aviator')
          .setLabel('✈️ Aviator ')
          .setStyle(ButtonStyle.Primary)
      );

    const casinoMessage = await message.channel.send({ embeds: [embed], components: [buttons] });

    const filter = i => i.user.id === message.author.id;
    const collector = casinoMessage.createMessageComponentCollector({ filter, time: 30000 });

    collector.on('collect', async interaction => {
      if (interaction.customId === 'dice') {
        await interaction.deferUpdate();
        require('./games/dice').execute(client, message, args);
      } else if (interaction.customId === 'blackjack') {
        await interaction.deferUpdate();
        require('./games/blackjack').execute(client, message, args);
      } else if (interaction.customId === 'roulette') {
        await interaction.deferUpdate();
        require('./games/roulette').execute(client, message, args);
      }else if (interaction.customId === 'plinko') {
        await interaction.deferUpdate();
        require('./games/plinko').execute(client, message, args)
      }else if (interaction.customId === 'aviator') {
        await interaction.deferUpdate();
        require('./games/aviator').execute(client, message, args)
      }
    })
  },
};
