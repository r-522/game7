import { useRef, useEffect } from 'react'
import { usePlayerStore } from '@/state/usePlayerStore'
import { useUIStore } from '@/state/useUIStore'
import { useEncounterStore } from '@/state/useEncounterStore'
import { useCombatStore } from '@/state/useCombatStore'
import { useKeyBindStore } from '@/state/useKeyBindStore'
import { getOtokogiRank } from '@/systems/progression/Otokogi'
import styles from './HUD.module.css'

function formatKey(code: string): string {
  if (code === 'Mouse0') return 'LClick'
  if (code === 'Mouse2') return 'RClick'
  if (code === 'Space') return 'Space'
  if (code === 'ShiftF') return 'Shift+F'
  if (code === 'Escape') return 'Esc'
  if (code.startsWith('Key')) return code.slice(3)
  if (code.startsWith('Digit')) return code.slice(5)
  return code
}

export function HUD(): JSX.Element | null {
  const hp = usePlayerStore((s) => s.hp)
  const maxHp = usePlayerStore((s) => s.maxHp)
  const otokogi = usePlayerStore((s) => s.otokogi)
  const banchouLevel = usePlayerStore((s) => s.banchouLevel)
  const kenkaExp = usePlayerStore((s) => s.kenkaExp)
  const comboCount = usePlayerStore((s) => s.comboCount)
  const maxCombo = usePlayerStore((s) => s.maxCombo)
  const kiai = usePlayerStore((s) => s.kiai)
  const maxKiai = usePlayerStore((s) => s.maxKiai)

  const screen = useUIStore((s) => s.screen)
  const showHud = useUIStore((s) => s.showHud)
  const hitFlash = useUIStore((s) => s.hitFlash)

  const phase = useEncounterStore((s) => s.phase)
  const enemyName = useEncounterStore((s) => s.enemyName)
  const enemyEntityId = useEncounterStore((s) => s.enemyEntityId)

  const entities = useCombatStore((s) => s.entities)
  const binds = useKeyBindStore((s) => s.binds)

  const prevCombo = useRef(comboCount)
  const comboRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (comboCount > prevCombo.current && comboRef.current) {
      comboRef.current.classList.remove(styles.comboBump)
      // trigger reflow so animation replays
      void comboRef.current.offsetWidth
      comboRef.current.classList.add(styles.comboBump)
    }
    prevCombo.current = comboCount
  }, [comboCount])

  if (!showHud || screen !== 'GAME') return null

  const hpPct = Math.min(100, (hp / maxHp) * 100)
  const expThreshold = banchouLevel * 200
  const expPct = Math.min(100, (kenkaExp / expThreshold) * 100)
  const otokogiPct = Math.min(100, otokogi)
  const kiaiPct = Math.min(100, (kiai / maxKiai) * 100)
  const kiaiFull = kiai >= maxKiai
  const rank = getOtokogiRank(otokogi)

  const hpColor =
    hpPct > 50 ? '#e74c3c' : hpPct > 25 ? '#e67e22' : '#f1c40f'

  const enemyData = enemyEntityId ? entities[enemyEntityId] : null
  const enemyHpPct = enemyData
    ? Math.min(100, (enemyData.hp / enemyData.maxHp) * 100)
    : 0

  return (
    <div className={`${styles.hud} ${hitFlash ? styles.hitFlash : ''}`}>
      {/* ── Player panel (top-left) ── */}
      <div className={styles.playerPanel}>
        <div className={styles.panelHeader}>
          <span className={styles.name}>番長</span>
          <span className={styles.levelBadge}>Lv.{banchouLevel}</span>
        </div>

        <div className={styles.barRow}>
          <span className={styles.label}>気力</span>
          <div className={styles.barBg}>
            <div
              className={styles.barFg}
              style={{ width: `${hpPct}%`, background: hpColor }}
            />
          </div>
          <span className={styles.barNum}>{hp}/{maxHp}</span>
        </div>

        <div className={styles.barRow}>
          <span className={styles.label}>男気</span>
          <div className={styles.barBg}>
            <div
              className={styles.barFg}
              style={{ width: `${otokogiPct}%`, background: '#e8c040' }}
            />
          </div>
          <span className={styles.barNum}>{otokogi}</span>
        </div>

        <div className={styles.barRow}>
          <span className={styles.label}>慣れ</span>
          <div className={styles.barBg}>
            <div
              className={styles.barFg}
              style={{ width: `${expPct}%`, background: '#3498db' }}
            />
          </div>
          <span className={styles.barNum}>{kenkaExp}/{expThreshold}</span>
        </div>

        <div className={styles.rank}>{rank}</div>
      </div>

      {/* ── 気合ゲージ (below player panel) ── */}
      <div className={styles.kiaiPanel}>
        <div className={styles.kiaiHeader}>
          <span className={styles.kiaiLabel}>気合</span>
          {kiaiFull && <span className={styles.kiaiFullBadge}>FULL！</span>}
        </div>
        <div className={styles.kiaiBarBg}>
          <div
            className={`${styles.kiaiBarFg} ${kiaiFull ? styles.kiaiBarFull : ''}`}
            style={{ width: `${kiaiPct}%` }}
          />
        </div>
        <div className={styles.kiaiNums}>
          <span>{kiai}</span>
          <span>{maxKiai}</span>
        </div>
      </div>

      {/* ── Enemy HP bar (top-right, only during FIGHT) ── */}
      {phase === 'FIGHT' && (
        <div className={styles.enemyPanel}>
          <div className={styles.enemyName}>{enemyName || '不良'}</div>
          <div className={styles.barRow}>
            <span className={styles.label}>気力</span>
            <div className={styles.barBg}>
              <div
                className={styles.barFg}
                style={{
                  width: `${enemyHpPct}%`,
                  background:
                    enemyHpPct > 50
                      ? '#c0392b'
                      : enemyHpPct > 25
                      ? '#e67e22'
                      : '#f39c12',
                }}
              />
            </div>
            <span className={styles.barNum}>
              {enemyData ? `${enemyData.hp}/${enemyData.maxHp}` : '?'}
            </span>
          </div>
        </div>
      )}

      {/* ── Fight phase indicator ── */}
      {phase === 'FIGHT' && (
        <div className={styles.fightIndicator}>喧嘩中！</div>
      )}

      {/* ── Combo counter (right side) ── */}
      {comboCount >= 2 && (
        <div ref={comboRef} className={styles.combo}>
          <span className={styles.comboNum}>{comboCount}</span>
          <span className={styles.comboLabel}>コンボ！</span>
          {maxCombo > 0 && (
            <span className={styles.maxCombo}>MAX {maxCombo}</span>
          )}
        </div>
      )}

      {/* ── Controls hint (bottom) ── */}
      <div className={styles.controls}>
        <span className={styles.controlItem}>
          <kbd>WASD</kbd> 移動
        </span>
        <span className={styles.controlSep}>｜</span>
        <span className={styles.controlItem}>
          <kbd>{formatKey(binds.attackLight)}</kbd> 弱攻撃
        </span>
        <span className={styles.controlSep}>｜</span>
        <span className={styles.controlItem}>
          <kbd>{formatKey(binds.attackHeavy)}</kbd> 強攻撃
        </span>
        <span className={styles.controlSep}>｜</span>
        <span className={styles.controlItem}>
          <kbd>{formatKey(binds.special)}</kbd> 必殺技
        </span>
        <span className={styles.controlSep}>｜</span>
        <span className={styles.controlItem}>
          <kbd>{formatKey(binds.dodge)}</kbd> 回避
        </span>
        <span className={styles.controlSep}>｜</span>
        <span className={styles.controlItem}>
          <kbd>{formatKey(binds.block)}</kbd>(長押し) ガード
        </span>
        <span className={styles.controlSep}>｜</span>
        <span className={styles.controlItem}>
          <kbd>{formatKey(binds.lockOn)}</kbd> ロックオン
        </span>
      </div>
    </div>
  )
}
