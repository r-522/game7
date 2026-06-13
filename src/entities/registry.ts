import { useCombatStore } from '@/state/useCombatStore'
import type { EntityData } from '@/types'

export function spawnEntity(data: EntityData): void {
  useCombatStore.getState().setEntity(data)
}

export function despawnEntity(id: string): void {
  useCombatStore.getState().removeEntity(id)
}

export function getEntity(id: string): EntityData | undefined {
  return useCombatStore.getState().entities[id]
}
