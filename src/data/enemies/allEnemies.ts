import type { EntityData, MenchiType, Vec3 } from '@/types'

export interface EnemyDef {
  id: string
  name: string
  title: string
  type: 'GRUNT' | 'THUG' | 'DELINQUENT' | 'YANKEE' | 'SUBBANCHOU' | 'BANCHOU' | 'BOSS'
  district: number
  maxHp: number
  attackDamage: number
  aggroRange: number
  attackRange: number
  moveSpeed: number
  menchiTypes: MenchiType[]
  xpReward: number
  otokogiReward: number
  spawnWeight: number
  bodyColor: string
  isBoss: boolean
  specialMoveUnlock?: string
  dialogue: { pre: string; post: string }
}

// ─── District 0: 北港区 (Kita-ko-ku, harbor) ──────────────────────────────

const chimp_0: EnemyDef = {
  id: 'chimp_0',
  name: 'チンピラA',
  title: '港のゴロツキ',
  type: 'GRUNT',
  district: 0,
  maxHp: 50,
  attackDamage: 7,
  aggroRange: 7,
  attackRange: 1.7,
  moveSpeed: 2.5,
  menchiTypes: ['NIRAMI', 'OTOKO'],
  xpReward: 30,
  otokogiReward: 3,
  spawnWeight: 10,
  bodyColor: '#5a5a5a',
  isBoss: false,
  dialogue: {
    pre: 'あ？なんか用か？',
    post: 'くそっ……覚えてろよ……',
  },
}

const longshoreman: EnemyDef = {
  id: 'longshoreman',
  name: '波止場野郎',
  title: '荷役の鉄人',
  type: 'THUG',
  district: 0,
  maxHp: 65,
  attackDamage: 10,
  aggroRange: 8,
  attackRange: 1.9,
  moveSpeed: 2.2,
  menchiTypes: ['NIRAMI', 'WAZA'],
  xpReward: 50,
  otokogiReward: 5,
  spawnWeight: 8,
  bodyColor: '#4a3820',
  isBoss: false,
  dialogue: {
    pre: '荷物扱いしてやるぜ！',
    post: 'うわっ、こんな奴がいるなんて……',
  },
}

const dockfighter: EnemyDef = {
  id: 'dockfighter',
  name: '港のケンカ師',
  title: '波間の暴れ者',
  type: 'DELINQUENT',
  district: 0,
  maxHp: 80,
  attackDamage: 12,
  aggroRange: 9,
  attackRange: 2.0,
  moveSpeed: 2.8,
  menchiTypes: ['NIRAMI', 'OTOKO', 'KI'],
  xpReward: 70,
  otokogiReward: 7,
  spawnWeight: 6,
  bodyColor: '#3d5a6e',
  isBoss: false,
  dialogue: {
    pre: '港で一番強いのは俺だ！',
    post: 'まじかよ……やっぱ俺じゃなかったか……',
  },
}

const rust_gang: EnemyDef = {
  id: 'rust_gang',
  name: '錆びたナイフ組',
  title: '廃倉庫の番犬',
  type: 'YANKEE',
  district: 0,
  maxHp: 95,
  attackDamage: 14,
  aggroRange: 10,
  attackRange: 2.1,
  moveSpeed: 3.0,
  menchiTypes: ['NIRAMI', 'WAZA', 'KI'],
  xpReward: 90,
  otokogiReward: 9,
  spawnWeight: 5,
  bodyColor: '#6b3a2a',
  isBoss: false,
  dialogue: {
    pre: 'この倉庫に近づくな！',
    post: 'なんで……錆びたナイフが……負けるんだ……',
  },
}

const harbor_subboss1: EnemyDef = {
  id: 'harbor_subboss1',
  name: '荒波の浩',
  title: '港区小番長',
  type: 'SUBBANCHOU',
  district: 0,
  maxHp: 120,
  attackDamage: 16,
  aggroRange: 11,
  attackRange: 2.2,
  moveSpeed: 3.1,
  menchiTypes: ['NIRAMI', 'OTOKO', 'WAZA'],
  xpReward: 150,
  otokogiReward: 15,
  spawnWeight: 2,
  bodyColor: '#1a3a5c',
  isBoss: false,
  dialogue: {
    pre: 'このあたりは俺の縄張りだ。素直に去れ。',
    post: 'くっ……豪木さんに知られたら……',
  },
}

const goki_yuji: EnemyDef = {
  id: 'goki_yuji',
  name: '豪木 勇二',
  title: '鉄拳の勇',
  type: 'BANCHOU',
  district: 0,
  maxHp: 200,
  attackDamage: 22,
  aggroRange: 14,
  attackRange: 2.3,
  moveSpeed: 3.2,
  menchiTypes: ['OTOKO', 'WAZA', 'KI', 'REI'],
  xpReward: 400,
  otokogiReward: 40,
  spawnWeight: 1,
  bodyColor: '#8B0000',
  isBoss: true,
  specialMoveUnlock: 'tatsumaki_upper',
  dialogue: {
    pre: '港の制覇を目指す者よ。俺の鉄拳を受け止めてみろ。',
    post: '……その力、本物だ。この港は任せた。',
  },
}

// ─── District 1: 学園区 (Gakuen-ku, school) ──────────────────────────────

const schoolrival: EnemyDef = {
  id: 'schoolrival',
  name: '学校のライバル',
  title: '廊下のお山の大将',
  type: 'GRUNT',
  district: 1,
  maxHp: 55,
  attackDamage: 8,
  aggroRange: 7,
  attackRange: 1.7,
  moveSpeed: 2.6,
  menchiTypes: ['NIRAMI', 'WARAI'],
  xpReward: 35,
  otokogiReward: 4,
  spawnWeight: 10,
  bodyColor: '#2e5e2e',
  isBoss: false,
  dialogue: {
    pre: 'お前が転校生か？調子に乗るな！',
    post: 'う……なんで転校生に負けるんだ……',
  },
}

const yankee_student: EnemyDef = {
  id: 'yankee_student',
  name: 'ヤンキー生徒',
  title: '不良番長候補生',
  type: 'THUG',
  district: 1,
  maxHp: 70,
  attackDamage: 11,
  aggroRange: 8,
  attackRange: 1.8,
  moveSpeed: 2.7,
  menchiTypes: ['NIRAMI', 'OTOKO'],
  xpReward: 55,
  otokogiReward: 6,
  spawnWeight: 9,
  bodyColor: '#3a3a1a',
  isBoss: false,
  dialogue: {
    pre: 'いつか番長になってやる！まず貴様から倒す！',
    post: '道のりは長いな……',
  },
}

const judo_club: EnemyDef = {
  id: 'judo_club',
  name: '柔道部の猛者',
  title: '畳の番人',
  type: 'DELINQUENT',
  district: 1,
  maxHp: 90,
  attackDamage: 13,
  aggroRange: 8,
  attackRange: 1.6,
  moveSpeed: 2.4,
  menchiTypes: ['WAZA', 'OTOKO', 'REI'],
  xpReward: 75,
  otokogiReward: 8,
  spawnWeight: 6,
  bodyColor: '#4a2a0a',
  isBoss: false,
  dialogue: {
    pre: '柔道の技の前では無駄な力は通じない！',
    post: 'なんと……柔道を超える力があるとは……',
  },
}

const rooftop_king: EnemyDef = {
  id: 'rooftop_king',
  name: '屋上の王者',
  title: '制服ケンカ鬼',
  type: 'YANKEE',
  district: 1,
  maxHp: 100,
  attackDamage: 15,
  aggroRange: 10,
  attackRange: 2.0,
  moveSpeed: 2.9,
  menchiTypes: ['NIRAMI', 'OTOKO', 'WAZA'],
  xpReward: 95,
  otokogiReward: 10,
  spawnWeight: 5,
  bodyColor: '#1a4a1a',
  isBoss: false,
  dialogue: {
    pre: 'この屋上は俺の領地だ！降りてくれれば見逃してやる！',
    post: '俺の……俺の屋上が……',
  },
}

const kendo_enforcer: EnemyDef = {
  id: 'kendo_enforcer',
  name: '剣道部の執行者',
  title: '木刀の裁き人',
  type: 'SUBBANCHOU',
  district: 1,
  maxHp: 130,
  attackDamage: 18,
  aggroRange: 11,
  attackRange: 2.4,
  moveSpeed: 3.2,
  menchiTypes: ['WAZA', 'KI', 'OTOKO'],
  xpReward: 160,
  otokogiReward: 16,
  spawnWeight: 2,
  bodyColor: '#2a1a4a',
  isBoss: false,
  dialogue: {
    pre: '速水さんの命令で来た。おとなしく引き返せ。',
    post: '速水さん……すみません……',
  },
}

const hayami_futa: EnemyDef = {
  id: 'hayami_futa',
  name: '速水 風太',
  title: '疾風の風',
  type: 'BANCHOU',
  district: 1,
  maxHp: 220,
  attackDamage: 24,
  aggroRange: 14,
  attackRange: 2.2,
  moveSpeed: 4.0,
  menchiTypes: ['NIRAMI', 'OTOKO', 'KI', 'WAZA'],
  xpReward: 450,
  otokogiReward: 45,
  spawnWeight: 1,
  bodyColor: '#006400',
  isBoss: true,
  specialMoveUnlock: 'bakuretsu_rush',
  dialogue: {
    pre: '俺の速さに追いつける者はいない。証明してみろ。',
    post: 'そうか……疾風より速い男がいたか。学園は守ってくれ。',
  },
}

// ─── District 2: 商店街区 (Shoutengai-ku, shopping district) ──────────────

const market_punk: EnemyDef = {
  id: 'market_punk',
  name: '商店街のチンピラ',
  title: 'シャッター通りの幽霊',
  type: 'GRUNT',
  district: 2,
  maxHp: 60,
  attackDamage: 9,
  aggroRange: 7,
  attackRange: 1.7,
  moveSpeed: 2.6,
  menchiTypes: ['NIRAMI', 'WARAI'],
  xpReward: 40,
  otokogiReward: 4,
  spawnWeight: 10,
  bodyColor: '#7a5a2a',
  isBoss: false,
  dialogue: {
    pre: 'この商店街で喧嘩売るとはいい度胸だ！',
    post: '商売あがったりだぜ……',
  },
}

const takoyaki_fighter: EnemyDef = {
  id: 'takoyaki_fighter',
  name: 'たこ焼き屋台の男',
  title: 'ソースの鉄拳',
  type: 'THUG',
  district: 2,
  maxHp: 75,
  attackDamage: 12,
  aggroRange: 8,
  attackRange: 1.8,
  moveSpeed: 2.5,
  menchiTypes: ['NIRAMI', 'WAZA'],
  xpReward: 60,
  otokogiReward: 6,
  spawnWeight: 8,
  bodyColor: '#8b4513',
  isBoss: false,
  dialogue: {
    pre: 'たこ焼きの邪魔をすると承知しないぞ！',
    post: 'たこ焼きが……冷めてしまう……',
  },
}

const arcade_boss_kid: EnemyDef = {
  id: 'arcade_boss_kid',
  name: 'ゲーセンの顔役',
  title: 'コイン王',
  type: 'DELINQUENT',
  district: 2,
  maxHp: 95,
  attackDamage: 14,
  aggroRange: 9,
  attackRange: 2.0,
  moveSpeed: 2.9,
  menchiTypes: ['WARAI', 'NIRAMI', 'OTOKO'],
  xpReward: 80,
  otokogiReward: 8,
  spawnWeight: 7,
  bodyColor: '#2a2a6a',
  isBoss: false,
  dialogue: {
    pre: 'ゲーセンのハイスコアを崩しに来たのか？',
    post: 'ゲームオーバー……リアルでもかよ……',
  },
}

const pachinko_enforcer: EnemyDef = {
  id: 'pachinko_enforcer',
  name: 'パチンコ屋の用心棒',
  title: '玉の雨男',
  type: 'YANKEE',
  district: 2,
  maxHp: 110,
  attackDamage: 16,
  aggroRange: 10,
  attackRange: 2.1,
  moveSpeed: 2.8,
  menchiTypes: ['NIRAMI', 'WAZA', 'KI'],
  xpReward: 100,
  otokogiReward: 10,
  spawnWeight: 5,
  bodyColor: '#5a1a5a',
  isBoss: false,
  dialogue: {
    pre: '店の邪魔をするなら力ずくで排除する！',
    post: '大当たりしなかったな……',
  },
}

const street_subboss2: EnemyDef = {
  id: 'street_subboss2',
  name: '路地の龍一',
  title: '商店街小番長',
  type: 'SUBBANCHOU',
  district: 2,
  maxHp: 140,
  attackDamage: 20,
  aggroRange: 11,
  attackRange: 2.2,
  moveSpeed: 3.2,
  menchiTypes: ['NIRAMI', 'OTOKO', 'WAZA', 'KI'],
  xpReward: 170,
  otokogiReward: 17,
  spawnWeight: 2,
  bodyColor: '#4a0a0a',
  isBoss: false,
  dialogue: {
    pre: '商店街の顔役に挑戦するとは無謀だ。',
    post: '猛虎さんに……負けを伝えるのが辛い……',
  },
}

const mouko_tetsu: EnemyDef = {
  id: 'mouko_tetsu',
  name: '猛虎 鉄',
  title: '猛虎の鉄槌',
  type: 'BANCHOU',
  district: 2,
  maxHp: 240,
  attackDamage: 26,
  aggroRange: 14,
  attackRange: 2.4,
  moveSpeed: 3.3,
  menchiTypes: ['OTOKO', 'WAZA', 'KI', 'NIRAMI'],
  xpReward: 490,
  otokogiReward: 49,
  spawnWeight: 1,
  bodyColor: '#FF4500',
  isBoss: true,
  specialMoveUnlock: 'mouko_hammer',
  dialogue: {
    pre: '商店街は俺が守る。よそ者は立ち去れ。',
    post: 'お前の漢気……認めた。商店街を頼む。',
  },
}

// ─── District 3: 工業区 (Kougyou-ku, industrial zone) ──────────────────────

const factory_worker: EnemyDef = {
  id: 'factory_worker',
  name: '工場の番人',
  title: '鉄骨野郎',
  type: 'GRUNT',
  district: 3,
  maxHp: 70,
  attackDamage: 11,
  aggroRange: 8,
  attackRange: 1.8,
  moveSpeed: 2.4,
  menchiTypes: ['NIRAMI', 'WAZA'],
  xpReward: 50,
  otokogiReward: 5,
  spawnWeight: 10,
  bodyColor: '#5a4a2a',
  isBoss: false,
  dialogue: {
    pre: '工場に不法侵入か？お前の骨を折ってやる！',
    post: 'ラインが止まってしまう……',
  },
}

const biker_thug: EnemyDef = {
  id: 'biker_thug',
  name: '暴走族の一員',
  title: '爆音の使者',
  type: 'THUG',
  district: 3,
  maxHp: 85,
  attackDamage: 13,
  aggroRange: 9,
  attackRange: 1.9,
  moveSpeed: 3.0,
  menchiTypes: ['NIRAMI', 'OTOKO', 'KI'],
  xpReward: 65,
  otokogiReward: 7,
  spawnWeight: 8,
  bodyColor: '#1a1a1a',
  isBoss: false,
  dialogue: {
    pre: 'ここは俺たちのツーリングコースだ！邪魔すんな！',
    post: 'エンジンが……泣いてる……',
  },
}

const welder_yankee: EnemyDef = {
  id: 'welder_yankee',
  name: '溶接工のヤンキー',
  title: '火花散らす男',
  type: 'DELINQUENT',
  district: 3,
  maxHp: 100,
  attackDamage: 15,
  aggroRange: 9,
  attackRange: 2.0,
  moveSpeed: 2.6,
  menchiTypes: ['WAZA', 'KI', 'OTOKO'],
  xpReward: 85,
  otokogiReward: 9,
  spawnWeight: 6,
  bodyColor: '#6a3a0a',
  isBoss: false,
  dialogue: {
    pre: '鉄を溶かす熱と俺の拳、どちらが熱いか試してみろ！',
    post: '火花が……散った……',
  },
}

const scrapyard_king: EnemyDef = {
  id: 'scrapyard_king',
  name: '廃車場の王',
  title: 'スクラップの帝王',
  type: 'YANKEE',
  district: 3,
  maxHp: 120,
  attackDamage: 18,
  aggroRange: 10,
  attackRange: 2.1,
  moveSpeed: 2.7,
  menchiTypes: ['NIRAMI', 'WAZA', 'OTOKO'],
  xpReward: 110,
  otokogiReward: 11,
  spawnWeight: 5,
  bodyColor: '#3a3a3a',
  isBoss: false,
  dialogue: {
    pre: 'この廃車場で俺に勝てる奴はいない！',
    post: 'スクラップにされちまった……',
  },
}

const chimney_subboss: EnemyDef = {
  id: 'chimney_subboss',
  name: '煙突の仁',
  title: '工業区小番長',
  type: 'SUBBANCHOU',
  district: 3,
  maxHp: 155,
  attackDamage: 22,
  aggroRange: 12,
  attackRange: 2.3,
  moveSpeed: 3.1,
  menchiTypes: ['OTOKO', 'WAZA', 'KI', 'NIRAMI'],
  xpReward: 185,
  otokogiReward: 19,
  spawnWeight: 2,
  bodyColor: '#4a2a0a',
  isBoss: false,
  dialogue: {
    pre: '工業区の煙突の下で散れ。',
    post: '鋼の意志さんに顔向けできない……',
  },
}

const hagane_isao: EnemyDef = {
  id: 'hagane_isao',
  name: '鋼 勇夫',
  title: '鋼鉄の意志',
  type: 'BANCHOU',
  district: 3,
  maxHp: 260,
  attackDamage: 28,
  aggroRange: 14,
  attackRange: 2.5,
  moveSpeed: 3.1,
  menchiTypes: ['OTOKO', 'KI', 'WAZA', 'NIRAMI', 'REI'],
  xpReward: 530,
  otokogiReward: 53,
  spawnWeight: 1,
  bodyColor: '#708090',
  isBoss: true,
  specialMoveUnlock: 'hagane_crush',
  dialogue: {
    pre: '鋼の意志で工業区を守ってきた。お前の漢気を測る。',
    post: '……鋼も折れる時がある。工業区、任せる。',
  },
}

// ─── District 4: 歓楽街区 (Kanrakugai-ku, entertainment district) ──────────

const host_punk: EnemyDef = {
  id: 'host_punk',
  name: 'ホストのチンピラ',
  title: '夜の道化師',
  type: 'GRUNT',
  district: 4,
  maxHp: 75,
  attackDamage: 12,
  aggroRange: 8,
  attackRange: 1.8,
  moveSpeed: 2.8,
  menchiTypes: ['WARAI', 'NIRAMI'],
  xpReward: 55,
  otokogiReward: 6,
  spawnWeight: 10,
  bodyColor: '#6a1a4a',
  isBoss: false,
  dialogue: {
    pre: 'ナンバーワンのホストに喧嘩売るとはな！',
    post: 'アフターが……なくなった……',
  },
}

const bouncer_thug: EnemyDef = {
  id: 'bouncer_thug',
  name: 'クラブのバウンサー',
  title: '鋼の扉番',
  type: 'THUG',
  district: 4,
  maxHp: 100,
  attackDamage: 15,
  aggroRange: 9,
  attackRange: 1.9,
  moveSpeed: 2.5,
  menchiTypes: ['NIRAMI', 'OTOKO', 'WAZA'],
  xpReward: 80,
  otokogiReward: 8,
  spawnWeight: 8,
  bodyColor: '#1a1a4a',
  isBoss: false,
  dialogue: {
    pre: 'ここから先は通さない！',
    post: '入場規制……失敗した……',
  },
}

const yakuza_junior: EnemyDef = {
  id: 'yakuza_junior',
  name: 'ヤクザの若衆',
  title: '任侠の卵',
  type: 'DELINQUENT',
  district: 4,
  maxHp: 115,
  attackDamage: 17,
  aggroRange: 10,
  attackRange: 2.0,
  moveSpeed: 2.9,
  menchiTypes: ['NIRAMI', 'OTOKO', 'REI'],
  xpReward: 100,
  otokogiReward: 10,
  spawnWeight: 6,
  bodyColor: '#0a2a0a',
  isBoss: false,
  dialogue: {
    pre: 'お組の縄張りに踏み込んだのは覚悟の上か？',
    post: 'まだ修行が足りなかった……',
  },
}

const neon_yankee: EnemyDef = {
  id: 'neon_yankee',
  name: 'ネオンのヤンキー',
  title: '光の中の猛者',
  type: 'YANKEE',
  district: 4,
  maxHp: 130,
  attackDamage: 19,
  aggroRange: 10,
  attackRange: 2.1,
  moveSpeed: 3.1,
  menchiTypes: ['NIRAMI', 'WARAI', 'OTOKO', 'KI'],
  xpReward: 120,
  otokogiReward: 12,
  spawnWeight: 5,
  bodyColor: '#4a004a',
  isBoss: false,
  dialogue: {
    pre: 'ネオンの輝きの下で俺に挑むか！',
    post: 'ネオンが……消えちまった気分だ……',
  },
}

const velvet_subboss: EnemyDef = {
  id: 'velvet_subboss',
  name: '夜桜の昇',
  title: '歓楽街小番長',
  type: 'SUBBANCHOU',
  district: 4,
  maxHp: 170,
  attackDamage: 24,
  aggroRange: 12,
  attackRange: 2.2,
  moveSpeed: 3.3,
  menchiTypes: ['NIRAMI', 'OTOKO', 'KI', 'WAZA'],
  xpReward: 200,
  otokogiReward: 20,
  spawnWeight: 2,
  bodyColor: '#5a0a3a',
  isBoss: false,
  dialogue: {
    pre: '夜桜の昇の名を汚す気か。',
    post: '嵐の海道さんに……報告できない……',
  },
}

const arashi_kaidou: EnemyDef = {
  id: 'arashi_kaidou',
  name: '嵐 海道',
  title: '嵐を呼ぶ男',
  type: 'BANCHOU',
  district: 4,
  maxHp: 280,
  attackDamage: 30,
  aggroRange: 15,
  attackRange: 2.4,
  moveSpeed: 3.5,
  menchiTypes: ['OTOKO', 'KI', 'NIRAMI', 'WAZA', 'REI'],
  xpReward: 570,
  otokogiReward: 57,
  spawnWeight: 1,
  bodyColor: '#800080',
  isBoss: true,
  specialMoveUnlock: 'arashi_gale',
  dialogue: {
    pre: '歓楽街の嵐——俺の前に立ちふさがるとは。試してやる。',
    post: '嵐も晴れる時がある。この街はお前に任せた。',
  },
}

// ─── District 5: 山ノ手区 (Yamanote-ku, upscale residential) ──────────────

const prep_bully: EnemyDef = {
  id: 'prep_bully',
  name: '坊ちゃんケンカ師',
  title: 'お坊ちゃまの拳',
  type: 'GRUNT',
  district: 5,
  maxHp: 80,
  attackDamage: 13,
  aggroRange: 8,
  attackRange: 1.8,
  moveSpeed: 2.7,
  menchiTypes: ['WARAI', 'NIRAMI', 'REI'],
  xpReward: 60,
  otokogiReward: 6,
  spawnWeight: 10,
  bodyColor: '#2a4a2a',
  isBoss: false,
  dialogue: {
    pre: '庶民が私の地区に入るとは失礼千万！',
    post: 'お父様に見せられない顔だ……',
  },
}

const private_school_gang: EnemyDef = {
  id: 'private_school_gang',
  name: '私立校の番長',
  title: '制服の鎖',
  type: 'THUG',
  district: 5,
  maxHp: 100,
  attackDamage: 16,
  aggroRange: 9,
  attackRange: 1.9,
  moveSpeed: 2.8,
  menchiTypes: ['NIRAMI', 'OTOKO', 'REI'],
  xpReward: 80,
  otokogiReward: 8,
  spawnWeight: 8,
  bodyColor: '#1a3a1a',
  isBoss: false,
  dialogue: {
    pre: '我が学び舎の名誉を守るために戦う！',
    post: '品位が……崩れてしまった……',
  },
}

const tennis_delinquent: EnemyDef = {
  id: 'tennis_delinquent',
  name: 'テニス部の番長',
  title: 'ラケットの鉄拳',
  type: 'DELINQUENT',
  district: 5,
  maxHp: 115,
  attackDamage: 18,
  aggroRange: 9,
  attackRange: 2.2,
  moveSpeed: 3.2,
  menchiTypes: ['WAZA', 'NIRAMI', 'KI'],
  xpReward: 100,
  otokogiReward: 10,
  spawnWeight: 6,
  bodyColor: '#4a6a1a',
  isBoss: false,
  dialogue: {
    pre: 'サービスエースで仕留めてやる！',
    post: 'ゲームセット……負けた……',
  },
}

const hillside_yankee: EnemyDef = {
  id: 'hillside_yankee',
  name: '丘の上のヤンキー',
  title: '高台の支配者',
  type: 'YANKEE',
  district: 5,
  maxHp: 140,
  attackDamage: 21,
  aggroRange: 11,
  attackRange: 2.2,
  moveSpeed: 3.0,
  menchiTypes: ['NIRAMI', 'OTOKO', 'WAZA', 'KI'],
  xpReward: 130,
  otokogiReward: 13,
  spawnWeight: 5,
  bodyColor: '#2a2a5a',
  isBoss: false,
  dialogue: {
    pre: '丘の上から見下ろして来い！',
    post: 'やっぱり上から目線じゃダメか……',
  },
}

const garden_subboss: EnemyDef = {
  id: 'garden_subboss',
  name: '薔薇の剛',
  title: '山ノ手小番長',
  type: 'SUBBANCHOU',
  district: 5,
  maxHp: 185,
  attackDamage: 26,
  aggroRange: 12,
  attackRange: 2.3,
  moveSpeed: 3.3,
  menchiTypes: ['OTOKO', 'WAZA', 'KI', 'REI'],
  xpReward: 220,
  otokogiReward: 22,
  spawnWeight: 2,
  bodyColor: '#5a1a1a',
  isBoss: false,
  dialogue: {
    pre: '薔薇には棘がある。山ノ手から去れ。',
    post: '天下無双さん……ご期待に添えず……',
  },
}

const kujou_tenka: EnemyDef = {
  id: 'kujou_tenka',
  name: '九条 天下',
  title: '天下無双',
  type: 'BANCHOU',
  district: 5,
  maxHp: 300,
  attackDamage: 33,
  aggroRange: 15,
  attackRange: 2.5,
  moveSpeed: 3.4,
  menchiTypes: ['OTOKO', 'KI', 'WAZA', 'REI', 'NIRAMI'],
  xpReward: 620,
  otokogiReward: 62,
  spawnWeight: 1,
  bodyColor: '#C0A000',
  isBoss: true,
  specialMoveUnlock: 'tenka_supreme',
  dialogue: {
    pre: '天下無双の名は伊達ではない。貴様の全力を見せろ。',
    post: 'これが……天下無双を超える力か。この地区は任せた。',
  },
}

// ─── District 6: 黒幕区 (Kuromaku-ku, shadowy boss district) ─────────────

const shadow_soldier: EnemyDef = {
  id: 'shadow_soldier',
  name: '闇の兵士',
  title: '黒幕の手駒',
  type: 'GRUNT',
  district: 6,
  maxHp: 90,
  attackDamage: 15,
  aggroRange: 9,
  attackRange: 2.0,
  moveSpeed: 3.0,
  menchiTypes: ['NIRAMI', 'KI'],
  xpReward: 70,
  otokogiReward: 7,
  spawnWeight: 9,
  bodyColor: '#0a0a1a',
  isBoss: false,
  dialogue: {
    pre: '黒幕さまの命令だ。ここで止まれ。',
    post: '……任務、失敗……',
  },
}

const black_coat_thug: EnemyDef = {
  id: 'black_coat_thug',
  name: '黒コートの精鋭',
  title: '影の剣士',
  type: 'THUG',
  district: 6,
  maxHp: 115,
  attackDamage: 18,
  aggroRange: 10,
  attackRange: 2.0,
  moveSpeed: 3.1,
  menchiTypes: ['NIRAMI', 'WAZA', 'KI'],
  xpReward: 95,
  otokogiReward: 10,
  spawnWeight: 7,
  bodyColor: '#1a0a0a',
  isBoss: false,
  dialogue: {
    pre: '黒幕連合に逆らうことの意味を教えてやる。',
    post: '黒幕さま……我々は敗れました……',
  },
}

const cursed_delinquent: EnemyDef = {
  id: 'cursed_delinquent',
  name: '呪われた不良',
  title: '黒幕の呪縛者',
  type: 'DELINQUENT',
  district: 6,
  maxHp: 130,
  attackDamage: 22,
  aggroRange: 10,
  attackRange: 2.1,
  moveSpeed: 3.0,
  menchiTypes: ['NIRAMI', 'KI', 'WAZA', 'OTOKO'],
  xpReward: 115,
  otokogiReward: 12,
  spawnWeight: 6,
  bodyColor: '#2a0a2a',
  isBoss: false,
  dialogue: {
    pre: '黒幕さまに魂を捧げた者に後れは取らない！',
    post: '呪縛が……解けていく……ありがとう……',
  },
}

const elite_yankee: EnemyDef = {
  id: 'elite_yankee',
  name: '黒幕連合精鋭',
  title: '闇の四天王補佐',
  type: 'YANKEE',
  district: 6,
  maxHp: 160,
  attackDamage: 26,
  aggroRange: 12,
  attackRange: 2.3,
  moveSpeed: 3.4,
  menchiTypes: ['NIRAMI', 'OTOKO', 'KI', 'WAZA'],
  xpReward: 150,
  otokogiReward: 15,
  spawnWeight: 4,
  bodyColor: '#1a001a',
  isBoss: false,
  dialogue: {
    pre: '黒幕連合最精鋭——覚悟はいいか？',
    post: '……俺たちでも、届かなかった……',
  },
}

const shadow_subboss: EnemyDef = {
  id: 'shadow_subboss',
  name: '闇夜の双剣 剣',
  title: '黒幕区小番長',
  type: 'SUBBANCHOU',
  district: 6,
  maxHp: 210,
  attackDamage: 30,
  aggroRange: 13,
  attackRange: 2.4,
  moveSpeed: 3.6,
  menchiTypes: ['NIRAMI', 'KI', 'WAZA', 'OTOKO'],
  xpReward: 260,
  otokogiReward: 26,
  spawnWeight: 2,
  bodyColor: '#2a002a',
  isBoss: false,
  dialogue: {
    pre: '闇夜の双剣——二刀流の前に倒れろ。',
    post: '鬼塚さま……私では力が足りませんでした……',
  },
}

const onizuka_haou: EnemyDef = {
  id: 'onizuka_haou',
  name: '鬼塚 覇王',
  title: '黒幕連合頭目',
  type: 'BOSS',
  district: 6,
  maxHp: 500,
  attackDamage: 45,
  aggroRange: 18,
  attackRange: 3.0,
  moveSpeed: 3.8,
  menchiTypes: ['OTOKO', 'KI', 'WAZA', 'NIRAMI', 'REI', 'WARAI'],
  xpReward: 2000,
  otokogiReward: 200,
  spawnWeight: 1,
  bodyColor: '#2c0040',
  isBoss: true,
  specialMoveUnlock: 'banchou_ranbu',
  dialogue: {
    pre:
      'ふっ……全ての番長を倒してここまで来たか。だが、この俺——鬼塚覇王の前では全て無意味だ。今こそ真の番長を決める時！',
    post:
      '……まさか……俺が敗れるとは……お前の漢気、本物だ。この国の番長は……お前だ。',
  },
}

// ─── Catalog ─────────────────────────────────────────────────────────────────

export const ENEMY_CATALOG: Record<string, EnemyDef> = {
  // District 0
  chimp_0,
  longshoreman,
  dockfighter,
  rust_gang,
  harbor_subboss1,
  goki_yuji,
  // District 1
  schoolrival,
  yankee_student,
  judo_club,
  rooftop_king,
  kendo_enforcer,
  hayami_futa,
  // District 2
  market_punk,
  takoyaki_fighter,
  arcade_boss_kid,
  pachinko_enforcer,
  street_subboss2,
  mouko_tetsu,
  // District 3
  factory_worker,
  biker_thug,
  welder_yankee,
  scrapyard_king,
  chimney_subboss,
  hagane_isao,
  // District 4
  host_punk,
  bouncer_thug,
  yakuza_junior,
  neon_yankee,
  velvet_subboss,
  arashi_kaidou,
  // District 5
  prep_bully,
  private_school_gang,
  tennis_delinquent,
  hillside_yankee,
  garden_subboss,
  kujou_tenka,
  // District 6
  shadow_soldier,
  black_coat_thug,
  cursed_delinquent,
  elite_yankee,
  shadow_subboss,
  onizuka_haou,
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export function makeEnemyEntity(id: string, def: EnemyDef, position: Vec3): EntityData {
  return {
    id,
    hp: def.maxHp,
    maxHp: def.maxHp,
    position,
    rotation: 0,
    velocity: { x: 0, y: 0, z: 0 },
    invulnUntilFrame: 0,
    globalFrame: 0,
    team: 'ENEMY',
    fsm: {
      state: 'IDLE',
      frameCount: 0,
      currentMoveId: null,
      hitId: null,
      alreadyHit: [],
      comboStep: 0,
    },
  }
}
