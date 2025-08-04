const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ActivityType, PresenceUpdateStatus } = require('discord.js');
const config = require('../../config.json');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    name: 'set',
    description: 'Permet de personnaliser le bot',
    category: "owner",
    usage: `**${config.prefix}** set`,
    async execute(client, message, args) {
        const check = await db.get(`owner_${client.user.id}_${message.author.id}`);
        if (!config.owner.includes(message.author.id) || !check) return message.channel.send("Tu n'es pas un owner");

        const embed = new EmbedBuilder()
            .setTitle("Paramètres du Bot")
            .setThumbnail(client.user.displayAvatarURL())
            .setDescription(`
                **Nom :** ${client.user.username}
                **Activité :** ${client.presence?.activities[0]?.name || "Aucune"}
                **Type d'Activité :** ${client.presence?.activities[0]?.type || "Aucun"}
                **Statut :** ${client.presence?.status || "Inconnu"}
            `)
            .setColor('Blue');

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('set_name').setLabel('Changer le Nom').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('set_avatar').setLabel('Changer la Photo').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('set_activity').setLabel("Changer l'Activité").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('set_activity_type').setLabel("Changer Type d'Activité").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('set_status').setLabel("Changer Statut").setStyle(ButtonStyle.Secondary)
        );

        const msg = await message.channel.send({ embeds: [embed], components: [buttons] });
        
        const collector = msg.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async interaction => {
            if (interaction.user.id !== message.author.id) return interaction.reply({ content: "Tu ne peux pas utiliser ce bouton.", ephemeral: true });

            if (interaction.customId === 'set_name') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_name')
                    .setTitle('Changer le Nom du Bot')
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('new_name')
                                .setLabel('Nouveau Nom')
                                .setStyle(TextInputStyle.Short)
                        )
                    );
                await interaction.showModal(modal);
            }
            
            else if (interaction.customId === 'set_avatar') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_avatar')
                    .setTitle('Changer la Photo de Profil du Bot')
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('new_avatar')
                                .setLabel('URL de la nouvelle photo')
                                .setStyle(TextInputStyle.Short)
                        )
                    );
                await interaction.showModal(modal);
            }
            
            else if (interaction.customId === 'set_activity') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_activity')
                    .setTitle('Changer l\'Activité du Bot')
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('new_activity')
                                .setLabel('Nouvelle Activité')
                                .setStyle(TextInputStyle.Short)
                        )
                    );
                await interaction.showModal(modal);
            }
            
            else if (interaction.customId === 'set_activity_type') {
                await interaction.deferUpdate();
                const types = ["Playing", "Streaming", "Listening", "Watching", "Competing"];
                const typeDescriptions = {
                    "Playing": "Joue à un jeu.",
                    "Streaming": "Diffuse un live.",
                    "Listening": "Écoute de la musique.",
                    "Watching": "Regarde un contenu.",
                    "Competing": "Participe à une compétition."
                };
                
                const embedType = new EmbedBuilder()
                    .setTitle("Changer le Type d'Activité")
                    .setDescription(Object.entries(typeDescriptions).map(([type, desc]) => `**${type}** - ${desc}`).join("\n"))
                    .setColor("Green");
                
                const row = new ActionRowBuilder().addComponents(
                    types.map(t => new ButtonBuilder().setCustomId(`type_${t}`).setLabel(t).setStyle(ButtonStyle.Secondary))
                );
                
                await interaction.followUp({ embeds: [embedType], components: [row], ephemeral: true });
            }
            
            else if (interaction.customId.startsWith('type_')) {
                await interaction.deferUpdate();
                const newType = interaction.customId.split('_')[1];
                client.user.setPresence({ activities: [{ name: client.presence?.activities[0]?.name || "", type: ActivityType[newType.toUpperCase()] }] });
                await interaction.followUp({ content: `Type d'Activité changé en **${newType}**`, ephemeral: true });
            }

            else if (interaction.customId === 'set_status') {
                await interaction.deferUpdate();
                const statuses = ["online", "idle", "dnd", "invisible"];
                const statusDescriptions = {
                    "online": "En ligne",
                    "idle": "Absent",
                    "dnd": "Ne pas déranger",
                    "invisible": "Hors ligne"
                };
                
                const embedStatus = new EmbedBuilder()
                    .setTitle("Changer le Statut")
                    .setDescription(Object.entries(statusDescriptions).map(([status, desc]) => `**${status}** - ${desc}`).join("\n"))
                    .setColor("Orange");
                
                const row = new ActionRowBuilder().addComponents(
                    statuses.map(s => new ButtonBuilder().setCustomId(`status_${s}`).setLabel(s).setStyle(ButtonStyle.Secondary))
                );
                
                await interaction.followUp({ embeds: [embedStatus], components: [row], ephemeral: true });
            }
            
            else if (interaction.customId.startsWith('status_')) {
                await interaction.deferUpdate();
                const newStatus = interaction.customId.split('_')[1];
                client.user.setPresence({ status: PresenceUpdateStatus[newStatus.toUpperCase()] });
                await interaction.followUp({ content: `Statut changé en **${newStatus}**`, ephemeral: true });
            }
        });
    }
};
