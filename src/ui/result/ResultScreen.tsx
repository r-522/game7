import { useEffect } from 'react'
import { useEncounterStore } from '@/state/useEncounterStore'
import { usePlayerStore } from '@/state/usePlayerStore'
import { useCombatStore } from '@/state/useCombatStore'
import { useProgressStore } from '@/state/useProgressStore'
import { startRoam } from '@/systems/encounter/EncounterSystem'
import { spawnGrunt } from '@/entities/GruntEntity'
import { spawnPlayer } from '@/entities/PlayerEntity'
import { getOtokogiRank } from '@/systems/progression/Otokogi'
import { AudioSystem } from '@/systems/audio/AudioSystem'
import { BANCHOU_TABLE } from '@/data/story/chapters'
import styles from './ResultScreen.module.css'

export function ResultScreen(): JSX.Element {
  const { resultWin, resultOtokogiDelta, resultXpGained, enemyName, firstStrike, enemyEntityId } =
    useEncounterStore()
  const { otokogi, banchouLevel, maxCombo, comboCount } = usePlayerStore()
  const { unlockedSpecials, defeatedBanchous } = useProgressStore()

  // Find newly unlocked special move (last entry in unlockedSpecials if enemy is a banchou)
  const enemyBanchou = BANCHOU_TABLE.find((b) => b.id === enemyEntityId)
  const justUnlockedSpecial = enemyBanchou && resultWin
    ? unlockedSpecials.find((id) => id === enemyBanchou.specialMoveUnlock)
    : null
  const isNewSpecial = justUnlockedSpecial != null

  useEffect(() => {
    // BGM is already stopped by EncounterSystem; victory/defeat played there too
    // Re-init audio in case of cold start
    AudioSystem.init()
  }, [])

  function handleContinue(): void {
    AudioSystem.playUIConfirm()
    useEncounterStore.getState().reset()
    useCombatStore.getState().removeEntity('player')
    const eId = useEncounterStore.getState().enemyEntityId
    if (eId) useCombatStore.getState().removeEntity(eId)
    spawnPlayer()
    spawnGrunt(8, -5)
    spawnGrunt(-6, 8)
    startRoam()
  }

  const win = resultWin
  const otokogiPositive = resultOtokogiDelta >= 0
  const verdict = otokogiPositive ? 'シブイ！' : 'シャバい...'
  const currentCombo = Math.max(comboCount, maxCombo)

  return (
    <div className={styles.screen}>
      {/* Victory/Defeat banner */}
      <div className={`${styles.banner} ${win ? styles.bannerWin : styles.bannerLose}`}>
        <span className={styles.bannerText}>{win ? '勝利！' : '敗北...'}</span>
        <div className={styles.bannerGlow} />
      </div>

      <div className={styles.card}>
        {/* Verdict */}
        <div
          className={`${styles.verdict} ${otokogiPositive ? styles.verdictWin : styles.verdictLose}`}
        >
          {verdict}
        </div>

        {/* First-strike bonus */}
        {firstStrike === 'PLAYER' && (
          <div className={styles.bonus}>⚡ 先制攻撃ボーナス！</div>
        )}

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.row}>
            <span className={styles.rowLabel}>相手</span>
            <span className={styles.rowValue}>{enemyName}</span>
          </div>
          {enemyBanchou && (
            <div className={styles.row}>
              <span className={styles.rowLabel}>称号</span>
              <span className={styles.rowValue} style={{ color: '#f39c12' }}>
                {enemyBanchou.title}
              </span>
            </div>
          )}
          <div className={styles.row}>
            <span className={styles.rowLabel}>コンボ数</span>
            <span className={styles.rowValue}>{currentCombo} コンボ</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>男気</span>
            <span
              className={styles.rowValue}
              style={{ color: otokogiPositive ? '#e8c040' : '#e74c3c' }}
            >
              {otokogiPositive ? '+' : ''}{resultOtokogiDelta} → {otokogi}
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>喧嘩慣れ</span>
            <span className={styles.rowValue} style={{ color: '#3498db' }}>
              +{resultXpGained} EXP
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>番長度</span>
            <span className={styles.rowValue}>Lv.{banchouLevel}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>倒した番長</span>
            <span className={styles.rowValue}>{defeatedBanchous.length} 人</span>
          </div>
        </div>

        {/* Rank badge */}
        <div className={styles.rank}>{getOtokogiRank(otokogi)}</div>

        {/* Newly unlocked special move */}
        {isNewSpecial && justUnlockedSpecial && (
          <div className={styles.specialUnlock}>
            <div className={styles.specialTitle}>必殺技習得！</div>
            <div className={styles.specialName}>{justUnlockedSpecial}</div>
            <div className={styles.specialHint}>Fキーで使用可能</div>
          </div>
        )}

        {/* Continue button */}
        <button
          className={styles.continueBtn}
          onClick={handleContinue}
          onMouseEnter={() => AudioSystem.playUIClick()}
        >
          続ける
        </button>
      </div>
    </div>
  )
}
