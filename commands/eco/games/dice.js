const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  name: 'dice',
  description: '🎲 Lance un dé et mise sur un chiffre ou une catégorie !',
  async execute(client, message, args) {
    const userId = message.author.id;
    const check = await db.get(`check_${userId}`);

    if (!check) {
      return message.channel.send('❌ Vous devez rejoindre le système de jeu avant de jouer.');
    }

    let userBalance = (await db.get(`cash_${userId}`)) || 0;

    await message.channel.send(`💰 Votre solde actuel : **${userBalance}** 💵\nQuel est le montant que vous voulez parier ?`);

    const filterAmount = response => response.author.id === message.author.id && !isNaN(response.content) && parseInt(response.content) > 0;

    try {
      const collected = await message.channel.awaitMessages({ filter: filterAmount, max: 1, time: 30000 });

      if (!collected || collected.size === 0) return message.channel.send('⏳ Temps écoulé, pari annulé.');

      const betAmount = parseInt(collected.first().content) || 100;
      if (betAmount <= 0) return message.channel.send('❌ Vous devez entrer un montant valide supérieur à 0.');
      if (betAmount > userBalance) return message.channel.send('❌ Fonds insuffisants.');

      // Déduire la mise avant de jouer
      await db.set(`cash_${userId}`, userBalance - betAmount);

      const embed = new EmbedBuilder()
        .setColor('DarkGold')
        .setTitle('🎲 Choisissez votre pari !')
        .setDescription('Misez sur un chiffre (1-6) ou une catégorie !')
        .addFields(
          { name: '🎯 Chiffre (1-6)', value: 'Cliquez pour choisir un **chiffre précis**.', inline: false },
          { name: '⚖️ Pair / Impair', value: 'Cliquez pour miser sur **Pair** ou **Impair**.', inline: true },
          { name: '⬆️ Haut / Bas', value: 'Cliquez pour miser sur **1-3 (Bas)** ou **4-6 (Haut)**.', inline: true }
        )
        .setFooter({ text: '⏳ Vous avez 30 secondes pour choisir votre pari.' });

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder().setCustomId('number').setLabel('🎯 Chiffre').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('even').setLabel('⚖️ Pair').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('odd').setLabel('⚖️ Impair').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('low').setLabel('⬇️ Bas (1-3)').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('high').setLabel('⬆️ Haut (4-6)').setStyle(ButtonStyle.Secondary)
        );

      const diceMessage = await message.channel.send({ embeds: [embed], components: [row] });

      const filter = i => i.user.id === message.author.id;
      const collector = diceMessage.createMessageComponentCollector({ filter, time: 30000 });

      collector.on('collect', async interaction => {
        await interaction.deferUpdate();
        let bet = null;

        if (interaction.customId === 'number') {
          await interaction.followUp('🎯 Choisissez un chiffre entre **1 et 6** :');

          try {
            const numCollected = await message.channel.awaitMessages({
              filter: response => response.author.id === message.author.id && [1, 2, 3, 4, 5, 6].includes(parseInt(response.content)),
              max: 1,
              time: 30000
            });

            bet = parseInt(numCollected.first().content);
          } catch {
            return interaction.followUp('⏳ Temps écoulé, vous n\'avez pas choisi de chiffre.');
          }
        } else {
          bet = interaction.customId;
        }

        // 🎲 Lancer du dé
        const diceRoll = Math.floor(Math.random() * 6) + 1;
        const isEven = diceRoll % 2 === 0;
        const isHigh = diceRoll > 3;

        let outcomeMessage = '';
        let amountWon = 0;
        let amountLost = betAmount; // Montant initialement perdu

        if (typeof bet === 'number') {
          if (bet === diceRoll) {
            outcomeMessage = '🎉 Félicitations, vous avez deviné le bon chiffre !';
            amountWon = betAmount * 6;
            amountLost = 0;
          } else {
            outcomeMessage = '😞 Dommage, vous avez perdu votre pari.';
          }
        } else {
          if ((bet === 'even' && isEven) || (bet === 'odd' && !isEven)) {
            outcomeMessage = '🎉 Félicitations, vous avez gagné votre pari sur Pair/Impair !';
            amountWon = betAmount * 2;
            amountLost = 0;
          } else if ((bet === 'low' && !isHigh) || (bet === 'high' && isHigh)) {
            outcomeMessage = '🎉 Félicitations, vous avez gagné votre pari sur Haut/Bas !';
            amountWon = betAmount * 2;
            amountLost = 0;
          } else {
            outcomeMessage = '😞 Dommage, vous avez perdu votre pari.';
          }
        }

        // Si le joueur gagne, on lui ajoute ses gains + sa mise initiale
        if (amountWon > 0) {
          await db.set(`cash_${userId}`, (await db.get(`cash_${userId}`)) + amountWon + betAmount);
        }

        const resultEmbed = new EmbedBuilder()
          .setColor(amountWon > 0 ? 'DarkGreen' : 'DarkRed')
          .setTitle('🎲 Résultat du lancer de dé !')
          .setDescription(`Le dé a été lancé et le résultat est : **${diceRoll}**`)
          .addFields(
            { name: '⚖️ Pair/Impair', value: isEven ? '**Pair**' : '**Impair**', inline: true },
            { name: '⬆️ Haut/Bas', value: isHigh ? '**Haut (4-6)**' : '**Bas (1-3)**', inline: true },
            { name: '🎲 Votre Pari', value: `**${bet}**`, inline: true },
            { name: '💰 Montant gagné/perdu', value: amountWon > 0 ? `✅ +${amountWon} 💵` : `❌ -${amountLost} 💵`, inline: true },
            { name: '💰 Nouveau solde', value: `${await db.get(`cash_${userId}`)} 💵`, inline: false }
          );

        await interaction.followUp({ embeds: [resultEmbed], content: outcomeMessage });
      });

      collector.on('end', collected => {
        if (collected.size === 0) {
          diceMessage.edit({ content: '⏳ Le temps est écoulé, aucune action n\'a été effectuée.', components: [] });
        }
      });

    } catch {
      message.channel.send('⏳ Temps écoulé, vous n\'avez pas saisi de montant valide.');
    }
  }
};
