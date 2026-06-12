export type Phrase = {
  en: string;
  jp: string;
  romaji: string;
};

export type PhraseGroup = {
  group: string;
  emoji: string;
  phrases: Phrase[];
};

export const PHRASES: PhraseGroup[] = [
  {
    group: "Survival Basics",
    emoji: "🙏",
    phrases: [
      { en: "Hello", jp: "こんにちは", romaji: "konnichiwa" },
      { en: "Thank you (very much)", jp: "ありがとうございます", romaji: "arigatō gozaimasu" },
      { en: "Excuse me / sorry", jp: "すみません", romaji: "sumimasen" },
      { en: "Yes / No", jp: "はい / いいえ", romaji: "hai / iie" },
      { en: "Please (requesting)", jp: "お願いします", romaji: "onegai shimasu" },
      { en: "I don't understand", jp: "わかりません", romaji: "wakarimasen" },
      { en: "Do you speak English?", jp: "英語を話せますか？", romaji: "eigo o hanasemasu ka?" },
      { en: "It's okay / no problem", jp: "大丈夫です", romaji: "daijōbu desu" },
      { en: "Good morning", jp: "おはようございます", romaji: "ohayō gozaimasu" },
      { en: "Good evening", jp: "こんばんは", romaji: "konbanwa" },
    ],
  },
  {
    group: "Restaurant",
    emoji: "🍜",
    phrases: [
      { en: "8 people, please", jp: "8人です", romaji: "hachi-nin desu" },
      { en: "Do you have an English menu?", jp: "英語のメニューはありますか？", romaji: "eigo no menyū wa arimasu ka?" },
      { en: "This one, please (pointing)", jp: "これをください", romaji: "kore o kudasai" },
      { en: "What do you recommend?", jp: "おすすめは何ですか？", romaji: "osusume wa nan desu ka?" },
      { en: "Cheers!", jp: "乾杯！", romaji: "kanpai!" },
      { en: "It's delicious", jp: "おいしいです", romaji: "oishii desu" },
      { en: "Check, please", jp: "お会計お願いします", romaji: "okaikei onegai shimasu" },
      { en: "Thanks for the meal (after)", jp: "ごちそうさまでした", romaji: "gochisōsama deshita" },
      { en: "I have an allergy to ___", jp: "___アレルギーがあります", romaji: "___ arerugī ga arimasu" },
      { en: "No meat (vegetarian-ish)", jp: "肉なしでお願いします", romaji: "niku nashi de onegai shimasu" },
      { en: "Water, please", jp: "お水ください", romaji: "omizu kudasai" },
      { en: "One more, please", jp: "もう一つください", romaji: "mō hitotsu kudasai" },
    ],
  },
  {
    group: "Shopping",
    emoji: "🛍️",
    phrases: [
      { en: "How much is this?", jp: "いくらですか？", romaji: "ikura desu ka?" },
      { en: "Tax-free, please", jp: "免税でお願いします", romaji: "menzei de onegai shimasu" },
      { en: "Can I pay by card?", jp: "カードで払えますか？", romaji: "kādo de haraemasu ka?" },
      { en: "Just looking, thanks", jp: "見ているだけです", romaji: "mite iru dake desu" },
      { en: "Do you have a bigger size?", jp: "もっと大きいサイズはありますか？", romaji: "motto ōkii saizu wa arimasu ka?" },
      { en: "Can you gift-wrap this?", jp: "プレゼント用に包んでもらえますか？", romaji: "purezento-yō ni tsutsunde moraemasu ka?" },
    ],
  },
  {
    group: "Trains & Directions",
    emoji: "🚉",
    phrases: [
      { en: "Where is ___?", jp: "___はどこですか？", romaji: "___ wa doko desu ka?" },
      { en: "Which platform for ___?", jp: "___は何番線ですか？", romaji: "___ wa nanban-sen desu ka?" },
      { en: "Does this train go to ___?", jp: "この電車は___に行きますか？", romaji: "kono densha wa ___ ni ikimasu ka?" },
      { en: "Where is the toilet?", jp: "トイレはどこですか？", romaji: "toire wa doko desu ka?" },
      { en: "I'd like to go here (show map)", jp: "ここに行きたいです", romaji: "koko ni ikitai desu" },
      { en: "Left / Right / Straight", jp: "左 / 右 / まっすぐ", romaji: "hidari / migi / massugu" },
      { en: "Coin lockers?", jp: "コインロッカーはどこですか？", romaji: "koin rokkā wa doko desu ka?" },
    ],
  },
  {
    group: "Hotel & Onsen",
    emoji: "♨️",
    phrases: [
      { en: "Check-in, please", jp: "チェックインお願いします", romaji: "chekku-in onegai shimasu" },
      { en: "Can you hold our luggage?", jp: "荷物を預かってもらえますか？", romaji: "nimotsu o azukatte moraemasu ka?" },
      { en: "What time is the bath open until?", jp: "お風呂は何時までですか？", romaji: "ofuro wa nanji made desu ka?" },
      { en: "I have a tattoo — is it okay?", jp: "タトゥーがありますが大丈夫ですか？", romaji: "tatū ga arimasu ga, daijōbu desu ka?" },
      { en: "Can you call a taxi?", jp: "タクシーを呼んでもらえますか？", romaji: "takushī o yonde moraemasu ka?" },
    ],
  },
  {
    group: "Izakaya & Bar Mode",
    emoji: "🍻",
    phrases: [
      { en: "Draft beers to start, for everyone (THE opener)", jp: "とりあえず生で", romaji: "toriaezu nama de" },
      { en: "All-you-can-drink, please", jp: "飲み放題お願いします", romaji: "nomihōdai onegai shimasu" },
      { en: "Your recommendation, please", jp: "おすすめでお願いします", romaji: "osusume de onegai shimasu" },
      { en: "Same again / refill, please", jp: "おかわりください", romaji: "okawari kudasai" },
      { en: "Is there a seating charge?", jp: "チャージはありますか？", romaji: "chāji wa arimasu ka?" },
      { en: "Can 3 people fit?", jp: "3人入れますか？", romaji: "san-nin hairemasu ka?" },
      { en: "Separate checks, please", jp: "別々でお願いします", romaji: "betsu-betsu de onegai shimasu" },
      { en: "Together (one check), please", jp: "一緒でお願いします", romaji: "issho de onegai shimasu" },
      { en: "Hot sake, one flask", jp: "熱燗を一本ください", romaji: "atsukan o ippon kudasai" },
      { en: "Last one, then we'll go", jp: "最後の一杯です", romaji: "saigo no ippai desu" },
      { en: "That was fun! (leaving a bar)", jp: "楽しかったです！", romaji: "tanoshikatta desu!" },
    ],
  },
  {
    group: "Konbini Counter",
    emoji: "🏪",
    phrases: [
      { en: "Warm this up, please", jp: "温めてください", romaji: "atatamete kudasai" },
      { en: "A bag, please", jp: "袋お願いします", romaji: "fukuro onegai shimasu" },
      { en: "No bag needed", jp: "袋はいらないです", romaji: "fukuro wa iranai desu" },
      { en: "Chopsticks, please", jp: "お箸ください", romaji: "ohashi kudasai" },
      { en: "One Famichiki, please", jp: "ファミチキ一つください", romaji: "famichiki hitotsu kudasai" },
      { en: "By card / by Suica", jp: "カードで / Suicaで", romaji: "kādo de / Suica de" },
      { en: "(Asked about point cards) — Don't have one", jp: "ないです", romaji: "nai desu" },
    ],
  },
  {
    group: "Karaoke & Arcade",
    emoji: "🎤",
    phrases: [
      { en: "8 people, 2 hours, all-you-can-drink", jp: "8人、2時間、飲み放題で", romaji: "hachi-nin, ni-jikan, nomihōdai de" },
      { en: "Extend 30 minutes, please", jp: "30分延長お願いします", romaji: "sanjuppun enchō onegai shimasu" },
      { en: "Can you move this prize? (crane game)", jp: "これ、動かしてもらえますか？", romaji: "kore, ugokashite moraemasu ka?" },
      { en: "One more game!", jp: "もう一回！", romaji: "mō ikkai!" },
      { en: "Nice! / You did it!", jp: "ナイス！ / やった！", romaji: "naisu! / yatta!" },
      { en: "Where's the change machine?", jp: "両替機はどこですか？", romaji: "ryōgaeki wa doko desu ka?" },
    ],
  },
  {
    group: "Making Friends",
    emoji: "🤝",
    phrases: [
      { en: "We're from America", jp: "アメリカから来ました", romaji: "amerika kara kimashita" },
      { en: "First time in Japan!", jp: "日本は初めてです！", romaji: "nihon wa hajimete desu!" },
      { en: "Japan is the best", jp: "日本は最高です", romaji: "nihon wa saikō desu" },
      { en: "Cheers with us!", jp: "一緒に乾杯しましょう！", romaji: "issho ni kanpai shimashō!" },
      { en: "Can we take a photo together?", jp: "一緒に写真いいですか？", romaji: "issho ni shashin ii desu ka?" },
      { en: "What's good around here?", jp: "この辺でおすすめはありますか？", romaji: "kono hen de osusume wa arimasu ka?" },
      { en: "See you! / Take care", jp: "またね！ / お元気で", romaji: "mata ne! / o-genki de" },
    ],
  },
  {
    group: "Numbers & Money",
    emoji: "💴",
    phrases: [
      { en: "1 · 2 · 3 · 4", jp: "一・二・三・四", romaji: "ichi · ni · san · yon" },
      { en: "5 · 6 · 7 · 8", jp: "五・六・七・八", romaji: "go · roku · nana · hachi" },
      { en: "100 / 1,000 / 10,000", jp: "百 / 千 / 万", romaji: "hyaku / sen / man" },
      { en: "How much all together?", jp: "全部でいくらですか？", romaji: "zenbu de ikura desu ka?" },
      { en: "People counters: 1, 2, 8", jp: "一人・二人・八人", romaji: "hitori · futari · hachi-nin" },
      { en: "Flat-thing counter (tickets): 8", jp: "八枚", romaji: "hachi-mai" },
      { en: "Cheap! / Expensive!", jp: "安い！ / 高い！", romaji: "yasui! / takai!" },
    ],
  },
  {
    group: "Emergency",
    emoji: "🚨",
    phrases: [
      { en: "Help!", jp: "助けて！", romaji: "tasukete!" },
      { en: "Call an ambulance, please", jp: "救急車を呼んでください", romaji: "kyūkyūsha o yonde kudasai" },
      { en: "I'm lost", jp: "道に迷いました", romaji: "michi ni mayoimashita" },
      { en: "I lost my passport", jp: "パスポートをなくしました", romaji: "pasupōto o nakushimashita" },
      { en: "Where is a pharmacy?", jp: "薬局はどこですか？", romaji: "yakkyoku wa doko desu ka?" },
      { en: "I need a doctor", jp: "医者が必要です", romaji: "isha ga hitsuyō desu" },
      { en: "Police box (ask for one)", jp: "交番", romaji: "kōban" },
    ],
  },
];
