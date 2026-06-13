import type { MoveDef } from '@/types'

const ZERO = { x: 0, y: 0, z: 0 }

// All timings in frames at 60 Hz
export const MOVE_TABLE: Record<string, MoveDef> = {
  light1: {
    id: 'light1',
    startup: 5,
    active: 4,
    recovery: 12,
    damage: 8,
    knockback: { x: 0, y: 0.2, z: 2.5 },
    hitstopFrames: 6,
    cancelInto: ['ATTACK_LIGHT', 'ATTACK_HEAVY', 'DODGE'],
    cancelWindow: 8,
  },
  light2: {
    id: 'light2',
    startup: 4,
    active: 4,
    recovery: 10,
    damage: 7,
    knockback: { x: 0.3, y: 0.15, z: 2.0 },
    hitstopFrames: 5,
    cancelInto: ['ATTACK_LIGHT', 'ATTACK_HEAVY', 'DODGE'],
    cancelWindow: 6,
  },
  light3: {
    id: 'light3',
    startup: 6,
    active: 5,
    recovery: 16,
    damage: 12,
    knockback: { x: 0, y: 0.4, z: 4.0 },
    hitstopFrames: 8,
    cancelInto: ['DODGE'],
    cancelWindow: 10,
  },
  heavy1: {
    id: 'heavy1',
    startup: 12,
    active: 6,
    recovery: 24,
    damage: 22,
    knockback: { x: 0, y: 0.6, z: 5.0 },
    hitstopFrames: 12,
    cancelInto: ['DODGE'],
    cancelWindow: 14,
  },
  heavy2: {
    id: 'heavy2',
    startup: 10,
    active: 8,
    recovery: 28,
    damage: 28,
    knockback: { x: 0, y: 1.0, z: 6.0 },
    hitstopFrames: 14,
    cancelInto: [],
    cancelWindow: 0,
  },
  dodge: {
    id: 'dodge',
    startup: 3,
    active: 10, // invuln frames
    recovery: 12,
    damage: 0,
    knockback: ZERO,
    hitstopFrames: 0,
    cancelInto: ['ATTACK_LIGHT'],
    cancelWindow: 8,
  },
  throw1: {
    id: 'throw1',
    startup: 8,
    active: 6,
    recovery: 20,
    damage: 18,
    knockback: { x: 0, y: 1.5, z: 4.0 },
    hitstopFrames: 10,
    cancelInto: [],
    cancelWindow: 0,
    // requires close range — enforced by CombatSystem proximity check
  },
  parry: {
    id: 'parry',
    startup: 2,
    active: 6,
    recovery: 18,
    damage: 0,
    knockback: ZERO,
    hitstopFrames: 0,
    cancelInto: ['ATTACK_LIGHT', 'ATTACK_HEAVY'],
    cancelWindow: 12, // counter window after successful parry
  },
}

// Combo sequences: which move id follows which
// light: 3-hit chain, heavy: 2-hit chain
export const COMBO_CHAIN: Record<string, string> = {
  light1: 'light2',
  light2: 'light3',
  heavy1: 'heavy2',
}

// Special move follow-up chain (after landing special, can continue with)
export const SPECIAL_CHAIN: Record<string, string> = {
  kaminari_ken: 'light1',
  tatsumaki_upper: 'light1',
  bakuretsu_rush: 'heavy1',
  dosoi: 'throw1',
  jakunen_mai: 'light1',
  raiun: 'heavy1',
  fudo_zan: 'heavy2',
  banchou_ranbu: 'light1',
}
