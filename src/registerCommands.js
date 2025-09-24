import 'dotenv/config';
import { REST, Routes, DefaultWebSocketManagerOptions } from 'discord.js';

const commands = [
  {
    name: 'intro',
    description: 'Bot tells about itself'
  },
  {
    name: 'ping',
    description: 'It will ping you'
  },
  {
    name: 'quote',
    description: 'It will provide you a motivational quote'
  }
  ,
  {
    name: 'warn',
    description: 'Warn a user',
    options: [
      {
        name: 'user',
        description: 'User to warn',
        type: 6, // USER type
        required: true
      },
      {
        name: 'reason',
        description: 'Reason for warning',
        type: 3, // STRING type
        required: false
      }
    ]
  }
  ,
  {
    name: 'config',
    description: 'Configure bot features',
    options: [
      {
        name: 'feature',
        description: 'Feature to configure',
        type: 3, // STRING
        required: true,
        choices: [
          { name: 'welcome', value: 'welcomeEnabled' },
          { name: 'warn', value: 'warnEnabled' },
          { name: 'quote', value: 'quoteEnabled' }
        ]
      },
      {
        name: 'enabled',
        description: 'Enable or disable the feature',
        type: 5, // BOOLEAN
        required: true
      }
    ]
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