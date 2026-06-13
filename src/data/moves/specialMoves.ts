import type { Vec3 } from '@/types'

export type SpecialFxType = 'lightning' | 'tornado' | 'fire' | 'earth' | 'rush' | 'aura'

export interface SpecialMoveDef {
  id: string
  nameJP: string
  nameEN: string
  description: string
  kiaiCost: number   // 100 = full gauge
  damage: number
  hitboxRadius: number
  knockback: Vec3
  hitstopFrames: number
  duration: number   // frames at 60 Hz
  fxType: SpecialFxType
  screenFlash: boolean
  timeSlowFactor: number   // applied during cinematic entry (0.2 = 80% slowdown)
  unlockCondition: string  // banchou id or 'default'
}

export const SPECIAL_MOVES: Record<string, SpecialMoveDef> = {
  kaminari_ken: {
    id: 'kaminari_ken',
    nameJP: '雷電拳',
    nameEN: 'Lightning Fist',
    description: '拳に雷を纏わせ、一撃に全ての気合を叩き込む。',
    kiaiCost: 100,
    damage: 40,
    hitboxRadius: 1.2,
    knockback: { x: 0, y: 0.8, z: 6.0 },
    hitstopFrames: 18,
    duration: 48,
    fxType: 'lightning',
    screenFlash: true,
    timeSlowFactor: 0.2,
    unlockCondition: 'default',
  },
  tatsumaki_upper: {
    id: 'tatsumaki_upper',
    nameJP: '竜巻アッパー',
    nameEN: 'Tornado Upper',
    description: '天を衝くアッパーカットが竜巻を生み出す。',
    kiaiCost: 100,
    damage: 50,
    hitboxRadius: 1.5,
    knockback: { x: 0, y: 2.5, z: 3.0 },
    hitstopFrames: 20,
    duration: 54,
    fxType: 'tornado',
    screenFlash: true,
    timeSlowFactor: 0.2,
    unlockCondition: 'banchou0',
  },
  bakuretsu_rush: {
    id: 'bakuretsu_rush',
    nameJP: '爆裂ラッシュ',
    nameEN: 'Blast Rush',
    description: '10連撃の怒涛のラッシュ。止める者は誰もいない。',
    kiaiCost: 100,
    damage: 60,   // total across all 10 hits
    hitboxRadius: 1.0,
    knockback: { x: 0, y: 0.3, z: 8.0 },
    hitstopFrames: 6,   // per hit (short, rapid fire)
    duration: 90,
    fxType: 'rush',
    screenFlash: false,
    timeSlowFactor: 0.3,
    unlockCondition: 'banchou1',
  },
  dosoi: {
    id: 'dosoi',
    nameJP: 'ドスお囲い',
    nameEN: 'Sumo Slam',
    description: '相手を掴み、大地に叩きつける。重さこそ力。',
    kiaiCost: 100,
    damage: 55,
    hitboxRadius: 0.8,   // close-range grapple
    knockback: { x: 0, y: 0.5, z: 5.5 },
    hitstopFrames: 22,
    duration: 66,
    fxType: 'earth',
    screenFlash: true,
    timeSlowFactor: 0.25,
    unlockCondition: 'banchou2',
  },
  jakunen_mai: {
    id: 'jakunen_mai',
    nameJP: '蛇眼舞',
    nameEN: 'Snake Eye Dance',
    description: '蛇のように素早く相手の周囲を舞い、急所を刻む。',
    kiaiCost: 100,
    damage: 45,
    hitboxRadius: 1.8,
    knockback: { x: 1.5, y: 0.5, z: 3.5 },
    hitstopFrames: 14,
    duration: 72,
    fxType: 'aura',
    screenFlash: false,
    timeSlowFactor: 0.2,
    unlockCondition: 'banchou3',
  },
  raiun: {
    id: 'raiun',
    nameJP: '雷雲',
    nameEN: 'Thunder Cloud',
    description: '天空より雷を呼び寄せ、広範囲の敵を焼き払う。',
    kiaiCost: 100,
    damage: 70,
    hitboxRadius: 4.0,   // wide area of effect
    knockback: { x: 0, y: 1.0, z: 4.0 },
    hitstopFrames: 24,
    duration: 80,
    fxType: 'lightning',
    screenFlash: true,
    timeSlowFactor: 0.15,
    unlockCondition: 'banchou4',
  },
  fudo_zan: {
    id: 'fudo_zan',
    nameJP: '不動斬',
    nameEN: 'Immovable Cut',
    description: '鋼鉄の意志で繰り出す一撃。いかなる攻撃も止められない。',
    kiaiCost: 100,
    damage: 80,
    hitboxRadius: 1.4,
    knockback: { x: 0, y: 0.6, z: 7.0 },
    hitstopFrames: 28,
    duration: 60,
    fxType: 'earth',
    screenFlash: true,
    timeSlowFactor: 0.1,
    unlockCondition: 'banchou5',
  },
  banchou_ranbu: {
    id: 'banchou_ranbu',
    nameJP: '番長乱舞',
    nameEN: 'Banchou Rampage',
    description: '番長としての全てを解放する究極の乱舞。誰も止められない。',
    kiaiCost: 100,
    damage: 100,
    hitboxRadius: 2.5,
    knockback: { x: 0, y: 2.0, z: 10.0 },
    hitstopFrames: 30,
    duration: 120,
    fxType: 'aura',
    screenFlash: true,
    timeSlowFactor: 0.1,
    unlockCondition: 'banchou_final',
  },
}
