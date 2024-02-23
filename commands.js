const GET_COMMANDS = (templatesObj) => {
  return [
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
      name: 'build-a-meme',
      description: 'Build your memes directly in the server now',
      options: [
        {
          type: 3,
          name: 'template',
          description: 'Meme template ID',
          required: true,
        },
        {
          type: 3,
          name: 'top_text',
          description: 'Text on the top of the meme. Enter an underscore to leave blank',
          required: true
        },
        {
          type: 3,
          name: 'bottom_text',
          description: 'Text on the bottom of the meme. Enter an underscore to leave blank',
          required: true
        }
      ]
    }
  ];
}

module.exports = {
  GET_COMMANDS
};