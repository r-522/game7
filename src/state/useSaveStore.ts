import { create } from 'zustand'

interface SaveState {
  loaded: boolean
  saving: boolean
  lastSaved: number
  // actions
  markSaving: () => void
  markSaved: (timestamp: number) => void
  markLoaded: () => void
}

export const useSaveStore = create<SaveState>((set) => ({
  loaded: false,
  saving: false,
  lastSaved: 0,

  markSaving: () => set({ saving: true }),
  markSaved: (timestamp) => set({ saving: false, lastSaved: timestamp }),
  markLoaded: () => set({ loaded: true }),
}))
