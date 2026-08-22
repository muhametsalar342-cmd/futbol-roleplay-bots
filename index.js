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

// DEĞER YETKİLİSİ ROL ID
const DEGER_YETKILISI_ROL_ID = "1540002147243139133";

// Antrenman verileri
const antrenman = new Map();

// ==========================================
// DISCORD CLIENT
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
    console.log(`BOT AKTİF: ${client.user.tag}`);
    console.log("================================");
});

// ==========================================
// DEĞERİ SAYIYA ÇEVİR
// ==========================================

function parseValue(text) {

    if (!text) return 0;

    let value = text
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

    const match = nickname.match(
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

function changeNicknameValue(
    nickname,
    newValue
) {

    const regex =
        /([\d.,]+)\s*([KMBkmb]?)€/;

    if (!regex.test(nickname)) {
        return null;
    }

    return nickname.replace(
        regex,
        formatValue(newValue)
    );
}

// ==========================================
// MESAJ KOMUTLARI
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

            const miktar = args[1];

            if (!miktar) {
                return message.reply(
                    "❌ Değer miktarı yazmalısın.\nÖrnek: `.dver @oyuncu 5M`"
                );
            }

            const eklenecek =
                parseValue(miktar);

            if (eklenecek <= 0) {
                return message.reply(
                    "❌ Geçerli bir değer gir."
                );
            }

            const eskiTakmaAd =
                oyuncu.nickname ||
                oyuncu.user.username;

            const eskiDeger =
                getNicknameValue(
                    eskiTakmaAd
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

            const yeniTakmaAd =
                changeNicknameValue(
                    eskiTakmaAd,
                    yeniDeger
                );

            try {

                await oyuncu.setNickname(
                    yeniTakmaAd
                );

                return message.reply(
                    `✅ **Değer Verildi**\n\n` +
                    `👤 Oyuncu: ${oyuncu}\n` +
                    `💰 Eski: **${formatValue(eskiDeger)}**\n` +
                    `➕ Eklenen: **${formatValue(eklenecek)}**\n` +
                    `📈 Yeni: **${formatValue(yeniDeger)}**`
                );

            } catch (error) {

                console.error(error);

                return message.reply(
                    "❌ Takma ad değiştirilemedi. Botun rol sırasını kontrol et."
                );
            }
        }

        // ======================================
        // .ANT / .ANTRENMAN
        // HERKES
        // ======================================

        if (
            command === ".ant" ||
            command === ".antrenman"
        ) {

            const id =
                message.author.id;

            let sayi =
                antrenman.get(id) || 0;

            sayi++;

            if (sayi >= 10) {

                antrenman.set(id, 0);

                const nickname =
                    message.member.nickname ||
                    message.author.username;

                const eskiDeger =
                    getNicknameValue(
                        nickname
                    );

                if (eskiDeger === null) {
                    return message.reply(
                        "🏋️ **10/10 ANTRENMAN!**\n\n" +
                        "❌ Takma adında € değeri bulunamadı.\n" +
                        "🔄 Yeni seri: **0/10**"
                    );
                }

                const yeniDeger =
                    eskiDeger + 3000000;

                const yeniTakmaAd =
                    changeNicknameValue(
                        nickname,
                        yeniDeger
                    );

                try {

                    await message.member.setNickname(
                        yeniTakmaAd
                    );

                    return message.reply(
                        `🏋️ **ANTRENMAN TAMAMLANDI!**\n\n` +
                        `📊 Antrenman: **10/10**\n` +
                        `💰 Kazanç: **+3M€**\n` +
                        `📊 Eski değer: **${formatValue(eskiDeger)}**\n` +
                        `📈 Yeni değer: **${formatValue(yeniDeger)}**\n\n` +
                        `🔄 Yeni seri: **0/10**`
                    );

                } catch (error) {

                    console.error(error);

                    return message.reply(
                        "❌ Takma ad değiştirilemedi."
                    );
                }
            }

            antrenman.set(
                id,
                sayi
            );

            return message.reply(
                `🏋️ **Antrenman yapıldı!**\n\n` +
                `📊 Antrenman: **${sayi}/10**\n` +
                `🎯 10/10 olduğunda **+3M€**`
            );
        }

        // ======================================
        // .PEN / .PENALTI
        // HERKES
        // ======================================

        if (
            command === ".pen" ||
            command === ".penaltı"
        ) {

            const sans =
                Math.floor(
                    Math.random() * 100
                ) + 1;

            if (sans <= 50) {

                return message.reply(
                    `⚽ **PENALTI**\n\n` +
                    `🎯 Vuruş yapıldı!\n` +
                    `🧤 Kaleci kurtardı!\n\n` +
                    `❌ **PENALTI KAÇTI!**`
                );
            }

            return message.reply(
                `⚽ **PENALTI**\n\n` +
                `🎯 Vuruş yapıldı!\n` +
                `🥅 Top ağlarda!\n\n` +
                `✅ **GOOOOOL!**`
            );
        }

        // ======================================
        // .TWEET
        // HERKES
        // ======================================

        if (command === ".tweet") {

            const tweetText =
                args.join(" ").trim();

            if (!tweetText) {
                return message.reply(
                    "❌ Kullanım:\n`.tweet Tweet mesajı`"
                );
            }

            const width = 1200;
            const height = 675;

            const canvas =
                createCanvas(
                    width,
                    height
                );

            const ctx =
                canvas.getContext("2d");

            // ARKA PLAN
            ctx.fillStyle = "#ffffff";

            ctx.fillRect(
                0,
                0,
                width,
                height
            );

            // ÇERÇEVE
            ctx.strokeStyle = "#dddddd";
            ctx.lineWidth = 3;

            ctx.strokeRect(
                15,
                15,
                width - 30,
                height - 30
            );

            // AVATAR
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

            } catch (error) {
                console.log(
                    "Avatar yüklenemedi."
                );
            }

            // İSİM
            ctx.fillStyle = "#111111";
            ctx.font = "bold 36px Arial";

            ctx.fillText(
                message.member.displayName,
                185,
                95
            );

            // USERNAME
            ctx.fillStyle = "#777777";
            ctx.font = "24px Arial";

            ctx.fillText(
                `@${message.author.username}`,
                185,
                130
            );

            // TWEET MESAJI
            ctx.fillStyle = "#111111";
            ctx.font = "34px Arial";

            const maxWidth = 1000;
            const lineHeight = 50;

            let line = "";
            let y = 220;

            const words =
                tweetText.split(/\s+/);

            for (const word of words) {

                const testLine =
                    line.length === 0
                        ? word
                        : line + " " + word;

                const textWidth =
                    ctx.measureText(
                        testLine
                    ).width;

                if (
                    textWidth > maxWidth &&
                    line.length > 0
                ) {

                    ctx.fillText(
                        line,
                        90,
                        y
                    );

                    line = word;
                    y += lineHeight;

                } else {

                    line = testLine;
                }
            }

            if (line.length > 0) {

                ctx.fillText(
                    line,
                    90,
                    y
                );
            }

            // TARİH
            ctx.fillStyle = "#777777";
            ctx.font = "22px Arial";

            ctx.fillText(
                new Date().toLocaleString("tr-TR"),
                90,
                560
            );

            // ALT ÇİZGİ
            ctx.strokeStyle = "#dddddd";
            ctx.lineWidth = 2;

            ctx.beginPath();

            ctx.moveTo(70, 585);
            ctx.lineTo(1130, 585);

            ctx.stroke();

            // ETKİLEŞİMLER
            ctx.fillStyle = "#555555";
            ctx.font = "24px Arial";

            ctx.fillText("↩ 0", 100, 630);
            ctx.fillText("↻ 0", 350, 630);
            ctx.fillText("♡ 0", 600, 630);
            ctx.fillText("↗️ 0", 850, 630);

            // PNG
            const buffer =
                canvas.toBuffer("image/png");

            const dosya =
                new AttachmentBuilder(
                    buffer,
                    {
                        name: "tweet.png"
                    }
                );

            await message.channel.send({
                files: [dosya]
            });

            // KOMUTU SİL
            try {
                await message.delete();
            } catch {}

            return;
        }

    } catch (error) {

        console.error(
            "GENEL HATA:",
            error
        );

        try {
            await message.reply(
                "❌ Komut çalışırken bir hata oluştu."
            );
        } catch {}
    }
});

// ==========================================
// TOKEN
// RAINWAY ENVIRONMENT VARIABLE
// ==========================================

const TOKEN = process.env.TOKEN;

if (!TOKEN) {

    console.error(
        "❌ TOKEN bulunamadı!"
    );

    console.error(
        "Rainway'de TOKEN adlı Environment Variable oluştur."
    );

    process.exit(1);
}

client.login(TOKEN)
    .then(() => {
        console.log(
            "✅ Discord'a giriş yapıldı."
        );
    })
    .catch((error) => {

        console.error(
            "❌ Discord giriş hatası:",
            error
        );

        process.exit(1);
    });
