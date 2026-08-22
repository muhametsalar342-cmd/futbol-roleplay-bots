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

const TOKEN = process.env.TOKEN;

// BURAYA DEĞER YETKİLİSİ ROL ID'SİNİ KOY
const DEGER_YETKILISI_ROL_ID = "1540002147243139133";

// Antrenman verileri
const antrenman = new Map();


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
// BOT AÇILDI
// ==========================================

client.once("ready", () => {
    console.log("--------------------------------");
    console.log(`BOT AKTIF: ${client.user.tag}`);
    console.log("--------------------------------");
});


// ==========================================
// DEĞERİ SAYIYA ÇEVİR
// ==========================================

function parseValue(text) {

    if (!text) return 0;

    let value = text
        .toLowerCase()
        .replace(/€/g, "")
        .replace(/ /g, "")
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
// DEĞERİ FORMATLA
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
// MESAJLAR
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


        // ==========================================
        // .DVER
        // ==========================================

        if (command === ".dver") {

            // Rol ID ayarlanmış mı?
            if (
                DEGER_YETKILISI_ROL_ID ===
                "BURAYA_ROL_ID"
            ) {

                return message.reply(
                    "❌ Kodda Değer Yetkilisi rol ID'sini ayarla."
                );
            }

            // Sadece Değer Yetkilisi
            if (
                !message.member.roles.cache.has(
                    DEGER_YETKILISI_ROL_ID
                )
            ) {

                return message.reply(
                    "❌ Bu komutu sadece **Değer Yetkilisi** kullanabilir."
                );
            }

            // Etiket
            const oyuncu =
                message.mentions.members.first();

            if (!oyuncu) {

                return message.reply(
                    "❌ Kullanım:\n" +
                    "`.dver @oyuncu 5M`"
                );
            }

            // Miktar
            const miktar =
                args[1];

            if (!miktar) {

                return message.reply(
                    "❌ Değer miktarı eksik.\n\n" +
                    "Örnek:\n" +
                    "`.dver @oyuncu 5M`"
                );
            }

            const eklenecek =
                parseValue(miktar);

            if (eklenecek <= 0) {

                return message.reply(
                    "❌ Geçerli bir değer gir.\n\n" +
                    "Örnek: `5M`, `500K`, `1.5M`"
                );
            }

            // Oyuncunun takma adı
            const eskiTakmaAd =
                oyuncu.nickname ||
                oyuncu.user.username;

            // Eski değer
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

            // Toplama
            const yeniDeger =
                eskiDeger + eklenecek;

            // Yeni takma ad
            const yeniTakmaAd =
                changeNicknameValue(
                    eskiTakmaAd,
                    yeniDeger
                );

            if (!yeniTakmaAd) {

                return message.reply(
                    "❌ Yeni takma ad oluşturulamadı."
                );
            }

            try {

                await oyuncu.setNickname(
                    yeniTakmaAd
                );

                return message.reply(
                    `✅ **Değer Verildi**\n\n` +
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
                    "❌ Takma ad değiştirilemedi.\n" +
                    "Botun rolünün oyuncunun rolünden yukarıda olduğundan emin ol."
                );
            }
        }


        // ==========================================
        // ANTRENMAN
        // ==========================================

        if (
            command === ".ant" ||
            command === ".antrenman"
        ) {

            const id =
                message.author.id;

            let sayi =
                antrenman.get(id) || 0;

            sayi++;

            // 10/10
            if (sayi >= 10) {

                antrenman.set(
                    id,
                    0
                );

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

                // +3M
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

                    console.error(
                        "ANTRENMAN HATASI:",
                        error
                    );

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


        // ==========================================
        // PENALTI
        // ==========================================

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


        // ==========================================
        // TWEET
        // HERKES KULLANABİLİR
        // ==========================================

        if (command === ".tweet") {

            const tweetText =
                args.join(" ");

            if (!tweetText) {

                return message.reply(
                    "❌ Kullanım:\n" +
                    "`.tweet Tweet mesajı`"
                );
            }

            // Görsel boyutu
            const width = 1200;
            const height = 675;

            const canvas =
                createCanvas(
                    width,
                    height
                );

            const ctx =
                canvas.getContext("2d");

            // Beyaz arka plan
            ctx.fillStyle =
                "#ffffff";

            ctx.fillRect(
                0,
                0,
                width,
                height
            );

            // Kenarlık
            ctx.strokeStyle =
                "#dddddd";

            ctx.lineWidth = 4;

            ctx.strokeRect(
                10,
                10,
                width - 20,
                height - 20
            );

            // ======================================
            // AVATAR
            // ======================================

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
                    "Avatar alınamadı."
                );
            }

            // ======================================
            // İSİM
            // ======================================

            ctx.fillStyle =
                "#111111";

            ctx.font =
                "bold 36px Arial";

            ctx.fillText(
                message.member.displayName ||
                message.author.username,
                185,
                95
            );

            // ======================================
            // USERNAME
            // ======================================

            ctx.fillStyle =
                "#666666";

            ctx.font =
                "25px Arial";

            ctx.fillText(
                `@${message.author.username}`,
                185,
                130
            );

            // ======================================
            // TWEET METNİ
            // ======================================

            ctx.fillStyle =
                "#111111";

            ctx.font =
                "32px Arial";

            const maxWidth = 1000;

            const words =
                tweetText.split(" ");

            let line = "";

            let y = 220;

            for (
                let i = 0;
                i < words.length;
                i++
            ) {

                const test =
                    line +
                    words[i] +
                    " ";

                const size =
                    ctx.measureText(
                        test
                    );

                if (
                    size.width >
                        maxWidth &&
                    line !== ""
                ) {

                    ctx.fillText(
                        line,
                        90,
                        y
                    );

                    line =
                        words[i] + " ";

                    y += 52;

                } else {

                    line =
                        test;
                }
            }

            if (line !== "") {

                ctx.fillText(
                    line,
                    90,
                    y
                );
            }

            // ======================================
            // TARİH
            // ======================================

            ctx.fillStyle =
                "#777777";

            ctx.font =
                "22px Arial";

            const tarih =
                new Date().toLocaleString(
                    "tr-TR"
                );

            ctx.fillText(
                tarih,
                90,
                560
            );

            // ======================================
            // AYRAÇ
            // ======================================

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

            // ======================================
            // ETKİLEŞİMLER
            // ======================================

            ctx.fillStyle =
                "#555555";

            ctx.font =
                "24px Arial";

            ctx.fillText(
                "↩  0",
                100,
                630
            );

            ctx.fillText(
                "↻  0",
                350,
                630
            );

            ctx.fillText(
                "♡  0",
                600,
                630
            );

            ctx.fillText(
                "↗️  0",
                850,
                630
            );

            // ======================================
            // PNG
            // ======================================

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

            await message.channel.send({
                files: [dosya]
            });

            // Komutu sil
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
// ==========================================

if (!TOKEN) {

    console.error(
        "❌ TOKEN bulunamadı! Rainway Environment Variables kısmına TOKEN ekle."
    );

} else {

    client.login(TOKEN)
        .catch((error) => {
            console.error(
                "❌ DISCORD LOGIN HATASI:",
                error
            );
        });
}
