const {
    Client,
    GatewayIntentBits,
    Partials,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionsBitField
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const PREFIX = ".";

// =====================================================
// ROL ID'LERİ
// =====================================================

const ROLES = {
    DEGER: "1540002147243139133",
    MAC: "1539997232642654248",
    KAYIT: "1540005508768079912",
    CEKILIS: "1539997232642654248",

    TEKNIK_DIREKTOR: "1539994147245527111",
    FUTBOLCU: "1539994254917767349",
    KAYITSIZ: "1540004657240211466"
};

// =====================================================
// KANAL ID'LERİ
// =====================================================

const CHANNELS = {
    KAYIT: "1539982713468100608",
    SOHBET: "1539983320438415392"
};

// =====================================================
// CLIENT
// =====================================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [
        Partials.Channel,
        Partials.Message
    ]
});

// =====================================================
// VERİ DOSYASI
// =====================================================

const DATA_FILE = path.join(
    __dirname,
    "data.json"
);

let data = {
    players: {},
    teams: {},
    giveaways: {}
};

if (fs.existsSync(DATA_FILE)) {
    try {
        data = JSON.parse(
            fs.readFileSync(
                DATA_FILE,
                "utf8"
            )
        );
    } catch {
        console.log(
            "⚠️ data.json okunamadı, yeni veri oluşturuluyor."
        );
    }
}

function saveData() {
    try {
        fs.writeFileSync(
            DATA_FILE,
            JSON.stringify(
                data,
                null,
                2
            )
        );
    } catch (err) {
        console.error(
            "Veri kaydetme hatası:",
            err
        );
    }
}

// =====================================================
// GERÇEK TAKIMLAR
// =====================================================

const REAL_TEAMS = [
    "Galatasaray",
    "Fenerbahçe",
    "Beşiktaş",
    "Trabzonspor",
    "Başakşehir",
    "Real Madrid",
    "Barcelona",
    "Atletico Madrid",
    "Manchester United",
    "Manchester City",
    "Liverpool",
    "Chelsea",
    "Arsenal",
    "Tottenham",
    "Bayern Münih",
    "Borussia Dortmund",
    "Paris Saint-Germain",
    "Inter",
    "Milan",
    "Juventus",
    "Napoli",
    "Roma",
    "Ajax",
    "PSV",
    "Benfica",
    "Porto"
];

// =====================================================
// YARDIMCI FONKSİYONLAR
// =====================================================

function isAdmin(member) {
    return member.permissions.has(
        PermissionsBitField.Flags.Administrator
    );
}

function hasRole(member, roleId) {
    return member.roles.cache.has(
        roleId
    );
}

function getPlayer(id) {

    if (!data.players[id]) {
        data.players[id] = {
            registered: false,
            value: 1000000,
            training: 0,
            goals: 0,
            budget: 0,
            team: null
        };

        saveData();
    }

    return data.players[id];
}

function getOwnedTeam(userId) {

    for (const [name, team] of Object.entries(data.teams)) {

        if (team.owner === userId) {
            return {
                name,
                team
            };
        }
    }

    return null;
}

function formatMoney(amount) {

    return Number(amount || 0)
        .toLocaleString("tr-TR") + "€";
}

// 5M / 500K / 1.5M / 2500000
function parseMoney(input) {

    if (!input) return null;

    let text = String(input)
        .toLowerCase()
        .replace(/€/g, "")
        .replace(/\s/g, "")
        .replace(",", ".");

    let multiplier = 1;

    if (text.endsWith("m")) {
        multiplier = 1000000;
        text = text.slice(0, -1);
    }

    else if (text.endsWith("k")) {
        multiplier = 1000;
        text = text.slice(0, -1);
    }

    const number = Number(text);

    if (
        !Number.isFinite(number) ||
        number <= 0
    ) {
        return null;
    }

    return Math.floor(
        number * multiplier
    );
}

// 5 dakika / 5 saat / 30 saniye
function parseDuration(text) {

    if (!text) return null;

    const match = text.match(
        /^(\d+(?:\.\d+)?)\s*(saniye|sn|s|dakika|dk|d|saat|sa|h)$/i
    );

    if (!match) return null;

    const amount =
        Number(match[1]);

    const unit =
        match[2].toLowerCase();

    if (
        unit === "s" ||
        unit === "sn" ||
        unit === "saniye"
    ) {
        return amount * 1000;
    }

    if (
        unit === "d" ||
        unit === "dk" ||
        unit === "dakika"
    ) {
        return amount * 60 * 1000;
    }

    return amount * 60 * 60 * 1000;
}

function random(min, max) {

    return Math.floor(
        Math.random() *
        (max - min + 1)
    ) + min;
}

// =====================================================
// HAZIR
// =====================================================

client.once("ready", () => {

    console.log(
        "================================="
    );

    console.log(
        `✅ Bot aktif: ${client.user.tag}`
    );

    console.log(
        "⚽ Legendary League"
    );

    console.log(
        "================================="
    );

    client.user.setActivity(
        "Legendary League ⚽"
    );
});

// =====================================================
// SUNUCUYA YENİ OYUNCU GELİNCE
// =====================================================

client.on(
    "guildMemberAdd",
    async member => {

        try {

            const channel =
                member.guild.channels.cache.get(
                    CHANNELS.KAYIT
                );

            if (!channel) return;

            await channel.send({

                content:
                    `<@&${ROLES.KAYIT}> Yeni oyuncu geldi ilgilenin! ${member}`,

                embeds: [
                    new EmbedBuilder()
                        .setTitle(
                            "👤 Yeni Oyuncu Geldi"
                        )
                        .setDescription(
                            `${member}\n\n` +
                            "Yeni oyuncunun kaydıyla ilgilenebilirsiniz."
                        )
                        .setThumbnail(
                            member.user.displayAvatarURL()
                        )
                        .setColor(
                            0x3498db
                        )
                        .setTimestamp()
                ]
            });

        } catch (err) {

            console.error(
                "Giriş sistemi:",
                err
            );
        }
    }
);

// =====================================================
// MESAJ SİSTEMİ
// =====================================================

client.on(
    "messageCreate",
    async message => {

        if (message.author.bot) return;
        if (!message.guild) return;
        if (!message.content.startsWith(PREFIX)) return;

        const args =
            message.content
                .slice(PREFIX.length)
                .trim()
                .split(/\s+/);

        const command =
            args.shift()
                .toLowerCase();

        const member =
            message.member;

        try {

            // =================================================
            // YARDIM
            // =================================================

            if (
                command === "yardım" ||
                command === "yardim"
            ) {

                return message.reply({

                    embeds: [

                        new EmbedBuilder()
                            .setTitle(
                                "⚽ Legendary League Komutları"
                            )
                            .setColor(
                                0x3498db
                            )
                            .setDescription(
                                "**📝 Kayıt**\n" +
                                "`.k @oyuncu isim`\n\n" +

                                "**⚽ Futbol**\n" +
                                "`.pen`\n" +
                                "`.ant`\n" +
                                "`.maç @TD1 @TD2`\n" +
                                "`.kap @oyuncu`\n\n" +

                                "**👥 Kadro**\n" +
                                "`.kadro`\n" +
                                "`.kadroekle @oyuncu`\n" +
                                "`.kadroçıkar @oyuncu`\n" +
                                "`.transfer @oyuncu`\n\n" +

                                "**🏟️ Takım**\n" +
                                "`.takım Galatasaray`\n" +
                                "`.takımım`\n\n" +

                                "**💰 Ekonomi**\n" +
                                "`.bütçe`\n" +
                                "`.para @oyuncu 5M`\n" +
                                "`.paraekle @oyuncu 5M`\n" +
                                "`.parasil @oyuncu 5M`\n" +
                                "`.dver @oyuncu 5M`\n\n" +

                                "**🎉 Çekiliş**\n" +
                                "`.çekiliş 5M€ 5 saat`\n\n" +

                                "**🛡️ Moderasyon**\n" +
                                "`.kick @oyuncu`\n" +
                                "`.ban @oyuncu`\n" +
                                "`.mute @oyuncu 10dk`\n" +
                                "`.unmute @oyuncu`\n" +
                                "`.sil 10`\n" +
                                "`.kilit`\n" +
                                "`.aç`\n\n" +

                                "**📦 Embed**\n" +
                                "`.embed mesaj`"
                            )
                    ]
                });
            }

            // =================================================
            // EMBED
            // =================================================

            if (command === "embed") {

                if (!isAdmin(member)) {
                    return message.reply(
                        "❌ Sadece Yönetici kullanabilir."
                    );
                }

                const text =
                    args.join(" ").trim();

                if (!text) {
                    return message.reply(
                        "❌ Kullanım: `.embed mesaj`"
                    );
                }

                await message.channel.send({

                    embeds: [
                        new EmbedBuilder()
                            .setDescription(text)
                            .setColor(
                                0x3498db
                            )
                            .setTimestamp()
                    ]
                });

                await message.delete()
                    .catch(() => {});

                return;
            }

            // =================================================
            // KAYIT
            // =================================================

            if (
                command === "k" ||
                command === "kayıt" ||
                command === "kayit"
            ) {

                if (
                    !hasRole(
                        member,
                        ROLES.KAYIT
                    ) &&
                    !isAdmin(member)
                ) {
                    return message.reply(
                        "❌ Sadece Kayıt Yetkilisi kullanabilir."
                    );
                }

                const target =
                    message.mentions.members.first();

                if (!target) {
                    return message.reply(
                        "❌ Kullanım: `.k @oyuncu isim`"
                    );
                }

                const name =
                    args
                        .filter(
                            x =>
                                !x.includes(
                                    target.id
                                )
                        )
                        .join(" ")
                        .trim();

                if (!name) {
                    return message.reply(
                        "❌ Oyuncu adını yaz."
                    );
                }

                const player =
                    getPlayer(target.id);

                player.registered =
                    true;

                await target
                    .setNickname(name)
                    .catch(() => {});

                const kayitsiz =
                    message.guild.roles.cache.get(
                        ROLES.KAYITSIZ
                    );

                if (kayitsiz) {
                    await target.roles
                        .remove(kayitsiz)
                        .catch(() => {});
                }

                const row =
                    new ActionRowBuilder()
                        .addComponents(

                            new ButtonBuilder()
                                .setCustomId(
                                    `register_td_${target.id}`
                                )
                                .setLabel(
                                    "Teknik Direktör"
                                )
                                .setEmoji("👔")
                                .setStyle(
                                    ButtonStyle.Primary
                                ),

                            new ButtonBuilder()
                                .setCustomId(
                                    `register_player_${target.id}`
                                )
                                .setLabel(
                                    "Futbolcu"
                                )
                                .setEmoji("⚽")
                                .setStyle(
                                    ButtonStyle.Success
                                )
                        );

                await message.channel.send({

                    embeds: [
                        new EmbedBuilder()
                            .setTitle(
                                "📝 Oyuncu Kaydı"
                            )
                            .setDescription(
                                `${target}\n\n` +
                                `👤 İsim: **${name}**\n\n` +
                                "Oyuncunun rolünü seçin:"
                            )
                            .setColor(
                                0x3498db
                            )
                    ],

                    components: [row]
                });

                return;
            }

            // =================================================
            // DEĞER
            // =================================================

            if (command === "dver") {

                if (
                    !hasRole(
                        member,
                        ROLES.DEGER
                    ) &&
                    !isAdmin(member)
                ) {
                    return message.reply(
                        "❌ Sadece Değer Yetkilisi kullanabilir."
                    );
                }

                const target =
                    message.mentions.members.first();

                const rawAmount =
                    args
                        .filter(
                            x =>
                                !x.includes(
                                    target?.id || ""
                                )
                        )[0];

                const amount =
                    parseMoney(rawAmount);

                if (
                    !target ||
                    !amount
                ) {
                    return message.reply(
                        "❌ Kullanım: `.dver @oyuncu 5M`"
                    );
                }

                const player =
                    getPlayer(target.id);

                player.value += amount;

                // Nickname içindeki son değeri değiştir
                const oldName =
                    target.nickname ||
                    target.user.username;

                const parts =
                    oldName.split("|");

                if (parts.length >= 2) {

                    parts[parts.length - 1] =
                        ` ${formatMoney(player.value)}`;

                    await target
                        .setNickname(
                            parts.join("|").trim()
                        )
                        .catch(() => {});

                }

                saveData();

                return message.reply(
                    `💰 ${target} değerine **${formatMoney(amount)}** eklendi.\n` +
                    `📊 Yeni değer: **${formatMoney(player.value)}**`
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
                    getPlayer(member.id);

                if (!player.registered) {
                    return message.reply(
                        "❌ Önce kayıt olmalısın."
                    );
                }

                player.training++;

                if (
                    player.training >= 10
                ) {

                    player.training = 0;
                    player.value += 3000000;

                    saveData();

                    return message.reply(
                        "🏋️ **ANTRENMAN 10/10!**\n\n" +
                        "💰 Değerine **+3M€** eklendi.\n" +
                        `💎 Yeni değer: **${formatMoney(player.value)}**`
                    );
                }

                saveData();

                return message.reply(
                    `🏋️ Antrenman: **${player.training}/10**`
                );
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
                    getPlayer(member.id);

                if (!player.registered) {
                    return message.reply(
                        "❌ Önce kayıt olmalısın."
                    );
                }

                const goal =
                    Math.random() < 0.70;

                if (goal) {

                    player.goals++;
                    player.value += 2000000;

                    saveData();

                    return message.reply(
                        "⚽ **GOOOOOL!**\n\n" +
                        "💰 Değerine **+2M€** eklendi.\n" +
                        `💎 Yeni değer: **${formatMoney(player.value)}**`
                    );
                }

                return message.reply(
                    "🥅 **PENALTI KAÇTI!**\n" +
                    "Kaleci doğru köşeyi buldu."
                );
            }

            // =================================================
            // BÜTÇE
            // =================================================

            if (
                command === "bütçe" ||
                command === "butce"
            ) {

                const player =
                    getPlayer(member.id);

                return message.reply(
                    `💰 Bütçen: **${formatMoney(player.budget)}**`
                );
            }

            // =================================================
            // PARA GÖNDER
            // =================================================

            if (command === "para") {

                const target =
                    message.mentions.members.first();

                const rawAmount =
                    args
                        .filter(
                            x =>
                                !x.includes(
                                    target?.id || ""
                                )
                        )[0];

                const amount =
                    parseMoney(rawAmount);

                if (
                    !target ||
                    !amount
                ) {
                    return message.reply(
                        "❌ Kullanım: `.para @oyuncu 5M`"
                    );
                }

                if (
                    target.id === member.id
                ) {
                    return message.reply(
                        "❌ Kendine para gönderemezsin."
                    );
                }

                const sender =
                    getPlayer(member.id);

                const receiver =
                    getPlayer(target.id);

                if (
                    sender.budget < amount
                ) {
                    return message.reply(
                        "❌ Bütçen yetersiz."
                    );
                }

                sender.budget -= amount;
                receiver.budget += amount;

                saveData();

                return message.reply(
                    `💸 ${target} kişisine **${formatMoney(amount)}** gönderildi.`
                );
            }

            // =================================================
            // PARA EKLE
            // =================================================

            if (
                command === "paraekle" ||
                command === "paraekle"
            ) {

                if (!isAdmin(member)) {
                    return message.reply(
                        "❌ Sadece Yönetici kullanabilir."
                    );
                }

                const target =
                    message.mentions.members.first();

                const rawAmount =
                    args
                        .filter(
                            x =>
                                !x.includes(
                                    target?.id || ""
                                )
                        )[0];

                const amount =
                    parseMoney(rawAmount);

                if (
                    !target ||
                    !amount
                ) {
                    return message.reply(
                        "❌ Kullanım: `.paraekle @oyuncu 5M`"
                    );
                }

                const player =
                    getPlayer(target.id);

                player.budget += amount;

                saveData();

                return message.reply(
                    `💰 ${target} bütçesine **${formatMoney(amount)}** eklendi.\n` +
                    `📊 Yeni bütçe: **${formatMoney(player.budget)}**`
                );
            }

            // =================================================
            // PARA SİL
            // =================================================

            if (command === "parasil") {

                if (!isAdmin(member)) {
                    return message.reply(
                        "❌ Sadece Yönetici kullanabilir."
                    );
                }

                const target =
                    message.mentions.members.first();

                const rawAmount =
                    args
                        .filter(
                            x =>
                                !x.includes(
                                    target?.id || ""
                                )
                        )[0];

                const amount =
                    parseMoney(rawAmount);

                if (
                    !target ||
                    !amount
                ) {
                    return message.reply(
                        "❌ Kullanım: `.parasil @oyuncu 5M`"
                    );
                }

                const player =
                    getPlayer(target.id);

                player.budget =
                    Math.max(
                        0,
                        player.budget - amount
                    );

                saveData();

                return message.reply(
                    `🗑️ ${target} hesabından **${formatMoney(amount)}** silindi.`
                );
            }

            // =================================================
            // TAKIM OLUŞTUR
            // =================================================

            if (
                command === "takım" ||
                command === "takim"
            ) {

                if (
                    !hasRole(
                        member,
                        ROLES.TEKNIK_DIREKTOR
                    ) &&
                    !isAdmin(member)
                ) {
                    return message.reply(
                        "❌ Sadece Teknik Direktör kullanabilir."
                    );
                }

                if (
                    getOwnedTeam(member.id)
                ) {
                    return message.reply(
                        "❌ Bir Teknik Direktör sadece 1 takım oluşturabilir."
                    );
                }

                const teamName =
                    args.join(" ").trim();

                const realTeam =
                    REAL_TEAMS.find(
                        x =>
                            x.toLowerCase() ===
                            teamName.toLowerCase()
                    );

                if (!realTeam) {
                    return message.reply(
                        "❌ Geçerli bir gerçek takım adı gir.\n\n" +
                        REAL_TEAMS.join(", ")
                    );
                }

                if (
                    data.teams[realTeam]
                ) {
                    return message.reply(
                        "❌ Bu takım zaten alınmış."
                    );
                }

                const role =
                    await message.guild.roles
                        .create({
                            name: realTeam,
                            reason:
                                "Legendary League takım rolü"
                        })
                        .catch(() => null);

                if (!role) {
                    return message.reply(
                        "❌ Takım rolü oluşturulamadı."
                    );
                }

                await member.roles
                    .add(role)
                    .catch(() => {});

                data.teams[realTeam] = {

                    owner: member.id,

                    roleId: role.id,

                    budget: 100000000,

                    squad: []
                };

                getPlayer(
                    member.id
                ).team = realTeam;

                saveData();

                return message.reply(
                    `🏟️ **${realTeam}** takımını oluşturdun!\n\n` +
                    `👔 Teknik Direktör: ${member}\n` +
                    `💰 Başlangıç bütçesi: **100M€**\n` +
                    `🎭 Takım rolü oluşturuldu.`
                );
            }

            // =================================================
            // TAKIMIM
            // =================================================

            if (
                command === "takımım" ||
                command === "takimim"
            ) {

                const result =
                    getOwnedTeam(member.id);

                if (!result) {
                    return message.reply(
                        "❌ Henüz takımın yok."
                    );
                }

                return message.reply({

                    embeds: [

                        new EmbedBuilder()
                            .setTitle(
                                `🏟️ ${result.name}`
                            )
                            .setDescription(
                                `👔 Teknik Direktör: <@${result.team.owner}>\n` +
                                `💰 Bütçe: **${formatMoney(result.team.budget)}**\n` +
                                `👥 Kadro: **${result.team.squad.length} oyuncu**`
                            )
                            .setColor(
                                0x3498db
                            )
                    ]
                });
            }

            // =================================================
            // KADRO
            // =================================================

            if (command === "kadro") {

                const result =
                    getOwnedTeam(member.id);

                if (!result) {
                    return message.reply(
                        "❌ Takımın yok."
                    );
                }

                if (
                    result.team.squad.length === 0
                ) {
                    return message.reply(
                        `📋 **${result.name}** kadrosu boş.`
                    );
                }

                const list =
                    result.team.squad
                        .map(
                            (id, index) =>
                                `${index + 1}. <@${id}>`
                        )
                        .join("\n");

                return message.reply({

                    embeds: [

                        new EmbedBuilder()
                            .setTitle(
                                `👥 ${result.name} Kadrosu`
                            )
                            .setDescription(
                                list
                            )
                            .setColor(
                                0x2ecc71
                            )
                    ]
                });
            }

            // =================================================
            // KADRO EKLE
            // =================================================

            if (
                command === "kadroekle"
            ) {

                if (
                    !hasRole(
                        member,
                        ROLES.TEKNIK_DIREKTOR
                    ) &&
                    !isAdmin(member)
                ) {
                    return message.reply(
                        "❌ Sadece Teknik Direktör kullanabilir."
                    );
                }

                const result =
                    getOwnedTeam(member.id);

                const target =
                    message.mentions.members.first();

                if (!result) {
                    return message.reply(
                        "❌ Takımın yok."
                    );
                }

                if (!target) {
                    return message.reply(
                        "❌ `.kadroekle @oyuncu`"
                    );
                }

                if (
                    result.team.squad.includes(
                        target.id
                    )
                ) {
                    return message.reply(
                        "❌ Oyuncu zaten kadroda."
                    );
                }

                // Oyuncunun eski takımından çıkar
                const player =
                    getPlayer(target.id);

                if (player.team) {

                    const oldTeam =
                        data.teams[player.team];

                    if (oldTeam) {

                        oldTeam.squad =
                            oldTeam.squad.filter(
                                id =>
                                    id !== target.id
                            );
                    }
                }

                result.team.squad.push(
                    target.id
                );

                player.team =
                    result.name;

                saveData();

                return message.reply(
                    `✅ ${target} **${result.name}** kadrosuna eklendi.`
                );
            }

            // =================================================
            // KADRO ÇIKAR
            // =================================================

            if (
                command === "kadroçıkar" ||
                command === "kadrociKar" ||
                command === "kadro-cikar"
            ) {

                if (
                    !hasRole(
                        member,
                        ROLES.TEKNIK_DIREKTOR
                    ) &&
                    !isAdmin(member)
                ) {
                    return message.reply(
                        "❌ Sadece Teknik Direktör kullanabilir."
                    );
                }

                const result =
                    getOwnedTeam(member.id);

                const target =
                    message.mentions.members.first();

                if (!result) {
                    return message.reply(
                        "❌ Takımın yok."
                    );
                }

                if (!target) {
                    return message.reply(
                        "❌ `.kadroçıkar @oyuncu`"
                    );
                }

                result.team.squad =
                    result.team.squad.filter(
                        id =>
                            id !== target.id
                    );

                const player =
                    getPlayer(target.id);

                if (
                    player.team ===
                    result.name
                ) {
                    player.team = null;
                }

                saveData();

                return message.reply(
                    `✅ ${target} kadrodan çıkarıldı.`
                );
            }

            // =================================================
            // TRANSFER
            // =================================================

            if (command === "transfer") {

                if (
                    !hasRole(
                        member,
                        ROLES.TEKNIK_DIREKTOR
                    ) &&
                    !isAdmin(member)
                ) {
                    return message.reply(
                        "❌ Sadece Teknik Direktör kullanabilir."
                    );
                }

                const target =
                    message.mentions.members.first();

                const destination =
                    getOwnedTeam(member.id);

                if (!target) {
                    return message.reply(
                        "❌ `.transfer @oyuncu`"
                    );
                }

                if (!destination) {
                    return message.reply(
                        "❌ Takımın yok."
                    );
                }

                const player =
                    getPlayer(target.id);

                // Eski takımdan çıkar
                if (player.team) {

                    const oldTeam =
                        data.teams[player.team];

                    if (oldTeam) {

                        oldTeam.squad =
                            oldTeam.squad.filter(
                                id =>
                                    id !== target.id
                            );
                    }
                }

                if (
                    !destination.team.squad.includes(
                        target.id
                    )
                ) {
                    destination.team.squad.push(
                        target.id
                    );
                }

                player.team =
                    destination.name;

                saveData();

                return message.reply(
                    `🔄 ${target}, **${destination.name}** takımına transfer edildi.`
                );
            }

            // =================================================
            // KAP
            // =================================================

            if (command === "kap") {

                if (
                    !hasRole(
                        member,
                        ROLES.TEKNIK_DIREKTOR
                    ) &&
                    !isAdmin(member)
                ) {
                    return message.reply(
                        "❌ Sadece Teknik Direktör kullanabilir."
                    );
                }

                const target =
                    message.mentions.members.first();

                const team =
                    getOwnedTeam(member.id);

                if (!target) {
                    return message.reply(
                        "❌ Kullanım: `.kap @oyuncu`"
                    );
                }

                if (!team) {
                    return message.reply(
                        "❌ Önce takım oluşturmalısın."
                    );
                }

                const player =
                    getPlayer(target.id);

                const oldTeam =
                    player.team ||
                    "Takımsız";

                return message.channel.send({

                    embeds: [

                        new EmbedBuilder()
                            .setTitle(
                                "📢 KAP BİLDİRİMİ"
                            )
                            .setDescription(
                                `👤 **Oyuncu:** ${target}\n` +
                                `🏟️ **Mevcut Takım:** ${oldTeam}\n` +
                                `🏟️ **Yeni Takım:** ${team.name}\n` +
                                `💰 **Değer:** ${formatMoney(player.value)}\n\n` +
                                `👔 **Teknik Direktör:** ${member}\n\n` +
                                "📋 Oyuncunun transferi hakkında resmi KAP bildirimi oluşturulmuştur."
                            )
                            .setThumbnail(
                                target.user.displayAvatarURL()
                            )
                            .setColor(
                                0x3498db
                            )
                            .setFooter({
                                text:
                                    "Legendary League • KAP"
                            })
                            .setTimestamp()
                    ]
                });
            }

            // =================================================
            // MAÇ
            // =================================================

            if (
                command === "maç" ||
                command === "mac"
            ) {

                if (
                    !hasRole(
                        member,
                        ROLES.MAC
                    ) &&
                    !isAdmin(member)
                ) {
                    return message.reply(
                        "❌ Sadece Maç Yetkilisi kullanabilir."
                    );
                }

                const mentions =
                    [...message.mentions.members.values()];

                if (
                    mentions.length !== 2
                ) {
                    return message.reply(
                        "❌ Kullanım:\n`.maç @takım1 @takım2`"
                    );
                }

                const first =
                    getOwnedTeam(
                        mentions[0].id
                    );

                const second =
                    getOwnedTeam(
                        mentions[1].id
                    );

                if (!first || !second) {
                    return message.reply(
                        "❌ İki etiketlenen kişinin de takımı olmalı."
                    );
                }

                if (
                    first.name ===
                    second.name
                ) {
                    return message.reply(
                        "❌ Aynı takım kendisiyle oynayamaz."
                    );
                }

                let score1 = 0;
                let score2 = 0;
                let minute = 1;

                const events = [

                    "⚡ Hızlı bir hücum başladı!",
                    "🎯 Ceza sahası dışından sert şut!",
                    "🧤 Kaleci mükemmel kurtardı!",
                    "🏃 Kanattan tehlikeli atak!",
                    "🛡️ Savunma son anda müdahale etti!",
                    "🔥 Maçın temposu yükseliyor!",
                    "⚔️ Orta sahada büyük mücadele!",
                    "🎯 Tehlikeli orta geldi!",
                    "🥅 Ceza sahasında karambol!",
                    "🚀 Kontra atak başladı!",
                    "👏 Tribünlerden büyük destek!",
                    "🧠 Teknik direktör taktik değişikliğine gitti!",
                    "📣 Taraftarlar gol bekliyor!",
                    "🎯 Oyuncu kaleyi yokladı!",
                    "🧤 Kaleci topu kontrol etti!",
                    "⚡ Hızlı paslaşmalar!",
                    "🛡️ Savunma hattı çok dikkatli!"
                ];

                const goals = [

                    "🚨 **GOOOOOL!** Muhteşem bir bitiriş!",
                    "⚽ **GOOOL!** Top ağlarla buluştu!",
                    "🔥 **GOOOOL!** Kontra atakta affetmedi!",
                    "🎯 **GOOOL!** Kalecinin şansı yoktu!",
                    "🚀 **GOOOOL!** Uzak köşeye harika vuruş!"
                ];

                const matchMessage =
                    await message.channel.send({

                        embeds: [

                            new EmbedBuilder()
                                .setTitle(
                                    `🏟️ ${first.name} 🆚 ${second.name}`
                                )
                                .setDescription(
                                    `🏁 **MAÇ BAŞLADI!**\n\n` +
                                    `🔵 ${first.name} **0** - **0** ${second.name} 🔴\n\n` +
                                    "⏱️ **1'**\n\n" +
                                    "🎙️ Hakem düdüğü çaldı!"
                                )
                                .setColor(
                                    0x2ecc71
                                )
                                .setTimestamp()
                        ]
                    });

                const interval =
                    setInterval(
                        async () => {

                            minute++;

                            let eventText;

                            // Gol ihtimali
                            if (
                                Math.random() < 0.14
                            ) {

                                if (
                                    Math.random() < 0.5
                                ) {

                                    score1++;

                                    eventText =
                                        `${goals[random(
                                            0,
                                            goals.length - 1
                                        )]} **${first.name}** golü buldu!`;

                                } else {

                                    score2++;

                                    eventText =
                                        `${goals[random(
                                            0,
                                            goals.length - 1
                                        )]} **${second.name}** golü buldu!`;
                                }

                            } else {

                                eventText =
                                    events[random(
                                        0,
                                        events.length - 1
                                    )];
                            }

                            await matchMessage.edit({

                                embeds: [

                                    new EmbedBuilder()
                                        .setTitle(
                                            `⚽ ${first.name} 🆚 ${second.name}`
                                        )
                                        .setDescription(
                                            `${eventText}\n\n` +
                                            `📊 **${first.name} ${score1} - ${score2} ${second.name}**\n\n` +
                                            `⏱️ **${minute}'**`
                                        )
                                        .setColor(
                                            0x3498db
                                        )
                                        .setFooter({
                                            text:
                                                "Legendary League • Canlı Maç Anlatımı"
                                        })
                                        .setTimestamp()
                                ]

                            }).catch(() => {});

                            // 90 dakika
                            if (
                                minute >= 90
                            ) {

                                clearInterval(
                                    interval
                                );

                                let result;

                                if (
                                    score1 > score2
                                ) {

                                    result =
                                        `🏆 **${first.name} KAZANDI!**`;

                                } else if (
                                    score2 > score1
                                ) {

                                    result =
                                        `🏆 **${second.name} KAZANDI!**`;

                                } else {

                                    result =
                                        "🤝 **MAÇ BERABERE BİTTİ!**";
                                }

                                // Kazanan takım bütçesine 5M
                                if (
                                    score1 > score2
                                ) {

                                    first.team.budget +=
                                        5000000;

                                } else if (
                                    score2 > score1
                                ) {

                                    second.team.budget +=
                                        5000000;
                                }

                                saveData();

                                await matchMessage.edit({

                                    embeds: [

                                        new EmbedBuilder()
                                            .setTitle(
                                                "🏁 MAÇ BİTTİ"
                                            )
                                            .setDescription(
                                                `🏟️ **${first.name}** 🆚 **${second.name}**\n\n` +
                                                `# ${score1} - ${score2}\n\n` +
                                                result +
                                                `\n\n⏱️ **90+${random(
                                                    1,
                                                    5
                                                )}'**\n\n` +
                                                "🎙️ Hakem son düdüğü çaldı."
                                            )
                                            .setColor(
                                                0xe67e22
                                            )
                                            .setTimestamp()
                                    ]
                                });
                            }

                        },
                        1000
                    );

                return;
            }

            // =================================================
            // ÇEKİLİŞ
            // =================================================

            if (
                command === "çekiliş" ||
                command === "cekilis"
            ) {

                if (
                    !hasRole(
                        member,
                        ROLES.CEKILIS
                    ) &&
                    !isAdmin(member)
                ) {
                    return message.reply(
                        "❌ Sadece Çekiliş Yetkilisi kullanabilir."
                    );
                }

                const prize =
                    args[0];

                const durationText =
                    args
                        .slice(1)
                        .join(" ");

                const duration =
                    parseDuration(
                        durationText
                    );

                if (
                    !prize ||
                    !duration
                ) {
                    return message.reply(
                        "❌ Örnek:\n`.çekiliş 5M€ 5 saat`\n`.çekiliş 500K€ 30 dakika`\n`.çekiliş 100K€ 60 saniye`"
                    );
                }

                const id =
                    `${Date.now()}_${message.author.id}`;

                data.giveaways[id] = {
                    prize,
                    channelId:
                        message.channel.id,
                    participants: []
                };

                saveData();

                const row =
                    new ActionRowBuilder()
                        .addComponents(

                            new ButtonBuilder()
                                .setCustomId(
                                    `giveaway_${id}`
                                )
                                .setLabel(
                                    "Çekilişe Katıl"
                                )
                                .setEmoji("🎉")
                                .setStyle(
                                    ButtonStyle.Primary
                                )
                        );

                await message.channel.send({

                    embeds: [

                        new EmbedBuilder()
                            .setTitle(
                                "🎉 ÇEKİLİŞ"
                            )
                            .setDescription(
                                `🎁 **Ödül:** ${prize}\n\n` +
                                "🎉 Katılmak için butona bas!\n\n" +
                                `⏰ Bitiş: <t:${Math.floor(
                                    (Date.now() + duration) / 1000
                                )}:R>`
                            )
                            .setColor(
                                0xf1c40f
                            )
                            .setTimestamp()
                    ],

                    components: [row]
                });

                setTimeout(
                    async () => {

                        const giveaway =
                            data.giveaways[id];

                        if (!giveaway) return;

                        const participants =
                            giveaway.participants;

                        const channel =
                            message.guild.channels.cache.get(
                                giveaway.channelId
                            );

                        if (
                            !channel
                        ) {
                            delete data.giveaways[id];
                            saveData();
                            return;
                        }

                        if (
                            participants.length === 0
                        ) {

                            await channel.send(
                                `🎉 **${prize}** çekilişi sona erdi fakat katılım olmadı.`
                            );

                        } else {

                            const winner =
                                participants[
                                    random(
                                        0,
                                        participants.length - 1
                                    )
                                ];

                            await channel.send(
                                `🎉 **ÇEKİLİŞ BİTTİ!**\n\n` +
                                `🎁 Ödül: **${prize}**\n` +
                                `🏆 Kazanan: <@${winner}>`
                            );
                        }

                        delete data.giveaways[id];

                        saveData();

                    },
                    duration
                );

                return message.reply(
                    `✅ **${prize}** çekilişi başlatıldı.`
                );
            }

            // =================================================
            // KICK
            // =================================================

            if (command === "kick") {

                if (!isAdmin(member)) {
                    return message.reply(
                        "❌ Sadece Yönetici kullanabilir."
                    );
                }

                const target =
                    message.mentions.members.first();

                if (!target) {
                    return message.reply(
                        "❌ `.kick @oyuncu sebep`"
                    );
                }

                if (
                    !target.kickable
                ) {
                    return message.reply(
                        "❌ Bu oyuncuyu kickleyemiyorum."
                    );
                }

                await target.kick(
                    args
                        .slice(1)
                        .join(" ") ||
                    "Sebep belirtilmedi."
                );

                return message.reply(
                    `👢 **${target.user.tag}** kicklendi.`
                );
            }

            // =================================================
            // BAN
            // =================================================

            if (command === "ban") {

                if (!isAdmin(member)) {
                    return message.reply(
                        "❌ Sadece Yönetici kullanabilir."
                    );
                }

                const target =
                    message.mentions.members.first();

                if (!target) {
                    return message.reply(
                        "❌ `.ban @oyuncu sebep`"
                    );
                }

                if (
                    !target.bannable
                ) {
                    return message.reply(
                        "❌ Bu oyuncuyu banlayamıyorum."
                    );
                }

                await target.ban({
                    reason:
                        args
                            .slice(1)
                            .join(" ") ||
                        "Sebep belirtilmedi."
                });

                return message.reply(
                    `🔨 **${target.user.tag}** banlandı.`
                );
            }

            // =================================================
            // MUTE
            // =================================================

            if (command === "mute") {

                if (!isAdmin(member)) {
                    return message.reply(
                        "❌ Sadece Yönetici kullanabilir."
                    );
                }

                const target =
                    message.mentions.members.first();

                const duration =
                    parseDuration(
                        args[1]
                    );

                if (
                    !target ||
                    !duration
                ) {
                    return message.reply(
                        "❌ Örnek: `.mute @oyuncu 10 dakika`"
                    );
                }

                if (
                    duration > 28 * 24 * 60 * 60 * 1000
                ) {
                    return message.reply(
                        "❌ Discord en fazla 28 günlük timeout destekler."
                    );
                }

                await target.timeout(
                    duration,
                    "Legendary League Moderasyon"
                );

                return message.reply(
                    `🔇 ${target} **${args[1]}** süreyle susturuldu.`
                );
            }

            // =================================================
            // UNMUTE
            // =================================================

            if (
                command === "unmute"
            ) {

                if (!isAdmin(member)) {
                    return message.reply(
                        "❌ Sadece Yönetici kullanabilir."
                    );
                }

                const target =
                    message.mentions.members.first();

                if (!target) {
                    return message.reply(
                        "❌ `.unmute @oyuncu`"
                    );
                }

                await target.timeout(
                    null,
                    "Mute kaldırıldı."
                );

                return message.reply(
                    `🔊 ${target} artık susturulmuyor.`
                );
            }

            // =================================================
            // MESAJ SİL
            // =================================================

            if (command === "sil") {

                if (!isAdmin(member)) {
                    return message.reply(
                        "❌ Sadece Yönetici kullanabilir."
                    );
                }

                const amount =
                    Number(args[0]);

                if (
                    !Number.isInteger(amount) ||
                    amount < 1 ||
                    amount > 100
                ) {
                    return message.reply(
                        "❌ 1 ile 100 arasında bir sayı gir."
                    );
                }

                await message.channel
                    .bulkDelete(
                        amount + 1,
                        true
                    );

                return;
            }

            // =================================================
            // KANAL KİLİT
            // =================================================

            if (
                command === "kilit"
            ) {

                if (!isAdmin(member)) {
                    return message.reply(
                        "❌ Sadece Yönetici kullanabilir."
                    );
                }

                await message.channel
                    .permissionOverwrites.edit(
                        message.guild.roles.everyone,
                        {
                            SendMessages: false
                        }
                    );

                return message.reply(
                    "🔒 Kanal kilitlendi."
                );
            }

            // =================================================
            // KANAL AÇ
            // =================================================

            if (
                command === "aç" ||
                command === "ac"
            ) {

                if (!isAdmin(member)) {
                    return message.reply(
                        "❌ Sadece Yönetici kullanabilir."
                    );
                }

                await message.channel
                    .permissionOverwrites.edit(
                        message.guild.roles.everyone,
                        {
                            SendMessages: true
                        }
                    );

                return message.reply(
                    "🔓 Kanal tekrar açıldı."
                );
            }

        } catch (error) {

            console.error(
                "Komut hatası:",
                error
            );

            if (
                !message.replied &&
                !message.deletable
            ) {
                return;
            }

            message.reply(
                "❌ İşlem sırasında bir hata oluştu."
            ).catch(() => {});
        }
    }
);

// =====================================================
// BUTON SİSTEMİ
// =====================================================

client.on(
    "interactionCreate",
    async interaction => {

        if (!interaction.isButton()) return;

        try {

            // =================================================
            // ÇEKİLİŞ
            // =================================================

            if (
                interaction.customId
                    .startsWith(
                        "giveaway_"
                    )
            ) {

                const id =
                    interaction.customId
                        .replace(
                            "giveaway_",
                            ""
                        );

                const giveaway =
                    data.giveaways[id];

                if (!giveaway) {
                    return interaction.reply({
                        content:
                            "❌ Bu çekiliş sona ermiş.",
                        ephemeral: true
                    });
                }

                if (
                    giveaway.participants
                        .includes(
                            interaction.user.id
                        )
                ) {
                    return interaction.reply({
                        content:
                            "❌ Zaten çekilişe katıldın.",
                        ephemeral: true
                    });
                }

                giveaway.participants.push(
                    interaction.user.id
                );

                saveData();

                return interaction.reply({
                    content:
                        "🎉 Çekilişe başarıyla katıldın!",
                    ephemeral: true
                });
            }

            // =================================================
            // KAYIT BUTONLARI
            // =================================================

            if (
                interaction.customId
                    .startsWith(
                        "register_"
                    )
            ) {

                if (
                    !hasRole(
                        interaction.member,
                        ROLES.KAYIT
                    ) &&
                    !isAdmin(
                        interaction.member
                    )
                ) {
                    return interaction.reply({
                        content:
                            "❌ Sadece Kayıt Yetkilisi kullanabilir.",
                        ephemeral: true
                    });
                }

                const parts =
                    interaction.customId
                        .split("_");

                const type =
                    parts[1];

                const userId =
                    parts[2];

                const target =
                    await interaction.guild.members
                        .fetch(userId)
                        .catch(() => null);

                if (!target) {
                    return interaction.reply({
                        content:
                            "❌ Oyuncu bulunamadı.",
                        ephemeral: true
                    });
                }

                const kayitsiz =
                    interaction.guild.roles.cache
                        .get(
                            ROLES.KAYITSIZ
                        );

                const td =
                    interaction.guild.roles.cache
                        .get(
                            ROLES.TEKNIK_DIREKTOR
                        );

                const futbolcu =
                    interaction.guild.roles.cache
                        .get(
                            ROLES.FUTBOLCU
                        );

                // Kayıtsız kaldır
                if (kayitsiz) {
                    await target.roles
                        .remove(kayitsiz)
                        .catch(() => {});
                }

                // Eski kayıt rolünü kaldır
                if (td) {
                    await target.roles
                        .remove(td)
                        .catch(() => {});
                }

                if (futbolcu) {
                    await target.role
