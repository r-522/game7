import type { MenchiType } from '@/types'

// ---------------------------------------------------------------------------
// District definitions
// ---------------------------------------------------------------------------

export interface DistrictDef {
  id: number
  name: string
  nameEn: string
  description: string
  /** Inclusive level range [min, max] that enemies spawn at in this district */
  levelRange: [number, number]
  /** World-space spawn origin for this district's arena */
  arenaOrigin: { x: number; z: number }
}

export const DISTRICTS: DistrictDef[] = [
  {
    id: 0,
    name: '北港区',
    nameEn: 'Kita-ko-ku',
    description: '潮の香りが漂う港湾エリア。荒くれ者の漁師や波止場の番人が仕切る。',
    levelRange: [1, 3],
    arenaOrigin: { x: -200, z: 0 },
  },
  {
    id: 1,
    name: '学園区',
    nameEn: 'Gakuen-ku',
    description: '鉄腸高校を中心に学生が集まる文教地区。校内暴力が絶えない。',
    levelRange: [4, 6],
    arenaOrigin: { x: -100, z: 100 },
  },
  {
    id: 2,
    name: '商店街',
    nameEn: 'Shoutengai',
    description: 'ネオンが瞬くアーケード商店街。縄張り争いが日常茶飯事。',
    levelRange: [7, 9],
    arenaOrigin: { x: 0, z: 0 },
  },
  {
    id: 3,
    name: '工場地帯',
    nameEn: 'Koujo Chitai',
    description: '廃工場が立ち並ぶ殺伐としたエリア。鉄と煙の匂いが漂う。',
    levelRange: [10, 12],
    arenaOrigin: { x: 100, z: -100 },
  },
  {
    id: 4,
    name: '歓楽街',
    nameEn: 'Kanraku-gai',
    description: '夜も眠らない繁華街。金と欲望が渦巻く危険地帯。',
    levelRange: [13, 15],
    arenaOrigin: { x: 100, z: 100 },
  },
  {
    id: 5,
    name: '山手区',
    nameEn: 'Yamate-ku',
    description: '丘の上に広がる高級住宅街。裏では黒幕連合の影が色濃い。',
    levelRange: [16, 18],
    arenaOrigin: { x: 200, z: 0 },
  },
  {
    id: 6,
    name: '決戦地',
    nameEn: 'Kessen-chi',
    description: '鉄腸市の中心に位置する廃墟の闘技場。すべてはここで決まる。',
    levelRange: [19, 20],
    arenaOrigin: { x: 0, z: -200 },
  },
]

// ---------------------------------------------------------------------------
// Chapter definitions
// ---------------------------------------------------------------------------

export interface StoryFlag {
  id: string
  description: string
}

export interface ChapterDef {
  id: string
  /** Japanese title displayed in-game */
  title: string
  /** English subtitle displayed beneath the Japanese title */
  subtitle: string
  /** Narrative description shown on the chapter select screen */
  description: string
  /** District index unlocked when this chapter begins (0-indexed) */
  unlocksDistrict: number
  /** Banchou that must be defeated to clear this chapter */
  requiredBanchouIds: string[]
  storyFlags: StoryFlag[]
  /** Opening narration lines (voiced in cutscene) */
  openingLines: string[]
  /** Closing narration lines after chapter clears */
  closingLines: string[]
}

export const CHAPTERS: ChapterDef[] = [
  {
    id: 'ch01',
    title: '転校生、到着',
    subtitle: 'The New Kid Arrives',
    description:
      '鉄腸市へ転校してきた龍堂剛。北港区と学園区の番長を倒し、この街で生き抜く力を証明しろ。',
    unlocksDistrict: 0,
    requiredBanchouIds: ['banchou_goki', 'banchou_hayami'],
    storyFlags: [
      { id: 'flag_arrived_tetsucho', description: '鉄腸市に到着した' },
      { id: 'flag_enrolled_tetsuko', description: '鉄腸高校に転入した' },
      { id: 'flag_ch01_complete', description: '第一章をクリアした' },
    ],
    openingLines: [
      '……ここが鉄腸市か。',
      '俺は龍堂剛。どこへ転校しても同じだ——',
      '最後は拳が全てを決める。',
    ],
    closingLines: [
      '北港の波音が遠くなっていく。',
      '二人の番長を下したが、まだ終わりじゃない。',
      '鉄腸市の空は、今日も煙で霞んでいた。',
    ],
  },
  {
    id: 'ch02',
    title: '七色の拳',
    subtitle: 'Seven Fists of the Districts',
    description:
      '商店街・工場地帯・歓楽街の三区の番長が姿を現した。それぞれ異なる流儀で龍堂剛の前に立ちはだかる。',
    unlocksDistrict: 2,
    requiredBanchouIds: ['banchou_ushiyama', 'banchou_kageyama', 'banchou_raido'],
    storyFlags: [
      { id: 'flag_seven_revealed', description: '七区番長の全貌が明らかになった' },
      { id: 'flag_ch02_complete', description: '第二章をクリアした' },
    ],
    openingLines: [
      'この街には七人の番長がいる——各区の頂点に君臨する化け物どもだ。',
      '「お前が七人全員を倒せたら、俺が認めてやる」',
      '笑わせるな。売られた喧嘩は全部買う。それが俺の流儀だ。',
    ],
    closingLines: [
      '三区を制した。だが番長たちはみな同じことを言っていた——',
      '「黒幕連合に気をつけろ」',
      '影が動き始めている。',
    ],
  },
  {
    id: 'ch03',
    title: '影の連合',
    subtitle: 'The Shadow Alliance',
    description:
      '山手区を牛耳る岩崎不動丸の背後に、黒幕連合の存在が明らかになる。街の平和を守るため、龍堂剛は単独で乗り込む。',
    unlocksDistrict: 5,
    requiredBanchouIds: ['banchou_iwasaki'],
    storyFlags: [
      { id: 'flag_kuromaku_revealed', description: '黒幕連合の存在を知った' },
      { id: 'flag_shatei_rescued', description: '捕まっていた舎弟を救出した' },
      { id: 'flag_ch03_complete', description: '第三章をクリアした' },
    ],
    openingLines: [
      '山手区の丘から見下ろすと、鉄腸市の全貌が見えた。',
      'この街を縄張りにする奴らの糸を引く存在——黒幕連合。',
      '俺に逃げるという選択肢はない。',
    ],
    closingLines: [
      '岩崎を倒した後、奴は静かに言った——',
      '「鬼塚に気をつけろ。あいつはお前を最初から待っていた」',
      '決戦地。すべての答えがそこにある。',
    ],
  },
  {
    id: 'ch04',
    title: '最後の男気',
    subtitle: 'The Last Stand of True Grit',
    description:
      '黒幕連合頭目・鬼塚覇王との最終決戦。七区の番長たちの意地を背負い、龍堂剛は決戦地へ向かう。',
    unlocksDistrict: 6,
    requiredBanchouIds: ['banchou_onizuka'],
    storyFlags: [
      { id: 'flag_kuromaku_disbanded', description: '黒幕連合を壊滅させた' },
      { id: 'flag_tetsucho_strongest', description: '鉄腸市最強の番長となった' },
      { id: 'flag_ch04_complete', description: '第四章をクリアした — エンディング解放' },
    ],
    openingLines: [
      '七人の番長から受け取った意地——それを拳に込めて。',
      '鬼塚覇王。お前の連合は今日ここで終わりだ。',
      'これが俺の、最後の男気だ。',
    ],
    closingLines: [
      '鉄腸市の夜明け。',
      '龍堂剛は静かにその場を立ち去った。',
      '誰に頼まれたわけでもなく、ただ——男としての筋を通しただけだ。',
    ],
  },
]

// ---------------------------------------------------------------------------
// Banchou definitions
// ---------------------------------------------------------------------------

export interface BanchouDialogue {
  preFight: string[]
  midFight?: string[]
  postFightWin: string[]
  postFightLose: string[]
}

export interface BanchouDef {
  id: string
  /** Full name in kanji */
  name: string
  /** Honorific title displayed before their name */
  title: string
  /** District index where this banchou resides */
  district: number
  description: string
  /** Recommended player level to challenge */
  lvl: number
  hp: number
  /** Move id unlocked after defeating this banchou */
  specialMoveUnlock: string
  /** Preferred menchi types in order of priority */
  menchiTypes: MenchiType[]
  fightingStyle: string
  dialogue: BanchouDialogue
  /** Stat modifiers relative to a baseline EntityData */
  statMods: {
    attackDamage: number
    defenseMultiplier: number
    moveSpeed: number
    aggroRange: number
    attackRange: number
  }
  /** Number of phases (1 = single phase, 2+ = rage mode at half HP) */
  phases: number
}

export const BANCHOU_TABLE: BanchouDef[] = [
  {
    id: 'banchou_goki',
    name: '豪木 勇二',
    title: '鉄拳の勇',
    district: 0,
    description:
      '北港区の元ボクシング部エース。ストレートとアッパーカットが必殺。単純だが力は本物。',
    lvl: 3,
    hp: 280,
    specialMoveUnlock: 'goki_uppercut',
    menchiTypes: ['OTOKO', 'NIRAMI'],
    fightingStyle: 'ボクシング — 直線的コンボ、高ダメージのアッパー',
    dialogue: {
      preFight: [
        '「北港に入ってきたのはてめえか。俺のシマに誰が入っても許さねえ」',
        '「拳で決めようぜ。ゴタクはいらねえ」',
      ],
      midFight: [
        '「まだ立てるのか……面白え！」',
      ],
      postFightWin: [
        '「……やるじゃねえか。俺の負けだ」',
        '「このアッパー、お前に預ける。使いこなしてみせろ」',
      ],
      postFightLose: [
        '「やっぱり俺の方が強かったな。出直して来い」',
      ],
    },
    statMods: {
      attackDamage: 20,
      defenseMultiplier: 1.0,
      moveSpeed: 2.8,
      aggroRange: 10,
      attackRange: 1.9,
    },
    phases: 1,
  },
  {
    id: 'banchou_hayami',
    name: '速水 風太',
    title: '疾風の風',
    district: 1,
    description:
      '学園区のスピードスター。50連撃コンボで相手を嵐のように翻弄する。止めることができるか？',
    lvl: 6,
    hp: 320,
    specialMoveUnlock: 'hayami_blitz_kick',
    menchiTypes: ['WAZA', 'KI'],
    fightingStyle: 'テコンドー — 高速キック多段コンボ、隙は小さいが一撃は軽い',
    dialogue: {
      preFight: [
        '「転校生？ 俺の動き、目で追えると思ってんの？」',
        '「五秒で終わらせてやる」',
      ],
      midFight: [
        '「もっと速く動けよ！ 退屈だぞ！」',
        '「ほら、ここだ——捕まえてみろ！」',
      ],
      postFightWin: [
        '「……追いつけたか。俺の全力に追いついたのは初めてだ」',
        '「このブリッツキック、お前には似合う。受け取れ」',
      ],
      postFightLose: [
        '「だから言ったろ。俺の速さは別次元だって」',
      ],
    },
    statMods: {
      attackDamage: 14,
      defenseMultiplier: 0.85,
      moveSpeed: 4.2,
      aggroRange: 14,
      attackRange: 2.0,
    },
    phases: 2,
  },
  {
    id: 'banchou_ushiyama',
    name: '牛山 猛',
    title: '猛牛の猛',
    district: 2,
    description:
      '商店街に居座る巨漢グラップラー。投げ技と締め技で敵を制圧。動きは遅いが、一度掴まれたら終わり。',
    lvl: 9,
    hp: 420,
    specialMoveUnlock: 'ushiyama_bull_slam',
    menchiTypes: ['OTOKO', 'NIRAMI', 'KI'],
    fightingStyle: 'レスリング/柔道 — 投げ中心、ガードブレイク能力あり',
    dialogue: {
      preFight: [
        '「ガキが。俺の体重、わかってんのか？ 百二十キロだぞ」',
        '「一回でも掴んだら……その時点で終わりだ」',
      ],
      midFight: [
        '「逃げるな！ 男なら真正面から来い！」',
      ],
      postFightWin: [
        '「くそ……お前、体当たりしかしてねえのに……」',
        '「このブルスラム、大事に使えよ。体ごとぶつかる技だ」',
      ],
      postFightLose: [
        '「やっぱりな。一回でも掴めばよかったんだ」',
      ],
    },
    statMods: {
      attackDamage: 26,
      defenseMultiplier: 1.3,
      moveSpeed: 2.0,
      aggroRange: 8,
      attackRange: 2.2,
    },
    phases: 1,
  },
  {
    id: 'banchou_kageyama',
    name: '影山 蛇一',
    title: '蛇眼の影',
    district: 3,
    description:
      '工場地帯の策士。フェイント・砂かけ・引き倒しなどダーティーな技を組み合わせ、読めない攻めで翻弄する。',
    lvl: 12,
    hp: 360,
    specialMoveUnlock: 'kageyama_serpent_eye',
    menchiTypes: ['REI', 'WAZA'],
    fightingStyle: '奇襲戦法 — 予測困難な行動パターン、ダーティトリックあり',
    dialogue: {
      preFight: [
        '「……ふふ。お前、俺の動きを読もうとしているな」',
        '「残念。俺に「次の手」なんてものはない。思いついた順にやるだけだ」',
      ],
      midFight: [
        '「どうした？ 迷っているな。それが一番危ない」',
        '「ここだ……いや、そっちじゃない」',
      ],
      postFightWin: [
        '「……面白い目をしている。蛇みたいだ」',
        '「蛇眼の技は、対象の「迷い」を食う。それを覚えておけ」',
      ],
      postFightLose: [
        '「フェイントが読まれた。初めての経験だ……悪くない」',
      ],
    },
    statMods: {
      attackDamage: 17,
      defenseMultiplier: 0.9,
      moveSpeed: 3.5,
      aggroRange: 12,
      attackRange: 1.8,
    },
    phases: 2,
  },
  {
    id: 'banchou_raido',
    name: '雷堂 轟',
    title: '雷神の轟',
    district: 4,
    description:
      '歓楽街を支配する荒神。重い体躯から放たれる電光石火の必殺技が恐怖の的。派手な戦闘スタイルで観衆を沸かせる。',
    lvl: 15,
    hp: 460,
    specialMoveUnlock: 'raido_thunderclap',
    menchiTypes: ['KI', 'OTOKO'],
    fightingStyle: '剛拳道 — 重コンボ＋必殺技多数、気合ゲージ消費大',
    dialogue: {
      preFight: [
        '「俺の名を聞いて震えたか？ 雷堂 轟。この街で一番派手な男だ」',
        '「派手に散れよ——観衆が見ている」',
      ],
      midFight: [
        '「まだ立っているのか！ いいぞ、もっと派手にやれ！」',
        '「雷神の怒りを喰らえ！！」',
      ],
      postFightWin: [
        '「……お前、地味な癖に一番派手な戦い方をするな」',
        '「サンダークラップ。俺の誇りだ。お前のものにしろ」',
      ],
      postFightLose: [
        '「この雷神を倒せる奴がいるとはな！ まだまだ修行が足りん！」',
      ],
    },
    statMods: {
      attackDamage: 28,
      defenseMultiplier: 1.1,
      moveSpeed: 2.6,
      aggroRange: 11,
      attackRange: 2.1,
    },
    phases: 2,
  },
  {
    id: 'banchou_iwasaki',
    name: '岩崎 不動丸',
    title: '不動の岩',
    district: 5,
    description:
      '山手区の鉄壁。圧倒的防御力で相手を削り倒す。ガードブレイクしなければダメージが通らない。',
    lvl: 18,
    hp: 600,
    specialMoveUnlock: 'iwasaki_iron_wall',
    menchiTypes: ['REI', 'KI', 'NIRAMI'],
    fightingStyle: '剛柔流空手 — 鉄壁の守りと重いカウンター、ガード特化',
    dialogue: {
      preFight: [
        '「……来い。俺はここを動かない」',
        '「お前の拳が俺に届くかどうか、見せてみろ」',
      ],
      midFight: [
        '「……その程度か」',
        '「ガードを破りたいなら、まずその気持ちを鍛えろ」',
      ],
      postFightWin: [
        '「……お前は本物だ。黒幕連合に気をつけろ。鬼塚は最初からお前を待っていた」',
        '「鉄壁の構えを教えよう。たとえ壁を破られても、立ち続けるための技だ」',
      ],
      postFightLose: [
        '「俺の壁は今日も破られなかった。また来い」',
      ],
    },
    statMods: {
      attackDamage: 24,
      defenseMultiplier: 1.8,
      moveSpeed: 1.8,
      aggroRange: 9,
      attackRange: 1.9,
    },
    phases: 1,
  },
  {
    id: 'banchou_onizuka',
    name: '鬼塚 覇王',
    title: '黒幕連合頭目',
    district: 6,
    description:
      '黒幕連合の総帥。七人の番長の戦術を完全に吸収した化け物。三段階変身で龍堂剛を追い詰める。',
    lvl: 20,
    hp: 900,
    specialMoveUnlock: 'onizuka_haou_cross',
    menchiTypes: ['OTOKO', 'KI', 'NIRAMI', 'REI', 'WAZA', 'WARAI'],
    fightingStyle: '万流合成 — 全スタイルを状況に応じて切り替え、三段階激化',
    dialogue: {
      preFight: [
        '「龍堂剛……ようやく来たか」',
        '「お前が七区の番長を倒して回るのを、ずっと待っていた。俺のために強くなってくれてありがとよ」',
        '「お前の男気——俺が奪ってやる」',
      ],
      midFight: [
        '「第一の型——終わりだ」',
        '「ほう……まだ立つか。では第二の型を見せてやろう」',
        '「……認めてやる。だが俺の最終形態を喰らってから死ね」',
      ],
      postFightWin: [
        '「……負けた。俺が……負けた」',
        '「鉄腸市は……お前に任せる。この街の番長は……龍堂 剛だ」',
      ],
      postFightLose: [
        '「やはりお前程度では俺には届かない。出直して来い」',
      ],
    },
    statMods: {
      attackDamage: 35,
      defenseMultiplier: 1.4,
      moveSpeed: 3.2,
      aggroRange: 20,
      attackRange: 2.4,
    },
    phases: 3,
  },
]

// ---------------------------------------------------------------------------
// Side quest definitions
// ---------------------------------------------------------------------------

export type SideQuestType = 'DELIVERY' | 'PROTECT' | 'FIND_ITEM'

export interface SideQuestReward {
  xp: number
  otokogi: number
  /** Move id unlocked on completion, if any */
  moveUnlock?: string
  /** Item name granted on completion, if any */
  itemName?: string
}

export interface SideQuestDef {
  id: string
  district: number
  type: SideQuestType
  title: string
  description: string
  /** The NPC who gives the quest */
  questGiver: string
  /** The NPC who receives/helps the quest */
  questTarget: string
  /** In-world objective description shown on HUD */
  objective: string
  /** Dialogue line from NPC when accepting */
  acceptDialogue: string
  /** Dialogue line from NPC when completing */
  completeDialogue: string
  reward: SideQuestReward
}

export const SIDE_QUESTS: SideQuestDef[] = [
  // -----------------------------------------------------------------------
  // 北港区 (District 0) — side quests
  // -----------------------------------------------------------------------
  {
    id: 'sq_kitako_ramen',
    district: 0,
    type: 'DELIVERY',
    title: '波止場のラーメン出前',
    description: '港のラーメン屋おやじが、波止場で働く荷役たちにラーメンを届けてほしいと頼んでくる。途中でチンピラに絡まれるので注意。',
    questGiver: 'ラーメン屋・山さん',
    questTarget: '荷役の親方・源さん',
    objective: '波止場のA倉庫前まで鍋ラーメンを届けろ',
    acceptDialogue: '「兄ちゃん、頼まれてくれないか。源さんのところに届けてやってくれ。途中の連中には気をつけろよ」',
    completeDialogue: '「おう！ 来たか！ 山さんのラーメンか、最高だな！ ありがとよ、兄ちゃん」',
    reward: { xp: 80, otokogi: 10, itemName: '特製ラーメン（回復アイテム）' },
  },
  {
    id: 'sq_kitako_protect',
    district: 0,
    type: 'PROTECT',
    title: '漁師の孫を守れ',
    description: '老漁師の孫がチンピラグループに囲まれている。子どもを守りながら漁師小屋まで送り届けろ。',
    questGiver: '老漁師・義一',
    questTarget: '孫・ケン',
    objective: 'ケンを囲んでいるチンピラ5人を倒し、漁師小屋まで護衛しろ',
    acceptDialogue: '「お願いだ、若いの。俺の孫が奴らに……どうか助けてやってくれ」',
    completeDialogue: '「よかった……本当にありがとうございます！ おじいちゃんの代わりに頭を下げます」',
    reward: { xp: 120, otokogi: 15, itemName: '漁師の鉢巻き（防御+5）' },
  },
  {
    id: 'sq_kitako_item',
    district: 0,
    type: 'FIND_ITEM',
    title: '落とした財布を探せ',
    description: '港の酔っ払いが大事な財布を落としたという。波止場のどこかに落ちているはずだ。',
    questGiver: '酔っ払い・トシ',
    questTarget: '波止場に落ちている財布',
    objective: '波止場エリアの財布を見つけてトシに返せ',
    acceptDialogue: '「うわあ……財布が……大事な家族写真が入ってるんだ。頼む、返してくれ……」',
    completeDialogue: '「あった！ これだ！ 良かった……ありがとう、本当にありがとう。男気があるなあ」',
    reward: { xp: 60, otokogi: 8 },
  },

  // -----------------------------------------------------------------------
  // 学園区 (District 1) — side quests
  // -----------------------------------------------------------------------
  {
    id: 'sq_gakuen_ramen',
    district: 1,
    type: 'DELIVERY',
    title: '購買のパン出前',
    description: '学校の購買のおばちゃんが、先生たちに注文されたパンを職員室まで届けてほしいと頼む。廊下の不良グループが邪魔をする。',
    questGiver: '購買のおばちゃん・ヨシコ',
    questTarget: '職員室の先生',
    objective: '不良グループを蹴散らして職員室にパンを届けろ',
    acceptDialogue: '「龍堂くん、頼まれてくれない？ 職員室に弁当持って行ってほしいんだけど、廊下がヤバくて……」',
    completeDialogue: '「おお、助かった！ さすが転校生、度胸があるねえ」',
    reward: { xp: 100, otokogi: 12, itemName: 'アンパン（回復アイテム）' },
  },
  {
    id: 'sq_gakuen_protect',
    district: 1,
    type: 'PROTECT',
    title: '後輩を守れ',
    description: '鉄腸高校の一年生が上級生グループにカツアゲされている。助けてやれ。',
    questGiver: '一年生・ユウスケ',
    questTarget: 'カツアゲ犯グループ（3人）',
    objective: 'ユウスケをカツアゲしている上級生3人を倒せ',
    acceptDialogue: '「……先輩、助けてください。お金を取られそうで……」',
    completeDialogue: '「あ、ありがとうございます！ 先輩みたいな人が鉄腸高校にいて良かったです！」',
    reward: { xp: 140, otokogi: 18, moveUnlock: 'komaki_chop' },
  },
  {
    id: 'sq_gakuen_item',
    district: 1,
    type: 'FIND_ITEM',
    title: '体育館に忘れたラケット',
    description: 'バドミントン部の女子が体育館にラケットを忘れてきた。別の不良グループが体育館を占拠しているので取り返してほしい。',
    questGiver: 'バドミントン部・サクラ',
    questTarget: '体育館に置き忘れたラケット',
    objective: '体育館の不良を追い払いラケットを回収してサクラに届けろ',
    acceptDialogue: '「大会前日なのに……お願いします、取ってきてもらえませんか？」',
    completeDialogue: '「ありがとうございます！ これがなかったら試合に出られなかった。頑張ります！」',
    reward: { xp: 90, otokogi: 11 },
  },

  // -----------------------------------------------------------------------
  // 商店街 (District 2) — side quests
  // -----------------------------------------------------------------------
  {
    id: 'sq_shoten_ramen',
    district: 2,
    type: 'DELIVERY',
    title: '商店街のラーメン配達',
    description: '老舗ラーメン屋が繁忙で手が足りない。商店街の奥にある老人ホームまでラーメンを届けてほしい。',
    questGiver: 'ラーメン屋・フクさん',
    questTarget: '老人ホームの管理人',
    objective: '商店街を抜けて老人ホームまでラーメンを届けろ',
    acceptDialogue: '「いやあ困った。手が足りなくてな。老人ホームへの配達、頼めるか？」',
    completeDialogue: '「こんにちは！ お昼ご飯届いたよ！ みんな待ってたよ、ありがとう！」',
    reward: { xp: 110, otokogi: 14, itemName: '老舗チャーシュー（回復+20）' },
  },
  {
    id: 'sq_shoten_protect',
    district: 2,
    type: 'PROTECT',
    title: '商店街の平和を守れ',
    description: '近隣グループが商店街で荒らし行為をしている。商店主たちが困っている。グループを追い払え。',
    questGiver: '商店組合長・タケシ',
    questTarget: '荒らしグループ（5人）',
    objective: '商店街を荒らす5人組を撃退せよ',
    acceptDialogue: '「お願いだ、若いの。あいつらのせいで商売あがったりだ。追い払ってくれ！」',
    completeDialogue: '「おかげで商店街が平和になった！ 困ったことがあったらまた来てくれ」',
    reward: { xp: 160, otokogi: 20, itemName: '商店街特製ハチマキ（攻撃+8）' },
  },
  {
    id: 'sq_shoten_item',
    district: 2,
    type: 'FIND_ITEM',
    title: '迷子の看板犬を探せ',
    description: '商店街のマスコット犬・コタローが迷子になった。商店街のどこかを探せ。',
    questGiver: '金物屋のオヤジ・キチ',
    questTarget: '迷子のコタロー',
    objective: 'コタローを見つけて金物屋まで連れ帰れ',
    acceptDialogue: '「コタローが……いなくなっちまった。商店街中を探したんだが……頼む」',
    completeDialogue: '「コタロー！ よかった……ありがとう、本当にありがとう。あいつはここの宝なんだ」',
    reward: { xp: 70, otokogi: 9 },
  },

  // -----------------------------------------------------------------------
  // 工場地帯 (District 3) — side quests
  // -----------------------------------------------------------------------
  {
    id: 'sq_koujo_ramen',
    district: 3,
    type: 'DELIVERY',
    title: '工員へのお弁当配達',
    description: '工場の食堂が火事で使えなくなった。近くの食堂のおばちゃんから工員たちへ弁当を届けてくれ。',
    questGiver: '食堂のおばちゃん・ハナ',
    questTarget: '工場の班長・マサオ',
    objective: '廃工場エリアを通って工員たちに弁当を届けろ',
    acceptDialogue: '「兄ちゃん、体格がいいな。あの廃工場の奥にいる連中のところまで弁当持って行ってくれないか？」',
    completeDialogue: '「おお！ 来た来た！ 腹減ってたんだよ！ ありがとな、助かった！」',
    reward: { xp: 130, otokogi: 16, itemName: '手作り弁当（HP全回復）' },
  },
  {
    id: 'sq_koujo_protect',
    district: 3,
    type: 'PROTECT',
    title: '廃工場の夜回り',
    description: '廃工場を根城にする不良集団が近所の子どもたちを危険にさらしている。子どもたちが安全に帰れるよう護衛しろ。',
    questGiver: '地域のお母さん・アキコ',
    questTarget: '子どもたちのグループ（3人）',
    objective: '子どもたち3人を廃工場エリアから安全な場所まで護衛しろ',
    acceptDialogue: '「息子が帰ってこなくて……廃工場の近くで遊んでいたみたいで……」',
    completeDialogue: '「おかあさーん！ この人が助けてくれた！」「……本当にありがとうございました」',
    reward: { xp: 170, otokogi: 22, moveUnlock: 'factory_stomp' },
  },
  {
    id: 'sq_koujo_item',
    district: 3,
    type: 'FIND_ITEM',
    title: '工具箱を取り返せ',
    description: '老整備士の大切な工具箱が不良グループに盗まれた。廃工場のどこかに隠されているはずだ。',
    questGiver: '老整備士・ゴロウ',
    questTarget: '盗まれた工具箱',
    objective: '工具箱を見つけてゴロウに返せ',
    acceptDialogue: '「三十年使ってきた工具箱を……奴らに取られちまった。頼む、返してくれ」',
    completeDialogue: '「これだ……これが俺の工具箱だ。ありがとう。この工具箱がありゃ、また立てる」',
    reward: { xp: 95, otokogi: 12, itemName: '職人のスパナ（投げ武器）' },
  },

  // -----------------------------------------------------------------------
  // 歓楽街 (District 4) — side quests
  // -----------------------------------------------------------------------
  {
    id: 'sq_kanraku_ramen',
    district: 4,
    type: 'DELIVERY',
    title: '深夜のラーメン出前',
    description: '深夜営業のラーメン屋が、歓楽街の奥でトラブルに巻き込まれたホステスに夜食を届けてほしいと頼む。',
    questGiver: '深夜ラーメン屋・シロ',
    questTarget: 'ホステス・ミコ',
    objective: '歓楽街の奥にあるビルの三階までラーメンを届けろ',
    acceptDialogue: '「ミコちゃんに届けてくれ。あそこの一帯はヤバいが……お前なら平気だろ」',
    completeDialogue: '「来てくれたんですね！ ありがとう……外に出られなくて困ってたんです。美味しそう！」',
    reward: { xp: 150, otokogi: 19, itemName: '特製塩ラーメン（攻撃力一時+15%）' },
  },
  {
    id: 'sq_kanraku_protect',
    district: 4,
    type: 'PROTECT',
    title: '夜の街の用心棒',
    description: '年老いた占い師が客から難癖をつけられてトラブルになっている。守ってやれ。',
    questGiver: '占い師・カオル',
    questTarget: '絡んでいる酔客グループ（4人）',
    objective: '占い師カオルに絡む酔っ払い4人を追い払え',
    acceptDialogue: '「……あなたが助けてくれるのが見えていました。お願いします」',
    completeDialogue: '「ありがとう。お礼に占いを……あなたの未来、とても大きなものが見えます」',
    reward: { xp: 180, otokogi: 23, itemName: '御守り（被ダメージ-10%、永続）' },
  },
  {
    id: 'sq_kanraku_item',
    district: 4,
    type: 'FIND_ITEM',
    title: '質屋に盗まれた形見の時計',
    description: '悪徳質屋が老人から強引に取り上げた形見の時計を取り返してほしい。質屋の裏の倉庫に隠されている。',
    questGiver: '老紳士・ジロウ',
    questTarget: '倉庫に隠された形見の時計',
    objective: '質屋の裏倉庫から形見の時計を見つけてジロウに返せ',
    acceptDialogue: '「息子の形見なんです……あんな奴に渡したくなかったのに……どうか取り返してください」',
    completeDialogue: '「これが……これが息子の……ありがとう。あなたは本当の男です」',
    reward: { xp: 100, otokogi: 13, itemName: '古い懐中時計（装備品、運+10）' },
  },

  // -----------------------------------------------------------------------
  // 山手区 (District 5) — side quests
  // -----------------------------------------------------------------------
  {
    id: 'sq_yamate_ramen',
    district: 5,
    type: 'DELIVERY',
    title: '丘の上の料亭出前',
    description: '山手区の高級料亭が、引きこもりの元銀行員に料理を届けてほしいと頼む。屋敷周辺に警備役の不良がいる。',
    questGiver: '料亭の女将・ツル',
    questTarget: '元銀行員・シュイチ',
    objective: '屋敷の門番を退けて料亭の料理を届けろ',
    acceptDialogue: '「シュイチさんは外に出られなくてね。どうか届けてもらえませんか、お若いの」',
    completeDialogue: '「……来てくれたのか。久しぶりに外の空気を感じた気がする。ありがとう」',
    reward: { xp: 200, otokogi: 25, itemName: '上等な弁当箱（永続HP+20）' },
  },
  {
    id: 'sq_yamate_protect',
    district: 5,
    type: 'PROTECT',
    title: '山手区の密告者を守れ',
    description: '黒幕連合の内部情報を持つ人物が命を狙われている。連合の刺客から守れ。',
    questGiver: '謎の男・ナカジマ',
    questTarget: '黒幕連合の刺客（6人）',
    objective: 'ナカジマを狙う刺客6人を全員倒せ',
    acceptDialogue: '「……俺は喋るつもりはなかった。でも、もうこの街が限界だ。頼む、守ってくれ」',
    completeDialogue: '「……黒幕連合の拠点は決戦地にある。鬼塚覇王が待っている。行け」',
    reward: { xp: 250, otokogi: 30, moveUnlock: 'yamate_counter' },
  },
  {
    id: 'sq_yamate_item',
    district: 5,
    type: 'FIND_ITEM',
    title: '盗まれた芸術品を取り戻せ',
    description: '山手区の画家が大切な作品を盗まれた。黒幕連合の構成員が持ち去ったと言う。',
    questGiver: '老画家・リュウスケ',
    questTarget: '盗まれた絵画',
    objective: '連合アジトを捜索して絵画を見つけ画家に返せ',
    acceptDialogue: '「あの絵は……俺の人生そのものだ。取り返してくれ。頼む」',
    completeDialogue: '「……ありがとう。この絵がある限り、俺はまだ描ける。お前に見せたいものがある——」',
    reward: { xp: 120, otokogi: 15, itemName: '画家のベレー帽（精神力+5）' },
  },

  // -----------------------------------------------------------------------
  // 決戦地 (District 6) — side quests
  // -----------------------------------------------------------------------
  {
    id: 'sq_kessen_ramen',
    district: 6,
    type: 'DELIVERY',
    title: '決戦前の差し入れ',
    description: '鉄腸市全土で最終決戦の噂が広まっている。屋台のおばちゃんが応援のおにぎりを届けてほしいという。',
    questGiver: '屋台のおばちゃん・オミツ',
    questTarget: '龍堂剛の応援団たち',
    objective: '決戦地入口に集まった応援団におにぎりを届けろ',
    acceptDialogue: '「頑張ってくれよ！ これ持っていって、みんなに配っておくれ！」',
    completeDialogue: '「龍堂さん！ みんな応援してます！ 絶対に勝ってください！」',
    reward: { xp: 100, otokogi: 12, itemName: '特製おにぎり×3（HP全回復×3）' },
  },
  {
    id: 'sq_kessen_protect',
    district: 6,
    type: 'PROTECT',
    title: '最後の護衛',
    description: '最終決戦に乱入しようとする黒幕連合の残党から、倒してきた番長の仲間たちを守れ。',
    questGiver: '豪木勇二（元番長）',
    questTarget: '黒幕連合の残党（8人）',
    objective: '残党8人を全員倒して番長仲間たちを守れ',
    acceptDialogue: '「……お前が俺たちの番長だ。だから今度は俺たちが守る番だ。……いや、一緒に戦わせてくれ」',
    completeDialogue: '「やったぞ！ 行け、龍堂！ 俺たちはここを守る！」',
    reward: { xp: 300, otokogi: 35, moveUnlock: 'seven_fists_combo' },
  },
  {
    id: 'sq_kessen_item',
    district: 6,
    type: 'FIND_ITEM',
    title: '男気の証明書',
    description: '七人の番長それぞれのサインが入った「男気の証明書」が決戦地のどこかに隠されている。見つけ出せ。',
    questGiver: '速水風太（元番長）',
    questTarget: '男気の証明書',
    objective: '決戦地のフィールド内で証明書を見つけろ',
    acceptDialogue: '「俺たち七人が連名で書いたやつ。お前に渡そうと思ってたんだ。どこかに置いちまったけど……」',
    completeDialogue: '「それだよ！ ……龍堂剛に捧ぐ、俺たち全員の男気。受け取ってくれ」',
    reward: { xp: 150, otokogi: 50, itemName: '男気の証明書（エンディング解放アイテム）' },
  },
]

// ---------------------------------------------------------------------------
// Convenience lookup helpers
// ---------------------------------------------------------------------------

/** Look up a district by its numeric id */
export function getDistrict(id: number): DistrictDef | undefined {
  return DISTRICTS.find(d => d.id === id)
}

/** Look up a banchou by its string id */
export function getBanchou(id: string): BanchouDef | undefined {
  return BANCHOU_TABLE.find(b => b.id === id)
}

/** Get all banchou for a given district */
export function getBanchouByDistrict(districtId: number): BanchouDef[] {
  return BANCHOU_TABLE.filter(b => b.district === districtId)
}

/** Get all side quests for a given district */
export function getSideQuestsByDistrict(districtId: number): SideQuestDef[] {
  return SIDE_QUESTS.filter(q => q.district === districtId)
}
