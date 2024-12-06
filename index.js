const url = 'https://yuri.6969690.xyz/random';
const fs = require('fs');
const https = require('https');
const os = require('os');
const { token, appID, motdArray, totp } = require('./config.json');
const { SlashCommandBuilder, Client, InteractionType, REST, Routes, Events, PermissionFlagsBits, EmbedBuilder, GatewayIntentBits } = require('discord.js');
var speakeasy = require("speakeasy");
const { Cron } = require("croner");
const client = new Client({ intents: GatewayIntentBits.Guilds });
const saveData = './yuri.json';
var dataObj = {};

// Function to read JSON data from a file
function jsonRead(file) {
    try {
        const data = fs.readFileSync(file, "utf8");
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading file:", error);
        return {};
    }
}

// Function to write JSON data to a file
function jsonWrite(file, obj) {
    try {
        // Stringify the object
        const data = JSON.stringify(obj, null, 4);
        fs.writeFileSync(file, data);
    } catch (error) {
        console.error("Error writing file:", error);
    }
}

function pushPull() {
    let readObj = jsonRead(saveData);
    if (!(Object.keys(dataObj).length === 0) && (dataObj.constructor === Object)) {
        // obj not empty
        jsonWrite(saveData, dataObj);
        dataObj = jsonRead(saveData);
    } else if (!(Object.keys(readObj).length === 0) && (readObj.constructor === Object)) {
        //obj empty, file not empty
        dataObj = readObj
    } else {
        console.error(`No data or read error at: ${saveData}`)
        return {}
    }
}

async function fetchOlderMessages(channel, lastMessageId) {
    return await channel.messages.fetch({
        limit: 100,
        before: lastMessageId
    });
}

// Function to subscribe a channel
function subscribeChannel(channel) {
    if (!dataObj.subs.includes(channel)) {
        dataObj.subs.push(channel);
        pushPull()
        console.log(`Channel ${channel} subscribed to daily image posts.`);
    } else {
        console.log(`Channel ${channel} already subscribed.`);
    }
}

// Function to unsubscribe a channel
function unsubscribeChannel(channel) {
    const index = dataObj.subs.indexOf(channel);
    if (index > -1) {
        dataObj.subs.splice(index, 1);
        pushPull()
        console.log(`Channel ${channel} unsubscribed from daily image posts.`);
    } else {
        console.log(`Channel ${channel} not subscribed.`);
    }
}

// Function to send the daily image
async function sendImage(cId, reason) {
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
                        .setImage(`${data.url}`)
                        .setFooter({ text: `${data.image}` });

                    try {
                        channel.send({ embeds: [dailyEmbed] });
                        switch (reason) {
                            case 'test': 
                                console.log(`Test image ${data.image} sent to channel ${cId}`);
                                break;
                            case 'topt': 
                                console.log(`Requested image ${data.image} sent to channel ${cId}verified by totp`);
                                break;
                        }
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
    pushPull()
    const channels = client.channels.cache.filter(channel => dataObj.subs.includes(channel.id));
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
                        .setImage(`${data.url}`)
                        .setFooter({ text: `${data.image}` });

                    for (const channel of channels.values()) {
                        try {
                            channel.send({ embeds: [dailyEmbed] });
                            console.log(`Daily image sent to channel ${channel.name}`);
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

//function to replace bad image
async function yeet(cId) {
    const channel = client.channels.cache.get(cId);
    
    async function fetchOlderMessages(channel, lastMessageId) {
        return await channel.messages.fetch({ 
            limit: 100,
            before: lastMessageId 
        });
    }

    // Get the two most recent bot messages
    let lastId = null;
    let messages;
    let foundMessages = [];

    do {
        messages = await fetchOlderMessages(channel, lastId);
        const botMessages = messages.filter(msg => msg.author.id === client.user.id);
        
        foundMessages.push(...botMessages.values());
        if (foundMessages.length >= 2) {
            // We found the two most recent bot messages
            break;
        }
        
        lastId = messages.last()?.id;
    } while (messages.size === 100);

    // The second-to-last message is what we want
    const targetMessage = foundMessages[1];

    if (targetMessage) {
        //delete message
        let footer = targetMessage.embeds[0]?.footer.text ?? 'No Footer';
        await targetMessage.delete()
            .then(() => {
                console.log(`Deleted image ${footer}`)
                if (footer != 'No Footer') {dataObj.nuke.push(`${footer}`)}
                pushPull()
                //send replacement
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
                                    .setImage(`${data.url}`)
                                    .setFooter({ text: `${data.image}` });

                                try {
                                    channel.send({ embeds: [dailyEmbed] });
                                    console.log(`Replacement image sent to channel ${cId}`);
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
            })
            .catch((err)=> {console.error(`Failed deleting at an image: ${err}`)})
    } else {
        console.log('No suitable message found to delete');
    }
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
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addIntegerOption(option =>
        option
            .setName('images')
            .setDescription('Number of images'));

const yeetCommand = new SlashCommandBuilder()
    .setName('yeet')
    .setDescription('Yeet the bot and the last message it sent.');

const totpImageCommand = new SlashCommandBuilder()
    .setName('test')
    .setDescription('Request a test image.')
    .setDefaultMemberPermissions()
    .addIntegerOption(option =>
        option
            .setName('totp')
            .setDescription('Number of images'))
            .setRequired(true);

const commands = [subscribeCommand.toJSON(), unsubscribeCommand.toJSON(), testImageCommand.toJSON(), yeetCommand.toJSON(), totpImageCommand.toJSON()];
const rest = new REST().setToken(token);

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
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
                await interaction.reply('Sending')
                let x = interaction.options.getInteger('images') ?? 1
                if (x > 20) { x = 20 };
                for (var i = 0; i < x; i++) {
                    await sendImage(interaction.channelId, 'test');
                    await sleep(1000)
                }
                await interaction.editReply('Done!');
                break;
            case 'yeet':
                console.log(`yeeting an image from channel ${interaction.channelId}`);
                await interaction.reply('Yeeting...');
                await yeet(interaction.channelId);
                await interaction.editReply('Yeeted!');
                break;
            case 'totp':;
                await interaction.reply({content: 'Validating TOTP...', ephemeral: true});
                let tokenValidates = speakeasy.totp.verify({
                    secret: secret.base32,
                    encoding: 'base32',
                    token: interaction.options.getInteger('totp'),
                    window: 3
                });
                if (tokenValidates) {
                    await interaction.editReply('TOTP is valid!');
                    await sendImage(interaction.channelId, 'totp');
                } else {
                    await interaction.editReply('TOTP is invalid!');
                }
                break;
            default:
                await interaction.reply('This command does not exist.');
                break;
        }
    }
}

function reRegister(force = false) {
    let unReg = (force) ? client.guilds.cache : client.guilds.cache.filter((guilds) => !dataObj.registered.includes(guilds.id));
    for (const guild of unReg.values()) {
        try {
            rest.put(Routes.applicationGuildCommands(appID, guild.id), { body: commands });
            console.log(`Registering application commands on server: ${guild.id}.`)
            if (!dataObj.registered.includes(guild.id)) {dataObj.registered.push(guild.id)}
            pushPull()
        } catch (error) {
            console.error(`Error registering application commands:`, error);
        }
    }
}

client.on(Events.InteractionCreate, async interaction => {
    handleCommandInteraction(interaction)
})

client.on("guildJoin", async (guild) => {
    //check if registered
    reRegister()
});

let now = new Date(Date.now())
console.log(now.toString())
const job = new Cron("0 12 * * *", { utcOffset: -300, protect: true }, () => {
    let now = new Date(Date.now())
    console.log(now.toString())
    sendDailyImage();
});
pushPull()
client.login(token)
client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    reRegister(true)
    console.log(job.isRunning())
});