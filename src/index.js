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
// Welcome new members with a beautiful embed
// Log when the bot is online
client.on('ready', () => {
  console.log(`✅ ${client.user.tag} is online.`);
});
client.on("guildMemberAdd", (member) => {
  if (!config.welcomeEnabled) return;
  const channel = member.guild.systemChannel;
  if (channel) {
    const welcomeEmbed = new EmbedBuilder()
      .setColor(0x1abc9c)
      .setTitle("✨ Welcome to the Family! ✨")
      .setDescription(
        `👋 **Hey ${member.user.username}!**\n\n` +
        `Welcome to **${member.guild.name}**!\n\n` +
        `We're so glad to have you here. Make sure to check out the rules and introduce yourself!\n\n` +
        `🎈 **Enjoy your stay and have fun!** 🎈`
      )
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
        { name: "⭐ Tip", value: "Invite your friends and make new ones here!" }
      )
      .setImage(
        "https://cdn.discordapp.com/attachments/110000000000000000/110000000000000000/banner.png"
      )
      .setFooter({
        text: `Welcome ${member.user.tag}! | User ID: ${member.id}`,
      });
    channel.send({
      content: `🎊 **A new member has joined!** 🎊\n<@${member.id}>`,
      embeds: [welcomeEmbed],
    });
  }
});
// Message handler for OpenAI replies
client.on("messageCreate", async (msg) => {
  const message = msg.content.toLowerCase();
  if (msg.author.bot) return;

  // Store normal chat messages in chat_log.json as objects
  import("fs").then((fs) => {
    fs.readFile("chat_log.json", "utf8", (err, data) => {
      let logs = [];
      if (!err && data) {
        try { logs = JSON.parse(data); } catch {}
      }
      logs.push({ username: msg.author.username, message: msg.content });
      fs.writeFile("chat_log.json", JSON.stringify(logs, null, 2), () => {});
    });
  });

  // Teach the bot: "teach: question | answer"
  if (message.startsWith("teach:")) {
    const parts = msg.content.slice(6).split("|");
    if (parts.length === 2) {
      const question = parts[0].trim().toLowerCase();
      const answer = parts[1].trim();
      import("fs").then((fs) => {
        fs.readFile("qa_pairs.json", "utf8", (err, data) => {
          let pairs = [];
          if (!err && data) {
            try { pairs = JSON.parse(data); } catch {}
          }
          pairs.push({ question, answer });
          fs.writeFile("qa_pairs.json", JSON.stringify(pairs, null, 2), () => {});
        });
      });
      msg.reply("Learned new Q&A pair!");
    } else {
      msg.reply("Format: teach: question | answer");
    }
    return;
  }

  // Only reply if bot is mentioned/tagged
  if (msg.mentions.has(client.user)) {
    let cleanMsg = msg.content.replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '').trim();
    import("fs").then((fs) => {
      fs.readFile("qa_pairs.json", "utf8", (err, data) => {
        let pairs = [];
        if (!err && data) {
          try { pairs = JSON.parse(data); } catch {}
        }
        // Find all answers for matching questions
        let matchedAnswers = [];
        for (const pair of pairs) {
          if (cleanMsg.includes(pair.question)) {
            if (Array.isArray(pair.answer)) {
              matchedAnswers.push(...pair.answer);
            } else {
              matchedAnswers.push(pair.answer);
            }
          }
        }
        // If multiple answers, analyze user's previous messages for context
        if (matchedAnswers.length > 1) {
          fs.readFile("chat_log.json", "utf8", (err2, chatData) => {
            let logs = [];
            if (!err2 && chatData) {
              try { logs = JSON.parse(chatData); } catch {}
            }
            // Get last 5 messages from this user
            const userMessages = logs.filter(l => l.username === msg.author.username).slice(-5).map(l => l.message).join(' ').toLowerCase();
            // Score each answer by keyword overlap
            let bestAnswer = matchedAnswers[0];
            let bestScore = 0;
            for (const ans of matchedAnswers) {
              let score = 0;
              const ansWords = ans.toLowerCase().split(/\s+/);
              for (const word of ansWords) {
                if (userMessages.includes(word)) score++;
              }
              if (score > bestScore) {
                bestScore = score;
                bestAnswer = ans;
              }
            }
            msg.reply(bestAnswer);
          });
        } else if (matchedAnswers.length === 1) {
          msg.reply(matchedAnswers[0]);
        } else {
          // If no Q&A match, search chat_log.json for a relevant reply
          fs.readFile("chat_log.json", "utf8", (err2, chatData) => {
            let logs = [];
            if (!err2 && chatData) {
              try { logs = JSON.parse(chatData); } catch {}
            }
            // Find a message from another user that matches the question
            let bestReply = null;
            for (const log of logs.reverse()) {
              if (log.username !== msg.author.username && log.message.toLowerCase().includes(cleanMsg)) {
                bestReply = log.message;
                break;
              }
            }
            if (bestReply) {
              msg.reply(bestReply);
            } else {
              msg.reply("I don't know about that. Teach me with: teach: question | answer");
            }
          });
        }
      });
    });
  }
});
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "intro") {
    return interaction.reply("Hello! I'm your bot. Ask me anything or use /config to change features.");
  }

  if (interaction.commandName === "ping") {
    return interaction.reply("pong!");
  }

  if (interaction.commandName === "quote") {
    return interaction.reply('"Success is not final, failure is not fatal: It is the courage to continue that counts." – Winston Churchill');
  }

  if (interaction.commandName === "warn") {
    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason") || "No reason provided.";
    if (!user) {
      return interaction.reply({ content: "You must specify a user to warn.", ephemeral: true });
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

// Login at the top level, not inside any event handler
client.login(process.env.TOKEN)
  .then(() => console.log('Bot login successful!'))
  .catch(err => {
    console.error('Bot login failed:', err);
    process.exit(1);
  });
