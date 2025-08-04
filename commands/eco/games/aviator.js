const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  name: 'aviator',
  description: '✈️ Jouez à Aviator et tentez de cash out avant le crash !',
  async execute(client, message, args) {
    const member = message.author;
    const check = await db.get(`check_${member.id}`) || false;

    if (!check) {
      return message.channel.send('❌ Vous devez rejoindre le système de jeu avec la commande appropriée avant de jouer.');
    }

    let cash = (await db.get(`cash_${member.id}`)) || 0;
    
    await message.channel.send(`💰 Quel est le montant que vous voulez parier ? (Vous avez **${cash}** 💰 disponibles)`);

    const filterAmount = response => 
      response.author.id === message.author.id && 
      !isNaN(response.content) && 
      parseInt(response.content) > 0;

    try {
      const collected = await message.channel.awaitMessages({
        filter: filterAmount,
        max: 1,
        time: 30000
      });

      if (!collected || collected.size === 0) {
        return message.channel.send('⏳ Temps écoulé, vous n\'avez pas saisi de montant valide.');
      }

      const betAmount = parseInt(collected.first().content);

      if (betAmount <= 0) {
        return message.channel.send('❌ Vous devez entrer un montant valide supérieur à 0.');
      }

      if (betAmount > cash) {
        return message.channel.send(`❌ Vous n'avez pas assez d'argent ! Solde disponible : **${cash}** 💰`);
      }

      // Déduire la mise du cash
      await db.set(`cash_${member.id}`, cash - betAmount);

      let multiplier = 1.0;
      const crashPoint = (Math.random() * 5 + 1).toFixed(2);
      let cashedOut = false;
      
      const runway = ['🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩'];
      let planePosition = 0;

      const embed = new EmbedBuilder()
        .setColor('DarkOrange')
        .setTitle('✈️ **Aviator en cours...**')
        .setDescription(`Multiplicateur actuel: **x${multiplier.toFixed(2)}**\n\n💰 Cash Out avant le crash !\n\n${runway.join(' ')}`)
        .setFooter({ text: 'Cliquez sur "Cash Out" pour récupérer vos gains !' });

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('cashout')
            .setLabel('💸 Cash Out')
            .setStyle(ButtonStyle.Success)
        );

      const gameMessage = await message.channel.send({ embeds: [embed], components: [row] });

      const filter = i => i.user.id === message.author.id && i.customId === 'cashout';
      const collector = gameMessage.createMessageComponentCollector({ filter, time: 15000 });

      collector.on('collect', async interaction => {
        cashedOut = true;
        const winnings = (betAmount * multiplier).toFixed(2);
        
        await db.set(`cash_${member.id}`, (await db.get(`cash_${member.id}`)) + parseFloat(winnings));

        await interaction.update({
          embeds: [
            new EmbedBuilder()
              .setColor('Green')
              .setTitle('💸 **Cash Out réussi !**')
              .setDescription(`Vous avez encaissé à **x${multiplier.toFixed(2)}** !\n\n🎉 **Gains:** ${winnings} 💰`)
          ],
          components: []
        });
        collector.stop();
      });

      const interval = setInterval(async () => {
        if (cashedOut || multiplier >= crashPoint) {
          clearInterval(interval);
          if (!cashedOut) {
            runway[planePosition] = '💥';
            await gameMessage.edit({
              embeds: [
                new EmbedBuilder()
                  .setColor('Red')
                  .setTitle('💥 **Crash !**')
                  .setDescription(`L'avion s'est écrasé à **x${crashPoint}** 💀\n\n❌ Vous avez perdu votre mise.\n\n${runway.join(' ')}`)
              ],
              components: []
            });
          }
          return;
        }

        multiplier += 0.2 + Math.random() * 0.2;

        if (planePosition < runway.length - 1) {
          runway[planePosition] = '🟩';
          planePosition++;
          runway[planePosition] = '✈️💨';
        }

        await gameMessage.edit({
          embeds: [
            new EmbedBuilder()
              .setColor('DarkOrange')
              .setTitle('✈️ **Aviator en cours...**')
              .setDescription(`Multiplicateur actuel: **x${multiplier.toFixed(2)}**\n\n💰 Cash Out avant le crash !\n\n${runway.join(' ')}`)
              .setFooter({ text: 'Cliquez sur "Cash Out" pour récupérer vos gains !' })
          ]
        });

      }, 1200);

    } catch {
      message.channel.send('⏳ Temps écoulé, vous n\'avez pas saisi de montant valide.');
    }
  }
};
