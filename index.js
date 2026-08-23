const {
    Client,
    GatewayIntentBits,
    PermissionsBitField,
    EmbedBuilder
} = require("discord.js");

const fs = require("fs");

// ==========================================
// AYARLAR
// ==========================================

const PREFIX = ".";

// Yetki Rolleri
const DEGER_YETKILI = "1540002147243139133";
const MAC_YETKILI = "1539997232642654248";
const KAYIT_YETKILI = "1540005508768079912";
const CEKILIS_YETKILI = "1539997232642654248";
const TEKNIK_DIREKTOR = "1539997232642654248";

// ==========================================
// CLIENT
// ==========================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// ==========================================
// DATABASE
// ==========================================

if (!fs.existsSync("./data.json")) {
    fs.writeFileSync(
        "./data.json",
        JSON.stringify({
            players: {},
            teams: {},
            matches: {}
        }, null, 2)
    );
}

let db;

try {
    db = JSON.parse(
        fs.readFileSync("./data.json", "utf8")
    );
} catch {
    db = {
        players: {},
        teams: {},
        matches: {}
    };
}

if (!db.players) db.players = {};
if (!db.teams) db.teams = {};
if (!db.matches) db.matches = {};

function save() {
    fs.writeFileSync(
        "./data.json",
        JSON.stringify(db, null, 2)
    );
}

// ==========================================
// OYUNCU
// ==========================================

function getPlayer(id) {
    if (!db.players[id]) {
        db.players[id] = {
            value: 1000000,
            training: 0,
            registered: false,
            team: null
        };

        save();
    }

    return db.players[id];
}

// ==========================================
// PARA
// ==========================================

function formatMoney(number) {
    if (number >= 1000000000)
        return (number / 1000000000).toFixed(1) + "B€";

    if (number >= 1000000)
        return (number / 1000000).toFixed(1) + "M€";

    if (number >= 1000)
        return (number / 1000).toFixed(1) + "K€";

    return number + "€";
}

function parseMoney(text) {
    if (!text) return null;

    text = text
        .toUpperCase()
        .replace("€", "")
        .replace(",", ".")
        .trim();

    let multiplier = 1;

    if (text.endsWith("K")) {
        multiplier = 1000;
        text = text.slice(0, -1);
    } else if (text.endsWith("M")) {
        multiplier = 1000000;
        text = text.slice(0, -1);
    } else if (text.endsWith("B")) {
        multiplier = 1000000000;
        text = text.slice(0, -1);
    }

    const number = parseFloat(text);

    if (isNaN(number)) return null;

    return Math.floor(number * multiplier);
}

// ==========================================
// YETKİ SİSTEMİ
// ==========================================

function isAdmin(message) {
    return message.member.permissions.has(
        PermissionsBitField.Flags.Administrator
    );
}

function hasRole(message, roleId) {
    return message.member.roles.cache.has(roleId);
}

function adminOrRole(message, roleId) {
    return isAdmin(message) || hasRole(message, roleId);
}

// ==========================================
// BOT AÇILDI
// ==========================================

client.once("ready", () => {
    console.log("====================================");
    console.log(`BOT AKTİF: ${client.user.tag}`);
    console.log("====================================");

    client.user.setActivity("Legendary League");
});

// ==========================================
// KOMUTLAR
// ==========================================

client.on("messageCreate", async message => {

    try {

        if (message.author.bot) return;
        if (!message.guild) return;

        if (!message.content.startsWith(PREFIX)) return;

        const args = message.content
            .slice(PREFIX.length)
            .trim()
            .split(/\s+/);

        const command = args
            .shift()
            .toLowerCase();

        // =====================================
        // YARDIM
        // =====================================

        if (
            command === "yardım" ||
            command === "yardim" ||
            command === "help"
        ) {

            const embed = new EmbedBuilder()
                .setTitle("⚽ LEGENDARY LEAGUE BOT")
                .setDescription(
                    "**⚽ FUTBOL**\n" +
                    "`.pen` / `.penaltı`\n" +
                    "`.ant` / `.antrenman`\n" +
                    "`.maç @oyuncu`\n\n" +

                    "**💰 DEĞER**\n" +
                    "`.dver @oyuncu 5M`\n\n" +

                    "**👥 TAKIM**\n" +
                    "`.takımoluştur Takım Adı`\n" +
                    "`.transfer @oyuncu Takım`\n" +
                    "`.kadro`\n" +
                    "`.bütçe`\n\n" +

                    "**📝 KAYIT**\n" +
                    "`.kayıt @oyuncu`\n\n" +

                    "**🛡️ MODERASYON**\n" +
                    "`.kick @oyuncu sebep`\n" +
                    "`.ban @oyuncu sebep`\n" +
                    "`.mute @oyuncu 10m sebep`\n" +
                    "`.unmute @oyuncu`\n" +
                    "`.kilit`\n" +
                    "`.aç`\n\n" +

                    "**🎉 ÇEKİLİŞ**\n" +
                    "`.çekiliş 5M€`"
                )
                .setColor("Blue");

            return message.reply({
                embeds: [embed]
            });
        }

        // =====================================
        // ANTRENMAN
        // =====================================

        if (
            command === "ant" ||
            command === "antrenman"
        ) {

            const player =
                getPlayer(message.author.id);

            player.training++;

            let bonus = "";

            if (player.training >= 10) {

                player.training = 0;

                player.value += 200000;

                bonus =
                    "\n\n🎉 **10/10 TAMAMLANDI!**\n" +
                    "💰 Oyuncu değerine **+200K€** eklendi.\n" +
                    "🔄 Antrenman tekrar **0/10** oldu.";
            }

            save();

            return message.reply(
                `🏋️ **ANTRENMAN**\n\n` +
                `Oyuncu: ${message.author}\n` +
                `İlerleme: **${player.training}/10**` +
                bonus
            );
        }

        // =====================================
        // PENALTI
        // =====================================

        if (
            command === "pen" ||
            command === "penaltı" ||
            command === "penalti"
        ) {

            const player =
                getPlayer(message.author.id);

            const scored =
                Math.random() < 0.60;

            if (scored) {

                player.value += 100000;

                save();

                return message.reply(
                    `⚽ **GOOOOL!**\n\n` +
                    `${message.author} penaltıyı gole çevirdi!\n` +
                    `💰 Değer artışı: **+100K€**\n` +
                    `📈 Yeni değer: **${formatMoney(player.value)}**`
                );
            }

            return message.reply(
                `❌ **PENALTI KAÇTI!**\n\n` +
                `${message.author} penaltıyı gole çeviremedi.`
            );
        }

        // =====================================
        // DEĞER VER
        // =====================================

        if (command === "dver") {

            if (!adminOrRole(message, DEGER_YETKILI)) {
                return message.reply(
                    "❌ Bu komutu sadece **Değer Yetkilisi** veya **Yönetici** kullanabilir."
                );
            }

            const user =
                message.mentions.users.first();

            const amount =
                parseMoney(args[1]);

            if (!user || !amount) {
                return message.reply(
                    "❌ Kullanım:\n`.dver @oyuncu 5M`"
                );
            }

            const player =
                getPlayer(user.id);

            player.value = amount;

            save();

            return message.reply(
                `💰 ${user} oyuncusunun değeri **${formatMoney(amount)}** olarak ayarlandı.`
            );
        }

        // =====================================
        // KAYIT
        // =====================================

        if (
            command === "kayıt" ||
            command === "kayit"
        ) {

            if (!adminOrRole(message, KAYIT_YETKILI)) {
                return message.reply(
                    "❌ Bu komutu sadece **Kayıt Yetkilisi** veya **Yönetici** kullanabilir."
                );
            }

            const user =
                message.mentions.users.first();

            if (!user) {
                return message.reply(
                    "❌ Kullanım: `.kayıt @oyuncu`"
                );
            }

            const player =
                getPlayer(user.id);

            player.registered = true;

            save();

            return message.reply(
                `✅ ${user} başarıyla kayıt edildi.`
            );
        }

        // =====================================
        // TAKIM OLUŞTUR
        // =====================================

        if (
            command === "takımoluştur" ||
            command === "takimolustur"
        ) {

            if (!adminOrRole(message, TEKNIK_DIREKTOR)) {
                return message.reply(
                    "❌ Bu komutu sadece **Teknik Direktör** veya **Yönetici** kullanabilir."
                );
            }

            const teamName =
                args.join(" ");

            if (!teamName) {
                return message.reply(
                    "❌ Kullanım: `.takımoluştur Takım Adı`"
                );
            }

            if (db.teams[teamName]) {
                return message.reply(
                    "❌ Bu takım zaten mevcut."
                );
            }

            db.teams[teamName] = {
                members: [],
                budget: 50000000
            };

            save();

            return message.reply(
                `🏟️ **${teamName}** takımı oluşturuldu!\n` +
                `💰 Başlangıç bütçesi: **50M€**`
            );
        }

        // =====================================
        // TRANSFER
        // =====================================

        if (command === "transfer") {

            if (!adminOrRole(message, TEKNIK_DIREKTOR)) {
                return message.reply(
                    "❌ Bu komutu sadece **Teknik Direktör** veya **Yönetici** kullanabilir."
                );
            }

            const user =
                message.mentions.users.first();

            const teamName =
                args.slice(1).join(" ");

            if (!user || !teamName) {
                return message.reply(
                    "❌ Kullanım:\n`.transfer @oyuncu Takım Adı`"
                );
            }

            if (!db.teams[teamName]) {
                return message.reply(
                    "❌ Böyle bir takım bulunamadı."
                );
            }

            const player =
                getPlayer(user.id);

            // Eski takımdan çıkar
            if (
                player.team &&
                db.teams[player.team]
            ) {

                db.teams[player.team].members =
                    db.teams[player.team]
                        .members
                        .filter(
                            id => id !== user.id
                        );
            }

            // Yeni takıma ekle
            player.team = teamName;

            if (
                !db.teams[teamName]
                    .members
                    .includes(user.id)
            ) {

                db.teams[teamName]
                    .members
                    .push(user.id);
            }

            save();

            return message.reply(
                `🔄 ${user} oyuncusu **${teamName}** takımına transfer edildi.`
            );
        }

        // =====================================
        // KADRO
        // =====================================

        if (command === "kadro") {

            if (!adminOrRole(message, TEKNIK_DIREKTOR)) {
                return message.reply(
                    "❌ Bu komutu sadece **Teknik Direktör** veya **Yönetici** kullanabilir."
                );
            }

            const player =
                getPlayer(message.author.id);

            if (!player.team) {
                return message.reply(
                    "❌ Bir takımda değilsin."
                );
            }

            const team =
                db.teams[player.team];

            if (!team) {
                return message.reply(
                    "❌ Takım bulunamadı."
                );
            }

            const members =
                team.members.length > 0
                    ? team.members
                        .map(id => `<@${id}>`)
                        .join("\n")
                    : "Kadro boş.";

            const embed =
                new EmbedBuilder()
                    .setTitle(
                        `👥 ${player.team} KADROSU`
                    )
                    .setDescription(members)
                    .addFields({
                        name: "💰 Takım Bütçesi",
                        value: formatMoney(
                            team.budget
                        )
                    })
                    .setColor("Blue");

            return message.reply({
                embeds: [embed]
            });
        }

        // =====================================
        // BÜTÇE
        // =====================================

        if (
            command === "bütçe" ||
            command === "butce"
        ) {

            const player =
                getPlayer(message.author.id);

            if (!player.team) {
                return message.reply(
                    "❌ Bir takımda değilsin."
                );
            }

            const team =
                db.teams[player.team];

            return message.reply(
                `💰 **${player.team}**\n\n` +
                `Takım bütçesi: **${formatMoney(team.budget)}**`
            );
        }

        // =====================================
        // MAÇ
        // =====================================

        if (
            command === "maç" ||
            command === "mac"
        ) {

            if (!adminOrRole(message, MAC_YETKILI)) {
                return message.reply(
                    "❌ Bu komutu sadece **Maç Yetkilisi** veya **Yönetici** kullanabilir."
                );
            }

            const opponent =
                message.mentions.users.first();

            if (!opponent) {
                return message.reply(
                    "❌ Kullanım: `.maç @oyuncu`"
                );
            }

            if (
                opponent.id ===
                message.author.id
            ) {
                return message.reply(
                    "❌ Kendinle maç yapamazsın."
                );
            }

            const score1 =
                Math.floor(Math.random() * 6);

            const score2 =
                Math.floor(Math.random() * 6);

            const matchId =
                Date.now().toString();

            db.matches[matchId] = {
                player1: message.author.id,
                player2: opponent.id,
                score1,
                score2
            };

            save();

            const embed =
                new EmbedBuilder()
                    .setTitle("🏟️ MAÇ SONUCU")
                    .setDescription(
                        `${message.author} **${score1}** - **${score2}** ${opponent}`
                    )
                    .setFooter({
                        text: "Legendary League"
                    })
                    .setColor("Green");

            return message.reply({
                embeds: [embed]
            });
        }

        // =====================================
        // KICK
        // =====================================

        if (command === "kick") {

            if (!isAdmin(message)) {
                return message.reply(
                    "❌ Bu komutu sadece **Yönetici** kullanabilir."
                );
            }

            const member =
                message.mentions.members.first();

            if (!member) {
                return message.reply(
                    "❌ Kullanım: `.kick @oyuncu sebep`"
                );
            }

            if (!member.kickable) {
                return message.reply(
                    "❌ Bu kullanıcıyı kickleyemiyorum."
                );
            }

            const reason =
                args.slice(1).join(" ") ||
                "Sebep belirtilmedi.";

            await member.kick(reason);

            return message.reply(
                `👢 **${member.user.tag}** sunucudan atıldı.\n` +
                `📋 Sebep: **${reason}**`
            );
        }

        // =====================================
        // BAN
        // =====================================

        if (command === "ban") {

            if (!isAdmin(message)) {
                return message.reply(
                    "❌ Bu komutu sadece **Yönetici** kullanabilir."
                );
            }

            const member =
                message.mentions.members.first();

            if (!member) {
                return message.reply(
                    "❌ Kullanım: `.ban @oyuncu sebep`"
                );
            }

            if (!member.bannable) {
                return message.reply(
                    "❌ Bu kullanıcıyı banlayamıyorum."
                );
            }

            const reason =
                args.slice(1).join(" ") ||
                "Sebep belirtilmedi.";

            await member.ban({
                reason
            });

            return message.reply(
                `🔨 **${member.user.tag}** banlandı.\n` +
                `📋 Sebep: **${reason}**`
            );
        }

        // =====================================
        // MUTE
        // =====================================

        if (command === "mute") {

            if (!isAdmin(message)) {
                return message.reply(
                    "❌ Bu komutu sadece **Yönetici** kullanabilir."
                );
            }

            const member =
                message.mentions.members.first();

            if (!member) {
                return message.reply(
                    "❌ Kullanım: `.mute @oyuncu 10m sebep`"
                );
            }

            const durationText =
                args[1];

            if (!durationText) {
                return message.reply(
                    "❌ Süre belirt.\n\n" +
                    "Örnek:\n" +
                    "`.mute @oyuncu 10m Spam`"
                );
            }

            const match =
                durationText.match(
                    /^(\d+)(s|m|h|d)$/
                );

            if (!match) {
                return message.reply(
                    "❌ Geçersiz süre.\n\n" +
                    "`10s` = 10 saniye\n" +
                    "`10m` = 10 dakika\n" +
                    "`2h` = 2 saat\n" +
                    "`1d` = 1 gün"
                );
            }

            const amount =
                parseInt(match[1]);

            const unit =
                match[2];

            let milliseconds = 0;

            if (unit === "s")
                milliseconds =
                    amount * 1000;

            if (unit === "m")
                milliseconds =
                    amount * 60 * 1000;

            if (unit === "h")
                milliseconds =
                    amount * 60 * 60 * 1000;

            if (unit === "d")
                milliseconds =
                    amount * 24 * 60 * 60 * 1000;

            if (
                milliseconds >
                28 * 24 * 60 * 60 * 1000
            ) {
                return message.reply(
                    "❌ Mute en fazla **28 gün** olabilir."
                );
            }

            const reason =
                args.slice(2).join(" ") ||
                "Sebep belirtilmedi.";

            await member.timeout(
                milliseconds,
                reason
            );

            return message.reply(
                `🔇 **${member.user.tag}** susturuldu.\n` +
                `⏱️ Süre: **${durationText}**\n` +
                `📋 Sebep: **${reason}**`
            );
        }

        // =====================================
        // UNMUTE
        // =====================================

        if (
            command === "unmute" ||
            command === "un-timeout"
        ) {

            if (!isAdmin(message)) {
                return message.reply(
                    "❌ Bu komutu sadece **Yönetici** kullanabilir."
                );
            }

            const member =
                message.mentions.members.first();

            if (!member) {
                return message.reply(
                    "❌ Kullanım: `.unmute @oyuncu`"
                );
            }

            await member.timeout(
                null,
                "Mute kaldırıldı."
            );

            return message.reply(
                `🔊 **${member.user.tag}** kullanıcısının mutesi kaldırıldı.`
            );
        }

        // =====================================
        // KANAL KİLİT
        // =====================================

        if (command === "kilit") {

            if (!isAdmin(message)) {
                return message.reply(
                    "❌ Bu komutu sadece **Yönetici** kullanabilir."
                );
            }

            await message.channel
                .permissionOverwrites
                .edit(
                    message.guild.roles.everyone,
                    {
                        SendMessages: false
                    }
                );

            return message.reply(
                "🔒 **Kanal kilitlendi.**"
            );
        }

        // =====================================
        // KANAL AÇ
        // =====================================

        if (
            command === "aç" ||
            command === "ac"
        ) {

            if (!isAdmin(message)) {
                return message.reply(
                    "❌ Bu komutu sadece **Yönetici** kullanabilir."
                );
            }

            await message.channel
                .permissionOverwrites
                .edit(
                    message.guild.roles.everyone,
                    {
                        SendMessages: null
                    }
                );

            return message.reply(
                "🔓 **Kanal tekrar açıldı.**"
            );
        }

        // =====================================
        // ÇEKİLİŞ
        // =====================================

        if (
            command === "çekiliş" ||
            command === "cekilis"
        ) {

            if (!adminOrRole(message, CEKILIS_YETKILI)) {
                return message.reply(
                    "❌ Bu komutu sadece **Çekiliş Yetkilisi** veya **Yönetici** kullanabilir."
                );
            }

            const prize =
                args.join(" ");

            if (!prize) {
                return message.reply(
                    "❌ Kullanım: `.çekiliş 5M€`"
                );
            }

            const embed =
                new EmbedBuilder()
                    .setTitle("🎉 ÇEKİLİŞ")
                    .setDescription(
                        `🎁 **Ödül:** ${prize}\n\n` +
                        `Katılmak için 🎉 emojisine bas!\n\n` +
                        `⏱️ Çekiliş **30 saniye** sonra sona erecek.`
                    )
                    .setFooter({
                        text: "Legendary League"
                    })
                    .setColor("Gold");

            const giveaway =
                await message.channel.send({
                    embeds: [embed]
                });

            await giveaway.react("🎉");

            setTimeout(async () => {

                try {

                    const fetched =
                        await message.channel
                            .messages
                            .fetch(giveaway.id);

                    const reaction =
                        fetched.reactions.cache.get("🎉");

                    if (!reaction) {
                        return message.channel.send(
                            "❌ Çekilişe katılan olmadı."
                        );
                    }

                    const users =
                        await reaction.users.fetch();

                    const participants =
                        users.filter(
                            user => !user.bot
                        );

                    if (!participants.size) {
                        return message.channel.send(
                            "❌ Çekilişe katılan olmadı."
                        );
                    }

                    const winner =
                        participants.random();

                    await message.channel.send(
                        `🎉 **ÇEKİLİŞ SONUCU**\n\n` +
                        `🏆 Kazanan: ${winner}\n` +
                        `🎁 Ödül: **${prize}**`
                    );

                } catch (error) {
                    console.error(
                        "Çekiliş hatası:",
                        error
                    );
                }

            }, 30000);

            return;
        }

    } catch (error) {

        console.error(
            "Komut hatası:",
            error
        );

        message.reply(
            "❌ Komut çalıştırılırken bir hata oluştu."
        ).catch(() => {});
    }
});

// ==========================================
// HATA YAKALAMA
// ==========================================

client.on("error", error => {
    console.error("Discord Client Hatası:", error);
});

process.on("unhandledRejection", error => {
    console.error("Unhandled Rejection:", error);
});

// ==========================================
// TOKEN
// ==========================================

const TOKEN = process.env.TOKEN;

if (!TOKEN) {
    console.error(
        "❌ TOKEN bulunamadı!"
    );

    process.exit(1);
}

client.login(TOKEN);
