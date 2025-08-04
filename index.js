const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs = require("fs");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const config = require("./config.json");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
   
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User,
    Partials.GuildMember,
    Partials.Reaction
  ]
});

client.commands = new Collection();
client.snipe = new Collection();
const cooldowns = new Map();

// 🔹 Chargement des commandes
const commandFolders = fs.readdirSync('./commands');
for (const folder of commandFolders) {
  const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(`./commands/${folder}/${file}`);
    client.commands.set(command.name, command);
  }
}

// 🔹 Lors de la connexion du bot
client.on('ready', () => {
  console.log(`Prefix : ${config.prefix}`);
  console.log(`✅ Bot opérationnel`);
});
client.musicQueue = new Map(); // Stocke les files d’attente des serveurs

// 📩 Gestion des messages envoyés
client.on('messageCreate', async message => {
  if (!message.guild || message.author.bot) return; // Ignorer les messages privés et bots

  const user = message.mentions.users.first() || message.author;
  const guildId = message.guild.id;
  const userId = user.id;
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

  let totalMessages24h = 0;
  let totalMessagesWeek = 0;

  // 🔹 Comptage des messages par salon
  for (const channel of message.guild.channels.cache.values()) {
    if (channel.type === 0) { // 0 = GUILD_TEXT
      try {
        const fetchedMessages = await channel.messages.fetch({ limit: 100 });
        const userMessages = fetchedMessages.filter(msg => msg.author.id === userId);

        const channelMessages = (await db.get(`channelMessages_${channel.id}_${userId}`)) || 0;
        await db.set(`channelMessages_${channel.id}_${userId}`, channelMessages + userMessages.size);

        const messages24h = userMessages.filter(msg => msg.createdTimestamp >= oneDayAgo).size;
        const messagesWeek = userMessages.filter(msg => msg.createdTimestamp >= oneWeekAgo).size;

        totalMessages24h += messages24h;
        totalMessagesWeek += messagesWeek;
      } catch (error) {
        console.error(`Erreur lors de la récupération des messages dans ${channel.name} :`, error);
      }
    }
  }

  await db.set(`messages24h_${userId}`, totalMessages24h);
  await db.set(`messagesWeek_${userId}`, totalMessagesWeek);
  await db.add(`messages_${guildId}_${userId}`, 1);

  if (message.channel.type === 'dm' && !config.owner.includes(message.author.id)) {
    return message.channel.send('nonono habibi');
  }

  if (!message.content.startsWith(config.prefix)) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

  if (!command) return;
  if (command.guildOnly && message.channel.type !== 'text') {
    return message.reply('Je ne peux pas exécuter cette commande en message privé.');
  }

  if (command.cooldown) {
    if (!cooldowns.has(command.name)) cooldowns.set(command.name, new Map());

    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;

    if (timestamps.has(message.author.id)) {
      const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return message.reply(`⏳ Veuillez patienter ${Math.floor(timeLeft)} secondes avant d'utiliser \`${command.name}\` à nouveau.`);
      }
    }

    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
  }

  try {
    command.execute(client, message, args);
  } catch (error) {
    console.error(error);
    message.reply("❌ Une erreur s'est produite lors de l'exécution de cette commande.");
  }
});

// 🎙️ Suivi du temps en vocal
client.on('voiceStateUpdate', async (oldState, newState) => {
  const guildId = newState.guild?.id || oldState.guild?.id;
  const userId = newState.id || oldState.id;

  if (!guildId) return;

  if (!oldState.channel && newState.channel) {
    await db.set(`vocal_start_${guildId}_${userId}`, Date.now());
  }

  if (oldState.channel && !newState.channel) {
    const startTime = await db.get(`vocal_start_${guildId}_${userId}`);
    if (!startTime) return;

    const timeSpent = Date.now() - startTime;
    const oldTotal = (await db.get(`vocal_total_${guildId}_${userId}`)) || 0;
    const newTotal = oldTotal + timeSpent;

    await db.set(`vocal_total_${guildId}_${userId}`, newTotal);
    await db.delete(`vocal_start_${guildId}_${userId}`);
  }
});

// 🔍 Commande pour voir le temps vocal
client.on('messageCreate', async message => {
  if (message.content === '!vocal') {
    const guildId = message.guild.id;
    const userId = message.author.id;
    const totalTime = (await db.get(`vocal_total_${guildId}_${userId}`)) || 0;

    const hours = Math.floor(totalTime / 3600000);
    const minutes = Math.floor((totalTime % 3600000) / 60000);
    const seconds = Math.floor((totalTime % 60000) / 1000);

    message.channel.send(`🎙 **${message.author.username}**, vous avez passé **${hours}h ${minutes}m ${seconds}s** en vocal sur **${message.guild.name}**.`);
  }
});

// 📩 Commande pour voir le nombre de messages
client.on('messageCreate', async message => {
  if (message.content === '!messages') {
    const guildId = message.guild.id;
    const userId = message.author.id;
    const messageCount = (await db.get(`messages_${guildId}_${userId}`)) || 0;

    message.channel.send(`📨 **${message.author.username}**, vous avez envoyé **${messageCount}** messages sur **${message.guild.name}**.`);
  }
});

// 📌 Sauvegarde des anciens pseudos
client.on('userUpdate', async (oldUser, newUser) => {
  if (oldUser.username !== newUser.username) {
    await db.set(`oldUsername_${newUser.id}`, oldUser.username);
  }
});

client.login(config.TOKEN);
