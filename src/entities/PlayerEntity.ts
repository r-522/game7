import { spawnEntity } from '@/entities/registry'
import type { EntityData } from '@/types'

export function spawnPlayer(): void {
  const player: EntityData = {
    id: 'player',
    hp: 100,
    maxHp: 100,
    position: { x: 0, y: 0, z: 0 },
    rotation: 0,
    velocity: { x: 0, y: 0, z: 0 },
    invulnUntilFrame: 0,
    globalFrame: 0,
    team: 'PLAYER',
    fsm: {
      state: 'IDLE',
      frameCount: 0,
      currentMoveId: null,
      hitId: null,
      alreadyHit: [],
    },
  }
  spawnEntity(player)
}
