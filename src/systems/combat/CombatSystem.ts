import { useCombatStore } from '@/state/useCombatStore'
import { usePlayerStore } from '@/state/usePlayerStore'
import { InputSystem } from '@/systems/input/InputSystem'
import { MOVE_TABLE, COMBO_CHAIN } from '@/data/moves/moveTable'
import { newHitId } from '@/systems/combat/HitId'
import type { EntityData, CombatStateId } from '@/types'

const MOVE_SPEED = 4.0
const DODGE_SPEED = 7.0
const GRAVITY = -15
const KNOCKBACK_DECAY = 0.8

function advanceEntity(entity: EntityData, dt: number, frame: number): Partial<EntityData> {
  const { hitstopFrames } = useCombatStore.getState()
  const frozen = hitstopFrames > 0

  const fsm = { ...entity.fsm, frameCount: frozen ? entity.fsm.frameCount : entity.fsm.frameCount + 1 }
  const fc = fsm.frameCount

  const { position } = entity
  let { velocity, rotation } = entity

  // Gravity + vertical velocity
  const vy = Math.max(velocity.y + GRAVITY * dt, -20)

  // Horizontal knockback decay
  const vx = velocity.x * KNOCKBACK_DECAY
  const vz = velocity.z * KNOCKBACK_DECAY

  // Apply velocity
  const newPos = {
    x: position.x + vx * dt,
    y: Math.max(0, position.y + vy * dt),
    z: position.z + vz * dt,
  }
  if (newPos.y <= 0) {
    newPos.y = 0
    velocity = { x: vx, y: 0, z: vz }
  } else {
    velocity = { x: vx, y: vy, z: vz }
  }

  let nextState: CombatStateId = fsm.state

  if (!frozen) {
    switch (fsm.state) {
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

          if (input.attackLight) {
            nextState = 'ATTACK_LIGHT'
            fsm.currentMoveId = 'light1'
            fsm.hitId = newHitId()
            fsm.alreadyHit = []
            fsm.frameCount = 0
          } else if (input.attackHeavy) {
            nextState = 'ATTACK_HEAVY'
            fsm.currentMoveId = 'heavy1'
            fsm.hitId = newHitId()
            fsm.alreadyHit = []
            fsm.frameCount = 0
          } else if (input.dodge) {
            nextState = 'DODGE'
            fsm.currentMoveId = 'dodge'
            fsm.frameCount = 0
          }
        }
        break
      }
      case 'ATTACK_LIGHT':
      case 'ATTACK_HEAVY': {
        const move = MOVE_TABLE[fsm.currentMoveId ?? '']
        if (!move) { nextState = 'IDLE'; break }
        const total = move.startup + move.active + move.recovery

        // Cancel window
        if (fc >= move.startup + move.active + move.cancelWindow && entity.team === 'PLAYER') {
          const input = InputSystem.getSnapshot()
          if (input.attackLight && move.cancelInto.includes('ATTACK_LIGHT')) {
            const nextMove = COMBO_CHAIN[fsm.currentMoveId ?? ''] ?? 'light1'
            fsm.currentMoveId = nextMove
            fsm.hitId = newHitId()
            fsm.alreadyHit = []
            fsm.frameCount = 0
            nextState = 'ATTACK_LIGHT'
            break
          }
        }

        if (fc >= total) {
          nextState = 'IDLE'
          fsm.currentMoveId = null
          fsm.hitId = null
          fsm.alreadyHit = []
        }
        break
      }
      case 'DODGE': {
        const move = MOVE_TABLE['dodge']
        const total = move.startup + move.active + move.recovery
        // Move forward during dodge
        newPos.x += -Math.sin(rotation) * DODGE_SPEED * dt
        newPos.z += -Math.cos(rotation) * DODGE_SPEED * dt
        if (fc >= total) nextState = 'IDLE'
        break
      }
      case 'HIT_REACT': {
        if (fc >= 20) nextState = 'IDLE'
        break
      }
      case 'KO': {
        // Stay KO
        break
      }
    }
  }

  return {
    position: newPos,
    rotation,
    velocity,
    fsm: { ...fsm, state: nextState, globalFrame: frame } as EntityData['fsm'],
    globalFrame: frame,
  }
}

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

  // Sync player HP from player entity
  const playerEntity = entities['player']
  if (playerEntity) {
    const playerStore = usePlayerStore.getState()
    if (playerStore.hp !== playerEntity.hp) {
      usePlayerStore.setState({ hp: playerEntity.hp })
    }
  }
}
