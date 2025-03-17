// https://github.com/notunderctrl/discordjs-v14-series
// https://discord.com/oauth2/authorize?client_id=1237093673234202745&permissions=8&scope=bot+applications.commands
require('dotenv').config();
const { Client, IntentsBitField } = require('discord.js');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,   
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ]
});

client.on('ready', (c) => {
  console.log(`✅ ${c.user.tag} is online.`);
});

client.on('messageCreate', msg => {
  const message = msg.content.toLowerCase();
  if (msg.author.bot) {
    return;
  }

  if (message === 'hello') {
    msg.reply('hello');
  }
  if (message === 'ping') {
    msg.reply('pong');
  }
});

client.on('interactionCreate', (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'intro') {
    return interaction.reply(`Hello! I\'m ${client.user.tag}. I\'m still in the developing phase thanks for checking me out.\n\nDevelopment start on : 06/05/2024.\nDeveloped by: Muhammad Umar Draz.`);
  }
  if(interaction.commandName === 'ping') {
    return interaction.reply(`pong, ${interaction.user}`);
  }
});

client.login(process.env.TOKEN);
