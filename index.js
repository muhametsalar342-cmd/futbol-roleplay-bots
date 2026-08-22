const {
    Client,
    GatewayIntentBits
} = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ==========================================
// AYARLAR
// ==========================================

const PREFIX = ".";

// BURAYA DEĞER YETKİLİSİ ROL ID'SİNİ YAZ
const DEGER_YETKILI_ROL_ID = "ROL_ID_BURAYA";

// Antrenman 10/10 olunca
const ANTRENMAN_ODULU = 1000000;

// Penaltı gol olunca
const PENALTI_ODULU = 2000000;

// ==========================================
// ANTRENMAN VERİLERİ
// ==========================================

const antrenmanlar = new Map();

// ==========================================
// BOT HAZIR
// ==========================================

client.once("ready", () => {

    console.log(`${client.user.tag} aktif!`);

    client.user.setPresence({
        activities: [
            {
                name: "Legendary League | Futbol RP",
                type: 3
            }
        ],
        status: "online"
    });

});

// ==========================================
// MESAJ SİSTEMİ
// ==========================================

client.on("messageCreate", async (message) => {

    try {

        if (message.author.bot) return;
        if (!message.guild) return;

        if (!message.content.startsWith(PREFIX)) return;

        const args = message.content
            .slice(PREFIX.length)
            .trim()
            .split(/\s+/);

        const command = args.shift().toLowerCase();

        // ======================================
        // .dver
        // ======================================

        if (command === "dver") {

            if (
                !message.member.roles.cache.has(
                    DEGER_YETKILI_ROL_ID
                )
            ) {
                return message.reply(
                    "❌ Bu komutu kullanmak için **Değer Yetkilisi** rolüne sahip olmalısın."
                );
            }

            const oyuncu =
                message.mentions.members.first();

            if (!oyuncu) {
                return message.reply(
                    "❌ Kullanım: `.dver @oyuncu 5M`"
                );
            }

            // Mention args[0], değer args[1]
            const miktarYazisi = args[1];

            if (!miktarYazisi) {
                return message.reply(
                    "❌ Değer miktarı yazmalısın.\n\n" +
                    "Örnek: `.dver @oyuncu 5M`"
                );
            }

            const verilenDeger =
                parseDeger(miktarYazisi);

            if (
                isNaN(verilenDeger) ||
                verilenDeger <= 0
            ) {
                return message.reply(
                    "❌ Geçerli bir değer gir.\n\n" +
                    "`500K` • `1M` • `5M` • `1.5M` • `2B`"
                );
            }

            await degerEkle(
                oyuncu,
                verilenDeger,
                message
            );

            return;
        }

        // ======================================
        // .antrenman VE .ant
        // ======================================

        if (
            command === "antrenman" ||
            command === "ant"
        ) {

            const oyuncu =
                message.mentions.members.first();

            if (!oyuncu) {
                return message.reply(
                    "❌ Kullanım: `.ant @oyuncu`"
                );
            }

            const id = oyuncu.id;

            let seviye =
                antrenmanlar.get(id) || 0;

            seviye++;

            // 10/10 tamamlandı
            if (seviye >= 10) {

                antrenmanlar.set(id, 0);

                await degerEkle(
                    oyuncu,
                    ANTRENMAN_ODULU,
                    message,
                    false
                );

                return message.reply(
                    `🏋️ **${oyuncu.user.username}** antrenmanı tamamladı!\n\n` +
                    `🔥 Antrenman: **10/10**\n` +
                    `🔄 Yeni Antrenman: **0/10**\n` +
                    `💰 Ödül: **+1M€**`
                );

            }

            antrenmanlar.set(id, seviye);

            return message.reply(
                `🏋️ **${oyuncu.user.username}** antrenman yaptı!\n\n` +
                `📈 Antrenman: **${seviye}/10**\n` +
                `🎯 Sonraki ödül: **10/10**`
            );
        }

        // ======================================
        // .penaltı VE .pen
        // ======================================

        if (
            command === "penaltı" ||
            command === "penalti" ||
            command === "pen"
        ) {

            const oyuncu =
                message.mentions.members.first();

            if (!oyuncu) {
                return message.reply(
                    "❌ Kullanım: `.pen @oyuncu`"
                );
            }

            // Rastgele penaltı
            const gol =
                Math.random() < 0.5;

            if (gol) {

                await degerEkle(
                    oyuncu,
                    PENALTI_ODULU,
                    message,
                    false
                );

                return message.reply(
                    `⚽ **PENALTI!**\n\n` +
                    `🥅 **${oyuncu.user.username}** penaltıyı kullandı!\n\n` +
                    `🟢 **GOOOOL!**\n` +
                    `💰 Değer Ödülü: **+2M€**`
                );

            } else {

                return message.reply(
                    `⚽ **PENALTI!**\n\n` +
                    `🥅 **${oyuncu.user.username}** penaltıyı kullandı!\n\n` +
                    `🔴 **KAÇIRDI!**\n` +
                    `💰 Değer değişmedi.`
                );

            }
        }

        // ======================================
        // .deger
        // ======================================

        if (command === "deger") {

            const oyuncu =
                message.mentions.members.first();

            if (!oyuncu) {
                return message.reply(
                    "❌ Kullanım: `.deger @oyuncu`"
                );
            }

            const isim =
                oyuncu.nickname ||
                oyuncu.user.username;

            const regex =
                /(\d+(?:[.,]\d+)?)\s*(K|M|B)?\s*€?\s*$/i;

            const eslesen =
                isim.match(regex);

            if (!eslesen) {
                return message.reply(
                    "❌ Bu oyuncunun takma adında değer bulunamadı."
                );
            }

            return message.reply(
                `💎 **${oyuncu.user.username}** oyuncusunun değeri: **${eslesen[1]}${eslesen[2] || ""}€**`
            );
        }

    } catch (error) {

        console.error("KOMUT HATASI:", error);

        return message.reply(
            "❌ İşlem sırasında bir hata oluştu."
        ).catch(() => {});

    }

});

// ==========================================
// DEĞER EKLEME
// ==========================================

async function degerEkle(
    oyuncu,
    eklenecekDeger,
    message,
    cevapVer = true
) {

    const eskiIsim =
        oyuncu.nickname ||
        oyuncu.user.username;

    const regex =
        /(\d+(?:[.,]\d+)?)\s*(K|M|B)?\s*€?\s*$/i;

    const eslesen =
        eskiIsim.match(regex);

    if (!eslesen) {

        return message.reply(
            "❌ Oyuncunun takma adının sonunda değer bulunamadı.\n\n" +
            "Örnek:\n" +
            "`W.Sneijder | 🇹🇷 | SNT | 1M€`"
        );

    }

    const mevcutSayi =
        parseFloat(
            eslesen[1].replace(",", ".")
        );

    const mevcutBirim =
        eslesen[2]
            ? eslesen[2].toUpperCase()
            : "";

    const mevcutDeger =
        birimeCevir(
            mevcutSayi,
            mevcutBirim
        );

    const yeniDeger =
        mevcutDeger + eklenecekDeger;

    const yeniDegerYazisi =
        formatDeger(yeniDeger);

    const yeniIsim =
        eskiIsim.replace(
            regex,
            `${yeniDegerYazisi}€`
        );

    if (yeniIsim.length > 32) {

        return message.reply(
            "❌ Oyuncunun takma adı 32 karakter sınırını aşıyor."
        );

    }

    try {

        await oyuncu.setNickname(
            yeniIsim
        );

        if (cevapVer) {

            return message.reply(
                `💰 **${oyuncu.user.username}**\n\n` +
                `Eski Değer: **${formatDeger(mevcutDeger)}€**\n` +
                `Eklenen: **+${formatDeger(eklenecekDeger)}€**\n` +
                `Yeni Değer: **${yeniDegerYazisi}€**`
            );

        }

    } catch (error) {

        console.error(error);

        return message.reply(
            "❌ Takma ad değiştirilemedi. Botun **Takma Adları Yönet** yetkisini ve rol sırasını kontrol et."
        );

    }

}

// ==========================================
// DEĞER OKUMA
// ==========================================

function parseDeger(deger) {

    if (!deger) return NaN;

    const temiz =
        String(deger)
            .toUpperCase()
            .trim()
            .replace(/€/g, "")
            .replace(",", ".");

    const match =
        temiz.match(
            /^(\d+(?:\.\d+)?)(K|M|B)$/
        );

    if (!match) return NaN;

    const sayi =
        Number(match[1]);

    const birim =
        match[2];

    if (birim === "K")
        return sayi * 1000;

    if (birim === "M")
        return sayi * 1000000;

    if (birim === "B")
        return sayi * 1000000000;

    return NaN;

}

// ==========================================
// BİRİM ÇEVİR
// ==========================================

function birimeCevir(
    sayi,
    birim
) {

    if (birim === "K")
        return sayi * 1000;

    if (birim === "M")
        return sayi * 1000000;

    if (birim === "B")
        return sayi * 1000000000;

    return sayi;

}

// ==========================================
// FORMAT
// ==========================================

function formatDeger(sayi) {

    if (sayi >= 1000000000) {

        return temizle(
            sayi / 1000000000
        ) + "B";

    }

    if (sayi >= 1000000) {

        return temizle(
            sayi / 1000000
        ) + "M";

    }

    if (sayi >= 1000) {

        return temizle(
            sayi / 1000
        ) + "K";

    }

    return temizle(sayi);

}

// ==========================================
// KÜSURAT TEMİZLE
// ==========================================

function temizle(sayi) {

    return parseFloat(
        Number(sayi).toFixed(2)
    ).toString();

}

// ==========================================
// BOTU BAŞLAT
// ==========================================

client.login(
    process.env.DISCORD_TOKEN
);
