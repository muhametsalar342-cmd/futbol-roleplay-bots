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

// ==========================================
// YETKİ ROLLERİ
// ==========================================

const DEGER_YETKILI = "1540002147243139133";
const MAC_YETKILI = "1539997232642654248";
const KAYIT_YETKILI = "1540005508768079912";
const CEKILIS_YETKILI = "1539997232642654248";
const TEKNIK_DIREKTOR_YETKILI = "1539997232642654248";

// ==========================================
// KAYIT ROLLERİ
// ==========================================

const TEKNIK_DIREKTOR_ROL = "1539994147245527111";
const FUTBOLCU_ROL = "1539994254917767349";

// Üye rolünün ID'si verilmedi.
// Bot "Üye" rolünü bulacak veya oluşturmayı deneyecek.

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

db.players ||= {};
db.teams ||= {};
db.matches ||= {};

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
            registeredName: null,
            type: null,
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
    }

    else if (text.endsWith("M")) {
        multiplier = 1000000;
        text = text.slice(0, -1);
    }

    else if (text.endsWith("B")) {
        multiplier = 1000000000;
        text = text.slice(0, -1);
    }

    const number = parseFloat(text);

    if (isNaN(number)) return null;

    return Math.floor(number * multiplier);
}

// ==========================================
// YETKİ
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
// ÜYE ROLÜ
// ==========================================

async function getUyeRole(guild) {

    let role = guild.roles.cache.find(
        r => r.name.toLowerCase() === "üye"
    );

    if (role) return role;

    try {

        role = await guild.roles.create({
            name: "Üye",
            reason: "Kayıt sistemi için otomatik oluşturuldu."
        });

        return role;

    } catch (error) {

        console.error(
            "Üye rolü oluşturulamadı:",
            error
        );

        return null;
    }
}

// ==========================================
// KAYIT BUTONLARI
// ==========================================

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

// ==========================================
// BOT HAZIR
// ==========================================

client.once("ready", () => {

    console.log("================================");
    console.log(`BOT AKTİF: ${client.user.tag}`);
    console.log("================================");

    client.user.setActivity("Legendary League");
});

// ==========================================
// BUTON SİSTEMİ
// ==========================================

client.on("interactionCreate", async interaction => {

    try {

        if (!interaction.isButton()) return;

        const customId =
            interaction.customId;

        if (!customId.startsWith("kayit_"))
            return;

        if (!isAdmin(interaction)) {

            return interaction.reply({
                content:
                    "❌ Bu butonu sadece **Yönetici** kullanabilir.",
                ephemeral: true
            });
        }

        const parts =
            customId.split("_");

        const type =
            parts[1];

        const targetId =
            parts[2];

        const member =
            await interaction.guild.members
                .fetch(targetId)
                .catch(() => null);

        if (!member) {

            return interaction.reply({
                content:
                    "❌ Kayıt yapılacak kullanıcı bulunamadı.",
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

        } else if (type === "futbolcu") {

            role =
                interaction.guild.roles.cache.get(
                    FUTBOLCU_ROL
                );

            typeName = "Futbolcu";

        } else if (type === "uye") {

            role =
                await getUyeRole(
                    interaction.guild
                );

            typeName = "Üye";
        }

        if (!role) {

            return interaction.reply({
                content:
                    "❌ Seçilen kayıt rolü bulunamadı. Rol ID'sini kontrol et.",
                ephemeral: true
            });
        }

        await interaction.reply({
            content:
                `📝 **${typeName}** seçildi.\n\n` +
                `⚽ ${member} için oyuncu adını **bu kanala** yazın.\n\n` +
                `Örnek: \`W. Sneijder\`\n\n` +
                `⏱️ 60 saniyeniz var.`,
            ephemeral: true
        });

        const filter = msg =>
            msg.author.id === interaction.user.id &&
            msg.channel.id === interaction.channel.id;

        const collector =
            interaction.channel.createMessageCollector({
                filter,
                max: 1,
                time: 60000
            });

        collector.on("collect", async msg => {

            const playerName =
                msg.content.trim();

            if (!playerName) {

                return msg.reply(
                    "❌ Geçerli bir oyuncu adı yazmalısınız."
                );
            }

            const player =
                getPlayer(targetId);

            player.registered = true;
            player.registeredName = playerName;
            player.type = typeName;

            await member.roles.add(
                role,
                "Kayıt sistemi"
            );

            save();

            await msg.reply(
                `✅ **KAYIT TAMAMLANDI**\n\n` +
                `👤 Discord: ${member}\n` +
                `📝 Oyuncu adı: **${playerName}**\n` +
                `🏷️ Tür: **${typeName}**\n` +
                `🎭 Rol: ${role}\n` +
                `💰 Değer: **${formatMoney(player.value)}**`
            );
        });

        collector.on("end", collected => {

            if (collected.size === 0) {

                interaction.channel.send(
                    `⏱️ ${member} için kayıt işleminin süresi doldu.`
                ).catch(() => {});
            }
        });

    } catch (error) {

        console.error(
            "Buton hatası:",
            error
        );

        if (!interaction.replied) {

            interaction.reply({
                content:
                    "❌ Kayıt sırasında bir hata oluştu.",
                ephemeral: true
            }).catch(() => {});
        }
    }
});

// ==========================================
// MESAJ KOMUTLARI
// ==========================================

client.on("messageCreate", async message => {

    try {

        if (message.author.bot) return;
        if (!message.guild) return;

        if (!message.content.startsWith(PREFIX))
            return;

        const args =
            message.content
                .slice(PREFIX.length)
                .trim()
                .split(/\s+/);

        const command =
            args.shift().toLowerCase();

        // ======================================
        // YARDIM
        // ======================================

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
                        "`.k @oyuncu` → Butonlardan tür seçilir.\n\n" +

                        "**⚽ FUTBOL**\n" +
                        "`.ant`\n" +
                        "`.antrenman`\n" +
                        "`.pen`\n" +
                        "`.penaltı`\n" +
                        "`.maç @oyuncu`\n\n" +

                        "**💰 DEĞER**\n" +
                        "`.dver @oyuncu 5M`\n\n" +

                        "**👥 TAKIM**\n" +
                        "`.takımoluştur Takım Adı`\n" +
                        "`.transfer @oyuncu Takım Adı`\n" +
                        "`.kadro`\n" +
                        "`.bütçe`\n\n" +

                        "**🛡️ MODERASYON**\n" +
                        "`.kick @oyuncu sebep`\n" +
                        "`.ban @oyuncu sebep`\n" +
                        "`.mute @oyuncu 10m sebep`\n" +
                        "`.unmute @oyuncu`\n" +
                        "`.kilit`\n" +
                        "`.aç`\n\n" +

                        "**🎉 ÇEKİLİŞ**\n" +
                        "`.çekiliş ödül`"
                    )
                    .setColor("Blue");

            return message.reply({
                embeds: [embed]
            });
        }

        // ======================================
        // KAYIT
        // ======================================

        if (command === "k") {

            if (!adminOrRole(
                message,
                KAYIT_YETKILI
            )) {

                return message.reply(
                    "❌ Bu komutu sadece **Kayıt Yetkilisi** veya **Yönetici** kullanabilir."
                );
            }

            const user =
                message.mentions.users.first();

            if (!user) {

                return message.reply(
                    "❌ Kullanım:\n`.k @oyuncu`"
                );
            }

            const embed =
                new EmbedBuilder()
                    .setTitle("📝 OYUNCU KAYIT")
                    .setDescription(
                        `${user} için kayıt türünü seçin.\n\n` +
                        "🧑‍💼 **Teknik Direktör**\n" +
                        "⚽ **Futbolcu**\n" +
                        "👤 **Üye**"
                    )
                    .setColor("Blue");

            return message.reply({
                embeds: [embed],
                components: [
                    registrationButtons(user.id)
                ]
            });
        }

        // ======================================
        // ANTRENMAN
        // ======================================

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
                    "💰 Değerine **+200K€** eklendi.\n" +
                    "🔄 Antrenman **0/10** oldu.";
            }

            save();

            return message.reply(
                `🏋️ **ANTRENMAN**\n\n` +
                `👤 ${message.author}\n` +
                `📊 İlerleme: **${player.training}/10**` +
                bonus
            );
        }

        // ======================================
        // PENALTI
        // ======================================

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
                    `💰 Değer artışı: **+100K€**`
                );
            }

            return message.reply(
                `❌ **PENALTI KAÇTI!**\n\n` +
                `${message.author} penaltıyı gole çeviremedi.`
            );
        }

        // ======================================
        // DEĞER
        // ======================================

        if (command === "dver") {

            if (!adminOrRole(
                message,
                DEGER_YETKILI
            )) {

                return message.reply(
                    "❌ Sadece **Değer Yetkilisi** veya **Yönetici** kullanabilir."
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
                `💰 ${user} oyuncusunun değeri ` +
                `**${formatMoney(amount)}** olarak ayarlandı.`
            );
        }

        // ======================================
        // TAKIM OLUŞTUR
        // ======================================

        if (
            command === "takımoluştur" ||
            command === "takimolustur"
        ) {

            if (!adminOrRole(
                message,
                TEKNIK_DIREKTOR_YETKILI
            )) {

                return message.reply(
                    "❌ Sadece **Teknik Direktör Yetkilisi** veya **Yönetici** kullanabilir."
                );
            }

            const teamName =
                args.join(" ");

            if (!teamName) {

                return message.reply(
                    "❌ Kullanım:\n`.takımoluştur Takım Adı`"
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
                `🏟️ **${teamName}** oluşturuldu!\n` +
                `💰 Bütçe: **50M€**`
            );
        }

        // ======================================
        // TRANSFER
        // ======================================

        if (command === "transfer") {

            if (!adminOrRole(
                message,
                TEKNIK_DIREKTOR_YETKILI
            )) {

                return message.reply(
                    "❌ Sadece **Teknik Direktör Yetkilisi** veya **Yönetici** kullanabilir."
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
                    "❌ Takım bulunamadı."
                );
            }

            const player =
                getPlayer(user.id);

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

        // ======================================
        // KADRO
        // ======================================

        if (command === "kadro") {

            if (!adminOrRole(
                message,
                TEKNIK_DIREKTOR_YETKILI
            )) {

                return message.reply(
                    "❌ Sadece **Teknik Direktör Yetkilisi** veya **Yönetici** kullanabilir."
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
                team.members.length
                    ? team.members.map(id => {

                        const p =
                            getPlayer(id);

                        return p.registeredName
                            ? `⚽ **${p.registeredName}** — <@${id}>`
                            : `👤 <@${id}>`;

                    }).join("\n")
                    : "Kadro boş.";

            const embed =
                new EmbedBuilder()
                    .setTitle(
                        `👥 ${player.team} KADROSU`
                    )
                    .setDescription(members)
                    .addFields({
                        name: "💰 Bütçe",
                        value: formatMoney(
                            team.budget
                        )
                    })
                    .setColor("Blue");

            return message.reply({
                embeds: [embed]
            });
        }

        // ======================================
        // BÜTÇE
        // ======================================

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
                `💰 **${player.team}** bütçesi: ` +
                `**${formatMoney(team.budget)}**`
            );
        }

        // ======================================
        // MAÇ
        // ======================================

        if (
            command === "maç" ||
            command === "mac"
        ) {

            if (!adminOrRole(
                message,
                MAC_YETKILI
            )) {

                return message.reply(
                    "❌ Sadece **Maç Yetkilisi** veya **Yönetici** kullanabilir."
                );
            }

            const opponent =
                message.mentions.users.first();

            if (!opponent) {

                return message.reply(
                    "❌ Kullanım:\n`.maç @oyuncu`"
                );
            }

            const score1 =
                Math.floor(Math.random() * 6);

            const score2 =
                Math.floor(Math.random() * 6);

            db.matches[Date.now()] = {
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
                    .setColor("Green");

            return message.reply({
                embeds: [embed]
            });
        }

        // ======================================
        // KICK
        // ======================================

        if (command === "kick") {

            if (!isAdmin(message)) {

                return message.reply(
                    "❌ Sadece **Yönetici** kullanabilir."
                );
            }

            const member =
                message.mentions.members.first();

            if (!member) {

                return message.reply(
                    "❌ `.kick @oyuncu sebep`"
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
                `👢 **${member.user.tag}** kicklendi.\n` +
                `📋 Sebep: **${reason}**`
            );
        }

        // ======================================
        // BAN
        // ======================================

        if (command === "ban") {

            if (!isAdmin(message)) {

                return message.reply(
                    "❌ Sadece **Yönetici** kullanabilir."
                );
            }

            const member =
                message.mentions.members.first();

            if (!member) {

                return message.reply(
                    "❌ `.ban @oyuncu sebep`"
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

        // ======================================
        // MUTE
        // ======================================

        if (command === "mute") {

            if (!isAdmin(message)) {

                return message.reply(
                    "❌ Sadece **Yönetici** kullanabilir."
                );
            }

            const member =
                message.mentions.members.first();

            const duration =
                args[1];

            if (!member || !duration) {

                return message.reply(
                    "❌ `.mute @oyuncu 10m sebep`"
                );
            }

            const match =
                duration.match(
                    /^(\d+)(s|m|h|d)$/
                );

            if (!match) {

                return message.reply(
                    "❌ Süre: `10s`, `10m`, `2h` veya `1d`"
                );
            }

            const amount =
                parseInt(match[1]);

            const unit =
                match[2];

            let ms = 0;

            if (unit === "s")
                ms = amount * 1000;

            if (unit === "m")
                ms = amount * 60 * 1000;

            if (unit === "h")
                ms = amount * 60 * 60 * 1000;

            if (unit === "d")
                ms = amount * 24 * 60 * 60 * 1000;

            if (
                ms >
                28 * 24 * 60 * 60 * 1000
            ) {

                return message.reply(
                    "❌ Maksimum mute süresi 28 gün."
                );
            }

            const reason =
                args.slice(2).join(" ") ||
                "Sebep belirtilmedi.";

            await member.timeout(
                ms,
                reason
            );

            return message.reply(
                `🔇 **${member.user.tag}** susturuldu.\n` +
                `⏱️ ${duration}\n` +
                `📋 ${reason}`
            );
        }

        // ======================================
        // UNMUTE
        // ======================================

        if (
            command === "unmute" ||
            command === "un-timeout"
        ) {

            if (!isAdmin(message)) {

                return message.reply(
                    "❌ Sadece **Yönetici** kullanabilir."
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
                `🔊 **${member.user.tag}** mutesi kaldırıldı.`
            );
        }

        // ======================================
        // KANAL KİLİT
        // ======================================

        if (command === "kilit") {

            if (!isAdmin(message)) {

                return message.reply(
                    "❌ Sadece **Yönetici** kullanabilir."
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

        // ======================================
        // KANAL AÇ
        // ======================================

        if (
            command === "aç" ||
            command === "ac"
        ) {

            if (!isAdmin(message)) {

                return message.reply(
                    "❌ Sadece **Yönetici** kullanabilir."
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

        // ======================================
        // ÇEKİLİŞ
        // ======================================

        if (
            command === "çekiliş" ||
            command === "cekilis"
        ) {

            if (!adminOrRole(
                message,
                CEKILIS_YETKILI
            )) {

                return message.reply(
                    "❌ Sadece **Çekiliş Yetkilisi** veya **Yönetici** kullanabilir."
                );
            }

            const prize =
                args.join(" ");

            if (!prize) {

                return message.reply(
                    "❌ `.çekiliş 5M€`"
                );
            }

            const embed =
                new EmbedBuilder()
                    .setTitle("🎉 ÇEKİLİŞ")
                    .setDescription(
                        `🎁 Ödül: **${prize}**\n\n` +
                        `Katılmak için 🎉 emojisine bas!\n\n` +
                        `⏱️ Süre: **30 saniye**`
                    )
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
                            "❌ Katılımcı yok."
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
                            "❌ Katılımcı yok."
                        );
                    }

                    const winner =
                        participants.random();

                    message.channel.send(
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
// HATALAR
// ==========================================

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

// ==========================================
// TOKEN
// ==========================================

const TOKEN =
    process.env.TOKEN;

if (!TOKEN) {

    console.error(
        "❌ TOKEN bulunamadı!"
    );

    process.exit(1);
}

client.login(TOKEN);
