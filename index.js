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

// Değer Yetkilisi rol ID'si
const DEGER_YETKILISI_ROL_ID = "1540002147243139133";

// Antrenman verileri
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
    console.log("================================");
    console.log(`✅ ${client.user.tag} aktif!`);
    console.log("================================");
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

    else if (value.endsWith("m")) {
        multiplier = 1000000;
        value = value.slice(0, -1);
    }

    else if (value.endsWith("b")) {
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
        return `${Number(
            (value / 1000000000).toFixed(1)
        )}B€`;
    }

    if (value >= 1000000) {
        return `${Number(
            (value / 1000000).toFixed(1)
        )}M€`;
    }

    if (value >= 1000) {
        return `${Number(
            (value / 1000).toFixed(1)
        )}K€`;
    }

    return `${value}€`;
}

// ==========================================
// TAKMA ADDAKİ DEĞERİ BUL
// ==========================================

function getNicknameValue(nickname) {

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
// MESAJLARI DİNLE
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
        // SADECE DEĞER YETKİLİSİ
        // ======================================

        if (command === ".dver") {

            if (
                DEGER_YETKILISI_ROL_ID ===
                "BURAYA_ROL_ID"
            ) {

                return message.reply(
                    "❌ Kodda Değer Yetkilisi rol ID'sini ayarla."
                );
            }

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
                    "❌ Kullanım:\n`.dver @oyuncu 5M`"
                );
            }

            const miktar =
                args[1];

            if (!miktar) {

                return message.reply(
                    "❌ Örnek:\n`.dver @oyuncu 5M`"
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
                getNicknameValue(eskiIsim);

            if (eskiDeger === null) {

                return message.reply(
                    "❌ Oyuncunun takma adında € değeri bulunamadı.\n\n" +
                    "Örnek:\n" +
                    "`W.Sneijder | 🇳🇬 | SNT | 1M€`"
                );
            }

            // Önceki değerin üzerine ekle
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
                    `💰 Eski değer: **${formatValue(eskiDeger)}**\n` +
                    `➕ Eklenen: **${formatValue(eklenecek)}**\n` +
                    `📈 Yeni değer: **${formatValue(yeniDeger)}**`
                );

            } catch (error) {

                console.error(
                    "DVER HATASI:",
                    error
                );

                return message.reply(
                    "❌ Takma ad değiştirilemedi. Botun rolünü oyuncunun rolünün üstüne taşı."
                );
            }
        }

        // ======================================
        // .ANT / .ANTRENMAN
        // 10/10 = +3M€
        // ======================================

        if (
            command === ".ant" ||
            command === ".antrenman"
        ) {

            const userId =
                message.author.id;

            let sayı =
                antrenmanlar.get(userId) || 0;

            sayı++;

            // 10/10
            if (sayı >= 10) {

                antrenmanlar.set(
                    userId,
                    0
                );

                const eskiIsim =
                    message.member.nickname ||
                    message.author.username;

                const eskiDeger =
                    getNicknameValue(
                        eskiIsim
                    );

                if (eskiDeger === null) {

                    return message.reply(
                        "🏋️ **ANTRENMAN 10/10!**\n\n" +
                        "❌ Takma adında € değeri bulunamadı.\n" +
                        "🔄 Yeni seri: **0/10**"
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
                        `📊 Antrenman: **10/10**\n` +
                        `💰 Değer artışı: **+3M€**\n` +
                        `📊 Eski değer: **${formatValue(eskiDeger)}**\n` +
                        `📈 Yeni değer: **${formatValue(yeniDeger)}**\n\n` +
                        `🔄 Yeni seri: **0/10**`
                    );

                } catch (error) {

                    console.error(
                        "ANTRENMAN HATASI:",
                        error
                    );

                    return message.reply(
                        "❌ Takma ad değiştirilemedi."
                    );
                }
            }

            antrenmanlar.set(
                userId,
                sayı
            );

            return message.reply(
                `🏋️ **Antrenman yapıldı!**\n\n` +
                `📊 Antrenman: **${sayı}/10**\n` +
                `🎯 10/10 olduğunda mevcut değere **+3M€**`
            );
        }

        // ======================================
        // .PEN / .PENALTI
        // ======================================

        if (
            command === ".pen" ||
            command === ".penaltı"
        ) {

            const gol =
                Math.random() < 0.5;

            if (gol) {

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
        // HERKES KULLANABİLİR
        // ======================================

        if (command === ".tweet") {

            const tweetText =
                args.join(" ").trim();

            if (!tweetText) {

                return message.reply(
                    "❌ Kullanım:\n`.tweet mesajın`"
                );
            }

            try {

                const canvas =
                    createCanvas(
                        1200,
                        675
                    );

                const ctx =
                    canvas.getContext("2d");

                // ==================================
                // ARKA PLAN
                // ==================================

                ctx.fillStyle =
                    "#ffffff";

                ctx.fillRect(
                    0,
                    0,
                    1200,
                    675
                );

                // ==================================
                // ÇERÇEVE
                // ==================================

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
                // PROFİL FOTOĞRAFI
                // ==================================

                try {

                    const avatarURL =
                        message.author.displayAvatarURL({
                            extension: "png",
                            size: 256
                        });

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

                    ctx.fillStyle =
                        "#dddddd";

                    ctx.beginPath();

                    ctx.arc(
                        105,
                        105,
                        55,
                        0,
                        Math.PI * 2
                    );

                    ctx.fill();
                }

                // ==================================
                // İSİM
                // ==================================

                ctx.textAlign =
                    "left";

                ctx.textBaseline =
                    "alphabetic";

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
                    "@" +
                    message.author.username,
                    185,
                    130
                );

                // ==================================
                // TWEET MESAJI
                // ==================================

                ctx.fillStyle =
                    "#111111";

                ctx.font =
                    "32px Arial";

                ctx.textAlign =
                    "left";

                ctx.textBaseline =
                    "top";

                const maxWidth =
                    1040;

                const startX =
                    80;

                const startY =
                    205;

                const lineHeight =
                    48;

                const words =
                    tweetText.split(/\s+/);

                const lines = [];

                let currentLine =
                    "";

                for (
                    const word of words
                ) {

                    const testLine =
                        currentLine === ""
                            ? word
                            : currentLine +
                              " " +
                              word;

                    const width =
                        ctx.measureText(
                            testLine
                        ).width;

                    if (
                        width > maxWidth &&
                        currentLine !== ""
                    ) {

                        lines.push(
                            currentLine
                        );

                        currentLine =
                            word;

                    } else {

                        currentLine =
                            testLine;
                    }
                }

                if (
                    currentLine !== ""
                ) {

                    lines.push(
                        currentLine
                    );
                }

                // En fazla 7 satır
                const visibleLines =
                    lines.slice(0, 7);

                for (
                    let i = 0;
                    i < visibleLines.length;
                    i++
                ) {

                    ctx.fillText(
                        visibleLines[i],
                        startX,
                        startY +
                        i * lineHeight
                    );
                }

                // ==================================
                // TARİH
                // ==================================

                ctx.fillStyle =
                    "#777777";

                ctx.font =
                    "20px Arial";

                ctx.textBaseline =
                    "alphabetic";

                ctx.fillText(
                    new Date().toLocaleString(
                        "tr-TR"
                    ),
                    80,
                    555
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
                    580
                );

                ctx.lineTo(
                    1130,
                    580
                );

                ctx.stroke();

                // ==================================
                // ETKİLEŞİMLER
                // ==================================

                ctx.fillStyle =
                    "#555555";

                ctx.font =
                    "23px Arial";

                ctx.fillText(
                    "↩ 0",
                    100,
                    625
                );

                ctx.fillText(
                    "↻ 0",
                    350,
                    625
                );

                ctx.fillText(
                    "♡ 0",
                    600,
                    625
                );

                ctx.fillText(
                    "↗️ 0",
                    850,
                    625
                );

                // ==================================
                // PNG OLUŞTUR
                // ==================================

                const buffer =
                    canvas.toBuffer(
                        "image/png"
                    );

                const attachment =
                    new AttachmentBuilder(
                        buffer,
                        {
                            name: "tweet.png"
                        }
                    );

                // ==================================
                // TWEET GÖNDER
                // ==================================

                await message.channel.send({
                    files: [attachment]
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
                    "❌ Tweet görseli oluşturulamadı."
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

const TOKEN = process.env.TOKEN;

if (!TOKEN) {

    console.error(
        "❌ TOKEN bulunamadı!"
    );

    process.exit(1);
}

// ==========================================
// CLIENT LOGIN
// ==========================================

client.login(TOKEN)
    .then(() => {

        console.log(
            "✅ Bot Discord'a giriş yaptı!"
        );

    })
    .catch((error) => {

        console.error(
            "❌ Bot giriş yapamadı:"
        );

        console.error(error);
    });
