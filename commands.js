const commands = [];
const tagCommands = [];

const { EmbedBuilder, MessageActivityType } = require('discord.js');
const urban = require('urban');

const https = require('https');

const Tenor = require('tenorjs').client({
    "Key": process.env.TENORKEY,
    "Filter": "off",
    "Locale": "en_US",
    "MediaFilter": "minimal",
    "DateFormat": "D/MM/YYYY - H:mm:ss A"
});

// load profile and createProfileImage from profile.js
const { profiles, createProfileImage } = require('./profile');
/*
Layout for profile.json:

{
    "users": {
        "userId": {
            "Cookies": 0,
            "Credits": 0,
            "Level": 0,
            "XP": 0,
            "nextLevelXP": 100,
            "commandsUsed": 0,
        }
    }
}
*/

// if tags.json doesn't exist, create it
const fs = require('fs');
if (!fs.existsSync('./tags.json')) {
    fs.writeFileSync('./tags.json', '{}');
}

tags = require('./tags.json');



function refreshTags() {
    // create a tagCommand for each tag
    for (const guildId in tags.guilds) {
        for (const userId in tags.guilds[guildId].users) {
            for (const tagName in tags.guilds[guildId].users[userId].tags) {
                tagCommands.push({
                    name: tagName,
                    description: `Get the tag ${tagName}.`,
                    execute(message, args) {
                        message.channel.send(tags.guilds[guildId].users[userId].tags[tagName]);
                    }
                });
            }
        }
    }
}

refreshTags();
    

commands.push({
    name: 'ping',
    description: 'Get the bot\'s ping.',
    execute(message, args) {
        message.channel.send(`Pong! ${message.client.ws.ping}ms`);
    }
});

commands.push({
    name: 'test',
    description: 'Am I working?',
    execute(message, args) {
        // get user pfp
        const user = message.mentions.users.first() || message.author;
        const avatar = user.displayAvatarURL({ format: 'png', dynamic: true });
        // embed avatar with text "I'm running!"
        message.channel.send({ files: [avatar], content: 'I\'m running!' });
    }
});

commands.push({
    name: 'random',
    description: "Get a random user's pfp.",
    execute(message, args) {
        // chose a random guild
        const guild = message.client.guilds.cache.random();
        // print all members
        //console.log(guild.members.cache.map(member => member.user.tag));
        // chose a random member from the guild
        const member = guild.members.cache.random();
        // log all members
        //console.log(guild.members.cache.map(member => member.user.tag));
        // get the member's pfp
        const avatar = member.user.displayAvatarURL({ format: 'png', dynamic: true });

        // create an embed
        const embed = new EmbedBuilder()
            .setTitle(`Random avatar from ${member.user.tag}`)
            .setImage(avatar)

        // send the embed
        message.channel.send({ embeds: [embed] });
    }
});

commands.push({
    name: 'define',
    description: 'Get an urban dictionary definition.',
    async execute(message, args) {
        // if the query is nothing, do urban.random()
        const query = urban(args.join(' '));

        // first result
        const result = await query.first();

        // create an embed
        const embed = new EmbedBuilder()
            .setTitle(result.words)
            .setDescription("TODO: Figure out urban dictionary's API (Sorry!)")

        // send the embed
        message.channel.send({ embeds: [embed] });
    }
})

commands.push({
    name: 'profile',
    description: 'Get your profile.',
    execute(message, args) {
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

        // create the profile image, createProfileImage is a async function so we need to use .then()
        createProfileImage(message, args)
    }
})

commands.push({
    name: 'cookie',
    description: 'Give a cookie to someone.',
    execute(message, args) {
        // check if cookieTime and now is a 1 hour difference
        // cookieTime can be null!
        const cookieTime = profiles.users[message.author.id].cookieTime;
        const now = Date.now();
        //console.log(cookieTime, now, now - cookieTime);
        // Needs to wait 1 hour before giving another cookie!!!!!
        if (cookieTime && now - cookieTime < 3600000) {
            // get the time left
            const timeLeft = 3600000 - (now - cookieTime);
            // convert timeLeft to hours and minutes
            const hours = Math.floor(timeLeft / 3600000);
            const minutes = Math.floor((timeLeft - (hours * 3600000)) / 60000);
            const seconds = Math.floor((timeLeft - (hours * 3600000) - (minutes * 60000)) / 1000);
            // send a message
            return message.channel.send(`You need to wait ${minutes} minutes and ${seconds} seconds before giving another cookie!`);
        }
        // get the first mentioned user
        const user = message.mentions.users.first();
        // if there is no user, return
        if (!user) return message.channel.send('You need to mention someone to give them a cookie!');

        // if the user is the bot, return
        if (user.id === message.client.user.id) return message.channel.send('I don\'t want your cookie!');

        // if the user is a bot, return
        if (user.bot) return message.channel.send('Bots don\'t eat cookies!');

        // if the user is the author, return
        if (user.id === message.author.id) return message.channel.send('You can\'t give yourself a cookie!');
    
        // get the user's profile
        const profile = profiles.users[user.id];

        // if the user doesn't have a profile
        if (!profile) {
            // create a profile for the user
            profiles.users[user.id] = {
                Cookies: 0,
                Credits: 0,
                Level: 0,
                XP: 0,
                nextLevelXP: 100,
                commandsUsed: 0,
                cookieTime: 0,
            }

            // save the profile
            fs.writeFileSync('./profile.json', JSON.stringify(profiles, null, 4));
        }

        // add 1 cookie to the user's profile
        profiles.users[user.id].Cookies += 1;

        // save the profile
        fs.writeFileSync('./profile.json', JSON.stringify(profiles, null, 4));

        Tenor.Search.Query("anime cookie", "25").then(Results => {
            // choose a random gif from the results
            const gif = Results[Math.floor(Math.random() * Results.length)];
            // get the gif's url
            const gifUrl = gif.media_formats.gif.url;

            // download the gif (setname to after last /)
            const gifName = gifUrl.substring(gifUrl.lastIndexOf('/') + 1);

            // download the gif
            https.get(gifUrl, (res) => {
                const fileStream = fs.createWriteStream(gifName);
                res.pipe(fileStream);
                fileStream.on('finish', () => {
                    // create an embed
                    // send the embed
                    const authorNickname = message.guild.members.cache.get(message.author.id).nickname || message.guild.members.cache.get(message.author.id).displayName || message.author.username;
                    const nickname = message.guild.members.cache.get(user.id).nickname || message.guild.members.cache.get(user.id).displayName || user.username;
                    message.channel.send({ files: [gifName], content: `${authorNickname} just gave ${nickname} a cookie!` });
                })
            });
        });

        // set cookieTimer to current time
        profiles.users[message.author.id].cookieTime = Date.now();

    }
})

commands.push({
    name: 'complaint',
    description: 'Send a complaint to the bot owner.',
    execute(message, args) {
        // send a message in the server 933976593137803276 in the channel 1129931915974160444

        // get the complaint
        const complaint = args.join(' ');

        const embed = new EmbedBuilder()
            .setTitle('Complaint')
            .setDescription(
                "**From " + message.author.username + "**\n" +
                "Channel name: " + message.channel.name + "\n" +
                "Channel ID: " + message.channel.id + "\n" +
                "Author ID: " + message.author.id + "\n\n" +

                "**Complaint:**" + "\n" +
                complaint
            )
            // user avatar
            .setThumbnail(message.author.avatarURL())
            // timestamp
            .setTimestamp()
            // random color
            .setColor(Math.floor(Math.random() * 16777215));

        // send the embed
        message.client.guilds.cache.get('933976593137803276').channels.cache.get('1129931915974160444').send(
            { embeds: [embed] }
        );
        // send a message to the user
        message.channel.send('Your complaint has been sent to the bot owner!');
    }
});

commands.push({
    name: 'suggest',
    description: 'Send a suggestion to the bot owner.',
    async execute(message, args) {
        // send a message in the server 933976593137803276 in the channel 1129934240134471792

        // get all arguments
        // if the first argument is a waifu, then its a waifu suggestion

        // if theres no arguments
        if (!args[0]) return message.channel.send('You need to specify a suggestion!\nUsage: `suggest <suggestion> <direct image url>`');

        // if the first argument is a waifu
        if (args[0].toLowerCase() === 'waifu') {
            const embed = new EmbedBuilder()
                .setTitle('Waifu Suggestion')
                // set image to the second argument
                .setImage(args[1])
            
            // send the embed
            message.client.guilds.cache.get('933976593137803276').channels.cache.get('1129934240134471792').send(
                { embeds: [embed] }
            ).then(newMessage => {
                // react with the checkmark
                newMessage.react('✅');
                // react with the trashcan
                newMessage.react('🗑️');
            });

            // send a message to the user
            message.channel.send('Your suggestion has been sent to the dev server!');
        } else {
            // send it as a normal suggestion
            const suggestion = args.join(' ');

            const embed = new EmbedBuilder()
                .setTitle('Suggestion')
                .setDescription(
                    "**From " + message.author.username + "**\n" +
                    "Channel name: " + message.channel.name + "\n" +
                    "Channel ID: " + message.channel.id + "\n" +
                    "Author ID: " + message.author.id + "\n\n" +

                    "**Suggestion:**" + "\n" +
                    suggestion
                )
                // user avatar
                .setThumbnail(message.author.avatarURL())

            // send the embed
            message.client.guilds.cache.get('933976593137803276').channels.cache.get('1129934240134471792').send(
                { embeds: [embed] }
            ).then(newMessage => {
                // react to the message sent with a checkmark and a trashcan
                newMessage.react('✅');
                newMessage.react('🗑️');
            });
            // send a message to the user
            message.channel.send('Your suggestion has been sent to the dev server!');
        }
    }
});

commands.push({
    name: 'waifu',
    description: 'Get a random waifu.',
    async execute(message, args) {
        // load waifus.json, regenerate if its already been opened
        waifus = JSON.parse(fs.readFileSync('./waifus.json')).waifus;

        // get a random waifu
        const waifu = waifus[Math.floor(Math.random() * waifus.length)];

        // send the image link
        message.channel.send(waifu);
    }
})

commands.push({
    name: 'tag',
    description: 'Create a tag with a name and content.',
    execute(message, args) {
        // E.g. tag create name content
        const command = args.shift().toLowerCase();
        const name = args.shift().toLowerCase();
        const content = args.join(' ');
        const guildId = message.guild.id;

        // if command is create
        if (command === 'create') {

            // i want it to be layed out like this:
            /*
                {
                    guilds: {
                        users: {
                            tags: {
                                name: content
                            }
                        },
                        allTags: {
                            name: content
                        },
                    }
                }
            */

            // if tags.guilds doesn't exist, create it
            if (!tags.guilds) tags.guilds = {};
            // if tags.guilds[guildId] doesn't exist, create it
            if (!tags.guilds[guildId]) tags.guilds[guildId] = {};
            // if tags.guilds[guildId].users doesn't exist, create it
            if (!tags.guilds[guildId].users) tags.guilds[guildId].users = {};
            // if tags.guilds[guildId].users[userId] doesn't exist, create it
            if (!tags.guilds[guildId].users[message.author.id]) tags.guilds[guildId].users[message.author.id] = {};
            // if tags.guilds[guildId].users[userId].tags doesn't exist, create it
            if (!tags.guilds[guildId].users[message.author.id].tags) tags.guilds[guildId].users[message.author.id].tags = {};
            // add tag to tags
            tags.guilds[guildId].users[message.author.id].tags[name] = content;

            // if tags.guilds[guildId].allTags doesn't exist, create it
            if (!tags.guilds[guildId].allTags) tags.guilds[guildId].allTags = {};
            // add tag to tags
            tags.guilds[guildId].allTags[name] = content;


            // write to tags.json
            fs.writeFileSync('./tags.json', JSON.stringify(tags, null, 4));

            refreshTags()

            // send confirmation message
            message.reply(`tag ${name} created!`);
        }
    }
});

commands.push({
    name: 'tags',
    description: 'List all tags of a specific user or all tags in the server.',
    execute(message) {
        // E.g. tags @user
        const user = message.mentions.users.first();
        const args = message.content.split(' ');

        // check if first argument is a user
        if (user) {
            // if tags.guilds[guildId].users[userId] doesn't exist, create it
            if (!tags.guilds[message.guild.id].users[user.id]) tags.guilds[message.guild.id].users[user.id] = {};
            // if tags.guilds[guildId].users[userId].tags doesn't exist, create it  
            if (!tags.guilds[message.guild.id].users[user.id].tags) tags.guilds[message.guild.id].users[user.id].tags = {};

            // create an embed of all tags in tags.guilds[guildId].users[userId].tags
            const embed = new EmbedBuilder()
                .setTitle(`All Tags for ${user.username}`)
                .setDescription(
                    // goes name: content \n
                    Object.keys(tags.guilds[message.guild.id].users[user.id].tags).map(tag => `${tag}: ${tags.guilds[message.guild.id].users[user.id].tags[tag]}`).join('\n')
                );

            // send the embed
            message.channel.send({ embeds: [embed] });
            return;
        } else {
            // if command is user
            const arg = args[1].toLowerCase();
            if (arg === 'all') {
                // if tags.guilds[guildId].allTags doesn't exist, create it
                if (!tags.guilds[message.guild.id].allTags) tags.guilds[message.guild.id].allTags = {};

                // create an embed of all tags in tags.guilds[guildId].allTags
                const embed = new EmbedBuilder()
                    .setTitle(`All Tags for ${message.guild.name}`)
                    .setDescription(
                        // goes name: content \n
                        Object.keys(tags.guilds[message.guild.id].allTags).map(tag => `${tag}: ${tags.guilds[message.guild.id].allTags[tag]}`).join('\n')
                    );

                // send the embed
                message.channel.send({ embeds: [embed] });
            } else if (arg === 'me') {
                // is the author

                // if tags.guilds[guildId].users[userId] doesn't exist, create it
                if (!tags.guilds[message.guild.id].users[message.author.id]) tags.guilds[message.guild.id].users[message.author.id] = {};
                // if tags.guilds[guildId].users[userId].tags doesn't exist, create it
                if (!tags.guilds[message.guild.id].users[message.author.id].tags) tags.guilds[message.guild.id].users[message.author.id].tags = {};

                // create an embed of all tags in tags.guilds[guildId].users[userId].tags
                const embed = new EmbedBuilder()
                    .setTitle(`All Tags for ${message.author.username}`)
                    .setDescription(
                        // goes name: content \n
                        Object.keys(tags.guilds[message.guild.id].users[message.author.id].tags).map(tag => `${tag}: ${tags.guilds[message.guild.id].users[message.author.id].tags[tag]}`).join('\n')
                    );

                // send the embed
                message.channel.send({ embeds: [embed] });
            } else {
                message.reply('please mention a user or use `all` to list all tags in the server.');
            }
        }
    }
})

commands.push({
    name: "help",
    description: "List all of my commands or info about a specific command.",
    execute(message, args) {
        // create an embed of all commands in the commands array
        const embed = new EmbedBuilder()
            .setTitle('Commands')
            .setDescription(
                // goes command: description \n
                commands.map(command => `${command.name}: ${command.description}`).join('\n')
            );

        // send the embed
        message.channel.send({ embeds: [embed] });
    }
});

module.exports = { commands, tagCommands };