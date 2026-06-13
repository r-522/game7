import type { MenchiDef, MenchiType } from '@/types'

export const MENCHI_TABLE: Record<MenchiType, MenchiDef> = {
  NIRAMI: {
    type: 'NIRAMI',
    label: '睨み',
    desc: '強烈な眼力で相手を圧倒する',
    powerBonus: 15,
    combatMod: { damageDealtMul: 1.1, damageTakenMul: 0.95, firstStrikeBonus: false },
  },
  WARAI: {
    type: 'WARAI',
    label: '笑い',
    desc: '余裕の笑みで相手の気勢を削ぐ',
    powerBonus: 5,
    combatMod: { damageDealtMul: 0.9, damageTakenMul: 0.85, firstStrikeBonus: true },
  },
  WAZA: {
    type: 'WAZA',
    label: '技',
    desc: '流麗な動きで相手を翻弄する',
    powerBonus: 10,
    combatMod: { damageDealtMul: 1.2, damageTakenMul: 1.0, firstStrikeBonus: false },
  },
  OTOKO: {
    type: 'OTOKO',
    label: '漢',
    desc: '男の意地を全面に出す',
    powerBonus: 20,
    combatMod: { damageDealtMul: 1.3, damageTakenMul: 1.1, firstStrikeBonus: false },
  },
  KI: {
    type: 'KI',
    label: '気',
    desc: '気合いで相手を圧倒する',
    powerBonus: 12,
    combatMod: { damageDealtMul: 1.05, damageTakenMul: 0.9, firstStrikeBonus: false },
  },
  REI: {
    type: 'REI',
    label: '冷',
    desc: '冷静な目で相手を見極める',
    powerBonus: 8,
    combatMod: { damageDealtMul: 1.0, damageTakenMul: 0.8, firstStrikeBonus: true },
  },
}

export const MENCHI_TYPES = Object.keys(MENCHI_TABLE) as MenchiType[]

export function getRandomMenchiType(): MenchiType {
  return MENCHI_TYPES[Math.floor(Math.random() * MENCHI_TYPES.length)]
}

// Rock-paper-scissors style advantage table
export const MENCHI_ADVANTAGE: Partial<Record<MenchiType, MenchiType>> = {
  NIRAMI: 'WARAI',
  WARAI: 'WAZA',
  WAZA: 'OTOKO',
  OTOKO: 'KI',
  KI: 'REI',
  REI: 'NIRAMI',
}
