import { spawnEntity } from '@/entities/registry'
import { ENEMY_CATALOG, makeEnemyEntity } from '@/data/enemies/allEnemies'

let counter = 0

/**
 * Spawn a specific enemy by its catalog id at the given (x, z) position.
 * Returns the spawned entity id.
 */
export function spawnEnemy(defId: string, x: number, z: number): string {
  const def = ENEMY_CATALOG[defId]
  if (!def) {
    // Fallback to a generic grunt if the id is unknown
    const fallbackDef = ENEMY_CATALOG['chimp_0']
    const id = `enemy_${defId}_${counter++}`
    if (fallbackDef) {
      spawnEntity(makeEnemyEntity(id, fallbackDef, { x, y: 0, z }))
    }
    return id
  }
  const id = `enemy_${defId}_${counter++}`
  spawnEntity(makeEnemyEntity(id, def, { x, y: 0, z }))
  return id
}

/**
 * Spawn a number of random grunt-tier enemies from the given district.
 * Picks enemies using their spawnWeight as a probability weight.
 */
export function spawnDistrictEnemies(districtId: number, count: number): void {
  // Collect all non-boss enemies for this district
  const pool = Object.values(ENEMY_CATALOG).filter(
    (def) => def.district === districtId && !def.isBoss,
  )
  if (pool.length === 0) return

  // Total weight for weighted random selection
  const totalWeight = pool.reduce((acc, def) => acc + def.spawnWeight, 0)

  // Spread positions around the arena
  const spreadRadius = 8
  for (let i = 0; i < count; i++) {
    // Weighted random pick
    let rand = Math.random() * totalWeight
    let chosen = pool[0]
    for (const def of pool) {
      rand -= def.spawnWeight
      if (rand <= 0) {
        chosen = def
        break
      }
    }

    // Distribute enemies evenly around the player's starting area
    const angle = (i / count) * Math.PI * 2
    const x = Math.cos(angle) * spreadRadius
    const z = Math.sin(angle) * spreadRadius

    spawnEnemy(chosen.id, x, z)
  }
}

// ─── Legacy shims (imported by App.tsx in older versions) ────────────────────
// Keep for backwards-compatibility; callers should migrate to spawnEnemy/spawnDistrictEnemies

export function spawnGrunt(x: number, z: number): string {
  return spawnEnemy('chimp_0', x, z)
}

export function spawnBanchou(x: number, z: number): string {
  return spawnEnemy('goki_yuji', x, z)
}
