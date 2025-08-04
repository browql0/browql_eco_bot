const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  name: 'roulette',
  description: '🎡 Jouez à la roulette et misez sur une couleur ou un numéro !',
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

      // Déduction immédiate de la mise
      await db.set(`cash_${userId}`, userBalance - betAmount);

      const embed = new EmbedBuilder()
        .setColor('DarkGold')
        .setTitle('🎡 Choisissez votre pari !')
        .setDescription('Misez sur une couleur ou un numéro !')
        .addFields(
          { name: '🔴 Rouge', value: 'Cliquez pour parier sur **Rouge**.', inline: true },
          { name: '⚫ Noir', value: 'Cliquez pour parier sur **Noir**.', inline: true },
          { name: '🔢 Numéro', value: 'Cliquez pour parier sur un **numéro** (1-36).', inline: false }
        )
        .setFooter({ text: '⏳ Vous avez 30 secondes pour choisir votre pari.' });

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder().setCustomId('red').setLabel('🔴 Rouge').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('black').setLabel('⚫ Noir').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('number').setLabel('🔢 Numéro').setStyle(ButtonStyle.Success)
        );

      const rouletteMessage = await message.channel.send({ embeds: [embed], components: [row] });

      const filter = i => i.user.id === message.author.id;
      const collector = rouletteMessage.createMessageComponentCollector({ filter, time: 30000 });

      collector.on('collect', async interaction => {
        await interaction.deferUpdate();

        let bet = null;
        const numbers = Array.from({ length: 36 }, (_, i) => i + 1);
        
        if (interaction.customId === 'red' || interaction.customId === 'black') {
          bet = interaction.customId === 'red' ? 'Rouge' : 'Noir';
        } else if (interaction.customId === 'number') {
          await interaction.followUp('🎯 Choisissez un numéro entre **1 et 36** :');

          try {
            const numCollected = await message.channel.awaitMessages({
              filter: response => response.author.id === message.author.id && numbers.includes(parseInt(response.content)),
              max: 1,
              time: 30000
            });

            bet = parseInt(numCollected.first().content);
          } catch {
            return interaction.followUp('⏳ Temps écoulé, vous n\'avez pas choisi de numéro.');
          }
        }

        // 🎰 Simulation du résultat de la roulette
        const winningColor = Math.random() > 0.5 ? 'Rouge' : 'Noir';
        const winningNumber = numbers[Math.floor(Math.random() * numbers.length)];

        // 📢 Affichage des résultats
        const resultEmbed = new EmbedBuilder()
          .setColor('DarkGreen')
          .setTitle('🎰 Résultat de la Roulette !')
          .setDescription(`La roulette a tourné et voici le résultat :`)
          .addFields(
            { name: '🏆 Couleur gagnante', value: `**${winningColor}**`, inline: true },
            { name: '🎯 Numéro gagnant', value: `**${winningNumber}**`, inline: true }
          );

        let outcomeMessage = '';
        let amountWonLost = -betAmount; // Par défaut, on suppose une perte

        if (typeof bet === 'string') { // Pari sur une couleur
          if (bet === winningColor) {
            outcomeMessage = '🎉 Félicitations, vous avez gagné votre pari sur la couleur !';
            amountWonLost = betAmount * 2; // Gains = Mise x2
          } else {
            outcomeMessage = '😞 Dommage, vous avez perdu votre pari sur la couleur.';
          }
        } else if (typeof bet === 'number') { // Pari sur un numéro
          if (bet === winningNumber) {
            outcomeMessage = '🎊 Bravo ! Vous avez gagné avec votre pari sur le numéro !';
            amountWonLost = betAmount * 35; // Gains = Mise x35
          } else {
            outcomeMessage = '❌ Dommage, vous avez perdu votre pari sur le numéro.';
          }
        }

        // Mise à jour du solde du joueur
        const newBalance = userBalance - betAmount + amountWonLost;
        await db.set(`cash_${userId}`, newBalance);

        // Ajout des résultats dans l'embed
        resultEmbed.addFields(
          { name: '🎲 Votre Pari', value: `${bet}`, inline: true },
          { name: '💰 Montant gagné/perdu', value: amountWonLost > 0 ? `✅ +${amountWonLost}` : `❌ ${amountWonLost}`, inline: true },
          { name: '💰 Nouveau solde', value: `${newBalance} 💵`, inline: false }
        );

        // 📢 Envoi du résultat
        await interaction.followUp({ embeds: [resultEmbed], content: outcomeMessage });
      });

      collector.on('end', collected => {
        if (collected.size === 0) {
          rouletteMessage.edit({ content: '⏳ Le temps est écoulé, aucune action n\'a été effectuée.', components: [] });
        }
      });

    } catch {
      message.channel.send('⏳ Temps écoulé, vous n\'avez pas saisi de montant valide.');
    }
  }
};
