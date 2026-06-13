import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type KeyAction =
  | 'moveUp'
  | 'moveDown'
  | 'moveLeft'
  | 'moveRight'
  | 'attackLight'
  | 'attackHeavy'
  | 'special'
  | 'dodge'
  | 'block'
  | 'lockOn'
  | 'throwAttack'
  | 'pause'
  | 'interact'

export const DEFAULT_BINDS: Record<KeyAction, string> = {
  moveUp: 'KeyW',
  moveDown: 'KeyS',
  moveLeft: 'KeyA',
  moveRight: 'KeyD',
  attackLight: 'Mouse0',
  attackHeavy: 'Mouse2',
  special: 'KeyF',
  dodge: 'Space',
  block: 'KeyC',
  lockOn: 'KeyQ',
  throwAttack: 'ShiftF',
  pause: 'Escape',
  interact: 'KeyE',
}

interface KeyBindState {
  binds: Record<KeyAction, string>
  setBinding: (action: KeyAction, key: string) => void
  resetAll: () => void
}

export const useKeyBindStore = create<KeyBindState>()(
  persist(
    (set) => ({
      binds: { ...DEFAULT_BINDS },
      setBinding: (action, key) =>
        set((s) => ({ binds: { ...s.binds, [action]: key } })),
      resetAll: () => set({ binds: { ...DEFAULT_BINDS } }),
    }),
    { name: 'knk7-keybinds' }
  )
)
