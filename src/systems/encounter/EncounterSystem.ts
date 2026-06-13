import { useEncounterStore } from '@/state/useEncounterStore'
import { useUIStore } from '@/state/useUIStore'
import { usePlayerStore } from '@/state/usePlayerStore'
import { useCombatStore } from '@/state/useCombatStore'
import { useWorldStore } from '@/state/useWorldStore'
import { EventBus } from '@/core/events/EventBus'
import { MENCHI_TABLE, MENCHI_ADVANTAGE, getRandomMenchiType } from '@/data/menchiTypes'
import { getRandomTanka } from '@/data/tankaLines'
import type { MenchiType } from '@/types'

const ENCOUNTER_RANGE = 5.0

let unsubKO: (() => void) | null = null

export function EncounterSystem(_dt: number, frame: number): void {
  const encounter = useEncounterStore.getState()
  const { entities } = useCombatStore.getState()

  // Watch for KO events to end fight
  if (!unsubKO) {
    unsubKO = EventBus.on('KO', ({ entityId }) => {
      const enc = useEncounterStore.getState()
      if (enc.phase !== 'FIGHT') return
      const isEnemyKO = entityId === enc.enemyEntityId
      const isPlayerKO = entityId === 'player'

      if (isEnemyKO) {
        const otokogiDelta = calcOtokogi(true, enc.firstStrike)
        const xp = 50
        usePlayerStore.getState().addOtokogi(otokogiDelta)
        usePlayerStore.getState().addXp(xp)
        useWorldStore.getState().markDefeated(entityId)
        useEncounterStore.getState().setResult(true, otokogiDelta, xp)
        useUIStore.getState().setScreen('RESULT')
        EventBus.emit('ENCOUNTER_END', { win: true, otokogiDelta, xp })
      } else if (isPlayerKO) {
        useEncounterStore.getState().setResult(false, -10, 0)
        usePlayerStore.getState().addOtokogi(-10)
        useUIStore.getState().setScreen('RESULT')
        EventBus.emit('ENCOUNTER_END', { win: false, otokogiDelta: -10, xp: 0 })
      }
    })
  }

  if (encounter.phase !== 'ROAM') return

  // Check proximity to enemies
  const player = entities['player']
  if (!player) return

  for (const entity of Object.values(entities)) {
    if (entity.team !== 'ENEMY') continue
    if (entity.hp <= 0) continue
    if (useWorldStore.getState().defeatedEnemyIds.includes(entity.id)) continue

    const dx = player.position.x - entity.position.x
    const dz = player.position.z - entity.position.z
    const dist = Math.sqrt(dx * dx + dz * dz)

    if (dist < ENCOUNTER_RANGE) {
      startEncounter(entity.id, frame)
      break
    }
  }
}

function startEncounter(enemyId: string, _frame: number): void {
  const { entities } = useCombatStore.getState()
  const enemy = entities[enemyId]
  if (!enemy) return

  const enemyName = 'チンピラ'
  useEncounterStore.getState().startEncounter(enemyId, enemyName)
  useUIStore.getState().setScreen('MENCHI')
  EventBus.emit('ENCOUNTER_START', { enemyId, enemyName })
}

export function resolveMenchi(playerType: MenchiType): void {
  const enemyType = getRandomMenchiType()
  const playerDef = MENCHI_TABLE[playerType]
  const enemyDef = MENCHI_TABLE[enemyType]

  let power = 50 + playerDef.powerBonus - enemyDef.powerBonus
  // Advantage check
  if (MENCHI_ADVANTAGE[playerType] === enemyType) power += 20
  if (MENCHI_ADVANTAGE[enemyType] === playerType) power -= 20
  power = Math.max(5, Math.min(95, power))

  useEncounterStore.getState().setMenchiResult(playerType, enemyType, power)
  EventBus.emit('MENCHI_RESOLVE', {
    winner: power >= 50 ? 'PLAYER' : 'ENEMY',
    playerType,
    enemyType,
    power,
  })

  // Show tanka
  const tanka = getRandomTanka()
  useUIStore.getState().setTankaData(tanka.setup, tanka.options, tanka.correctIndex)
  useEncounterStore.getState().setPhase('TANKA')
  useUIStore.getState().setScreen('TANKA')
}

export function resolveTanka(chosenIndex: number): void {
  const enc = useEncounterStore.getState()
  const correct = chosenIndex === useUIStore.getState().tankaCorrectIndex
  useEncounterStore.getState().setTankaResult(correct)
  EventBus.emit('TANKA_RESULT', { correct })

  // Determine first strike
  const menchiWon = (enc.menchiPower ?? 50) >= 50
  let firstStrike: 'PLAYER' | 'ENEMY' | 'NONE' = 'NONE'
  if (correct && menchiWon) firstStrike = 'PLAYER'
  else if (!correct && !menchiWon) firstStrike = 'ENEMY'
  else firstStrike = menchiWon ? 'PLAYER' : 'ENEMY'

  useEncounterStore.getState().setFirstStrike(firstStrike)
  useEncounterStore.getState().setPhase('FIGHT')
  useUIStore.getState().setScreen('GAME')
  EventBus.emit('FIGHT_START', { firstStrike })
}

function calcOtokogi(win: boolean, firstStrike: 'PLAYER' | 'ENEMY' | 'NONE'): number {
  if (!win) return -5
  let delta = 10
  if (firstStrike === 'PLAYER') delta += 5
  return delta
}

export function startRoam(): void {
  useEncounterStore.getState().setPhase('ROAM')
  useUIStore.getState().setScreen('GAME')
}
