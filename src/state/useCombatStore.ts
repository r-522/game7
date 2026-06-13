import { create } from 'zustand'
import type { EntityData, EntityId, FsmData, Vec3 } from '@/types'

interface CombatState {
  entities: Record<EntityId, EntityData>
  hitstopFrames: number
  // actions
  setEntity: (data: EntityData) => void
  removeEntity: (id: EntityId) => void
  setHitstop: (frames: number) => void
  tickHitstop: () => void
  updatePos: (id: EntityId, pos: Vec3) => void
  updateFsm: (id: EntityId, fsm: Partial<FsmData>) => void
  applyDamage: (id: EntityId, damage: number, frame: number, invulnFrames: number) => void
  applyKnockback: (id: EntityId, vel: Vec3) => void
}

export const useCombatStore = create<CombatState>((set) => ({
  entities: {},
  hitstopFrames: 0,

  setEntity: (data) =>
    set((s) => ({ entities: { ...s.entities, [data.id]: data } })),

  removeEntity: (id) =>
    set((s) => {
      const next = { ...s.entities }
      delete next[id]
      return { entities: next }
    }),

  setHitstop: (frames) =>
    set((s) => ({ hitstopFrames: Math.max(s.hitstopFrames, frames) })),

  tickHitstop: () =>
    set((s) => ({ hitstopFrames: Math.max(0, s.hitstopFrames - 1) })),

  updatePos: (id, pos) =>
    set((s) => {
      const e = s.entities[id]
      if (!e) return s
      return { entities: { ...s.entities, [id]: { ...e, position: pos } } }
    }),

  updateFsm: (id, fsm) =>
    set((s) => {
      const e = s.entities[id]
      if (!e) return s
      return { entities: { ...s.entities, [id]: { ...e, fsm: { ...e.fsm, ...fsm } } } }
    }),

  applyDamage: (id, damage, frame, invulnFrames) =>
    set((s) => {
      const e = s.entities[id]
      if (!e) return s
      return {
        entities: {
          ...s.entities,
          [id]: { ...e, hp: Math.max(0, e.hp - damage), invulnUntilFrame: frame + invulnFrames },
        },
      }
    }),

  applyKnockback: (id, vel) =>
    set((s) => {
      const e = s.entities[id]
      if (!e) return s
      return { entities: { ...s.entities, [id]: { ...e, velocity: vel } } }
    }),
}))
