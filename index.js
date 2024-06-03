const url = "https://api.nekosapi.com/v3/images/random?tag=41&rating=safe&limit=2";

const fs = require('fs');
const https = require('https');
const os = require('os');
const { token, appID, guildID, motdArray } = require('./config.json');

const { SlashCommandBuilder, Client, InteractionType, REST, Routes, Events, PermissionFlagsBits, EmbedBuilder, GatewayIntentBits } = require('discord.js');
const schedule = require('node-schedule');
const { error } = require('console');

const client = new Client({ intents: GatewayIntentBits.Guilds });

// Array to store subscribed channels
let subscribedChannels = [];

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Function to subscribe a channel
function subscribeChannel(channel) {
    if (!subscribedChannels.includes(channel)) {
        subscribedChannels.push(channel);
        console.log(`Channel ${channel} subscribed to daily image posts.`);
    } else {
        console.log(`Channel ${channel} already subscribed.`);
    }
}

// Function to unsubscribe a channel
function unsubscribeChannel(channel) {
    const index = subscribedChannels.indexOf(channel);
    if (index > -1) {
        subscribedChannels.splice(index, 1);
        console.log(`Channel ${channel} unsubscribed from daily image posts.`);
    } else {
        console.log(`Channel ${channel} not subscribed.`);
    }
}

// Function to send the daily image
async function testImage(cId) {
    const channel = client.channels.cache.get(cId);
    https.get(url, (res) => {

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
                    const dailyEmbed = new EmbedBuilder()
                        .setColor(0x3ABB52)
                        .setTitle(`${motdArray[Math.floor(Math.random() * motdArray.length)]}`)
                        .setImage(`${data.items[0].image_url || data.items[1].image_url}`);

                    try {
                        channel.send({ embeds: [dailyEmbed], content: 'test' });
                        console.log(`Daily image sent to channel ${cId}`);
                    } catch (error) {
                        console.error(`Error sending image to channel ${cId}:`, error);
                    }
                    return 'done'
                } else {
                    console.log(`data not json${os.EOL}${rawData}`);
                }
            } catch (error) {
                console.error('Error parsing data:', error);
            }
        });
    }).on('error', (error) => {
        console.error(`Error during request: ${error}`);
    });
}


// Function to send the daily image
async function sendDailyImage() {
    const channels = client.channels.cache.filter(channel => subscribedChannels.includes(channel.id));
    https.get(url, (res) => {

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
                    const dailyEmbed = new EmbedBuilder()
                        .setColor(0x3ABB52)
                        .setTitle(`${motdArray[Math.floor(Math.random() * motdArray.length)]}`)
                        .setImage(`${data.items[0].image_url || data.items[1].image_url}`);

                    for (const channel of channels.values()) {
                        try {
                            channel.send({ embeds: [dailyEmbed] });
                            console.log(`Test image sent to channel ${channel.name}`);
                        } catch (error) {
                            console.error(`Error sending image to channel ${channel.name}:`, error);
                        }
                    }
                } else {
                    console.log(`data not json${os.EOL}${rawData}`);
                }
            } catch (error) {
                console.error('Error parsing data:', error);
            }
        });
    }).on('error', (error) => {
        console.error(`Error during request: ${error}`);
    });
}

const subscribeCommand = new SlashCommandBuilder()
    .setName('subscribe')
    .setDescription('Subscribe this channel to receive daily images.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

const unsubscribeCommand = new SlashCommandBuilder()
    .setName('unsubscribe')
    .setDescription('Unsubscribe this channel from daily images.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

const testImageCommand = new SlashCommandBuilder()
    .setName('test')
    .setDescription('Request a test image.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

const commands = [subscribeCommand.toJSON(), unsubscribeCommand.toJSON(), testImageCommand.toJSON()];

const rest = new REST().setToken(token);

// Command handler function
async function handleCommandInteraction(interaction) {
    if (interaction.type === InteractionType.ApplicationCommand) {
        const commandName = interaction.commandName;
        switch (commandName) {
            case 'subscribe':
                subscribeChannel(interaction.channelId);
                await interaction.reply('This channel has been subscribed to daily images!');
                break;
            case 'unsubscribe':
                unsubscribeChannel(interaction.channelId);
                await interaction.reply('This channel has been unsubscribed from daily images.');
                break;
            case 'test':
                console.log(interaction.channelId);
                await testImage(interaction.channelId);
                await interaction.reply('Testing...');
                break;
            default:
                await interaction.reply('This command does not exist.');
                break;
        }
    }
}

client.on(Events.InteractionCreate, async interaction => {
    handleCommandInteraction(interaction)
})

client.on("guildJoin", async (guild) => {
    try {
        rest.put(Routes.applicationGuildCommands(appID, guild.id), { body: commands });
        console.log('Registering application commands.')
    } catch (error) {
        console.error(`Error registering application commands:`, error);
    }
});

client.login(token);

// Daily execution using Node.js scheduling
const job = schedule.scheduleJob('* * * * *', function () {
    sendDailyImage();
    console.log('x')
});
