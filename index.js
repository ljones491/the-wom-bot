const { REST, Routes, Client, EmbedBuilder } = require('discord.js');
const axios = require('axios');
var Chance = require('chance');
require('dotenv').config();

const rest = new REST({ version: '10' }).setToken(process.env['TOKEN']);

const commands = [
    {
      name: 'wombot-about',
      description: 'Ping the wom-bot for some info'
    },
    {
      name: 'random-insult',
      description: 'Insult: random. Insultee: also random :)'
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
      await interaction.reply('I am the Wom-bot, version 1.1.1');
    } else if (interaction.commandName === 'random-insult') {
      const insultees = ['Wombat','Falcon','Lynx','Clippy'];
      const chanceObj = new Chance();
      const insulteeIdx = chanceObj.integer({min: 0, max: insultees.length-1});
      const insultee = insultees[insulteeIdx];

      const reqUrl = `${process.env['INSULTS_API']}?insultee=${insultee}`;
      axios.get(reqUrl).then(async res => {
        const embed = new EmbedBuilder()
          .setColor('#70f8ba')
          .setTitle(res.data.insultText);
          // .setDescription(res.data.insultText);
          await interaction.reply({ embeds: [embed] });
        // await interaction.reply(res.data.insultText);

      });
      
    }
  });

  client.login(process.env['TOKEN']);