const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const fs = require("fs");

// ==============================
// AYARLAR
// ==============================

const PREFIX = ".";

const ROLE = {
  DEGER: "1540002147243139133",
  MAC: "1539997232642654248",
  KAYIT: "1540005508768079912",
  CEKILIS: "1539997232642654248",

  TEKNIK_DIREKTOR: "1539994147245527111",
  FUTBOLCU: "1539994254917767349"
};

// ==============================
// CLIENT
// ==============================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ==============================
// VERİTABANI
// ==============================

const FILE = "./data.json";

if (!fs.existsSync(FILE)) {
  fs.writeFileSync(
    FILE,
    JSON.stringify({
      players: {},
      teams: {},
      matches: {}
    }, null, 2)
  );
}

let db = JSON.parse(fs.readFileSync(FILE, "utf8"));

db.players ||= {};
db.teams ||= {};
db.matches ||= {};

function save() {
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
}

// ==============================
// OYUNCU
// ==============================

function getPlayer(id) {

  if (!db.players[id]) {

    db.players[id] = {
      registered: false,
      name: null,
      type: null,

      value: 1000000,
      budget: 0,

      training: 0,

      team: null,
      position: "MID",

      goals: 0,
      assists: 0,
      yellow: 0,
      red: 0
    };
  }

  return db.players[id];
}

// ==============================
// PARA
// ==============================

function parseMoney(value) {

  if (!value) return null;

  let x = value
    .toUpperCase()
    .replace("€", "")
    .replace(",", ".")
    .trim();

  let multiplier = 1;

  if (x.endsWith("K")) {
    multiplier = 1000;
    x = x.slice(0, -1);
  }

  else if (x.endsWith("M")) {
    multiplier = 1000000;
    x = x.slice(0, -1);
  }

  else if (x.endsWith("B")) {
    multiplier = 1000000000;
    x = x.slice(0, -1);
  }

  const number = Number(x);

  if (!Number.isFinite(number)) return null;

  return Math.floor(number * multiplier);
}

function money(number) {

  if (number >= 1000000000)
    return (number / 1000000000).toFixed(1) + "B€";

  if (number >= 1000000)
    return (number / 1000000).toFixed(1) + "M€";

  if (number >= 1000)
    return (number / 1000).toFixed(1) + "K€";

  return number + "€";
}

// ==============================
// SÜRE
// ==============================

function parseDuration(value) {

  if (!value) return null;

  const match =
    value.toLowerCase().match(/^(\d+)(s|sn|dk|d|sa|h)$/);

  if (!match) return null;

  const number = Number(match[1]);
  const unit = match[2];

  if (unit === "s" || unit === "sn")
    return number * 1000;

  if (unit === "dk" || unit === "d")
    return number * 60 * 1000;

  return number * 60 * 60 * 1000;
}

// ==============================
// YETKİ
// ==============================

function isAdmin(member) {

  return member.permissions.has(
    PermissionsBitField.Flags.Administrator
  );
}

function hasRole(member, roleId) {

  return member.roles.cache.has(roleId);
}

function allowed(member, roleId) {

  return (
    isAdmin(member) ||
    hasRole(member, roleId)
  );
}

function isTD(member) {

  return (
    isAdmin(member) ||
    hasRole(member, ROLE.TEKNIK_DIREKTOR)
  );
}

// ==============================
// RANDOM
// ==============================

function randomNumber(min, max) {

  return Math.floor(
    Math.random() * (max - min + 1)
  ) + min;
}

function randomItem(array) {

  if (!array.length) return null;

  return array[
    randomNumber(0, array.length - 1)
  ];
}

// ==============================
// BOT READY
// ==============================

client.once("ready", () => {

  console.log(
    `BOT AKTİF: ${client.user.tag}`
  );

  client.user.setActivity(
    "Legendary League"
  );
});

// ==============================
// KAYIT BUTONLARI
// ==============================

function registrationButtons(userId) {

  return new ActionRowBuilder().addComponents(

    new ButtonBuilder()
      .setCustomId(`register_td_${userId}`)
      .setLabel("Teknik Direktör")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId(`register_player_${userId}`)
      .setLabel("Futbolcu")
      .setStyle(ButtonStyle.Success)
  );
}

// ==============================
// BUTON SİSTEMİ
// ==============================

client.on("interactionCreate", async interaction => {

  if (!interaction.isButton()) return;

  if (!interaction.customId.startsWith("register_"))
    return;

  if (!allowed(
    interaction.member,
    ROLE.KAYIT
  )) {

    return interaction.reply({
      content:
        "❌ Kayıt Yetkilisi veya Yönetici olmalısın.",
      ephemeral: true
    });
  }

  const parts =
    interaction.customId.split("_");

  const type = parts[1];
  const userId = parts[2];

  const member =
    await interaction.guild.members
      .fetch(userId)
      .catch(() => null);

  if (!member) {

    return interaction.reply({
      content: "❌ Oyuncu bulunamadı.",
      ephemeral: true
    });
  }

  let role;
  let typeName;

  if (type === "td") {

    role =
      interaction.guild.roles.cache.get(
        ROLE.TEKNIK_DIREKTOR
      );

    typeName = "Teknik Direktör";

  } else {

    role =
      interaction.guild.roles.cache.get(
        ROLE.FUTBOLCU
      );

    typeName = "Futbolcu";
  }

  if (!role) {

    return interaction.reply({
      content:
        "❌ Gerekli rol bulunamadı.",
      ephemeral: true
    });
  }

  await interaction.reply({
    content:
      `📝 ${member} için oyuncu adını bu kanala yaz.`,
    ephemeral: true
  });

  const collector =
    interaction.channel.createMessageCollector({

      filter: message =>
        message.author.id === interaction.user.id,

      max: 1,

      time: 60000
    });

  collector.on("collect", async message => {

    const player =
      getPlayer(userId);

    player.registered = true;
    player.name = message.content;
    player.type = typeName;

    await member.roles.add(role);

    save();

    await message.reply(
      `✅ **Kayıt tamamlandı!**\n\n` +
      `👤 Oyuncu: ${member}\n` +
      `📝 İsim: **${player.name}**\n` +
      `🏷️ Tür: **${typeName}**\n` +
      `💰 Değer: **${money(player.value)}**`
    );
  });
});

// ==============================
// MESAJ KOMUTLARI
// ==============================

client.on("messageCreate", async message => {

  try {

    if (
      message.author.bot ||
      !message.guild ||
      !message.content.startsWith(PREFIX)
    ) return;

    const args =
      message.content
        .slice(PREFIX.length)
        .trim()
        .split(/\s+/);

    const command =
      args.shift().toLowerCase();

    // ==========================
    // YARDIM
    // ==========================

    if (
      command === "yardım" ||
      command === "yardim" ||
      command === "help"
    ) {

      return message.reply(
`⚽ **LEGENDARY LEAGUE BOT**

📝 **Kayıt**
\`.k @oyuncu\`

💰 **Değer**
\`.dver @oyuncu 5M\`

💵 **Bütçe**
\`.bütçe\`
\`.gönder @oyuncu 5M\`
\`.bütçeekle @oyuncu 5M\`
\`.parasil @oyuncu 5M\`

🏋️ **Antrenman**
\`.ant\`

🥅 **Penaltı**
\`.pen\`

🏟️ **Takım**
\`.takımoluştur Takım Adı\`
\`.kadro\`
\`.kadroekle @oyuncu\`
\`.kadroçıkar @oyuncu\`
\`.pozisyon @oyuncu GK\`

🔄 **Transfer**
\`.transfer @oyuncu Takım Adı\`

⚽ **Maç**
\`.maç @Takım1 @Takım2\`
\`.skor\`
\`.maçiptal\`

🎉 **Çekiliş**
\`.çekiliş 5M€ 5dk\`
\`.çekiliş 10M€ 30s\`
\`.çekiliş 20M€ 2sa\`

🛡️ **Moderasyon**
\`.kick @oyuncu\`
\`.ban @oyuncu\`
\`.mute @oyuncu 10dk\`
\`.unmute @oyuncu\`

🔒 **Kanal**
\`.kilit\`
\`.aç\`

🗑️ **Mesaj**
\`.sil 10\``
      );
    }

    // ==========================
    // KAYIT
    // ==========================

    if (command === "k") {

      if (!allowed(
        message.member,
        ROLE.KAYIT
      )) {

        return message.reply(
          "❌ Kayıt Yetkilisi veya Yönetici."
        );
      }

      const user =
        message.mentions.users.first();

      if (!user) {

        return message.reply(
          "❌ Kullanım: `.k @oyuncu`"
        );
      }

      return message.reply({

        embeds: [

          new EmbedBuilder()
            .setTitle("📝 KAYIT SİSTEMİ")
            .setDescription(
              `${user} kayıt türünü seç.`
            )
            .setColor("Blue")

        ],

        components: [
          registrationButtons(user.id)
        ]
      });
    }

    // ==========================
    // DEĞER
    // ==========================

    if (command === "dver") {

      if (!allowed(
        message.member,
        ROLE.DEGER
      )) {

        return message.reply(
          "❌ Değer Yetkilisi veya Yönetici."
        );
      }

      const user =
        message.mentions.users.first();

      const value =
        parseMoney(args[1]);

      if (!user || !value) {

        return message.reply(
          "❌ Kullanım: `.dver @oyuncu 5M`"
        );
      }

      const player =
        getPlayer(user.id);

      player.value = value;

      save();

      return message.reply(
        `💰 ${user} yeni değeri: **${money(value)}**`
      );
    }

    // ==========================
    // BÜTÇE
    // ==========================

    if (
      command === "bütçe" ||
      command === "butce"
    ) {

      const user =
        message.mentions.users.first() ||
        message.author;

      const player =
        getPlayer(user.id);

      return message.reply(
        `💰 **${user} Bütçesi:** ${money(player.budget)}`
      );
    }

    // ==========================
    // BÜTÇE EKLE
    // ==========================

    if (
      command === "bütçeekle" ||
      command === "butceekle"
    ) {

      if (!isAdmin(message.member)) {

        return message.reply(
          "❌ Sadece Yönetici kullanabilir."
        );
      }

      const user =
        message.mentions.users.first();

      const value =
        parseMoney(args[1]);

      if (!user || !value) {

        return message.reply(
          "❌ `.bütçeekle @oyuncu 5M`"
        );
      }

      getPlayer(user.id).budget += value;

      save();

      return message.reply(
        `💵 ${user} bütçesine **${money(value)}** eklendi.`
      );
    }

    // ==========================
    // PARA GÖNDER
    // ==========================

    if (
      command === "gönder" ||
      command === "gonder"
    ) {

      const user =
        message.mentions.users.first();

      const value =
        parseMoney(args[1]);

      if (!user || !value) {

        return message.reply(
          "❌ `.gönder @oyuncu 5M`"
        );
      }

      const sender =
        getPlayer(message.author.id);

      const receiver =
        getPlayer(user.id);

      if (sender.budget < value) {

        return message.reply(
          `❌ Yetersiz bütçe.\nBütçen: **${money(sender.budget)}**`
        );
      }

      sender.budget -= value;
      receiver.budget += value;

      save();

      return message.reply(
        `💸 ${message.author} → ${user}\n` +
        `💰 **${money(value)}** gönderildi.`
      );
    }

    // ==========================
    // PARA SİL
    // ==========================

    if (command === "parasil") {

      if (!isAdmin(message.member)) {

        return message.reply(
          "❌ Sadece Yönetici."
        );
      }

      const user =
        message.mentions.users.first();

      const value =
        parseMoney(args[1]);

      if (!user || !value) {

        return message.reply(
          "❌ `.parasil @oyuncu 5M`"
        );
      }

      const player =
        getPlayer(user.id);

      const removed =
        Math.min(player.budget, value);

      player.budget -= removed;

      save();

      return message.reply(
        `🗑️ ${user} bütçesinden **${money(removed)}** silindi.`
      );
    }

    // ==========================
    // ANTRENMAN
    // ==========================

    if (
      command === "ant" ||
      command === "antrenman"
    ) {

      const player =
        getPlayer(message.author.id);

      player.training++;

      let text =
        `🏋️ Antrenman: **${player.training}/10**`;

      if (player.training >= 10) {

        player.training = 0;

        player.value += 200000;

        text +=
          `\n🎉 Antrenman tamamlandı!` +
          `\n💰 Değer: **+200K€**` +
          `\n🔄 Yeni antrenman: **0/10**`;
      }

      save();

      return message.reply(text);
    }

    // ==========================
    // PENALTI
    // ==========================

    if (
      command === "pen" ||
      command === "penaltı" ||
      command === "penalti"
    ) {

      const player =
        getPlayer(message.author.id);

      const goal =
        Math.random() < 0.65;

      if (goal) {

        player.value += 100000;

        save();

        return message.reply(
          `⚽ **GOOOL!**\n` +
          `🥅 Penaltı başarılı!\n` +
          `💰 Değer: **+100K€**`
        );
      }

      return message.reply(
        "❌ **PENALTI KAÇTI!**"
      );
    }

    // ==========================
    // TAKIM OLUŞTUR
    // ==========================

    if (
      command === "takımoluştur" ||
      command === "takimolustur"
    ) {

      if (!isTD(message.member)) {

        return message.reply(
          "❌ Teknik Direktör veya Yönetici."
        );
      }

      const teamName =
        args.join(" ");

      if (!teamName) {

        return message.reply(
          "❌ `.takımoluştur Takım Adı`"
        );
      }

      if (db.teams[teamName]) {

        return message.reply(
          "❌ Bu takım zaten var."
        );
      }

      const role =
        await message.guild.roles.create({
          name: teamName
        });

      db.teams[teamName] = {

        name: teamName,

        roleId: role.id,

        owner: message.author.id,

        members: [],

        budget: 50000000,

        wins: 0,
        draws: 0,
        losses: 0
      };

      const player =
        getPlayer(message.author.id);

      player.team = teamName;

      save();

      await message.member.roles.add(role);

      return message.reply(
        `🏟️ **${teamName}** oluşturuldu!\n` +
        `💰 Başlangıç bütçesi: **50M€**`
      );
    }

    // ==========================
    // KADRO
    // ==========================

    if (command === "kadro") {

      const player =
        getPlayer(message.author.id);

      const team =
        db.teams[player.team];

      if (!team) {

        return message.reply(
          "❌ Bir takımda değilsin."
        );
      }

      if (!team.members.length) {

        return message.reply(
          `👥 **${team.name}** kadrosu boş.`
        );
      }

      const list =
        team.members.map(id => {

          const p =
            getPlayer(id);

          return (
            `• ${p.name || "İsimsiz"} ` +
            `— ${p.position} — <@${id}>`
          );

        }).join("\n");

      return message.reply(
        `👥 **${team.name} KADROSU**\n\n` +
        list +
        `\n\n💰 Takım bütçesi: **${money(team.budget)}**`
      );
    }

    // ==========================
    // KADRO EKLE
    // ==========================

    if (command === "kadroekle") {

      if (!isTD(message.member)) {

        return message.reply(
          "❌ Teknik Direktör veya Yönetici."
        );
      }

      const user =
        message.mentions.users.first();

      const team =
        getPlayer(message.author.id).team;

      if (!user || !team) {

        return message.reply(
          "❌ `.kadroekle @oyuncu`"
        );
      }

      const player =
        getPlayer(user.id);

      if (player.team) {

        return message.reply(
          `❌ Oyuncu zaten **${player.team}** takımında.`
        );
      }

      player.team = team;

      db.teams[team].members.push(
        user.id
      );

      save();

      return message.reply(
        `✅ ${user}, **${team}** kadrosuna eklendi.`
      );
    }

    // ==========================
    // KADRO ÇIKAR
    // ==========================

    if (
      command === "kadroçıkar" ||
      command === "kadrocikar"
    ) {

      if (!isTD(message.member)) {

        return message.reply(
          "❌ Teknik Direktör veya Yönetici."
        );
      }

      const user =
        message.mentions.users.first();

      const team =
        getPlayer(message.author.id).team;

      if (!user || !team) {

        return message.reply(
          "❌ `.kadroçıkar @oyuncu`"
        );
      }

      const player =
        getPlayer(user.id);

      if (player.team !== team) {

        return message.reply(
          "❌ Oyuncu bu takımda değil."
        );
      }

      player.team = null;

      db.teams[team].members =
        db.teams[team].members.filter(
          id => id !== user.id
        );

      save();

      return message.reply(
        `✅ ${user} kadrodan çıkarıldı.`
      );
    }

    // ==========================
    // POZİSYON
    // ==========================

    if (command === "pozisyon") {

      if (!isTD(message.member)) {

        return message.reply(
          "❌ Teknik Direktör veya Yönetici."
        );
      }

      const user =
        message.mentions.users.first();

      const position =
        (args[1] || "").toUpperCase();

      if (
        !user ||
        !["GK", "DEF", "MID", "ATT"].includes(position)
      ) {

        return message.reply(
          "❌ `.pozisyon @oyuncu GK`\n" +
          "Pozisyonlar: GK / DEF / MID / ATT"
        );
      }

      getPlayer(user.id).position =
        position;

      save();

      return message.reply(
        `✅ ${user} pozisyonu **${position}** oldu.`
      );
    }

    // ==========================
    // TRANSFER
    // ==========================

    if (command === "transfer") {

      if (!isTD(message.member)) {

        return message.reply(
          "❌ Sadece Teknik Direktör veya Yönetici."
        );
      }

      const user =
        message.mentions.users.first();

      const teamName =
        args.slice(1).join(" ");

      if (
        !user ||
        !db.teams[teamName]
      ) {

        return message.reply(
          "❌ `.transfer @oyuncu Takım Adı`"
        );
      }

      const player =
        getPlayer(user.id);

      if (
        player.team &&
        db.teams[player.team]
      ) {

        db.teams[player.team].members =
          db.teams[player.team].members.filter(
            id => id !== user.id
          );
      }

      player.team = teamName;

      if (
        !db.teams[teamName].members.includes(
          user.id
        )
      ) {

        db.teams[teamName].members.push(
          user.id
        );
      }

      save();

      return message.reply(
        `🔄 ${user} → **${teamName}** transfer edildi.`
      );
    }

    // ==========================
    // MAÇ BAŞLAT
    // SADECE 2 TAKIM ROLÜ ETİKETİ
    // ==========================

    if (
      command === "maç" ||
      command === "mac"
    ) {

      if (!allowed(
        message.member,
        ROLE.MAC
      )) {

        return message.reply(
          "❌ Maç Yetkilisi veya Yönetici."
        );
      }

      const roles =
        [...message.mentions.roles.values()];

      if (roles.length !== 2) {

        return message.reply(
          "❌ Kullanım:\n" +
          "`.maç @Takım1 @Takım2`"
        );
      }

      const team1 =
        Object.entries(db.teams)
          .find(
            ([, team]) =>
              team.roleId === roles[0].id
          );

      const team2 =
        Object.entries(db.teams)
          .find(
            ([, team]) =>
              team.roleId === roles[1].id
          );

      if (!team1 || !team2) {

        return message.reply(
          "❌ Etiketlenen roller kayıtlı takım değil."
        );
      }

      if (team1[0] === team2[0]) {

        return message.reply(
          "❌ Aynı takım kendiyle oynayamaz."
        );
      }

      const active =
        Object.values(db.matches)
          .some(
            match =>
              match.active &&
              match.channelId === message.channel.id
          );

      if (active) {

        return message.reply(
          "❌ Bu kanalda zaten aktif maç var."
        );
      }

      const matchId =
        Date.now().toString();

      db.matches[matchId] = {

        id: matchId,

        channelId:
          message.channel.id,

        team1: team1[0],
        team2: team2[0],

        role1: roles[0].id,
        role2: roles[1].id,

        score1: 0,
        score2: 0,

        start: Date.now(),

        // 5 DAKİKA
        end:
          Date.now() + 5 * 60 * 1000,

        active: true
      };

      save();

      await message.channel.send(
        `🏟️ **MAÇ BAŞLADI!**\n\n` +
        `🔵 ${roles[0]} **0 - 0** ${roles[1]} 🔴\n\n` +
        `⏱️ Maç süresi: **5 dakika**\n` +
        `⚡ Anlatım: **Hızlı**`
      );

      startMatch(
        message.channel,
        matchId
      );

      return;
    }

    // ==========================
    // SKOR
    // ==========================

    if (
      command === "skor" ||
      command === "maçdurum"
    ) {

      const match =
        Object.values(db.matches)
          .find(
            x =>
              x.active &&
              x.channelId === message.channel.id
          );

      if (!match) {

        return message.reply(
          "❌ Aktif maç yok."
        );
      }

      const elapsed =
        Date.now() - match.start;

      const minute =
        Math.min(
          90,
          Math.floor(
            elapsed /
            300000 *
            90
          )
        );

      return message.reply(
        `📊 **${match.team1}** ` +
        `**${match.score1} - ${match.score2}** ` +
        `**${match.team2}**\n` +
        `⏱️ Dakika: **${minute}'**`
      );
    }

    // ==========================
    // MAÇ İPTAL
    // ==========================

    if (command === "maçiptal") {

      if (!allowed(
        message.member,
        ROLE.MAC
      )) {

        return message.reply(
          "❌ Maç Yetkilisi veya Yönetici."
        );
      }

      const match =
        Object.values(db.matches)
          .find(
            x =>
              x.active &&
              x.channelId === message.channel.id
          );

      if (!match) {

        return message.reply(
          "❌ Aktif maç yok."
        );
      }

      match.active = false;

      if (match.timer) {

        clearTimeout(match.timer);
      }

      save();

      return message.reply(
        "🛑 Maç iptal edildi."
      );
    }

    // ==========================
    // ÇEKİLİŞ
    // ==========================

    if (
      command === "çekiliş" ||
      command === "cekilis"
    ) {

      if (!allowed(
        message.member,
        ROLE.CEKILIS
      )) {

        return message.reply(
          "❌ Çekiliş Yetkilisi veya Yönetici."
        );
      }

      const prize = args[0];

      const duration =
        parseDuration(args[1]);

      if (!prize || !duration) {

        return message.reply(
          "❌ Örnek:\n" +
          "`.çekiliş 5M€ 5sa`\n" +
          "`.çekiliş 5M€ 5dk`\n" +
          "`.çekiliş 5M€ 30s`"
        );
      }

      const participants =
        new Set();

      const row =
        new ActionRowBuilder()
          .addComponents(

            new ButtonBuilder()
              .setCustomId(
                `giveaway_${Date.now()}`
              )
              .setLabel("🎉 Katıl")
              .setStyle(
                ButtonStyle.Success
              )
          );

      const giveaway =
        await message.channel.send({

          embeds: [

            new EmbedBuilder()
              .setTitle(
                "🎉 ÇEKİLİŞ"
              )
              .setDescription(
                `🎁 Ödül: **${prize}**\n` +
                `⏱️ Süre: **${args[1]}**\n\n` +
                `Katılmak için butona bas!`
              )
              .setColor("Gold")

          ],

          components: [row]
        });

      const collector =
        giveaway.createMessageComponentCollector({
          time: duration
        });

      collector.on(
        "collect",
        async interaction => {

          if (
            participants.has(
              interaction.user.id
            )
          ) {

            return interaction.reply({
              content:
                "❌ Zaten çekilişe katıldın.",
              ephemeral: true
            });
          }

          participants.add(
            interaction.user.id
          );

          await interaction.reply({
            content:
              "🎉 Çekilişe katıldın!",
            ephemeral: true
          });
        }
      );

      collector.on(
        "end",
        async () => {

          row.components[0]
            .setDisabled(true);

          await giveaway.edit({
            components: [row]
          }).catch(() => {});

          if (!participants.size) {

            return message.channel.send(
              "❌ Çekilişe katılan olmadı."
            );
          }

          const winner =
            randomItem(
              [...participants]
            );

          return message.channel.send(
            `🎉 **ÇEKİLİŞ BİTTİ!**\n\n` +
            `🎁 Ödül: **${prize}**\n` +
            `🏆 Kazanan: <@${winner}>`
          );
        }
      );

      return;
    }

    // ==========================
    // KICK
    // SADECE YÖNETİCİ
    // ==========================

    if (command === "kick") {

      if (!isAdmin(message.member)) {

        return message.reply(
          "❌ Sadece Yönetici."
        );
      }

      const member =
        message.mentions.members.first();

      if (!member) {

        return message.reply(
          "❌ `.kick @oyuncu sebep`"
        );
      }

      if (!member.kickable) {

        return message.reply(
          "❌ Bu kullanıcıyı kickleyemiyorum."
        );
      }

      await member.kick(
        args.slice(1).join(" ") ||
        "Sebep belirtilmedi."
      );

      return message.reply(
        `👢 **${member.user.tag}** kicklendi.`
      );
    }

    // ==========================
    // BAN
    // SADECE YÖNETİCİ
    // ==========================

    if (command === "ban") {

      if (!isAdmin(message.member)) {

        return message.reply(
          "❌ Sadece Yönetici."
        );
      }

      const member =
        message.mentions.members.first();

      if (!member) {

        return message.reply(
          "❌ `.ban @oyuncu sebep`"
        );
      }

      if (!member.bannable) {

        return message.reply(
          "❌ Bu kullanıcıyı banlayamıyorum."
        );
      }

      await member.ban({
        reason:
          args.slice(1).join(" ") ||
          "Sebep belirtilmedi."
      });

      return message.reply(
        `🔨 **${member.user.tag}** banlandı.`
      );
    }

    // ==========================
    // MUTE
    // SADECE YÖNETİCİ
    // ==========================

    if (command === "mute") {

      if (!isAdmin(message.member)) {

        return message.reply(
          "❌ Sadece Yönetici."
        );
      }

      const member =
        message.mentions.members.first();

      const duration =
        parseDuration(args[1]);

      if (!member || !duration) {

        return message.reply(
          "❌ `.mute @oyuncu 10dk`"
        );
      }

      await member.timeout(
        duration,
        args.slice(2).join(" ") ||
        "Sebep belirtilmedi."
      );

      return message.reply(
        `🔇 ${member} **${args[1]}** susturuldu.`
      );
    }

    // ==========================
    // UNMUTE
    // ==========================

    if (command === "unmute") {

      if (!isAdmin(message.member)) {

        return message.reply(
          "❌ Sadece Yönetici."
        );
      }

      const member =
        message.mentions.members.first();

      if (!member) {

        return message.reply(
          "❌ `.unmute @oyuncu`"
        );
      }

      await member.timeout(
        null,
        "Mute kaldırıldı."
      );

      return message.reply(
        `🔊 ${member} susturması kaldırıldı.`
      );
    }

    // ==========================
    // KANAL KİLİT
    // ==========================

    if (command === "kilit") {

      if (!isAdmin(message.member)) {

        return message.reply(
          "❌ Sadece Yönetici."
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

    // ==========================
    // KANAL AÇ
    // ==========================

    if (
      command === "aç" ||
      command === "ac"
    ) {

      if (!isAdmin(message.member)) {

        return message.reply(
          "❌ Sadece Yönetici."
        );
      }

      await message.channel
        .permissionOverwrites.edit(
          message.guild.roles.everyone,
          {
            SendMessages: null
          }
        );

      return message.reply(
        "🔓 Kanal tekrar açıldı."
      );
    }

    // ==========================
    // MESAJ SİL
    // SADECE YÖNETİCİ
    // ==========================

    if (command === "sil") {

      if (!isAdmin(message.member)) {

        return message.reply(
          "❌ Sadece Yönetici kullanabilir."
        );
      }

      const amount =
        parseInt(args[0]);

      if (
        !amount ||
        amount < 1 ||
        amount > 100
      ) {

        return message.reply(
          "❌ Kullanım: `.sil 10`\n" +
          "⚠️ 1-100 arasında bir sayı yaz."
        );
      }

      try {

        const deleted =
          await message.channel.bulkDelete(
            amount + 1,
            true
          );

        const info =
          await message.channel.send(
            `🗑️ **${Math.max(
              0,
              deleted.size - 1
            )} mesaj silindi.**`
          );

        setTimeout(
          () => info.delete().catch(() => {}),
          3000
        );

      } catch (error) {

        console.error(error);

        return message.channel.send(
          "❌ Mesajlar silinemedi. " +
          "Botun **Mesajları Yönet** yetkisini kontrol et."
        );
      }
    }

  } catch (error) {

    console.error(error);

    message.reply(
      "❌ Komut çalışırken bir hata oluştu."
    ).catch(() => {});
  }
});

// =====================================================
// MAÇ SİSTEMİ
// 5 DAKİKA
// 3-6 SANİYEDE BİR ANLATIM
// =====================================================

function startMatch(channel, matchId) {

  const match =
    db.matches[matchId];

  if (!match || !match.active)
    return;

  const remaining =
    match.end - Date.now();

  if (remaining <= 0) {

    return finishMatch(
      channel,
      matchId
    );
  }

  const delay =
    Math.min(
      remaining,
      randomNumber(
        3000,
        6000
      )
    );

  match.timer =
    setTimeout(
      async () => {

        const current =
          db.matches[matchId];

        if (
          !current ||
          !current.active
        ) return;

        if (
          Date.now() >=
          current.end
        ) {

          return finishMatch(
            channel,
            matchId
          );
        }

        await matchEvent(
          channel,
          current
        );

        save();

        startMatch(
          channel,
          matchId
        );

      },
      delay
    );
}

// =====================================================
// MAÇ OLAYI
// =====================================================

async function matchEvent(
  channel,
  match
) {

  const elapsed =
    Date.now() -
    match.start;

  const minute =
    Math.min(
      90,
      Math.max(
        1,
        Math.floor(
          elapsed /
          300000 *
          90
        )
      )
    );

  const side =
    Math.random() < 0.5
      ? 1
      : 2;

  const attackingTeam =
    side === 1
      ? match.team1
      : match.team2;

  const team =
    db.teams[attackingTeam];

  const players =
    team.members
      .map(id => ({
        id,
        player: getPlayer(id)
      }))
      .filter(
        x => x.player.registered
      );

  const selected =
    randomItem(players);

  const event =
    randomNumber(1, 100);

  // GOL
  if (
    event <= 22 &&
    selected
  ) {

    if (side === 1)
      match.score1++;
    else
      match.score2++;

    selected.player.goals++;

    selected.player.value +=
      200000;

    return channel.send(
      `⚽ **GOOOOOOL! ${minute}'**\n\n` +
      `🔥 **${selected.player.name}** ` +
      `(${attackingTeam}) golü attı!\n\n` +
      `🔵 **${match.team1}** ` +
      `**${match.score1} - ${match.score2}** ` +
      `**${match.team2}** 🔴`
    );
  }

  // ATAK
  if (event <= 38) {

    return channel.send(
      `🔥 **${minute}' TEHLİKELİ ATAK!**\n` +
      `⚡ **${attackingTeam}** yükleniyor!`
    );
  }

  // KURTARIŞ
  if (event <= 50) {

    return channel.send(
      `🧤 **${minute}' KURTARIŞ!**\n` +
      `Kaleci gole izin vermedi!`
    );
  }

  // SARI
  if (
    event <= 60 &&
    selected
  ) {

    selected.player.yellow++;

    return channel.send(
      `🟨 **${minute}' SARI KART!**\n` +
      `👤 ${selected.player.name}`
    );
  }

  // KIRMIZI
  if (
    event <= 63 &&
    selected
  ) {

    selected.player.red++;

    return channel.send(
      `🟥 **${minute}' KIRMIZI KART!**\n` +
      `👤 ${selected.player.name}`
    );
  }

  // PENALTI
  if (
    event <= 70 &&
    selected
  ) {

    const goal =
      Math.random() < 0.7;

    if (goal) {

      if (side === 1)
        match.score1++;
      else
        match.score2++;

      selected.player.goals++;

      selected.player.value +=
        200000;

      return channel.send(
        `⚽ **${minute}' PENALTI GOLÜ!**\n\n` +
        `🎯 **${selected.player.name}** gole çevirdi!\n\n` +
        `🔵 **${match.team1}** ` +
        `**${match.score1} - ${match.score2}** ` +
        `**${match.team2}** 🔴`
      );

    } else {

      return channel.send(
        `❌ **${minute}' PENALTI KAÇTI!**\n` +
        `😱 ${selected.player.name} değerlendiremedi!`
      );
    }
  }

  // DİREK
  if (event <= 78) {

    return channel.send(
      `🥅 **${minute}' DİREK!**\n` +
      `💥 ${attackingTeam} direğe takıldı!`
    );
  }

  // OFSAYT
  if (
    event <= 85 &&
    selected
  ) {

    return channel.send(
      `🚩 **${minute}' OFSAYT!**\n` +
      `👤 ${selected.player.name}`
    );
  }

  // KORNER
  if (event <= 94) {

    return channel.send(
      `🏳️ **${minute}' KORNER!**\n` +
      `⚡ ${attackingTeam} baskısını sürdürüyor!`
    );
  }

  // NORMAL
  return channel.send(
    `⚡ **${minute}'** ` +
    `Orta sahada mücadele devam ediyor.`
  );
}

// =====================================================
// MAÇ BİTİŞ
// =====================================================

async function finishMatch(
  channel,
  matchId
) {

  const match =
    db.matches[matchId];

  if (
    !match ||
    !match.active
  ) return;

  match.active = false;

  if (match.timer) {

    clearTimeout(
      match.timer
    );

    match.timer = null;
  }

  const team1 =
    db.teams[match.team1];

  const team2 =
    db.teams[match.team2];

  let result;

  if (
    match.score1 >
    match.score2
  ) {

    team1.wins++;
    team2.losses++;

    result =
      `🏆 **${match.team1} KAZANDI!**`;

  } else if (
    match.score2 >
    match.score1
  ) {

    team2.wins++;
    team1.losses++;

    result =
      `🏆 **${match.team2} KAZANDI!**`;

  } else {

    team1.draws++;
    team2.draws++;

    result =
      "🤝 **BERABERE!**";
  }

  // Maç ödülleri
  team1.budget += 500000;
  team2.budget += 250000;

  save();

  return channel.send({

    embeds: [

      new EmbedBuilder()

        .setTitle(
          "🏁 MAÇ BİTTİ!"
        )

        .setDescription(

          `🔵 **${match.team1}** ` +
          `**${match.score1} - ${match.score2}** ` +
          `**${match.team2}** 🔴\n\n` +

          `${result}\n\n` +

          `⏱️ Süre: **5 dakika**\n\n` +

          `💰 ${match.team1}: **+500K€**\n` +
          `💰 ${match.team2}: **+250K€**`
        )

        .setColor("Green")
    ]
  });
}

// =====================================================
// HATALAR
// =====================================================

client.on(
  "error",
  console.error
);

process.on(
  "unhandledRejection",
  console.error
);

// =====================================================
// RAILWAY TOKEN
// =====================================================

if (!process.env.TOKEN) {

  console.error(
    "❌ TOKEN environment variable bulunamadı!"
  );

  process.exit(1);
}

client.login(
  process.env.TOKEN
);
