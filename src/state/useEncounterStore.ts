import { create } from 'zustand'
import type { EntityId, EncounterPhase, MenchiType } from '@/types'

interface EncounterState {
  phase: EncounterPhase
  enemyEntityId: EntityId | null
  enemyName: string
  playerMenchiType: MenchiType | null
  enemyMenchiType: MenchiType | null
  menchiPower: number
  tankaResult: 'NONE' | 'WIN' | 'LOSE'
  firstStrike: 'PLAYER' | 'ENEMY' | 'NONE'
  resultOtokogiDelta: number
  resultXpGained: number
  resultWin: boolean
  // actions
  startEncounter: (enemyId: EntityId, enemyName: string) => void
  setPhase: (phase: EncounterPhase) => void
  setMenchiResult: (playerType: MenchiType, enemyType: MenchiType, power: number) => void
  setTankaResult: (win: boolean) => void
  setFirstStrike: (fs: 'PLAYER' | 'ENEMY' | 'NONE') => void
  setResult: (win: boolean, otokogiDelta: number, xp: number) => void
  reset: () => void
}

const INITIAL_ENCOUNTER: Omit<EncounterState, 'startEncounter' | 'setPhase' | 'setMenchiResult' | 'setTankaResult' | 'setFirstStrike' | 'setResult' | 'reset'> = {
  phase: 'NONE',
  enemyEntityId: null,
  enemyName: '',
  playerMenchiType: null,
  enemyMenchiType: null,
  menchiPower: 50,
  tankaResult: 'NONE',
  firstStrike: 'NONE',
  resultOtokogiDelta: 0,
  resultXpGained: 0,
  resultWin: false,
}

export const useEncounterStore = create<EncounterState>((set) => ({
  ...INITIAL_ENCOUNTER,
  startEncounter: (enemyId, enemyName) =>
    set({ ...INITIAL_ENCOUNTER, enemyEntityId: enemyId, enemyName, phase: 'MENCHI' }),
  setPhase: (phase) => set({ phase }),
  setMenchiResult: (playerType, enemyType, power) =>
    set({ playerMenchiType: playerType, enemyMenchiType: enemyType, menchiPower: power }),
  setTankaResult: (win) => set({ tankaResult: win ? 'WIN' : 'LOSE' }),
  setFirstStrike: (fs) => set({ firstStrike: fs }),
  setResult: (win, otokogiDelta, xp) =>
    set({ resultWin: win, resultOtokogiDelta: otokogiDelta, resultXpGained: xp, phase: 'RESULT' }),
  reset: () => set({ ...INITIAL_ENCOUNTER }),
}))
