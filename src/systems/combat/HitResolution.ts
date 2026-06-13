import { useCombatStore } from '@/state/useCombatStore'
import { usePlayerStore } from '@/state/usePlayerStore'
import { useUIStore } from '@/state/useUIStore'
import { EventBus } from '@/core/events/EventBus'
import { MOVE_TABLE } from '@/data/moves/moveTable'
import { vec3Dist } from '@/core/math/pools'
import type { EntityData } from '@/types'

const HIT_RANGE = 2.2

function resolveHit(attacker: EntityData, target: EntityData, frame: number): void {
  const { updateFsm, applyDamage, applyKnockback, setHitstop } = useCombatStore.getState()

  if (!attacker.fsm.hitId) return
  if (attacker.fsm.alreadyHit.includes(target.id)) return
  if (target.hp <= 0) return
  if (target.invulnUntilFrame > frame) return

  const move = MOVE_TABLE[attacker.fsm.currentMoveId ?? '']
  if (!move) return

  // Distance check
  const dist = vec3Dist(attacker.position, target.position)
  if (dist > HIT_RANGE) return

  // Mark already-hit
  updateFsm(attacker.id, { alreadyHit: [...attacker.fsm.alreadyHit, target.id] })

  // Apply damage
  const dmg = move.damage
  applyDamage(target.id, dmg, frame, 20)

  // Apply knockback in attacker's facing direction
  const angle = attacker.rotation
  const kb = move.knockback
  const kbVel = {
    x: -Math.sin(angle) * kb.z + kb.x,
    y: kb.y,
    z: -Math.cos(angle) * kb.z,
  }
  applyKnockback(target.id, kbVel)

  // Hitstop
  setHitstop(move.hitstopFrames)

  // Flash
  useUIStore.getState().triggerHitFlash()

  // Update player combo if attacker is player
  if (attacker.team === 'PLAYER') {
    usePlayerStore.getState().incrementCombo(frame)
  }

  EventBus.emit('HIT_LANDED', {
    attackerId: attacker.id,
    targetId: target.id,
    damage: dmg,
    hitId: attacker.fsm.hitId,
  })

  // Transition target to HIT_REACT
  const freshTarget = useCombatStore.getState().entities[target.id]
  if (freshTarget && freshTarget.hp <= 0) {
    updateFsm(target.id, { state: 'KO', frameCount: 0 })
    EventBus.emit('KO', { entityId: target.id, attackerId: attacker.id })
  } else {
    updateFsm(target.id, { state: 'HIT_REACT', frameCount: 0 })
  }
}

export function HitResolution(frame: number): void {
  const { entities, hitstopFrames } = useCombatStore.getState()
  if (hitstopFrames > 0) return

  const list = Object.values(entities)
  for (const attacker of list) {
    const move = MOVE_TABLE[attacker.fsm.currentMoveId ?? '']
    if (!move) continue
    if (!attacker.fsm.hitId) continue

    const fc = attacker.fsm.frameCount
    const isActive = fc >= move.startup && fc < move.startup + move.active
    if (!isActive) continue

    for (const target of list) {
      if (target.id === attacker.id) continue
      if (target.team === attacker.team) continue
      resolveHit(attacker, target, frame)
    }
  }
}
