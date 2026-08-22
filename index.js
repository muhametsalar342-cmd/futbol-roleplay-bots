const {
    Client,
    GatewayIntentBits,
    AttachmentBuilder
} = require("discord.js");

const { createCanvas, loadImage } = require("canvas");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ==========================================
// AYARLAR
// ==========================================

const TOKEN = process.env.TOKEN;

// BURAYA DEĞER YETKİLİSİ ROL ID'SİNİ YAZ
const DEGER_YETKILISI_ROL_ID = "1540002147243139133";

// Antrenman verileri
const antrenman = new Map();


// ==========================================
// BOT HAZIR
// ==========================================

client.once("ready", () => {
    console.log(`${client.user.tag} aktif!`);
});


// ==========================================
// DEĞERİ SAYIYA ÇEVİR
// ==========================================

function parseValue(text) {

    if (!text) return 0;

    text = text
        .toLowerCase()
        .replace("€", "")
        .trim();

    let multiplier = 1;

    if (text.endsWith("k")) {
        multiplier = 1000;
        text = text.slice(0, -1);
    }

    else if (text.endsWith("m")) {
        multiplier = 1000000;
        text = text.slice(0, -1);
    }

    else if (text.endsWith("b")) {
        multiplier = 1000000000;
        text = text.slice(0, -1);
    }

    const number = parseFloat(
        text.replace(",", ".")
    );

    if (isNaN(number)) return 0;

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

    if (!match) return null;

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

    if (message.author.bot) return;
    if (!message.guild) return;

    const args =
        message.content
            .trim()
            .split(/\s+/);

    const command =
        args.shift()?.toLowerCase();


    // ==========================================
    // DEĞER VERME
    // .dver @oyuncu 5M
    // SADECE DEĞER YETKİLİSİ
    // ==========================================

    if (command === ".dver") {

        // Rol ID kontrolü
        if (
            DEGER_YETKILISI_ROL_ID ===
            "BURAYA_ROL_ID"
        ) {
            return message.reply(
                "❌ Kodda Değer Yetkilisi rol ID'sini ayarlamalısın."
            );
        }

        // SADECE DEĞER YETKİLİSİ
        if (
            !message.member.roles.cache.has(
                DEGER_YETKILISI_ROL_ID
            )
        ) {
            return message.reply(
                "❌ Bu komutu sadece **Değer Yetkilisi** kullanabilir."
            );
        }

        // Oyuncu etiketi zorunlu
        const member =
            message.mentions.members.first();

        if (!member) {
            return message.reply(
                "❌ Kullanım:\n`.dver @oyuncu 5M`"
            );
        }

        const miktar = args[1];

        if (!miktar) {
            return message.reply(
                "❌ Değer miktarı yazmalısın.\n" +
                "Örnek: `.dver @oyuncu 5M`"
            );
        }

        const eklenecek =
            parseValue(miktar);

        if (eklenecek <= 0) {
            return message.reply(
                "❌ Geçerli bir değer gir.\n" +
                "Örnek: `5M`, `500K`, `1.5M`"
            );
        }

        // Mevcut takma ad
        const eskiTakmaAd =
            member.nickname ||
            member.user.username;

        // Mevcut değer
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

        // ESKİ DEĞER + YENİ DEĞER
        const yeniDeger =
            eskiDeger + eklenecek;

        const yeniTakmaAd =
            changeNicknameValue(
                eskiTakmaAd,
                yeniDeger
            );

        try {

            await member.setNickname(
                yeniTakmaAd
            );

            return message.reply(
                `✅ ${member} oyuncusuna değer verildi!\n\n` +
                `💰 Eski değer: **${formatValue(eskiDeger)}**\n` +
                `➕ Eklenen: **${formatValue(eklenecek)}**\n` +
                `📈 Yeni değer: **${formatValue(yeniDeger)}**`
            );

        } catch (error) {

            console.error(error);

            return message.reply(
                "❌ Takma ad değiştirilemedi. Botun rol sırasını ve Takma Adları Yönet yetkisini kontrol et."
            );
        }
    }


    // ==========================================
    // ANTRENMAN
    // .ant
    // .antrenman
    // ==========================================

    if (
        command === ".ant" ||
        command === ".antrenman"
    ) {

        const userId =
            message.author.id;

        let count =
            antrenman.get(userId) || 0;

        count++;

        // 10/10
        if (count >= 10) {

            // Yeni seri
            antrenman.set(
                userId,
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
                    `🏋️ **ANTRENMAN TAMAMLANDI!**\n\n` +
                    `📊 Antrenman: **10/10**\n` +
                    `❌ Takma adında € değeri bulunamadı.\n\n` +
                    `🔄 Yeni seri: **0/10**`
                );
            }

            // +3M€
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
                    `💰 Değer artışı: **+3M€**\n` +
                    `📊 Eski değer: **${formatValue(eskiDeger)}**\n` +
                    `📈 Yeni değer: **${formatValue(yeniDeger)}**\n\n` +
                    `🔄 Yeni seri: **0/10**`
                );

            } catch (error) {

                console.error(error);

                return message.reply(
                    "❌ Takma ad değiştirilemedi. Botun rol sırasını kontrol et."
                );
            }
        }

        // Normal antrenman
        antrenman.set(
            userId,
            count
        );

        return message.reply(
            `🏋️ **Antrenman yapıldı!**\n\n` +
            `📊 Antrenman: **${count}/10**\n` +
            `🎯 10/10 olduğunda mevcut değerine **+3M€** eklenecek.`
        );
    }


    // ==========================================
    // PENALTI
    // .pen
    // .penaltı
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

        } else {

            return message.reply(
                `⚽ **PENALTI**\n\n` +
                `🎯 Vuruş yapıldı!\n` +
                `🥅 Top ağlarda!\n\n` +
                `✅ **GOOOOOL!**`
            );
        }
    }


    // ==========================================
    // TWEET
    // HERKES KULLANABİLİR
    // .tweet mesaj
    // ==========================================

    if (command === ".tweet") {

        const tweetText =
            args.join(" ");

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
                100,
                105,
                55,
                0,
                Math.PI * 2
            );

            ctx.closePath();

            ctx.clip();

            ctx.drawImage(
                avatar,
                45,
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
        ctx.fillStyle =
            "#111111";

        ctx.font =
            "bold 36px Arial";

        ctx.fillText(
            message.member.displayName ||
            message.author.username,
            180,
            90
        );

        // USERNAME
        ctx.fillStyle =
            "#666666";

        ctx.font =
            "26px Arial";

        ctx.fillText(
            `@${message.author.username}`,
            180,
            125
        );

        // TWEET METNİ
        ctx.fillStyle =
            "#111111";

        ctx.font =
            "32px Arial";

        const maxWidth =
            1020;

        const words =
            tweetText.split(" ");

        let line = "";
        let y = 215;

        for (
            let i = 0;
            i < words.length;
            i++
        ) {

            const testLine =
                line +
                words[i] +
                " ";

            const metrics =
                ctx.measureText(
                    testLine
                );

            if (
                metrics.width >
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

                y += 50;

            } else {

                line =
                    testLine;
            }
        }

        if (line !== "") {

            ctx.fillText(
                line,
                90,
                y
            );
        }

        // TARİH
        const tarih =
            new Date().toLocaleString(
                "tr-TR"
            );

        ctx.fillStyle =
            "#777777";

        ctx.font =
            "22px Arial";

        ctx.fillText(
            tarih,
            90,
            height - 105
        );

        // ALT ÇİZGİ
        ctx.strokeStyle =
            "#dddddd";

        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.moveTo(
            70,
            height - 80
        );

        ctx.lineTo(
            width - 70,
            height - 80
        );

        ctx.stroke();

        // ETKİLEŞİMLER
        ctx.fillStyle =
            "#555555";

        ctx.font =
            "24px Arial";

        ctx.fillText(
            "↩  0",
            100,
            height - 35
        );

        ctx.fillText(
            "♧  0",
            360,
            height - 35
        );

        ctx.fillText(
            "♡  0",
            620,
            height - 35
        );

        ctx.fillText(
            "↗️  0",
            880,
            height - 35
        );

        // PNG
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

        // GÖNDER
        await message.channel.send({
            files: [attachment]
        });

        // KOMUTU SİL
        try {
            await message.delete();
        } catch {}
    }
});


// ==========================================
// BOT TOKEN
// ==========================================

client.login(TOKEN);
