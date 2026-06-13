import { useCombatStore } from '@/state/useCombatStore'
import { usePlayerStore } from '@/state/usePlayerStore'
import { useUIStore } from '@/state/useUIStore'
import { EventBus } from '@/core/events/EventBus'
import { MOVE_TABLE } from '@/data/moves/moveTable'
import { AudioSystem } from '@/systems/audio/AudioSystem'
import { KIAI_GRANT } from '@/systems/combat/CombatSystem'
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

  // Mark this target as already hit this swing (no multi-hit in one arc)
  updateFsm(attacker.id, { alreadyHit: [...attacker.fsm.alreadyHit, target.id] })

  // ── Block / Parry intercept ───────────────────────────────────────────────
  let finalDamage = move.damage
  const isSpecial = attacker.fsm.currentMoveId !== null &&
    !['light1', 'light2', 'light3', 'heavy1', 'heavy2', 'throw1', 'dodge', 'parry']
      .includes(attacker.fsm.currentMoveId)

  if (target.fsm.state === 'PARRY') {
    // Parry beats any attack — target takes 0 damage, parry counter window opens
    // No damage, no hitstop, no knockback — parry already handled in FSM
    return
  }

  if (target.fsm.state === 'BLOCK') {
    // Heavy attacks break through block at full damage; light/special reduced
    const isHeavy = attacker.fsm.currentMoveId === 'heavy1' || attacker.fsm.currentMoveId === 'heavy2'
    if (!isHeavy) {
      finalDamage = Math.ceil(move.damage * KIAI_GRANT.BLOCK_DAMAGE_MUL)
    }
    // Parry window: if block input was held on frames 1-4 of the block state
    // and a hit arrives, auto-trigger PARRY (handled here)
    if (target.team === 'PLAYER' && target.fsm.frameCount <= 4) {
      updateFsm(target.id, { state: 'PARRY', frameCount: 0, currentMoveId: 'parry' })
      return
    }
  }

  // Apply damage
  applyDamage(target.id, finalDamage, frame, 20)

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

  // UI flash
  useUIStore.getState().triggerHitFlash()

  // ── SFX ──────────────────────────────────────────────────────────────────
  if (isSpecial) {
    AudioSystem.playHitCrit()
  } else {
    const isHeavyMove = attacker.fsm.currentMoveId === 'heavy1' ||
      attacker.fsm.currentMoveId === 'heavy2' ||
      attacker.fsm.currentMoveId === 'throw1'
    if (isHeavyMove) {
      AudioSystem.playHitHeavy()
    } else {
      AudioSystem.playHitLight()
    }
  }

  // ── Kiai award for player attacker ───────────────────────────────────────
  if (attacker.team === 'PLAYER') {
    const isHeavyMove = attacker.fsm.currentMoveId === 'heavy1' ||
      attacker.fsm.currentMoveId === 'heavy2' ||
      attacker.fsm.currentMoveId === 'throw1'
    const kiaiAward = isHeavyMove ? KIAI_GRANT.hitHeavy : KIAI_GRANT.hitLight
    usePlayerStore.getState().addKiai(kiaiAward)
    usePlayerStore.getState().incrementCombo(frame)
  }

  // EventBus broadcast
  EventBus.emit('HIT_LANDED', {
    attackerId: attacker.id,
    targetId: target.id,
    damage: finalDamage,
    hitId: attacker.fsm.hitId,
  })

  // Transition target to HIT_REACT or KO
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
