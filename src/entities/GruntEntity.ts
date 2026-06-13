import { spawnEntity } from '@/entities/registry'
import { makeEnemyEntity, GRUNT_DEF, BANCHOU_DEF } from '@/data/enemies/grunt'

let counter = 0

export function spawnGrunt(x: number, z: number): string {
  const id = `grunt_${counter++}`
  spawnEntity(makeEnemyEntity(id, GRUNT_DEF, { x, y: 0, z }))
  return id
}

export function spawnBanchou(x: number, z: number): string {
  const id = `banchou_${counter++}`
  spawnEntity(makeEnemyEntity(id, BANCHOU_DEF, { x, y: 0, z }))
  return id
}
