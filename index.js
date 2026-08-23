const {
    Client,
    GatewayIntentBits,
    PermissionsBitField,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const fs = require("fs");

const PREFIX = ".";

// =================================================
// ROL IDLERİ
// =================================================

const DEGER_YETKILI = "1540002147243139133";
const MAC_YETKILI = "1539997232642654248";
const KAYIT_YETKILI = "1540005508768079912";
const CEKILIS_YETKILI = "1539997232642654248";

const TEKNIK_DIREKTOR_YETKILI = "1539997232642654248";

const TEKNIK_DIREKTOR_ROL = "1539994147245527111";
const FUTBOLCU_ROL = "1539994254917767349";

// =================================================
// CLIENT
// =================================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// =================================================
// DATABASE
// =================================================

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

db.players ||= {};
db.teams ||= {};
db.matches ||= {};

function save() {
    fs.writeFileSync(
        "./data.json",
        JSON.stringify(db, null, 2)
    );
}

// =================================================
// OYUNCU
// =================================================

function getPlayer(id) {

    if (!db.players[id]) {
        db.players[id] = {
            registered: false,
            registeredName: null,
            type: null,
            value: 1000000,
            budget: 0,
            training: 0,
            team: null,
            position: "MID",
            goals: 0,
            assists: 0,
            yellow: 0,
            red: 0,
            matches: 0
        };

        save();
    }

    return db.players[id];
}

// =================================================
// PARA
// =================================================

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
    }

    if (text.endsWith("M")) {
        multiplier = 1000000;
        text = text.slice(0, -1);
    }

    if (text.endsWith("B")) {
        multiplier = 1000000000;
        text = text.slice(0, -1);
    }

    const n = parseFloat(text);

    if (isNaN(n)) return null;

    return Math.floor(n * multiplier);
}

// =================================================
// RASTGELE
// =================================================

function random(min, max) {
    return Math.floor(
        Math.random() * (max - min + 1)
    ) + min;
}

function randomItem(array) {
    if (!array.length) return null;
    return array[random(0, array.length - 1)];
}

// =================================================
// YETKİ
// =================================================

function isAdmin(member) {

    return member.permissions.has(
        PermissionsBitField.Flags.Administrator
    );
}

function hasRole(member, roleId) {

    return member.roles.cache.has(roleId);
}

function adminOrRole(member, roleId) {

    return (
        isAdmin(member) ||
        hasRole(member, roleId)
    );
}

function isTechnicalDirector(member) {

    return (
        isAdmin(member) ||
        hasRole(member, TEKNIK_DIREKTOR_YETKILI) ||
        hasRole(member, TEKNIK_DIREKTOR_ROL)
    );
}

// =================================================
// ÜYE ROLÜ
// =================================================

async function getUyeRole(guild) {

    let role = guild.roles.cache.find(
        r => r.name.toLowerCase() === "üye"
    );

    if (role) return role;

    try {
        return await guild.roles.create({
            name: "Üye",
            reason: "Kayıt sistemi"
        });
    } catch {
        return null;
    }
}

// =================================================
// KAYIT BUTONLARI
// =================================================

function registrationButtons(userId) {

    return new ActionRowBuilder().addComponents(

        new ButtonBuilder()
            .setCustomId(`kayit_td_${userId}`)
            .setLabel("Teknik Direktör")
            .setEmoji("🧑‍💼")
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId(`kayit_futbolcu_${userId}`)
            .setLabel("Futbolcu")
            .setEmoji("⚽")
            .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
            .setCustomId(`kayit_uye_${userId}`)
            .setLabel("Üye")
            .setEmoji("👤")
            .setStyle(ButtonStyle.Secondary)
    );
}

// =================================================
// TAKIM KADROSU
// =================================================

function getTeamPlayers(teamName) {

    const team = db.teams[teamName];

    if (!team) return [];

    return team.members
        .map(id => ({
            id,
            player: getPlayer(id)
        }));
}

function getTeamPlayersByPosition(teamName, positions) {

    return getTeamPlayers(teamName)
        .filter(x =>
            positions.includes(x.player.position)
        );
}

// =================================================
// MAÇ SÜRESİ
// =================================================

function parseDuration(text) {

    if (!text) return null;

    const match = text
        .toLowerCase()
        .match(/^(\d+)(s|sn|dk|d|sa|h)$/);

    if (!match) return null;

    const amount = Number(match[1]);
    const unit = match[2];

    if (unit === "s" || unit === "sn")
        return amount * 1000;

    if (unit === "dk" || unit === "d")
        return amount * 60 * 1000;

    if (unit === "sa" || unit === "h")
        return amount * 60 * 60 * 1000;

    return null;
}

// =================================================
// BOT HAZIR
// =================================================

client.once("ready", () => {

    console.log("--------------------------------");
    console.log(`BOT AKTİF: ${client.user.tag}`);
    console.log("--------------------------------");

    client.user.setActivity("Legendary League");
});

// =================================================
// BUTON KAYIT
// =================================================

client.on("interactionCreate", async interaction => {

    if (!interaction.isButton()) return;

    if (!interaction.customId.startsWith("kayit_"))
        return;

    try {

        if (!adminOrRole(
            interaction.member,
            KAYIT_YETKILI
        )) {

            return interaction.reply({
                content:
                    "❌ Bu butonu sadece Kayıt Yetkilisi veya Yönetici kullanabilir.",
                ephemeral: true
            });
        }

        const parts =
            interaction.customId.split("_");

        const type = parts[1];
        const targetId = parts[2];

        const member =
            await interaction.guild.members
                .fetch(targetId)
                .catch(() => null);

        if (!member) {
            return interaction.reply({
                content: "❌ Oyuncu bulunamadı.",
                ephemeral: true
            });
        }

        let role = null;
        let typeName = "";

        if (type === "td") {

            role =
                interaction.guild.roles.cache.get(
                    TEKNIK_DIREKTOR_ROL
                );

            typeName = "Teknik Direktör";
        }

        if (type === "futbolcu") {

            role =
                interaction.guild.roles.cache.get(
                    FUTBOLCU_ROL
                );

            typeName = "Futbolcu";
        }

        if (type === "uye") {

            role =
                await getUyeRole(
                    interaction.guild
                );

            typeName = "Üye";
        }

        if (!role) {

            return interaction.reply({
                content:
                    "❌ Rol bulunamadı.",
                ephemeral: true
            });
        }

        await interaction.reply({
            content:
                `📝 **${typeName}** seçildi.\n\n` +
                `${member} için oyuncu adını bu kanala yazın.\n\n` +
                `Örnek: \`W. Sneijder\`\n` +
                `⏱️ 60 saniye süreniz var.`,
            ephemeral: true
        });

        const collector =
            interaction.channel.createMessageCollector({
                filter: msg =>
                    msg.author.id ===
                    interaction.user.id,
                max: 1,
                time: 60000
            });

        collector.on("collect", async msg => {

            const name =
                msg.content.trim();

            if (!name) return;

            const player =
                getPlayer(targetId);

            player.registered = true;
            player.registeredName = name;
            player.type = typeName;

            await member.roles.add(
                role,
                "Kayıt sistemi"
            );

            save();

            await msg.reply(
                `✅ **KAYIT TAMAMLANDI**\n\n` +
                `👤 Kullanıcı: ${member}\n` +
                `📝 İsim: **${name}**\n` +
                `🏷️ Tür: **${typeName}**\n` +
                `🎭 Rol: ${role}\n` +
                `💰 Değer: **${formatMoney(player.value)}**`
            );
        });

    } catch (error) {
        console.error(error);
    }
});

// =================================================
// MESAJ KOMUTLARI
// =================================================

client.on("messageCreate", async message => {

    try {

        if (message.author.bot) return;
        if (!message.guild) return;
        if (!message.content.startsWith(PREFIX)) return;

        const args =
            message.content
                .slice(PREFIX.length)
                .trim()
                .split(/\s+/);

        const command =
            args.shift().toLowerCase();

        // =================================================
        // YARDIM
        // =================================================

        if (
            command === "yardım" ||
            command === "yardim" ||
            command === "help"
        ) {

            const embed =
                new EmbedBuilder()
                    .setTitle("⚽ LEGENDARY LEAGUE BOT")
                    .setDescription(
                        "**📝 KAYIT**\n" +
                        "`.k @oyuncu`\n\n" +

                        "**💰 DEĞER**\n" +
                        "`.dver @oyuncu 5M`\n\n" +

                        "**💵 BÜTÇE**\n" +
                        "`.bütçe`\n" +
                        "`.bütçe @oyuncu`\n" +
                        "`.bütçeekle @oyuncu 5M`\n\n" +

                        "**🏋️ FUTBOL**\n" +
                        "`.ant`\n" +
                        "`.pen`\n\n" +

                        "**🏟️ MAÇ**\n" +
                        "`.maç Takım1 | Takım2`\n" +
                        "`.maçdurum`\n" +
                        "`.maçiptal`\n" +
                        "`.skor`\n\n" +

                        "**👥 KADRO**\n" +
                        "`.kadro`\n" +
                        "`.kadroekle @oyuncu`\n" +
                        "`.kadroçıkar @oyuncu`\n" +
                        "`.pozisyon @oyuncu GK`\n\n" +

                        "**🔄 TRANSFER**\n" +
                        "`.transfer @oyuncu Takım Adı`\n\n" +

                        "**🏆 TAKIM**\n" +
                        "`.takımoluştur Takım Adı`\n\n" +

                        "**🎉 ÇEKİLİŞ**\n" +
                        "`.çekiliş 5M€ 5sa`\n\n" +

                        "**🛡️ MODERASYON**\n" +
                        "`.kick @oyuncu sebep`\n" +
                        "`.ban @oyuncu sebep`\n" +
                        "`.mute @oyuncu 10dk sebep`\n" +
                        "`.unmute @oyuncu`\n" +
                        "`.kilit`\n" +
                        "`.aç`"
                    )
                    .setColor("Blue");

            return message.reply({
                embeds: [embed]
            });
        }

        // =================================================
        // KAYIT
        // =================================================

        if (command === "k") {

            if (!adminOrRole(
                message.member,
                KAYIT_YETKILI
            )) {

                return message.reply(
                    "❌ Kayıt Yetkilisi veya Yönetici olmalısın."
                );
            }

            const user =
                message.mentions.users.first();

            if (!user) {

                return message.reply(
                    "❌ `.k @oyuncu`"
                );
            }

            const embed =
                new EmbedBuilder()
                    .setTitle("📝 OYUNCU KAYDI")
                    .setDescription(
                        `${user} için kayıt türünü seçin.\n\n` +
                        "🧑‍💼 Teknik Direktör\n" +
                        "⚽ Futbolcu\n" +
                        "👤 Üye"
                    )
                    .setColor("Blue");

            return message.reply({
                embeds: [embed],
                components: [
                    registrationButtons(user.id)
                ]
            });
        }

        // =================================================
        // DEĞER
        // =================================================

        if (command === "dver") {

            if (!adminOrRole(
                message.member,
                DEGER_YETKILI
            )) {

                return message.reply(
                    "❌ Değer Yetkilisi veya Yönetici olmalısın."
                );
            }

            const user =
                message.mentions.users.first();

            const amount =
                parseMoney(args[1]);

            if (!user || !amount) {

                return message.reply(
                    "❌ `.dver @oyuncu 5M`"
                );
            }

            const player =
                getPlayer(user.id);

            player.value = amount;

            save();

            return message.reply(
                `💰 ${user} değeri **${formatMoney(amount)}** oldu.`
            );
        }

        // =================================================
        // BÜTÇE GÖRÜNTÜLE
        // HERKES KULLANABİLİR
        // =================================================

        if (
            command === "bütçe" ||
            command === "butce"
        ) {

            const user =
                message.mentions.users.first() ||
                message.author;

            const player =
                getPlayer(user.id);

            return message.reply(
                `💵 **BÜTÇE**\n\n` +
                `👤 ${user}\n` +
                `💰 Bütçe: **${formatMoney(player.budget)}**`
            );
        }

        // =================================================
        // BÜTÇE EKLE
        // SADECE YÖNETİCİ
        // =================================================

        if (
            command === "bütçeekle" ||
            command === "butceekle"
        ) {

            if (!isAdmin(message.member)) {

                return message.reply(
                    "❌ Bu komutu sadece Yönetici kullanabilir."
                );
            }

            const user =
                message.mentions.users.first();

            const amount =
                parseMoney(args[1]);

            if (!user || !amount) {

                return message.reply(
                    "❌ `.bütçeekle @oyuncu 5M`"
                );
            }

            const player =
                getPlayer(user.id);

            player.budget += amount;

            save();

            return message.reply(
                `💵 ${user} bütçesine ` +
                `**+${formatMoney(amount)}** eklendi.\n` +
                `💰 Yeni bütçe: **${formatMoney(player.budget)}**`
            );
        }

        // =================================================
        // ANTRENMAN
        // =================================================

        if (
            command === "ant" ||
            command === "antrenman"
        ) {

            const player =
                getPlayer(message.author.id);

            player.training++;

            let text =
                `🏋️ **ANTRENMAN**\n\n` +
                `📊 ${player.training}/10`;

            if (player.training >= 10) {

                player.training = 0;
                player.value += 200000;

                text +=
                    "\n\n🎉 **10/10 TAMAMLANDI!**" +
                    "\n💰 +200K€ değer kazandın." +
                    "\n🔄 Antrenman 0/10 oldu.";
            }

            save();

            return message.reply(text);
        }

        // =================================================
        // PENALTI
        // =================================================

        if (
            command === "pen" ||
            command === "penaltı" ||
            command === "penalti"
        ) {

            const player =
                getPlayer(message.author.id);

            const goal =
                Math.random() < 0.60;

            if (goal) {

                player.value += 100000;

                save();

                return message.reply(
                    `⚽ **GOOOL!**\n\n` +
                    `🥅 Penaltı gole çevrildi!\n` +
                    `💰 Değer: **+100K€**`
                );
            }

            return message.reply(
                "❌ **PENALTI KAÇTI!**"
            );
        }

        // =================================================
        // TAKIM OLUŞTUR
        // =================================================

        if (
            command === "takımoluştur" ||
            command === "takimolustur"
        ) {

            if (!isTechnicalDirector(
                message.member
            )) {

                return message.reply(
                    "❌ Teknik Direktör veya Yönetici olmalısın."
                );
            }

            const teamName =
                args.join(" ");

            if (!teamName) {

                return message.reply(
                    "❌ `.takımoluştur Galatasaray`"
                );
            }

            if (db.teams[teamName]) {

                return message.reply(
                    "❌ Bu takım zaten var."
                );
            }

            db.teams[teamName] = {
                owner: message.author.id,
                members: [],
                budget: 50000000,
                wins: 0,
                draws: 0,
                losses: 0
            };

            const owner =
                getPlayer(message.author.id);

            owner.team = teamName;

            save();

            return message.reply(
                `🏟️ **${teamName}** oluşturuldu!\n` +
                `👤 Teknik Direktör: ${message.author}\n` +
                `💰 Takım bütçesi: **50M€**`
            );
        }

        // =================================================
        // KADRO
        // =================================================

        if (command === "kadro") {

            const player =
                getPlayer(message.author.id);

            if (!player.team) {

                return message.reply(
                    "❌ Bir takıma bağlı değilsin."
                );
            }

            const team =
                db.teams[player.team];

            if (!team) {

                return message.reply(
                    "❌ Takım bulunamadı."
                );
            }

            const list =
                team.members.length
                    ? team.members.map(id => {

                        const p =
                            getPlayer(id);

                        return (
                            `• ${p.registeredName || "İsimsiz"}` +
                            ` — ${p.position}` +
                            ` <@${id}>`
                        );

                    }).join("\n")
                    : "Kadro boş.";

            const embed =
                new EmbedBuilder()
                    .setTitle(
                        `👥 ${player.team} KADROSU`
                    )
                    .setDescription(list)
                    .addFields({
                        name: "💰 Takım Bütçesi",
                        value:
                            formatMoney(team.budget)
                    })
                    .setColor("Blue");

            return message.reply({
                embeds: [embed]
            });
        }

        // =================================================
        // KADRO EKLE
        // =================================================

        if (command === "kadroekle") {

            const td =
                getPlayer(message.author.id);

            if (
                !isTechnicalDirector(
                    message.member
                )
            ) {

                return message.reply(
                    "❌ Sadece Teknik Direktör veya Yönetici."
                );
            }

            if (!td.team) {

                return message.reply(
                    "❌ Önce bir takımın Teknik Direktörü olmalısın."
                );
            }

            const user =
                message.mentions.users.first();

            if (!user) {

                return message.reply(
                    "❌ `.kadroekle @oyuncu`"
                );
            }

            const player =
                getPlayer(user.id);

            if (player.team) {

                return message.reply(
                    `❌ Oyuncu zaten **${player.team}** takımında.`
                );
            }

            player.team = td.team;

            db.teams[td.team]
                .members
                .push(user.id);

            save();

            return message.reply(
                `✅ ${user} **${td.team}** kadrosuna eklendi.`
            );
        }

        // =================================================
        // KADRO ÇIKAR
        // =================================================

        if (
            command === "kadroçıkar" ||
            command === "kadroçikar" ||
            command === "kadroci̇kar"
        ) {

            const td =
                getPlayer(message.author.id);

            if (
                !isTechnicalDirector(
                    message.member
                )
            ) {

                return message.reply(
                    "❌ Sadece Teknik Direktör veya Yönetici."
                );
            }

            if (!td.team) {

                return message.reply(
                    "❌ Takımın yok."
                );
            }

            const user =
                message.mentions.users.first();

            if (!user) {

                return message.reply(
                    "❌ `.kadroçıkar @oyuncu`"
                );
            }

            const player =
                getPlayer(user.id);

            if (player.team !== td.team) {

                return message.reply(
                    "❌ Oyuncu senin takımında değil."
                );
            }

            player.team = null;

            db.teams[td.team].members =
                db.teams[td.team].members
                    .filter(id => id !== user.id);

            save();

            return message.reply(
                `✅ ${user} kadrodan çıkarıldı.`
            );
        }

        // =================================================
        // POZİSYON
        // =================================================

        if (command === "pozisyon") {

            if (!isTechnicalDirector(
                message.member
            )) {

                return message.reply(
                    "❌ Teknik Direktör veya Yönetici olmalısın."
                );
            }

            const user =
                message.mentions.users.first();

            const position =
                args[1]?.toUpperCase();

            const allowed =
                ["GK", "DEF", "MID", "ATT"];

            if (
                !user ||
                !allowed.includes(position)
            ) {

                return message.reply(
                    "❌ Kullanım:\n" +
                    "`.pozisyon @oyuncu GK`\n\n" +
                    "GK / DEF / MID / ATT"
                );
            }

            const player =
                getPlayer(user.id);

            player.position = position;

            save();

            return message.reply(
                `✅ ${user} pozisyonu **${position}** oldu.`
            );
        }

        // =================================================
        // TRANSFER
        // =================================================

        if (command === "transfer") {

            if (!isTechnicalDirector(
                message.member
            )) {

                return message.reply(
                    "❌ Teknik Direktör veya Yönetici olmalısın."
                );
            }

            const user =
                message.mentions.users.first();

            const teamName =
                args.slice(1).join(" ");

            if (!user || !teamName) {

                return message.reply(
                    "❌ `.transfer @oyuncu Takım Adı`"
                );
            }

            if (!db.teams[teamName]) {

                return message.reply(
                    "❌ Takım bulunamadı."
                );
            }

            const player =
                getPlayer(user.id);

            if (player.team) {

                const old =
                    db.teams[player.team];

                if (old) {

                    old.members =
                        old.members.filter(
                            id => id !== user.id
                        );
                }
            }

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
                `🔄 ${user} → **${teamName}** takımına transfer edildi.`
            );
        }

        // =================================================
        // MAÇ
        // .maç Takım1 | Takım2
        // 5 DAKİKA GERÇEK ZAMAN
        // =================================================

        if (
            command === "maç" ||
            command === "mac"
        ) {

            if (!adminOrRole(
                message.member,
                MAC_YETKILI
            )) {

                return message.reply(
                    "❌ Maç Yetkilisi veya Yönetici olmalısın."
                );
            }

            const input =
                args.join(" ");

            const split =
                input.split("|");

            if (split.length !== 2) {

                return message.reply(
                    "❌ Kullanım:\n" +
                    "`.maç Takım1 | Takım2`"
                );
            }

            const team1 =
                split[0].trim();

            const team2 =
                split[1].trim();

            if (
                !db.teams[team1] ||
                !db.teams[team2]
            ) {

                return message.reply(
                    "❌ Takımlardan biri bulunamadı."
                );
            }

            if (team1 === team2) {

                return message.reply(
                    "❌ Aynı takım kendisiyle oynayamaz."
                );
            }

            if (
                team1.length === 0 ||
                team2.length === 0
            ) return;

            const matchId =
                Date.now().toString();

            const match = {

                id: matchId,

                channelId:
                    message.channel.id,

                team1,
                team2,

                score1: 0,
                score2: 0,

                start:
                    Date.now(),

                end:
                    Date.now() + 300000,

                events: [],

                active: true
            };

            db.matches[matchId] = match;

            save();

            await message.channel.send(
                `🏟️ **MAÇ BAŞLADI!**\n\n` +
                `🔵 **${team1}** 0 - 0 **${team2}** 🔴\n\n` +
                `⏱️ Maç süresi: **5 dakika**\n` +
                `📋 Maç rastgele olaylarla devam edecek.`
            );

            // Rastgele olaylar
            const interval =
                setInterval(async () => {

                    if (!match.active) {
                        clearInterval(interval);
                        return;
                    }

                    const elapsed =
                        Date.now() - match.start;

                    if (elapsed >= 300000) {

                        clearInterval(interval);

                        await finishMatch(
                            message.channel,
                            match
                        );

                        return;
                    }

                    await generateMatchEvent(
                        message.channel,
                        match
                    );

                }, random(15000, 30000));

            match.interval = interval;

            return;
        }

        // =================================================
        // MAÇ DURUM
        // =================================================

        if (
            command === "maçdurum" ||
            command === "skor"
        ) {

            const active =
                Object.values(db.matches)
                    .find(
                        m =>
                            m.active &&
                            m.channelId ===
                            message.channel.id
                    );

            if (!active) {

                return message.reply(
                    "❌ Bu kanalda aktif maç yok."
                );
            }

            const elapsed =
                Math.floor(
                    (Date.now() - active.start)
                    / 1000
                );

            const minute =
                Math.min(
                    90,
                    Math.floor(
                        elapsed / 300 * 90
                    )
                );

            return message.reply(
                `🏟️ **MAÇ DURUMU**\n\n` +
                `🔵 ${active.team1} **${active.score1}** - ` +
                `**${active.score2}** ${active.team2} 🔴\n\n` +
                `⏱️ ${minute}'`
            );
        }

        // =================================================
        // MAÇ İPTAL
        // =================================================

        if (command === "maçiptal") {

            if (!adminOrRole(
                message.member,
                MAC_YETKILI
            )) {

                return message.reply(
                    "❌ Maç Yetkilisi veya Yönetici."
                );
            }

            const active =
                Object.values(db.matches)
                    .find(
                        m =>
                            m.active &&
                            m.channelId ===
                            message.channel.id
                    );

            if (!active) {

                return message.reply(
                    "❌ Aktif maç yok."
                );
            }

            active.active = false;

            save();

            return message.reply(
                "🛑 **Maç iptal edildi.**"
            );
        }

        // =================================================
        // ÇEKİLİŞ
        // .çekiliş 5M€ 5sa
        // =================================================

        if (
            command === "çekiliş" ||
            command === "cekilis"
        ) {

            if (!adminOrRole(
                message.member,
                CEKILIS_YETKILI
            )) {

                return message.reply(
                    "❌ Çekiliş Yetkilisi veya Yönetici."
                );
            }

            const prize =
                args[0];

            const durationText =
                args[1];

            const duration =
                parseDuration(durationText);

            if (!prize || !duration) {

                return message.reply(
                    "❌ Kullanım:\n" +
                    "`.çekiliş 5M€ 5sa`\n\n" +
                    "**Süreler:**\n" +
                    "`30s` = 30 saniye\n" +
                    "`5dk` = 5 dakika\n" +
                    "`5sa` = 5 saat"
                );
            }

            if (
                duration < 1000
            ) {

                return message.reply(
                    "❌ Süre en az 1 saniye olmalı."
                );
            }

            const embed =
                new EmbedBuilder()
                    .setTitle("🎉 ÇEKİLİŞ")
                    .setDescription(
                        `🎁 **Ödül:** ${prize}\n\n` +
                        `🎉 Katılmak için aşağıdaki butona bas!\n\n` +
                        `⏱️ Süre: **${durationText}**`
                    )
                    .setColor("Gold");

            const row =
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(
                                `giveaway_${Date.now()}`
                            )
                            .setLabel("Çekilişe Katıl")
                            .setEmoji("🎉")
                            .setStyle(
                                ButtonStyle.Success
                            )
                    );

            const giveaway =
                await message.channel.send({
                    embeds: [embed],
                    components: [row]
                });

            const participants =
                new Set();

            const collector =
                giveaway.createMessageComponentCollector({
                    time: duration
                });

            collector.on(
                "collect",
                async interaction => {

                    if (
                        participants.has(
                            interaction.user.id
                        )
                    ) {

                        return interaction.reply({
                            content:
                                "❌ Zaten çekilişe katıldın.",
                            ephemeral: true
                        });
                    }

                    participants.add(
                        interaction.user.id
                    );

                    await interaction.reply({
                        content:
                            "🎉 Çekilişe katıldın!",
                        ephemeral: true
                    });
                }
            );

            collector.on(
                "end",
                async () => {

                    if (!participants.size) {

                        return message.channel.send(
                            "❌ Çekilişe katılan olmadı."
                        );
                    }

                    const users =
                        [...participants];

                    const winnerId =
                        randomItem(users);

                    const winner =
                        await message.guild.members
                            .fetch(winnerId)
                            .catch(() => null);

                    await message.channel.send(
                        `🎉 **ÇEKİLİŞ BİTTİ!**\n\n` +
                        `🎁 Ödül: **${prize}**\n` +
                        `🏆 Kazanan: ${winner || `<@${winnerId}>`}`
                    );
                }
            );

            return;
        }

        // =================================================
        // KICK
        // =================================================

        if (command === "kick") {

            if (!isAdmin(message.member)) {

                return message.reply(
                    "❌ Sadece Yönetici."
                );
            }

            const member =
                message.mentions.members.first();

            if (!member) {

                return message.reply(
                    "❌ `.kick @oyuncu sebep`"
                );
            }

            const reason =
                args.slice(1).join(" ") ||
                "Sebep belirtilmedi.";

            if (!member.kickable) {

                return message.reply(
                    "❌ Bu kullanıcıyı kickleyemiyorum."
                );
            }

            await member.kick(reason);

            return message.reply(
                `👢 **${member.user.tag}** kicklendi.\n` +
                `📋 ${reason}`
            );
        }

        // =================================================
        // BAN
        // =================================================

        if (command === "ban") {

            if (!isAdmin(message.member)) {

                return message.reply(
                    "❌ Sadece Yönetici."
                );
            }

            const member =
                message.mentions.members.first();

            if (!member) {

                return message.reply(
                    "❌ `.ban @oyuncu sebep`"
                );
            }

            const reason =
                args.slice(1).join(" ") ||
                "Sebep belirtilmedi.";

            if (!member.bannable) {

                return message.reply(
                    "❌ Bu kullanıcıyı banlayamıyorum."
                );
            }

            await member.ban({
                reason
            });

            return message.reply(
                `🔨 **${member.user.tag}** banlandı.\n` +
                `📋 ${reason}`
            );
        }

        // =================================================
        // MUTE
        // =================================================

        if (command === "mute") {

            if (!isAdmin(message.member)) {

                return message.reply(
                    "❌ Sadece Yönetici."
                );
            }

            const member =
                message.mentions.members.first();

            const duration =
                parseDuration(args[1]);

            if (!member || !duration) {

                return message.reply(
                    "❌ `.mute @oyuncu 10dk sebep`"
                );
            }

            if (
                duration >
                28 * 24 * 60 * 60 * 1000
            ) {

                return message.reply(
                    "❌ Mute en fazla 28 gün."
                );
            }

            const reason =
                args.slice(2).join(" ") ||
                "Sebep belirtilmedi.";

            await member.timeout(
                duration,
                reason
            );

            return message.reply(
                `🔇 **${member.user.tag}** susturuldu.\n` +
                `⏱️ ${args[1]}\n` +
                `📋 ${reason}`
            );
        }

        // =================================================
        // UNMUTE
        // =================================================

        if (
            command === "unmute" ||
            command === "un-timeout"
        ) {

            if (!isAdmin(message.member)) {

                return message.reply(
                    "❌ Sadece Yönetici."
                );
            }

            const member =
                message.mentions.members.first();

            if (!member) {

                return message.reply(
                    "❌ `.unmute @oyuncu`"
                );
            }

            await member.timeout(
                null,
                "Mute kaldırıldı."
            );

            return message.reply(
                `🔊 ${member} mutesi kaldırıldı.`
            );
        }

        // =================================================
        // KANAL KİLİT
        // =================================================

        if (command === "kilit") {

            if (!isAdmin(message.member)) {

                return message.reply(
                    "❌ Sadece Yönetici."
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

        // =================================================
        // KANAL AÇ
        // =================================================

        if (
            command === "aç" ||
            command === "ac"
        ) {

            if (!isAdmin(message.member)) {

                return message.reply(
                    "❌ Sadece Yönetici."
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
                "🔓 **Kanal açıldı.**"
            );
        }

    } catch (error) {

        console.error(
            "KOMUT HATASI:",
            error
        );

        message.reply(
            "❌ Komut çalıştırılırken hata oluştu."
        ).catch(() => {});
    }
});

// =================================================
// MAÇ OLAY MOTORU
// =================================================

async function generateMatchEvent(
    channel,
    match
) {

    if (!match.active) return;

    const elapsed =
        Date.now() - match.start;

    const minute =
        Math.min(
            90,
            Math.max(
                1,
                Math.floor(
                    elapsed / 300000 * 90
                )
            )
        );

    const event =
        random(1, 100);

    const team =
        Math.random() < 0.5
            ? 1
            : 2;

    const teamName =
        team === 1
            ? match.team1
            : match.team2;

    const players =
        getTeamPlayers(teamName);

    const player =
        randomItem(players);

    // -------------------------------
    // GOL
    // -------------------------------

    if (event <= 18 && player) {

        if (team === 1)
            match.score1++;
        else
            match.score2++;

        player.player.goals++;

        player.player.value += 200000;

        const assists =
            players.filter(
                x => x.id !== player.id
            );

        const assist =
            randomItem(assists);

        if (assist) {

            assist.player.assists++;
        }

        match.events.push({
            minute,
            type: "goal",
            team: teamName,
            player: player.id
        });

        save();

        await channel.send(
            `⚽ **GOOOOL! ${minute}'**\n\n` +
            `🔵 **${match.team1}** ` +
            `**${match.score1}** - ` +
            `**${match.score2}** ` +
            `**${match.team2}** 🔴\n\n` +
            `👤 Gol: **${player.player.registeredName || "Oyuncu"}**` +
            (assist
                ? `\n🅰️ Asist: **${assist.player.registeredName || "Oyuncu"}**`
                : "")
        );

        return;
    }

    // -------------------------------
    // SARI KART
    // -------------------------------

    if (event <= 34 && player) {

        player.player.yellow++;

        save();

        await channel.send(
            `🟨 **SARI KART — ${minute}'**\n\n` +
            `👤 **${player.player.registeredName || "Oyuncu"}**\n` +
            `🏟️ ${teamName}`
        );

        return;
    }

    // -------------------------------
    // KIRMIZI
    // -------------------------------

    if (event <= 37 && player) {

        player.player.red++;

        save();

        await channel.send(
            `🟥 **KIRMIZI KART — ${minute}'**\n\n` +
            `👤 **${player.player.registeredName || "Oyuncu"}**\n` +
            `🏟️ ${teamName}`
        );

        return;
    }

    // -------------------------------
    // KALECİ KURTARIŞI
    // -------------------------------

    if (event <= 52) {

        await channel.send(
            `🧤 **${minute}' KURTARIŞ!**\n\n` +
            `Kaleci müthiş bir kurtarış yaptı!`
        );

        return;
    }

    // -------------------------------
    // DİREK
    // -------------------------------

    if (event <= 60) {

        await channel.send(
            `🥅 **${minute}' DİREK!**\n\n` +
            `Top direkten döndü!`
        );

        return;
    }

    // -------------------------------
    // OFSAYT
    // -------------------------------

    if (event <= 70 && player) {

        await channel.send(
            `🚩 **OFSAYT — ${minute}'**\n\n` +
            `👤 ${player.player.registeredName || "Oyuncu"}`
        );

        return;
    }

    // -------------------------------
    // KORNER
    // -------------------------------

    if (event <= 80) {

        await channel.send(
            `🏳️ **KORNER — ${minute}'**\n\n` +
            `⚽ ${teamName}`
        );

        return;
    }

    // -------------------------------
    // POZİSYON
    // -------------------------------

    await channel.send(
        `🔥 **${minute}' TEHLİKELİ ATAK!**\n\n` +
        `⚽ ${teamName} gole çok yaklaştı!`
    );
}

// =================================================
// MAÇ BİTİR
// =================================================

async function finishMatch(
    channel,
    match
) {

    if (!match.active) return;

    match.active = false;

    const team1 =
        db.teams[match.team1];

    const team2 =
        db.teams[match.team2];

    if (
        match.score1 >
        match.score2
    ) {

        team1.wins++;
        team2.losses++;

    } else if (
        match.score2 >
        match.score1
    ) {

        team2.wins++;
        team1.losses++;

    } else {

        team1.draws++;
        team2.draws++;
    }

    // Maç başına takım ödülü
    team1.budget += 500000;
    team2.budget += 250000;

    save();

    let result;

    if (match.score1 > match.score2)
        result = `🏆 **${match.team1} KAZANDI!**`;

    else if (match.score2 > match.score1)
        result = `🏆 **${match.team2} KAZANDI!**`;

    else
        result = "🤝 **MAÇ BERABERE!**";

    const embed =
        new EmbedBuilder()
            .setTitle("🏁 MAÇ SONA ERDİ")
            .setDescription(
                `🔵 **${match.team1}** ` +
                `**${match.score1}** - ` +
                `**${match.score2}** ` +
                `**${match.team2}** 🔴\n\n` +
                `${result}\n\n` +
                `💰 ${match.team1}: **+500K€**\n` +
                `💰 ${match.team2}: **+250K€**`
            )
            .addFields(
                {
                    name: "📊 İSTATİSTİK",
                    value:
                        `⚽ Goller: ${match.events.filter(e => e.type === "goal").length}\n` +
                        `🟨 Sarı kart olayları: ${match.events.filter(e => e.type === "yellow").length}\n` +
                        `⏱️ Süre: 5 dakika`
                }
            )
            .setColor("Green");

    await channel.send({
        embeds: [embed]
    });
}

// =================================================
// HATALAR
// =================================================

client.on("error", error => {
    console.error(
        "Discord Client Hatası:",
        error
    );
});

process.on(
    "unhandledRejection",
    error => {
        console.error(
            "Unhandled Rejection:",
            error
        );
    }
);

// =================================================
// TOKEN
// =================================================

const TOKEN =
    process.env.TOKEN;

if (!TOKEN) {

    console.error(
        "❌ TOKEN environment variable bulunamadı!"
    );

    process.exit(1);
}

client.login(TOKEN);
