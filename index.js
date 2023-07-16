const { Client, Events, GatewayIntentBits, EmbedBuilder, Partials } = require('discord.js');
const fs = require('fs');
require('dotenv').config();
// token is in .env file

// all intents
const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
],
partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction
]});

// commands is a list from commands.js
const { commands, tagCommands } = require('./commands');
const { profiles, createProfileImage } = require('./profile');

TOKEN = process.env.TOKEN;
prefix = process.env.PREFIX;

client.on(Events.MessageCreate, async (message) => {
    //console.log(message.content);
    
   try {
    /*
    // check if the user has a profile
        const user = message.mentions.users.first() || message.author;
        const userId = user.id;
        
        // if the user doesn't have a profile
        if (!profiles.users[userId]) {
            // create a profile for the user
            profiles.users[userId] = {
                Cookies: 0,
                Credits: 0,
                Level: 0,
                XP: 0,
                nextLevelXP: 100,
                commandsUsed: 0,
            }

            // save the profile
            fs.writeFileSync('./profile.json', JSON.stringify(profiles, null, 4));
        }

        // get the user's profile
        const profile = profiles.users[message.author.id];
        */
     // if message doesn't start with prefix or is from a bot, return
     if (!message.content.startsWith(prefix) || message.author.bot) return;
    
     // get command name and args
     const args = message.content.slice(prefix.length).trim().split(/ +/);
     const commandName = args.shift().toLowerCase();
 
     const curGuildId = message.guild.id;
 
     // get command from commands list or from tagCommands list
 
     const command = commands.find(c => c.name === commandName) || 
         tagCommands.find(c => c.name === commandName);
 
     // if command doesn't exist, return
     if (!command) return;
 
     // try to execute command
     try {
            command.execute(message, args);

            // check if the user has a profile
            const user = message.mentions.users.first() || message.author;
            const userId = user.id;

            // if the user doesn't have a profile
            if (!profiles.users[userId]) {
                // create a profile for the user
                profiles.users[userId] = {
                    Cookies: 0,
                    Credits: 0,
                    Level: 0,
                    XP: 0,
                    nextLevelXP: 100,
                    commandsUsed: 0,
                }

                // save the profile
                fs.writeFileSync('./profile.json', JSON.stringify(profiles, null, 4));
            }

            // get the user's profile
            const profile = profiles.users[message.author.id];

            profile.commandsUsed += 1;
            profile.XP += Math.floor(Math.random() * 10) + 1;
            // give a very small amount of credits
            profile.Credits += Math.floor(Math.random() * 10) + 1;
            if (profile.XP >= profile.nextLevelXP) {
                profile.Level += 1;
                profile.nextLevelXP += Math.floor(Math.random() * 100) + 1;
                message.channel.send(`Congrats ${message.author}! You leveled up to level ${profile.Level}!`);
                profile.XP = 0;
                profile.Credits += 1000;
            }

            // save the profile
            fs.writeFileSync('./profile.json', JSON.stringify(profiles, null, 4));
     }
     catch (error) {
         console.error(error);
         message.reply('there was an error trying to execute that command!');
     }
   } catch (error) {
        console.error(error);
    }
});

// on ready
client.once(Events.ClientReady, c => {
    console.log(`Logged in as ${c.user.tag}!`);
});

// on server join
client.on(Events.GuildCreate, guild => {
    // if server is not in database, add it
});

// on reaction add
/* client.on(Events.MessageReaction, async (reaction, user) => {
    const message = reaction.message;
    const emoji = reaction.emoji;
    console.log(emoji.name);

    // check if the emoji is a checkmark
    if (emoji.name === '✅') {
        // read the embed
        const embed = message.embeds[0];
        const fields = embed.fields;
        const title = embed.title;
        const image = embed.image;

        console.log(embed, fields, title, image)

        // does title include waifu?
        if (title.includes('Waifu')) {
            // how many reactions does the message have?
            const reactions = message.reactions.cache;
            const reactionCount = reactions.get('✅').count;

            // if the reaction count is 6, then add waifu to waifus.json
            if (reactionCount === 2) {
                // add waifu to waifus.json
                const waifus = JSON.parse(fs.readFileSync('./waifus.json'));
                waifus.waifus.push(image.url);
                fs.writeFileSync('./waifus.json', JSON.stringify({ waifus }, null, 4));
            }

            // send a message in the channel saying that the waifu was added
            const embed = new EmbedBuilder()
                .setTitle('Waifu Added')
                .setDescription('The waifu was added to the database!')
                .setColor(0x00FF00)
                .setTimestamp()
                .setImageUrl(image.url);
            message.channel.sendMessage({ embeds: [embed] });
        };
    };
}); */

// login to Discord with your app's token
client.login(TOKEN);