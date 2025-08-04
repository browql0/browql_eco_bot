const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  name: 'plinko',
  description: '💎 Jouez à Plinko et regardez la balle tomber en direct !',
  async execute(client, message, args) {
    const userId = message.author.id;
    const check = await db.get(`check_${userId}`);

    if (!check) {
      return message.channel.send('❌ Vous devez rejoindre le système de jeu avec la commande appropriée avant de jouer.');
    }
    let userBalance = (await db.get(`cash_${userId}`)) || 0;

    await message.channel.send(`💰 Votre solde actuel : **${userBalance}** 💵\nQuel est le montant que vous voulez parier ? `);

    const filterAmount = response => response.author.id === message.author.id && !isNaN(response.content) && parseInt(response.content) > 0;

    try {
      const collected = await message.channel.awaitMessages({ filter: filterAmount, max: 1, time: 30000 });
      if (!collected || collected.size === 0) return message.channel.send('⏳ Temps écoulé, pari annulé.');

      const betAmount = parseInt(collected.first().content) || 100;
      if (betAmount <= 0) return message.channel.send('❌ Vous devez entrer un montant valide supérieur à 0.');
      if (betAmount > userBalance) return message.channel.send('❌ Fonds insuffisants.');
      await db.set(`cash_${userId}`, userBalance - betAmount);

      const embed = new EmbedBuilder()
        .setColor('Gold')
        .setTitle('💎 Plinko - Choisissez votre niveau de risque')
        .setDescription('Sélectionnez la difficulté du plateau de Plinko.')
        .addFields(
          { name: '⚪ Faible', value: 'Multiplicateurs : x0.5, x1, x1.5, x2', inline: true },
          { name: '🔵 Moyen', value: 'Multiplicateurs : x0.1, x0.3, x0.8, x1.5, x3', inline: true },
          { name: '🔴 Élevé', value: 'Multiplicateurs : x0, x0, x0, x0.1, x0.3, x0.5, x5, x10', inline: true }
        )
        .setFooter({ text: '⏳ Vous avez 30 secondes pour choisir votre niveau de risque.' });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('low').setLabel('⚪ Faible').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('medium').setLabel('🔵 Moyen').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('high').setLabel('🔴 Élevé').setStyle(ButtonStyle.Danger)
      );

      const plinkoMessage = await message.channel.send({ embeds: [embed], components: [row] });
      const filter = i => i.user.id === message.author.id;
      const collector = plinkoMessage.createMessageComponentCollector({ filter, time: 30000 });

      collector.on('collect', async interaction => {
        await interaction.deferUpdate();

        let multipliers, difficulty;
        if (interaction.customId === 'low') {
          multipliers = [0.5, 1, 1.5, 2];
          difficulty = '⚪ Faible';
        } else if (interaction.customId === 'medium') {
          multipliers = [0.3,0.1, 0.8, 1.5, 3];
          difficulty = '🔵 Moyen';
        } else {
          multipliers = [0,0.1,0.3,  0.5, 5, 10, 0];
          difficulty = '🔴 Élevé';
        }

        const boardSize = 7;
        let board = Array.from({ length: boardSize }, () => Array(boardSize).fill('⬛'));
        let position = Math.floor(boardSize / 2);
        let dropMessage = await message.channel.send('🏆 **Plinko en cours...**');
        let assignedMultipliers = [];

        for (let i = 0; i < boardSize; i++) {
          assignedMultipliers.push(multipliers[i % multipliers.length]);
        }

        for (let i = 0; i < boardSize; i++) {
          board[i][position] = '🔴';
          const displayBoard = board.map(row => row.join('')).join('\n');
          const bottomRow = assignedMultipliers.map(m => `✨ x${m}`).join('  ');

          const dropEmbed = new EmbedBuilder()
            .setColor('Orange')
            .setTitle('🏛️ Plinko en cours...')
            .setDescription(`${displayBoard}\n⬛⬛⬛⬛⬛⬛⬛\n${bottomRow}`)
            .setFooter({ text: '⏳ Patientez quelques instants...' });

          await dropMessage.edit({ embeds: [dropEmbed] });
          await new Promise(resolve => setTimeout(resolve, 500));
          board[i][position] = '⬛';

          if (Math.random() > 0.5 && position < boardSize - 1) position++;
          else if (position > 0) position--;
        }

        const resultMultiplier = assignedMultipliers[position];
        const winnings = Math.floor(betAmount * resultMultiplier);
        const newBalance = userBalance - betAmount + winnings;

        await db.set(`cash_${userId}`, newBalance);

        const resultEmbed = new EmbedBuilder()
          .setColor(winnings > 0 ? 'Green' : 'Red')
          .setTitle('💎 Résultat du Plinko')
          .setDescription(`La balle est tombée sur un multiplicateur de **x${resultMultiplier}** !`)
          .addFields(
            { name: '🎲 Mise initiale', value: `${betAmount} 💵`, inline: true },
            { name: '🎰 Multiplicateur', value: `x${resultMultiplier}`, inline: true },
            { name: '💰 Gains', value: winnings > 0 ? `✅ +${winnings} 💵` : `❌ 0`, inline: true },
            { name: '💰 Nouveau solde', value: `${newBalance} 💵`, inline: false }
          )
          .setFooter({ text: 'Merci de jouer à Plinko !' });

        await message.channel.send({ embeds: [resultEmbed] });
      });
    } catch {
      return message.channel.send('⏳ Temps écoulé, vous n\'avez pas saisi de montant valide.');
    }
  }
};
