const {
    Client,
    GatewayIntentBits,
    Events
} = require("discord.js");

const fs = require("fs");

// ==============================
// DEĞER YETKİLİSİ ROLÜ
// ==============================

const DEGER_YETKILISI_ROLE_ID = "1540002147243139133";

// ==============================
// CLIENT
// ==============================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ==============================
// VERİ DOSYASI
// ==============================

const DATA_FILE = "./players.json";

let players = {};

if (fs.existsSync(DATA_FILE)) {
    try {
        players = JSON.parse(
            fs.readFileSync(DATA_FILE, "utf8")
        );
    } catch {
        players = {};
    }
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
            training: 1,
            penaltyGoal: 0,
            penaltyMiss: 0
        };

        savePlayers();
    }

    return players[userId];
}

// ==============================
// PARA OKUMA
// ==============================

function parseMoney(text) {

    if (!text) return NaN;

    text = text
        .toUpperCase()
        .replace("€", "")
        .replace(",", ".");

    let multiplier = 1;

    if (text.endsWith("B")) {

        multiplier = 1000000000;
        text = text.slice(0, -1);

    } else if (text.endsWith("M")) {

        multiplier = 1000000;
        text = text.slice(0, -1);

    } else if (text.endsWith("K")) {

        multiplier = 1000;
        text = text.slice(0, -1);
    }

    const number = parseFloat(text);

    if (isNaN(number)) {
        return NaN;
    }

    return number * multiplier;
}

// ==============================
// PARA GÖSTERME
// ==============================

function formatMoney(amount) {

    if (amount >= 1000000000) {

        return `${Number(
            (amount / 1000000000).toFixed(2)
        )}B€`;
    }

    if (amount >= 1000000) {

        return `${Number(
            (amount / 1000000).toFixed(2)
        )}M€`;
    }

    if (amount >= 1000) {

        return `${Number(
            (amount / 1000).toFixed(2)
        )}K€`;
    }

    return `${Math.round(amount)}€`;
}

// ==============================
// TAKMA ADDAN DEĞER OKUMA
// Örnek:
// W.Sneijder | 🇳🇱 | SNT | 1M€
// ==============================

function getNicknameValue(nickname) {

    const match = nickname.match(
        /([\d.,]+)\s*(K|M|B)€?\s*$/
    );

    if (!match) {
        return null;
    }

    let number = parseFloat(
        match[1].replace(",", ".")
    );

    const unit = match[2].toUpperCase();

    if (unit === "K") {
        number *= 1000;
    }

    if (unit === "M") {
        number *= 1000000;
    }

    if (unit === "B") {
        number *= 1000000000;
    }

    return number;
}

// ==============================
// TAKMA ADDAN DEĞER DEĞİŞTİRME
// ==============================

function changeNicknameValue(
    nickname,
    newValue
) {

    return nickname.replace(
        /([\d.,]+)\s*(K|M|B)€?\s*$/,
        formatMoney(newValue)
    );
}

// ==============================
// BOT HAZIR
// ==============================

client.once(
    Events.ClientReady,
    (bot) => {

        console.log(
            `${bot.user.tag} aktif!`
        );
    }
);

// ==============================
// KOMUTLAR
// ==============================

client.on(
    Events.MessageCreate,
    async (message) => {

        if (message.author.bot) return;

        const args = message.content
            .trim()
            .split(/\s+/);

        const command =
            args[0].toLowerCase();

        // ==================================================
        // .ANT
        // ==================================================

        if (command === ".ant") {

            const player =
                getPlayer(message.author.id);

            player.training++;

            // 10/10 tamamlandı
            if (player.training >= 10) {

                player.training = 1;

                const nickname =
                    message.member.displayName;

                const currentValue =
                    getNicknameValue(nickname);

                if (currentValue !== null) {

                    const newValue =
                        currentValue + 2000000;

                    const newNickname =
                        changeNicknameValue(
                            nickname,
                            newValue
                        );

                    try {

                        await message.member.setNickname(
                            newNickname
                        );

                    } catch (error) {

                        console.log(
                            "Antrenman değer güncelleme hatası:",
                            error.message
                        );
                    }

                    savePlayers();

                    return message.reply(
                        `🏆 **ANTRENMAN TAMAMLANDI!**\n\n` +
                        `👤 Oyuncu: **${message.author.username}**\n` +
                        `📊 Antrenman: **1/10**\n` +
                        `💰 Değer Bonusu: **+2M€**\n` +
                        `💵 Yeni Değer: **${formatMoney(newValue)}**`
                    );
                }

                savePlayers();

                return message.reply(
                    `🏆 **ANTRENMAN TAMAMLANDI!**\n\n` +
                    `📊 Antrenman: **1/10**\n` +
                    `⚠️ Takma adında oyuncu değeri bulunamadı.`
                );
            }

            savePlayers();

            return message.reply(
                `🏃 **ANTRENMAN**\n\n` +
                `👤 Oyuncu: **${message.author.username}**\n` +
                `📊 Antrenman: **${player.training}/10**`
            );
        }

        // ==================================================
        // .ANTRENMAN
        // ==================================================

        if (command === ".antrenman") {

            const player =
                getPlayer(message.author.id);

            return message.reply(
                `🏃 **ANTRENMAN SİSTEMİ**\n\n` +
                `👤 Oyuncu: **${message.author.username}**\n` +
                `📊 Antrenman: **${player.training}/10**\n\n` +
                `• \`.ant\` → Antrenmanı artırır.\n` +
                `• 10/10 → **+2M€** değer\n` +
                `• Sonrasında tekrar **1/10**`
            );
        }

        // ==================================================
        // .PEN
        // ==================================================

        if (command === ".pen") {

            const player =
                getPlayer(message.author.id);

            const goal =
                Math.random() < 0.70;

            // GOL
            if (goal) {

                player.penaltyGoal++;

                const nickname =
                    message.member.displayName;

                const currentValue =
                    getNicknameValue(nickname);

                if (currentValue !== null) {

                    const newValue =
                        currentValue + 2000000;

                    const newNickname =
                        changeNicknameValue(
                            nickname,
                            newValue
                        );

                    try {

                        await message.member.setNickname(
                            newNickname
                        );

                    } catch (error) {

                        console.log(
                            "Penaltı değer güncelleme hatası:",
                            error.message
                        );
                    }

                    savePlayers();

                    return message.reply(
                        `🥅 **PENALTI ATIŞI**\n\n` +
                        `👤 Oyuncu: **${message.author.username}**\n\n` +
                        `⚽ **GOOOOOL!**\n\n` +
                        `💰 Değer Bonusu: **+2M€**\n` +
                        `💵 Yeni Değer: **${formatMoney(newValue)}**\n\n` +
                        `📊 Penaltı: **${player.penaltyGoal} Gol / ${player.penaltyMiss} Kaçırma**`
                    );
                }

                savePlayers();

                return message.reply(
                    `🥅 **PENALTI ATIŞI**\n\n` +
                    `⚽ **GOOOOOL!**\n` +
                    `💰 **+2M€**\n\n` +
                    `⚠️ Takma adında değer bulunamadı.`
                );
            }

            // KAÇIRDI
            player.penaltyMiss++;

            savePlayers();

            return message.reply(
                `🥅 **PENALTI ATIŞI**\n\n` +
                `👤 Oyuncu: **${message.author.username}**\n\n` +
                `❌ **KAÇIRDI!**\n\n` +
                `📊 Penaltı: **${player.penaltyGoal} Gol / ${player.penaltyMiss} Kaçırma**`
            );
        }

        // ==================================================
        // .PENALTI
        // ==================================================

        if (
            command === ".penaltı" ||
            command === ".penalti"
        ) {

            const player =
                getPlayer(message.author.id);

            const total =
                player.penaltyGoal +
                player.penaltyMiss;

            return message.reply(
                `🥅 **PENALTI İSTATİSTİKLERİ**\n\n` +
                `👤 Oyuncu: **${message.author.username}**\n` +
                `⚽ Goller: **${player.penaltyGoal}**\n` +
                `❌ Kaçırmalar: **${player.penaltyMiss}**\n` +
                `📊 Toplam: **${total}**`
            );
        }

        // ==================================================
        // .DVER
        // SADECE DEĞER YETKİLİSİ
        // ==================================================

        if (command === ".dver") {

            if (
                !message.member.roles.cache.has(
                    DEGER_YETKILISI_ROLE_ID
                )
            ) {

                return message.reply(
                    `❌ **Bu komutu sadece Değer Yetkilisi kullanabilir.**`
                );
            }

            const target =
                message.mentions.users.first();

            if (!target) {

                return message.reply(
                    `❌ Kullanım:\n` +
                    `\`.dver @oyuncu 5M\``
                );
            }

            const amountText =
                args[2];

            if (!amountText) {

                return message.reply(
                    `❌ Değer miktarı yazmalısın.\n\n` +
                    `Örnek:\n` +
                    `\`.dver @oyuncu 5M\``
                );
            }

            const amount =
                parseMoney(amountText);

            if (
                isNaN(amount) ||
                amount <= 0
            ) {

                return message.reply(
                    `❌ Geçerli bir miktar yaz.\n\n` +
                    `Örnek: \`5M\`, \`2M\`, \`500K\``
                );
            }

            const member =
                await message.guild.members.fetch(
                    target.id
                );

            const oldNickname =
                member.displayName;

            const oldValue =
                getNicknameValue(
                    oldNickname
                );

            if (oldValue === null) {

                return message.reply(
                    `❌ Oyuncunun takma adında değer bulunamadı.\n\n` +
                    `Örnek:\n` +
                    `\`W.Sneijder | 🇳🇱 | SNT | 1M€\``
                );
            }

            const newValue =
                oldValue + amount;

            const newNickname =
                changeNicknameValue(
                    oldNickname,
                    newValue
                );

            try {

                await member.setNickname(
                    newNickname
                );

            } catch (error) {

                console.log(
                    "Değer değiştirme hatası:",
                    error.message
                );

                return message.reply(
                    `❌ Takma ad değiştirilemedi.\n\n` +
                    `Botun **Takma Adları Yönet** yetkisine sahip olduğundan ve bot rolünün oyuncunun rolünün üstünde olduğundan emin ol.`
                );
            }

            return message.reply(
                `💰 **OYUNCU DEĞERİ GÜNCELLENDİ**\n\n` +
                `👤 Oyuncu: **${target.username}**\n` +
                `📉 Eski Değer: **${formatMoney(oldValue)}**\n` +
                `📈 Eklenen: **+${formatMoney(amount)}**\n` +
                `💵 Yeni Değer: **${formatMoney(newValue)}**`
            );
        }
    }
);

// ==============================
// BOT TOKEN
// ==============================

client.login(process.env.TOKEN);
