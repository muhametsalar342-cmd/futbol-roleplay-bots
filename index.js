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
// VERİLER
// =====================================================

const players = new Map();
const teams = new Map();
const giveaways = new Map();

// Gerçek takım listesi
const REAL_TEAMS = [
    "Galatasaray",
    "Fenerbahçe",
    "Beşiktaş",
    "Trabzonspor",
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
// YARDIMCI
// =====================================================

function isAdmin(member) {
    return member.permissions.has(
        PermissionsBitField.Flags.Administrator
    );
}

function hasRole(member, roleId) {
    return member.roles.cache.has(roleId);
}

function money(amount) {
    return Number(amount || 0)
        .toLocaleString("tr-TR") + "€";
}

function random(min, max) {
    return Math.floor(
        Math.random() * (max - min + 1)
    ) + min;
}

function getPlayer(id) {
    if (!players.has(id)) {
        players.set(id, {
            registered: false,
            value: 1000000,
            training: 0,
            goals: 0,
            budget: 0,
            team: null
        });
    }

    return players.get(id);
}

function getOwnedTeam(userId) {
    for (const [name, team] of teams) {
        if (team.owner === userId) {
            return {
                name,
                team
            };
        }
    }

    return null;
}

function parseDuration(text) {

    if (!text) return null;

    const match = text.match(
        /^(\d+)\s*(sn|saniye|s|dk|dakika|d|sa|saat|h)$/i
    );

    if (!match) return null;

    const value = Number(match[1]);
    const unit = match[2].toLowerCase();

    if (
        unit === "sn" ||
        unit === "saniye" ||
        unit === "s"
    ) {
        return value * 1000;
    }

    if (
        unit === "dk" ||
        unit === "dakika" ||
        unit === "d"
    ) {
        return value * 60 * 1000;
    }

    return value * 60 * 60 * 1000;
}

// =====================================================
// BOT HAZIR
// =====================================================

client.once("ready", () => {

    console.log("--------------------------------");
    console.log(`✅ Bot aktif: ${client.user.tag}`);
    console.log("⚽ Legendary League Bot hazır!");
    console.log("--------------------------------");

    client.user.setActivity(
        "Legendary League ⚽"
    );
});

// =====================================================
// SUNUCUYA GİRİŞ
// =====================================================

client.on("guildMemberAdd", async member => {

    try {

        const channel =
            member.guild.channels.cache.get(
                CHANNELS.KAYIT
            );

        if (!channel) return;

        const embed =
            new EmbedBuilder()
                .setTitle(
                    "👤 Yeni Oyuncu Geldi!"
                )
                .setDescription(
                    `${member} sunucuya yeni katıldı!\n\n` +
                    `📋 Kayıt yetkililerinin ilgilenmesi gerekiyor.`
                )
                .setThumbnail(
                    member.user.displayAvatarURL()
                )
                .setColor(0x3498db)
                .setTimestamp();

        await channel.send({
            content:
                `<@&${ROLES.KAYIT}> Yeni oyuncu geldi ilgilenin! ${member}`,
            embeds: [embed]
        });

    } catch (error) {
        console.error(
            "Giriş sistemi:",
            error
        );
    }
});

// =====================================================
// MESAJLAR
// =====================================================

client.on("messageCreate", async message => {

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

    const member =
        message.member;

    try {

        // =================================================
        // YARDIM
        // =================================================

        if (
            command === "yardım" ||
            command === "yardim" ||
            command === "help"
        ) {

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(
                            "⚽ Legendary League Komutları"
                        )
                        .setDescription(
                            "**📝 Kayıt**\n" +
                            "`.k @oyuncu isim`\n\n" +

                            "**⚽ Futbol**\n" +
                            "`.ant`\n" +
                            "`.pen`\n" +
                            "`.maç @takım1 @takım2`\n" +
                            "`.kap @oyuncu`\n\n" +

                            "**💰 Ekonomi**\n" +
                            "`.bütçe`\n" +
                            "`.para @oyuncu miktar`\n" +
                            "`.parasil @oyuncu miktar`\n" +
                            "`.dver @oyuncu miktar`\n\n" +

                            "**🏟️ Takım**\n" +
                            "`.takım Galatasaray`\n" +
                            "`.takımım`\n" +
                            "`.kadro`\n" +
                            "`.kadroekle @oyuncu`\n" +
                            "`.kadroçıkar @oyuncu`\n" +
                            "`.transfer @oyuncu`\n\n" +

                            "**🎉 Çekiliş**\n" +
                            "`.çekiliş 5M€ 5 saat`\n\n" +

                            "**🛡️ Moderasyon**\n" +
                            "`.kick @oyuncu`\n" +
                            "`.ban @oyuncu`\n" +
                            "`.mute @oyuncu 10dk`\n" +
                            "`.unmute @oyuncu`\n" +
                            "`.sil 10`\n" +
                            "`.kilit`\n" +
                            "`.aç`"
                        )
                        .setColor(0x2ecc71)
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
                !hasRole(member, ROLES.KAYIT) &&
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
                            !x.includes(target.id)
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

            player.registered = true;

            try {
                await target.setNickname(name);
            } catch {}

            const kayitsiz =
                message.guild.roles.cache.get(
                    ROLES.KAYITSIZ
                );

            if (kayitsiz) {
                await target.roles.remove(
                    kayitsiz
                ).catch(() => {});
            }

            const row =
                new ActionRowBuilder()
                    .addComponents(

                        new ButtonBuilder()
                            .setCustomId(
                                `kayit_td_${target.id}`
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
                                `kayit_futbolcu_${target.id}`
                            )
                            .setLabel(
                                "Futbolcu"
                            )
                            .setEmoji("⚽")
                            .setStyle(
                                ButtonStyle.Success
                            )
                    );

            const embed =
                new EmbedBuilder()
                    .setTitle(
                        "📝 Kayıt İşlemi"
                    )
                    .setDescription(
                        `${target}\n\n` +
                        `👤 **İsim:** ${name}\n\n` +
                        `Aşağıdan oyuncunun rolünü seçin.`
                    )
                    .setColor(0x3498db)
                    .setThumbnail(
                        target.user.displayAvatarURL()
                    );

            await message.channel.send({
                embeds: [embed],
                components: [row]
            });

            return;
        }

        // =================================================
        // DEĞER
        // =================================================

        if (command === "dver") {

            if (
                !hasRole(member, ROLES.DEGER) &&
                !isAdmin(member)
            ) {
                return message.reply(
                    "❌ Sadece Değer Yetkilisi kullanabilir."
                );
            }

            const target =
                message.mentions.members.first();

            const amount =
                Number(args[1]);

            if (
                !target ||
                !amount ||
                amount <= 0
            ) {
                return message.reply(
                    "❌ Kullanım: `.dver @oyuncu 5`"
                );
            }

            const player =
                getPlayer(target.id);

            player.value +=
                amount * 1000000;

            try {

                const oldName =
                    target.displayName;

                const parts =
                    oldName.split("|");

                if (parts.length >= 2) {

                    parts[parts.length - 1] =
                        ` ${money(player.value)}`;

                    await target.setNickname(
                        parts.join("|").trim()
                    );

                } else {

                    await target.setNickname(
                        `${oldName} | ${money(player.value)}`
                    );
                }

            } catch {}

            return message.reply(
                `💰 ${target} yeni değeri: **${money(player.value)}**`
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

                player.value +=
                    3000000;

                return message.reply(
                    `🏋️ **10/10 ANTRENMAN!**\n` +
                    `💰 +3M€\n` +
                    `💎 Yeni değer: **${money(player.value)}**`
                );
            }

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

            const goal =
                Math.random() < 0.70;

            if (goal) {

                player.goals++;
                player.value +=
                    2000000;

                return message.reply(
                    `⚽ **GOOOL!**\n\n` +
                    `💰 +2M€\n` +
                    `💎 Yeni değer: **${money(player.value)}**`
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

            const player =
                getPlayer(member.id);

            return message.reply(
                `💰 Bütçen: **${money(player.budget)}**`
            );
        }

        // =================================================
        // PARA GÖNDER
        // =================================================

        if (command === "para") {

            const target =
                message.mentions.members.first();

            const amount =
                Number(args[1]);

            if (
                !target ||
                !amount ||
                amount <= 0
            ) {
                return message.reply(
                    "❌ `.para @oyuncu miktar`"
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
                    "❌ Yeterli paran yok."
                );
            }

            sender.budget -= amount;
            receiver.budget += amount;

            return message.reply(
                `💸 ${target} kişisine **${money(amount)}** gönderildi.`
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

            const amount =
                Number(args[1]);

            if (
                !target ||
                !amount
            ) {
                return message.reply(
                    "❌ `.parasil @oyuncu miktar`"
                );
            }

            const player =
                getPlayer(target.id);

            player.budget =
                Math.max(
                    0,
                    player.budget - amount
                );

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
                    "❌ Sadece 1 takım oluşturabilirsin."
                );
            }

            const name =
                args.join(" ").trim();

            const realTeam =
                REAL_TEAMS.find(
                    x =>
                        x.toLowerCase() ===
                        name.toLowerCase()
                );

            if (!realTeam) {
                return message.reply(
                    "❌ Sadece listedeki gerçek takımlardan birini seçebilirsin."
                );
            }

            if (teams.has(realTeam)) {
                return message.reply(
                    "❌ Bu takım zaten alınmış."
                );
            }

            try {

                const role =
                    await message.guild.roles.create({
                        name: realTeam,
                        reason:
                            "Legendary League takım sistemi"
                    });

                await member.roles.add(
                    role
                );

                teams.set(
                    realTeam,
                    {
                        owner: member.id,
                        roleId: role.id,
                        budget: 100000000,
                        squad: []
                    }
                );

                getPlayer(
                    member.id
                ).team = realTeam;

                return message.reply(
                    `🏟️ **${realTeam}** takımını aldın!\n` +
                    `👔 Teknik Direktör: ${member}\n` +
                    `💰 Takım bütçesi: **100M€**\n` +
                    `🎭 Takım rolü oluşturuldu.`
                );

            } catch (error) {

                console.error(error);

                return message.reply(
                    "❌ Takım oluşturulamadı."
                );
            }
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
                    "❌ Takımın yok."
                );
            }

            return message.reply(
                `🏟️ **${result.name}**\n\n` +
                `👔 Teknik Direktör: <@${result.team.owner}>\n` +
                `💰 Bütçe: **${money(result.team.budget)}**\n` +
                `👥 Kadro: **${result.team.squad.length} oyuncu**`
            );
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

            const squad =
                result.team.squad;

            if (!squad.length) {
                return message.reply(
                    "📋 Kadro boş."
                );
            }

            const list =
                squad
                    .map(
                        (id, index) =>
                            `${index + 1}. <@${id}>`
                    )
                    .join("\n");

            return message.reply(
                `📋 **${result.name} Kadrosu**\n\n${list}`
            );
        }

        // =================================================
        // KADRO EKLE
        // =================================================

        if (
            command === "kadroekle"
        ) {

            const result =
                getOwnedTeam(member.id);

            if (!result) {
                return message.reply(
                    "❌ Takımın yok."
                );
            }

            const target =
                message.mentions.members.first();

            if (!target) {
                return message.reply(
                    "❌ `.kadroekle @oyuncu`"
                );
            }

            if (
                !result.team.squad.includes(
                    target.id
                )
            ) {

                result.team.squad.push(
                    target.id
                );

                getPlayer(
                    target.id
                ).team = result.name;
            }

            return message.reply(
                `✅ ${target} kadroya eklendi.`
            );
        }

        // =================================================
        // KADRO ÇIKAR
        // =================================================

        if (
            command === "kadroçıkar" ||
            command === "kadrociKar"
        ) {

            const result =
                getOwnedTeam(member.id);

            if (!result) {
                return message.reply(
                    "❌ Takımın yok."
                );
            }

            const target =
                message.mentions.members.first();

            if (!target) {
                return message.reply(
                    "❌ `.kadroçıkar @oyuncu`"
                );
            }

            const index =
                result.team.squad.indexOf(
                    target.id
                );

            if (index === -1) {
                return message.reply(
                    "❌ Oyuncu kadroda değil."
                );
            }

            result.team.squad.splice(
                index,
                1
            );

            getPlayer(
                target.id
            ).team = null;

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

            if (!target) {
                return message.reply(
                    "❌ `.transfer @oyuncu`"
                );
            }

            const destination =
                getOwnedTeam(member.id);

            if (!destination) {
                return message.reply(
                    "❌ Önce takım oluşturmalısın."
                );
            }

            const player =
                getPlayer(target.id);

            if (player.team) {

                const oldTeam =
                    teams.get(player.team);

                if (oldTeam) {

                    const index =
                        oldTeam.squad.indexOf(
                            target.id
                        );

                    if (index !== -1) {
                        oldTeam.squad.splice(
                            index,
                            1
                        );
                    }
                }
            }

            destination.team.squad.push(
                target.id
            );

            player.team =
                destination.name;

            return message.reply(
                `🔄 ${target} **${destination.name}** takımına transfer edildi.`
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

            if (!target) {
                return message.reply(
                    "❌ `.kap @oyuncu`"
                );
            }

            const team =
                getOwnedTeam(member.id);

            if (!team) {
                return message.reply(
                    "❌ Önce takım oluşturmalısın."
                );
            }

            const player =
                getPlayer(target.id);

            const embed =
                new EmbedBuilder()
                    .setTitle(
                        "📢 KAP BİLDİRİMİ"
                    )
                    .setDescription(
                        `👤 **Oyuncu:** ${target}\n` +
                        `🏟️ **Yeni Takım:** ${team.name}\n` +
                        `💰 **Oyuncu Değeri:** ${money(player.value)}\n\n` +
                        `👔 **Teknik Direktör:** ${member}\n\n` +
                        `📋 Oyuncunun transferi hakkında KAP bildirimi yayınlanmıştır.`
                    )
                    .setColor(0x3498db)
                    .setThumbnail(
                        target.user.displayAvatarURL()
                    )
                    .setTimestamp();

            await message.channel.send({
                embeds: [embed]
            });

            return message.reply(
                `✅ ${target} için KAP oluşturuldu.`
            );
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

            if (mentions.length !== 2) {
                return message.reply(
                    "❌ Kullanım: `.maç @takım1 @takım2`"
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
                    "❌ Etiketlediğin Teknik Direktörlerin takımları olmalı."
                );
            }

            const team1 =
                first.name;

            const team2 =
                second.name;

            if (
                team1 === team2
            ) {
                return message.reply(
                    "❌ Aynı takım ile maç yapılamaz."
                );
            }

            let score1 = 0;
            let score2 = 0;
            let minute = 0;

            const events = [
                "⚡ Hızlı hücum başladı!",
                "🎯 Ceza sahası dışından şut!",
                "🧤 Kaleci kurtardı!",
                "🏃 Kanattan atak gelişiyor!",
                "🛡️ Savunma topu uzaklaştırdı!",
                "🔥 Müthiş bir tempo!",
                "⚔️ Orta sahada sert mücadele!",
                "🎯 Tehlikeli orta!",
                "🥅 Ceza sahasında karambol!",
                "🚀 Kontra atak!",
                "👏 Taraftarlar takımlarını destekliyor!"
            ];

            const embed =
                new EmbedBuilder()
                    .setTitle(
                        `⚽ ${team1} 🆚 ${team2}`
                    )
                    .setDescription(
                        `🏁 **MAÇ BAŞLADI!**\n\n` +
                        `**${team1}** 0 - 0 **${team2}**\n\n` +
                        `⏱️ 1'`
                    )
                    .setColor(0x2ecc71);

            const matchMessage =
                await message.channel.send({
                    embeds: [embed]
                });

            const interval =
                setInterval(
                    async () => {

                        minute++;

                        let text;

                        if (
                            Math.random() < 0.15
                        ) {

                            if (
                                Math.random() < 0.5
                            ) {

                                score1++;

                                text =
                                    `🚨 **GOOOOL!** ${team1} golü buldu!`;

                            } else {

                                score2++;

                                text =
                                    `🚨 **GOOOOL!** ${team2} golü buldu!`;
                            }

                        } else {

                            text =
                                events[
                                    random(
                                        0,
                                        events.length - 1
                                    )
                                ];
                        }

                        await matchMessage.edit({
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle(
                                        `⚽ ${team1} 🆚 ${team2}`
                                    )
                                    .setDescription(
                                        `${text}\n\n` +
                                        `📊 **${team1} ${score1} - ${score2} ${team2}**\n\n` +
                                        `⏱️ **${minute}'**`
                                    )
                                    .setColor(0x3498db)
                                    .setFooter({
                                        text:
                                            "Legendary League • Canlı Maç"
                                    })
                            ]
                        }).catch(() => {});

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
                                    `🏆 **${team1} kazandı!**`;
                            } else if (
                                score2 > score1
                            ) {
                                result =
                                    `🏆 **${team2} kazandı!**`;
                            } else {
                                result =
                                    "🤝 **Maç berabere bitti!**";
                            }

                            await matchMessage.edit({
                                embeds: [
                                    new EmbedBuilder()
                                        .setTitle(
                                            "🏁 MAÇ BİTTİ"
                                        )
                                        .setDescription(
                                            `⚽ **${team1} ${score1} - ${score2} ${team2}**\n\n` +
                                            result +
                                            `\n\n` +
                                            `⏱️ 90+${random(1,5)}'`
                                        )
                                        .setColor(0xe67e22)
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
                args.slice(1).join(" ");

            const duration =
                parseDuration(
                    durationText
                );

            if (
                !prize ||
                !duration
            ) {
                return message.reply(
                    "❌ Örnek: `.çekiliş 5M€ 5 saat`"
                );
            }

            const id =
                Date.now();

            giveaways.set(
                id,
                {
                    prize,
                    participants:
                        new Set()
                }
            );

            const row =
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(
                                `giveaway_${id}`
                            )
                            .setLabel(
                                "Katıl"
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
                            `🎉 Katılmak için butona bas!\n\n` +
                            `⏰ Bitiş: <t:${Math.floor((Date.now() + duration) / 1000)}:R>`
                        )
                        .setColor(0xf1c40f)
                ],
                components: [row]
            });

            setTimeout(
                async () => {

                    const giveaway =
                        giveaways.get(id);

                    if (!giveaway) return;

                    const participants =
                        [...giveaway.participants];

                    if (!participants.length) {

                        await message.channel.send(
                            `🎉 **${prize}** çekilişi bitti fakat katılımcı yok.`
                        );

                    } else {

                        const winner =
                            participants[
                                random(
                                    0,
                                    participants.length - 1
                                )
                            ];

                        await message.channel.send(
                            `🎉 **ÇEKİLİŞ BİTTİ!**\n\n` +
                            `🎁 Ödül: **${prize}**\n` +
                            `🏆 Kazanan: <@${winner}>`
                        );
                    }

                    giveaways.delete(id);

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

            if (!target.kickable) {
                return message.reply(
                    "❌ Bu oyuncuyu kickleyemiyorum."
                );
            }

            await target.kick(
                args.slice(1).join(" ") ||
                "Sebep belirtilmedi."
            );

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

            if (!target.bannable) {
                return message.reply(
                    "❌ Bu oyuncuyu banlayamıyorum."
                );
            }

            await target.ban({
                reason:
                    args.slice(1).join(" ") ||
                    "Sebep belirtilmedi."
            });

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
                    "❌ `.mute @oyuncu 10dk`"
                );
            }

            await target.timeout(
                duration,
                "Moderasyon"
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
                `🔊 ${target} mute kaldırıldı.`
            );
        }

        // =================================================
        // SİL
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
                    "❌ 1-100 arasında bir sayı yaz."
                );
            }

            await message.channel.bulkDelete(
                amount + 1,
                true
            );

            return;
        }

        // =================================================
        // KANAL KİLİT
        // =================================================

        if (command === "kilit") {

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
                "🔓 Kanal açıldı."
            );
        }

    } catch (error) {

        console.error(
            "Komut hatası:",
            error
        );

        if (!message.replied) {
            message.reply(
                "❌ İşlem sırasında hata oluştu."
            ).catch(() => {});
        }
    }
});

// =====================================================
// BUTONLAR
// =====================================================

client.on(
    "interactionCreate",
    async interaction => {

        if (!interaction.isButton()) return;

        try {

            // =================================================
            // ÇEKİLİŞ BUTONU
            // =================================================

            if (
                interaction.customId
                    .startsWith("giveaway_")
            ) {

                const id =
                    Number(
                        interaction.customId
                            .split("_")[1]
                    );

                const giveaway =
                    giveaways.get(id);

                if (!giveaway) {
                    return interaction.reply({
                        content:
                            "❌ Bu çekiliş sona ermiş.",
                        ephemeral: true
                    });
                }

                if (
                    giveaway.participants
                        .has(
                            interaction.user.id
                        )
                ) {
                    return interaction.reply({
                        content:
                            "❌ Zaten çekilişe katıldın.",
                        ephemeral: true
                    });
                }

                giveaway.participants.add(
                    interaction.user.id
                );

                return interaction.reply({
                    content:
                        "🎉 Çekilişe katıldın!",
                    ephemeral: true
                });
            }

            // =================================================
            // KAYIT BUTONLARI
            // =================================================

            if (
                interaction.customId
                    .startsWith("kayit_")
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

                if (kayitsiz) {
                    await target.roles.remove(
                        kayitsiz
                    ).catch(() => {});
                }

                if (td) {
                    await target.roles.remove(
                        td
                    ).catch(() => {});
                }

                if (futbolcu) {
                    await target.roles.remove(
                        futbolcu
                    ).catch(() => {});
                }

                getPlayer(
                    target.id
                ).registered = true;

                // ================================
                // TEKNİK DİREKTÖR
                // ================================

                if (type === "td") {

                    if (td) {
                        await target.roles.add(
                            td
                        );
                    }

                    const sohbet =
                        interaction.guild.channels.cache
                            .get(
                                CHANNELS.SOHBET
                            );

                    if (sohbet) {

                        await sohbet.send({
                            content:
                                `${target} adlı oyuncumuz kayıt oldu! Hoşgeldin!`,
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle(
                                        "👔 Yeni Teknik Direktör"
                                    )
                                    .setDescription(
                                        `${target} Legendary League'e kayıt oldu!\n\n` +
                                        `👔 Rol: **Teknik Direktör**`
                                    )
                                    .setColor(
                                        0xf1c40f
                                    )
                                    .setThumbnail(
                                        target.user.displayAvatarURL()
                                    )
                            ]
                        });
                    }

                    return interaction.update({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle(
                                    "✅ Kayıt Tamamlandı"
                                )
                                .setDescription(
                                    `${target}\n\n` +
                                    `👔 Teknik Direktör rolü verildi.\n` +
                                    `🚫 Kayıtsız rolü kaldırıldı.`
                                )
                                .setColor(
                                    0xf1c40f
                                )
                        ],
                        components: []
                    });
                }

                // ================================
                // FUTBOLCU
                // ================================

                if (
                    type === "futbolcu"
                ) {

                    if (futbolcu) {
                        await target.roles.add(
                            futbolcu
                        );
                    }

                    const sohbet =
                        interaction.guild.channels.cache
                            .get(
                                CHANNELS.SOHBET
                            );

                    if (sohbet) {

                        await sohbet.send({
                            content:
                                `${target} adlı oyuncumuz kayıt oldu! Hoşgeldin!`,
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle(
                                        "⚽ Yeni Futbolcu"
                                    )
                                    .setDescription(
                                        `${target} Legendary League'e kayıt oldu!\n\n` +
                                        `⚽ Rol: **Futbolcu**`
                                    )
                                    .setColor(
                                        0x2ecc71
                                    )
                                    .setThumbnail(
                                        target.user.displayAvatarURL()
                                    )
                            ]
                        });
                    }

                    return interaction.update({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle(
                                    "✅ Kayıt Tamamlandı"
                                )
                                .setDescription(
                                    `${target}\n\n` +
                                    `⚽ Futbolcu rolü verildi.\n` +
                                    `🚫 Kayıtsız rolü kaldırıldı.`
                                )
                                .setColor(
                                    0x2ecc71
                                )
                        ],
                        components: []
                    });
                }
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
                await interaction.reply({
                    content:
                        "❌ İşlem sırasında hata oluştu.",
                    ephemeral: true
                }).catch(() => {});
            }
        }
    }
);

// =====================================================
// HATA YAKALAMA
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
// CLIENT LOGIN
// Railway -> Variables -> TOKEN
// =====================================================

if (!process.env.TOKEN) {

    console.error(
        "❌ TOKEN bulunamadı!"
    );

    console.error(
        "Railway Variables kısmına TOKEN eklemelisin."
    );

    process.exit(1);
}

client.login(
    process.env.TOKEN
)
.then(() => {

    console.log(
        "✅ Discord botuna başarıyla giriş yapıldı!"
    );

})
.catch(error => {

    console.error(
        "❌ Discord giriş hatası:",
        error
    );

});
