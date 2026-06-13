import { useEncounterStore } from '@/state/useEncounterStore'
import { useUIStore } from '@/state/useUIStore'
import { usePlayerStore } from '@/state/usePlayerStore'
import { useCombatStore } from '@/state/useCombatStore'
import { useWorldStore } from '@/state/useWorldStore'
import { useProgressStore } from '@/state/useProgressStore'
import { EventBus } from '@/core/events/EventBus'
import { MENCHI_TABLE, MENCHI_ADVANTAGE, getRandomMenchiType } from '@/data/menchiTypes'
import { getRandomTanka } from '@/data/tankaLines'
import { BANCHOU_TABLE, CHAPTERS } from '@/data/story/chapters'
import { AudioSystem } from '@/systems/audio/AudioSystem'
import type { MenchiType } from '@/types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ENCOUNTER_RANGE = 5.0

// ---------------------------------------------------------------------------
// Module-level state (subscribe once, persist across ticks)
// ---------------------------------------------------------------------------

let unsubKO: (() => void) | null = null

// ---------------------------------------------------------------------------
// Banchou helpers
// ---------------------------------------------------------------------------

/** True if the given entity id belongs to a banchou definition */
function isBanchouEntity(entityId: string): boolean {
  return BANCHOU_TABLE.some(b => b.id === entityId)
}

/** Return the special move id to unlock when this banchou is defeated, or null */
function specialMoveForBanchou(entityId: string): string | null {
  const def = BANCHOU_TABLE.find(b => b.id === entityId)
  return def?.specialMoveUnlock ?? null
}

/** Return the banchou display name for a given entity id, or null */
function banchouNameFor(entityId: string): string | null {
  const def = BANCHOU_TABLE.find(b => b.id === entityId)
  return def ? `${def.title} ${def.name}` : null
}

// ---------------------------------------------------------------------------
// Otokogi delta calculator
// Spec:
//   Win normally                        : +10
//   Win with first strike (both won)    : +15
//   Win after losing tanka              : +8
//   Defeat                              : -8
//   Retreat (skip encounter)            : -15
// ---------------------------------------------------------------------------

function calcOtokogi(
  win: boolean,
  firstStrike: 'PLAYER' | 'ENEMY' | 'NONE',
  tankaResult: 'NONE' | 'WIN' | 'LOSE',
): number {
  if (!win) return -8
  // Both menchi and tanka won → first strike = PLAYER → bonus win
  if (firstStrike === 'PLAYER') return 15
  // Won fight but lost tanka earlier
  if (tankaResult === 'LOSE') return 8
  return 10
}

// ---------------------------------------------------------------------------
// District cleared check
// ---------------------------------------------------------------------------

/**
 * Returns true if every enemy entity in the combat registry has been marked
 * as defeated in the world store.
 */
export function checkDistrictCleared(): boolean {
  const { entities } = useCombatStore.getState()
  const { defeatedEnemyIds } = useWorldStore.getState()

  for (const entity of Object.values(entities)) {
    if (entity.team !== 'ENEMY') continue
    if (!defeatedEnemyIds.includes(entity.id)) return false
  }
  return true
}

// ---------------------------------------------------------------------------
// Story advancement
// ---------------------------------------------------------------------------

function advanceStoryIfApplicable(): void {
  const progress = useProgressStore.getState()

  const chapter = CHAPTERS.find(c => c.id === `ch0${progress.currentChapter}`)
  if (!chapter) return

  const allBanchouDefeated = chapter.requiredBanchouIds.every(id =>
    progress.defeatedBanchous.includes(id)
  )

  if (!allBanchouDefeated) return

  const chapterCompleteFlag = `flag_ch0${progress.currentChapter}_complete`
  if (progress.flags[chapterCompleteFlag]) return

  progress.setFlag(chapterCompleteFlag, true)

  // Advance to next chapter if one exists
  const nextChapterNum = progress.currentChapter + 1
  if (nextChapterNum <= CHAPTERS.length) {
    progress.setChapter(nextChapterNum)
    const nextChapter = CHAPTERS.find(c => c.id === `ch0${nextChapterNum}`)
    if (nextChapter) {
      progress.setDistrict(nextChapter.unlocksDistrict)
    }
  }
}

// ---------------------------------------------------------------------------
// KO handler — attached once via ensureKOSubscription
// ---------------------------------------------------------------------------

function ensureKOSubscription(): void {
  if (unsubKO) return

  unsubKO = EventBus.on('KO', ({ entityId }) => {
    const enc = useEncounterStore.getState()
    if (enc.phase !== 'FIGHT') return

    const isEnemyKO = entityId === enc.enemyEntityId
    const isPlayerKO = entityId === 'player'

    if (isEnemyKO) {
      const enemyId = enc.enemyEntityId as string
      const isBanchou = isBanchouEntity(enemyId)

      const otokogiDelta = calcOtokogi(true, enc.firstStrike, enc.tankaResult)
      // Boss fights reward more XP
      const xp = isBanchou ? 200 : 50

      usePlayerStore.getState().addOtokogi(otokogiDelta)
      usePlayerStore.getState().addXp(xp)
      useWorldStore.getState().markDefeated(enemyId)
      useEncounterStore.getState().setResult(true, otokogiDelta, xp)
      useUIStore.getState().setScreen('RESULT')
      EventBus.emit('ENCOUNTER_END', { win: true, otokogiDelta, xp })

      // Banchou-specific: record defeat and unlock special move
      if (isBanchou) {
        useProgressStore.getState().defeatBanchou(enemyId)
        const specialId = specialMoveForBanchou(enemyId)
        if (specialId) {
          useProgressStore.getState().unlockSpecial(specialId)
        }
        advanceStoryIfApplicable()
      }

      // Notify if the entire district is now cleared
      if (checkDistrictCleared()) {
        EventBus.emit('ENCOUNTER_END', { win: true, otokogiDelta: 0, xp: 0 })
      }

      AudioSystem.stopBGM()
      AudioSystem.playVictory()
    } else if (isPlayerKO) {
      const otokogiDelta = -8
      useEncounterStore.getState().setResult(false, otokogiDelta, 0)
      usePlayerStore.getState().addOtokogi(otokogiDelta)
      useUIStore.getState().setScreen('RESULT')
      EventBus.emit('ENCOUNTER_END', { win: false, otokogiDelta, xp: 0 })

      AudioSystem.stopBGM()
      AudioSystem.playDefeat()
    }
  })
}

// ---------------------------------------------------------------------------
// startEncounter — internal
// ---------------------------------------------------------------------------

function startEncounter(enemyId: string, _frame: number): void {
  const { entities } = useCombatStore.getState()
  const enemy = entities[enemyId]
  if (!enemy) return

  const isBanchou = isBanchouEntity(enemyId)
  const enemyName = banchouNameFor(enemyId) ?? 'チンピラ'

  useEncounterStore.getState().startEncounter(enemyId, enemyName)
  useUIStore.getState().setScreen('MENCHI')
  EventBus.emit('ENCOUNTER_START', { enemyId, enemyName })

  // Persist banchou flag so resolveTanka can pick the right BGM
  useProgressStore.getState().setFlag('_current_encounter_is_banchou', isBanchou)

  AudioSystem.playMenchiBeam()
  AudioSystem.stopBGM()
  AudioSystem.startBGM('menchi')
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Main per-tick update. Call once per fixed step from the scheduler.
 * @param _dt  Fixed delta time (unused; frame counter is authoritative)
 * @param frame Current global frame counter
 */
export function EncounterSystem(_dt: number, frame: number): void {
  ensureKOSubscription()

  const encounter = useEncounterStore.getState()
  if (encounter.phase !== 'ROAM') return

  const { entities } = useCombatStore.getState()
  const player = entities['player']
  if (!player) return

  const { defeatedEnemyIds } = useWorldStore.getState()

  for (const entity of Object.values(entities)) {
    if (entity.team !== 'ENEMY') continue
    if (entity.hp <= 0) continue
    if (defeatedEnemyIds.includes(entity.id)) continue

    const dx = player.position.x - entity.position.x
    const dz = player.position.z - entity.position.z
    const distSq = dx * dx + dz * dz

    if (distSq < ENCOUNTER_RANGE * ENCOUNTER_RANGE) {
      startEncounter(entity.id, frame)
      break
    }
  }
}

/**
 * Player has selected a menchi type. Resolve the menchi phase and advance
 * to the tanka phase.
 */
export function resolveMenchi(playerType: MenchiType): void {
  const enemyType = getRandomMenchiType()
  const playerDef = MENCHI_TABLE[playerType]
  const enemyDef = MENCHI_TABLE[enemyType]

  let power = 50 + playerDef.powerBonus - enemyDef.powerBonus
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

  const tanka = getRandomTanka()
  useUIStore.getState().setTankaData(tanka.setup, tanka.options, tanka.correctIndex)
  useEncounterStore.getState().setPhase('TANKA')
  useUIStore.getState().setScreen('TANKA')
}

/**
 * Player has chosen a tanka response option. Resolve tanka, determine first
 * strike, and transition into the FIGHT phase.
 */
export function resolveTanka(chosenIndex: number): void {
  const enc = useEncounterStore.getState()
  const correct = chosenIndex === useUIStore.getState().tankaCorrectIndex
  useEncounterStore.getState().setTankaResult(correct)
  EventBus.emit('TANKA_RESULT', { correct })

  const menchiWon = (enc.menchiPower ?? 50) >= 50
  let firstStrike: 'PLAYER' | 'ENEMY' | 'NONE' = 'NONE'
  if (correct && menchiWon) firstStrike = 'PLAYER'
  else if (!correct && !menchiWon) firstStrike = 'ENEMY'
  else firstStrike = menchiWon ? 'PLAYER' : 'ENEMY'

  useEncounterStore.getState().setFirstStrike(firstStrike)
  useEncounterStore.getState().setPhase('FIGHT')
  useUIStore.getState().setScreen('GAME')
  EventBus.emit('FIGHT_START', { firstStrike })

  // Select BGM: boss track for banchou fights, regular fight track otherwise
  const isBanchou = useProgressStore.getState().flags['_current_encounter_is_banchou'] === true
  AudioSystem.stopBGM()
  AudioSystem.startBGM(isBanchou ? 'boss' : 'fight')
}

/**
 * Begin the roaming phase. Call after a result screen is dismissed or on
 * scene load.
 */
export function startRoam(): void {
  useEncounterStore.getState().setPhase('ROAM')
  useUIStore.getState().setScreen('GAME')

  AudioSystem.stopBGM()
  AudioSystem.startBGM('roam')
}

/**
 * Force-start a boss encounter for the given banchou id. Used by story
 * scripting and debug tools.
 */
export function triggerBossEncounter(banchouId: string): void {
  ensureKOSubscription()

  const { entities } = useCombatStore.getState()
  const { defeatedEnemyIds } = useWorldStore.getState()

  // Guard: already defeated
  if (defeatedEnemyIds.includes(banchouId)) return

  // Guard: already in an active encounter
  const enc = useEncounterStore.getState()
  if (enc.phase !== 'ROAM' && enc.phase !== 'NONE') return

  if (!entities[banchouId]) {
    // Entity not yet spawned — set encounter state directly
    const enemyName = banchouNameFor(banchouId) ?? banchouId
    useEncounterStore.getState().startEncounter(banchouId, enemyName)
    useUIStore.getState().setScreen('MENCHI')
    EventBus.emit('ENCOUNTER_START', { enemyId: banchouId, enemyName })
    useProgressStore.getState().setFlag('_current_encounter_is_banchou', true)

    AudioSystem.playMenchiBeam()
    AudioSystem.stopBGM()
    AudioSystem.startBGM('menchi')
    return
  }

  startEncounter(banchouId, 0)
}
