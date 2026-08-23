// =====================================================
// GELİŞMİŞ MAÇ SİSTEMİ
// Kullanım: .maç @takım1 @takım2
// Her olay: 1 saniye
// Toplam maç: yaklaşık 60 saniye
// =====================================================

if (command === "maç" || command === "mac") {

    // Maç yetkilisi / Yönetici
    if (
        !hasRole(member, ROLES.MAC) &&
        !isAdmin(member)
    ) {
        return message.reply(
            "❌ Bu komutu sadece **Maç Yetkilisi** kullanabilir."
        );
    }

    // Sadece 2 etiket
    const mentionedMembers =
        [...message.mentions.members.values()];

    if (mentionedMembers.length !== 2) {
        return message.reply(
            "❌ Kullanım:\n`.maç @takım1 @takım2`\n\n" +
            "⚠️ İki takım sahibini etiketlemelisin."
        );
    }

    const teamOwner1 = mentionedMembers[0];
    const teamOwner2 = mentionedMembers[1];

    // Takımları bul
    const teamData1 =
        getOwnedTeam(teamOwner1.id);

    const teamData2 =
        getOwnedTeam(teamOwner2.id);

    if (!teamData1) {
        return message.reply(
            `❌ ${teamOwner1} adlı oyuncunun takımı bulunamadı.`
        );
    }

    if (!teamData2) {
        return message.reply(
            `❌ ${teamOwner2} adlı oyuncunun takımı bulunamadı.`
        );
    }

    const team1 = teamData1.name;
    const team2 = teamData2.name;

    if (team1 === team2) {
        return message.reply(
            "❌ Aynı takım kendisiyle maç yapamaz."
        );
    }

    // Kadroları kontrol et
    const squad1 =
        teamData1.team.squad || [];

    const squad2 =
        teamData2.team.squad || [];

    if (squad1.length === 0) {
        return message.reply(
            `❌ **${team1}** takımının kadrosu boş.`
        );
    }

    if (squad2.length === 0) {
        return message.reply(
            `❌ **${team2}** takımının kadrosu boş.`
        );
    }

    let score1 = 0;
    let score2 = 0;

    let minute = 1;

    // Rastgele olaylar
    const events = [
        {
            text: (t) =>
                `⚡ ${t} hızlı bir şekilde hücuma çıktı!`
        },
        {
            text: (t) =>
                `🎯 ${t} ceza sahası dışından şutunu çekti!`
        },
        {
            text: (t) =>
                `🧤 Kaleci müthiş bir kurtarış yaptı!`
        },
        {
            text: (t) =>
                `🏃 Kanattan gelişen atakta ${t} tehlike yarattı!`
        },
        {
            text: (t) =>
                `🛡️ Savunma son anda topu uzaklaştırdı!`
        },
        {
            text: (t) =>
                `⚔️ Orta sahada büyük bir mücadele yaşanıyor!`
        },
        {
            text: (t) =>
                `🥅 Ceza sahasında büyük bir karambol!`
        },
        {
            text: (t) =>
                `🔥 Tribünler ayağa kalktı, tempo çok yükseldi!`
        },
        {
            text: (t) =>
                `🎯 ${t} sağ kanattan ortayı yaptı!`
        },
        {
            text: (t) =>
                `👏 ${t} savunması tehlikeyi başarıyla savuşturdu!`
        },
        {
            text: (t) =>
                `🚀 ${t} kontra atağa kalktı!`
        },
        {
            text: (t) =>
                `🧠 ${t} orta sahada oyunun kontrolünü ele geçiriyor!`
        }
    ];

    // Maç başlangıç mesajı
    const matchEmbed =
        new EmbedBuilder()
            .setTitle("🏟️ MAÇ BAŞLADI")
            .setDescription(
                `⚽ **${team1}** 🆚 **${team2}**\n\n` +
                `📋 Kadro durumu:\n` +
                `🔵 ${team1}: **${squad1.length} oyuncu**\n` +
                `🔴 ${team2}: **${squad2.length} oyuncu**\n\n` +
                `⏱️ **1'**\n\n` +
                `🎙️ Hakem düdüğünü çaldı! Maç başladı.`
            )
            .setColor(0x2ecc71)
            .setTimestamp();

    const matchMessage =
        await message.channel.send({
            embeds: [matchEmbed]
        });

    // =================================================
    // MAÇ ANLATIMI
    // Her 1 saniyede bir olay
    // =================================================

    const matchInterval =
        setInterval(async () => {

            try {

                minute++;

                let description = "";

                const randomNumber =
                    Math.random();

                // %13 gol ihtimali
                if (randomNumber < 0.13) {

                    const scoringTeam =
                        Math.random() < 0.5
                            ? team1
                            : team2;

                    if (scoringTeam === team1) {
                        score1++;
                    } else {
                        score2++;
                    }

                    const goalDescriptions = [
                        `🚨 **GOOOOOOL!** ${scoringTeam} fileleri havalandırdı!`,
                        `⚽ **GOOOL!** ${scoringTeam} savunmanın arkasına sarktı ve golü buldu!`,
                        `🔥 **GOOOOL!** Harika bir hücum ve mükemmel bitiriş!`,
                        `🥅 **GOOOL!** Kalecinin yapabileceği hiçbir şey yoktu!`,
                        `🚀 **GOOOL!** ${scoringTeam} kontra atakta affetmedi!`,
                        `🎯 **GOOOL!** Şık bir vuruşla top ağlarda!`
                    ];

                    description =
                        goalDescriptions[
                            random(
                                0,
                                goalDescriptions.length - 1
                            )
                        ];

                } else {

                    const attackingTeam =
                        Math.random() < 0.5
                            ? team1
                            : team2;

                    const event =
                        events[
                            random(
                                0,
                                events.length - 1
                            )
                        ];

                    description =
                        event.text(
                            attackingTeam
                        );
                }

                // Skor
                description +=
                    `\n\n📊 **Skor:** ${team1} **${score1} - ${score2}** ${team2}`;

                // Dakika
                description +=
                    `\n⏱️ **${minute}'**`;

                await matchMessage.edit({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(
                                `⚽ ${team1} 🆚 ${team2}`
                            )
                            .setDescription(
                                description
                            )
                            .addFields(
                                {
                                    name: `🔵 ${team1}`,
                                    value:
                                        `**${score1} gol**`,
                                    inline: true
                                },
                                {
                                    name: `🔴 ${team2}`,
                                    value:
                                        `**${score2} gol**`,
                                    inline: true
                                }
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
                });

                // =================================================
                // 90 DAKİKALIK MAÇ
                // Gerçek zamanda yaklaşık 90 saniye
                // =================================================

                if (minute >= 90) {

                    clearInterval(
                        matchInterval
                    );

                    let resultText;

                    if (score1 > score2) {

                        resultText =
                            `🏆 **${team1} KAZANDI!**`;

                    } else if (
                        score2 > score1
                    ) {

                        resultText =
                            `🏆 **${team2} KAZANDI!**`;

                    } else {

                        resultText =
                            `🤝 **MAÇ BERABERE BİTTİ!**`;
                    }

                    const finalEmbed =
                        new EmbedBuilder()
                            .setTitle(
                                "🏁 MAÇ BİTTİ"
                            )
                            .setDescription(
                                `🏟️ **${team1}** 🆚 **${team2}**\n\n` +
                                `# ${score1} - ${score2}\n\n` +
                                `${resultText}\n\n` +
                                `⏱️ **90+${random(1,5)}'**\n` +
                                `🎙️ Hakem son düdüğü çaldı.`
                            )
                            .addFields(
                                {
                                    name:
                                        `🔵 ${team1}`,
                                    value:
                                        `**${score1} gol**`,
                                    inline: true
                                },
                                {
                                    name:
                                        `🔴 ${team2}`,
                                    value:
                                        `**${score2} gol**`,
                                    inline: true
                                }
                            )
                            .setColor(
                                0xe67e22
                            )
                            .setFooter({
                                text:
                                    "Legendary League • Maç Sonucu"
                            })
                            .setTimestamp();

                    await matchMessage.edit({
                        embeds: [
                            finalEmbed
                        ]
                    });

                    // Kazanana bütçe ödülü
                    if (score1 > score2) {

                        teamData1.team.budget +=
                            5000000;

                    } else if (
                        score2 > score1
                    ) {

                        teamData2.team.budget +=
                            5000000;
                    }

                    return;
                }

            } catch (error) {

                console.error(
                    "Maç anlatım hatası:",
                    error
                );

                clearInterval(
                    matchInterval
                );
            }

        }, 1000);

    return;
}
