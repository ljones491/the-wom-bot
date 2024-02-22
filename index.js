const { REST, Routes, Client, EmbedBuilder, GatewayIntentBits } = require('discord.js');
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
  },
  {
    name: 'mystery-command',
    description: 'what will this be hmmm?',
    options: [
      {
        type: 3,
        name: 'arg_1',
        description: 'mystery arg 1',
        required: true
      },
      {
        type: 3,
        name: 'arg_2',
        description: 'mystery arg 3',
        required: false
      },
      {
        type: 3,
        name: 'arg_3',
        description: 'mystery arg 3',
        required: false
      },
    ]
  }
];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}, ${client.user.id}`);

  try {
    console.log('Started refreshing application (/) commands');

    await rest.put(Routes.applicationCommands(process.env['APP_ID']), { body: commands });

    console.log(`Successfully reloaded ${commands.length} application commands`);
  } catch (error) {
    console.error(error);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'wombot-about') {
    await interaction.reply('I am the Wom-bot, version 1.2.3.\nI let you get random insults and create them. The insults have pictures and random colors now.\nFixing member list.');
  } else if (interaction.commandName === 'random-insult') {
    try {
      await interaction.deferReply({ ephemeral: false });
      const fetchResult = await interaction.guild.members.fetch();

      const userInfo = fetchResult.filter(x => !x.user.bot && x.user.id != '1102741835174117406').mapValues(x => {
        return {
          displayName: x.displayName,
          color: x.displayHexColor,
          imageUrl: x.user.displayAvatarURL()
        }
      });

      var chance = new Chance();
      const rndIdx = chance.integer({ min: 0, max: userInfo.size - 1 });
      const randomMember = userInfo.at(rndIdx);

      const reqUrl = `${process.env['INSULTS_API']}?insultee=${randomMember.displayName}`;
      axios.get(reqUrl, {
        headers: {
          'client-id': 'the-wom-bot',
          'client-secret': process.env['INSULTS_API_SECRET']
        }
      }).then(async res => {
        const embed = new EmbedBuilder()
          .setThumbnail(randomMember.imageUrl)
          .setColor(randomMember.color)
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
      interaction.editReply('The code didnt work today ' + error);
    }
  } else if (interaction.commandName === 'give-insult') {
    try {
      await interaction.deferReply({ ephemeral: false });

      const newInsultTemplate = interaction.options.getString('new_insult');
      if (!newInsultTemplate.includes('{{i}}') && !newInsultTemplate.includes('{{insultee}}')) {
        interaction.editReply(`insult_template must include an {{insultee}}/{{i}} placeholder!!! That's how this whole things works, idiot!`);
        return;
      }

      const newInsultTemplateValue = newInsultTemplate.replace('{{i}}', '{{insultee}}');

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
  } else if (interaction.commandName === 'mystery-command') {
    // MEME-age
    interaction.reply('ooh what could this be?');
  }
});

client.login(process.env['TOKEN']);