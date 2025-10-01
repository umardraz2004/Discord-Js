// index.js
import "dotenv/config";
import { Client, IntentsBitField } from "discord.js";
import fs from "fs";
import fetch from "node-fetch";

// ===== Load Config =====
const CONVO_FILE = "./conversations.json";
const HISTORY_LIMIT = 5;

// ===== Discord Client =====
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

// ===== Memory Handling =====
const conversations = new Map();

// Load memory from file
function loadConversations() {
  if (fs.existsSync(CONVO_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(CONVO_FILE, "utf8"));
      for (const [userId, history] of Object.entries(data)) {
        conversations.set(userId, history);
      }
      console.log("💾 Conversations loaded.");
    } catch (err) {
      console.error("⚠️ Failed to load conversations:", err);
    }
  }
}

// Save memory to file
function saveConversations() {
  const obj = {};
  for (const [userId, history] of conversations.entries()) {
    obj[userId] = history.slice(-HISTORY_LIMIT);
  }
  fs.writeFileSync(CONVO_FILE, JSON.stringify(obj, null, 2));
}

// ===== Ollama Ask Function =====
async function askLlama(userId, prompt) {
  if (!conversations.has(userId)) {
    conversations.set(userId, []);
  }

  const history = conversations.get(userId);

  // Add user message
  history.push({ role: "user", content: prompt });

  // Build context (only last N messages)
  const context = history
    .slice(-HISTORY_LIMIT)
    .map((m) => `${m.role === "user" ? "User" : "Bot"}: ${m.content}`)
    .join("\n");

  const response = await fetch("http://127.0.0.1:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama2", // ⚡ switch to "llama2:7b" for faster but less smart
      prompt: context + `\nBot:`,
    }),
  });

  let fullReply = "";

  // ✅ Proper streaming handling
  for await (const chunk of response.body) {
    const lines = chunk.toString().split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        if (parsed.response) {
          fullReply += parsed.response;
        }
      } catch {
        // ignore partial JSON errors
      }
    }
  }

  // Save bot reply
  history.push({ role: "bot", content: fullReply.trim() });

  // Persist to file
  saveConversations();

  return fullReply.trim();
}

// ===== Discord Events =====
client.on("ready", () => {
  console.log(`✅ ${client.user.tag} is online.`);
  loadConversations();
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const isAskCommand = message.content.startsWith("!ask");
  const isMention = message.mentions.has(client.user);
  const isReplyToBot =
    message.reference &&
    (await message.channel.messages.fetch(message.reference.messageId))?.author
      .id === client.user.id;

  if (isAskCommand || isMention || isReplyToBot) {
    const prompt = isAskCommand
      ? message.content.replace("!ask", "").trim()
      : message.content.replace(`<@${client.user.id}>`, "").trim();

    if (!prompt) return message.reply("❌ Please provide a question.");

    const thinking = await message.reply("🤔 Thinking...");

    try {
      const reply = await askLlama(message.author.id, prompt);
      await thinking.edit(reply || "⚠️ I couldn’t generate a reply.");
    } catch (err) {
      console.error("Error talking to Ollama:", err);
      await thinking.edit("⚠️ Error getting a response from LLaMA.");
    }
  }
});

// ===== Start Bot =====
client
  .login(process.env.TOKEN)
  .then(() => console.log("✅ Bot login successful!"))
  .catch((err) => {
    console.error("❌ Bot login failed:", err);
    process.exit(1);
  });
