const Discord = require('discord.js');

// Créer une instance de Client
const config = require('../../config.json')

const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
    name: 'daily',
    category: "eco",
    cooldown: 86400,
    usage: `**${config.prefix}**daily`,
    description: "permet de permet de recuperer une recomponse aleoratoire chaque 24h",
    async execute(client, message, args) {


        const member = message.author;


        const bank = parseInt(await db.get(`bank_${member.id}`) || '0');
        const cash = parseInt(await db.get(`cash_${member.id}`) || '0');
        const total = bank + cash;
        const check = await db.get(`check_${member.id}`)
        const all = ["100", "50", "500", "200", "10"];

        if (!check) return message.channel.send(`${member.username} n'est pas inscrit.`)
        async function addRandomValue() {
            const randomValue = parseInt(all[Math.floor(Math.random() * all.length)])
            
           await  db.add(`cash_${member.id}`,randomValue )
            return randomValue;
        }
        
        async function sendMessageWithRandomValue() {
            const value = await addRandomValue();
            message.channel.send(`tu as recuperer ${value} 🪙`);
        }
        sendMessageWithRandomValue()
        const taxAmount = total * 0.1;
    await db.set(`tax_${member.id}`, taxAmount)







    },
};

