const {
    Client,
    GatewayIntentBits,
    Events
} = require("discord.js");

const fs = require("fs");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const DATA_FILE = "./players.json";

let players = {};

if (fs.existsSync(DATA_FILE)) {
    players = JSON.parse(
        fs.readFileSync(DATA_FILE, "utf8")
    );
}

function savePlayers() {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(players, null, 2)
    );
}

function getPlayer(userId) {
    if (!players[userId]) {
        players[userId] = {
            value: 1000000,
            training: 1,
            penaltyGoal: 0,
            penaltyMiss: 0
        };

        savePlayers();
    }

    return players[userId];
}

function formatMoney(amount) {
    if (amount >= 1000000) {
        return `${amount / 1000000}M€`;
    }

    if (amount >= 1000) {
        return `${amount / 1000}K€`;
    }

    return `${amount}€`;
}

function parseMoney(text) {
    text = text
        .toUpperCase()
        .replace("€", "");

    if (text.endsWith("M")) {
        return parseFloat(text) * 1000000;
    }

    if (text.endsWith("K")) {
        return parseFloat(text) * 1000;
    }

    return parseFloat(text);
}

client.once(Events.ClientReady, (bot) => {
    console.log(`${bot.user.tag} aktif!`);
});

client.on(Events.MessageCreate, async (message) => {

    if (message.author.bot) return;

    const args = message.content
        .trim()
        .split(/\s+/);

    const command = args[0].toLowerCase();

    // .ant
    if (command === ".ant") {

        const player = getPlayer(message.author.id);

        player.training++;

        if (player.training > 10) {
            player.training = 1;
        }

        savePlayers();

        return message.reply(
            `🏃 **ANTRENMAN**\n\n` +
            `👤 Oyuncu: **${message.author.username}**\n` +
            `📊 Antrenman: **${player.training}/10**`
        );
    }

    // .pen
    if (command === ".pen") {

        const player = getPlayer(message.author.id);

        const goal = Math.random() < 0.70;

        if (goal) {

            player.penaltyGoal++;

            savePlayers();

            return message.reply(
                `🥅 **PENALTI ATIŞI**\n\n` +
                `👤 Oyuncu: **${message.author.username}**\n\n` +
                `⚽ **GOOOOL!**\n\n` +
                `📊 ${player.penaltyGoal} Gol / ` +
                `${player.penaltyMiss} Kaçırma`
            );

        } else {

            player.penaltyMiss++;

            savePlayers();

            return message.reply(
                `🥅 **PENALTI ATIŞI**\n\n` +
                `👤 Oyuncu: **${message.author.username}**\n\n` +
                `❌ **KAÇIRDI!**\n\n` +
                `📊 ${player.penaltyGoal} Gol / ` +
                `${player.penaltyMiss} Kaçırma`
            );
        }
    }

    // .dver @oyuncu miktar
    if (command === ".dver") {

        const target =
            message.mentions.users.first();

        if (!target) {
            return message.reply(
                "❌ Kullanım: `.dver @oyuncu 2M`"
            );
        }

        const amountText = args[2];

        if (!amountText) {
            return message.reply(
                "❌ Miktar yazmalısın.\n" +
                "Örnek: `.dver @oyuncu 2M`"
            );
        }

        const amount = parseMoney(amountText);

        if (isNaN(amount)) {
            return message.reply(
                "❌ Geçerli bir miktar yaz.\n" +
                "Örnek: `2M` veya `500K`"
            );
        }

        const player = getPlayer(target.id);

        const oldValue = player.value;

        player.value += amount;

        savePlayers();

        return message.reply(
            `💰 **OYUNCU DEĞERİ**\n\n` +
            `👤 Oyuncu: **${target.username}**\n` +
            `📉 Eski Değer: **${formatMoney(oldValue)}**\n` +
            `📈 Eklenen: **+${formatMoney(amount)}**\n` +
            `💵 Yeni Değer: **${formatMoney(player.value)}**`
        );
    }

    // .antrenman
    if (command === ".antrenman") {

        return message.reply(
            `🏃 **ANTRENMAN SİSTEMİ**\n\n` +
            `\`.ant\` → Antrenmanı artırır.\n` +
            `📊 1/10 → 10/10\n` +
            `🔄 10/10 sonrası tekrar 1/10`
        );
    }

    // .penaltı
    if (command === ".penaltı") {

        const player =
            getPlayer(message.author.id);

        return message.reply(
            `🥅 **PENALTI SİSTEMİ**\n\n` +
            `\`.pen\` → Penaltı atışı yapar.\n\n` +
            `⚽ Goller: **${player.penaltyGoal}**\n` +
            `❌ Kaçırmalar: **${player.penaltyMiss}**`
        );
    }
});

client.login(process.env.TOKEN);
