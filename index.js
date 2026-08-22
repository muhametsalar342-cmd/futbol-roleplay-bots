const {
    Client,
    GatewayIntentBits,
    AttachmentBuilder
} = require("discord.js");

// ==========================================
// AYARLAR
// ==========================================

// DEĞER YETKİLİSİ ROL ID
const DEGER_YETKILISI_ROL_ID = "1540002147243139133";

// Antrenman sayıları
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
// DEĞER PARSE
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
// DEĞER FORMAT
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
// XML GÜVENLİ HALE GETİR
// ==========================================

function escapeXML(text) {

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

// ==========================================
// TWEET SATIRLARI
// ==========================================

function createTweetLines(text) {

    const words =
        String(text).split(/\s+/);

    const lines = [];
    let line = "";

    for (const word of words) {

        const test =
            line === ""
                ? word
                : line + " " + word;

        if (test.length > 55) {

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

    return lines.slice(0, 7);
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
                "1540002147243139133"
            ) {

                return message.reply(
                    "❌ Önce kodda Değer Yetkilisi rol ID'sini ayarla."
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
                    "❌ Değer miktarı yazmalısın.\nÖrnek: `.dver @oyuncu 5M`"
                );
            }

            const eklenecek =
                parseValue(miktar);

            if (eklenecek <= 0) {

                return message.reply(
                    "❌ Geçerli bir değer gir.\nÖrnek: `5M`, `500K`, `1.5M`"
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
                    "❌ Oyuncunun takma adında € değeri bulunamadı.\n\n" +
                    "Örnek:\n" +
                    "`W.Sneijder | 🇳🇬 | SNT | 1M€`"
                );
            }

            // ÖNCEKİ DEĞER + YENİ DEĞER
            const yeniDeger =
                eskiDeger + eklenecek;

            const yeniTakmaAd =
                changeNicknameValue(
                    eskiTakmaAd,
                    yeniDeger
                );

            if (!yeniTakmaAd) {

                return message.reply(
                    "❌ Takma ad değiştirilemedi."
                );
            }

            try {

                await oyuncu.setNickname(
                    yeniTakmaAd
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
                    "❌ Takma ad değiştirilemedi. Botun rolünün oyuncunun rolünden yukarıda olduğundan emin ol."
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

            const userId =
                message.author.id;

            let sayi =
                antrenman.get(userId) || 0;

            sayi++;

            // 10/10
            if (sayi >= 10) {

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
                        "🏋️ **ANTRENMAN 10/10!**\n\n" +
                        "❌ Takma adında € değeri bulunamadı.\n" +
                        "🔄 Yeni antrenman: **0/10**"
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

            antrenman.set(
                userId,
                sayi
            );

            return message.reply(
                `🏋️ **Antrenman yapıldı!**\n\n` +
                `📊 Antrenman: **${sayi}/10**\n` +
                `🎯 10/10 olduğunda mevcut değerine **+3M€**`
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

            const lines =
                createTweetLines(
                    tweetText
                );

            let messageSVG = "";

            lines.forEach(
                (line, index) => {

                    messageSVG += `
<text
    x="80"
    y="${230 + index * 50}"
    font-family="Arial, sans-serif"
    font-size="34"
    font-weight="500"
    fill="#111111"
>${escapeXML(line)}</text>`;
                }
            );

            const displayName =
                escapeXML(
                    message.member.displayName ||
                    message.author.username
                );

            const username =
                escapeXML(
                    message.author.username
                );

            const firstLetter =
                escapeXML(
                    (
                        message.member.displayName ||
                        message.author.username
                    )
                    .charAt(0)
                    .toUpperCase()
                );

            const tarih =
                escapeXML(
                    new Date().toLocaleString(
                        "tr-TR"
                    )
                );

            // ==================================
            // SVG
            // ==================================

            const svg = `
<svg
    xmlns="http://www.w3.org/2000/svg"
    width="1200"
    height="675"
    viewBox="0 0 1200 675"
>

<rect
    width="1200"
    height="675"
    fill="#ffffff"
/>

<rect
    x="15"
    y="15"
    width="1170"
    height="645"
    rx="20"
    fill="#ffffff"
    stroke="#dddddd"
    stroke-width="3"
/>

<circle
    cx="105"
    cy="105"
    r="55"
    fill="#e5e7eb"
/>

<text
    x="105"
    y="120"
    text-anchor="middle"
    font-family="Arial"
    font-size="45"
    font-weight="bold"
    fill="#555555"
>${firstLetter}</text>

<text
    x="185"
    y="95"
    font-family="Arial"
    font-size="36"
    font-weight="bold"
    fill="#111111"
>${displayName}</text>

<text
    x="185"
    y="130"
    font-family="Arial"
    font-size="24"
    fill="#777777"
>@${username}</text>

${messageSVG}

<text
    x="80"
    y="560"
    font-family="Arial"
    font-size="22"
    fill="#777777"
>${tarih}</text>

<line
    x1="70"
    y1="585"
    x2="1130"
    y2="585"
    stroke="#dddddd"
    stroke-width="2"
/>

<text
    x="100"
    y="630"
    font-family="Arial"
    font-size="24"
    fill="#555555"
>↩ 0</text>

<text
    x="350"
    y="630"
    font-family="Arial"
    font-size="24"
    fill="#555555"
>↻ 0</text>

<text
    x="600"
    y="630"
    font-family="Arial"
    font-size="24"
    fill="#555555"
>♡ 0</text>

<text
    x="850"
    y="630"
    font-family="Arial"
    font-size="24"
    fill="#555555"
>↗️ 0</text>

</svg>`;

            const buffer =
                Buffer.from(
                    svg,
                    "utf8"
                );

            const dosya =
                new AttachmentBuilder(
                    buffer,
                    {
                        name: "tweet.svg"
                    }
                );

            await message.channel.send({
                files: [dosya]
            });

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
// RAINWAY'DEN ALIR
// ==========================================

const TOKEN =
    process.env.TOKEN;

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
