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
  },
  {
    name: 'give-insult',
    description: 'Supply the bot with a new insult. Careful, it could be used against you',
    options: [
      {
        type: 3,
        name: 'new_insult',
        description: 'the new insult',
        required: true
      }
    ]
  }
];

const client = new Client({ intents: [] });

client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}, ${client.user.id}`);

  try {
    console.log('Started refreshing application (/) commands');

    console.log(commands.length);
    await rest.put(Routes.applicationCommands(process.env['APP_ID']), { body: commands });

    console.log('Successfully reloaded application commands');
  } catch (error) {
    console.error(error);
  }
});

// const embed = embedBuilder
//                 .setThumbnail(insultee.user.avatarURL())
//                 .setColor(insultee.displayColor)
//                 .setTitle(insult)
//             interaction.editReply({ embeds: [embed] });

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'wombot-about') {
    await interaction.reply('I am the Wom-bot, version 1.2.2. I let you get random insults and create them. The insults have pictures and user colors now.');
  } else if (interaction.commandName === 'random-insult') {
    try {
      await interaction.deferReply({ ephemeral: false });
      const members = interaction.guild.members.cache.filter(member => !member.user.bot && member.user.id != '1102741835174117406'); // Filter out bots
      const insulteeObj = members.random();      

      const reqUrl = `${process.env['INSULTS_API']}?insultee=${insulteeObj.nickname}`;
      axios.get(reqUrl, {
        headers: {
          'client-id': 'the-wom-bot',
          'client-secret': process.env['INSULTS_API_SECRET']
        }
      }).then(async res => {
        const embed = new EmbedBuilder()
          .setThumbnail(insulteeObj.user.displayAvatarURL())
          .setColor(insulteeObj.displayColor)
          .setTitle(res.data.insultText);
        interaction.editReply({ embeds: [embed] });
      }).catch(httpErr => {
        let message = 'The http code didnt work today';
        if (httpErr.message) {
          message += ': ' + httpErr.message;
        }
        interaction.editReply(message);
      });
    } catch (error) {
      interaction.editReply('The code didnt work today');
    }
  } else if (interaction.commandName === 'give-insult') {
    try {
      await interaction.deferReply({ ephemeral: false });

      
      const newInsultTemplate = interaction.options.getString('new_insult');
      if (!newInsultTemplate.includes('{{i}}') && !newInsultTemplate.includes('{{insultee}}')) {
        interaction.editReply(`insult_template must include an {{insultee}}/{{i}} placeholder!!! That's how this whole things works, idiot!`);
        return;
      }

      const newInsultTemplateValue = newInsultTemplate.replace('{{i}}','{{insultee}}');

      const reqUrl = `${process.env['INSULTS_API']}`;
      const reqBody = {
        insultTemplate: newInsultTemplateValue
      };
      axios.post(reqUrl, reqBody, {
        headers: {
          'client-id': 'the-wom-bot',
          'client-secret': process.env['INSULTS_API_SECRET']
        }
      }).then((httpResponse) => {
        console.log(httpResponse);
        interaction.editReply(`Insult added, may it wreck your enemies one day`);
      }).catch((httpError) => {
        console.log(httpError);
        interaction.editReply('The http code didnt work today');
      });
    }
    catch (error) {
      console.log(error);
      interaction.editReply('The code didnt work today');
    }
  }
});

client.login(process.env['TOKEN']);