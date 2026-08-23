const {
    Client,
    GatewayIntentBits,
    Partials,
    EmbedBuilder,
    PermissionsBitField
} = require("discord.js");

// ======================================================
// AYARLAR
// ======================================================

const PREFIX = ".";

const ROLES = {
    DEGER: "1540002147243139133",
    MAC: "1539997232642654248",
    KAYIT: "1540005508768079912",
    CEKILIS: "1539997232642654248",
    TEKNIK_DIREKTOR: "1539994147245527111",
    FUTBOLCU: "1539994254917767349",
    KAYITSIZ: "1540004657240211466"
};

const CHANNELS = {
    KAYIT: "1539982713468100608",
    SOHBET: "1539983320438415392"
};

// ======================================================
// CLIENT
// ======================================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});

// ======================================================
// VERİLER
// ======================================================

const players = new Map();
const teams = new Map();
const matches = new Map();
const giveaways = new Map();

const realTeams = [
    "Galatasaray",
    "Fenerbahçe",
    "Beşiktaş",
    "Trabzonspor",
    "Real Madrid",
    "Barcelona",
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
    "Porto",
    "Atletico Madrid",
    "Sevilla",
    "Valencia"
];

// ======================================================
// YARDIMCI FONKSİYONLAR
// ======================================================

function hasRole(member, roleId) {
    return member.roles.cache.has(roleId);
}

function isAdmin(member) {
    return member.permissions.has(PermissionsBitField.Flags.Administrator);
}

function money(value) {
    return Number(value || 0).toLocaleString("tr-TR") + "€";
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function parseDuration(text) {
    const match = text.match(/^(\d+)\s*(s|sn|saniye|dk|d|dakika|sa|saat|h)$/i);

    if (!match) return null;

    const number = Number(match[1]);
    const unit = match[2].toLowerCase();

    if (["s", "sn", "saniye"].includes(unit)) {
        return number * 1000;
    }

    if (["dk", "d", "dakika"].includes(unit)) {
        return number * 60 * 1000;
    }

    return number * 60 * 60 * 1000;
}

function getPlayer(memberId) {
    if (!players.has(memberId)) {
        players.set(memberId, {
            value: 1000000,
            training: 0,
            goals: 0,
            penalties: 0,
            budget: 0,
            team: null,
            registered: false
        });
    }

    return players.get(memberId);
}

function getTeamByUser(userId) {
    for (const [name, team] of teams) {
        if (team.owner === userId) {
            return { name, team };
        }
    }

    return null;
}

function getUserTeamName(userId) {
    const result = getTeamByUser(userId);
    return result ? result.name : null;
}

// ======================================================
// BOT HAZIR
// ======================================================

client.once("ready", () => {
    console.log("=================================");
    console.log(`Bot aktif: ${client.user.tag}`);
    console.log("Legendary League Bot hazır.");
    console.log("=================================");

    client.user.setActivity("Legendary League ⚽", {
        type: 0
    });
});

// ======================================================
// YENİ OYUNCU GİRİŞİ
// ======================================================

client.on("guildMemberAdd", async member => {
    try {
        const channel = member.guild.channels.cache.get(CHANNELS.KAYIT);

        if (!channel) return;

        const embed = new EmbedBuilder()
            .setTitle("📝 Yeni Oyuncu Geldi!")
            .setDescription(
                `**Yeni oyuncu geldi, ilgilenin!**\n\n` +
                `🛡️ <@&${ROLES.KAYIT}>\n` +
                `👤 ${member}\n\n` +
                `Oyuncunun kaydını gerçekleştirin.`
            )
            .setColor(0x3498db)
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp();

        await channel.send({
            content: `<@&${ROLES.KAYIT}> ${member}`,
            embeds: [embed]
        });

    } catch (error) {
        console.error("Üye giriş hatası:", error);
    }
});

// ======================================================
// MESAJLAR
// ======================================================

client.on("messageCreate", async message => {
    try {
        if (message.author.bot) return;
        if (!message.guild) return;
        if (!message.content.startsWith(PREFIX)) return;

        const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
        const command = args.shift().toLowerCase();

        const member = message.member;

        // ==================================================
        // YARDIM
        // ==================================================

        if (command === "yardım" || command === "help") {

            const embed = new EmbedBuilder()
                .setTitle("⚽ Legendary League Bot")
                .setDescription(
                    "**Kayıt**\n" +
                    "`.k @oyuncu isim`\n\n" +

                    "**Futbol**\n" +
                    "`.pen` / `.penaltı`\n" +
                    "`.ant` / `.antrenman`\n" +
                    "`.maç @oyuncu1 @oyuncu2`\n\n" +

                    "**Bütçe**\n" +
                    "`.bütçe`\n" +
                    "`.para @oyuncu miktar`\n" +
                    "`.parasil @oyuncu miktar`\n\n" +

                    "**Takım**\n" +
                    "`.takım Galatasaray`\n" +
                    "`.takımım`\n" +
                    "`.kadro`\n" +
                    "`.kadroekle @oyuncu`\n" +
                    "`.kadroçıkar @oyuncu`\n" +
                    "`.transfer @oyuncu`\n\n" +

                    "**Moderasyon - Yönetici**\n" +
                    "`.kick @oyuncu sebep`\n" +
                    "`.ban @oyuncu sebep`\n" +
                    "`.mute @oyuncu süre sebep`\n" +
                    "`.unmute @oyuncu`\n" +
                    "`.sil miktar`\n" +
                    "`.kilit`\n" +
                    "`.aç`\n\n" +

                    "**Çekiliş**\n" +
                    "`.çekiliş ödül süre`\n" +
                    "Örnek: `.çekiliş 5M€ 5 saat`"
                )
                .setColor(0x2ecc71);

            return message.reply({ embeds: [embed] });
        }

        // ==================================================
        // KAYIT
        // .k @oyuncu isim
        // ==================================================

        if (command === "k" || command === "kayıt") {

            if (!hasRole(member, ROLES.KAYIT) && !isAdmin(member)) {
                return message.reply("❌ Bu komutu sadece kayıt yetkilileri kullanabilir.");
            }

            const target = message.mentions.members.first();

            if (!target) {
                return message.reply("❌ Kullanım: `.k @oyuncu isim`");
            }

            const playerName = args.slice(1).join(" ");

            if (!playerName) {
                return message.reply("❌ Oyuncunun futbolcu adını yazmalısın.");
            }

            const player = getPlayer(target.id);

            try {

                await target.setNickname(playerName);

                const unregisteredRole =
                    message.guild.roles.cache.get(ROLES.KAYITSIZ);

                const footballerRole =
                    message.guild.roles.cache.get(ROLES.FUTBOLCU);

                if (unregisteredRole &&
                    target.roles.cache.has(unregisteredRole.id)) {

                    await target.roles.remove(unregisteredRole);
                }

                if (footballerRole &&
                    !target.roles.cache.has(footballerRole.id)) {

                    await target.roles.add(footballerRole);
                }

                player.registered = true;

                const channel =
                    message.guild.channels.cache.get(CHANNELS.SOHBET);

                if (channel) {

                    const embed = new EmbedBuilder()
                        .setTitle("🎉 Yeni Oyuncumuz Kayıt Oldu!")
                        .setDescription(
                            `${target} adlı oyuncumuz kayıt oldu!\n\n` +
                            `⚽ **Futbolcu:** ${playerName}\n` +
                            `👋 **Hoşgeldin!**`
                        )
                        .setColor(0x2ecc71)
                        .setThumbnail(target.user.displayAvatarURL())
                        .setTimestamp();

                    await channel.send({
                        content: `${target}`,
                        embeds: [embed]
                    });
                }

                return message.reply(
                    `✅ ${target} başarıyla **${playerName}** olarak kaydedildi.\n` +
                    `⚽ Futbolcu rolü verildi.\n` +
                    `🚫 Kayıtsız rolü kaldırıldı.`
                );

            } catch (error) {
                console.error(error);

                return message.reply(
                    "❌ Kayıt yapılamadı. Botun **Yönetici/Üyeleri Yönet ve Takma Adları Yönet** izinlerini kontrol et."
                );
            }
        }

        // ==================================================
        // DEĞER
        // .dver @oyuncu 5
        // ==================================================

        if (command === "dver") {

            if (!hasRole(member, ROLES.DEGER) && !isAdmin(member)) {
                return message.reply("❌ Bu komutu sadece değer yetkilisi kullanabilir.");
            }

            const target = message.mentions.members.first();
            const amount = Number(args[1]);

            if (!target || isNaN(amount)) {
                return message.reply("❌ Kullanım: `.dver @oyuncu 5`");
            }

            const player = getPlayer(target.id);

            player.value += amount * 1000000;

            const oldName = target.displayName;

            const parts = oldName.split("|");

            if (parts.length >= 2) {

                parts[parts.length - 1] =
                    ` ${money(player.value)}`;

                await target.setNickname(parts.join("|").trim());

            } else {

                await target.setNickname(
                    `${oldName} | ${money(player.value)}`
                );
            }

            return message.reply(
                `💰 ${target} oyuncusunun değeri **${money(player.value)}** oldu.`
            );
        }

        // ==================================================
        // ANTRENMAN
        // ==================================================

        if (command === "ant" || command === "antrenman") {

            const player = getPlayer(member.id);

            if (!player.registered) {
                return message.reply("❌ Önce kayıt olmalısın.");
            }

            player.training++;

            if (player.training >= 10) {

                player.training = 0;
                player.value += 3000000;

                return message.reply(
                    `🏋️ **Antrenman tamamlandı!**\n\n` +
                    `📊 10/10\n` +
                    `💰 +3M€\n` +
                    `💎 Yeni değer: **${money(player.value)}**`
                );
            }

            return message.reply(
                `🏋️ Antrenman yapıldı!\n` +
                `📊 **${player.training}/10**`
            );
        }

        // ==================================================
        // PENALTI
        // ==================================================

        if (command === "pen" || command === "penaltı") {

            const player = getPlayer(member.id);

            if (!player.registered) {
                return message.reply("❌ Önce kayıt olmalısın.");
            }

            const goal = Math.random() < 0.7;

            player.penalties++;

            if (goal) {

                player.goals++;
                player.value += 2000000;

                return message.reply(
                    `⚽ **GOOOL!** 🥅\n\n` +
                    `🎯 Penaltı başarıyla kullanıldı.\n` +
                    `💰 +2M€\n` +
                    `💎 Değer: **${money(player.value)}**`
                );

            } else {

                return message.reply(
                    `🥅 **Penaltı kaçtı!**\n` +
                    `Kaleci kurtardı.`
                );
            }
        }

        // ==================================================
        // BÜTÇE
        // ==================================================

        if (command === "bütçe" || command === "butce") {

            const player = getPlayer(member.id);

            return message.reply(
                `💰 **Bütçen:** ${money(player.budget)}`
            );
        }

        // ==================================================
        // PARA GÖNDER
        // ==================================================

        if (command === "para") {

            const target = message.mentions.members.first();
            const amount = Number(args[1]);

            if (!target || !amount || amount <= 0) {
                return message.reply(
                    "❌ Kullanım: `.para @oyuncu miktar`"
                );
            }

            const sender = getPlayer(member.id);
            const receiver = getPlayer(target.id);

            if (sender.budget < amount) {
                return message.reply("❌ Yeterli bütçen yok.");
            }

            sender.budget -= amount;
            receiver.budget += amount;

            return message.reply(
                `💸 ${target} oyuncusuna **${money(amount)}** gönderildi.`
            );
        }

        // ==================================================
        // PARA SİL
        // ==================================================

        if (command === "parasil") {

            if (!isAdmin(member)) {
                return message.reply("❌ Bu komutu sadece yönetici kullanabilir.");
            }

            const target = message.mentions.members.first();
            const amount = Number(args[1]);

            if (!target || !amount || amount <= 0) {
                return message.reply(
                    "❌ Kullanım: `.parasil @oyuncu miktar`"
                );
            }

            const player = getPlayer(target.id);

            player.budget = Math.max(
                0,
                player.budget - amount
            );

            return message.reply(
                `🗑️ ${target} oyuncusundan **${money(amount)}** silindi.`
            );
        }

        // ==================================================
        // TAKIM OLUŞTUR
        // ==================================================

        if (command === "takım" || command === "takim") {

            if (!hasRole(member, ROLES.TEKNIK_DIREKTOR) && !isAdmin(member)) {
                return message.reply(
                    "❌ Takım oluşturmak için Teknik Direktör yetkisi gerekir."
                );
            }

            if (getTeamByUser(member.id)) {
                return message.reply(
                    "❌ Zaten bir takımın var. Her kullanıcı sadece **1 takım** oluşturabilir."
                );
            }

            const teamName = args.join(" ");

            if (!teamName) {
                return message.reply(
                    "❌ Kullanım: `.takım Galatasaray`"
                );
            }

            const realName = realTeams.find(
                x => x.toLowerCase() === teamName.toLowerCase()
            );

            if (!realName) {
                return message.reply(
                    "❌ Bu takım listede bulunmuyor.\n\n" +
                    `Gerçek takımlar:\n${realTeams.join(", ")}`
                );
            }

            if (teams.has(realName)) {
                return message.reply(
                    "❌ Bu takım zaten alınmış."
                );
            }

            try {

                const role = await message.guild.roles.create({
                    name: realName,
                    reason: "Legendary League takım sistemi"
                });

                await member.roles.add(role);

                teams.set(realName, {
                    owner: member.id,
                    roleId: role.id,
                    budget: 100000000,
                    squad: []
                });

                const player = getPlayer(member.id);
                player.team = realName;

                return message.reply(
                    `🏟️ **${realName}** takımını oluşturdun!\n` +
                    `👔 Teknik Direktör: ${member}\n` +
                    `💰 Takım bütçesi: **100M€**\n` +
                    `🎭 Takım rolü oluşturuldu ve sana verildi.`
                );

            } catch (error) {

                console.error(error);

                return message.reply(
                    "❌ Takım oluşturulamadı. Botun **Rolleri Yönet** iznini kontrol et."
                );
            }
        }

        // ==================================================
        // TAKIMIM
        // ==================================================

        if (command === "takımım" || command === "takimim") {

            const result = getTeamByUser(member.id);

            if (!result) {
                return message.reply("❌ Bir takımın yok.");
            }

            return message.reply(
                `🏟️ **${result.name}**\n` +
                `👔 Teknik Direktör: <@${result.team.owner}>\n` +
                `💰 Bütçe: **${money(result.team.budget)}**\n` +
                `👥 Kadro: **${result.team.squad.length}** oyuncu`
            );
        }

        // ==================================================
        // KADRO
        // ==================================================

        if (command === "kadro") {

            const result = getTeamByUser(member.id);

            if (!result) {
                return message.reply("❌ Bir takımın yok.");
            }

            if (result.team.squad.length === 0) {
                return message.reply("📋 Kadro şu anda boş.");
            }

            const list = result.team.squad
                .map((id, i) => `${i + 1}. <@${id}>`)
                .join("\n");

            return message.reply(
                `📋 **${result.name} Kadrosu**\n\n${list}`
            );
        }

        // ==================================================
        // KADRO EKLE
        // ==================================================

        if (command === "kadroekle") {

            const result = getTeamByUser(member.id);

            if (!result) {
                return message.reply("❌ Bir takımın yok.");
            }

            const target = message.mentions.members.first();

            if (!target) {
                return message.reply(
                    "❌ Kullanım: `.kadroekle @oyuncu`"
                );
            }

            if (result.team.squad.includes(target.id)) {
                return message.reply("❌ Bu oyuncu zaten kadroda.");
            }

            result.team.squad.push(target.id);

            const player = getPlayer(target.id);
            player.team = result.name;

            return message.reply(
                `✅ ${target} **${result.name}** kadrosuna eklendi.`
            );
        }

        // ==================================================
        // KADRO ÇIKAR
        // ==================================================

        if (command === "kadroçıkar" || command === "kadrociKar") {

            const result = getTeamByUser(member.id);

            if (!result) {
                return message.reply("❌ Bir takımın yok.");
            }

            const target = message.mentions.members.first();

            if (!target) {
                return message.reply(
                    "❌ Kullanım: `.kadroçıkar @oyuncu`"
                );
            }

            const index = result.team.squad.indexOf(target.id);

            if (index === -1) {
                return message.reply("❌ Bu oyuncu kadroda değil.");
            }

            result.team.squad.splice(index, 1);

            const player = getPlayer(target.id);
            player.team = null;

            return message.reply(
                `✅ ${target} kadrodan çıkarıldı.`
            );
        }

        // ==================================================
        // TRANSFER
        // ==================================================

        if (command === "transfer") {

            if (!hasRole(member, ROLES.TEKNIK_DIREKTOR) && !isAdmin(member)) {
                return message.reply(
                    "❌ Transfer komutunu sadece Teknik Direktörler kullanabilir."
                );
            }

            const target = message.mentions.members.first();

            if (!target) {
                return message.reply(
                    "❌ Kullanım: `.transfer @oyuncu`"
                );
            }

            const ownTeam = getTeamByUser(member.id);

            if (!ownTeam) {
                return message.reply("❌ Önce takım oluşturmalısın.");
            }

            const targetPlayer = getPlayer(target.id);

            if (!targetPlayer.team) {
                return message.reply(
                    `❌ ${target} herhangi bir takımda değil.`
                );
            }

            const oldTeam = teams.get(targetPlayer.team);

            if (oldTeam) {
                const index = oldTeam.squad.indexOf(target.id);

                if (index !== -1) {
                    oldTeam.squad.splice(index, 1);
                }
            }

            ownTeam.team.squad.push(target.id);

            targetPlayer.team = ownTeam.name;

            return message.reply(
                `🔄 ${target} oyuncusu **${ownTeam.name}** takımına transfer edildi.`
            );
        }

        // ==================================================
        // MAÇ
        // SADECE @oyuncu @oyuncu
        // ==================================================

        if (command === "maç" || command === "mac") {

            if (!hasRole(member, ROLES.MAC) && !isAdmin(member)) {
                return message.reply(
                    "❌ Bu komutu sadece maç yetkilileri kullanabilir."
                );
            }

            const mentioned = [...message.mentions.members.values()];

            if (mentioned.length !== 2) {
                return message.reply(
                    "❌ Kullanım: `.maç @oyuncu1 @oyuncu2`"
                );
            }

            const team1 = getUserTeamName(mentioned[0].id);
            const team2 = getUserTeamName(mentioned[1].id);

            if (!team1 || !team2) {
                return message.reply(
                    "❌ İki oyuncunun da takımının olması gerekiyor."
                );
            }

            if (team1 === team2) {
                return message.reply(
                    "❌ Aynı takım kendi kendine maç yapamaz."
                );
            }

            const matchId = Date.now();

            let score1 = 0;
            let score2 = 0;
            let minute = 1;

            const embed = new EmbedBuilder()
                .setTitle(`⚽ ${team1} - ${team2}`)
                .setDescription(
                    `⏱️ **Maç başladı!**\n\n` +
                    `**${team1}** 0 - 0 **${team2}**\n\n` +
                    `🕐 Dakika: 1'`
                )
                .setColor(0x2ecc71)
                .setTimestamp();

            const matchMessage =
                await message.channel.send({
                    embeds: [embed]
                });

            matches.set(matchId, {
                team1,
                team2,
                score1: 0,
                score2: 0
            });

            let events = [
                `${team1} hızlı hücuma çıktı!`,
                `${team2} savunmada hata yaptı!`,
                `${team1} kalecisi harika kurtardı!`,
                `${team2} tehlikeli geliyor!`,
                `${team1} ceza sahasına girdi!`,
                `${team2} orta sahada topu kaptı!`,
                `${team1} uzaktan şut çekti!`,
                `${team2} kontra atağa çıktı!`,
                `Orta sahada büyük mücadele!`,
                `Tribünler hareketlendi!`
            ];

            const interval = setInterval(async () => {

                minute += random(2, 5);

                const event = events[random(0, events.length - 1)];

                // Gol ihtimali
                if (Math.random() < 0.22) {

                    if (Math.random() < 0.5) {
                        score1++;

                        await matchMessage.edit({
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle(`⚽ ${team1} - ${team2}`)
                                    .setDescription(
                                        `🚨 **GOOOL!**\n\n` +
                                        `⚽ ${team1} golü buldu!\n\n` +
                                        `**${team1}** ${score1} - ${score2} **${team2}**\n\n` +
                                        `🕐 ${minute}'`
                                    )
                                    .setColor(0x2ecc71)
                            ]
                        });

                    } else {

                        score2++;

                        await matchMessage.edit({
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle(`⚽ ${team1} - ${team2}`)
                                    .setDescription(
                                        `🚨 **GOOOL!**\n\n` +
                                        `⚽ ${team2} golü buldu!\n\n` +
                                        `**${team1}** ${score1} - ${score2} **${team2}**\n\n` +
                                        `🕐 ${minute}'`
                                    )
                                    .setColor(0x2ecc71)
                            ]
                        });

                    }

                } else {

                    await matchMessage.edit({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle(`⚽ ${team1} - ${team2}`)
                                .setDescription(
                                    `${event}\n\n` +
                                    `**${team1}** ${score1} - ${score2} **${team2}**\n\n` +
                                    `🕐 ${Math.min(minute, 90)}'`
                                )
                                .setColor(0x3498db)
                        ]
                    });
                }

                if (minute >= 90) {

                    clearInterval(interval);

                    const result =
                        score1 > score2
                            ? `🏆 **${team1} kazandı!**`
                            : score2 > score1
                                ? `🏆 **${team2} kazandı!**`
                                : `🤝 **Maç berabere bitti!**`;

                    await matchMessage.edit({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle(`🏁 MAÇ BİTTİ`)
                                .setDescription(
                                    `**${team1}** ${score1} - ${score2} **${team2}**\n\n` +
                                    result
                                )
                                .setColor(0xe67e22)
                                .setTimestamp()
                        ]
                    });

                    matches.delete(matchId);
                }

            }, 10000);
        }

        // ==================================================
        // KICK
        // ==================================================

        if (command === "kick") {

            if (!isAdmin(member)) {
                return message.reply("❌ Sadece yöneticiler kullanabilir.");
            }

            const target = message.mentions.members.first();

            if (!target) {
                return message.reply("❌ Kullanım: `.kick @oyuncu sebep`");
            }

            if (!target.kickable) {
                return message.reply("❌ Bu oyuncuyu kickleyemiyorum.");
            }

            const reason =
                args.slice(1).filter(x => !x.startsWith("<@")).join(" ") ||
                "Sebep belirtilmedi.";

            await target.kick(reason);

            return message.reply(
                `👢 ${target.user.tag} sunucudan atıldı.\n📝 Sebep: ${reason}`
            );
        }

        // ==================================================
        // BAN
        // ==================================================

        if (command === "ban") {

            if (!isAdmin(member)) {
                return message.reply("❌ Sadece yöneticiler kullanabilir.");
            }

            const target = message.mentions.members.first();

            if (!target) {
                return message.reply("❌ Kullanım: `.ban @oyuncu sebep`");
            }

            if (!target.bannable) {
                return message.reply("❌ Bu oyuncuyu banlayamıyorum.");
            }

            const reason = args.slice(1).join(" ") || "Sebep belirtilmedi.";

            await target.ban({ reason });

            return message.reply(
                `🔨 ${target.user.tag} banlandı.\n📝 Sebep: ${reason}`
            );
        }

        // ==================================================
        // MUTE
        // ==================================================

        if (command === "mute") {

            if (!isAdmin(member)) {
                return message.reply("❌ Sadece yöneticiler kullanabilir.");
            }

            const target = message.mentions.members.first();
            const duration = args.find(x => /^\d+/.test(x));

            if (!target || !duration) {
                return message.reply(
                    "❌ Kullanım: `.mute @oyuncu 10dk sebep`"
                );
            }

            const ms = parseDuration(duration);

            if (!ms) {
                return message.reply(
                    "❌ Geçerli süre kullan. Örnek: `10dk`, `30dk`, `1saat`"
                );
            }

            await target.timeout(
                ms,
                args.slice(2).join(" ") || "Mute"
            );

            return message.reply(
                `🔇 ${target} **${duration}** süreyle susturuldu.`
            );
        }

        // ==================================================
        // UNMUTE
        // ==================================================

        if (command === "unmute") {

            if (!isAdmin(member)) {
                return message.reply("❌ Sadece yöneticiler kullanabilir.");
            }

            const target = message.mentions.members.first();

            if (!target) {
                return message.reply(
                    "❌ Kullanım: `.unmute @oyuncu`"
                );
            }

            await target.timeout(null);

            return message.reply(
                `🔊 ${target} oyuncusunun susturması kaldırıldı.`
            );
        }

        // ==================================================
        // MESAJ SİL
        // ==================================================

        if (command === "sil") {

            if (!isAdmin(member)) {
                return message.reply("❌ Sadece yöneticiler kullanabilir.");
            }

            const amount = Number(args[0]);

            if (!amount || amount < 1 || amount > 100) {
                return message.reply(
                    "❌ 1 ile 100 arasında bir miktar yaz."
                );
            }

            await message.channel.bulkDelete(amount + 1, true);

            const msg = await message.channel.send(
                `🧹 **${amount} mesaj silindi.**`
            );

            setTimeout(() => {
                msg.delete().catch(() => {});
            }, 3000);

            return;
        }

        // ==================================================
        // KANAL KİLİT
        // ==================================================

        if (command === "kilit") {

            if (!isAdmin(member)) {
                return message.reply("❌ Sadece yöneticiler kullanabilir.");
            }

            await message.channel.permissionOverwrites.edit(
                message.guild.roles.everyone,
                {
                    SendMessages: false
                }
            );

            return message.reply("🔒 Kanal kilitlendi.");
        }

        // ==================================================
        // KANAL AÇ
        // ==================================================

        if (command === "aç" || command === "ac") {

            if (!isAdmin(member)) {
                return message.reply("❌ Sadece yöneticiler kullanabilir.");
            }

            await message.channel.permissionOverwrites.edit(
                message.guild.roles.everyone,
                {
                    SendMessages: true
                }
            );

            return message.reply("🔓 Kanal tekrar açıldı.");
        }

        // ==================================================
        // ÇEKİLİŞ
        // .çekiliş 5M€ 5 saat
        // ==================================================

        if (command === "çekiliş" || command === "cekilis") {

            if (!hasRole(member, ROLES.CEKILIS) && !isAdmin(member)) {
                return message.reply(
                    "❌ Bu komutu sadece çekiliş yetkilileri kullanabilir."
                );
            }

            const prize = args[0];
            const durationText = args.slice(1).join(" ");

            if (!prize || !durationText) {
                return message.reply(
                    "❌ Kullanım: `.çekiliş 5M€ 5 saat`"
                );
            }

            const duration = parseDuration(durationText);

            if (!duration) {
                return message.reply(
                    "❌ Süre örneği: `30 saniye`, `5 dakika`, `2 saat`"
                );
            }

            const giveawayId = Date.now();

            const embed = new EmbedBuilder()
                .setTitle("🎉 ÇEKİLİŞ")
                .setDescription(
                    `🎁 **Ödül:** ${prize}\n\n` +
                    `⏰ **Süre:** ${durationText}\n\n` +
                    `🎫 Katılmak için aşağıdaki 🎉 emojisine bas.\n\n` +
                    `🏆 Kazanan süre sonunda belirlenecek.`
                )
                .setColor(0xf1c40f)
                .setTimestamp(Date.now() + duration);

            const giveawayMessage =
                await message.channel.send({
                    embeds: [embed]
                });

            await giveawayMessage.react("🎉");

            giveaways.set(giveawayId, {
                messageId: giveawayMessage.id,
                channelId: message.channel.id,
                prize,
                end: Date.now() + duration
            });

            setTimeout(async () => {

                try {

                    const channel =
                        message.guild.channels.cache.get(
                            message.channel.id
                        );

                    if (!channel) return;

                    const msg =
                        await channel.messages.fetch(
                            giveawayMessage.id
                        );

                    const reaction =
                        msg.reactions.cache.get("🎉");

                    if (!reaction) {
                        return channel.send(
                            `🎉 Çekiliş bitti fakat katılımcı bulunamadı.`
                        );
                    }

                    const users =
                        await reaction.users.fetch();

                    const participants =
                        users.filter(u => !u.bot);

                    if (participants.size === 0) {
                        return channel.send(
                            `🎉 **${prize}** çekilişi bitti fakat katılımcı yok.`
                        );
                    }

                    const list =
                        [...participants.values()];

                    const winner =
                        list[random(0, list.length - 1)];

                    channel.send(
                        `🎉 **ÇEKİLİŞ BİTTİ!**\n\n` +
                        `🎁 Ödül: **${prize}**\n` +
                        `🏆 Kazanan: ${winner}`
                    );

                    giveaways.delete(giveawayId);

                } catch (error) {
                    console.error("Çekiliş hatası:", error);
                }

            }, duration);

            return message.reply(
                `✅ Çekiliş oluşturuldu!\n🎁 Ödül: **${prize}**\n⏰ Süre: **${durationText}**`
            );
        }

    } catch (error) {

        console.error("Komut hatası:", error);

        if (message && message.channel) {
            message.reply(
                "❌ Komut çalıştırılırken bir hata oluştu. Konsolu kontrol et."
            ).catch(() => {});
        }
    }
});

// ======================================================
// HATA YAKALAMA
// ======================================================

process.on("unhandledRejection", error => {
    console.error("Unhandled Rejection:", error);
});

process.on("uncaughtException", error => {
    console.error("Uncaught Exception:", error);
});

// ======================================================
// LOGIN
// ======================================================

if (!process.env.TOKEN) {
    console.error("❌ TOKEN değişkeni bulunamadı!");
    console.error("Railway Variables kısmına TOKEN ekle.");
    process.exit(1);
}

client.login(process.env.TOKEN);
