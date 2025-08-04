const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  name: 'blackjack',
  description: '🃏 Joue une partie de Blackjack contre le bot !',
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

      const betAmount = parseInt(collected.first().content);
      if (betAmount <= 0) return message.channel.send('❌ Vous devez entrer un montant valide supérieur à 0.');
      if (betAmount > userBalance) return message.channel.send('❌ Fonds insuffisants.');

      await db.set(`cash_${userId}`, userBalance - betAmount);

      const deck = createDeck();
      let playerHand = [drawCard(deck), drawCard(deck)];
      let dealerHand = [drawCard(deck), drawCard(deck)];

      let playerTotal = calculateTotal(playerHand);
      let dealerTotal = calculateTotal(dealerHand);

      const embed = new EmbedBuilder()
        .setColor('DarkBlue')
        .setTitle('🃏 Blackjack')
        .setDescription(`Votre mise : **${betAmount}** 💰\n\n🂠 Votre main : ${displayHand(playerHand)} (**${playerTotal}**)`)
        .addFields({ name: '🎰 Main du croupier', value: `🂠 ${dealerHand[1]}` })
        .setFooter({ text: '⏳ Cliquez sur "Hit" pour tirer une carte ou "Stand" pour rester.' });

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder().setCustomId('hit').setLabel('🎯 Hit (Tirer)').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('stand').setLabel('🛑 Stand (Rester)').setStyle(ButtonStyle.Secondary)
        );

      const gameMessage = await message.channel.send({ embeds: [embed], components: [row] });

      const filter = i => i.user.id === message.author.id;
      const collector = gameMessage.createMessageComponentCollector({ filter, time: 60000 });

      collector.on('collect', async interaction => {
        await interaction.deferUpdate();

        if (interaction.customId === 'hit') {
          playerHand.push(drawCard(deck));
          playerTotal = calculateTotal(playerHand);

          if (playerTotal > 21) {
            collector.stop('bust');
          } else {
            await updateGameMessage(gameMessage, playerHand, dealerHand, playerTotal, betAmount);
          }
        } else if (interaction.customId === 'stand') {
          collector.stop('stand');
        }
      });

      collector.on('end', async (collected, reason) => {
        if (reason === 'bust') {
          const bustEmbed = new EmbedBuilder()
            .setColor('DarkRed')
            .setTitle('💥 Vous avez dépassé 21 !')
            .setDescription(`Vous perdez votre mise de **${betAmount}** 💰.`)
            .addFields(
              { name: '🎲 Votre main', value: `${displayHand(playerHand)} (**${playerTotal}**)`, inline: true },
              { name: '🎰 Main du croupier', value: `${displayHand(dealerHand)} (**${dealerTotal}**)`, inline: true },
              { name: '💰 Nouveau solde', value: `${await db.get(`cash_${userId}`)} 💵`, inline: false }
            );

          await gameMessage.edit({ embeds: [bustEmbed], components: [] });
          return;
        }

        // Tour du croupier
        while (dealerTotal < 17) {
          dealerHand.push(drawCard(deck));
          dealerTotal = calculateTotal(dealerHand);
        }

        let resultMessage = '';
        let amountWon = 0;

        if (dealerTotal > 21 || playerTotal > dealerTotal) {
          resultMessage = '🎉 Félicitations, vous avez gagné !';
          amountWon = betAmount * 2;
          await db.set(`cash_${userId}`, userBalance - betAmount + amountWon);
        } else if (playerTotal === dealerTotal) {
          resultMessage = '⚖️ Égalité, vous récupérez votre mise.';
          amountWon = betAmount;
          await db.set(`cash_${userId}`, userBalance);
        } else {
          resultMessage = '😞 Vous avez perdu votre mise.';
        }

        const finalEmbed = new EmbedBuilder()
          .setColor('DarkRed')
          .setTitle('🃏 Résultat du Blackjack')
          .setDescription(resultMessage)
          .addFields(
            { name: '🎲 Votre main', value: `${displayHand(playerHand)} (**${playerTotal}**)`, inline: true },
            { name: '🎰 Main du croupier', value: `${displayHand(dealerHand)} (**${dealerTotal}**)`, inline: true },
            { name: '💰 Nouveau solde', value: `${await db.get(`cash_${userId}`)} 💵`, inline: false }
          );

        await gameMessage.edit({ embeds: [finalEmbed], components: [] });
      });

    } catch {
      message.channel.send('⏳ Temps écoulé, vous n\'avez pas saisi de montant valide.');
    }
  }
};

// 🎴 Crée un deck de cartes
function createDeck() {
  const suits = ['♠', '♥', '♦', '♣'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  let deck = [];
  suits.forEach(suit => values.forEach(value => deck.push(value + suit)));
  return deck.sort(() => Math.random() - 0.5);
}

// 🎴 Tire une carte aléatoire
function drawCard(deck) {
  return deck.pop();
}

// 📊 Calcule le total d'une main
function calculateTotal(hand) {
  let total = 0;
  let aces = 0;
  hand.forEach(card => {
    let value = card.slice(0, -1);
    if (['J', 'Q', 'K'].includes(value)) total += 10;
    else if (value === 'A') {
      total += 11;
      aces += 1;
    } else total += parseInt(value);
  });
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
}

// 🃏 Affiche la main sous forme lisible
function displayHand(hand) {
  return hand.join(' ');
}

// 🔄 Met à jour l'affichage du jeu
async function updateGameMessage(gameMessage, playerHand, dealerHand, playerTotal, betAmount) {
  const newEmbed = new EmbedBuilder()
    .setColor('DarkBlue')
    .setTitle('🃏 Blackjack')
    .setDescription(`Votre mise : **${betAmount}** 💰\n\n🂠 Votre main : ${displayHand(playerHand)} (**${playerTotal}**)`)
    .addFields({ name: '🎰 Main du croupier', value: `🂠 ${dealerHand[1]}` })
    .setFooter({ text: '⏳ Cliquez sur "Hit" pour tirer une carte ou "Stand" pour rester.' });

  await gameMessage.edit({ embeds: [newEmbed] });
}
