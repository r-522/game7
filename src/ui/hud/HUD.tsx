import { usePlayerStore } from '@/state/usePlayerStore'
import { useUIStore } from '@/state/useUIStore'
import { useEncounterStore } from '@/state/useEncounterStore'
import { getOtokogiRank } from '@/systems/progression/Otokogi'
import styles from './HUD.module.css'

export function HUD(): JSX.Element | null {
  const hp = usePlayerStore((s) => s.hp)
  const maxHp = usePlayerStore((s) => s.maxHp)
  const otokogi = usePlayerStore((s) => s.otokogi)
  const banchouLevel = usePlayerStore((s) => s.banchouLevel)
  const kenkaExp = usePlayerStore((s) => s.kenkaExp)
  const comboCount = usePlayerStore((s) => s.comboCount)
  const screen = useUIStore((s) => s.screen)
  const showHud = useUIStore((s) => s.showHud)
  const phase = useEncounterStore((s) => s.phase)

  if (!showHud || screen !== 'GAME') return null

  const hpPct = (hp / maxHp) * 100
  const expPct = ((kenkaExp / (banchouLevel * 200)) * 100)
  const okojiPct = otokogi

  return (
    <div className={styles.hud}>
      {/* Player stats */}
      <div className={styles.playerPanel}>
        <div className={styles.name}>番長</div>
        <div className={styles.barRow}>
          <span className={styles.label}>気力</span>
          <div className={styles.barBg}>
            <div
              className={styles.barFg}
              style={{ width: `${hpPct}%`, background: hpPct > 50 ? '#e74c3c' : hpPct > 25 ? '#e67e22' : '#f1c40f' }}
            />
          </div>
          <span className={styles.barNum}>{hp}/{maxHp}</span>
        </div>
        <div className={styles.barRow}>
          <span className={styles.label}>男気</span>
          <div className={styles.barBg}>
            <div className={styles.barFg} style={{ width: `${okojiPct}%`, background: '#e8c040' }} />
          </div>
          <span className={styles.barNum}>{otokogi}</span>
        </div>
        <div className={styles.barRow}>
          <span className={styles.label}>EXP</span>
          <div className={styles.barBg}>
            <div className={styles.barFg} style={{ width: `${expPct}%`, background: '#3498db' }} />
          </div>
          <span className={styles.barNum}>Lv.{banchouLevel}</span>
        </div>
        <div className={styles.rank}>{getOtokogiRank(otokogi)}</div>
      </div>

      {/* Combo counter */}
      {comboCount >= 2 && (
        <div className={styles.combo}>
          <span className={styles.comboNum}>{comboCount}</span>
          <span className={styles.comboLabel}>コンボ！</span>
        </div>
      )}

      {/* Controls reminder */}
      <div className={styles.controls}>
        <span>WASD 移動 | Z 弱攻撃 | X 強攻撃 | Space 回避 | クリックでロック</span>
      </div>

      {/* Phase indicator */}
      {phase === 'FIGHT' && (
        <div className={styles.fightIndicator}>喧嘩中！</div>
      )}
    </div>
  )
}
