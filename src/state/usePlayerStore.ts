import { create } from 'zustand'
import type { EntityId } from '@/types'

interface PlayerState {
  entityId: EntityId
  hp: number
  maxHp: number
  otokogi: number
  banchouLevel: number
  kenkaExp: number
  comboCount: number
  lastComboFrame: number
  equipped: { body: string; hair: string; legs: string }
  shateiIds: EntityId[]
  // actions
  takeDamage: (amount: number) => void
  heal: (amount: number) => void
  addOtokogi: (delta: number) => void
  addXp: (amount: number) => void
  incrementCombo: (currentFrame: number) => void
  resetCombo: () => void
  reset: () => void
}

const INITIAL: Omit<PlayerState, keyof Pick<PlayerState, 'takeDamage' | 'heal' | 'addOtokogi' | 'addXp' | 'incrementCombo' | 'resetCombo' | 'reset'>> = {
  entityId: 'player',
  hp: 100,
  maxHp: 100,
  otokogi: 50,
  banchouLevel: 1,
  kenkaExp: 0,
  comboCount: 0,
  lastComboFrame: 0,
  equipped: { body: 'gakuran_default', hair: 'regent', legs: 'bontan' },
  shateiIds: [],
}

export const usePlayerStore = create<PlayerState>((set) => ({
  ...INITIAL,
  takeDamage: (amount) =>
    set((s) => ({ hp: Math.max(0, s.hp - amount) })),
  heal: (amount) =>
    set((s) => ({ hp: Math.min(s.maxHp, s.hp + amount) })),
  addOtokogi: (delta) =>
    set((s) => ({ otokogi: Math.max(0, Math.min(100, s.otokogi + delta)) })),
  addXp: (amount) =>
    set((s) => {
      const next = s.kenkaExp + amount
      const threshold = s.banchouLevel * 200
      if (next >= threshold) {
        return { kenkaExp: next - threshold, banchouLevel: s.banchouLevel + 1 }
      }
      return { kenkaExp: next }
    }),
  incrementCombo: (currentFrame) =>
    set((s) => ({ comboCount: s.comboCount + 1, lastComboFrame: currentFrame })),
  resetCombo: () => set({ comboCount: 0 }),
  reset: () => set({ ...INITIAL }),
}))
