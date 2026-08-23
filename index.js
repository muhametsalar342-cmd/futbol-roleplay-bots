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

// ===============================
// ROL IDLERİ
// ===============================

const DEGER_YETKILI = "1540002147243139133";
const MAC_YETKILI = "1539997232642654248";
const KAYIT_YETKILI = "1540005508768079912";
const CEKILIS_YETKILI = "1539997232642654248";

const TEKNIK_DIREKTOR_YETKILI = "1539997232642654248";

const TEKNIK_DIREKTOR_ROL = "1539994147245527111";
const FUTBOLCU_ROL = "1539994254917767349";

// ===============================
// CLIENT
// ===============================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ===============================
// DATABASE
// ===============================

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

// Maç timerları RAM'de tutulur.
// Database'e yazılmaz.
const matchTimers = new Map();

// ===============================
// OYUNCU
// ===============================

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

// ===============================
// PARA
// ===============================

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

    const number = Number(text);

    if (!Number.isFinite(number) || number <= 0)
        return null;

    return Math.floor(number * multiplier);
}

// ===============================
// RASTGELE
// ===============================

function random(min, max) {
    return Math.floor(
        Math.random() * (max - min + 1)
    ) + min;
}

function randomItem(array) {
    if (!array || !array.length)
        return null;

    return array[
        random(0, array.length - 1)
    ];
}

// ===============================
// YETKİ
// ===============================

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

// ===============================
// KAYIT BUTONLARI
// ===============================

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

// ===============================
// SÜRE
// ===============================

function parseDuration(text) {

    if (!text) return null;

    const match = text
        .toLowerCase()
        .match(/^(\d+)(s|sn|dk|d|sa|h)$/);

    if (!match)
        return null;

    const amount = Number(match[1]);

    if (match[2] === "s" || match[2] === "sn")
        return amount * 1000;

    if (match[2] === "dk" || match[2] === "d")
        return amount * 60000;

    if (match[2] === "sa" || match[2] === "h")
        return amount * 3600000;

    return null;
}

// ===============================
// BOT HAZIR
// ===============================

client.once("ready", () => {

    console.log("================================");
    console.log(`BOT AKTİF: ${client.user.tag}`);
    console.log("================================");

    client.user.setActivity(
        "Legendary League"
    );
});

// ===============================
// BUTONLU KAYIT
// ===============================

client.on("interactionCreate", async interaction => {

    if (!interaction.isButton())
        return;

    if (!interaction.customId.startsWith("kayit_"))
        return;

    try {

        if (!adminOrRole(
            interaction.member,
            KAYIT_YETKILI
        )) {

            return interaction.reply({
                content:
                    "❌ Kayıt Yetkilisi veya Yönetici olmalısın.",
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
                content:
                    "❌ Oyuncu bulunamadı.",
                ephemeral: true
            });
        }

        let role;
        let typeName;

        if (type === "td") {

            role =
                interaction.guild.roles.cache.get(
                    TEKNIK_DIREKTOR_ROL
                );

            typeName = "Teknik Direktör";
        }

        else if (type === "futbolcu") {

            role =
                interaction.guild.roles.cache.get(
                    FUTBOLCU_ROL
                );

            typeName = "Futbolcu";
        }

        else {

            role =
                interaction.guild.roles.cache.find(
                    r =>
                        r.name.toLowerCase() ===
                        "üye"
                );

            if (!role) {

                role =
                    await interaction.guild.roles.create({
                        name: "Üye",
                        reason:
                            "Kayıt sistemi"
                    });
            }

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
                `${member} için oyuncu adını bu kanala yaz.\n\n` +
                `Örnek: \`W. Sneijder\`\n` +
                `⏱️ 60 saniyen var.`,
            ephemeral: true
        });

        const collector =
            interaction.channel
                .createMessageCollector({
                    filter: msg =>
                        msg.author.id ===
                        interaction.user.id,
                    max: 1,
                    time: 60000
                });

        collector.on(
            "collect",
            async msg => {

                const name =
                    msg.content.trim();

                if (!name)
                    return;

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
                    `💰 Değer: **${formatMoney(player.value)}**`
                );
            }
        );

    } catch (error) {

        console.error(
            "Kayıt hatası:",
            error
        );
    }
});

// ===============================
// MESAJ KOMUTLARI
// ===============================

client.on("messageCreate", async message => {

    try {

        if (message.author.bot)
            return;

        if (!message.guild)
            return;

        if (!message.content.startsWith(PREFIX))
            return;

        const args =
            message.content
                .slice(PREFIX.length)
                .trim()
                .split(/\s+/);

        const command =
            args.shift().toLowerCase();

        // =========================
        // YARDIM
        // =========================

        if (
            command === "yardım" ||
            command === "yardim" ||
            command === "help"
        ) {

            return message.reply(
                "⚽ **LEGENDARY LEAGUE KOMUTLARI**\n\n" +

                "📝 `.k @oyuncu`\n\n" +

                "💰 `.dver @oyuncu 5M`\n\n" +

                "💵 `.bütçe`\n" +
                "💵 `.bütçe @oyuncu`\n" +
                "💵 `.bütçeekle @oyuncu 5M`\n" +
                "💸 `.gönder @oyuncu 5M`\n" +
                "🗑️ `.parasil @oyuncu 5M`\n\n" +

                "🏋️ `.ant`\n" +
                "⚽ `.pen`\n\n" +

                "🏟️ `.maç @takım1 @takım2`\n" +
                "📊 `.maçdurum`\n" +
                "🛑 `.maçiptal`\n" +
                "📊 `.skor`\n\n" +

                "👥 `.kadro`\n" +
                "➕ `.kadroekle @oyuncu`\n" +
                "➖ `.kadroçıkar @oyuncu`\n" +
                "📋 `.pozisyon @oyuncu GK`\n\n" +

                "🔄 `.transfer @oyuncu Takım Adı`\n" +
                "🏟️ `.takımoluştur Takım Adı`\n\n" +

                "🎉 `.çekiliş 5M€ 5sa`\n\n" +

                "🛡️ `.kick @oyuncu sebep`\n" +
                "🔨 `.ban @oyuncu sebep`\n" +
                "🔇 `.mute @oyuncu 10dk sebep`\n" +
                "🔊 `.unmute @oyuncu`\n" +
                "🔒 `.kilit`\n" +
                "🔓 `.aç`"
            );
        }

        // =========================
        // KAYIT
        // =========================

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
                    "❌ Kullanım: `.k @oyuncu`"
                );
            }

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(
                            "📝 OYUNCU KAYIT"
                        )
                        .setDescription(
                            `${user} için kayıt türünü seç.`
                        )
                        .setColor("Blue")
                ],
                components: [
                    registrationButtons(
                        user.id
                    )
                ]
            });
        }

        // =========================
        // DEĞER
        // =========================

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

        // =========================
        // BÜTÇE
        // =========================

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
                `💰 **BÜTÇE**\n\n` +
                `👤 ${user}\n` +
                `💵 **${formatMoney(player.budget)}**`
            );
        }

        // =========================
        // BÜTÇE EKLE
        // =========================

        if (
            command === "bütçeekle" ||
            command === "butceekle"
        ) {

            if (!isAdmin(message.member))
                return message.reply(
                    "❌ Sadece Yönetici."
                );

            const user =
                message.mentions.users.first();

            const amount =
                parseMoney(args[1]);

            if (!user || !amount)
                return message.reply(
                    "❌ `.bütçeekle @oyuncu 5M`"
                );

            const player =
                getPlayer(user.id);

            player.budget += amount;

            save();

            return message.reply(
                `💵 ${user} bütçesine ` +
                `**+${formatMoney(amount)}** eklendi.\n` +
                `Yeni bütçe: **${formatMoney(player.budget)}**`
            );
        }

        // =========================
        // PARA GÖNDER
        // =========================

        if (
            command === "gönder" ||
            command === "gonder"
        ) {

            const receiver =
                message.mentions.users.first();

            const amount =
                parseMoney(args[1]);

            if (!receiver || !amount)
                return message.reply(
                    "❌ `.gönder @oyuncu 5M`"
                );

            if (
                receiver.id ===
                message.author.id
            ) {

                return message.reply(
                    "❌ Kendine para gönderemezsin."
                );
            }

            const sender =
                getPlayer(
                    message.author.id
                );

            const target =
                getPlayer(
                    receiver.id
                );

            if (sender.budget < amount) {

                return message.reply(
                    `❌ Yeterli paran yok.\n` +
                    `Bütçen: **${formatMoney(sender.budget)}**`
                );
            }

            sender.budget -= amount;
            target.budget += amount;

            save();

            return message.reply(
                `💸 **PARA GÖNDERİLDİ**\n\n` +
                `👤 Gönderen: ${message.author}\n` +
                `👤 Alan: ${receiver}\n` +
                `💰 Miktar: **${formatMoney(amount)}**`
            );
        }

        // =========================
        // PARA SİL
        // =========================

        if (
            command === "parasil" ||
            command === "para-sil"
        ) {

            if (!isAdmin(message.member))
                return message.reply(
                    "❌ Sadece Yönetici."
                );

            const user =
                message.mentions.users.first();

            const amount =
                parseMoney(args[1]);

            if (!user || !amount)
                return message.reply(
                    "❌ `.parasil @oyuncu 5M`"
                );

            const player =
                getPlayer(user.id);

            const deleted =
                Math.min(
                    player.budget,
                    amount
                );

            player.budget -= deleted;

            save();

            return message.reply(
                `🗑️ ${user} bütçesinden ` +
                `**${formatMoney(deleted)}** silindi.\n` +
                `💰 Kalan: **${formatMoney(player.budget)}**`
            );
        }

        // =========================
        // ANTRENMAN
        // =========================

        if (
            command === "ant" ||
            command === "antrenman"
        ) {

            const player =
                getPlayer(
                    message.author.id
                );

            player.training++;

            let text =
                `🏋️ **ANTRENMAN**\n\n` +
                `📊 ${player.training}/10`;

            if (player.training >= 10) {

                player.training = 0;
                player.value += 200000;

                text +=
                    `\n\n🎉 **10/10 TAMAMLANDI!**\n` +
                    `💰 Değer +200K€\n` +
                    `🔄 Yeni antrenman: 0/10`;
            }

            save();

            return message.reply(text);
        }

        // =========================
        // PENALTI
        // =========================

        if (
            command === "pen" ||
            command === "penaltı" ||
            command === "penalti"
        ) {

            const player =
                getPlayer(
                    message.author.id
                );

            if (Math.random() < 0.6) {

                player.value += 100000;

                save();

                return message.reply(
                    "⚽ **GOOOL!**\n" +
                    "💰 Değer: **+100K€**"
                );
            }

            return message.reply(
                "❌ **PENALTI KAÇTI!**"
            );
        }

        // =========================
        // TAKIM OLUŞTUR
        // =========================

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

            const name =
                args.join(" ");

            if (!name)
                return message.reply(
                    "❌ `.takımoluştur Takım Adı`"
                );

            if (db.teams[name])
                return message.reply(
                    "❌ Bu takım zaten var."
                );

            // Takım için Discord rolü oluştur
            const role =
                await message.guild.roles.create({
                    name: name,
                    reason:
                        "Legendary League takım sistemi"
                });

            db.teams[name] = {
                name: name,
                roleId: role.id,
                owner: message.author.id,
                members: [],
                budget: 50000000,
                wins: 0,
                draws: 0,
                losses: 0
            };

            const player =
                getPlayer(
                    message.author.id
                );

            player.team = name;

            save();

            await message.member.roles.add(
                role
            );

            return message.reply(
                `🏟️ **${name}** oluşturuldu!\n\n` +
                `🏷️ Takım rolü: ${role}\n` +
                `👤 Teknik Direktör: ${message.author}\n` +
                `💰 Takım bütçesi: **50M€**\n\n` +
                `Artık maç:\n` +
                `\`.maç ${role} @başka-takım\` şeklinde başlatılabilir.`
            );
        }

        // =========================
        // KADRO
        // =========================

        if (command === "kadro") {

            let teamName;

            const mentionedRole =
                message.mentions.roles.first();

            if (mentionedRole) {

                const found =
                    Object.entries(db.teams)
                        .find(
                            ([, t]) =>
                                t.roleId ===
                                mentionedRole.id
                        );

                if (found)
                    teamName = found[0];
            }

            if (!teamName) {

                const player =
                    getPlayer(
                        message.author.id
                    );

                teamName =
                    player.team;
            }

            if (!teamName ||
                !db.teams[teamName]) {

                return message.reply(
                    "❌ Bir takım seçilmemiş."
                );
            }

            const team =
                db.teams[teamName];

            let list =
                team.members.length
                    ? team.members
                        .map(id => {

                            const p =
                                getPlayer(id);

                            return (
                                `• ${p.registeredName || "İsimsiz"} ` +
                                `— ${p.position} <@${id}>`
                            );
                        })
                        .join("\n")
                    : "Kadro boş.";

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(
                            `👥 ${teamName} KADROSU`
                        )
                        .setDescription(list)
                        .addFields({
                            name:
                                "💰 Takım Bütçesi",
                            value:
                                formatMoney(
                                    team.budget
                                )
                        })
                        .setColor("Blue")
                ]
            });
        }

        // =========================
        // KADRO EKLE
        // =========================

        if (command === "kadroekle") {

            if (!isTechnicalDirector(
                message.member
            ))
                return message.reply(
                    "❌ Teknik Direktör veya Yönetici."
                );

            const td =
                getPlayer(
                    message.author.id
                );

            if (!td.team)
                return message.reply(
                    "❌ Bir takımın yok."
                );

            const user =
                message.mentions.users.first();

            if (!user)
                return message.reply(
                    "❌ `.kadroekle @oyuncu`"
                );

            const player =
                getPlayer(user.id);

            if (player.team)
                return message.reply(
                    `❌ Oyuncu zaten **${player.team}** takımında.`
                );

            player.team = td.team;

            db.teams[td.team]
                .members
                .push(user.id);

            save();

            return message.reply(
                `✅ ${user}, **${td.team}** kadrosuna eklendi.`
            );
        }

        // =========================
        // KADRO ÇIKAR
        // =========================

        if (
            command === "kadroçıkar" ||
            command === "kadroci̇kar" ||
            command === "kadro-cikar"
        ) {

            if (!isTechnicalDirector(
                message.member
            ))
                return message.reply(
                    "❌ Teknik Direktör veya Yönetici."
                );

            const td =
                getPlayer(
                    message.author.id
                );

            const user =
                message.mentions.users.first();

            if (!td.team || !user)
                return message.reply(
                    "❌ `.kadroçıkar @oyuncu`"
                );

            const player =
                getPlayer(user.id);

            if (player.team !== td.team)
                return message.reply(
                    "❌ Oyuncu senin takımında değil."
                );

            player.team = null;

            db.teams[td.team].members =
                db.teams[td.team]
                    .members
                    .filter(
                        id => id !== user.id
                    );

            save();

            return message.reply(
                `✅ ${user} kadrodan çıkarıldı.`
            );
        }

        // =========================
        // POZİSYON
        // =========================

        if (command === "pozisyon") {

            if (!isTechnicalDirector(
                message.member
            ))
                return message.reply(
                    "❌ Teknik Direktör veya Yönetici."
                );

            const user =
                message.mentions.users.first();

            const position =
                args[1]?.toUpperCase();

            if (
                !user ||
                ![
                    "GK",
                    "DEF",
                    "MID",
                    "ATT"
                ].includes(position)
            )
                return message.reply(
                    "❌ `.pozisyon @oyuncu GK`\n\n" +
                    "GK / DEF / MID / ATT"
                );

            const player =
                getPlayer(user.id);

            player.position = position;

            save();

            return message.reply(
                `✅ ${user} pozisyonu **${position}** oldu.`
            );
        }

        // =========================
        // TRANSFER
        // =========================

        if (command === "transfer") {

            if (!isTechnicalDirector(
                message.member
            ))
                return message.reply(
                    "❌ Teknik Direktör veya Yönetici."
                );

            const user =
                message.mentions.users.first();

            const teamName =
                args.slice(1).join(" ");

            if (!user || !teamName)
                return message.reply(
                    "❌ `.transfer @oyuncu Takım Adı`"
                );

            if (!db.teams[teamName])
                return message.reply(
                    "❌ Takım bulunamadı."
                );

            const player =
                getPlayer(user.id);

            if (player.team &&
                db.teams[player.team]) {

                db.teams[player.team]
                    .members =
                    db.teams[player.team]
                        .members
                        .filter(
                            id => id !== user.id
                        );
            }

            player.team = teamName;

            if (!db.teams[teamName]
                .members
                .includes(user.id)) {

                db.teams[teamName]
                    .members
                    .push(user.id);
            }

            save();

            return message.reply(
                `🔄 ${user} → **${teamName}**`
            );
        }

        // =====================================================
        // MAÇ - SADECE @TAKIM1 @TAKIM2
        // =====================================================

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

            // SADECE ROLE MENTION
            const roles =
                [...message.mentions.roles.values()];

            if (roles.length !== 2) {

                return message.reply(
                    "❌ **Sadece 2 takım etiketlemelisin.**\n\n" +
                    "Doğru kullanım:\n" +
                    "`.maç @Takım1 @Takım2`\n\n" +
                    "Takım isimlerini yazarak maç başlatılamaz."
                );
            }

            const team1Data =
                Object.entries(db.teams)
                    .find(
                        ([, team]) =>
                            team.roleId ===
                            roles[0].id
                    );

            const team2Data =
                Object.entries(db.teams)
                    .find(
                        ([, team]) =>
                            team.roleId ===
                            roles[1].id
                    );

            if (!team1Data ||
                !team2Data) {

                return message.reply(
                    "❌ Etiketlediğin rollerden biri kayıtlı takım değil."
                );
            }

            const team1 =
                team1Data[0];

            const team2 =
                team2Data[0];

            if (team1 === team2) {

                return message.reply(
                    "❌ Aynı takım kendisiyle oynayamaz."
                );
            }

            // Aynı kanalda aktif maç var mı?
            const active =
                Object.values(db.matches)
                    .find(
                        m =>
                            m.active &&
                            m.channelId ===
                            message.channel.id
                    );

            if (active) {

                return message.reply(
                    "❌ Bu kanalda zaten devam eden bir maç var."
                );
            }

            const matchId =
                Date.now().toString();

            const match = {

                id: matchId,

                channelId:
                    message.channel.id,

                team1,
                team2,

                role1:
                    roles[0].id,

                role2:
                    roles[1].id,

                score1: 0,
                score2: 0,

                start:
                    Date.now(),

                end:
                    Date.now() + 300000,

                active: true,

                events: []
            };

            db.matches[matchId] = match;

            save();

            // İlk mesaj
            await message.channel.send(
                `🏟️ **LEGENDARY LEAGUE — MAÇ BAŞLADI!**\n\n` +
                `🔵 ${roles[0]} **0 - 0** ${roles[1]} 🔴\n\n` +
                `⏱️ **Maç süresi: 5 dakika**\n` +
                `⚽ Maç olayları otomatik gerçekleşecek.\n\n` +
                `📊 \`.maçdurum\` ile skoru görebilirsin.`
            );

            // Her 12-28 saniyede bir farklı olay
            scheduleMatchEvent(
                message.channel,
                matchId
            );

            return;
        }

        // =========================
        // MAÇ DURUM
        // =========================

        if (
            command === "maçdurum" ||
            command === "skor"
        ) {

            const match =
                Object.values(db.matches)
                    .find(
                        m =>
                            m.active &&
                            m.channelId ===
                            message.channel.id
                    );

            if (!match)
                return message.reply(
                    "❌ Bu kanalda aktif maç yok."
                );

            const elapsed =
                Date.now() - match.start;

            const minute =
                Math.min(
                    90,
                    Math.floor(
                        elapsed /
                        300000 *
                        90
                    )
                );

            const role1 =
                message.guild.roles.cache
                    .get(match.role1);

            const role2 =
                message.guild.roles.cache
                    .get(match.role2);

            return message.reply(
                `🏟️ **MAÇ DURUMU**\n\n` +
                `🔵 ${role1 || match.team1} ` +
                `**${match.score1} - ${match.score2}** ` +
                `${role2 || match.team2} 🔴\n\n` +
                `⏱️ **${minute}'**`
            );
        }

        // =========================
        // MAÇ İPTAL
        // =========================

        if (command === "maçiptal") {

            if (!adminOrRole(
                message.member,
                MAC_YETKILI
            ))
                return message.reply(
                    "❌ Maç Yetkilisi veya Yönetici."
                );

            const match =
                Object.values(db.matches)
                    .find(
                        m =>
                            m.active &&
                            m.channelId ===
                            message.channel.id
                    );

            if (!match)
                return message.reply(
                    "❌ Aktif maç yok."
                );

            match.active = false;

            const timer =
                matchTimers.get(match.id);

            if (timer)
                clearTimeout(timer);

            matchTimers.delete(match.id);

            save();

            return message.reply(
                "🛑 **Maç iptal edildi.**"
            );
        }

        // =========================
        // ÇEKİLİŞ
        // =========================

        if (
            command === "çekiliş" ||
            command === "cekilis"
        ) {

            if (!adminOrRole(
                message.member,
                CEKILIS_YETKILI
            ))
                return message.reply(
                    "❌ Çekiliş Yetkilisi veya Yönetici."
                );

            const prize =
                args[0];

            const durationText =
                args[1];

            const duration =
                parseDuration(durationText);

            if (!prize || !duration)
                return message.reply(
                    "❌ Örnek:\n" +
                    "`.çekiliş 5M€ 30s`\n" +
                    "`.çekiliş 5M€ 5dk`\n" +
                    "`.çekiliş 5M€ 5sa`"
                );

            const participants =
                new Set();

            const row =
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(
                                `giveaway_${Date.now()}`
                            )
                            .setLabel(
                                "Çekilişe Katıl"
                            )
                            .setEmoji("🎉")
                            .setStyle(
                                ButtonStyle.Success
                            )
                    );

            const giveaway =
                await message.channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(
                                "🎉 ÇEKİLİŞ"
                            )
                            .setDescription(
                                `🎁 Ödül: **${prize}**\n\n` +
                                `🎉 Katılmak için butona bas!\n` +
                                `⏱️ Süre: **${durationText}**`
                            )
                            .setColor("Gold")
                    ],
                    components: [row]
                });

            const collector =
                giveaway
                    .createMessageComponentCollector({
                        time: duration
                    });

            collector.on(
                "collect",
                async interaction => {

                    if (
                        participants.has(
                            interaction.user.id
                        )
                    )
                        return interaction.reply({
                            content:
                                "❌ Zaten katıldın.",
                            ephemeral: true
                        });

                    participants.add(
                        interaction.user.id
                    );

                    return interaction.reply({
                        content:
                            "🎉 Çekilişe katıldın!",
                        ephemeral: true
                    });
                }
            );

            collector.on(
                "end",
                async () => {

                    row.components[0]
                        .setDisabled(true);

                    await giveaway.edit({
                        components: [row]
                    }).catch(() => {});

                    if (!participants.size)
                        return message.channel.send(
                            "❌ Çekilişe kimse katılmadı."
                        );

                    const winnerId =
                        randomItem(
                            [...participants]
                        );

                    return message.channel.send(
                        `🎉 **ÇEKİLİŞ BİTTİ!**\n\n` +
                        `🎁 Ödül: **${prize}**\n` +
                        `🏆 Kazanan: <@${winnerId}>`
                    );
                }
            );

            return;
        }

        // =========================
        // KICK
        // =========================

        if (command === "kick") {

            if (!isAdmin(message.member))
                return message.reply(
                    "❌ Sadece Yönetici."
                );

            const member =
                message.mentions.members.first();

            if (!member)
                return message.reply(
                    "❌ `.kick @oyuncu sebep`"
                );

            const reason =
                args.slice(1).join(" ") ||
                "Sebep belirtilmedi.";

            if (!member.kickable)
                return message.reply(
                    "❌ Bu kullanıcıyı kickleyemiyorum."
                );

            await member.kick(reason);

            return message.reply(
                `👢 **${member.user.tag}** kicklendi.\n` +
                `📋 ${reason}`
            );
        }

        // =========================
        // BAN
        // =========================

        if (command === "ban") {

            if (!isAdmin(message.member))
                return message.reply(
                    "❌ Sadece Yönetici."
                );

            const member =
                message.mentions.members.first();

            if (!member)
                return message.reply(
                    "❌ `.ban @oyuncu sebep`"
                );

            const reason =
                args.slice(1).join(" ") ||
                "Sebep belirtilmedi.";

            if (!member.bannable)
                return message.reply(
                    "❌ Bu kullanıcıyı banlayamıyorum."
                );

            await member.ban({
                reason
            });

            return message.reply(
                `🔨 **${member.user.tag}** banlandı.\n` +
                `📋 ${reason}`
            );
        }

        // =========================
        // MUTE
        // =========================

        if (command === "mute") {

            if (!isAdmin(message.member))
                return message.reply(
                    "❌ Sadece Yönetici."
                );

            const member =
                message.mentions.members.first();

            const duration =
                parseDuration(args[1]);

            if (!member || !duration)
                return message.reply(
                    "❌ `.mute @oyuncu 10dk sebep`"
                );

            const reason =
                args.slice(2).join(" ") ||
                "Sebep belirtilmedi.";

            await member.timeout(
                duration,
                reason
            );

            return message.reply(
                `🔇 ${member} **${args[1]}** susturuldu.`
            );
        }

        // =========================
        // UNMUTE
        // =========================

        if (command === "unmute") {

            if (!isAdmin(message.member))
                return message.reply(
                    "❌ Sadece Yönetici."
                );

            const member =
                message.mentions.members.first();

            if (!member)
                return message.reply(
                    "❌ `.unmute @oyuncu`"
                );

            await member.timeout(
                null,
                "Mute kaldırıldı."
            );

            return message.reply(
                `🔊 ${member} mutesi kaldırıldı.`
            );
        }

        // =========================
        // KANAL KİLİT
        // =========================

        if (command === "kilit") {

            if (!isAdmin(message.member))
                return message.reply(
                    "❌ Sadece Yönetici."
                );

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

        // =========================
        // KANAL AÇ
        // =========================

        if (
            command === "aç" ||
            command === "ac"
        ) {

            if (!isAdmin(message.member))
                return message.reply(
                    "❌ Sadece Yönetici."
                );

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

        await message.reply(
            "❌ Komut çalışırken hata oluştu."
        ).catch(() => {});
    }
});

// =================================================
// MAÇ OLAY ZAMANLAYICISI
// =================================================

function scheduleMatchEvent(
    channel,
    matchId
) {

    const match =
        db.matches[matchId];

    if (!match || !match.active)
        return;

    const remaining =
        match.end - Date.now();

    if (remaining <= 0) {

        finishMatch(
            channel,
            matchId
        );

        return;
    }

    const delay =
        Math.min(
            remaining,
            random(12000, 28000)
        );

    const timer =
        setTimeout(
            async () => {

                matchTimers.delete(
                    matchId
                );

                const current =
                    db.matches[matchId];

                if (!current ||
                    !current.active)
                    return;

                if (
                    Date.now() >=
                    current.end
                ) {

                    await finishMatch(
                        channel,
                        matchId
                    );

                    return;
                }

                await generateMatchEvent(
                    channel,
                    current
                );

                save();

                scheduleMatchEvent(
                    channel,
                    matchId
                );
            },
            delay
        );

    matchTimers.set(
        matchId,
        timer
    );
}

// =================================================
// MAÇ OLAYLARI
// =================================================

async function generateMatchEvent(
    channel,
    match
) {

    const elapsed =
        Date.now() - match.start;

    const minute =
        Math.min(
            90,
            Math.max(
                1,
                Math.floor(
                    elapsed /
                    300000 *
                    90
                )
            )
        );

    const side =
        Math.random() < 0.5
            ? 1
            : 2;

    const teamName =
        side === 1
            ? match.team1
            : match.team2;

    const team =
        db.teams[teamName];

    const players =
        team.members
            .map(id => ({
                id,
                player:
                    getPlayer(id)
            }))
            .filter(
                x =>
                    x.player.registered
            );

    const player =
        randomItem(players);

    const event =
        random(1, 100);

    // GOL
    if (event <= 20 && player) {

        if (side === 1)
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

        if (assist)
            assist.player.assists++;

        match.events.push({
            minute,
            type: "goal",
            player: player.id
        });

        save();

        await channel.send(
            `⚽ **GOOOOL! ${minute}'**\n\n` +
            `🔵 **${match.team1}** ` +
            `**${match.score1} - ${match.score2}** ` +
            `**${match.team2}** 🔴\n\n` +
            `⚽ Gol: **${player.player.registeredName}**` +
            (
                assist
                    ? `\n🅰️ Asist: **${assist.player.registeredName}**`
                    : ""
            )
        );

        return;
    }

    // SARI
    if (event <= 35 && player) {

        player.player.yellow++;

        match.events.push({
            minute,
            type: "yellow",
            player: player.id
        });

        save();

        await channel.send(
            `🟨 **SARI KART — ${minute}'**\n\n` +
            `👤 **${player.player.registeredName}**\n` +
            `🏟️ ${teamName}`
        );

        return;
    }

    // KIRMIZI
    if (event <= 39 && player) {

        player.player.red++;

        match.events.push({
            minute,
            type: "red",
            player: player.id
        });

        save();

        await channel.send(
            `🟥 **KIRMIZI KART — ${minute}'**\n\n` +
            `👤 **${player.player.registeredName}**\n` +
            `🏟️ ${teamName}`
        );

        return;
    }

    // PENALTI
    if (event <= 45 && player) {

        const goal =
            Math.random() < 0.72;

        if (goal) {

            if (side === 1)
                match.score1++;
            else
                match.score2++;

            player.player.goals++;
            player.player.value += 200000;

            save();

            await channel.send(
                `⚽ **PENALTI GOL! ${minute}'**\n\n` +
                `👤 ${player.player.registeredName}\n` +
                `🔵 ${match.team1} **${match.score1} - ${match.score2}** ${match.team2} 🔴`
            );

        } else {

            await channel.send(
                `❌ **PENALTI KAÇTI! ${minute}'**\n\n` +
                `👤 ${player.player.registeredName}`
            );
        }

        return;
    }

    // KALECİ
    if (event <= 58) {

        await channel.send(
            `🧤 **${minute}' KURTARIŞ!**\n\n` +
            `Kaleci müthiş bir kurtarış yaptı.`
        );

        return;
    }

    // DİREK
    if (event <= 67) {

        await channel.send(
            `🥅 **${minute}' DİREK!**\n\n` +
            `Top direkten döndü!`
        );

        return;
    }

    // OFSAYT
    if (event <= 77 && player) {

        await channel.send(
            `🚩 **OFSAYT — ${minute}'**\n\n` +
            `👤 ${player.player.registeredName}`
        );

        return;
    }

    // KORNER
    if (event <= 87) {

        await channel.send(
            `🏳️ **KORNER — ${minute}'**\n\n` +
            `🏟️ ${teamName}`
        );

        return;
    }

    // TEHLİKELİ ATAK
    await channel.send(
        `🔥 **${minute}' TEHLİKELİ ATAK!**\n\n` +
        `⚡ ${teamName} gole çok yaklaştı!`
    );
}

// =================================================
// MAÇ BİTİR
// =================================================

async function finishMatch(
    channel,
    matchId
) {

    const match =
        db.matches[matchId];

    if (!match ||
        !match.active)
        return;

    match.active = false;

    const timer =
        matchTimers.get(matchId);

    if (timer)
        clearTimeout(timer);

    matchTimers.delete(matchId);

    const team1 =
        db.teams[match.team1];

    const team2 =
        db.teams[match.team2];

    if (match.score1 > match.score2) {

        team1.wins++;
        team2.losses++;

    } else if (
        match.score2 > match.score1
    ) {

        team2.wins++;
        team1.losses++;

    } else {

        team1.draws++;
        team2.draws++;
    }

    // Takım ödülü
    team1.budget += 500000;
    team2.budget += 250000;

    save();

    let result;

    if (match.score1 > match.score2)
        result =
            `🏆 **${match.team1} KAZANDI!**`;

    else if (match.score2 > match.score1)
        result =
            `🏆 **${match.team2} KAZANDI!**`;

    else
        result =
            "🤝 **MAÇ BERABERE!**";

    const goals =
        match.events
            .filter(
                e =>
                    e.type === "goal"
            ).length;

    const yellows =
        match.events
            .filter(
                e =>
                    e.type === "yellow"
            ).length;

    const reds =
        match.events
            .filter(
                e =>
                    e.type === "red"
            ).length;

    const role1 =
        channel.guild.roles.cache
            .get(match.role1);

    const role2 =
        channel.guild.roles.cache
            .get(match.role2);

    const embed =
        new EmbedBuilder()
            .setTitle(
                "🏁 MAÇ SONA ERDİ"
            )
            .setDescription(
                `🔵 ${role1 || match.team1} ` +
                `**${match.score1} - ${match.score2}** ` +
                `${role2 || match.team2} 🔴\n\n` +
                `${result}`
            )
            .addFields(
                {
                    name: "📊 Maç İstatistikleri",
                    value:
                        `⚽ Goller: **${goals}**\n` +
                        `🟨 Sarı kart: **${yellows}**\n` +
                        `🟥 Kırmızı kart: **${reds}**\n` +
                        `⏱️ Süre: **5 dakika**`
                },
                {
                    name: "💰 Maç Ödülleri",
                    value:
                        `${match.team1}: **+500K€**\n` +
                        `${match.team2}: **+250K€**`
                }
            )
            .setColor("Green");

    await channel.send({
        embeds: [embed]
    });

    // Database'de bitmiş maç olarak kalır,
    // tekrar aktif maç sayılmaz.
    save();
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
