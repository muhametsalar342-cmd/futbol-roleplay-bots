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

const PREFIX = ".";

// =====================================================
// ROL ID'LERİ
// =====================================================

const ROLE = {
  DEGER: "1540002147243139133",
  MAC: "1539997232642654248",
  KAYIT: "1540005508768079912",
  CEKILIS: "1539997232642654248",

  TEKNIK_DIREKTOR: "1539994147245527111",
  FUTBOLCU: "1539994254917767349"
};

// =====================================================
// GERÇEK TAKIMLAR
// =====================================================

const REAL_TEAMS = [
  "Galatasaray",
  "Fenerbahçe",
  "Beşiktaş",
  "Trabzonspor",
  "Başakşehir",
  "Bursaspor",
  "Konyaspor",
  "Sivasspor",
  "Göztepe",
  "Samsunspor",
  "Antalyaspor",
  "Alanyaspor",

  "Liverpool",
  "Manchester City",
  "Manchester United",
  "Arsenal",
  "Chelsea",
  "Tottenham",
  "Newcastle United",
  "Aston Villa",
  "West Ham United",
  "Everton",

  "Real Madrid",
  "Barcelona",
  "Atletico Madrid",
  "Sevilla",
  "Valencia",
  "Villarreal",
  "Athletic Bilbao",
  "Real Sociedad",

  "Bayern Münih",
  "Borussia Dortmund",
  "RB Leipzig",
  "Bayer Leverkusen",
  "Schalke 04",
  "Eintracht Frankfurt",

  "Juventus",
  "Inter",
  "Milan",
  "Napoli",
  "Roma",
  "Lazio",
  "Atalanta",
  "Fiorentina",

  "PSG",
  "Olympique Marseille",
  "Lyon",
  "Monaco",
  "Lille",

  "Ajax",
  "PSV",
  "Feyenoord",

  "Benfica",
  "Porto",
  "Sporting CP"
];

// =====================================================
// CLIENT
// =====================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// =====================================================
// DATABASE
// =====================================================

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

let db = JSON.parse(
  fs.readFileSync(FILE, "utf8")
);

db.players ||= {};
db.teams ||= {};
db.matches ||= {};

function save() {
  fs.writeFileSync(
    FILE,
    JSON.stringify(db, null, 2)
  );
}

// =====================================================
// OYUNCU
// =====================================================

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

// =====================================================
// PARA
// =====================================================

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

  if (!Number.isFinite(number)) {
    return null;
  }

  return Math.floor(
    number * multiplier
  );
}

function money(number) {

  if (number >= 1000000000) {
    return (
      (number / 1000000000)
        .toFixed(1) + "B€"
    );
  }

  if (number >= 1000000) {
    return (
      (number / 1000000)
        .toFixed(1) + "M€"
    );
  }

  if (number >= 1000) {
    return (
      (number / 1000)
        .toFixed(1) + "K€"
    );
  }

  return number + "€";
}

// =====================================================
// SÜRE
// =====================================================

function parseDuration(value) {

  if (!value) return null;

  const match =
    value.toLowerCase()
      .match(/^(\d+)(s|sn|dk|d|sa|h)$/);

  if (!match) return null;

  const number =
    Number(match[1]);

  const unit =
    match[2];

  if (
    unit === "s" ||
    unit === "sn"
  ) {
    return number * 1000;
  }

  if (
    unit === "dk" ||
    unit === "d"
  ) {
    return number * 60000;
  }

  return number * 3600000;
}

// =====================================================
// YETKİ
// =====================================================

function isAdmin(member) {

  return member.permissions.has(
    PermissionsBitField.Flags.Administrator
  );
}

function hasRole(member, roleId) {

  return member.roles.cache.has(
    roleId
  );
}

function allowed(member, roleId) {

  return (
    isAdmin(member) ||
    hasRole(member, roleId)
  );
}

function isTD(member) {

  return hasRole(
    member,
    ROLE.TEKNIK_DIREKTOR
  );
}

// =====================================================
// RANDOM
// =====================================================

function randomNumber(min, max) {

  return Math.floor(
    Math.random() *
    (max - min + 1)
  ) + min;
}

function randomItem(array) {

  if (!array.length) {
    return null;
  }

  return array[
    randomNumber(
      0,
      array.length - 1
    )
  ];
}

// =====================================================
// MAÇ OYUNCULARI
// =====================================================

function getTeamPlayers(teamName) {

  const team =
    db.teams[teamName];

  if (!team) {
    return [];
  }

  return team.members
    .map(id => ({
      id,
      data: getPlayer(id)
    }))
    .filter(
      x =>
        x.data.registered &&
        x.data.red < 1
    );
}

function getScorer(teamName) {

  const players =
    getTeamPlayers(teamName);

  if (!players.length) {
    return null;
  }

  return randomItem(players);
}

// =====================================================
// MAÇ ANLATIMLARI
// =====================================================

const NORMAL_EVENTS = [

  "Orta sahada top kapma mücadelesi yaşanıyor.",
  "Takımlar oyunu kontrollü şekilde kuruyor.",
  "Savunma arkasına atılan topu defans uzaklaştırdı.",
  "Orta sahada sert bir ikili mücadele yaşandı.",
  "Kanattan hızlı bir hücum gelişiyor.",
  "Top bir kanattan diğerine taşınıyor.",
  "Takım savunmasını önde kuruyor.",
  "Orta sahada pas trafiği hızlandı.",
  "Defans hattı zamanında müdahale etti.",
  "Hücum oyuncusu rakip savunmayı geçmeye çalışıyor."
];

const ATTACK_EVENTS = [

  "Ceza sahasına doğru tehlikeli bir hücum gelişiyor!",
  "Kanattan gelen ortada savunma son anda araya girdi!",
  "Forvet savunma arkasına sarktı!",
  "Ceza sahasının hemen dışında boşluk oluştu!",
  "Hücum oyuncusu rakip kaleye doğru ilerliyor!"
];

// =====================================================
// MAÇ BAŞLAT
// =====================================================

async function startMatch(
  channel,
  matchId
) {

  const match =
    db.matches[matchId];

  if (
    !match ||
    !match.active
  ) {
    return;
  }

  const remaining =
    match.end - Date.now();

  if (remaining <= 0) {

    await finishMatch(
      channel,
      matchId
    );

    return;
  }

  const delay =
    Math.min(
      remaining,
      randomNumber(
        3500,
        5500
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
        ) {
          return;
        }

        if (
          Date.now() >=
          current.end
        ) {

          await finishMatch(
            channel,
            matchId
          );

          return;
        }

        await generateMatchEvent(
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
// GERÇEKÇİ MAÇ OLAYI
// =====================================================

async function generateMatchEvent(
  channel,
  match
) {

  const elapsed =
    Date.now() -
    match.start;

  // 5 gerçek dakika = 90 maç dakikası
  const minute =
    Math.min(
      90,
      Math.max(
        1,
        Math.floor(
          (elapsed /
            300000) *
          90
        )
      )
    );

  const teamNumber =
    Math.random() < 0.5
      ? 1
      : 2;

  const attackingTeam =
    teamNumber === 1
      ? match.team1
      : match.team2;

  const defendingTeam =
    teamNumber === 1
      ? match.team2
      : match.team1;

  const scorer =
    getScorer(
      attackingTeam
    );

  const chance =
    randomNumber(
      1,
      100
    );

  // =================================================
  // GARANTİ GOL
  // 80. dakikadan sonra hâlâ 0-0 ise
  // =================================================

  if (
    minute >= 80 &&
    match.score1 === 0 &&
    match.score2 === 0
  ) {

    return createGoal(
      channel,
      match,
      teamNumber,
      attackingTeam,
      scorer,
      minute,
      true
    );
  }

  // =================================================
  // GOL
  // =================================================

  if (
    chance <= 14 &&
    scorer
  ) {

    return createGoal(
      channel,
      match,
      teamNumber,
      attackingTeam,
      scorer,
      minute,
      false
    );
  }

  // =================================================
  // PENALTI
  // =================================================

  if (
    chance > 14 &&
    chance <= 18 &&
    scorer
  ) {

    const penaltyGoal =
      Math.random() < 0.72;

    if (penaltyGoal) {

      return createGoal(
        channel,
        match,
        teamNumber,
        attackingTeam,
        scorer,
        minute,
        false,
        true
      );
    }

    return channel.send(
      `🎯 **${minute}' PENALTI!**\n\n` +
      `**${attackingTeam}** penaltı kazanıyor!\n` +
      `⚽ ${scorer.data.name || "Futbolcu"} topun başında...\n\n` +
      `❌ **KAÇTI!** Kaleci gole izin vermedi!`
    );
  }

  // =================================================
  // TEHLİKELİ ATAK
  // =================================================

  if (
    chance <= 34
  ) {

    return channel.send(
      `🔥 **${minute}' TEHLİKELİ ATAK!**\n\n` +
      `⚡ **${attackingTeam}**:\n` +
      `${randomItem(ATTACK_EVENTS)}`
    );
  }

  // =================================================
  // ŞUT
  // =================================================

  if (
    chance <= 49
  ) {

    if (scorer) {

      const shotResult =
        randomNumber(
          1,
          3
        );

      if (
        shotResult === 1
      ) {

        return channel.send(
          `🥅 **${minute}' ŞUT!**\n\n` +
          `💥 ${scorer.data.name || "Futbolcu"} vurdu!\n` +
          `🧤 Kaleci harika bir kurtarış yaptı!`
        );
      }

      if (
        shotResult === 2
      ) {

        return channel.send(
          `🎯 **${minute}' ŞUT!**\n\n` +
          `💥 ${scorer.data.name || "Futbolcu"} uzaklardan denedi!\n` +
          `↗️ Top az farkla dışarı çıktı.`
        );
      }

      return channel.send(
        `💥 **${minute}' ŞUT!**\n\n` +
        `${scorer.data.name || "Futbolcu"} ceza sahası dışından vurdu!\n` +
        `🥅 TOP DİREĞE ÇARPTI!`
      );
    }

    return channel.send(
      `💥 **${minute}' ŞUT!**\n` +
      `Top kaleyi bulmadı.`
    );
  }

  // =================================================
  // KORNER
  // =================================================

  if (
    chance <= 61
  ) {

    return channel.send(
      `🏳️ **${minute}' KORNER!**\n\n` +
      `**${attackingTeam}** köşe vuruşu kullanıyor.\n` +
      `📢 Ceza sahası karıştı!`
    );
  }

  // =================================================
  // OFSAYT
  // =================================================

  if (
    chance <= 69 &&
    scorer
  ) {

    return channel.send(
      `🚩 **${minute}' OFSAYT!**\n\n` +
      `${scorer.data.name || "Futbolcu"} savunma arkasına kaçtı fakat yardımcı hakemin bayrağı havada!`
    );
  }

  // =================================================
  // SARI KART
  // =================================================

  if (
    chance <= 77 &&
    scorer
  ) {

    scorer.data.yellow++;

    return channel.send(
      `🟨 **${minute}' SARI KART!**\n\n` +
      `${scorer.data.name || "Futbolcu"} sert müdahale nedeniyle sarı kart gördü.`
    );
  }

  // =================================================
  // FAUL
  // =================================================

  if (
    chance <= 86
  ) {

    return channel.send(
      `🟨 **${minute}' FAUL!**\n\n` +
      `Orta sahada sert bir müdahale oldu.\n` +
      `Hakem oyunu durdurdu.`
    );
  }

  // =================================================
  // KALECİ KURTARIŞ
  // =================================================

  if (
    chance <= 94
  ) {

    return channel.send(
      `🧤 **${minute}' MÜTHİŞ KURTARIŞ!**\n\n` +
      `**${defendingTeam}** kalecisi takımını kurtardı!`
    );
  }

  // =================================================
  // NORMAL OYUN
  // =================================================

  return channel.send(
    `⏱️ **${minute}'**\n` +
    `${randomItem(NORMAL_EVENTS)}`
  );
}

// =====================================================
// GOL OLUŞTUR
// =====================================================

async function createGoal(
  channel,
  match,
  teamNumber,
  attackingTeam,
  scorer,
  minute,
  guaranteed = false,
  penalty = false
) {

  if (!scorer) {

    // Kadro yoksa takım adına gol
    // yine de maç 0-0 kalmasın
    if (
      teamNumber === 1
    ) {
      match.score1++;
    } else {
      match.score2++;
    }

    return channel.send(
      `⚽ **${minute}' GOOOOL!**\n\n` +
      `🔥 **${attackingTeam}** golü buldu!\n\n` +
      `🔵 **${match.team1} ${match.score1} - ${match.score2} ${match.team2}**`
    );
  }

  if (
    teamNumber === 1
  ) {
    match.score1++;
  } else {
    match.score2++;
  }

  scorer.data.goals++;

  // Gol değeri
  scorer.data.value +=
    200000;

  let assist = null;

  const players =
    getTeamPlayers(
      attackingTeam
    )
      .filter(
        p =>
          p.id !== scorer.id
      );

  if (
    players.length &&
    Math.random() < 0.75
  ) {

    assist =
      randomItem(
        players
      );

    assist.data.assists++;
  }

  let title =
    penalty
      ? `🎯 **${minute}' PENALTI GOLÜ!**`
      : `⚽ **${minute}' GOOOOOOL!**`;

  if (guaranteed) {
    title =
      `⚽ **${minute}' GOL!**`;
  }

  let text =
    `${title}\n\n` +

    `🔥 **${attackingTeam}** golü buldu!\n\n` +

    `👤 Gol: **${scorer.data.name || "Futbolcu"}**`;

  if (assist) {

    text +=
      `\n🎯 Asist: **${assist.data.name || "Futbolcu"}**`;
  }

  text +=
    `\n\n🔵 **${match.team1} ${match.score1} - ${match.score2} ${match.team2}**`;

  return channel.send(
    text
  );
}

// =====================================================
// MAÇ BİTİR
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
  ) {
    return;
  }

  // Güvenlik: 0-0 bırakma
  if (
    match.score1 === 0 &&
    match.score2 === 0
  ) {

    if (
      Math.random() < 0.5
    ) {
      match.score1 = 1;
    } else {
      match.score2 = 1;
    }
  }

  match.active = false;

  if (match.timer) {

    clearTimeout(
      match.timer
    );

    match.timer = null;
  }

  const team1 =
    db.teams[
      match.team1
    ];

  const team2 =
    db.teams[
      match.team2
    ];

  let resultText;

  if (
    match.score1 >
    match.score2
  ) {

    team1.wins++;
    team2.losses++;

    team1.budget += 1000000;
    team2.budget += 500000;

    resultText =
      `🏆 **${match.team1} KAZANDI!**`;

  } else if (
    match.score2 >
    match.score1
  ) {

    team2.wins++;
    team1.losses++;

    team2.budget += 1000000;
    team1.budget += 500000;

    resultText =
      `🏆 **${match.team2} KAZANDI!**`;

  } else {

    team1.draws++;
    team2.draws++;

    team1.budget += 750000;
    team2.budget += 750000;

    resultText =
      `🤝 **MAÇ BERABERE!**`;
  }

  save();

  const embed =
    new EmbedBuilder()
      .setTitle(
        "🏁 MAÇ SONA ERDİ!"
      )
      .setDescription(

        `━━━━━━━━━━━━━━━━━━━━\n\n` +

        `🔵 **${match.team1}**\n` +
        `## ${match.score1} - ${match.score2}\n` +
        `🔴 **${match.team2}**\n\n` +

        `━━━━━━━━━━━━━━━━━━━━\n\n` +

        `${resultText}\n\n` +

        `⏱️ Maç Süresi: **5 dakika**\n` +
        `⚽ Maç Dakikası: **90'**\n\n` +

        `💰 ${match.team1}: **+${money(
          match.score1 > match.score2
            ? 1000000
            : match.score1 < match.score2
              ? 500000
              : 750000
        )}**\n` +

        `💰 ${match.team2}: **+${money(
          match.score2 > match.score1
            ? 1000000
            : match.score2 < match.score1
              ? 500000
              : 750000
        )}**`
      )
      .setColor("Green");

  return channel.send({
    embeds: [embed]
  });
}

// =====================================================
// READY
// =====================================================

client.once(
  "ready",
  () => {

    console.log(
      `✅ ${client.user.tag} aktif!`
    );

    client.user.setActivity(
      "Legendary League"
    );
  }
);

// =====================================================
// BUTONLAR
// =====================================================

client.on(
  "interactionCreate",
  async interaction => {

    if (
      !interaction.isButton()
    ) {
      return;
    }

    // Kayıt butonları
    if (
      interaction.customId
        .startsWith("register_")
    ) {

      if (
        !allowed(
          interaction.member,
          ROLE.KAYIT
        )
      ) {

        return interaction.reply({
          content:
            "❌ Kayıt Yetkilisi veya Yönetici olmalısın.",
          ephemeral: true
        });
      }

      const parts =
        interaction.customId
          .split("_");

      const type =
        parts[1];

      const userId =
        parts[2];

      const member =
        await interaction.guild.members
          .fetch(userId)
          .catch(() => null);

      if (!member) {

        return interaction.reply({
          content:
            "❌ Kullanıcı bulunamadı.",
          ephemeral: true
        });
      }

      await interaction.reply({
        content:
          "📝 Futbolcu/TD adını bu kanala yaz.",
        ephemeral: true
      });

      const collector =
        interaction.channel
          .createMessageCollector({

            filter: m =>
              m.author.id ===
              interaction.user.id,

            max: 1,

            time: 60000
          });

      collector.on(
        "collect",
        async msg => {

          const player =
            getPlayer(
              userId
            );

          player.registered = true;
          player.name =
            msg.content;

          player.type =
            type === "td"
              ? "Teknik Direktör"
              : "Futbolcu";

          const roleId =
            type === "td"
              ? ROLE.TEKNIK_DIREKTOR
              : ROLE.FUTBOLCU;

          const role =
            interaction.guild.roles.cache
              .get(roleId);

          if (role) {
            await member.roles.add(
              role
            );
          }

          save();

          await msg.reply(
            `✅ **Kayıt tamamlandı!**\n\n` +
            `👤 ${member}\n` +
            `📝 Ad: **${player.name}**\n` +
            `🏷️ Tür: **${player.type}**`
          );
        }
      );
    }
  }
);

// =====================================================
// KOMUTLAR
// =====================================================

client.on(
  "messageCreate",
  async message => {

    if (
      message.author.bot ||
      !message.guild ||
      !message.content.startsWith(PREFIX)
    ) {
      return;
    }

    try {

      const args =
        message.content
          .slice(PREFIX.length)
          .trim()
          .split(/\s+/);

      const command =
        args.shift()
          .toLowerCase();

      // =================================================
      // YARDIM
      // =================================================

      if (
        command === "yardım" ||
        command === "yardim"
      ) {

        return message.reply(
`⚽ **LEGENDARY LEAGUE**

📝 \`.k @oyuncu\`
💰 \`.dver @oyuncu 5M\`
🏋️ \`.ant\`
🥅 \`.pen\`

🏟️ \`.takımoluştur Galatasaray\`
👥 \`.kadro\`
➕ \`.kadroekle @oyuncu\`
➖ \`.kadroçıkar @oyuncu\`
🔄 \`.transfer @oyuncu Fenerbahçe\`
📍 \`.pozisyon @oyuncu ATT\`

⚽ \`.maç @Takım1 @Takım2\`
📊 \`.skor\`
🛑 \`.maçiptal\`

💰 \`.bütçe\`
💸 \`.gönder @oyuncu 5M\`
➕ \`.bütçeekle @oyuncu 5M\`
➖ \`.parasil @oyuncu 5M\`

🎉 \`.çekiliş 5M€ 5dk\`

🛡️ \`.kick @oyuncu\`
🔨 \`.ban @oyuncu\`
🔇 \`.mute @oyuncu 10dk\`
🔊 \`.unmute @oyuncu\`

🔒 \`.kilit\`
🔓 \`.aç\`
🗑️ \`.sil 10\``
        );
      }

      // =================================================
      // KAYIT
      // =================================================

      if (command === "k") {

        if (
          !allowed(
            message.member,
            ROLE.KAYIT
          )
        ) {

          return message.reply(
            "❌ Kayıt Yetkilisi veya Yönetici olmalısın."
          );
        }

        const user =
          message.mentions.users.first();

        if (!user) {

          return message.reply(
            "❌ Kullanım: `.k @oyuncu`"
          );
        }

        const row =
          new ActionRowBuilder()
            .addComponents(

              new ButtonBuilder()
                .setCustomId(
                  `register_td_${user.id}`
                )
                .setLabel(
                  "Teknik Direktör"
                )
                .setStyle(
                  ButtonStyle.Primary
                ),

              new ButtonBuilder()
                .setCustomId(
                  `register_player_${user.id}`
                )
                .setLabel(
                  "Futbolcu"
                )
                .setStyle(
                  ButtonStyle.Success
                )
            );

        return message.reply({

          embeds: [

            new EmbedBuilder()
              .setTitle(
                "📝 KAYIT SİSTEMİ"
              )
              .setDescription(
                `${user} kayıt türünü seç.`
              )
              .setColor("Blue")
          ],

          components: [
            row
          ]
        });
      }

      // =================================================
      // DEĞER
      // =================================================

      if (command === "dver") {

        if (
          !allowed(
            message.member,
            ROLE.DEGER
          )
        ) {

          return message.reply(
            "❌ Değer Yetkilisi veya Yönetici."
          );
        }

        const user =
          message.mentions.users.first();

        const amount =
          parseMoney(args[1]);

        if (
          !user ||
          !amount
        ) {

          return message.reply(
            "❌ `.dver @oyuncu 5M`"
          );
        }

        const player =
          getPlayer(
            user.id
          );

        player.value =
          amount;

        save();

        return message.reply(
          `💰 ${user} değeri **${money(amount)}** oldu.`
        );
      }

      // =================================================
      // ANTRENMAN
      // =================================================

      if (
        command === "ant" ||
        command === "antrenman"
      ) {

        const player =
          getPlayer(
            message.author.id
          );

        player.training++;

        if (
          player.training >= 10
        ) {

          player.training = 0;

          player.value +=
            200000;

          save();

          return message.reply(
            `🏋️ **Antrenman 10/10 tamamlandı!**\n\n` +
            `💰 Değer: **+200K€**\n` +
            `💎 Yeni değer: **${money(
              player.value
            )}**\n` +
            `🔄 Antrenman: **0/10**`
          );
        }

        save();

        return message.reply(
          `🏋️ Antrenman: **${player.training}/10**`
        );
      }

      // =================================================
      // PENALTI
      // =================================================

      if (
        command === "pen" ||
        command === "penaltı" ||
        command === "penalti"
      ) {

        const player =
          getPlayer(
            message.author.id
          );

        const goal =
          Math.random() < 0.65;

        if (goal) {

          player.value +=
            100000;

          save();

          return message.reply(
            `⚽ **GOOOL!**\n` +
            `🎯 Penaltı başarıyla kullanıldı!\n` +
            `💰 Değer: **+100K€**`
          );
        }

        return message.reply(
          `❌ **PENALTI KAÇTI!**`
        );
      }

      // =================================================
      // TAKIM OLUŞTUR
      // =================================================

      if (
        command === "takımoluştur" ||
        command === "takimolustur"
      ) {

        if (
          !isTD(
            message.member
          )
        ) {

          return message.reply(
            "❌ Sadece Teknik Direktörler takım oluşturabilir."
          );
        }

        const name =
          args.join(" ").trim();

        if (!name) {

          return message.reply(
            "❌ Örnek: `.takımoluştur Galatasaray`"
          );
        }

        const realTeam =
          REAL_TEAMS.find(
            x =>
              x.toLowerCase() ===
              name.toLowerCase()
          );

        if (!realTeam) {

          return message.reply(
            "❌ Bu takım gerçek takım listesinde bulunmuyor."
          );
        }

        const alreadyOwns =
          Object.values(
            db.teams
          ).find(
            team =>
              team.owner ===
              message.author.id
          );

        if (alreadyOwns) {

          return message.reply(
            `❌ Zaten **${alreadyOwns.name}** takımına sahipsin.`
          );
        }

        const alreadyTaken =
          Object.values(
            db.teams
          ).find(
            team =>
              team.name.toLowerCase() ===
              realTeam.toLowerCase()
          );

        if (alreadyTaken) {

          return message.reply(
            `❌ **${realTeam}** zaten başka bir Teknik Direktörde.`
          );
        }

        // Takım adı = rol adı
        const teamRole =
          await message.guild.roles.create({

            name: realTeam,

            reason:
              `${message.author.tag} tarafından oluşturuldu.`
          });

        db.teams[realTeam] = {

          name: realTeam,

          roleId:
            teamRole.id,

          owner:
            message.author.id,

          members: [],

          budget:
            50000000,

          wins: 0,
          draws: 0,
          losses: 0
        };

        const player =
          getPlayer(
            message.author.id
          );

        player.team =
          realTeam;

        player.type =
          "Teknik Direktör";

        await message.member.roles.add(
          teamRole
        );

        const tdRole =
          message.guild.roles.cache
            .get(
              ROLE.TEKNIK_DIREKTOR
            );

        if (tdRole) {

          await message.member.roles.add(
            tdRole
          );
        }

        save();

        return message.reply(
          `🏟️ **TAKIM OLUŞTURULDU!**\n\n` +
          `🏆 Takım: **${realTeam}**\n` +
          `👔 Teknik Direktör: ${message.author}\n` +
          `🎭 Takım Rolü: <@&${teamRole.id}>\n` +
          `💰 Başlangıç bütçesi: **50M€**`
        );
      }

      // =================================================
      // KADRO
      // =================================================

      if (command === "kadro") {

        const player =
          getPlayer(
            message.author.id
          );

        if (!player.team) {

          return message.reply(
            "❌ Bir takımda değilsin."
          );
        }

        const team =
          db.teams[
            player.team
          ];

        if (!team) {

          return message.reply(
            "❌ Takım bulunamadı."
          );
        }

        if (!team.members.length) {

          return message.reply(
            `👥 **${team.name}** kadrosu şu anda boş.`
          );
        }

        const list =
          team.members
            .map(
              id => {

                const p =
                  getPlayer(id);

                return (
                  `• **${p.name || "İsimsiz"}** ` +
                  `(${p.position}) — <@${id}>`
                );
              }
            )
            .join("\n");

        return message.reply(
          `👥 **${team.name} KADROSU**\n\n` +
          list +
          `\n\n💰 Bütçe: **${money(
            team.budget
          )}**`
        );
      }

      // =================================================
      // KADRO EKLE
      // =================================================

      if (
        command === "kadroekle"
      ) {

        if (
          !isTD(
            message.member
          )
        ) {

          return message.reply(
            "❌ Sadece Teknik Direktör."
          );
        }

        const user =
          message.mentions.users.first();

        const team =
          getPlayer(
            message.author.id
          ).team;

        if (!user || !team) {

          return message.reply(
            "❌ `.kadroekle @oyuncu`"
          );
        }

        const player =
          getPlayer(
            user.id
          );

        if (player.team) {

          return message.reply(
            `❌ Bu oyuncu zaten **${player.team}** takımında.`
          );
        }

        player.team =
          team;

        db.teams[
          team
        ].members.push(
          user.id
        );

        save();

        return message.reply(
          `✅ ${user} **${team}** kadrosuna eklendi.`
        );
      }

      // =================================================
      // KADRO ÇIKAR
      // =================================================

      if (
        command === "kadroçıkar" ||
        command === "kadrocikar"
      ) {

        if (
          !isTD(
            message.member
          )
        ) {

          return message.reply(
            "❌ Sadece Teknik Direktör."
          );
        }

        const user =
          message.mentions.users.first();

        const team =
          getPlayer(
            message.author.id
          ).team;

        if (!user || !team) {

          return message.reply(
            "❌ `.kadroçıkar @oyuncu`"
          );
        }

        const player =
          getPlayer(
            user.id
          );

        if (
          player.team !== team
        ) {

          return message.reply(
            "❌ Oyuncu bu takımda değil."
          );
        }

        player.team =
          null;

        db.teams[
          team
        ].members =
          db.teams[
            team
          ].members.filter(
            id =>
              id !== user.id
          );

        save();

        return message.reply(
          `✅ ${user} **${team}** kadrosundan çıkarıldı.`
        );
      }

      // =================================================
      // TRANSFER
      // =================================================

      if (
        command === "transfer"
      ) {

        if (
          !isTD(
            message.member
          )
        ) {

          return message.reply(
            "❌ Sadece Teknik Direktör."
          );
        }

        const user =
          message.mentions.users.first();

        const target =
          args.slice(1).join(" ");

        const realTeam =
          REAL_TEAMS.find(
            x =>
              x.toLowerCase() ===
              target.toLowerCase()
          );

        if (
          !user ||
          !realTeam
        ) {

          return message.reply(
            "❌ `.transfer @oyuncu Galatasaray`"
          );
        }

        if (!db.teams[realTeam]) {

          return message.reply(
            `❌ **${realTeam}** henüz bir Teknik Direktöre sahip değil.`
          );
        }

        const player =
          getPlayer(
            user.id
          );

        if (player.team) {

          const old =
            db.teams[
              player.team
            ];

          if (old) {

            old.members =
              old.members.filter(
                id =>
                  id !== user.id
              );
          }
        }

        player.team =
          realTeam;

        if (
          !db.teams[
            realTeam
          ].members.includes(
            user.id
          )
        ) {

          db.teams[
            realTeam
          ].members.push(
            user.id
          );
        }

        save();

        return message.reply(
          `🔄 ${user} → **${realTeam}** transfer edildi.`
        );
      }

      // =================================================
      // POZİSYON
      // =================================================

      if (
        command === "pozisyon"
      ) {

        if (
          !isTD(
            message.member
          )
        ) {

          return message.reply(
            "❌ Sadece Teknik Direktör."
          );
        }

        const user =
          message.mentions.users.first();

        const pos =
          (
            args[1] || ""
          ).toUpperCase();

        if (
          !user ||
          ![
            "GK",
            "DEF",
            "MID",
            "ATT"
          ].includes(pos)
        ) {

          return message.reply(
            "❌ GK / DEF / MID / ATT kullan."
          );
        }

        getPlayer(
          user.id
        ).position =
          pos;

        save();

        return message.reply(
          `📍 ${user} pozisyonu **${pos}** oldu.`
        );
      }

      // =================================================
      // BÜTÇE
      // =================================================

      if (
        command === "bütçe" ||
        command === "butce"
      ) {

        const player =
          getPlayer(
            message.author.id
          );

        if (!player.team) {

          return message.reply(
            "❌ Bir takımda değilsin."
          );
        }

        const team =
          db.teams[
            player.team
          ];

        return message.reply(
          `💰 **${team.name}** bütçesi: **${money(
            team.budget
          )}**`
        );
      }

      // =================================================
      // PARA GÖNDER
      // =================================================

      if (
        command === "gönder" ||
        command === "gonder"
      ) {

        const user =
          message.mentions.users.first();

        const amount =
          parseMoney(
            args[1]
          );

        if (!user || !amount) {

          return message.reply(
            "❌ `.gönder @oyuncu 5M`"
          );
        }

        const sender =
          getPlayer(
            message.author.id
          );

        const receiver =
          getPlayer(
            user.id
          );

        if (
          sender.budget <
          amount
        ) {

          return message.reply(
            "❌ Yetersiz bütçe."
          );
        }

        sender.budget -=
          amount;

        receiver.budget +=
          amount;

        save();

        return message.reply(
          `💸 ${user} kullanıcısına **${money(
            amount
          )}** gönderildi.`
        );
      }

      // =================================================
      // BÜTÇE EKLE
      // =================================================

      if (
        command === "bütçeekle" ||
        command === "butceekle"
      ) {

        if (
          !isAdmin(
            message.member
          )
        ) {

          return message.reply(
            "❌ Sadece Yönetici."
          );
        }

        const user =
          message.mentions.users.first();

        const amount =
          parseMoney(
            args[1]
          );

        if (!user || !amount) {

          return message.reply(
            "❌ `.bütçeekle @oyuncu 5M`"
          );
        }

        const player =
          getPlayer(
            user.id
          );

        player.budget +=
          amount;

        save();

        return message.reply(
          `💰 ${user} bütçesine **${money(
            amount
          )}** eklendi.`
        );
      }

      // =================================================
      // PARA SİL
      // =================================================

      if (
        command === "parasil"
      ) {

        if (
          !isAdmin(
            message.member
          )
        ) {

          return message.reply(
            "❌ Sadece Yönetici."
          );
        }

        const user =
          message.mentions.users.first();

        const amount =
          parseMoney(
            args[1]
          );

        if (!user || !amount) {

          return message.reply(
            "❌ `.parasil @oyuncu 5M`"
          );
        }

        const player =
          getPlayer(
            user.id
          );

        player.budget =
          Math.max(
            0,
            player.budget -
            amount
          );

        save();

        return message.reply(
          `🗑️ ${user} bütçesinden **${money(
            amount
          )}** silindi.`
        );
      }

      // =================================================
      // MAÇ
      // =================================================

      if (
        command === "maç" ||
        command === "mac"
      ) {

        if (
          !allowed(
            message.member,
            ROLE.MAC
          )
        ) {

          return message.reply(
            "❌ Maç Yetkilisi veya Yönetici."
          );
        }

        // SADECE ROL ETİKETLERİ
        const roles =
          [
            ...message.mentions.roles.values()
          ];

        if (
          roles.length !== 2
        ) {

          return message.reply(
            "❌ Sadece 2 takım rolünü etiketle:\n" +
            "`.maç @Galatasaray @Fenerbahçe`"
          );
        }

        const team1 =
          Object.values(
            db.teams
          ).find(
            t =>
              t.roleId ===
              roles[0].id
          );

        const team2 =
          Object.values(
            db.teams
          ).find(
            t =>
              t.roleId ===
              roles[1].id
          );

        if (
          !team1 ||
          !team2
        ) {

          return message.reply(
            "❌ Etiketlediğin roller kayıtlı takım değil."
          );
        }

        if (
          team1.name ===
          team2.name
        ) {

          return message.reply(
            "❌ Aynı takım kendisiyle oynayamaz."
          );
        }

        const active =
          Object.values(
            db.matches
          ).find(
            m =>
              m.active &&
              m.channelId ===
              message.channel.id
          );

        if (active) {

          return message.reply(
            "❌ Bu kanalda zaten maç oynanıyor."
          );
        }

        const id =
          Date.now().toString();

        db.matches[id] = {

          id,

          channelId:
            message.channel.id,

          team1:
            team1.name,

          team2:
            team2.name,

          score1: 0,
          score2: 0,

          start:
            Date.now(),

          end:
            Date.now() +
            300000,

          active: true,

          timer: null
        };

        save();

        await message.channel.send(
          `🏟️ **MAÇ BAŞLIYOR!**\n\n` +
          `🔵 ${roles[0]} 🆚 ${roles[1]}\n\n` +
          `📋 Maç Süresi: **5 dakika**\n` +
          `⏱️ Maç: **90 dakika**\n` +
          `🎙️ Canlı maç anlatımı başladı!\n\n` +
          `━━━━━━━━━━━━━━━━━━`
        );

        await new Promise(
          resolve =>
            setTimeout(
              resolve,
              1500
            )
        );

        await message.channel.send(
          `⏱️ **1'** HAKEM DÜDÜĞÜNÜ ÇALDI! MAÇ BAŞLADI! ⚽`
        );

        startMatch(
          message.channel,
          id
        );

        return;
      }

      // =================================================
      // SKOR
      // =================================================

      if (
        command === "skor"
      ) {

        const match =
          Object.values(
            db.matches
          ).find(
            m =>
              m.active &&
              m.channelId ===
              message.channel.id
          );

        if (!match) {

          return message.reply(
            "❌ Aktif maç bulunmuyor."
          );
        }

        const minute =
          Math.min(
            90,
            Math.floor(
              (
                Date.now() -
                match.start
              ) /
              300000 *
              90
            )
          );

        return message.reply(
          `📊 **MAÇ SKORU**\n\n` +
          `🔵 **${match.team1}**\n` +
          `## ${match.score1} - ${match.score2}\n` +
          `🔴 **${match.team2}**\n\n` +
          `⏱️ Dakika: **${minute}'**`
        );
      }

      // =================================================
      // ÇEKİLİŞ
      // =================================================

      if (
        command === "çekiliş" ||
        command === "cekilis"
      ) {

        if (
          !allowed(
            message.member,
            ROLE.CEKILIS
          )
        ) {

          return message.reply(
            "❌ Çekiliş Yetkilisi veya Yönetici."
          );
        }

        const prize =
          args[0];

        const duration =
          parseDuration(
            args[1]
          );

        if (
          !prize ||
          !duration
        ) {

          return message.reply(
            "❌ Örnek:\n" +
            "`.çekiliş 5M€ 5dk`\n" +
            "`.çekiliş 5M€ 5sa`\n" +
            "`.çekiliş 5M€ 30sn`"
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
                .setLabel(
                  "🎉 Katıl"
                )
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
                  `Katılmak için aşağıdaki butona bas!`
                )
                .setColor("Gold")
            ],

            components: [
              row
            ]
          });

        const collector =
          giveaway
            .createMessageComponentCollector({
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

            return interaction.reply({
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
              components: [
                row
              ]
            }).catch(() => {});

            if (
              participants.size === 0
            ) {

              return message.channel.send(
                "❌ Çekilişe katılan olmadı."
              );
            }

            const winner =
              randomItem(
                [
                  ...participants
                ]
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

      // =================================================
      // KICK
      // =================================================

      if (
        command === "kick"
      ) {

        if (
          !isAdmin(
            message.member
          )
        ) {

          return message.reply(
            "❌ Sadece Yönetici."
          );
        }

        const member =
          message.mentions.members.first();

        if (!member) {

          return message.reply(
            "❌ `.kick @oyuncu`"
          );
        }

        if (
          !member.kickable
        ) {

          return message.reply(
            "❌ Bu kullanıcıyı kickleyemiyorum."
          );
        }

        await member.kick(
          args.slice(1).join(" ") ||
          "Sebep belirtilmedi."
        );

        return message.reply(
          `👢 **${member.user.tag}** sunucudan atıldı.`
        );
      }

      // =================================================
      // BAN
      // =================================================

      if (
        command === "ban"
      ) {

        if (
          !isAdmin(
            message.member
          )
        ) {

          return message.reply(
            "❌ Sadece Yönetici."
          );
        }

        const member =
          message.mentions.members.first();

        if (!member) {

          return message.reply(
            "❌ `.ban @oyuncu`"
          );
        }

        if (
          !member.bannable
        ) {

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

      // =================================================
      // MUTE
      // =================================================

      if (
        command === "mute"
      ) {

        if (
          !isAdmin(
            message.member
          )
        ) {

          return message.reply(
            "❌ Sadece Yönetici."
          );
        }

        const member =
          message.mentions.members.first();

        const duration =
          parseDuration(
            args[1]
          );

        if (
          !member ||
          !duration
        ) {

          return message.reply(
            "❌ `.mute @oyuncu 10dk`"
          );
        }

        await member.timeout(
          duration,
          "Moderasyon"
        );

        return message.reply(
          `🔇 ${member} **${args[1]}** susturuldu.`
        );
      }

      // =================================================
      // UNMUTE
      // =================================================

      if (
        command === "unmute"
      ) {

        if (
          !isAdmin(
            message.member
          )
        ) {

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

      // =================================================
      // KANAL KİLİT
      // =================================================

      if (
        command === "kilit"
      ) {

        if (
          !isAdmin(
            message.member
          )
        ) {

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

      // =================================================
      // KANAL AÇ
      // =================================================

      if (
        command === "aç" ||
        command === "ac"
      ) {

        if (
          !isAdmin(
            message.member
          )
        ) {

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

      // =================================================
      // MESAJ SİL
      // =================================================

      if (
        command === "sil"
      ) {

        if (
          !isAdmin(
            message.member
          )
        ) {

          return message.reply(
            "❌ Sadece Yönetici."
          );
        }

        const amount =
          parseInt(
            args[0]
          );

        if (
          !amount ||
          amount < 1 ||
          amount > 100
        ) {

          return message.reply(
            "❌ `.sil 10`\n1-100 arası bir sayı yaz."
          );
        }

        const deleted =
          await message.channel
            .bulkDelete(
              amount + 1,
              true
            );

        const msg =
          await message.channel.send(
            `🗑️ **${Math.max(
              0,
              deleted.size - 1
            )} mesaj silindi.**`
          );

        setTimeout(
          () =>
            msg.delete()
              .catch(() => {}),
          3000
        );
      }

    } catch (error) {

      console.error(
        "KOMUT HATASI:",
        error
      );

      message.reply(
        "❌ Komut çalışırken bir hata oluştu."
      ).catch(() => {});
    }
  }
);

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
// TOKEN
// =====================================================

if (!process.env.TOKEN) {

  console.error(
    "❌ TOKEN bulunamadı!"
  );

  process.exit(1);
}

client.login(
  process.env.TOKEN
);
