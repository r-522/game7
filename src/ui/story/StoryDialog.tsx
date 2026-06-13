import { useState, useEffect, useCallback, useRef } from 'react'
import { AudioSystem } from '@/systems/audio/AudioSystem'
import styles from './StoryDialog.module.css'

export interface DialogLine {
  /** Speaker name displayed on the name plate */
  name: string
  /** The line of dialogue text */
  text: string
  /** Optional portrait color (CSS color string). Defaults to '#e8c040'. */
  portraitColor?: string
}

interface StoryDialogProps {
  /** Ordered list of dialogue lines to display */
  lines: DialogLine[]
  /** Called after the final line is advanced past */
  onComplete: () => void
}

const CHARS_PER_TICK = 1
const TICK_MS = 30

export function StoryDialog({ lines, onComplete }: StoryDialogProps): JSX.Element | null {
  const [lineIndex, setLineIndex] = useState(0)
  const [displayedChars, setDisplayedChars] = useState(0)
  const [done, setDone] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const completedRef = useRef(false)

  const currentLine = lines[lineIndex]
  const fullText = currentLine?.text ?? ''
  const isTyping = displayedChars < fullText.length

  // Reset when lines change (new dialog opened)
  useEffect(() => {
    setLineIndex(0)
    setDisplayedChars(0)
    setDone(false)
    completedRef.current = false
  }, [lines])

  // Typewriter tick
  useEffect(() => {
    if (done || displayedChars >= fullText.length) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(() => {
      setDisplayedChars((c) => {
        const next = c + CHARS_PER_TICK
        return next >= fullText.length ? fullText.length : next
      })
    }, TICK_MS)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [lineIndex, done, fullText.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const advance = useCallback(() => {
    if (completedRef.current) return

    // If still typing, snap to full text first
    if (displayedChars < fullText.length) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setDisplayedChars(fullText.length)
      AudioSystem.playUIClick()
      return
    }

    AudioSystem.playUIConfirm()

    const nextIndex = lineIndex + 1
    if (nextIndex >= lines.length) {
      completedRef.current = true
      setDone(true)
      onComplete()
    } else {
      setLineIndex(nextIndex)
      setDisplayedChars(0)
    }
  }, [displayedChars, fullText.length, lineIndex, lines.length, onComplete])

  // Keyboard handler: Enter or Space to advance
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [advance])

  if (!currentLine || done) return null

  const portraitColor = currentLine.portraitColor ?? '#e8c040'
  const displayedText = fullText.slice(0, displayedChars)
  const progressPct = ((lineIndex + 1) / lines.length) * 100

  return (
    <div className={styles.wrapper}>
      {/* Progress dots */}
      <div className={styles.progressDots}>
        {lines.map((_, i) => (
          <span
            key={i}
            className={`${styles.dot} ${i === lineIndex ? styles.dotActive : ''} ${i < lineIndex ? styles.dotDone : ''}`}
          />
        ))}
      </div>

      <div className={styles.box} onClick={advance}>
        {/* Portrait */}
        <div className={styles.portrait} style={{ background: portraitColor }}>
          <span className={styles.portraitInitial}>
            {currentLine.name.charAt(0)}
          </span>
        </div>

        {/* Text area */}
        <div className={styles.textArea}>
          {/* Name plate */}
          <div className={styles.namePlate}>
            <span className={styles.speakerName}>{currentLine.name}</span>
          </div>

          {/* Dialogue text */}
          <p className={styles.dialogText}>
            {displayedText}
            {isTyping && <span className={styles.cursor} />}
          </p>
        </div>

        {/* Next prompt (shown when text is fully displayed) */}
        {!isTyping && (
          <div className={styles.nextPrompt} aria-label="次へ">
            ▼
          </div>
        )}
      </div>

      {/* Progress bar (subtle, below box) */}
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
      </div>
    </div>
  )
}
