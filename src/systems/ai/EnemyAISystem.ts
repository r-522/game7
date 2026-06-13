import { useCombatStore } from '@/state/useCombatStore'
import { useEncounterStore } from '@/state/useEncounterStore'
import { newHitId } from '@/systems/combat/HitId'
import { vec3Dist } from '@/core/math/pools'
import type { EntityData, EntityId, Vec3 } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AiBehavior = 'PATROL' | 'CHASE' | 'ATTACK' | 'RETREAT' | 'CIRCLE' | 'STUNNED'
type EnemyRole = 'GRUNT' | 'SUB_BANCHOU' | 'BOSS'

interface AiData {
  behavior: AiBehavior
  patrolTarget: Vec3
  aggroRange: number
  attackRange: number
  /** Frames remaining until next attack attempt */
  attackCooldown: number
  /** Frames remaining in retreat */
  retreatTimer: number
  /** Current angle (radians) for circling motion */
  circleAngle: number
  isBoss: boolean
  role: EnemyRole
  /** HP threshold that triggered BOSS_PHASE2 (set once, never reset) */
  phase2Triggered: boolean
  /** HP value recorded at last AI frame (detect taking damage) */
  lastHp: number
  /** Frames remaining in STUNNED state */
  stunnedTimer: number
  /** Base move speed before phase-2 bonus */
  baseMoveSpeed: number
  /** Base attack cooldown before phase-2 bonus */
  baseAttackCooldown: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FIXED_DT = 1 / 60

const PATROL_RADIUS = 6
const PATROL_ARRIVE_DIST = 0.5
const PATROL_TIMER_MIN = 120  // frames before picking new patrol target
const PATROL_TIMER_MAX = 300

const CIRCLE_RADIUS = 2.4
const CIRCLE_SPEED_GRUNT = 1.2         // rad/s
const CIRCLE_SPEED_SUB = 1.6
const CIRCLE_SPEED_BOSS = 1.4

const RETREAT_DURATION_FRAMES = 30

const STUN_LIGHT_FRAMES = 20
const STUN_HEAVY_FRAMES = 45

const BOSS_PHASE2_HP_RATIO = 0.5
const BOSS_PHASE2_SPEED_MUL = 1.3
const BOSS_PHASE2_COOLDOWN_MUL = 0.6

// Minimum separation between enemies so they don't stack
const ENEMY_SPREAD_DIST = 1.2
const ENEMY_SPREAD_FORCE = 0.08

// Per-role default values
const ROLE_DEFAULTS: Record<EnemyRole, { moveSpeed: number; aggroRange: number; attackRange: number; attackCooldown: number }> = {
  GRUNT:       { moveSpeed: 2.5, aggroRange: 8,  attackRange: 1.8, attackCooldown: 90 },
  SUB_BANCHOU: { moveSpeed: 3.0, aggroRange: 10, attackRange: 2.0, attackCooldown: 70 },
  BOSS:        { moveSpeed: 3.2, aggroRange: 14, attackRange: 2.2, attackCooldown: 55 },
}

// ---------------------------------------------------------------------------
// Module-level state (no per-frame allocation)
// ---------------------------------------------------------------------------

const aiMap = new Map<EntityId, AiData>()
/** Scratch counter for patrol timer per enemy */
const patrolTimers = new Map<EntityId, number>()

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialise AI data for a newly spawned enemy.
 * Call once from the entity spawn factory before the first EnemyAISystem tick.
 */
export function initEnemyAI(
  entityId: EntityId,
  isBoss: boolean,
  aggroRange: number,
  attackRange: number,
): void {
  const role: EnemyRole = isBoss ? 'BOSS' : 'GRUNT'
  const defaults = ROLE_DEFAULTS[role]
  aiMap.set(entityId, {
    behavior: 'PATROL',
    patrolTarget: { x: 0, y: 0, z: 0 },
    aggroRange,
    attackRange,
    attackCooldown: 0,
    retreatTimer: 0,
    circleAngle: Math.random() * Math.PI * 2,
    isBoss,
    role,
    phase2Triggered: false,
    lastHp: -1,
    stunnedTimer: 0,
    baseMoveSpeed: defaults.moveSpeed,
    baseAttackCooldown: defaults.attackCooldown,
  })
  patrolTimers.set(entityId, 0)
}

// ---------------------------------------------------------------------------
// Helper: random patrol target around a base position
// ---------------------------------------------------------------------------

function pickPatrolTarget(base: Vec3): Vec3 {
  const angle = Math.random() * Math.PI * 2
  const r = PATROL_RADIUS * (0.4 + Math.random() * 0.6)
  return {
    x: base.x + Math.cos(angle) * r,
    y: base.y,
    z: base.z + Math.sin(angle) * r,
  }
}

// ---------------------------------------------------------------------------
// Helper: compute spread offset so enemies don't all stand on same spot
// ---------------------------------------------------------------------------

function computeSpreadOffset(entity: EntityData, allEntities: Record<EntityId, EntityData>): Vec3 {
  let ox = 0
  let oz = 0
  for (const other of Object.values(allEntities)) {
    if (other.id === entity.id || other.team !== 'ENEMY' || other.hp <= 0) continue
    const dx = entity.position.x - other.position.x
    const dz = entity.position.z - other.position.z
    const dist = Math.sqrt(dx * dx + dz * dz)
    if (dist > 0 && dist < ENEMY_SPREAD_DIST) {
      const inv = (ENEMY_SPREAD_DIST - dist) / ENEMY_SPREAD_DIST
      ox += (dx / dist) * inv * ENEMY_SPREAD_FORCE
      oz += (dz / dist) * inv * ENEMY_SPREAD_FORCE
    }
  }
  return { x: ox, y: 0, z: oz }
}

// ---------------------------------------------------------------------------
// Helper: detect damage taken since last frame
// ---------------------------------------------------------------------------

function damageTaken(entity: EntityData, ai: AiData): number {
  if (ai.lastHp < 0) return 0
  return Math.max(0, ai.lastHp - entity.hp)
}

// ---------------------------------------------------------------------------
// Core per-entity update
// ---------------------------------------------------------------------------

function updateEnemy(
  entity: EntityData,
  allEntities: Record<EntityId, EntityData>,
  _frame: number,
): Partial<EntityData> {
  const encounter = useEncounterStore.getState()
  if (encounter.phase !== 'FIGHT') return {}

  const player = allEntities['player']
  if (!player || player.hp <= 0) return {}
  if (entity.hp <= 0 || entity.fsm.state === 'KO') return {}

  // Mid-animation states: do not override
  const fsmState = entity.fsm.state
  if (
    fsmState === 'ATTACK_LIGHT' ||
    fsmState === 'ATTACK_HEAVY' ||
    fsmState === 'THROW'
  ) return {}

  let ai = aiMap.get(entity.id)
  if (!ai) {
    // Fallback init if entity was registered before explicit initEnemyAI call
    initEnemyAI(entity.id, false, ROLE_DEFAULTS.GRUNT.aggroRange, ROLE_DEFAULTS.GRUNT.attackRange)
    ai = aiMap.get(entity.id)!
  }

  // --- Record HP snapshot ---
  const dmgThisFrame = damageTaken(entity, ai)
  ai.lastHp = entity.hp

  // --- Boss phase 2 transition ---
  const isBossPhase2 = ai.isBoss && !ai.phase2Triggered && entity.hp <= entity.maxHp * BOSS_PHASE2_HP_RATIO
  if (isBossPhase2) {
    ai.phase2Triggered = true
    ai.baseMoveSpeed *= BOSS_PHASE2_SPEED_MUL
    ai.baseAttackCooldown = Math.round(ai.baseAttackCooldown * BOSS_PHASE2_COOLDOWN_MUL)
  }

  const moveSpeed = ai.baseMoveSpeed
  const baseCooldown = ai.baseAttackCooldown

  // --- Effective role accounting for phase 2 promotion ---
  const effectiveRole: EnemyRole = ai.phase2Triggered ? 'BOSS' : ai.role

  // --- Player distance and direction (no heap alloc) ---
  const dist = vec3Dist(entity.position, player.position)
  const dx = player.position.x - entity.position.x
  const dz = player.position.z - entity.position.z
  const invDist = dist > 0.001 ? 1 / dist : 0
  const faceAngle = Math.atan2(dx, dz)

  // --- Tick cooldown ---
  if (ai.attackCooldown > 0) ai.attackCooldown--

  // --- Handle STUNNED expiry ---
  if (ai.behavior === 'STUNNED') {
    if (ai.stunnedTimer > 0) {
      ai.stunnedTimer--
      if (ai.stunnedTimer <= 0) {
        ai.behavior = dist <= ai.aggroRange ? 'CHASE' : 'PATROL'
      }
      return { rotation: faceAngle, fsm: { ...entity.fsm, state: 'HIT_REACT' } }
    }
  }

  // --- Damage reaction: trigger STUNNED or RETREAT ---
  if (dmgThisFrame > 0 && ai.behavior !== 'STUNNED' && ai.behavior !== 'RETREAT') {
    if (dmgThisFrame >= 20) {
      // Heavy hit → RETREAT
      ai.behavior = 'RETREAT'
      ai.retreatTimer = RETREAT_DURATION_FRAMES
    } else {
      // Light hit → STUNNED
      ai.behavior = 'STUNNED'
      ai.stunnedTimer = dmgThisFrame >= 10 ? STUN_HEAVY_FRAMES : STUN_LIGHT_FRAMES
      return { rotation: faceAngle, fsm: { ...entity.fsm, state: 'HIT_REACT' } }
    }
  }

  // --- Spread offset (multiple enemies) ---
  const spread = computeSpreadOffset(entity, allEntities)

  // --- New position accumulator ---
  let nx = entity.position.x
  let nz = entity.position.z
  let newRotation = entity.rotation
  let newFsmState = entity.fsm.state

  // --- Behavior FSM ---
  switch (ai.behavior) {

    // -----------------------------------------------------------------------
    case 'PATROL': {
      if (dist <= ai.aggroRange) {
        ai.behavior = 'CHASE'
        break
      }

      let pTimer = patrolTimers.get(entity.id) ?? 0
      pTimer--
      const patrolDist = vec3Dist(entity.position, ai.patrolTarget)
      if (pTimer <= 0 || patrolDist < PATROL_ARRIVE_DIST) {
        ai.patrolTarget = pickPatrolTarget(entity.position)
        pTimer = PATROL_TIMER_MIN + Math.floor(Math.random() * (PATROL_TIMER_MAX - PATROL_TIMER_MIN))
      }
      patrolTimers.set(entity.id, pTimer)

      const pdx = ai.patrolTarget.x - entity.position.x
      const pdz = ai.patrolTarget.z - entity.position.z
      const pd = Math.sqrt(pdx * pdx + pdz * pdz)
      if (pd > PATROL_ARRIVE_DIST) {
        const patrolSpeed = moveSpeed * 0.4
        nx += (pdx / pd) * patrolSpeed * FIXED_DT
        nz += (pdz / pd) * patrolSpeed * FIXED_DT
        newRotation = Math.atan2(pdx, pdz)
      }
      newFsmState = 'LOCOMOTION'
      break
    }

    // -----------------------------------------------------------------------
    case 'CHASE': {
      if (dist <= ai.attackRange) {
        // Transition into attack pattern based on role
        ai.behavior = effectiveRole === 'GRUNT' ? 'ATTACK' : 'CIRCLE'
        break
      }
      if (dist > ai.aggroRange * 1.4) {
        ai.behavior = 'PATROL'
        break
      }
      nx += dx * invDist * moveSpeed * FIXED_DT
      nz += dz * invDist * moveSpeed * FIXED_DT
      newRotation = faceAngle
      newFsmState = 'LOCOMOTION'
      break
    }

    // -----------------------------------------------------------------------
    case 'ATTACK': {
      newRotation = faceAngle

      if (dist > ai.attackRange * 1.5) {
        ai.behavior = 'CHASE'
        newFsmState = 'LOCOMOTION'
        break
      }

      if (ai.attackCooldown <= 0) {
        ai.attackCooldown = baseCooldown
        const useHeavy = effectiveRole !== 'GRUNT' && Math.random() < 0.3
        newFsmState = useHeavy ? 'ATTACK_HEAVY' : 'ATTACK_LIGHT'

        // After attack: grunts → STUNNED-less wait, sub/boss → CIRCLE
        if (effectiveRole !== 'GRUNT') {
          ai.behavior = 'CIRCLE'
        }

        return {
          rotation: faceAngle,
          fsm: {
            ...entity.fsm,
            state: newFsmState,
            currentMoveId: useHeavy ? 'heavy1' : 'light1',
            hitId: newHitId(),
            alreadyHit: [],
            frameCount: 0,
          },
        }
      } else {
        newFsmState = 'IDLE'
      }
      break
    }

    // -----------------------------------------------------------------------
    case 'CIRCLE': {
      newRotation = faceAngle

      // Orbit around the player
      const circleSpeed = effectiveRole === 'GRUNT'
        ? CIRCLE_SPEED_GRUNT
        : effectiveRole === 'SUB_BANCHOU'
          ? CIRCLE_SPEED_SUB
          : CIRCLE_SPEED_BOSS

      ai.circleAngle += circleSpeed * FIXED_DT
      const targetX = player.position.x + Math.cos(ai.circleAngle) * CIRCLE_RADIUS
      const targetZ = player.position.z + Math.sin(ai.circleAngle) * CIRCLE_RADIUS
      const circleDx = targetX - entity.position.x
      const circleDz = targetZ - entity.position.z
      const circleDist = Math.sqrt(circleDx * circleDx + circleDz * circleDz)
      if (circleDist > 0.05) {
        const cInv = 1 / circleDist
        nx += circleDx * cInv * moveSpeed * FIXED_DT
        nz += circleDz * cInv * moveSpeed * FIXED_DT
      }
      newFsmState = 'LOCOMOTION'

      // Attack from circle orbit if cooldown ready and in range
      if (ai.attackCooldown <= 0 && dist <= ai.attackRange * 1.2) {
        ai.attackCooldown = baseCooldown
        const useHeavy = effectiveRole === 'BOSS' && Math.random() < 0.4
        ai.behavior = 'ATTACK'

        return {
          rotation: faceAngle,
          fsm: {
            ...entity.fsm,
            state: useHeavy ? 'ATTACK_HEAVY' : 'ATTACK_LIGHT',
            currentMoveId: useHeavy ? 'heavy1' : 'light1',
            hitId: newHitId(),
            alreadyHit: [],
            frameCount: 0,
          },
        }
      }

      // Boss phase 2: alternate ATTACK and CIRCLE by cooldown
      if (ai.phase2Triggered && ai.attackCooldown <= 0) {
        ai.behavior = 'ATTACK'
      }
      break
    }

    // -----------------------------------------------------------------------
    case 'RETREAT': {
      newRotation = faceAngle

      if (ai.retreatTimer > 0) {
        ai.retreatTimer--
        // Move directly away from player
        nx -= dx * invDist * moveSpeed * FIXED_DT * 1.2
        nz -= dz * invDist * moveSpeed * FIXED_DT * 1.2
        newFsmState = 'LOCOMOTION'
      } else {
        // Return to approach pattern
        ai.behavior = effectiveRole === 'GRUNT' ? 'CHASE' : 'CIRCLE'
        newFsmState = 'IDLE'
      }
      break
    }

    // -----------------------------------------------------------------------
    case 'STUNNED': {
      // Handled above; should not reach here again, but guard anyway
      newFsmState = 'HIT_REACT'
      break
    }
  }

  // --- Apply spread to avoid stacking ---
  nx += spread.x
  nz += spread.z

  // --- Guard world floor (y = 0) ---
  const ny = entity.position.y

  return {
    position: { x: nx, y: ny, z: nz },
    rotation: newRotation,
    fsm: { ...entity.fsm, state: newFsmState },
  }
}

// ---------------------------------------------------------------------------
// System entry point — called by Scheduler each fixed tick
// ---------------------------------------------------------------------------

export function EnemyAISystem(dt: number, frame: number): void {
  void dt // fixed-step; dt is informational; we use FIXED_DT constant internally

  const { entities, hitstopFrames, setEntity } = useCombatStore.getState()
  if (hitstopFrames > 0) return

  for (const entity of Object.values(entities)) {
    if (entity.team !== 'ENEMY') continue
    const patch = updateEnemy(entity, entities, frame)
    if (Object.keys(patch).length > 0) {
      setEntity({ ...entity, ...patch } as EntityData)
    }
  }
}
