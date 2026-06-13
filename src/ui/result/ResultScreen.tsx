import { useEncounterStore } from '@/state/useEncounterStore'
import { usePlayerStore } from '@/state/usePlayerStore'
import { startRoam } from '@/systems/encounter/EncounterSystem'
import { useCombatStore } from '@/state/useCombatStore'
import { spawnGrunt } from '@/entities/GruntEntity'
import { spawnPlayer } from '@/entities/PlayerEntity'
import { getOtokogiRank } from '@/systems/progression/Otokogi'
import styles from './ResultScreen.module.css'

export function ResultScreen(): JSX.Element {
  const { resultWin, resultOtokogiDelta, resultXpGained, enemyName, firstStrike } =
    useEncounterStore()
  const { otokogi, banchouLevel, comboCount } = usePlayerStore()

  function handleContinue(): void {
    // Reset encounter + respawn world
    useEncounterStore.getState().reset()
    // Restore player HP
    useCombatStore.getState().removeEntity('player')
    useCombatStore
      .getState()
      .removeEntity(useEncounterStore.getState().enemyEntityId ?? '')
    spawnPlayer()
    // Spawn new enemies at different positions
    spawnGrunt(8, -5)
    spawnGrunt(-6, 8)
    startRoam()
  }

  const verdict = resultOtokogiDelta >= 0 ? 'シブイ！' : 'シャバい...'
  const verdictColor = resultOtokogiDelta >= 0 ? '#e8c040' : '#95a5a6'

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.resultLabel} style={{ color: resultWin ? '#e8c040' : '#e74c3c' }}>
          {resultWin ? '勝利！' : '敗北...'}
        </div>

        <div className={styles.verdict} style={{ color: verdictColor }}>
          {verdict}
        </div>

        {firstStrike === 'PLAYER' && (
          <div className={styles.bonus}>先制攻撃ボーナス！</div>
        )}

        <div className={styles.stats}>
          <div className={styles.row}>
            <span>相手</span>
            <span>{enemyName}</span>
          </div>
          <div className={styles.row}>
            <span>男気</span>
            <span style={{ color: resultOtokogiDelta >= 0 ? '#e8c040' : '#e74c3c' }}>
              {resultOtokogiDelta >= 0 ? '+' : ''}{resultOtokogiDelta} → {otokogi}
            </span>
          </div>
          <div className={styles.row}>
            <span>喧嘩慣れ</span>
            <span style={{ color: '#3498db' }}>+{resultXpGained} EXP</span>
          </div>
          <div className={styles.row}>
            <span>コンボ数</span>
            <span>{comboCount}コンボ</span>
          </div>
          <div className={styles.row}>
            <span>番長度</span>
            <span>Lv.{banchouLevel}</span>
          </div>
        </div>

        <div className={styles.rank}>{getOtokogiRank(otokogi)}</div>

        <button className={styles.continueBtn} onClick={handleContinue}>
          続ける
        </button>
      </div>
    </div>
  )
}
