import { useState } from 'react'
import { useEncounterStore } from '@/state/useEncounterStore'
import { MENCHI_TABLE, MENCHI_TYPES } from '@/data/menchiTypes'
import { resolveMenchi } from '@/systems/encounter/EncounterSystem'
import type { MenchiType } from '@/types'
import styles from './MenchiOverlay.module.css'

export function MenchiOverlay(): JSX.Element {
  const enemyName = useEncounterStore((s) => s.enemyName)
  const [selected, setSelected] = useState<MenchiType | null>(null)

  function choose(type: MenchiType): void {
    if (selected) return
    setSelected(type)
    setTimeout(() => {
      resolveMenchi(type)
      setSelected(null)
    }, 800)
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.beam}>
        <div className={styles.beamLeft} />
        <div className={styles.vs}>メンチ！</div>
        <div className={styles.beamRight} />
      </div>

      <div className={styles.names}>
        <span className={styles.playerName}>番長</span>
        <span className={styles.enemyName}>{enemyName}</span>
      </div>

      <p className={styles.prompt}>メンチのタイプを選べ！</p>

      <div className={styles.grid}>
        {MENCHI_TYPES.map((type) => {
          const def = MENCHI_TABLE[type]
          return (
            <button
              key={type}
              className={`${styles.btn} ${selected === type ? styles.chosen : ''}`}
              onClick={() => choose(type)}
              disabled={!!selected}
            >
              <span className={styles.btnLabel}>{def.label}</span>
              <span className={styles.btnDesc}>{def.desc}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
