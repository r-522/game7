import { useState } from 'react'
import { useUIStore } from '@/state/useUIStore'
import { useEncounterStore } from '@/state/useEncounterStore'
import { resolveTanka } from '@/systems/encounter/EncounterSystem'
import styles from './TankaOverlay.module.css'

export function TankaOverlay(): JSX.Element {
  const setup = useUIStore((s) => s.tankaSetup)
  const options = useUIStore((s) => s.tankaOptions)
  const enemyName = useEncounterStore((s) => s.enemyName)
  const [chosen, setChosen] = useState<number | null>(null)

  function pick(index: number): void {
    if (chosen !== null) return
    setChosen(index)
    setTimeout(() => {
      resolveTanka(index)
      setChosen(null)
    }, 700)
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.header}>
        <span className={styles.tag}>啖呵</span>
        <span className={styles.enemyName}>{enemyName}</span>
      </div>

      <div className={styles.bubble}>
        <p className={styles.setup}>{setup}</p>
      </div>

      <p className={styles.prompt}>返す言葉を選べ！</p>

      <div className={styles.choices}>
        {options.map((opt, i) => (
          <button
            key={i}
            className={`${styles.choice} ${chosen === i ? styles.chosen : ''}`}
            onClick={() => pick(i)}
            disabled={chosen !== null}
          >
            <span className={styles.choiceNum}>{i + 1}</span>
            <span className={styles.choiceText}>{opt}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
