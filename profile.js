// Check if profile.json exists
const fs = require('fs');
const https = require('https');
// image processing
const { createCanvas, loadImage } = require('canvas');
const profiles = {
    users: {}
}
// import image coverter (NOT SHARP)
const sharp = require('sharp');
if (!fs.existsSync('./profile.json')) {
    fs.writeFileSync('./profile.json', `
{
    "users": {}
}
`);
} 

// get profile.json
profile = require('./profile.json');

// add all profile attributes to profiles list
for (const userId in profile.users) {
    profiles.users[userId] = profile.users[userId];
}

// function for creating profile image

// needs to be async because of loadImage!
async function createProfileImage(message) {
    // if files exist, delete them
    if (fs.existsSync(`./convertedPfps/${message.author.id}.png`)) {
        fs.unlinkSync(`./convertedPfps/${message.author.id}.png`, (err) => {
            if (err) {
                console.error(err);
                return;
            }
        });
    }
    if (fs.existsSync(`./profileImages/${message.author.id}.png`)) {
        fs.unlinkSync(`./profileImages/${message.author.id}.png`, (err) => {
            if (err) {
                console.error(err);
                return;
            }
        });
    }
    // get user pfp
    const user = message.mentions.users.first() || message.author;
    const avatar = user.displayAvatarURL({ format: 'png', dynamic: true });
    // download user pfp with https
    
    // if pfp doesn't exist, create it
    if (!fs.existsSync(`./pfps/${user.id}.png`)) {
        const file = fs.createWriteStream(`./pfps/${user.id}.png`);
        const request = https.get(avatar, function(response) {
            response.pipe(file);
        });
    }

    // wait for pfp to download
    setTimeout(() => {
        // convert pfp then close file
        sharp(`./pfps/${user.id}.png`).toFormat("png").toFile(`./convertedPfps/${user.id}.png`);
        setTimeout(() => {
            // create canvas
            const profileCanvas = createCanvas(1920, 1080);
            const ctx = profileCanvas.getContext('2d');

            const randomColours = [
                '#FF0000',
                '#00FF00',
                '#0000FF',
                '#FFFF00',
                '#00FFFF',
                '#FF00FF',
                '#FFFFFF',
            ]

            // draw background
            ctx.fillStyle = randomColours[Math.floor(Math.random() * randomColours.length)];
            ctx.fillRect(0, 0, profileCanvas.width, profileCanvas.height);

            // draw pfp 10 px from top and 10 px from left with a gray border under it (30px wide)
            ctx.fillStyle = '#808080';
            ctx.fillRect(10, 10, 490, 490);
            loadImage(`./convertedPfps/${user.id}.png`).then((image) => {
                ctx.drawImage(image, 30, 30, 450, 450);
            });

            // draw a light gray rectangle under the pfp with a 30px gap from the pfp and bottom
            // 10 px from left and goes for half the width of the canvas
            ctx.fillStyle = '#C0C0C0';
            ctx.fillRect(10, 510, 950, profileCanvas.height - 500);

            // print stats
            // cookies, credits, level, xp / nextLevelXP, commandsUsed
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '75px Arial';
            ctx.fillText(`Cookies: ${profiles.users[user.id].Cookies}`, 30, 600);
            ctx.fillText(`Credits: ${profiles.users[user.id].Credits}`, 30, 700);
            ctx.fillText(`Level: ${profiles.users[user.id].Level}`, 30, 800);
            ctx.fillText(`XP: ${profiles.users[user.id].XP} / ${profiles.users[user.id].nextLevelXP}`, 30, 900);
            ctx.fillText(`Commands Used: ${profiles.users[user.id].commandsUsed}`, 30, 1000);

            // wait for pfp to draw
            setTimeout(() => {
                // save image to file
                const out = fs.createWriteStream(`./profileImages/${user.id}.png`);
                const stream = profileCanvas.createPNGStream();
                // delete converted pfp
                stream.pipe(out);
                out.on('finish', () => {
                    message.channel.send(
                        { 
                            files: [`./profileImages/${user.id}.png`], 
                            content: `${user.username}'s profile` 
                        }
                    );
                });

                // STOP THE FUNCTION FROM RUNNING
                return;
            }, 1000);
        }, 1000);
    }, 1000);
}


module.exports = { profiles, createProfileImage };