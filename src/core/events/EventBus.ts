import type { EntityId, MenchiType } from '@/types'

export interface HitEvent {
  attackerId: EntityId
  targetId: EntityId
  damage: number
  hitId: string
}

export interface KOEvent {
  entityId: EntityId
  attackerId: EntityId
}

export type EventMap = {
  HIT_LANDED: HitEvent
  KO: KOEvent
  ENCOUNTER_START: { enemyId: EntityId; enemyName: string }
  ENCOUNTER_END: { win: boolean; otokogiDelta: number; xp: number }
  MENCHI_RESOLVE: { winner: 'PLAYER' | 'ENEMY'; playerType: MenchiType; enemyType: MenchiType; power: number }
  TANKA_RESULT: { correct: boolean }
  FIGHT_START: { firstStrike: 'PLAYER' | 'ENEMY' | 'NONE' }
}

type Handler<K extends keyof EventMap> = (payload: EventMap[K]) => void

class Bus {
  private handlers = new Map<string, Handler<keyof EventMap>[]>()

  on<K extends keyof EventMap>(event: K, handler: Handler<K>): () => void {
    const list = this.handlers.get(event) ?? []
    list.push(handler as Handler<keyof EventMap>)
    this.handlers.set(event, list)
    return () => this.off(event, handler)
  }

  off<K extends keyof EventMap>(event: K, handler: Handler<K>): void {
    const list = this.handlers.get(event) ?? []
    this.handlers.set(
      event,
      list.filter((h) => h !== (handler as Handler<keyof EventMap>)),
    )
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    const list = this.handlers.get(event) ?? []
    for (const h of list) h(payload as EventMap[keyof EventMap])
  }

  clear(): void {
    this.handlers.clear()
  }
}

export const EventBus = new Bus()
