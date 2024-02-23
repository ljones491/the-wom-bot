const { REST, Routes, Client, EmbedBuilder, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
var Chance = require('chance');
require('dotenv').config();
const fs = require('fs');
const { GET_COMMANDS } = require('./commands');

const rest = new REST({ version: '10' }).setToken(process.env['TOKEN']);
let TEMPLATES_CONFIG = {};

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
    const templatesJSON = fs.readFileSync('templates.json', { encoding: 'utf8', flag: 'r' });
    TEMPLATES_CONFIG = JSON.parse(templatesJSON);

    const commands = GET_COMMANDS(TEMPLATES_CONFIG);
    await rest.put(Routes.applicationCommands(process.env['APP_ID']), { body: commands });

    console.log(`Successfully reloaded ${commands.length} application commands`);
  } catch (error) {
    console.error(error);
  }
});

function sanitizeMemeText(inputMemeText) {
  let sanitizedMemeText = '';
  for (const inputChar of inputMemeText) {
    switch (inputChar) {
      case ' ':
        sanitizedMemeText += '_';
        break;
      case '?':
        sanitizedMemeText += '~q';
        break;
      case '&':
        sanitizedMemeText += '~a';
        break;
      case '%':
        sanitizedMemeText += '~p';
        break;
      case '#':
        sanitizedMemeText += '~h';
        break;
      // case '/':
      //   sanitizedMemeText += '~s';
      //   break;
      case '\\':
        sanitizedMemeText += '~b';
        break;
      case '<':
        sanitizedMemeText += '~l';
        break;
      case '>':
        sanitizedMemeText += '~g';
        break;
      case `"`:
        sanitizedMemeText += `''`;
        break;
      default:
        sanitizedMemeText += inputChar;
        break;
    }
  }
  
  return sanitizedMemeText;

}

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'wombot-about') {
    await interaction.reply('I am the Wom-bot, version 1.2.3.\nI let you get random insults and create them. The insults have pictures and random colors now.\nbuild-a-meme command being developed.');
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
        interaction.editReply('The http code didnt work today: ' + httpError);
      });
    }
    catch (error) {
      console.log(error);
      interaction.editReply('The code didnt work today: ' + error);
    }
  } else if (interaction.commandName === 'build-a-meme') {
    await interaction.deferReply({ ephemeral: false });
    // MEME-age
    try {
      const memeTemplate = interaction.options.getString('template');
      const templateChoice = TEMPLATES_CONFIG.find(tc => tc.id === memeTemplate);
      if (!templateChoice) {
        interaction.editReply(`${memeTemplate} does not match a template choice, you asshole`);
        return;
      }

      let fileExtension = '.png';
      if (templateChoice.styles.find(st => st === 'animated')) {
        fileExtension = '.gif';
      }

      const topTextArg = interaction.options.getString('top_text');
      const bottomTextArg = interaction.options.getString('bottom_text');
      const topText = topTextArg ? sanitizeMemeText(topTextArg) : '_';
      const bottomText = bottomTextArg ? sanitizeMemeText(bottomTextArg) : '_';
      const requestURL = `https://api.memegen.link/images/${memeTemplate}/${topText}/${bottomText}${fileExtension}`;
      const embed = new EmbedBuilder().setImage(requestURL)
        .setTitle(templateChoice.name).setDescription(templateChoice.id);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      interaction.editReply('The code didnt work today ' + error);
    }
  }
});

client.login(process.env['TOKEN']);