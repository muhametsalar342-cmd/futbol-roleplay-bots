const {
    Client,
    GatewayIntentBits
} = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// =================================================
// AYARLAR
// =================================================

// BURAYA DEĞER YETKİLİSİ ROL ID'SİNİ YAZ
const DEGER_YETKILISI_ROL_ID = "1540002147243139133";

// Tokeni Rainway Environment Variables kısmına koy
const TOKEN = process.env.TOKEN;


// =================================================
// ANTRENMAN VERİLERİ
// =================================================

const antrenman = new Map();


// =================================================
// BOT HAZIR
// =================================================

client.once("ready", () => {
    console.log(`${client.user.tag} aktif!`);
});


// =================================================
// DEĞERİ SAYIYA ÇEVİR
// =================================================

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

    } else if (text.endsWith("m")) {

        multiplier = 1000000;
        text = text.slice(0, -1);

    } else if (text.endsWith("b")) {

        multiplier = 1000000000;
        text = text.slice(0, -1);
    }

    const number = parseFloat(
        text.replace(",", ".")
    );

    if (isNaN(number)) return 0;

    return number * multiplier;
}


// =================================================
// SAYIYI € FORMATINA ÇEVİR
// =================================================

function formatValue(value) {

    if (value >= 1000000000) {

        const result = value / 1000000000;

        return `${Number(result.toFixed(1))}B€`;
    }

    if (value >= 1000000) {

        const result = value / 1000000;

        return `${Number(result.toFixed(1))}M€`;
    }

    if (value >= 1000) {

        const result = value / 1000;

        return `${Number(result.toFixed(1))}K€`;
    }

    return `${value}€`;
}


// =================================================
// TAKMA ADDAKİ DEĞERİ BUL
// =================================================

function getNicknameValue(nickname) {

    const match = nickname.match(
        /([\d.,]+)\s*([KMBkmb]?)€/
    );

    if (!match) return null;

    return parseValue(
        match[1] + match[2]
    );
}


// =================================================
// TAKMA ADDAKİ DEĞERİ DEĞİŞTİR
// =================================================

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


// =================================================
// MESAJ KOMUTLARI
// =================================================

client.on("messageCreate", async (message) => {

    if (message.author.bot) return;

    if (!message.guild) return;


    const args = message.content
        .trim()
        .split(/\s+/);

    const command =
        args[0].toLowerCase();


    // =================================================
    // DEĞER VERME
    // .dver @oyuncu 5M
    // =================================================

    if (command === ".dver") {


        // ---------------------------------------------
        // DEĞER YETKİLİSİ KONTROLÜ
        // ---------------------------------------------

        if (
            DEGER_YETKILISI_ROL_ID ===
            "BURAYA_ROL_ID"
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


        // ---------------------------------------------
        // OYUNCU ETİKETİ
        // ---------------------------------------------

        const member =
            message.mentions.members.first();


        if (!member) {

            return message.reply(
                "❌ Kullanım:\n`.dver @oyuncu 5M`"
            );
        }


        // ---------------------------------------------
        // VERİLECEK DEĞER
        // ---------------------------------------------

        const miktar = args[2];


        if (!miktar) {

            return message.reply(
                "❌ Bir değer miktarı yazmalısın.\n\n" +
                "Örnek:\n" +
                "`.dver @oyuncu 5M`"
            );
        }


        const eklenecek =
            parseValue(miktar);


        if (eklenecek <= 0) {

            return message.reply(
                "❌ Geçerli bir değer gir.\n\n" +
                "Örnekler:\n" +
                "`5M`\n" +
                "`500K`\n" +
                "`1.5M`"
            );
        }


        // ---------------------------------------------
        // MEVCUT TAKMA AD
        // ---------------------------------------------

        const eskiTakmaAd =
            member.nickname ||
            member.user.username;


        // ---------------------------------------------
        // MEVCUT DEĞER
        // ---------------------------------------------

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


        // ---------------------------------------------
        // ESKİ DEĞER + VERİLEN DEĞER
        // ---------------------------------------------

        const yeniDeger =
            eskiDeger + eklenecek;


        // ---------------------------------------------
        // TAKMA ADI DEĞİŞTİR
        // ---------------------------------------------

        const yeniTakmaAd =
            changeNicknameValue(
                eskiTakmaAd,
                yeniDeger
            );


        if (!yeniTakmaAd) {

            return message.reply(
                "❌ Takma ad değiştirilirken hata oluştu."
            );
        }


        try {

            await member.setNickname(
                yeniTakmaAd
            );


            return message.reply(
                `✅ ${member} oyuncusuna değer verildi!\n\n` +
                `💰 Eski değer: **${formatValue(eskiDeger)}**\n` +
                `➕ Verilen: **${formatValue(eklenecek)}**\n` +
                `📈 Yeni değer: **${formatValue(yeniDeger)}**`
            );


        } catch (error) {

            console.error(error);

            return message.reply(
                "❌ Takma ad değiştirilemedi.\n\n" +
                "Botun rolünün oyuncunun rolünden yukarıda olduğundan ve " +
                "**Takma Adları Yönet** yetkisine sahip olduğundan emin ol."
            );
        }
    }


    // =================================================
    // ANTRENMAN
    // .ant
    // .antrenman
    // =================================================

    if (
        command === ".ant" ||
        command === ".antrenman"
    ) {


        const userId =
            message.author.id;


        let count =
            antrenman.get(userId) || 0;


        count++;


        // ---------------------------------------------
        // 10/10 TAMAMLANDI
        // ---------------------------------------------

        if (count >= 10) {

            // Yeni seri başlat
            antrenman.set(
                userId,
                0
            );


            const member =
                message.member;


            const nickname =
                member.nickname ||
                member.user.username;


            const eskiDeger =
                getNicknameValue(
                    nickname
                );


            if (eskiDeger === null) {

                return message.reply(
                    `🏋️ **ANTRENMAN TAMAMLANDI!**\n\n` +
                    `📊 Antrenman: **10/10**\n` +
                    `❌ Takma adında geçerli bir € değeri bulunamadı.\n\n` +
                    `🔄 Yeni antrenman: **0/10**`
                );
            }


            // ---------------------------------------------
            // +3M€
            // ---------------------------------------------

            const yeniDeger =
                eskiDeger + 3000000;


            const yeniTakmaAd =
                changeNicknameValue(
                    nickname,
                    yeniDeger
                );


            try {

                await member.setNickname(
                    yeniTakmaAd
                );


                return message.reply(
                    `🏋️ **ANTRENMAN TAMAMLANDI!**\n\n` +
                    `📊 Antrenman: **10/10**\n` +
                    `💰 Değer artışı: **+3M€**\n` +
                    `📊 Eski değer: **${formatValue(eskiDeger)}**\n` +
                    `📈 Yeni değer: **${formatValue(yeniDeger)}**\n\n` +
                    `🔄 Yeni antrenman serisi: **0/10**`
                );


            } catch (error) {

                console.error(error);

                return message.reply(
                    "❌ Değer artırıldı fakat takma ad değiştirilemedi. " +
                    "Botun rol sırasını kontrol et."
                );
            }
        }


        // ---------------------------------------------
        // NORMAL ANTRENMAN
        // ---------------------------------------------

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


    // =================================================
    // PENALTI
    // .pen
    // .penaltı
    // =================================================

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

});


// =================================================
// BOTU BAŞLAT
// =================================================

client.login(TOKEN);
