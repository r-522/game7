import { create } from 'zustand'

type Screen = 'TITLE' | 'GAME' | 'PAUSE' | 'MENCHI' | 'TANKA' | 'RESULT'

interface UIState {
  screen: Screen
  showHud: boolean
  tankaOptions: string[]
  tankaCorrectIndex: number
  tankaSetup: string
  hitFlash: boolean
  hitFlashTimer: number
  // actions
  setScreen: (screen: Screen) => void
  setTankaData: (setup: string, options: string[], correctIndex: number) => void
  triggerHitFlash: () => void
  tickHitFlash: () => void
}

export const useUIStore = create<UIState>((set) => ({
  screen: 'TITLE',
  showHud: false,
  tankaOptions: [],
  tankaCorrectIndex: 0,
  tankaSetup: '',
  hitFlash: false,
  hitFlashTimer: 0,

  setScreen: (screen) =>
    set({ screen, showHud: screen === 'GAME' }),

  setTankaData: (setup, options, correctIndex) =>
    set({ tankaSetup: setup, tankaOptions: options, tankaCorrectIndex: correctIndex }),

  triggerHitFlash: () => set({ hitFlash: true, hitFlashTimer: 6 }),

  tickHitFlash: () =>
    set((s) => {
      const next = s.hitFlashTimer - 1
      return { hitFlashTimer: next, hitFlash: next > 0 }
    }),
}))
