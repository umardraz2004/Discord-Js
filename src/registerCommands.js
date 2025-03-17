require('dotenv').config();
const {REST, Routes, DefaultWebSocketManagerOptions} = require('discord.js');

const commands = [
    {
        name: 'intro',
        description: 'Bot tell about itself'
    },
    {
        name: 'ping',
        description: 'it will ping you'
    },
    {
        name: 'Quote',
        description: 'It will provide you motivational quote'
    }
];

const rest = new REST( { version: '10' } ).setToken(process.env.TOKEN);

(async () => {
    try {
      console.log('Registering slash commands...');
  
      await rest.put(
        Routes.applicationGuildCommands(
          process.env.CLIENT_ID,
          process.env.GUILD_ID
        ),
        { body: commands }
      );
  
      console.log('Slash commands were registered successfully!');
    } catch (error) {
      console.log(`There was an error: ${error}`);
    }
  })();