const Discord = require('discord.js');
const config = require('../../config.json');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  name: 'reset',
  usage: `**${config.prefix}reset**`,
  category: "owner",
  description: "Permet de supprimer tous les salons, catégories et rôles (hors @everyone) d'un serveur.",
  async execute(client, message, args) {
    // Vérifier si l'utilisateur est autorisé à utiliser cette commande
    const check = await db.get(`ownermd_${client.user.id}_${message.author.id}`);
    if (!(config.owner.includes(message.author.id) || check)) {
      return message.reply("Tu n'as pas la permission d'utiliser cette commande.");
    }

    // Envoyer un message d'avertissement avant de commencer
    await message.channel.send("Suppression en cours...").catch(console.error);

    // Suppression des salons (channels)
    for (const channel of message.guild.channels.cache.values()) {
      // Vérifie si le salon peut être supprimé
      if (channel.deletable) {
        await channel.delete().catch(err =>
          console.error(`Erreur lors de la suppression du channel ${channel.id}:`, err)
        );
      } else {
        console.error(`Channel ${channel.id} n'est pas supprimable.`);
      }
    }

    // Modifier le nom du serveur et enlever l'icône (null enlève l'icône)
    await message.guild.setName("test").catch(err =>
      console.error("Erreur lors du changement de nom:", err)
    );
    await message.guild.setIcon(null).catch(err =>
      console.error("Erreur lors du changement d'icône:", err)
    );

    // Suppression des rôles, en excluant le rôle @everyone et les rôles non supprimables
    for (const role of message.guild.roles.cache.values()) {
      if (role.name === '@everyone' || !role.deletable) continue;
      await role.delete().catch(err =>
        console.error(`Erreur lors de la suppression du rôle ${role.id}:`, err)
      );
    }

    // Créer un nouveau salon pour envoyer un message de confirmation, 
    // car le salon d'origine a peut-être été supprimé
    try {
      const newChannel = await message.guild.channels.create({
        name: 'reset-log',
        type: Discord.ChannelType.GuildText,
        reason: 'Création de canal pour logs de réinitialisation'
      });
      await newChannel.send("La réinitialisation du serveur est terminée.");
    } catch (err) {
      console.error("Erreur lors de la création du canal reset-log:", err);
    }
  }
};
