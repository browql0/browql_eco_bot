const { EmbedBuilder } = require('discord.js');
const config = require('../../config.json');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

async function ban(message, user) {
    if (!user) return message.channel.send("Utilisateur introuvable.");
    try {
        await message.guild.members.ban(user.id, { reason: `Banni par ${message.author.tag} pour: Sans raison`, days: 7 });
    } catch (error) {
        console.error(error);
        message.channel.send("Impossible de bannir cet utilisateur.");
    }
}

async function unban(message, user) {
    if (!user) return message.channel.send("Utilisateur introuvable.");
    try {
        await message.guild.members.unban(user.id, { reason: `Débanni par ${message.author.tag}` });
    } catch (error) {
        console.error(error);
        message.channel.send("Impossible de débannir cet utilisateur.");
    }
}

module.exports = {
    name: 'bl',
    description: 'Ajouter ou retirer des utilisateurs de la blacklist du bot',
    category: "owner",
    usage: `**${config.prefix}** bl <add/remove/clear>` ,
    async execute(client, message, args) {
        const check = await db.get(`owner_${client.user.id}_${message.author.id}`);
        if (!config.owner.includes(message.author.id) || !check) return message.channel.send("Tu n'es pas un owner");

        if (args[0] === 'add') {
            let member = message.mentions.users.first() || client.users.cache.get(args[1]);
            if (!member) return message.channel.send(`Aucun membre trouvé pour \`${args[1] || " "}\``);
            
            let isBlacklisted = await db.get(`bl_${client.user.id}_${member.id}`);
            if (isBlacklisted) return message.channel.send(`${member.username} est déjà blacklisted.`);

            await ban(message, member);
            await db.set(`bl_${client.user.id}_${member.id}`, true);
            message.channel.send(`${member.username} est maintenant blacklisted.`);
        }

        if (args[0] === 'remove') {
            let member = message.mentions.users.first() || client.users.cache.get(args[1]);
            if (!member) return message.channel.send(`Aucun membre trouvé pour \`${args[1] || " "}\``);
            
            let isBlacklisted = await db.get(`bl_${client.user.id}_${member.id}`);
            if (!isBlacklisted) return message.channel.send(`${member.username} n'est pas blacklisted.`);
            
            await unban(message, member);
            await db.delete(`bl_${client.user.id}_${member.id}`);
            message.channel.send(`${member.username} n'est plus blacklisted.`);
        }

        if (args[0] === 'clear') {
            let members = await db.all(`bl_${client.user.id}_`) || [];
            let membersWithId = members.filter(m => m.id.startsWith("bl_"));
            let numOwners = membersWithId.length;
            
            message.guild.bans.fetch().then(async bans => {
                if (!bans.size) return message.channel.send("Aucune personne n'est bannie.");
                let count = 0;
                for (let ban of bans.values()) {
                    try {
                        await message.guild.members.unban(ban.user.id, `Unbanall par ${message.author.tag}`);
                        count++;
                    } catch (err) {
                        console.error(`Erreur lors du déban: ${err}`);
                    }
                }
                message.channel.send(`${count} personne(s) débannie(s).`);
            });

            for (let member of membersWithId) {
                await db.delete(member.id);
            }
            message.channel.send(`${numOwners} personne(s) supprimée(s) de la blacklist.`);
        }

        if (!args[0]) {
            let members = await db.all(`bl_${client.user.id}_`) || [];
            let membersWithId = members.filter(m => m.id.startsWith("bl_"))
                .map((m, index) => `<@${m.id.split("_")[2]}> (${m.id.split("_")[2]})`);

            let embed = new EmbedBuilder()
                .setTitle("Liste des membres blacklisted")
                .setDescription(membersWithId.length ? membersWithId.join("\n") : "La liste est vide")
                .setColor('Blue');

            message.channel.send({ embeds: [embed] });
        }
    }
};