const Discord = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const config = require('../../config.json');

module.exports = {
  name: 'derank',
  category: "owner",
  description: "Permet d'enlever tous les rôles d'un membre",
  usage: `**${config.prefix}**derank <mention | ID>`,
  
  async execute(client, message, args) {
    if (!config.owner.includes(message.author.id) && !(await db.get(`ownermd_${client.user.id}_${message.author.id}`))) {
      return message.channel.send("❌ Vous n'avez pas la permission d'utiliser cette commande.");
    }

    if (!message.member.permissions.has('MANAGE_ROLES')) {
        return message.reply('Tu n\'as pas la permission de gérer les rôles.');
      }
  
      // Vérifier que l'argument (l'utilisateur) est bien fourni
      const member = message.mentions.members.first();
      if (!member) {
        return message.reply('Merci de mentionner un utilisateur.');
      }
  
      // Vérifier si l'utilisateur cible est modérateur ou administrateur
      if (member.roles.highest.position >= message.member.roles.highest.position) {
        return message.reply('Tu ne peux pas supprimer les rôles d\'un utilisateur ayant un rôle égal ou supérieur au tien.');
      }
  
      // Supprimer tous les rôles de l'utilisateur mentionné, sauf @everyone
      try {
        await member.roles.set([]);
        const embed = new Discord.EmbedBuilder()
          .setColor("DarkButNotBlack")
          .setDescription(`Tous les rôles de ${member.user.tag} ont été supprimés.`);
        message.channel.send({ embeds: [embed] });
      } catch (error) {
        console.error(error);
        message.reply('Une erreur est survenue en essayant de supprimer les rôles.');
      }
    }
  }

