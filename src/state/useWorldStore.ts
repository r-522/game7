import { create } from 'zustand'
import type { EntityId } from '@/types'

interface WorldState {
  timeOfDay: number // 0-24 hours
  district: string
  defeatedEnemyIds: EntityId[]
  // actions
  tickTime: (dtSeconds: number) => void
  markDefeated: (id: EntityId) => void
  reset: () => void
}

export const useWorldStore = create<WorldState>((set) => ({
  timeOfDay: 15, // 3pm default
  district: 'arena01',
  defeatedEnemyIds: [],

  tickTime: (dtSeconds) =>
    set((s) => ({ timeOfDay: (s.timeOfDay + dtSeconds / 3600) % 24 })),

  markDefeated: (id) =>
    set((s) => ({
      defeatedEnemyIds: s.defeatedEnemyIds.includes(id)
        ? s.defeatedEnemyIds
        : [...s.defeatedEnemyIds, id],
    })),

  reset: () => set({ timeOfDay: 15, defeatedEnemyIds: [] }),
}))
