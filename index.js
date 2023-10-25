const { REST, Routes, Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const rest = new REST({ version: '10' }).setToken(process.env['TOKEN']);

const commands = [
    {
      name: 'wombot-about',
      description: 'Ping the wom-bot for some info'
    }
  ];

(async () => {
    try {
      console.log('Started refreshing application (/) commands');
  
      await rest.put(Routes.applicationCommands(process.env['APP_ID']), { body: commands });
  
      console.log('Successfully reloaded application commands');
    } catch (error) {
      console.error(error);
    }
  })();
  
  const client = new Client({ intents: [] });
  
  client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}, ${client.user.id}`);
  });

  client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
  
    if (interaction.commandName === 'wombot-about') {
      await interaction.reply('I am the Wom-bot, version 1.0.0');
    }
  });

  client.login(process.env['TOKEN']);