const url = 'https://api.nekosapi.com/v3/images/random?tag=41&rating=safe&limit=2&is_flagged=false';
const fs = require('fs');
const https = require('https');
const os = require('os');
const { token, appID, motdArray } = require('./config.json');
const { SlashCommandBuilder, Client, InteractionType, REST, Routes, Events, PermissionFlagsBits, EmbedBuilder, GatewayIntentBits } = require('discord.js');
const schedule = require('node-schedule');
const { error } = require('console');
const client = new Client({ intents: GatewayIntentBits.Guilds });
const saveData = './yuri.json';
var dataObj = {};

// Function to read JSON data from a file
function jsonRead(file) {
    try {
        // Read file content synchronously (consider asynchronous approach for large files)
        const data = fs.readFileSync(file, "utf8");
        // Parse JSON data
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading file:", error);
        // Handle error appropriately, like returning an empty object or throwing a custom error
        return {};
    }
}

// Function to write JSON data to a file
function jsonWrite(file, obj) {
    try {
        // Stringify the object
        const data = JSON.stringify(obj, null, 4); // Add indentation for readability (optional)
        // Write data to the file synchronously (consider asynchronous approach for large files)
        fs.writeFileSync(file, data);
    } catch (error) {
        console.error("Error writing file:", error);
        // Handle error appropriately, like throwing a custom error
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
                        .setImage(`${data.items[0].image_url}`)
                        .setFooter({ text: `${data.items[0].id}` });


                    try {
                        channel.send({ embeds: [dailyEmbed] });
                        console.log(`Test image ${data.items[0].id} sent to channel ${cId}`);
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
                        .setImage(`${data.items[0].image_url}`)
                        .setFooter({ text: `${data.items[0].id}` });

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
                await interaction.reply('Testing...');
                for (var i = 0; i < 100; 1++) {
                    await testImage(interaction.channelId);
                }
                break;
            default:
                await interaction.reply('This command does not exist.');
                break;
        }
    }
}

function reRegister() {
    let unReg = client.guilds.cache.filter((guilds) => !dataObj.registered.includes(guilds.id));
    for (const guild of unReg.values()) {
        try {
            rest.put(Routes.applicationGuildCommands(appID, guild.id), { body: commands });
            console.log(`Registering application commands on server: ${guild.id}.`)
            dataObj.registered.push(guild.id)
            pushPull()
        } catch (error) {
            console.error(`Error registering application commands:`, error);
        }
    }
}
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    reRegister()
});

client.on(Events.InteractionCreate, async interaction => {
    handleCommandInteraction(interaction)
})

client.on("guildJoin", async (guild) => {
    //check if registered
    reRegister()
});

pushPull()
client.login(token);

// Daily execution using Node.js scheduling
const job = schedule.scheduleJob('0 12 * * *', function () {
    sendDailyImage();
    reRegister();
    console.log('-----')
});
