// https://github.com/notunderctrl/discordjs-v14-series
// https://discord.com/oauth2/authorize?client_id=1237093673234202745&permissions=8&scope=bot+applications.commands
import "dotenv/config";
import { Client, IntentsBitField, EmbedBuilder } from "discord.js";
import fs from "fs";
const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

// Welcome new members with a fancy embed (configurable)
if (config.welcomeEnabled) {
  client.on("guildMemberAdd", (member) => {
    const channel = member.guild.systemChannel;
    if (channel) {
      const welcomeEmbed = new EmbedBuilder()
        .setColor(0x1abc9c)
        .setTitle("✨ Welcome to the Family! ✨")
        .setDescription(
          `
          👋 **Hey ${member.user.username}!**
          
          Welcome to **${member.guild.name}**!
          
          We're so glad to have you here. Make sure to check out the rules and introduce yourself!
          
          🎈 **Enjoy your stay and have fun!** 🎈
        `
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          {
            name: "🕒 Joined at",
            value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`,
            inline: true,
          },
          {
            name: "👥 Member Count",
            value: `${member.guild.memberCount}`,
            inline: true,
          },
          {
            name: "⭐ Tip",
            value: "Invite your friends and make new ones here!",
          }
        )
        .setImage(
          "https://cdn.discordapp.com/attachments/110000000000000000/110000000000000000/banner.png"
        )
        .setFooter({
          text: `Welcome ${member.user.tag}! | User ID: ${member.id}`,
        });
      channel.send({
        content: `🎊 **A new member has joined!** 🎊
<@${member.id}>`,
        embeds: [welcomeEmbed],
      });
    }
  });
}

client.on("ready", (c) => {
  console.log(`✅ ${c.user.tag} is online.`);
});

client.on("messageCreate", (msg) => {
  const message = msg.content.toLowerCase();
  if (msg.author.bot) return;

  // Simple chatbot logic
  if (message.includes('hello') || message.includes('hi')) {
    msg.reply('Hey there! 👋 How can I help you today?');
  } else if (message.includes('how are you')) {
    msg.reply("I'm just a bot, but I'm doing great! How about you?");
  } else if (message.includes('who are you')) {
    msg.reply("I'm Botman, your helpful Discord bot!");
  } else if (message.includes('joke')) {
    msg.reply("Why did the computer get cold? Because it left its Windows open! 😄");
  } else if (message.includes('bye')) {
    msg.reply('Goodbye! Have a great day! 👋');
  } else if (message.includes('help')) {
    msg.reply('You can ask me about the server, get a joke, or just chat!');
  } else if (message.includes('ping')) {
    msg.reply('pong');
  } else if (message.includes('thanks') || message.includes('thank you')) {
    msg.reply('You are welcome! 😊');
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === "intro") {
    return interaction.reply(
      `Hello! I'm ${client.user.tag}. I'm still in the developing phase thanks for checking me out.\n\nDevelopment start on : 06/05/2024.\nDeveloped by: Muhammad Umar Draz.`
    );
  }
  if (interaction.commandName === "ping") {
    return interaction.reply(`pong, ${interaction.user}`);
  }
  if (interaction.commandName === "quote") {
    if (!config.quoteEnabled) {
      return await interaction.reply({
        content:
          "🚫 The quote command is currently disabled by the server admin.",
        ephemeral: true,
      });
    }
    return interaction.reply(
      '"Success is not final, failure is not fatal: It is the courage to continue that counts." – Winston Churchill'
    );
  }
  if (interaction.commandName === "warn") {
    if (!config.warnEnabled) {
      return await interaction.reply({
        content:
          "🚫 The warn command is currently disabled by the server admin.",
        ephemeral: true,
      });
    }
    const user = interaction.options.getUser("user");
    const reason =
      interaction.options.getString("reason") || "No reason provided.";
    if (!user) {
      return interaction.reply({
        content: "You must specify a user to warn.",
        ephemeral: true,
      });
    }
    return interaction.reply(`⚠️ ${user} has been warned. Reason: ${reason}`);
  }
  if (interaction.commandName === "config") {
    const feature = interaction.options.getString("feature");
    const enabled = interaction.options.getBoolean("enabled");
    if (!["welcomeEnabled", "warnEnabled", "quoteEnabled"].includes(feature)) {
      return await interaction.reply({
        content: "Invalid feature.",
        ephemeral: true,
      });
    }
    config[feature] = enabled;
    try {
      await fs.promises.writeFile(
        "./config.json",
        JSON.stringify(config, null, 2)
      );
      await interaction.reply({
        content: `Feature \`${feature}\` has been set to \`${enabled}\`.`,
        ephemeral: true,
      });
    } catch (err) {
      await interaction.reply({
        content: "Failed to update config file.",
        ephemeral: true,
      });
    }
  }
});

client.login(process.env.TOKEN);