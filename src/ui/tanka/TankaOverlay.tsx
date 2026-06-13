import { useState, useEffect, useRef } from 'react'
import { useUIStore } from '@/state/useUIStore'
import { useEncounterStore } from '@/state/useEncounterStore'
import { resolveTanka } from '@/systems/encounter/EncounterSystem'
import { AudioSystem } from '@/systems/audio/AudioSystem'
import styles from './TankaOverlay.module.css'

const COUNTDOWN_SECONDS = 10

export function TankaOverlay(): JSX.Element {
  const setup = useUIStore((s) => s.tankaSetup)
  const options = useUIStore((s) => s.tankaOptions)
  const enemyName = useEncounterStore((s) => s.enemyName)

  const [chosen, setChosen] = useState<number | null>(null)
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)
  const [timeLeft, setTimeLeft] = useState(COUNTDOWN_SECONDS)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const resolvedRef = useRef(false)

  // Reset on mount (fresh tanka each time)
  useEffect(() => {
    setChosen(null)
    setResult(null)
    setTimeLeft(COUNTDOWN_SECONDS)
    resolvedRef.current = false
  }, [setup])

  // Countdown timer
  useEffect(() => {
    if (chosen !== null) return

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // Time up — pick random wrong option as auto-fail
          if (!resolvedRef.current) {
            const correctIdx = useUIStore.getState().tankaCorrectIndex
            const wrongOptions = options.map((_, i) => i).filter((i) => i !== correctIdx)
            const autoChoice = wrongOptions.length > 0
              ? wrongOptions[Math.floor(Math.random() * wrongOptions.length)]
              : correctIdx
            handlePick(autoChoice)
          }
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [chosen, options])

  function handlePick(index: number): void {
    if (resolvedRef.current) return
    resolvedRef.current = true

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    const correctIdx = useUIStore.getState().tankaCorrectIndex
    const isCorrect = index === correctIdx
    setChosen(index)
    setResult(isCorrect ? 'correct' : 'wrong')

    if (isCorrect) {
      AudioSystem.playTankaCorrect()
    } else {
      AudioSystem.playTankaWrong()
    }

    setTimeout(() => {
      resolveTanka(index)
      setChosen(null)
      setResult(null)
      setTimeLeft(COUNTDOWN_SECONDS)
      resolvedRef.current = false
    }, 1200)
  }

  function pick(index: number): void {
    if (chosen !== null || resolvedRef.current) return
    AudioSystem.playUIConfirm()
    handlePick(index)
  }

  const progressPct = (timeLeft / COUNTDOWN_SECONDS) * 100
  const timerDanger = timeLeft <= 3

  return (
    <div className={styles.overlay}>
      {/* Countdown bar */}
      <div className={styles.countdownTrack}>
        <div
          className={`${styles.countdownFill} ${timerDanger ? styles.danger : ''}`}
          style={{ width: `${progressPct}%` }}
        />
        <span className={`${styles.countdownNum} ${timerDanger ? styles.danger : ''}`}>
          {timeLeft}
        </span>
      </div>

      {/* Enemy name + tag */}
      <div className={styles.header}>
        <span className={styles.tag}>啖呵</span>
        <span className={styles.enemyName}>{enemyName}</span>
      </div>

      {/* Speech bubble */}
      <div className={styles.bubble}>
        <div className={styles.bubbleTail} />
        <p className={styles.setup}>{setup}</p>
      </div>

      {/* Prompt */}
      <p className={styles.prompt}>返す言葉を選べ！</p>

      {/* Result flash */}
      {result && (
        <div className={`${styles.resultFlash} ${result === 'correct' ? styles.correct : styles.wrong}`}>
          {result === 'correct' ? '正解！先制攻撃だ！' : 'しくじった！'}
        </div>
      )}

      {/* Choice list */}
      <div className={styles.choices}>
        {options.map((opt, i) => {
          const isChosen = chosen === i
          const correctIdx = useUIStore.getState().tankaCorrectIndex
          const isCorrect = result !== null && i === correctIdx
          const isWrong = result !== null && isChosen && !isCorrect

          return (
            <button
              key={i}
              className={`${styles.choice}
                ${isChosen ? styles.chosen : ''}
                ${isCorrect ? styles.correct : ''}
                ${isWrong ? styles.wrong : ''}`}
              onClick={() => pick(i)}
              onMouseEnter={() => chosen === null && AudioSystem.playUIClick()}
              disabled={chosen !== null}
            >
              <span className={styles.choiceNum}>{i + 1}</span>
              <span className={styles.choiceText}>{opt}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
