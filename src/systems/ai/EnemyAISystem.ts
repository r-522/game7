import { useCombatStore } from '@/state/useCombatStore'
import { useEncounterStore } from '@/state/useEncounterStore'
import { newHitId } from '@/systems/combat/HitId'
import { vec3Dist } from '@/core/math/pools'
import type { EntityData } from '@/types'

const AI_MOVE_SPEED = 2.5
const ATTACK_RANGE = 1.9
const ATTACK_COOLDOWN = 90 // frames between attacks
const ATTACK_MOVE_ID = 'light1'

const aiCooldowns = new Map<string, number>()

function updateEnemy(entity: EntityData, dt: number, _frame: number): Partial<EntityData> {
  const { entities } = useCombatStore.getState()
  const encounter = useEncounterStore.getState()

  if (encounter.phase !== 'FIGHT') return {}

  const player = entities['player']
  if (!player || player.hp <= 0) return {}
  if (entity.hp <= 0 || entity.fsm.state === 'KO') return {}
  if (entity.fsm.state === 'HIT_REACT') return {}
  if (entity.fsm.state === 'ATTACK_LIGHT' || entity.fsm.state === 'ATTACK_HEAVY') return {}

  const dist = vec3Dist(entity.position, player.position)
  const dx = player.position.x - entity.position.x
  const dz = player.position.z - entity.position.z
  const angle = Math.atan2(dx, dz)

  const cooldown = aiCooldowns.get(entity.id) ?? 0
  const newCooldown = Math.max(0, cooldown - 1)
  aiCooldowns.set(entity.id, newCooldown)

  let newPos = { ...entity.position }
  let newFsm = { ...entity.fsm }

  if (dist > ATTACK_RANGE) {
    newPos = {
      x: entity.position.x + (dx / dist) * AI_MOVE_SPEED * dt,
      y: entity.position.y,
      z: entity.position.z + (dz / dist) * AI_MOVE_SPEED * dt,
    }
    newFsm = { ...newFsm, state: 'LOCOMOTION' }
  } else if (newCooldown === 0) {
    newFsm = {
      ...newFsm,
      state: 'ATTACK_LIGHT',
      currentMoveId: ATTACK_MOVE_ID,
      hitId: newHitId(),
      alreadyHit: [],
      frameCount: 0,
    }
    aiCooldowns.set(entity.id, ATTACK_COOLDOWN)
  } else {
    newFsm = { ...newFsm, state: 'IDLE' }
  }

  return {
    position: newPos,
    rotation: angle,
    fsm: newFsm,
  }
}

export function EnemyAISystem(dt: number, frame: number): void {
  const { entities, hitstopFrames, setEntity } = useCombatStore.getState()
  if (hitstopFrames > 0) return

  for (const entity of Object.values(entities)) {
    if (entity.team !== 'ENEMY') continue
    const patch = updateEnemy(entity, dt, frame)
    if (Object.keys(patch).length > 0) {
      setEntity({ ...entity, ...patch } as EntityData)
    }
  }
}
