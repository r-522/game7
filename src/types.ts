export type EntityId = string

export interface Vec3 {
  x: number
  y: number
  z: number
}

export type MenchiType = 'NIRAMI' | 'WARAI' | 'WAZA' | 'OTOKO' | 'KI' | 'REI'
export type EncounterPhase = 'NONE' | 'ROAM' | 'MENCHI' | 'TANKA' | 'FIGHT' | 'RESULT'
export type CombatStateId =
  | 'IDLE'
  | 'LOCOMOTION'
  | 'ATTACK_LIGHT'
  | 'ATTACK_HEAVY'
  | 'SPECIAL'
  | 'THROW'
  | 'DODGE'
  | 'BLOCK'
  | 'PARRY'
  | 'HIT_REACT'
  | 'KO'

export interface MoveDef {
  id: string
  startup: number
  active: number
  recovery: number
  damage: number
  knockback: Vec3
  hitstopFrames: number
  cancelInto: CombatStateId[]
  cancelWindow: number
  kiaiCost?: number
}

export interface FsmData {
  state: CombatStateId
  frameCount: number
  currentMoveId: string | null
  hitId: string | null
  alreadyHit: EntityId[]
  comboStep: number
}

export interface EntityData {
  id: EntityId
  hp: number
  maxHp: number
  position: Vec3
  rotation: number
  velocity: Vec3
  invulnUntilFrame: number
  globalFrame: number
  team: 'PLAYER' | 'ENEMY'
  fsm: FsmData
}

export interface InputSnapshot {
  move: Vec3
  attackLight: boolean
  attackHeavy: boolean
  special: boolean
  dodge: boolean
  block: boolean
  lock: boolean
  throwAttack: boolean
  interact: boolean
}

export interface MenchiDef {
  type: MenchiType
  label: string
  desc: string
  powerBonus: number
  combatMod: {
    damageDealtMul: number
    damageTakenMul: number
    firstStrikeBonus: boolean
  }
}
