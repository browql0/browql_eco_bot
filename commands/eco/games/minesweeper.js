const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  name: 'minesweeper',
  description: '💣 Jouez au jeu du démineur et tentez de gagner gros !',
  async execute(client, message, args) {
    const userId = message.author.id;
    const userBalance = await db.get(`cash_${userId}`) || 0;
    const betAmount = parseInt(args[0], 10) || 100;

    if (betAmount > userBalance) {
      return message.reply('❌ Montant invalide ou insuffisant.');
    }

    await db.set(`bet_${userId}`, betAmount);
    await db.sub(`cash_${userId}`, betAmount);

    const difficultyEmbed = new EmbedBuilder()
      .setColor('DarkBlue')
      .setTitle('💣 Choisissez votre difficulté !')
      .setDescription('Sélectionnez un mode de jeu :')
      .addFields(
        { name: '🟢 Facile', value: '5 💣 - Multiplicateurs normaux', inline: true },
        { name: '🟡 Moyen', value: '10 💣 - Gains augmentés', inline: true },
        { name: '🔴 Difficile', value: '15 💣 - Gains très élevés', inline: true }
      )
      .setFooter({ text: '⏳ Vous avez 30 secondes pour choisir.' });

    const difficultyRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setCustomId('easy').setLabel('🟢 Facile').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('medium').setLabel('🟡 Moyen').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('hard').setLabel('🔴 Difficile').setStyle(ButtonStyle.Danger)
      );

    const difficultyMessage = await message.channel.send({ embeds: [difficultyEmbed], components: [difficultyRow] });

    const filter = i => i.user.id === message.author.id;
    const difficultyCollector = difficultyMessage.createMessageComponentCollector({ filter, max: 1, time: 30000 });

    difficultyCollector.on('collect', async interaction => {
      await interaction.deferUpdate();

      let bombCount;
      let multipliers;
      let difficultyText;

      if (interaction.customId === 'easy') {
        bombCount = 5;
        multipliers = [1.2, 1.5, 2, 3, 5];
        difficultyText = '🟢 Facile';
      } else if (interaction.customId === 'medium') {
        bombCount = 10;
        multipliers = [1.5, 2, 3, 5, 7];
        difficultyText = '🟡 Moyen';
      } else {
        bombCount = 15;
        multipliers = [2, 3, 5, 7, 10];
        difficultyText = '🔴 Difficile';
      }

      await db.set(`mines_${userId}`, bombCount);
      await db.set(`multiplier_${userId}`, multipliers);
      await db.set(`safe_${userId}`, 0);
      await db.set(`grid_${userId}`, Array(25).fill('🔳'));

      await message.channel.send(`Vous avez choisi **${difficultyText}** ! 💣 Le jeu commence...`);
      startMinesweeperGame(client, message, userId, bombCount, multipliers, betAmount);
    });
  }
};

async function startMinesweeperGame(client, message, userId, bombCount, multipliers, betAmount) {
  let grid = await db.get(`grid_${userId}`);
  grid = chunkArray(grid, 5);
  
  const gameEmbed = new EmbedBuilder()
    .setColor('Green')
    .setTitle('💣 Démineur')
    .setDescription(grid.map(row => row.join(' ')).join('\n'))
    .addFields(
      { name: '💰 Gain potentiel', value: '0 💰', inline: true },
      { name: '✅ Cases sûres trouvées', value: '0' }
    );

  const gameRow = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder().setCustomId('reveal').setLabel('🔍 Révéler une case').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('cashout').setLabel('💰 Encaisser les gains').setStyle(ButtonStyle.Success)
    );

  const gameMessage = await message.channel.send({ embeds: [gameEmbed], components: [gameRow] });

  const filter = i => i.user.id === message.author.id;
  const gameCollector = gameMessage.createMessageComponentCollector({ filter, time: 60000 });

  gameCollector.on('collect', async interaction => {
    if (interaction.customId === 'reveal') {
      await interaction.deferUpdate();
      const safeCount = await db.get(`safe_${userId}`) + 1;
      const bombChance = Math.random() < bombCount / 25;
      let updatedGrid = await db.get(`grid_${userId}`);
      
      if (bombChance) {
        updatedGrid[safeCount - 1] = '💣';
        await message.channel.send('💥 Vous avez touché une 💣 ! Vous perdez votre mise.');
        await db.sub(`cash_${userId}`, betAmount);
        gameCollector.stop();
      } else {
        updatedGrid[safeCount - 1] = '✅';
        await db.set(`safe_${userId}`, safeCount);
        await db.set(`grid_${userId}`, updatedGrid);
        const potentialWinnings = betAmount * (multipliers[Math.min(safeCount - 1, multipliers.length - 1)] || 1);
        gameEmbed.setDescription(chunkArray(updatedGrid, 5).map(row => row.join(' ')).join('\n'));
        gameEmbed.setFields(
          { name: '💰 Gain potentiel', value: `${potentialWinnings} 💰`, inline: true },
          { name: '✅ Cases sûres trouvées', value: safeCount.toString() }
        );
        await gameMessage.edit({ embeds: [gameEmbed] });
      }
    }
  });
}

function chunkArray(array, size) {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) => 
    array.slice(i * size, i * size + size)
  );
}
