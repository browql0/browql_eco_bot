const Discord = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const config = require('../../config.json');

module.exports = {
  name: 'delete',
  category: "owner",
  description: "Permet de supprimer les économies d'un membre",
  usage: `**${config.prefix}**delete <@mention | ID | Nom>`,
  async execute(client, message, args) {
    const check = await db.get(`ownermd_${client.user.id}_${message.author.id}`);

    if (config.owner.includes(message.author.id) || check) {
      // Vérifier si un argument a été donné
      if (!args[0]) return message.channel.send("Veuillez spécifier un utilisateur (mention, ID ou nom).");

      let userArg = args[0];
      let user;

      // Vérifier si une mention a été fournie
      if (message.mentions.users.size > 0) {
        user = message.mentions.users.first();
      }
      // Vérifier si c'est un ID valide
      else if (userArg.match(/^\d+$/)) {
        user = await client.users.fetch(userArg).catch(() => null);
      }
      // Vérifier si c'est un nom d'utilisateur
      else {
        user = client.users.cache.find(u => u.username.toLowerCase() === userArg.toLowerCase());
      }

      // Vérifier si l'utilisateur existe bien
      if (!user) {
        return message.channel.send("Utilisateur introuvable. Vérifiez l'ID, la mention ou le nom et réessayez.");
      }

      // Vérifier si l'utilisateur a un compte enregistré
      const check = await db.get(`check_${user.id}`);
      if (!check) return message.channel.send(`${user.username} n'est pas inscrit.`);

      // Suppression des économies
      await db.delete(`cash_${user.id}`);
      await db.delete(`bank_${user.id}`);

      message.channel.send(`Toutes les économies de ${user.username} ont été supprimées.`);
    } else {
      message.channel.send("Tu n'as pas la permission d'utiliser cette commande.");
    }
  }
};
