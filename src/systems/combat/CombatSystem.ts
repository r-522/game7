import { useCombatStore } from '@/state/useCombatStore'
import { usePlayerStore } from '@/state/usePlayerStore'
import { InputSystem } from '@/systems/input/InputSystem'
import { MOVE_TABLE, COMBO_CHAIN } from '@/data/moves/moveTable'
import { newHitId } from '@/systems/combat/HitId'
import type { EntityData, CombatStateId } from '@/types'

const MOVE_SPEED = 4.0
const DODGE_SPEED = 6.0
const THROW_RANGE = 2.0
const BLOCK_DAMAGE_MUL = 0.3  // block reduces damage to 30 % (70 % reduction)
const GRAVITY = -15
const KNOCKBACK_DECAY = 0.8

// ─── Kiai grants ─────────────────────────────────────────────────────────────
const KIAI_HIT_LIGHT = 8
const KIAI_HIT_HEAVY = 15
const KIAI_TAKE_HIT = 5
const KIAI_SPECIAL_COST = 100

// ─── helpers ─────────────────────────────────────────────────────────────────

function nearestEnemyDist(playerId: string, entities: Record<string, EntityData>): number {
  const player = entities[playerId]
  if (!player) return Infinity
  let best = Infinity
  for (const e of Object.values(entities)) {
    if (e.id === playerId) continue
    if (e.team === player.team) continue
    const dx = e.position.x - player.position.x
    const dz = e.position.z - player.position.z
    const d = Math.sqrt(dx * dx + dz * dz)
    if (d < best) best = d
  }
  return best
}

// ─── per-entity FSM advance ───────────────────────────────────────────────────

function advanceEntity(entity: EntityData, dt: number, frame: number): Partial<EntityData> {
  const { hitstopFrames, entities } = useCombatStore.getState()
  const frozen = hitstopFrames > 0

  const fsm = {
    ...entity.fsm,
    frameCount: frozen ? entity.fsm.frameCount : entity.fsm.frameCount + 1,
  }
  const fc = fsm.frameCount

  const { position, rotation: rot } = entity
  let { velocity } = entity
  let rotation = rot

  // Physics — gravity + horizontal knockback decay
  const vy = Math.max(velocity.y + GRAVITY * dt, -20)
  const vx = velocity.x * KNOCKBACK_DECAY
  const vz = velocity.z * KNOCKBACK_DECAY

  const newPos = {
    x: position.x + vx * dt,
    y: Math.max(0, position.y + vy * dt),
    z: position.z + vz * dt,
  }
  if (newPos.y <= 0) {
    velocity = { x: vx, y: 0, z: vz }
    newPos.y = 0
  } else {
    velocity = { x: vx, y: vy, z: vz }
  }

  let nextState: CombatStateId = fsm.state

  if (!frozen) {
    switch (fsm.state) {

      // ── IDLE / LOCOMOTION ────────────────────────────────────────────────
      case 'IDLE':
      case 'LOCOMOTION': {
        if (entity.team === 'PLAYER') {
          const input = InputSystem.getSnapshot()
          const moving = Math.abs(input.move.x) > 0.01 || Math.abs(input.move.z) > 0.01
          nextState = moving ? 'LOCOMOTION' : 'IDLE'

          if (moving) {
            newPos.x += input.move.x * MOVE_SPEED * dt
            newPos.z += input.move.z * MOVE_SPEED * dt
            rotation = Math.atan2(-input.move.x, -input.move.z)
          }

          // Priority: special > throw > heavy > light > dodge > block
          if (input.special) {
            // Requires full kiai gauge
            const { kiai } = usePlayerStore.getState()
            if (kiai >= KIAI_SPECIAL_COST) {
              usePlayerStore.getState().useKiai(KIAI_SPECIAL_COST)
              nextState = 'SPECIAL'
              fsm.currentMoveId = 'kaminari_ken'  // default special; can be swapped by unlocks
              fsm.hitId = newHitId()
              fsm.alreadyHit = []
              fsm.frameCount = 0
              fsm.comboStep = 0
            }
          } else if (input.throwAttack) {
            // Throw requires target within THROW_RANGE
            const dist = nearestEnemyDist(entity.id, entities)
            if (dist <= THROW_RANGE) {
              nextState = 'THROW'
              fsm.currentMoveId = 'throw1'
              fsm.hitId = newHitId()
              fsm.alreadyHit = []
              fsm.frameCount = 0
              fsm.comboStep = 0
            }
          } else if (input.attackHeavy) {
            nextState = 'ATTACK_HEAVY'
            fsm.currentMoveId = 'heavy1'
            fsm.hitId = newHitId()
            fsm.alreadyHit = []
            fsm.frameCount = 0
            fsm.comboStep = 0
          } else if (input.attackLight) {
            nextState = 'ATTACK_LIGHT'
            fsm.currentMoveId = 'light1'
            fsm.hitId = newHitId()
            fsm.alreadyHit = []
            fsm.frameCount = 0
            fsm.comboStep = 0
          } else if (input.dodge) {
            nextState = 'DODGE'
            fsm.currentMoveId = 'dodge'
            fsm.frameCount = 0
          } else if (input.block) {
            nextState = 'BLOCK'
            fsm.currentMoveId = null
            fsm.frameCount = 0
          }
        }
        break
      }

      // ── ATTACK_LIGHT ──────────────────────────────────────────────────────
      case 'ATTACK_LIGHT': {
        const move = MOVE_TABLE[fsm.currentMoveId ?? '']
        if (!move) { nextState = 'IDLE'; break }
        const total = move.startup + move.active + move.recovery

        // Cancel window: allow chaining to next light or branching to heavy/dodge
        if (entity.team === 'PLAYER') {
          const cancelStart = move.startup + move.active + move.cancelWindow
          if (fc >= cancelStart) {
            const input = InputSystem.getSnapshot()
            if (input.attackLight && move.cancelInto.includes('ATTACK_LIGHT')) {
              const nextMoveId = COMBO_CHAIN[fsm.currentMoveId ?? ''] ?? 'light1'
              fsm.comboStep = (fsm.comboStep + 1) % 3
              fsm.currentMoveId = nextMoveId
              fsm.hitId = newHitId()
              fsm.alreadyHit = []
              fsm.frameCount = 0
              nextState = 'ATTACK_LIGHT'
              break
            } else if (input.attackHeavy && move.cancelInto.includes('ATTACK_HEAVY')) {
              fsm.currentMoveId = 'heavy1'
              fsm.hitId = newHitId()
              fsm.alreadyHit = []
              fsm.frameCount = 0
              fsm.comboStep = 0
              nextState = 'ATTACK_HEAVY'
              break
            } else if (input.dodge && move.cancelInto.includes('DODGE')) {
              fsm.currentMoveId = 'dodge'
              fsm.frameCount = 0
              nextState = 'DODGE'
              break
            }
          }
        }

        if (fc >= total) {
          nextState = 'IDLE'
          fsm.currentMoveId = null
          fsm.hitId = null
          fsm.alreadyHit = []
          fsm.comboStep = 0
        }
        break
      }

      // ── ATTACK_HEAVY ──────────────────────────────────────────────────────
      case 'ATTACK_HEAVY': {
        const move = MOVE_TABLE[fsm.currentMoveId ?? '']
        if (!move) { nextState = 'IDLE'; break }
        const total = move.startup + move.active + move.recovery

        // Chain heavy1 -> heavy2 in cancel window
        if (entity.team === 'PLAYER') {
          const cancelStart = move.startup + move.active + move.cancelWindow
          if (fc >= cancelStart && move.cancelInto.includes('ATTACK_HEAVY')) {
            const input = InputSystem.getSnapshot()
            if (input.attackHeavy) {
              const nextMoveId = COMBO_CHAIN[fsm.currentMoveId ?? ''] ?? 'heavy1'
              fsm.currentMoveId = nextMoveId
              fsm.hitId = newHitId()
              fsm.alreadyHit = []
              fsm.frameCount = 0
              nextState = 'ATTACK_HEAVY'
              break
            } else if (input.dodge && move.cancelInto.includes('DODGE')) {
              fsm.currentMoveId = 'dodge'
              fsm.frameCount = 0
              nextState = 'DODGE'
              break
            }
          }
        }

        if (fc >= total) {
          nextState = 'IDLE'
          fsm.currentMoveId = null
          fsm.hitId = null
          fsm.alreadyHit = []
          fsm.comboStep = 0
        }
        break
      }

      // ── SPECIAL ───────────────────────────────────────────────────────────
      case 'SPECIAL': {
        const move = MOVE_TABLE[fsm.currentMoveId ?? '']
        if (!move) { nextState = 'IDLE'; break }
        const total = move.startup + move.active + move.recovery
        if (fc >= total) {
          nextState = 'IDLE'
          fsm.currentMoveId = null
          fsm.hitId = null
          fsm.alreadyHit = []
          fsm.comboStep = 0
        }
        break
      }

      // ── THROW ─────────────────────────────────────────────────────────────
      case 'THROW': {
        const move = MOVE_TABLE[fsm.currentMoveId ?? '']
        if (!move) { nextState = 'IDLE'; break }
        const total = move.startup + move.active + move.recovery
        if (fc >= total) {
          nextState = 'IDLE'
          fsm.currentMoveId = null
          fsm.hitId = null
          fsm.alreadyHit = []
        }
        break
      }

      // ── DODGE ─────────────────────────────────────────────────────────────
      case 'DODGE': {
        const move = MOVE_TABLE['dodge']
        const total = move.startup + move.active + move.recovery
        // Invulnerability is tracked via invulnUntilFrame (set at dodge entry, see note below)
        // Dash forward
        newPos.x += -Math.sin(rotation) * DODGE_SPEED * dt
        newPos.z += -Math.cos(rotation) * DODGE_SPEED * dt

        // Cancel into light after active frames
        if (entity.team === 'PLAYER') {
          const cancelStart = move.startup + move.active + move.cancelWindow
          if (fc >= cancelStart && move.cancelInto.includes('ATTACK_LIGHT')) {
            const input = InputSystem.getSnapshot()
            if (input.attackLight) {
              fsm.currentMoveId = 'light1'
              fsm.hitId = newHitId()
              fsm.alreadyHit = []
              fsm.frameCount = 0
              fsm.comboStep = 0
              nextState = 'ATTACK_LIGHT'
              break
            }
          }
        }

        if (fc >= total) nextState = 'IDLE'
        break
      }

      // ── BLOCK ─────────────────────────────────────────────────────────────
      case 'BLOCK': {
        if (entity.team === 'PLAYER') {
          const input = InputSystem.getSnapshot()
          // Hold C to maintain block; release exits
          if (!input.block) {
            nextState = 'IDLE'
            fsm.currentMoveId = null
          }
          // Parry window: first 1-4 frames of a hit landing trigger PARRY
          // (PARRY entry is handled in HitResolution when block is active at hit time)
        }
        break
      }

      // ── PARRY ─────────────────────────────────────────────────────────────
      case 'PARRY': {
        const move = MOVE_TABLE['parry']
        const total = move.startup + move.active + move.recovery
        // In cancel window, allow counter attack
        if (entity.team === 'PLAYER') {
          const cancelStart = move.startup + move.active + move.cancelWindow
          if (fc >= cancelStart) {
            const input = InputSystem.getSnapshot()
            if (input.attackLight && move.cancelInto.includes('ATTACK_LIGHT')) {
              fsm.currentMoveId = 'light1'
              fsm.hitId = newHitId()
              fsm.alreadyHit = []
              fsm.frameCount = 0
              nextState = 'ATTACK_LIGHT'
              break
            } else if (input.attackHeavy && move.cancelInto.includes('ATTACK_HEAVY')) {
              fsm.currentMoveId = 'heavy1'
              fsm.hitId = newHitId()
              fsm.alreadyHit = []
              fsm.frameCount = 0
              nextState = 'ATTACK_HEAVY'
              break
            }
          }
        }
        if (fc >= total) {
          nextState = 'IDLE'
          fsm.currentMoveId = null
        }
        break
      }

      // ── HIT_REACT ─────────────────────────────────────────────────────────
      case 'HIT_REACT': {
        // Award kiai to player for taking a hit (rage fuels fighting spirit)
        if (entity.team === 'PLAYER' && fc === 1) {
          usePlayerStore.getState().addKiai(KIAI_TAKE_HIT)
        }
        if (fc >= 20) nextState = 'IDLE'
        break
      }

      // ── KO ───────────────────────────────────────────────────────────────
      case 'KO': {
        // Permanent until encounter ends — no transitions
        break
      }
    }
  }

  // Set invuln frames at dodge entry (frame 0 of DODGE state)
  let invulnUntilFrame = entity.invulnUntilFrame
  if (nextState === 'DODGE' && fsm.state !== 'DODGE' && fc === 0) {
    const dodgeMove = MOVE_TABLE['dodge']
    invulnUntilFrame = frame + dodgeMove.active  // 10 invuln frames
  }

  return {
    position: newPos,
    rotation,
    velocity,
    invulnUntilFrame,
    fsm: { ...fsm, state: nextState } as EntityData['fsm'],
    globalFrame: frame,
  }
}

// ─── Exported system tick ─────────────────────────────────────────────────────

export function CombatSystem(dt: number, frame: number): void {
  const { entities, hitstopFrames, tickHitstop, setEntity } = useCombatStore.getState()

  if (hitstopFrames > 0) {
    tickHitstop()
    return
  }

  for (const entity of Object.values(entities)) {
    const patch = advanceEntity(entity, dt, frame)
    setEntity({ ...entity, ...patch } as EntityData)
  }

  // Sync player HP from combat entity into player store
  const playerEntity = useCombatStore.getState().entities['player']
  if (playerEntity) {
    const playerStore = usePlayerStore.getState()
    if (playerStore.hp !== playerEntity.hp) {
      usePlayerStore.setState({ hp: playerEntity.hp })
    }
  }
}

// ─── Kiai grant helpers (called by HitResolution after hit confirmed) ─────────

export const KIAI_GRANT = {
  hitLight: KIAI_HIT_LIGHT,
  hitHeavy: KIAI_HIT_HEAVY,
  takeDamage: KIAI_TAKE_HIT,
  BLOCK_DAMAGE_MUL,
}
