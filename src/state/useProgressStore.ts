import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ProgressState {
  currentChapter: number
  currentDistrict: number
  defeatedBanchous: string[]
  unlockedSpecials: string[]
  activeQuests: string[]
  completedQuests: string[]
  shateiIds: string[]
  totalPlaySeconds: number
  flags: Record<string, boolean>
  // actions
  setChapter: (chapter: number) => void
  setDistrict: (district: number) => void
  defeatBanchou: (id: string) => void
  unlockSpecial: (id: string) => void
  completeQuest: (id: string) => void
  addShatei: (id: string) => void
  setFlag: (key: string, val: boolean) => void
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      currentChapter: 1,
      currentDistrict: 0,
      defeatedBanchous: [],
      unlockedSpecials: ['kaminari_ken'],
      activeQuests: [],
      completedQuests: [],
      shateiIds: [],
      totalPlaySeconds: 0,
      flags: {},
      setChapter: (chapter) => set({ currentChapter: chapter }),
      setDistrict: (district) => set({ currentDistrict: district }),
      defeatBanchou: (id) =>
        set((s) =>
          s.defeatedBanchous.includes(id)
            ? s
            : { defeatedBanchous: [...s.defeatedBanchous, id] }
        ),
      unlockSpecial: (id) =>
        set((s) =>
          s.unlockedSpecials.includes(id)
            ? s
            : { unlockedSpecials: [...s.unlockedSpecials, id] }
        ),
      completeQuest: (id) =>
        set((s) => ({
          activeQuests: s.activeQuests.filter((q) => q !== id),
          completedQuests: s.completedQuests.includes(id)
            ? s.completedQuests
            : [...s.completedQuests, id],
        })),
      addShatei: (id) =>
        set((s) =>
          s.shateiIds.includes(id)
            ? s
            : { shateiIds: [...s.shateiIds, id] }
        ),
      setFlag: (key, val) =>
        set((s) => ({ flags: { ...s.flags, [key]: val } })),
    }),
    { name: 'knk7-progress' }
  )
)
