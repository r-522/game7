// SpecialSystem.ts — 必殺技 (special move) execution system for 喧嘩番長7
// No React, no JSX. Pure simulation logic.
// Called from the scheduler after CombatSystem and before HitResolution.

import { usePlayerStore } from '@/state/usePlayerStore'
import { useCombatStore } from '@/state/useCombatStore'
import { useProgressStore } from '@/state/useProgressStore'
import { SPECIAL_MOVES } from '@/data/moves/specialMoves'
import { AudioSystem } from '@/systems/audio/AudioSystem'
import { EventBus } from '@/core/events/EventBus'
import { vec3Dist } from '@/core/math/pools'
import type { EntityData, EntityId, Vec3 } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SpecialFxPhase = 'enter' | 'impact' | 'exit'

export interface SpecialState {
  active: boolean
  moveId: string
  frameCount: number
  fxPhase: SpecialFxPhase
  /** ids of entities already struck this special (prevents double-hit within one execution) */
  alreadyHit: EntityId[]
  /** for rush specials: how many hits have landed so far */
  rushHitCount: number
}

// ---------------------------------------------------------------------------
// Phase frame boundaries
// These are defined against a 60-frame reference budget.
// Moves with duration !== 60 are scaled proportionally via phaseBoundaries().
// ---------------------------------------------------------------------------

const ENTER_END_FRAME = 20    // frames 0-20:  enter (time-slow, glow)
const IMPACT_END_FRAME = 40   // frames 21-40: impact (damage application)
// frames 41+:   exit (return to normal, trail FX)

// ---------------------------------------------------------------------------
// Scratch -- no per-frame allocation
// ---------------------------------------------------------------------------

// Reusable Vec3 for knockback computation (avoids a new {} object each hit)
const _kbScratch: Vec3 = { x: 0, y: 0, z: 0 }

// ---------------------------------------------------------------------------
// Module-level state (singleton active special slot)
// ---------------------------------------------------------------------------

let activeSpecial: SpecialState | null = null

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Scale a phase boundary by the move's actual duration vs. the 60-frame reference. */
function scaledBoundary(boundary: number, moveDuration: number): number {
  return Math.round((boundary / 60) * moveDuration)
}

/**
 * Compute scaled phase boundaries for a move whose duration may differ from 60.
 * Returns [enterEndFrame, impactEndFrame].
 */
function phaseBoundaries(moveDuration: number): [number, number] {
  return [
    scaledBoundary(ENTER_END_FRAME, moveDuration),
    scaledBoundary(IMPACT_END_FRAME, moveDuration),
  ]
}

/** True if a move id is a rush-type special (multi-hit spread over impact window). */
function isRushSpecial(moveId: string): boolean {
  return moveId === 'bakuretsu_rush'
}

/** True if a move is an area-of-effect special (hits all enemies within radius). */
function isAreaSpecial(moveId: string): boolean {
  return moveId === 'raiun'
}

/** Find the nearest living enemy to the player within a +/-70 degree forward cone. */
function nearestEnemyInFront(
  player: EntityData,
  entities: Record<EntityId, EntityData>,
): EntityData | null {
  const halfAngle = Math.PI * (70 / 180)   // 70-degree half-angle
  let best: EntityData | null = null
  let bestDist = Infinity

  for (const e of Object.values(entities)) {
    if (e.id === player.id) continue
    if (e.team === player.team) continue
    if (e.hp <= 0) continue

    const dx = e.position.x - player.position.x
    const dz = e.position.z - player.position.z
    const dist = Math.sqrt(dx * dx + dz * dz)

    // Forward vector derived from player's Y-axis rotation (XZ plane)
    const fwdX = -Math.sin(player.rotation)
    const fwdZ = -Math.cos(player.rotation)

    // Angle between forward and direction-to-enemy
    const dot = (dx / (dist || 1)) * fwdX + (dz / (dist || 1)) * fwdZ
    const angle = Math.acos(Math.max(-1, Math.min(1, dot)))

    if (angle <= halfAngle && dist < bestDist) {
      bestDist = dist
      best = e
    }
  }

  return best
}

/**
 * Apply a single special hit to a target entity.
 * Writes knockback direction into _kbScratch to avoid per-call allocation.
 */
function applySpecialHit(
  player: EntityData,
  target: EntityData,
  damage: number,
  knockback: Vec3,
  hitstopFrames: number,
  frame: number,
): void {
  const { applyDamage, applyKnockback, setHitstop, updateFsm } = useCombatStore.getState()

  if (target.invulnUntilFrame > frame) return
  if (target.hp <= 0) return

  // Apply damage; grant 30-frame invuln to prevent double-hit within same special
  applyDamage(target.id, damage, frame, 30)

  // Compute knockback in player's facing direction -- mutate scratch object only
  const angle = player.rotation
  _kbScratch.x = -Math.sin(angle) * knockback.z + knockback.x
  _kbScratch.y = knockback.y
  _kbScratch.z = -Math.cos(angle) * knockback.z

  // Inline literal so applyKnockback receives a distinct object (store holds the ref)
  applyKnockback(target.id, { x: _kbScratch.x, y: _kbScratch.y, z: _kbScratch.z })

  setHitstop(hitstopFrames)

  // Transition target FSM to HIT_REACT or KO
  const freshTarget = useCombatStore.getState().entities[target.id]
  if (freshTarget && freshTarget.hp <= 0) {
    updateFsm(target.id, { state: 'KO', frameCount: 0 })
    EventBus.emit('KO', { entityId: target.id, attackerId: player.id })
  } else {
    updateFsm(target.id, { state: 'HIT_REACT', frameCount: 0 })
  }

  EventBus.emit('HIT_LANDED', {
    attackerId: player.id,
    targetId: target.id,
    damage,
    hitId: `special_${activeSpecial?.moveId ?? 'unknown'}_${frame}`,
  })

  // Increment combo counter for the player
  usePlayerStore.getState().incrementCombo(frame)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Attempt to trigger a special move for the given attacker.
 * Returns true if the special was successfully started, false otherwise.
 * Conditions: kiai >= 100 AND at least one special is unlocked AND none is active.
 */
export function tryTriggerSpecial(attackerId: EntityId): boolean {
  if (activeSpecial !== null) return false   // another special is already executing

  const { kiai } = usePlayerStore.getState()
  if (kiai < 100) return false

  const available = getAvailableSpecials()
  if (available.length === 0) return false

  // Use the first available special (player's currently selected move).
  // Future work: expose a selectedSpecialId in usePlayerStore for explicit selection.
  const moveId = available[0]
  const moveDef = SPECIAL_MOVES[moveId]
  if (!moveDef) return false

  // Deduct kiai atomically -- returns false if insufficient
  const deducted = usePlayerStore.getState().useKiai(moveDef.kiaiCost)
  if (!deducted) return false

  activeSpecial = {
    active: true,
    moveId,
    frameCount: 0,
    fxPhase: 'enter',
    alreadyHit: [],
    rushHitCount: 0,
  }

  // Transition player FSM to SPECIAL state
  const { updateFsm } = useCombatStore.getState()
  updateFsm(attackerId, {
    state: 'SPECIAL',
    frameCount: 0,
    currentMoveId: moveId,
    hitId: `special_${moveId}_${Date.now()}`,
    alreadyHit: [],
    comboStep: 0,
  })

  AudioSystem.playSpecial()

  return true
}

/**
 * Main update tick for the special system.
 * Must be called every fixed step (60 Hz) after CombatSystem advances FSMs.
 * Handles the three execution phases: enter, impact, exit.
 *
 * The _dt parameter is accepted to match the scheduler's tick signature but is
 * intentionally unused: special timing is driven by the frame counter, not wall clock.
 */
export function SpecialSystem(_dt: number, frame: number): void {
  if (!activeSpecial) return

  const { hitstopFrames } = useCombatStore.getState()

  // While hitstop is active the entire simulation is frozen -- hold frame counter
  if (hitstopFrames > 0) return

  const sp = activeSpecial
  const moveDef = SPECIAL_MOVES[sp.moveId]
  if (!moveDef) {
    // Unknown move -- abort cleanly to avoid stale state
    activeSpecial = null
    return
  }

  sp.frameCount++

  const [enterEnd, impactEnd] = phaseBoundaries(moveDef.duration)
  const prevPhase = sp.fxPhase

  // Resolve current phase from scaled frame count
  if (sp.frameCount <= enterEnd) {
    sp.fxPhase = 'enter'
  } else if (sp.frameCount <= impactEnd) {
    sp.fxPhase = 'impact'
  } else {
    sp.fxPhase = 'exit'
  }

  const { entities } = useCombatStore.getState()
  const player = entities['player']
  if (!player) return

  // -- Enter phase: freeze all other combatants (cinematic time-slow) -----------
  if (sp.fxPhase === 'enter') {
    // Apply enough hitstop each tick to keep enemies frozen during the enter window.
    // setHitstop takes max(current, requested) so repeated calls stay effective.
    // The render layer reads timeSlowFactor from the move def to drive visual speed.
    const { setHitstop } = useCombatStore.getState()
    setHitstop(Math.ceil(1 / moveDef.timeSlowFactor))
  }

  // -- Impact phase: apply damage -----------------------------------------------
  if (sp.fxPhase === 'impact') {
    const isFirstImpactFrame = prevPhase === 'enter'

    if (isAreaSpecial(sp.moveId)) {
      // AoE (raiun): hit all enemies within hitboxRadius on the first impact frame
      if (isFirstImpactFrame) {
        for (const entity of Object.values(entities)) {
          if (entity.id === player.id) continue
          if (entity.team === player.team) continue
          if (sp.alreadyHit.includes(entity.id)) continue

          const dist = vec3Dist(player.position, entity.position)
          if (dist <= moveDef.hitboxRadius) {
            sp.alreadyHit.push(entity.id)
            applySpecialHit(player, entity, moveDef.damage, moveDef.knockback, moveDef.hitstopFrames, frame)
          }
        }
        AudioSystem.playHitCrit()
      }
    } else if (isRushSpecial(sp.moveId)) {
      // Rush (bakuretsu_rush): deliver up to 5 hits spread across the impact window
      const impactWindowLength = impactEnd - enterEnd
      const maxHits = 5
      const hitInterval = Math.max(1, Math.floor(impactWindowLength / maxHits))
      const frameInImpact = sp.frameCount - enterEnd

      const shouldHit =
        sp.rushHitCount < maxHits &&
        frameInImpact > 0 &&
        (isFirstImpactFrame || frameInImpact % hitInterval === 0)

      if (shouldHit) {
        const target = nearestEnemyInFront(player, entities)
        if (target) {
          const hitDamage = Math.ceil(moveDef.damage / maxHits)
          sp.rushHitCount++
          applySpecialHit(player, target, hitDamage, moveDef.knockback, moveDef.hitstopFrames, frame)

          if (sp.rushHitCount >= maxHits) {
            sp.alreadyHit.push(target.id)
            AudioSystem.playHitCrit()
          } else {
            AudioSystem.playHitLight()
          }
        }
      }
    } else {
      // Single-target (kaminari_ken etc.): hit nearest enemy in front arc once
      if (isFirstImpactFrame) {
        const target = nearestEnemyInFront(player, entities)
        if (target && !sp.alreadyHit.includes(target.id)) {
          const dist = vec3Dist(player.position, target.position)
          if (dist <= moveDef.hitboxRadius) {
            sp.alreadyHit.push(target.id)
            applySpecialHit(player, target, moveDef.damage, moveDef.knockback, moveDef.hitstopFrames, frame)
            AudioSystem.playHitCrit()
          }
        }
      }
    }
  }

  // -- End: restore normal simulation, return player FSM to IDLE ----------------
  if (sp.frameCount >= moveDef.duration) {
    const { updateFsm } = useCombatStore.getState()
    updateFsm('player', {
      state: 'IDLE',
      frameCount: 0,
      currentMoveId: null,
      hitId: null,
      alreadyHit: [],
      comboStep: 0,
    })

    activeSpecial = null
  }
}

/**
 * Return the currently executing SpecialState, or null if no special is active.
 * The render layer polls this each frame to drive FX phases (glow, beam, flash).
 */
export function getActiveSpecial(): SpecialState | null {
  return activeSpecial
}

/**
 * Return the list of special move ids that the player has unlocked.
 * 'kaminari_ken' (unlockCondition: 'default') is always in unlockedSpecials from start.
 */
export function getAvailableSpecials(): string[] {
  const { unlockedSpecials } = useProgressStore.getState()
  return unlockedSpecials.filter((id) => id in SPECIAL_MOVES)
}
