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

// =====================================================
// AYARLAR
// =====================================================

const PREFIX = ".";

const ROLE = {
    // VERDİĞİN ID'LER
    KAYIT_YETKILISI: "1540005508768079912",
    KAYITSIZ: "1540004657240211466",

    // KENDİ ROL ID'LERİNİ BURAYA KOY
    TEKNIK_DIREKTOR: "1539994147245527111",
    FUTBOLCU: "1539994254917767349"
};

const CHANNEL = {
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
// VERİ
// =====================================================

let data = {
    players: {},
    teams: {},
    giveaways: {}
};

if (fs.existsSync("data.json")) {
    try {
        data = JSON.parse(
            fs.readFileSync("data.json", "utf8")
        );
    } catch {
        data = {
            players: {},
            teams: {},
            giveaways: {}
        };
    }
}

function save() {
    fs.writeFileSync(
        "data.json",
        JSON.stringify(data, null, 2)
    );
}

// =====================================================
// YARDIMCI FONKSİYONLAR
// =====================================================

function isAdmin(member) {
    return member.permissions.has(
        PermissionsBitField.Flags.Administrator
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

        save();
    }

    return data.players[id];
}

// Oyuncu değeri için
// 1000000 -> 1M€
// 6000000 -> 6M€
// 1500000 -> 1.5M€
function formatValue(value) {

    value = Number(value || 0);

    if (value >= 1000000) {

        const milyon =
            value / 1000000;

        return (
            Number.isInteger(milyon)
                ? milyon
                : milyon.toFixed(1)
        ) + "M€";
    }

    if (value >= 1000) {

        const bin =
            value / 1000;

        return (
            Number.isInteger(bin)
                ? bin
                : bin.toFixed(1)
        ) + "K€";
    }

    return value + "€";
}

// Bütçe için
function money(value) {

    return Number(value || 0)
        .toLocaleString("tr-TR") + "€";
}

// 5M / 500K / 1000000
function parseMoney(text) {

    if (!text) return null;

    text = text
        .toLowerCase()
        .replace(/€/g, "")
        .replace(/\s/g, "")
        .replace(",", ".");

    let multiplier = 1;

    if (text.endsWith("m")) {

        multiplier = 1000000;
        text = text.slice(0, -1);

    } else if (text.endsWith("k")) {

        multiplier = 1000;
        text = text.slice(0, -1);
    }

    const number = Number(text);

    if (!Number.isFinite(number) || number <= 0) {
        return null;
    }

    return Math.floor(
        number * multiplier
    );
}

// dakika / saniye / saat
function duration(text) {

    if (!text) return null;

    const match =
        text.match(
            /^(\d+)\s*(saniye|sn|dakika|dk|saat|sa)$/i
        );

    if (!match) return null;

    const amount =
        Number(match[1]);

    const unit =
        match[2].toLowerCase();

    if (
        unit === "saniye" ||
        unit === "sn"
    ) {
        return amount * 1000;
    }

    if (
        unit === "dakika" ||
        unit === "dk"
    ) {
        return amount * 60000;
    }

    return amount * 3600000;
}

function getOwnedTeam(userId) {

    for (
        const name of Object.keys(data.teams)
    ) {

        if (
            data.teams[name].owner === userId
        ) {

            return {
                name,
                team: data.teams[name]
            };
        }
    }

    return null;
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
    "PSG",
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
// BOT HAZIR
// =====================================================

client.once("ready", () => {

    console.log(
        "================================"
    );

    console.log(
        `✅ ${client.user.tag} aktif!`
    );

    console.log(
        "⚽ Legendary League"
    );

    console.log(
        "================================"
    );

    client.user.setActivity(
        "Legendary League ⚽"
    );
});

// =====================================================
// SUNUCUYA GİREN OYUNCU
// =====================================================

client.on(
    "guildMemberAdd",
    async member => {

        const channel =
            member.guild.channels.cache.get(
                CHANNEL.KAYIT
            );

        if (!channel) return;

        const embed =
            new EmbedBuilder()
                .setTitle(
                    "👤 Yeni Oyuncu Geldi!"
                )
                .setDescription(
                    `${member}\n\n` +
                    "Yeni oyuncu sunucuya katıldı.\n" +
                    "Kayıt işlemiyle ilgilenin."
                )
                .setThumbnail(
                    member.user.displayAvatarURL({
                        dynamic: true
                    })
                )
                .setColor(0x3498db)
                .setTimestamp();

        await channel.send({

            content:
                `<@&${ROLE.KAYIT_YETKILISI}> Yeni oyuncu geldi ilgilenin! ${member}`,

            embeds: [embed]

        }).catch(() => {});
    }
);

// =====================================================
// KOMUTLAR
// =====================================================

client.on(
    "messageCreate",
    async message => {

        if (message.author.bot) return;
        if (!message.guild) return;

        if (
            !message.content.startsWith(
                PREFIX
            )
        ) return;

        const args =
            message.content
                .slice(PREFIX.length)
                .trim()
                .split(/\s+/);

        const command =
            args.shift().toLowerCase();

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
                                "⚽ Legendary League"
                            )
                            .setColor(0x3498db)
                            .setDescription(

                                "**📝 Kayıt**\n" +
                                "`.k @oyuncu İsim`\n\n" +

                                "**⚽ Oyuncu**\n" +
                                "`.ant`\n" +
                                "`.antrenman`\n" +
                                "`.pen`\n" +
                                "`.penaltı`\n" +
                                "`.dver @oyuncu 5M`\n\n" +

                                "**🏟️ Takım**\n" +
                                "`.takım Galatasaray`\n" +
                                "`.takımım`\n" +
                                "`.kadro`\n" +
                                "`.kadroekle @oyuncu`\n" +
                                "`.kadroçıkar @oyuncu`\n" +
                                "`.transfer @oyuncu`\n\n" +

                                "**⚽ Maç**\n" +
                                "`.maç @takım1 @takım2`\n\n" +

                                "**📢 KAP**\n" +
                                "`.kap @oyuncu`\n\n" +

                                "**💰 Bütçe**\n" +
                                "`.bütçe`\n" +
                                "`.para @oyuncu 5M`\n" +
                                "`.paraekle @oyuncu 5M`\n" +
                                "`.parasil @oyuncu 5M`\n\n" +

                                "**🎉 Çekiliş**\n" +
                                "`.çekiliş 5M€ 5 saat`\n\n" +

                                "**📩 DM**\n" +
                                "`.dm @oyuncu mesaj`\n\n" +

                                "**🛡️ Moderasyon**\n" +
                                "`.kick @oyuncu`\n" +
                                "`.ban @oyuncu`\n" +
                                "`.mute @oyuncu 10 dakika`\n" +
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
            // KAYIT
            // =================================================

            if (
                command === "k" ||
                command === "kayıt" ||
                command === "kayit"
            ) {

                if (
                    !isAdmin(member) &&
                    !member.roles.cache.has(
                        ROLE.KAYIT_YETKILISI
                    )
                ) {

                    return message.reply(
                        "❌ Kayıt Yetkilisi değilsin."
                    );
                }

                const target =
                    message.mentions.members.first();

                if (!target) {

                    return message.reply(
                        "❌ `.k @oyuncu İsim`"
                    );
                }

                const name =
                    args
                        .filter(
                            x =>
                                x !== `<@${target.id}>` &&
                                x !== `<@!${target.id}>`
                        )
                        .join(" ")
                        .trim();

                if (!name) {

                    return message.reply(
                        "❌ Oyuncu adını yaz."
                    );
                }

                getPlayer(target.id)
                    .registered = true;

                await target
                    .setNickname(name)
                    .catch(() => {});

                const kayitsiz =
                    message.guild.roles.cache.get(
                        ROLE.KAYITSIZ
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
                                    `td_${target.id}`
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
                                    `futbolcu_${target.id}`
                                )
                                .setLabel(
                                    "Futbolcu"
                                )
                                .setEmoji("⚽")
                                .setStyle(
                                    ButtonStyle.Success
                                )
                        );

                save();

                return message.channel.send({

                    embeds: [

                        new EmbedBuilder()
                            .setTitle(
                                "📝 Oyuncu Kaydı"
                            )
                            .setDescription(
                                `${target}\n\n` +
                                `👤 İsim: **${name}**\n\n` +
                                "Oyuncunun rolünü seç:"
                            )
                            .setColor(0x3498db)
                    ],

                    components: [row]
                });
            }

            // =================================================
            // DEĞER
            // =================================================

            if (command === "dver") {

                if (!isAdmin(member)) {

                    return message.reply(
                        "❌ Sadece yönetici kullanabilir."
                    );
                }

                const target =
                    message.mentions.members.first();

                if (!target) {

                    return message.reply(
                        "❌ `.dver @oyuncu 5M`"
                    );
                }

                const amountText =
                    args
                        .filter(
                            x =>
                                x !== `<@${target.id}>` &&
                                x !== `<@!${target.id}>`
                        )
                        .join("")
                        .replace(/€/g, "")
                        .trim();

                const amount =
                    parseMoney(amountText);

                if (!amount) {

                    return message.reply(
                        "❌ Geçerli değer gir.\n" +
                        "Örnek: `.dver @oyuncu 5M`"
                    );
                }

                const p =
                    getPlayer(target.id);

                // =========================================
                // ASIL DÜZELTME
                // =========================================

                p.value =
                    Number(p.value || 0) +
                    amount;

                const nickname =
                    target.nickname ||
                    target.user.username;

                const parts =
                    nickname.split("|");

                if (parts.length >= 2) {

                    parts[
                        parts.length - 1
                    ] =
                        ` ${formatValue(p.value)}`;

                    await target
                        .setNickname(
                            parts.join("|").trim()
                        )
                        .catch(() => {});
                } else {

                    await target
                        .setNickname(
                            `${nickname} | ${formatValue(p.value)}`
                        )
                        .catch(() => {});
                }

                save();

                return message.reply(
                    `✅ ${target} oyuncusuna **${formatValue(amount)}** eklendi.\n` +
                    `💰 Yeni değeri: **${formatValue(p.value)}**`
                );
            }

            // =================================================
            // ANTRENMAN
            // =================================================

            if (
                command === "ant" ||
                command === "antrenman"
            ) {

                const p =
                    getPlayer(member.id);

                if (!p.registered) {

                    return message.reply(
                        "❌ Önce kayıt olmalısın."
                    );
                }

                p.training++;

                if (p.training >= 10) {

                    p.training = 0;
                    p.value += 3000000;

                    save();

                    return message.reply(
                        "🏋️ **10/10 ANTRENMAN!**\n" +
                        "💰 Değerine **+3M€** eklendi.\n" +
                        `📊 Yeni değer: **${formatValue(p.value)}**`
                    );
                }

                save();

                return message.reply(
                    `🏋️ Antrenman: **${p.training}/10**`
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

                const p =
                    getPlayer(member.id);

                if (!p.registered) {

                    return message.reply(
                        "❌ Önce kayıt olmalısın."
                    );
                }

                const goal =
                    Math.random() < 0.7;

                if (goal) {

                    p.goals++;
                    p.value += 2000000;

                    save();

                    return message.reply(
                        "⚽ **GOOOOOL!**\n" +
                        "💰 Değerine **+2M€** eklendi.\n" +
                        `📊 Yeni değer: **${formatValue(p.value)}**`
                    );
                }

                return message.reply(
                    "🥅 **PENALTI KAÇTI!**"
                );
            }

            // =================================================
            // BÜTÇE
            // =================================================

            if (
                command === "bütçe" ||
                command === "butce"
            ) {

                const p =
                    getPlayer(member.id);

                return message.reply(
                    `💰 Bütçen: **${money(p.budget)}**`
                );
            }

            // =================================================
            // PARA GÖNDER
            // =================================================

            if (command === "para") {

                const target =
                    message.mentions.members.first();

                const amount =
                    parseMoney(args[1]);

                if (!target || !amount) {

                    return message.reply(
                        "❌ `.para @oyuncu 5M`"
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
                        "❌ Yeterli bütçen yok."
                    );
                }

                sender.budget -= amount;
                receiver.budget += amount;

                save();

                return message.reply(
                    `💸 ${target} kişisine **${money(amount)}** gönderildi.`
                );
            }

            // =================================================
            // PARA EKLE
            // =================================================

            if (command === "paraekle") {

                if (!isAdmin(member)) {

                    return message.reply(
                        "❌ Sadece yönetici kullanabilir."
                    );
                }

                const target =
                    message.mentions.members.first();

                const amount =
                    parseMoney(args[1]);

                if (!target || !amount) {

                    return message.reply(
                        "❌ `.paraekle @oyuncu 5M`"
                    );
                }

                const p =
                    getPlayer(target.id);

                p.budget += amount;

                save();

                return message.reply(
                    `💰 ${target} bütçesine **${money(amount)}** eklendi.`
                );
            }

            // =================================================
            // PARA SİL
            // =================================================

            if (command === "parasil") {

                if (!isAdmin(member)) {

                    return message.reply(
                        "❌ Sadece yönetici kullanabilir."
                    );
                }

                const target =
                    message.mentions.members.first();

                const amount =
                    parseMoney(args[1]);

                if (!target || !amount) {

                    return message.reply(
                        "❌ `.parasil @oyuncu 5M`"
                    );
                }

                const p =
                    getPlayer(target.id);

                p.budget =
                    Math.max(
                        0,
                        p.budget - amount
                    );

                save();

                return message.reply(
                    `🗑️ ${target} hesabından **${money(amount)}** silindi.`
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
                    !member.roles.cache.has(
                        ROLE.TEKNIK_DIREKTOR
                    ) &&
                    !isAdmin(member)
                ) {

                    return message.reply(
                        "❌ Sadece Teknik Direktör kullanabilir."
                    );
                }

                if (getOwnedTeam(member.id)) {

                    return message.reply(
                        "❌ Zaten bir takımın var."
                    );
                }

                const teamName =
                    args.join(" ");

                const realTeam =
                    REAL_TEAMS.find(
                        x =>
                            x.toLowerCase() ===
                            teamName.toLowerCase()
                    );

                if (!realTeam) {

                    return message.reply(
                        "❌ Geçerli gerçek takım seç.\n\n" +
                        REAL_TEAMS.join(", ")
                    );
                }

                if (data.teams[realTeam]) {

                    return message.reply(
                        "❌ Bu takım zaten alınmış."
                    );
                }

                const role =
                    await message.guild.roles.create({
                        name: realTeam
                    });

                await member.roles
                    .add(role)
                    .catch(() => {});

                data.teams[realTeam] = {

                    owner: member.id,
                    role: role.id,
                    budget: 100000000,
                    squad: []
                };

                getPlayer(member.id).team =
                    realTeam;

                save();

                return message.reply(
                    `🏟️ **${realTeam}** takımın oluşturuldu!\n` +
                    `👔 Teknik Direktör: ${member}\n` +
                    `💰 Takım bütçesi: **100M€**`
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
                        "❌ Bir takımın yok."
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
                                `💰 Bütçe: **${money(result.team.budget)}**\n` +
                                `👥 Kadro: **${result.team.squad.length} oyuncu**`
                            )
                            .setColor(0x3498db)
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
                        "📋 Kadro boş."
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
                            .setDescription(list)
                            .setColor(0x2ecc71)
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
                    !member.roles.cache.has(
                        ROLE.TEKNIK_DIREKTOR
                    ) &&
                    !isAdmin(member)
                ) {

                    return message.reply(
                        "❌ Sadece Teknik Direktör kullanabilir."
                    );
                }

                const team =
                    getOwnedTeam(member.id);

                const target =
                    message.mentions.members.first();

                if (!team || !target) {

                    return message.reply(
                        "❌ `.kadroekle @oyuncu`"
                    );
                }

                if (
                    !team.team.squad.includes(
                        target.id
                    )
                ) {

                    team.team.squad.push(
                        target.id
                    );
                }

                getPlayer(target.id).team =
                    team.name;

                save();

                return message.reply(
                    `✅ ${target} kadroya eklendi.`
                );
            }

            // =================================================
            // KADRO ÇIKAR
            // =================================================

            if (
                command === "kadroçıkar" ||
                command === "kadrocikar"
            ) {

                if (
                    !member.roles.cache.has(
                        ROLE.TEKNIK_DIREKTOR
                    ) &&
                    !isAdmin(member)
                ) {

                    return message.reply(
                        "❌ Sadece Teknik Direktör kullanabilir."
                    );
                }

                const team =
                    getOwnedTeam(member.id);

                const target =
                    message.mentions.members.first();

                if (!team || !target) {

                    return message.reply(
                        "❌ `.kadroçıkar @oyuncu`"
                    );
                }

                team.team.squad =
                    team.team.squad.filter(
                        id =>
                            id !== target.id
                    );

                getPlayer(target.id).team =
                    null;

                save();

                return message.reply(
                    `✅ ${target} kadrodan çıkarıldı.`
                );
            }

            // =================================================
            // TRANSFER
            // =================================================

            if (command === "transfer") {

                if (
                    !member.roles.cache.has(
                        ROLE.TEKNIK_DIREKTOR
                    ) &&
                    !isAdmin(member)
                ) {

                    return message.reply(
                        "❌ Sadece Teknik Direktör kullanabilir."
                    );
                }

                const team =
                    getOwnedTeam(member.id);

                const target =
                    message.mentions.members.first();

                if (!team || !target) {

                    return message.reply(
                        "❌ `.transfer @oyuncu`"
                    );
                }

                const p =
                    getPlayer(target.id);

                if (p.team) {

                    const oldTeam =
                        data.teams[p.team];

                    if (oldTeam) {

                        oldTeam.squad =
                            oldTeam.squad.filter(
                                id =>
                                    id !== target.id
                            );
                    }
                }

                if (
                    !team.team.squad.includes(
                        target.id
                    )
                ) {

                    team.team.squad.push(
                        target.id
                    );
                }

                p.team =
                    team.name;

                save();

                return message.reply(
                    `🔄 ${target}, **${team.name}** takımına transfer edildi.`
                );
            }

            // =================================================
            // KAP
            // =================================================

            if (command === "kap") {

                if (
                    !member.roles.cache.has(
                        ROLE.TEKNIK_DIREKTOR
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

                if (!target || !team) {

                    return message.reply(
                        "❌ `.kap @oyuncu`"
                    );
                }

                const p =
                    getPlayer(target.id);

                return message.channel.send({

                    embeds: [

                        new EmbedBuilder()
                            .setTitle(
                                "📢 KAP FORMU"
                            )
                            .setDescription(
                                `👤 Oyuncu: ${target}\n` +
                                `🏟️ Takım: **${team.name}**\n` +
                                `💰 Oyuncu Değeri: **${formatValue(p.value)}**\n\n` +
                                `👔 Teknik Direktör: ${member}`
                            )
                            .setThumbnail(
                                target.user.displayAvatarURL()
                            )
                            .setColor(0x3498db)
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

                const mentions =
                    [
                        ...message.mentions.members.values()
                    ];

                if (mentions.length !== 2) {

                    return message.reply(
                        "❌ Kullanım:\n" +
                        "`.maç @takım1 @takım2`"
                    );
                }

                const team1 =
                    getOwnedTeam(
                        mentions[0].id
                    );

                const team2 =
                    getOwnedTeam(
                        mentions[1].id
                    );

                if (!team1 || !team2) {

                    return message.reply(
                        "❌ Etiketlenen kişilerin takımları olmalı."
                    );
                }

                let score1 = 0;
                let score2 = 0;

                let minute = 0;

                const events = [

                    "⚡ Hızlı hücum!",
                    "🎯 Şut çekildi!",
                    "🧤 Kaleci kurtardı!",
                    "🏃 Kanattan bindirme!",
                    "🛡️ Savunma araya girdi!",
                    "🔥 Tempo yükseldi!",
                    "🎯 Tehlikeli orta!",
                    "⚔️ Orta saha mücadelesi!",
                    "🚀 Kontra atak!",
                    "👏 Tribünler ayağa kalktı!",
                    "🧠 Taktik değişikliği!"
                ];

                const msg =
                    await message.channel.send({

                        embeds: [

                            new EmbedBuilder()
                                .setTitle(
                                    `🏟️ ${team1.name} 🆚 ${team2.name}`
                                )
                                .setDescription(
                                    "🔔 **MAÇ BAŞLADI!**\n\n" +
                                    `🔵 ${team1.name} **0 - 0** ${team2.name} 🔴\n\n` +
                                    "⏱️ 1'"
                                )
                                .setColor(0x3498db)
                        ]
                    });

                const interval =
                    setInterval(
                        async () => {

                            minute++;

                            let event;

                            if (
                                Math.random() < 0.13
                            ) {

                                if (
                                    Math.random() < 0.5
                                ) {

                                    score1++;

                                    event =
                                        `🚨 **GOOOL!** ${team1.name} golü buldu!`;

                                } else {

                                    score2++;

                                    event =
                                        `🚨 **GOOOL!** ${team2.name} golü buldu!`;
                                }

                            } else {

                                event =
                                    events[
                                        Math.floor(
                                            Math.random() *
                                            events.length
                                        )
                                    ];
                            }

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
                                        `🏆 **${team1.name} KAZANDI!**`;

                                } else if (
                                    score2 > score1
                                ) {

                                    result =
                                        `🏆 **${team2.name} KAZANDI!**`;

                                } else {

                                    result =
                                        "🤝 **MAÇ BERABERE!**";
                                }

                                return msg.edit({

                                    embeds: [

                                        new EmbedBuilder()
                                            .setTitle(
                                                "🏁 MAÇ BİTTİ"
                                            )
                                            .setDescription(
                                                `🏟️ ${team1.name} 🆚 ${team2.name}\n\n` +
                                                `# ${score1} - ${score2}\n\n` +
                                                result +
                                                "\n\n⏱️ 90+4'"
                                            )
                                            .setColor(0xe67e22)
                                    ]
                                });
                            }

                            await msg.edit({

                                embeds: [

                                    new EmbedBuilder()
                                        .setTitle(
                                            `⚽ ${team1.name} 🆚 ${team2.name}`
                                        )
                                        .setDescription(
                                            `${event}\n\n` +
                                            `📊 **${score1} - ${score2}**\n\n` +
                                            `⏱️ ${minute}'`
                                        )
                                        .setColor(0x3498db)
                                ]
                            }).catch(() => {});

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

                if (!isAdmin(member)) {

                    return message.reply(
                        "❌ Sadece yönetici kullanabilir."
                    );
                }

                const prize =
                    args[0];

                const time =
                    duration(
                        args.slice(1).join(" ")
                    );

                if (!prize || !time) {

                    return message.reply(
                        "❌ Örnek:\n" +
                        "`.çekiliş 5M€ 5 saat`\n" +
                        "`.çekiliş 500K€ 10 dakika`\n" +
                        "`.çekiliş 100K€ 30 saniye`"
                    );
                }

                const id =
                    Date.now().toString();

                data.giveaways[id] = {
                    prize,
                    users: []
                };

                save();

                const row =
                    new ActionRowBuilder()
                        .addComponents(

                            new ButtonBuilder()
                                .setCustomId(
                                    `cekilis_${id}`
                                )
                                .setLabel(
                                    "Katıl"
                                )
                                .setEmoji("🎉")
                                .setStyle(
                                    ButtonStyle.Primary
                                )
                        );

                const msg =
                    await message.channel.send({

                        embeds: [

                            new EmbedBuilder()
                                .setTitle(
                                    "🎉 ÇEKİLİŞ"
                                )
                                .setDescription(
                                    `🎁 Ödül: **${prize}**\n\n` +
                                    "🎉 Katılmak için butona bas!\n\n" +
                                    `⏰ Bitiş: <t:${Math.floor(
                                        (Date.now() + time) /
                                        1000
                                    )}:R>`
                                )
                                .setColor(0xf1c40f)
                        ],

                        components: [row]
                    });

                setTimeout(
                    async () => {

                        const giveaway =
                            data.giveaways[id];

                        if (!giveaway) return;

                        if (
                            giveaway.users.length === 0
                        ) {

                            await msg.channel.send(
                                `🎉 **${prize}** çekilişi bitti fakat katılım olmadı.`
                            );

                        } else {

                            const winner =
                                giveaway.users[
                                    Math.floor(
                                        Math.random() *
                                        giveaway.users.length
                                    )
                                ];

                            await msg.channel.send(
                                `🎉 **ÇEKİLİŞ BİTTİ!**\n\n` +
                                `🎁 Ödül: **${prize}**\n` +
                                `🏆 Kazanan: <@${winner}>`
                            );
                        }

                        delete data.giveaways[id];

                        save();

                    },
                    time
                );

                return;
            }

            // =================================================
            // DM
            // =================================================

            if (command === "dm") {

                if (!isAdmin(member)) {

                    return message.reply(
                        "❌ Sadece yönetici kullanabilir."
                    );
                }

                const target =
                    message.mentions.members.first();

                if (!target) {

                    return message.reply(
                        "❌ `.dm @oyuncu mesaj`"
                    );
                }

                const text =
                    args
                        .filter(
                            x =>
                                x !== `<@${target.id}>` &&
                                x !== `<@!${target.id}>`
                        )
                        .join(" ");

                if (!text) {

                    return message.reply(
                        "❌ Mesaj yaz."
                    );
                }

                try {

                    await target.send({

                        embeds: [

                            new EmbedBuilder()
                                .setTitle(
                                    "📩 Legendary League"
                                )
                                .setDescription(text)
                                .setColor(0x3498db)
                                .setTimestamp()
                        ]
                    });

                    return message.reply(
                        `✅ ${target} kişisine DM gönderildi.`
                    );

                } catch {

                    return message.reply(
                        "❌ Oyuncuya DM gönderilemedi."
                    );
                }
            }

            // =================================================
            // KICK
            // =================================================

            if (command === "kick") {

                if (!isAdmin(member)) {

                    return message.reply(
                        "❌ Sadece yönetici kullanabilir."
                    );
                }

                const target =
                    message.mentions.members.first();

                if (!target) {

                    return message.reply(
                        "❌ `.kick @oyuncu`"
                    );
                }

                if (!target.kickable) {

                    return message.reply(
                        "❌ Bu oyuncuyu kickleyemiyorum."
                    );
                }

                await target.kick();

                return message.reply(
                    `👢 ${target.user.tag} kicklendi.`
                );
            }

            // =================================================
            // BAN
            // =================================================

            if (command === "ban") {

                if (!isAdmin(member)) {

                    return message.reply(
                        "❌ Sadece yönetici kullanabilir."
                    );
                }

                const target =
                    message.mentions.members.first();

                if (!target) {

                    return message.reply(
                        "❌ `.ban @oyuncu`"
                    );
                }

                if (!target.bannable) {

                    return message.reply(
                        "❌ Bu oyuncuyu banlayamıyorum."
                    );
                }

                await target.ban();

                return message.reply(
                    `🔨 ${target.user.tag} banlandı.`
                );
            }

            // =================================================
            // MUTE
            // =================================================

            if (command === "mute") {

                if (!isAdmin(member)) {

                    return message.reply(
                        "❌ Sadece yönetici kullanabilir."
                    );
                }

                const target =
                    message.mentions.members.first();

                const time =
                    duration(args[1]);

                if (!target || !time) {

                    return message.reply(
                        "❌ `.mute @oyuncu 10 dakika`"
                    );
                }

                await target.timeout(
                    time
                );

                return message.reply(
                    `🔇 ${target} susturuldu.`
                );
            }

            // =================================================
            // UNMUTE
            // =================================================

            if (command === "unmute") {

                if (!isAdmin(member)) {

                    return message.reply(
                        "❌ Sadece yönetici kullanabilir."
                    );
                }

                const target =
                    message.mentions.members.first();

                if (!target) {

                    return message.reply(
                        "❌ `.unmute @oyuncu`"
                    );
                }

                await target.timeout(null);

                return message.reply(
                    `🔊 ${target} susturması kaldırıldı.`
                );
            }

            // =================================================
            // SİL
            // =================================================

            if (command === "sil") {

                if (!isAdmin(member)) {

                    return message.reply(
                        "❌ Sadece yönetici kullanabilir."
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
                        "❌ 1-100 arasında sayı yaz."
                    );
                }

                await message.channel.bulkDelete(
                    amount + 1,
                    true
                );

                return;
            }

            // =================================================
            // KİLİT
            // =================================================

            if (command === "kilit") {

                if (!isAdmin(member)) {

                    return message.reply(
                        "❌ Sadece yönetici kullanabilir."
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
            // AÇ
            // =================================================

            if (
                command === "aç" ||
                command === "ac"
            ) {

                if (!isAdmin(member)) {

                    return message.reply(
                        "❌ Sadece yönetici kullanabilir."
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
                    "🔓 Kanal açıldı."
                );
            }

            // =================================================
            // EMBED
            // =================================================

            if (command === "embed") {

                if (!isAdmin(member)) {

                    return message.reply(
                        "❌ Sadece yönetici kullanabilir."
                    );
                }

                const text =
                    args.join(" ");

                if (!text) {

                    return message.reply(
                        "❌ `.embed Mesajınız`"
                    );
                }

                await message.channel.send({

                    embeds: [

                        new EmbedBuilder()
                            .setDescription(text)
                            .setColor(0x3498db)
                            .setTimestamp()
                    ]
                });

                await message.delete()
                    .catch(() => {});

                return;
            }

        } catch (error) {

            console.error(
                "Komut hatası:",
                error
            );

            message.reply(
                "❌ İşlem sırasında hata oluştu."
            ).catch(() => {});
        }
    }
);

// =====================================================
// BUTONLAR
// =====================================================

client.on(
    "interactionCreate",
    async interaction => {

        if (!interaction.isButton()) return;

        try {

            // =================================================
            // TEKNİK DİREKTÖR
            // =================================================

            if (
                interaction.customId
                    .startsWith("td_")
            ) {

                if (
                    !isAdmin(interaction.member) &&
                    !interaction.member.roles.cache.has(
                        ROLE.KAYIT_YETKILISI
                    )
                ) {

                    return interaction.reply({
                        content:
                            "❌ Kayıt Yetkilisi değilsin.",
                        ephemeral: true
                    });
                }

                const id =
                    interaction.customId
                        .split("_")[1];

                const target =
                    await interaction.guild.members
                        .fetch(id)
                        .catch(() => null);

                if (!target) {

                    return interaction.reply({
                        content:
                            "❌ Oyuncu bulunamadı.",
                        ephemeral: true
                    });
                }

                const kayitsiz =
                    interaction.guild.roles.cache.get(
                        ROLE.KAYITSIZ
                    );

                const futbolcu =
                    interaction.guild.roles.cache.get(
                        ROLE.FUTBOLCU
                    );

                const td =
                    interaction.guild.roles.cache.get(
                        ROLE.TEKNIK_DIREKTOR
                    );

                if (kayitsiz) {

                    await target.roles
                        .remove(kayitsiz)
                        .catch(() => {});
                }

                if (futbolcu) {

                    await target.roles
                        .remove(futbolcu)
                        .catch(() => {});
                }

                if (td) {

                    await target.roles
                        .add(td)
                        .catch(() => {});
                }

                getPlayer(target.id)
                    .registered = true;

                save();

                const sohbet =
                    interaction.guild.channels.cache.get(
                        CHANNEL.SOHBET
                    );

                if (sohbet) {

                    await sohbet.send({

                        content:
                            `${target}`,

                        embeds: [

                            new EmbedBuilder()
                                .setTitle(
                                    "🎉 Yeni Oyuncu Kayıt Oldu!"
                                )
                                .setDescription(
                                    `${target} adlı oyuncumuz kayıt oldu!\n\n` +
                                    "👔 **Teknik Direktör** olarak kayıt oldu.\n\n" +
                                    "⚽ Legendary League ailesine hoş geldin!"
                                )
                                .setThumbnail(
                                    target.user.displayAvatarURL({
                                        dynamic: true
                                    })
                                )
                                .setColor(0xf1c40f)
                                .setTimestamp()
                        ]
                    }).catch(() => {});
                }

                return interaction.update({

                    embeds: [

                        new EmbedBuilder()
                            .setTitle(
                                "✅ Kayıt Tamamlandı"
                            )
                            .setDescription(
                                `${target}\n\n` +
                                "👔 Teknik Direktör rolü verildi.\n" +
                                "🚫 Kayıtsız rolü kaldırıldı."
                            )
                            .setColor(0xf1c40f)
                    ],

                    components: []
                });
            }

            // =================================================
            // FUTBOLCU
            // =================================================

            if (
                interaction.customId
                    .startsWith("futbolcu_")
            ) {

                if (
                    !isAdmin(interaction.member) &&
                    !interaction.member.roles.cache.has(
                        ROLE.KAYIT_YETKILISI
                    )
                ) {

                    return interaction.reply({
                        content:
                            "❌ Kayıt Yetkilisi değilsin.",
                        ephemeral: true
                    });
                }

                const id =
                    interaction.customId
                        .split("_")[1];

                const target =
                    await interaction.guild.members
                        .fetch(id)
                        .catch(() => null);

                if (!target) {

                    return interaction.reply({
                        content:
                            "❌ Oyuncu bulunamadı.",
                        ephemeral: true
                    });
                }

                const kayitsiz =
                    interaction.guild.roles.cache.get(
                        ROLE.KAYITSIZ
                    );

                const td =
                    interaction.guild.roles.cache.get(
                        ROLE.TEKNIK_DIREKTOR
                    );

                const futbolcu =
                    interaction.guild.roles.cache.get(
                        ROLE.FUTBOLCU
                    );

                if (kayitsiz) {

                    await target.roles
                        .remove(kayitsiz)
                        .catch(() => {});
                }

                if (td) {

                    await target.roles
                        .remove(td)
                        .catch(() => {});
                }

                if (futbolcu) {

                    await target.roles
                        .add(futbolcu)
                        .catch(() => {});
                }

                getPlayer(target.id)
                    .registered = true;

                save();

                const sohbet =
                    interaction.guild.channels.cache.get(
                        CHANNEL.SOHBET
                    );

                if (sohbet) {

                    await sohbet.send({

                        content:
                            `${target}`,

                        embeds: [

                            new EmbedBuilder()
                                .setTitle(
                                    "🎉 Yeni Oyuncu Kayıt Oldu!"
                                )
                                .setDescription(
                                    `${target} adlı oyuncumuz kayıt oldu!\n\n` +
                                    "⚽ **Futbolcu** olarak kayıt oldu.\n\n" +
                                    "⚽ Legendary League ailesine hoş geldin!"
                                )
                                .setThumbnail(
                                    target.user.displayAvatarURL({
                                        dynamic: true
                                    })
                                )
                                .setColor(0x2ecc71)
                                .setTimestamp()
                        ]
                    }).catch(() => {});
                }

                return interaction.update({

                    embeds: [

                        new EmbedBuilder()
                            .setTitle(
                                "✅ Kayıt Tamamlandı"
                            )
                            .setDescription(
                                `${target}\n\n` +
                                "⚽ Futbolcu rolü verildi.\n" +
                                "🚫 Kayıtsız rolü kaldırıldı."
                            )
                            .setColor(0x2ecc71)
                    ],

                    components: []
                });
            }

            // =================================================
            // ÇEKİLİŞ BUTONU
            // =================================================

            if (
                interaction.customId
                    .startsWith("cekilis_")
            ) {

                const id =
                    interaction.customId
                        .split("_")[1];

                const giveaway =
                    data.giveaways[id];

                if (!giveaway) {

                    return interaction.reply({
                        content:
                            "❌ Bu çekiliş bitmiş.",
                        ephemeral: true
                    });
                }

                if (
                    giveaway.users.includes(
                        interaction.user.id
                    )
                ) {

                    return interaction.reply({
                        content:
                            "❌ Zaten katıldın.",
                        ephemeral: true
                    });
                }

                giveaway.users.push(
                    interaction.user.id
                );

                save();

                return interaction.reply({
                    content:
                        "🎉 Çekilişe katıldın!",
                    ephemeral: true
                });
            }

        } catch (error) {

            console.error(
                "Buton hatası:",
                error
            );

            if (
                !interaction.replied &&
                !interaction.deferred
            ) {

                interaction.reply({
                    content:
                        "❌ Bir hata oluştu.",
                    ephemeral: true
                }).catch(() => {});
            }
        }
    }
);

// =====================================================
// HATA KORUMASI
// =====================================================

process.on(
    "unhandledRejection",
    error => {
        console.error(
            "Unhandled Rejection:",
            error
        );
    }
);

process.on(
    "uncaughtException",
    error => {
        console.error(
            "Uncaught Exception:",
            error
        );
    }
);

// =====================================================
// TOKEN - EN SONDA
// =====================================================

if (!process.env.TOKEN) {

    console.error(
        "❌ TOKEN bulunamadı!"
    );

    console.error(
        "Railway Variables kısmına TOKEN ekle."
    );

    process.exit(1);
}

client.login(
    process.env.TOKEN
)
.then(() => {

    console.log(
        "✅ Discord botuna giriş yapıldı!"
    );

})
.catch(error => {

    console.error(
        "❌ Discord login hatası:",
        error
    );

});
