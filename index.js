const motdArray = [
    "Terraria: Dig Peon, Dig!",
    "Terraria: Epic Dirt",
    "Terraria: Adaman-TIGHT!",
    "Terraria: Sand is Overpowered",
    "Terraria Part 3: The Return of the Guide",
    "Terraria: A Bunnies Tale",
    "Terraria: Dr. Bones and The Temple of Blood Moon",
    "Terraria: Slimeassic Park",
    "Terraria: The Grass is Greener on This Side",
    "Terraria: Small Blocks, Not for Children Under the Age of 5",
    "Terraria: Digger T' Blocks",
    "Terraria: There is No Cow Layer",
    "Terraria: Suspicous Looking Eyeballs",
    "Terraria: Purple Grass!",
    "Terraria: No one Dug Behind!",
    "Terraria: The Water Fall Of Content!",
    "Terraria: Earthbound",
    "Terraria: DigDugAin't Got Nuthin on Me",
    "Terraria: Ore's Well That Ends Well",
    "Terraria: Judgement Clay",
    "Terraria: Terrestrial Trouble",
    "Terraria: Obsessive-Compulsive Discovery Simulator",
    "Terraria: Red Dev Redemption",
    "Terraria: Rise of the Slimes",
    "Terraria: Now with more things to kill you!",
    "Terraria: Rumorsof the Guides' death were greatly exaggerated",
    "Terraria: I Pity the Tools...",
    "Terraria: A spelunker says 'What'?",
    "Terraria: So then I said 'Something about a PC update....'",
    "Terraria: May the blocks be with you",
    "Terraria: Better than life",
    "Terraria: Terraria: Terraria:",
    "Terraria: Now in 1D",
    "Terraria:Coming soon to a computer near you",
    "Terraria: Dividing by zero",
    "Terraria: Now with SOUND",
    "Terraria: Press alt-f4",
    "Terraria: I Pity the Tools",
    "Terraria: You sand bro?",
    "Terraria: A good day to dig hard",
    "Terraria: Can You Re-Dig-It?",
    "Terraria: I don't know that-- aaaaa!",
    "Terraria: What'sthat purple spiked thing?",
    "Terraria: I wanna be the guide",
    "Terraria: Cthulhu is mad... and is missing an eye!",
    "Terraria: NOT THE BEES!!!",
    "Terraria: Legend of Maxx",
    "Terraria: Cult of Cenx",
    "Terraria 2: Electric Boogaloo",
    "Terraria: Also try Minecraft!",
    "Terraria: Also try Breath of the Wild!",
    "Terraria: I just wanna know where the gold at?",
    "Terraria: Now with more ducks!",
    "Terraria: 1 + 1 = 10",
    "Terraria: Infinite Plantera",
    "Terraria: Also try Stardew Valley!",
    "Terraria: Also try Core Keeper!",
    "Terraria: Also try Project Zomboid!",
    "Terraria: Now with microtransactions!",
    "Terraria: BuiltonBlockchain Technology",
    "Terraria: Now with even less Ocram!",
    "Terraria: Otherworld",
    "Terraria: Touch Grass Simulator",
    "Terraria: Don't dig up!",
    "Terraria: For the worthy!",
    "Terraria: Now with even more Ocram!",
    "Terraria: Shut Up and Dig Gaiden!",
    "Terraria: Also try Don't Starve!"
];
const url = "https://api.nekosapi.com/v3/images/random?tag=41&rating=safe&limit=1";

const fs = require('fs');;
const https = require('https');
const { token } = require('./config.json');

const { SlashCommandBuilder, Client, InteractionType, REST, Routes } = require('discord.js');
const schedule = require('node-schedule');

const client = new Client({ intents: 84992 });

// Array to store subscribed channels
let subscribedChannels = [];

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Function to subscribe a channel
function subscribeChannel(channel) {
    if (!subscribedChannels.includes(channel.id)) {
        subscribedChannels.push(channel.id);
        console.log(`Channel ${channel.name} subscribed to daily image posts.`);
    } else {
        console.log(`Channel ${channel.name} already subscribed.`);
    }
}

// Function to unsubscribe a channel
function unsubscribeChannel(channel) {
    const index = subscribedChannels.indexOf(channel.id);
    if (index > -1) {
        subscribedChannels.splice(index, 1);
        console.log(`Channel ${channel.name} unsubscribed from daily image posts.`);
    } else {
        console.log(`Channel ${channel.name} not subscribed.`);
    }
}

// Function to send the daily image
async function sendDailyImage() {
    const channels = client.channels.cache.filter(channel => channel.type === 'text' && subscribedChannels.includes(channel.id));

    for (const channel of channels.values()) {
        try {
            https.get(url, (res) => {
                console.log(`STATUS: ${res.statusCode}`);
                console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

                let rawData = '';
                res.on('data', (chunk) => {
                    rawData += chunk;
                });

                res.on('end', () => {
                    try {
                        // Parse the received data based on the Content-Type header (if applicable)
                        const contentType = res.headers['content-type'];
                        if (contentType && contentType.includes('json')) {
                            const data = JSON.parse(rawData);
                            console.log(data);
                            const dailyEmbed = new EmbedBuilder()
                                .setColor(0x3ABB52)
                                .setTitle(motdArray[Math.floor(Math.random * motdArray.length)])
                                .setImage('https://i.imgur.com/AfFp7pu.png')

                            channel.send({ embeds: [dailyEmbed] });
                            console.log(`Daily image sent to channel ${channel.name}`);
                        } else {
                            console.log(rawData);
                        }
                    } catch (error) {
                        console.error('Error parsing data:', error);
                    }
                });
            }).on('error', (error) => {
                console.error(`Error during request: ${error}`);
            });


        } catch (error) {
            console.error(`Error sending image to channel ${channel.name}:`, error);
        }
    }
}

// Daily execution using Node.js scheduling

const job = schedule.scheduleJob('0 0 * * *', () => {
    sendDailyImage();
});

const subscribeCommand = new SlashCommandBuilder()
    .setName('subscribe')
    .setDescription('Subscribe this channel to receive daily images.');

const unsubscribeCommand = new SlashCommandBuilder()
    .setName('unsubscribe')
    .setDescription('Unsubscribe this channel from daily images.');

// Command handler function
async function handleCommandInteraction(interaction) {
    if (interaction.type === InteractionType.ApplicationCommand) {
        const commandName = interaction.commandName;

        if (commandName === 'subscribe') {
            subscribeChannel(interaction.channel);
            await interaction.reply('This channel has been subscribed to daily images!');
        } else if (commandName === 'unsubscribe') {
            unsubscribeChannel(interaction.channel);
            await interaction.reply('This channel has been unsubscribed from daily images.');
        }
    }
}

// Register slash commands on startup (assuming global commands)
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const clientId = 'YOUR_CLIENT_ID'; // Replace with your application ID
const guildId = 'YOUR_GUILD_ID'; // Replace with your guild ID (optional for global commands)

const commands = [subscribeCommand.toJSON(), unsubscribeCommand.toJSON()];

(async () => {
    const rest = new REST().setToken(token);

    try {
        console.log('Started registering application commands.');

        if (guildId) { // Register for a specific guild
            await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
        } else { // Register globally (requires verification)
            await rest.put(Routes.applicationCommands(clientId), { body: commands });
        }

        console.log('Successfully registered application commands.');
    } catch (error) {
        console.error(`Error registering application commands:`, error);
    }
})
client.login(token);
