# 🤖 browql – Advanced Discord Economy Bot

Created by **browql**  
Discord: `@browql`

<img width="919" height="484" alt="browql bot preview" src="https://github.com/user-attachments/assets/57158a09-a61c-4852-a5af-a0c3b1667834" />

---

**browql** is a powerful and customizable Discord bot built with a full virtual economy system. It features banking, gambling, investments, leaderboards, and owner-only admin tools — all wrapped in a sleek, dark-themed design.

---

## 🛠 Features

- 💰 Full economy system: `work`, `daily`, `bank`, `loan`, `steal`, `invest`, `casino`, and more
- 📊 Leaderboard tracking
- 🛡 Owner commands: `blacklist`, `derank`, `set prefix`, etc.
- 🔧 Modular and easy to configure
- 🌐 Slash-compatible *(optional future upgrade)*
- 💻 Built with Node.js and Discord.js

---

## 🚀 Installation & Setup

Follow these steps to get the bot running on your server:

### 1. Clone the repository

```bash
git clone https://github.com/browql0/browql_eco_bot.git
cd browql_eco_bot
```

### 2. Install dependencies

Make sure you have [Node.js](https://nodejs.org) installed, then run:

```bash
npm install
```

### 3. Configure the bot

Create a file called `config.json` in the root folder, and paste the following:

```json
{
  "TOKEN": "YOUR_TOKEN_HERE",
  "owner": ["YOUR_USER_ID"],
  "CLIEN_ID": "YOUR_CLIENT_ID",
  "prefix": "!",
  "activite": "Managing the economy"
}
```

Replace the placeholders:
- `YOUR_TOKEN_HERE`: your bot token (from the [Discord Developer Portal](https://discord.com/developers/applications))
- `YOUR_USER_ID`: your Discord user ID
- `YOUR_CLIENT_ID`: your bot’s application/client ID
- `!`: your preferred command prefix
- `activite`: status text shown under the bot’s name

### 4. Run the bot

```bash
node index.js
```

Or, alternatively:

```bash
node .
```

---

## 📁 Project Structure

```text
.
├── commands/           # All command files
│   ├── eco/            # Economy-related commands
│   └── owner/          # Owner/admin commands
├── events/             # Event handlers (e.g. ready, message)
├── node_modules/       # Dependencies
├── config.json         # Bot configuration (not committed)
├── index.js            # Main entry point
├── json.sqlite         # SQLite database file
├── package.json        # Project metadata and scripts
└── README.md           # Project documentation
```

---

## 🔒 .gitignore recommendation

```gitignore
node_modules/
config.json
json.sqlite
.env
```

---

## 🪪 License

MIT — free to use, modify, and share.

---
