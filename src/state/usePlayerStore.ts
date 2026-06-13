import { create } from 'zustand'
import type { EntityId } from '@/types'

interface PlayerState {
  entityId: EntityId
  hp: number
  maxHp: number
  kiai: number
  maxKiai: number
  otokogi: number
  banchouLevel: number
  kenkaExp: number
  comboCount: number
  lastComboFrame: number
  maxCombo: number
  equipped: { body: string; hair: string; legs: string; accessory: string }
  // actions
  takeDamage: (amount: number) => void
  heal: (amount: number) => void
  addKiai: (amount: number) => void
  useKiai: (cost: number) => boolean
  addOtokogi: (delta: number) => void
  addXp: (amount: number) => void
  incrementCombo: (currentFrame: number) => void
  resetCombo: () => void
  reset: () => void
}

const INITIAL: Omit<
  PlayerState,
  | 'takeDamage'
  | 'heal'
  | 'addKiai'
  | 'useKiai'
  | 'addOtokogi'
  | 'addXp'
  | 'incrementCombo'
  | 'resetCombo'
  | 'reset'
> = {
  entityId: 'player',
  hp: 100,
  maxHp: 100,
  kiai: 0,
  maxKiai: 100,
  otokogi: 50,
  banchouLevel: 1,
  kenkaExp: 0,
  comboCount: 0,
  lastComboFrame: 0,
  maxCombo: 0,
  equipped: { body: 'gakuran_default', hair: 'regent', legs: 'bontan', accessory: 'none' },
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  ...INITIAL,
  takeDamage: (amount) =>
    set((s) => ({ hp: Math.max(0, s.hp - amount) })),
  heal: (amount) =>
    set((s) => ({ hp: Math.min(s.maxHp, s.hp + amount) })),
  addKiai: (amount) =>
    set((s) => ({ kiai: Math.min(s.maxKiai, Math.max(0, s.kiai + amount)) })),
  useKiai: (cost) => {
    const { kiai } = get()
    if (kiai < cost) return false
    set((s) => ({ kiai: Math.max(0, s.kiai - cost) }))
    return true
  },
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
    set((s) => {
      const newCount = s.comboCount + 1
      return {
        comboCount: newCount,
        lastComboFrame: currentFrame,
        maxCombo: newCount > s.maxCombo ? newCount : s.maxCombo,
      }
    }),
  resetCombo: () => set({ comboCount: 0 }),
  reset: () => set({ ...INITIAL }),
}))
