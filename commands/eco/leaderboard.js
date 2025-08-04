const { QuickDB } = require('quick.db');
const db = new QuickDB();
const { EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
  name: 'lb',
  category: 'eco',
  cooldown: 10,
  usage: `**${config.prefix}**leaderboard`,
  description: "Affiche le classement des membres les plus riches.",
  async execute(client, message, args) {
    let allUsers = await db.all();
    
    // Filtrer uniquement les utilisateurs ayant un solde
    let usersWithMoney = allUsers.filter(data => data.id.startsWith('cash_') || data.id.startsWith('bank_'));
    
    let userBalances = {};
    usersWithMoney.forEach(data => {
      let userId = data.id.split('_')[1];
      if (!userBalances[userId]) userBalances[userId] = 0;
      userBalances[userId] += parseInt(data.value);
    });
    
    // Trier les utilisateurs par leur richesse totale (cash + bank)
    let sortedUsers = Object.entries(userBalances)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10); // Top 10

    let leaderboard = sortedUsers.map(async (user, index) => {
      let userData = await client.users.fetch(user[0]).catch(() => null);
      return `**${index + 1}.** ${userData ? userData.username : 'Utilisateur inconnu'} - 💰 ${user[1]}`;
    });
    
    Promise.all(leaderboard).then(board => {
      const embed = new EmbedBuilder()
      .setColor('DarkButNotBlack')
      .setTitle("🏆 Classement des plus riches")
        .setDescription(board.join("\n") || "Aucun joueur riche trouvé.")
        .setFooter({ text: "Leaderboard mis à jour en temps réel" });

      message.channel.send({ embeds: [embed] });
    });
  },
};