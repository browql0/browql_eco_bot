const { MessageEmbed } = require('discord.js');
const config = require('../../config.json');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  name: 'massrole',
  category: "owner",
  description: "Ajoute ou enlève un rôle à tous les membres du serveur.",
  usage: `**${config.prefix}massrole** <add/remove> <nom du rôle>`,
  async execute(client, message, args) {
    // Vérifier si l'utilisateur a la permission d'exécuter cette commande
    const check = await db.get(`ownermd_${client.user.id}_${message.author.id}`);
    if (!config.owner.includes(message.author.id) && !check) {
      return message.reply("Tu n'as pas la permission d'utiliser cette commande.");
    }

    // Vérifier l'argument add/remove
    if (!args[0] || !["add", "remove"].includes(args[0].toLowerCase())) {
      return message.reply("Utilisation incorrecte ! Exemple : `massrole add NomDuRôle`");
    }

    // Récupérer le nom du rôle (support multi-mots)
    const roleName = args.slice(1).join(" ");
    if (!roleName) return message.reply("Merci de spécifier un rôle.");

    // Récupérer le rôle
    const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
    if (!role) return message.reply(`Le rôle "${roleName}" n'existe pas.`);

    // Vérifier que le bot a la permission de gérer les rôles
    if (!message.guild.members.me.permissions.has("MANAGE_ROLES")) {
      return message.reply("Je n'ai pas la permission de gérer les rôles.");
    }

    // Vérifier que le rôle n'est pas supérieur au rôle du bot
    if (role.position >= message.guild.members.me.roles.highest.position) {
      return message.reply("Je ne peux pas modifier ce rôle car il est supérieur à mon rôle.");
    }

    // Récupérer tous les membres (exclure les bots si nécessaire)
    const members = message.guild.members.cache.filter(member => !member.user.bot);

    if (args[0].toLowerCase() === "add") {
      let count = 0;
      members.forEach(member => {
        if (!member.roles.cache.has(role.id)) {
          member.roles.add(role).catch(() => {});
          count++;
        }
      });
      return message.channel.send(`✅ Rôle **"${role.name}"** ajouté à **${count}** membres.`);
    }

    if (args[0].toLowerCase() === "remove") {
      let count = 0;
      members.forEach(member => {
        if (member.roles.cache.has(role.id)) {
          member.roles.remove(role).catch(() => {});
          count++;
        }
      });
      return message.channel.send(`✅ Rôle **"${role.name}"** retiré de **${count}** membres.`);
    }
  }
};
