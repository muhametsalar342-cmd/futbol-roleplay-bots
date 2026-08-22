const {
    Client,
    GatewayIntentBits,
    AttachmentBuilder
} = require("discord.js");

const {
    createCanvas,
    loadImage
} = require("@napi-rs/canvas");

// ==========================================
// AYARLAR
// ==========================================

// Değer Yetkilisi rol ID'sini buraya yaz
const DEGER_YETKILISI_ROL_ID = "1540002147243139133";

// Antrenman sayıları
const antrenmanlar = new Map();

// ==========================================
// CLIENT
// ==========================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ==========================================
// BOT HAZIR
// ==========================================

client.once("ready", () => {
    console.log(`✅ ${client.user.tag} aktif!`);
});

// ==========================================
// DEĞERİ SAYIYA ÇEVİR
// ==========================================

function parseValue(text) {

    if (!text) return 0;

    let value = String(text)
        .toLowerCase()
        .replace(/€/g, "")
        .replace(/\s/g, "")
        .replace(",", ".");

    let multiplier = 1;

    if (value.endsWith("k")) {
        multiplier = 1000;
        value = value.slice(0, -1);
    }

    if (value.endsWith("m")) {
        multiplier = 1000000;
        value = value.slice(0, -1);
    }

    if (value.endsWith("b")) {
        multiplier = 1000000000;
        value = value.slice(0, -1);
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return number * multiplier;
}

// ==========================================
// DEĞERİ YAZIYA ÇEVİR
// ==========================================

function formatValue(value) {

    if (value >= 1000000000) {
        return `${Number((value / 1000000000).toFixed(1))}B€`;
    }

    if (value >= 1000000) {
        return `${Number((value / 1000000).toFixed(1))}M€`;
    }

    if (value >= 1000) {
        return `${Number((value / 1000).toFixed(1))}K€`;
    }

    return `${value}€`;
}

// ==========================================
// TAKMA ADDAKİ DEĞERİ BUL
// ==========================================

function getValueFromNickname(nickname) {

    const match = String(nickname).match(
        /([\d.,]+)\s*([KMBkmb]?)€/
    );

    if (!match) {
        return null;
    }

    return parseValue(
        match[1] + match[2]
    );
}

// ==========================================
// TAKMA ADDAKİ DEĞERİ DEĞİŞTİR
// ==========================================

function updateNicknameValue(
    nickname,
    newValue
) {

    return String(nickname).replace(
        /([\d.,]+)\s*([KMBkmb]?)€/,
        formatValue(newValue)
    );
}

// ==========================================
// MESAJ
// ==========================================

client.on("messageCreate", async (message) => {

    try {

        if (message.author.bot) return;
        if (!message.guild) return;

        const content =
            message.content.trim();

        if (!content) return;

        const parts =
            content.split(/\s+/);

        const command =
            parts[0].toLowerCase();

        const args =
            parts.slice(1);

        // ======================================
        // .DVER
        // ======================================

        if (command === ".dver") {

            // Rol kontrolü
            if (
                !message.member.roles.cache.has(
                    DEGER_YETKILISI_ROL_ID
                )
            ) {

                return message.reply(
                    "❌ Bu komutu sadece **Değer Yetkilisi** kullanabilir."
                );
            }

            const oyuncu =
                message.mentions.members.first();

            if (!oyuncu) {

                return message.reply(
                    "❌ Kullanım: `.dver @oyuncu 5M`"
                );
            }

            const miktar =
                args[1];

            if (!miktar) {

                return message.reply(
                    "❌ Bir değer yazmalısın.\nÖrnek: `.dver @oyuncu 5M`"
                );
            }

            const eklenecek =
                parseValue(miktar);

            if (eklenecek <= 0) {

                return message.reply(
                    "❌ Geçerli bir değer gir."
                );
            }

            const eskiIsim =
                oyuncu.nickname ||
                oyuncu.user.username;

            const eskiDeger =
                getValueFromNickname(
                    eskiIsim
                );

            if (eskiDeger === null) {

                return message.reply(
                    "❌ Oyuncunun takma adında değer bulunamadı.\n\n" +
                    "Örnek:\n" +
                    "`W.Sneijder | 🇳🇬 | SNT | 1M€`"
                );
            }

            const yeniDeger =
                eskiDeger + eklenecek;

            const yeniIsim =
                updateNicknameValue(
                    eskiIsim,
                    yeniDeger
                );

            try {

                await oyuncu.setNickname(
                    yeniIsim
                );

                return message.reply(
                    `✅ **DEĞER VERİLDİ**\n\n` +
                    `👤 Oyuncu: ${oyuncu}\n` +
                    `💰 Eski: **${formatValue(eskiDeger)}**\n` +
                    `➕ Eklenen: **${formatValue(eklenecek)}**\n` +
                    `📈 Yeni: **${formatValue(yeniDeger)}**`
                );

            } catch (error) {

                console.error(error);

                return message.reply(
                    "❌ Takma ad değiştirilemedi. Botun rolünü oyuncunun rolünün üstüne taşı."
                );
            }
        }

        // ======================================
        // .ANT
        // .ANTRENMAN
        // ======================================

        if (
            command === ".ant" ||
            command === ".antrenman"
        ) {

            const id =
                message.author.id;

            let sayı =
                antrenmanlar.get(id) || 0;

            sayı++;

            // 10/10
            if (sayı >= 10) {

                antrenmanlar.set(id, 0);

                const eskiIsim =
                    message.member.nickname ||
                    message.author.username;

                const eskiDeger =
                    getValueFromNickname(
                        eskiIsim
                    );

                if (eskiDeger === null) {

                    return message.reply(
                        "🏋️ **10/10 ANTRENMAN!**\n\n" +
                        "❌ Takma adında € değeri bulunamadı.\n" +
                        "🔄 Antrenman: **0/10**"
                    );
                }

                const yeniDeger =
                    eskiDeger + 3000000;

                const yeniIsim =
                    updateNicknameValue(
                        eskiIsim,
                        yeniDeger
                    );

                try {

                    await message.member.setNickname(
                        yeniIsim
                    );

                    return message.reply(
                        `🏋️ **ANTRENMAN TAMAMLANDI!**\n\n` +
                        `📊 **10/10**\n` +
                        `💰 Kazanç: **+3M€**\n` +
                        `📈 Yeni değer: **${formatValue(yeniDeger)}**\n\n` +
                        `🔄 Yeni antrenman: **0/10**`
                    );

                } catch (error) {

                    console.error(error);

                    return message.reply(
                        "❌ Değer artırılamadı. Botun rol sırasını kontrol et."
                    );
                }
            }

            antrenmanlar.set(
                id,
                sayı
            );

            return message.reply(
                `🏋️ **Antrenman yapıldı!**\n\n` +
                `📊 Antrenman: **${sayı}/10**\n` +
                `🎯 10/10 olduğunda **+3M€**`
            );
        }

        // ======================================
        // .PEN
        // .PENALTI
        // ======================================

        if (
            command === ".pen" ||
            command === ".penaltı"
        ) {

            const sonuç =
                Math.random() < 0.5;

            if (sonuç) {

                return message.reply(
                    "⚽ **PENALTI**\n\n" +
                    "🎯 Vuruş yapıldı!\n" +
                    "🥅 **GOOOOOL!** ⚽🔥"
                );

            } else {

                return message.reply(
                    "⚽ **PENALTI**\n\n" +
                    "🎯 Vuruş yapıldı!\n" +
                    "🧤 **KALECİ KURTARDI!** ❌"
                );
            }
        }

        // ======================================
        // .TWEET
        // ======================================

        if (command === ".tweet") {

            const tweetText =
                args.join(" ").trim();

            if (!tweetText) {

                return message.reply(
                    "❌ Kullanım:\n`.tweet Tweet mesajın`"
                );
            }

            try {

                // 1200x675 Tweet görseli
                const canvas =
                    createCanvas(
                        1200,
                        675
                    );

                const ctx =
                    canvas.getContext("2d");

                // Arka plan
                ctx.fillStyle = "#ffffff";

                ctx.fillRect(
                    0,
                    0,
                    1200,
                    675
                );

                // Çerçeve
                ctx.strokeStyle =
                    "#dddddd";

                ctx.lineWidth = 3;

                ctx.strokeRect(
                    15,
                    15,
                    1170,
                    645
                );

                // ==================================
                // PROFİL
                // ==================================

                const avatarURL =
                    message.author.displayAvatarURL({
                        extension: "png",
                        size: 256
                    });

                try {

                    const avatar =
                        await loadImage(
                            avatarURL
                        );

                    ctx.save();

                    ctx.beginPath();

                    ctx.arc(
                        105,
                        105,
                        55,
                        0,
                        Math.PI * 2
                    );

                    ctx.closePath();

                    ctx.clip();

                    ctx.drawImage(
                        avatar,
                        50,
                        50,
                        110,
                        110
                    );

                    ctx.restore();

                } catch {

                    // Avatar yüklenemezse harf göster
                    ctx.fillStyle =
                        "#e5e7eb";

                    ctx.beginPath();

                    ctx.arc(
                        105,
                        105,
                        55,
                        0,
                        Math.PI * 2
                    );

                    ctx.fill();

                    ctx.fillStyle =
                        "#555555";

                    ctx.font =
                        "bold 45px Arial";

                    ctx.textAlign =
                        "center";

                    ctx.fillText(
                        message.member.displayName
                            .charAt(0)
                            .toUpperCase(),
                        105,
                        120
                    );

                    ctx.textAlign =
                        "left";
                }

                // ==================================
                // İSİM
                // ==================================

                ctx.fillStyle =
                    "#111111";

                ctx.font =
                    "bold 36px Arial";

                ctx.fillText(
                    message.member.displayName,
                    185,
                    95
                );

                // ==================================
                // USERNAME
                // ==================================

                ctx.fillStyle =
                    "#777777";

                ctx.font =
                    "24px Arial";

                ctx.fillText(
                    `@${message.author.username}`,
                    185,
                    130
                );

                // ==================================
                // TWEET MESAJI
                // ==================================

                ctx.fillStyle =
                    "#111111";

                ctx.font =
                    "34px Arial";

                const maxWidth =
                    1030;

                const words =
                    tweetText.split(/\s+/);

                const lines = [];

                let line = "";

                for (const word of words) {

                    const test =
                        line === ""
                            ? word
                            : line + " " + word;

                    if (
                        ctx.measureText(test).width >
                            maxWidth
                    ) {

                        if (line !== "") {
                            lines.push(line);
                        }

                        line = word;

                    } else {

                        line = test;
                    }
                }

                if (line !== "") {
                    lines.push(line);
                }

                // En fazla 7 satır
                const gösterilecek =
                    lines.slice(0, 7);

                let y = 220;

                for (const text of gösterilecek) {

                    ctx.fillText(
                        text,
                        80,
                        y
                    );

                    y += 50;
                }

                // ==================================
                // TARİH
                // ==================================

                ctx.fillStyle =
                    "#777777";

                ctx.font =
                    "22px Arial";

                ctx.fillText(
                    new Date().toLocaleString(
                        "tr-TR"
                    ),
                    80,
                    560
                );

                // ==================================
                // ALT ÇİZGİ
                // ==================================

                ctx.strokeStyle =
                    "#dddddd";

                ctx.lineWidth = 2;

                ctx.beginPath();

                ctx.moveTo(
                    70,
                    585
                );

                ctx.lineTo(
                    1130,
                    585
                );

                ctx.stroke();

                // ==================================
                // ETKİLEŞİMLER
                // ==================================

                ctx.fillStyle =
                    "#555555";

                ctx.font =
                    "24px Arial";

                ctx.fillText(
                    "↩ 0",
                    100,
                    630
                );

                ctx.fillText(
                    "↻ 0",
                    350,
                    630
                );

                ctx.fillText(
                    "♡ 0",
                    600,
                    630
                );

                ctx.fillText(
                    "↗️ 0",
                    850,
                    630
                );

                // ==================================
                // PNG OLUŞTUR
                // ==================================

                const buffer =
                    canvas.toBuffer(
                        "image/png"
                    );

                const dosya =
                    new AttachmentBuilder(
                        buffer,
                        {
                            name: "tweet.png"
                        }
                    );

                // ==================================
                // GÖNDER
                // ==================================

                await message.channel.send({
                    files: [dosya]
                });

                // Komut mesajını sil
                try {
                    await message.delete();
                } catch {}

            } catch (error) {

                console.error(
                    "TWEET HATASI:",
                    error
                );

                return message.reply(
                    "❌ Tweet görseli oluşturulurken hata oluştu."
                );
            }

            return;
        }

    } catch (error) {

        console.error(
            "GENEL HATA:",
            error
        );

        try {

            await message.reply(
                "❌ Komut çalışırken hata oluştu."
            );

        } catch {}
    }
});

// ==========================================
// TOKEN
// ==========================================

const TOKEN =
    process.env.TOKEN;

if (!TOKEN) {

    console.error(
        "❌ TOKEN bulunamadı!"
    );

    console.error(
        "Rainway'de TOKEN adlı Variable/Secret oluştur."
    );

    process.exit(1);
}

client.login(TOKEN)
    .then(() => {

        console.log(
            "✅ Discord bağlantısı başarılı!"
        );

    })
    .catch((error) => {

        console.error(
            "❌ Discord bağlantı hatası:",
            error
        );

        process.exit(1);
    });
