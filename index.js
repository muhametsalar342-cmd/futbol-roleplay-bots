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
// YARDIMCI FONKSİYONLAR
// =====================================================

function isAdmin(member) {
    return member.permissions.has(
        PermissionsBitField.Flags.Administrator
    );
}

function hasRole(member, roleId) {
    return member.roles.cache.has(roleId);
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

function money(amount) {
    return Number(amount || 0)
        .toLocaleString("tr-TR") + "€";
}

function random(min, max) {
    return Math.floor(
        Math.random() * (max - min + 1)
    ) + min;
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
    console.log(`Bot aktif: ${client.user.tag}`);
    console.log("Legendary League Bot hazır!");
    console.log("--------------------------------");

    client.user.setActivity(
        "Legendary League ⚽"
    );
});

// =====================================================
// SUNUCUYA GİREN OYUNCU
// =====================================================

client.on("guildMemberAdd", async member => {
    try {

        const kayitKanali =
            member.guild.channels.cache.get(
                CHANNELS.KAYIT
            );

        if (!kayitKanali) return;

        const embed = new EmbedBuilder()
            .setTitle("👤 Yeni Oyuncu Geldi!")
            .setDescription(
                `${member} sunucuya yeni katıldı.\n\n` +
                `📋 Lütfen kayıt işlemiyle ilgilenin.`
            )
            .setThumbnail(
                member.user.displayAvatarURL()
            )
            .setColor(0x3498db)
            .setTimestamp();

        await kayitKanali.send({
            content:
                `<@&${ROLES.KAYIT}> Yeni oyuncu geldi ilgilenin! ${member}`,
            embeds: [embed]
        });

    } catch (error) {
        console.error(
            "Giriş sistemi hatası:",
            error
        );
    }
});

// =====================================================
// MESAJ KOMUTLARI
// =====================================================

client.on("messageCreate", async message => {

    if (message.author.bot) return;
    if (!message.guild) return;
    if (!message.content.startsWith(PREFIX)) return;

    try {

        const args =
            message.content
                .slice(PREFIX.length)
                .trim()
                .split(/\s+/);

        const command =
            args.shift().toLowerCase();

        const member =
            message.member;

        // =================================================
        // YARDIM
        // =================================================

        if (
            command === "yardım" ||
            command === "yardim" ||
            command === "help"
        ) {

            const embed = new EmbedBuilder()
                .setTitle("⚽ Legendary League Bot")
                .setDescription(
                    "**📝 Kayıt**\n" +
                    "`.k @oyuncu isim`\n\n" +

                    "**⚽ Futbol**\n" +
                    "`.ant`\n" +
                    "`.antrenman`\n" +
                    "`.pen`\n" +
                    "`.penaltı`\n" +
                    "`.maç @oyuncu @oyuncu`\n\n" +

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
                    "`.kick @oyuncu sebep`\n" +
                    "`.ban @oyuncu sebep`\n" +
                    "`.mute @oyuncu 10dk sebep`\n" +
                    "`.unmute @oyuncu`\n" +
                    "`.sil 10`\n" +
                    "`.kilit`\n" +
                    "`.aç`"
                )
                .setColor(0x2ecc71);

            return message.reply({
                embeds: [embed]
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
                    "❌ Bu komutu sadece Kayıt Yetkilisi kullanabilir."
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
                    "❌ Oyuncunun adını yaz."
                );
            }

            try {

                const player =
                    getPlayer(target.id);

                player.registered = true;

                await target.setNickname(name);

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
                            "📝 Kayıt Tamamlanıyor"
                        )
                        .setDescription(
                            `${target}\n\n` +
                            `👤 **Oyuncu Adı:** ${name}\n\n` +
                            `Oyuncunun türünü seçin:`
                        )
                        .setColor(
                            0x3498db
                        )
                        .setThumbnail(
                            target.user.displayAvatarURL()
                        )
                        .setTimestamp();

                await message.channel.send({
                    embeds: [embed],
                    components: [row]
                });

                return message.reply(
                    `✅ ${target} için kayıt bilgileri hazırlandı.`
                );

            } catch (error) {

                console.error(error);

                return message.reply(
                    "❌ Kayıt yapılamadı. Botun rol sırasını ve izinlerini kontrol et."
                );
            }
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

            const oldName =
                target.displayName;

            const parts =
                oldName.split("|");

            try {

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
                `💰 ${target} yeni değer: **${money(player.value)}**`
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
                    `🏋️ **ANTRENMAN 10/10 TAMAMLANDI!**\n\n` +
                    `💰 **+3M€** değer kazandın.\n` +
                    `💎 Yeni değer: **${money(player.value)}**\n` +
                    `🔄 Antrenman tekrar **0/10**`
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

            if (!player.registered) {
                return message.reply(
                    "❌ Önce kayıt olmalısın."
                );
            }

            const goal =
                Math.random() < 0.70;

            if (goal) {

                player.goals++;
                player.value +=
                    2000000;

                return message.reply(
                    `⚽ **GOOOOL!**\n\n` +
                    `🥅 Penaltı gole çevrildi!\n` +
                    `💰 Değer: **+2M€**\n` +
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
                    "❌ Kullanım: `.para @oyuncu miktar`"
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
                !amount ||
                amount <= 0
            ) {
                return message.reply(
                    "❌ Kullanım: `.parasil @oyuncu miktar`"
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
                    "❌ Sadece Teknik Direktör takım oluşturabilir."
                );
            }

            if (
                getOwnedTeam(member.id)
            ) {
                return message.reply(
                    "❌ Sadece **1 takım** oluşturabilirsin."
                );
            }

            const name =
                args.join(" ").trim();

            const real =
                REAL_TEAMS.find(
                    x =>
                        x.toLowerCase() ===
                        name.toLowerCase()
                );

            if (!real) {
                return message.reply(
                    "❌ Sadece gerçek takımlar kullanılabilir."
                );
            }

            if (teams.has(real)) {
                return message.reply(
                    "❌ Bu takım zaten alınmış."
                );
            }

            try {

                const role =
                    await message.guild.roles.create({
                        name: real,
                        reason:
                            "Legendary League takım sistemi"
                    });

                await member.roles.add(
                    role
                );

                teams.set(
                    real,
                    {
                        owner: member.id,
                        roleId: role.id,
                        budget: 100000000,
                        squad: []
                    }
                );

                getPlayer(member.id).team =
                    real;

                return message.reply(
                    `🏟️ **${real}** takımın oluşturuldu!\n\n` +
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
                        (id, i) =>
                            `${i + 1}. <@${id}>`
                    )
                    .join("\n");

            return message.reply(
                `📋 **${result.name} Kadrosu**\n\n${list}`
            );
        }

        // =================================================
        // KADROYA EKLE
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

                getPlayer(target.id).team =
                    result.name;
            }

            return message.reply(
                `✅ ${target} **${result.name}** kadrosuna eklendi.`
            );
        }

        // =================================================
        // KADRODAN ÇIKAR
        // =================================================

        if (
            command === "kadroçıkar" ||
            command === "kadrociKar" ||
            command === "kadro-cikar"
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

            getPlayer(target.id).team =
                null;

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
                    "❌ Transferi sadece Teknik Direktör kullanabilir."
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
                    "❌ Takımın yok."
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

            return message.reply(
                `🔄 ${target} **${destination.name}** takımına transfer edildi.`
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
                !hasRole(member, ROLES.MAC) &&
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
                    "❌ Kullanım: `.maç @takım1 @takım2`"
                );
            }

            const p1 =
                getPlayer(
                    mentions[0].id
                );

            const p2 =
                getPlayer(
                    mentions[1].id
                );

            if (
                !p1.team ||
                !p2.team
            ) {
                return message.reply(
                    "❌ İki tarafın da takımının olması gerekiyor."
                );
            }

            if (
                p1.team === p2.team
            ) {
                return message.reply(
                    "❌ Aynı takım karşılaşamaz."
                );
            }

            let score1 = 0;
            let score2 = 0;

            const team1 = p1.team;
            const team2 = p2.team;

            const embed =
                new EmbedBuilder()
                    .setTitle(
                        `⚽ ${team1} - ${team2}`
                    )
                    .setDescription(
                        `🏁 **MAÇ BAŞLADI!**\n\n` +
                        `**${team1}** 0 - 0 **${team2}**\n\n` +
                        `⏱️ 0'`
                    )
                    .setColor(
                        0x2ecc71
                    );

            const msg =
                await message.channel.send({
                    embeds: [embed]
                });

            let elapsed = 0;

            const interval =
                setInterval(
                    async () => {

                        elapsed += 10;

                        const minute =
                            Math.floor(
                                elapsed / 60
                            );

                        let event =
                            "⚡ Oyun devam ediyor...";

                        if (
                            Math.random() < 0.18
                        ) {

                            if (
                                Math.random() < 0.5
                            ) {

                                score1++;

                                event =
                                    `🚨 **GOOOL!** ${team1} golü buldu!`;

                            } else {

                                score2++;

                                event =
                                    `🚨 **GOOOL!** ${team2} golü buldu!`;
                            }

                        } else {

                            const events = [
                                "⚡ Hızlı hücum!",
                                "🎯 Tehlikeli şut!",
                                "🧤 Kaleci kurtardı!",
                                "🔥 Orta saha mücadelesi!",
                                "🏃 Kanattan tehlikeli atak!",
                                "🛡️ Savunma topu uzaklaştırdı!",
                                "🥅 Ceza sahasında pozisyon!",
                                "👏 Tribünler ayağa kalktı!"
                            ];

                            event =
                                events[
                                    random(
                                        0,
                                        events.length - 1
                                    )
                                ];
                        }

                        await msg.edit({
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle(
                                        `⚽ ${team1} - ${team2}`
                                    )
                                    .setDescription(
                                        `${event}\n\n` +
                                        `**${team1}** ${score1} - ${score2} **${team2}**\n\n` +
                                        `⏱️ ${Math.min(minute, 90)}'`
                                    )
                                    .setColor(
                                        0x3498db
                                    )
                            ]
                        }).catch(() => {});

                        // 5 dakika
                        if (
                            elapsed >= 300
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
                                    `🏆 **${team2} kazandı!`;
                            } else {
                                result =
                                    "🤝 **Maç berabere bitti!**";
                            }

                            await msg.edit({
                                embeds: [
                                    new EmbedBuilder()
                                        .setTitle(
                                            "🏁 MAÇ BİTTİ"
                                        )
                                        .setDescription(
                                            `⚽ **${team1}** ${score1} - ${score2} **${team2}**\n\n` +
                                            result +
                                            `\n\n⏱️ Maç süresi: **5 dakika**`
                                        )
                                        .setColor(
                                            0xe67e22
                                        )
                                        .setTimestamp()
                                ]
                            }).catch(() => {});
                        }

                    },
                    10000
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

            const duration =
                parseDuration(
                    args.slice(1).join(" ")
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

            const data = {
                prize,
                participants: new Set(),
                end:
                    Date.now() +
                    duration
            };

            giveaways.set(
                id,
                data
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

            const embed =
                new EmbedBuilder()
                    .setTitle(
                        "🎉 ÇEKİLİŞ"
                    )
                    .setDescription(
                        `🎁 **Ödül:** ${prize}\n\n` +
                        `🎉 Katılmak için butona bas!`
                    )
                    .setColor(
                        0xf1c40f
                    )
                    .setTimestamp(
                        Date.now() + duration
                    );

            await message.channel.send({
                embeds: [embed],
                components: [row]
            });

            setTimeout(
                async () => {

                    const giveaway =
                        giveaways.get(id);

                    if (!giveaway) return;

                    const list =
                        [...giveaway.participants];

                    if (
                        list.length === 0
                    ) {

                        await message.channel.send(
                            `🎉 **${prize}** çekilişi sona erdi fakat katılımcı yok.`
                        );

                    } else {

                        const winner =
                            list[
                                random(
                                    0,
                                    list.length - 1
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
                `✅ Çekiliş başlatıldı: **${prize}**`
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
                    "❌ Bu oyuncuyu atamıyorum."
                );
            }

            const reason =
                args
                    .filter(
                        x =>
                            !x.includes(target.id)
                    )
                    .join(" ") ||
                "Sebep belirtilmedi.";

            await target.kick(
                reason
            );

            return message.reply(
                `👢 ${target.user.tag} kicklendi.\n` +
                `📝 Sebep: ${reason}`
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
                    args
                        .filter(
                            x =>
                                !x.includes(
                                    target.id
                                )
                        )
                        .join(" ") ||
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

            if (!target) {
                return message.reply(
                    "❌ `.mute @oyuncu 10dk sebep`"
                );
            }

            const durationText =
                args.find(
                    x =>
                        /^\d+\s*(sn|saniye|s|dk|dakika|d|sa|saat|h)$/i
                            .test(x)
                );

            const duration =
                parseDuration(
                    durationText
                );

            if (!duration) {
                return message.reply(
                    "❌ Geçerli bir süre yaz."
                );
            }

            await target.timeout(
                duration,
                "Moderasyon mute"
            );

            return message.reply(
                `🔇 ${target} **${durationText}** susturuldu.`
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
                `🔊 ${target} mute'dan çıkarıldı.`
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
                    "❌ 1 ile 100 arasında miktar yaz."
                );
            }

            await message.channel.bulkDelete(
                amount + 1,
                true
            );

            const msg =
                await message.channel.send(
                    `🧹 **${amount} mesaj silindi.**`
                );

            setTimeout(
                () =>
                    msg.delete().catch(
                        () => {}
                    ),
                3000
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

        message.reply(
            "❌ İşlem sırasında bir hata oluştu."
        ).catch(() => {});
    }
});

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
                    giveaway.participants.has(
                        interaction.user.id
                    )
                ) {
                    return interaction.reply({
                        content:
                            "❌ Zaten katıldın.",
                        ephemeral: true
                    });
                }

                giveaway.participants.add(
                    interaction.user.id
                );

                return interaction.reply({
                    content:
                        `🎉 **${giveaway.prize}** çekilişine katıldın!`,
                    ephemeral: true
                });
            }

            // =================================================
            // KAYIT
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
                    await interaction.guild
                        .members
                        .fetch(userId)
                        .catch(
                            () => null
                        );

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
                    await target.roles.remove(
                        kayitsiz
                    ).catch(() => {});
                }

                // Eski seçim rollerini kaldır
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

                // =================================================
                // TEKNİK DİREKTÖR
                // =================================================

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

                        const embed =
                            new EmbedBuilder()
                                .setTitle(
                                    "👔 Yeni Teknik Direktör!"
                                )
                                .setDescription(
                                    `${target} adlı oyuncumuz kayıt oldu!\n\n` +
                                    `👔 **Rol:** Teknik Direktör\n\n` +
                                    `🎉 Hoşgeldin!`
                                )
                                .setColor(
                                    0xf1c40f
                                )
                                .setThumbnail(
                                    target.user.displayAvatarURL()
                                )
                                .setTimestamp();

                        await sohbet.send({
                            content:
                                `${target} adlı oyuncumuz kayıt oldu! Hoşgeldin!`,
                            embeds: [
                                embed
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
                                    `👔 **Teknik Direktör** rolü verildi.\n` +
                                    `🚫 Kayıtsız rolü kaldırıldı.`
                                )
                                .setColor(
                                    0xf1c40f
                                )
                        ],
                        components: []
                    });
                }

                // =================================================
                // FUTBOLCU
                // =================================================

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

                        const embed =
                            new EmbedBuilder()
                                .setTitle(
                                    "⚽ Yeni Futbolcumuz!"
                                )
                                .setDescription(
                                    `${target} adlı oyuncumuz kayıt oldu!\n\n` +
                                    `⚽ **Rol:** Futbolcu\n\n` +
                                    `🎉 Hoşgeldin!`
                                )
                                .setColor(
                                    0x2ecc71
                                )
                                .setThumbnail(
                                    target.user.displayAvatarURL()
                                )
                                .setTimestamp();

                        await sohbet.send({
                            content:
                                `${target} adlı oyuncumuz kayıt oldu! Hoşgeldin!`,
                            embeds: [
                                embed
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
                                    `⚽ **Futbolcu** rolü verildi.\n` +
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
                "Interaction hatası:",
                error
            );

            if (
                !interaction.replied &&
                !interaction.deferred
            ) {

                await interaction.reply({
                    content:
                        "❌ İşlem sırasında hata oluştu. Botun rol sırasını ve izinlerini kontrol et.",
                    ephemeral: true
                });
            }
        }
    }
);

// =====================================================
// HATA KONTROLLERİ
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
// TOKEN
// Railway Variables:
// TOKEN = Discord bot token
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
);
