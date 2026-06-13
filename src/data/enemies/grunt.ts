import type { EntityData } from '@/types'

export interface EnemyDef {
  name: string
  maxHp: number
  attackDamage: number
  aggroRange: number
  attackRange: number
  moveSpeed: number
  menchiTypes: Array<'NIRAMI' | 'WARAI' | 'WAZA' | 'OTOKO' | 'KI' | 'REI'>
  xpReward: number
  otokogiReward: number
  tankaIndex?: number
}

export const GRUNT_DEF: EnemyDef = {
  name: 'チンピラ',
  maxHp: 60,
  attackDamage: 8,
  aggroRange: 8,
  attackRange: 1.8,
  moveSpeed: 2.5,
  menchiTypes: ['NIRAMI', 'OTOKO'],
  xpReward: 50,
  otokogiReward: 5,
}

export const BANCHOU_DEF: EnemyDef = {
  name: '地区番長',
  maxHp: 120,
  attackDamage: 14,
  aggroRange: 12,
  attackRange: 2.0,
  moveSpeed: 3.0,
  menchiTypes: ['OTOKO', 'WAZA', 'KI'],
  xpReward: 200,
  otokogiReward: 15,
}

export function makeEnemyEntity(
  id: string,
  def: EnemyDef,
  position: { x: number; y: number; z: number },
): EntityData {
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
    },
  }
}
