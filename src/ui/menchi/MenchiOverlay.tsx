import { useState, useEffect, useRef } from 'react'
import { useEncounterStore } from '@/state/useEncounterStore'
import { MENCHI_TABLE, MENCHI_TYPES } from '@/data/menchiTypes'
import { resolveMenchi } from '@/systems/encounter/EncounterSystem'
import { AudioSystem } from '@/systems/audio/AudioSystem'
import type { MenchiType } from '@/types'
import styles from './MenchiOverlay.module.css'

export function MenchiOverlay(): JSX.Element {
  const enemyName = useEncounterStore((s) => s.enemyName)
  const enemyMenchiType = useEncounterStore((s) => s.enemyMenchiType)
  const menchiPower = useEncounterStore((s) => s.menchiPower)

  const [selected, setSelected] = useState<MenchiType | null>(null)
  const [phase, setPhase] = useState<'choose' | 'reveal' | 'result'>('choose')
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; angle: number }[]>([])
  const particleNextId = useRef(0)

  // Spawn particles when beams collide (phase === 'reveal')
  useEffect(() => {
    if (phase !== 'reveal') return
    const spawned = Array.from({ length: 20 }, (_, i) => ({
      id: particleNextId.current + i,
      x: 50,
      y: 50,
      angle: (i / 20) * 360,
    }))
    particleNextId.current += 20
    setParticles(spawned)
    const t = setTimeout(() => setPhase('result'), 1200)
    return () => clearTimeout(t)
  }, [phase])

  // Auto-advance to tanka after result display
  useEffect(() => {
    if (phase !== 'result') return
    const t = setTimeout(() => {
      if (selected) {
        resolveMenchi(selected)
        setSelected(null)
        setPhase('choose')
        setParticles([])
      }
    }, 1500)
    return () => clearTimeout(t)
  }, [phase, selected])

  function choose(type: MenchiType): void {
    if (selected || phase !== 'choose') return
    AudioSystem.playUIConfirm()
    setSelected(type)
    // Short delay for beam animation, then reveal enemy
    setTimeout(() => setPhase('reveal'), 600)
  }

  const playerWon = menchiPower >= 50
  const powerBarWidth = `${menchiPower}%`

  return (
    <div className={styles.overlay}>
      {/* Cinematic bars */}
      <div className={styles.cinemaTop} />
      <div className={styles.cinemaBottom} />

      {/* Title text */}
      <div className={styles.titleWrapper}>
        <span className={styles.title}>メンチ！</span>
      </div>

      {/* Beam area */}
      <div className={styles.beamRow}>
        <div className={`${styles.beamLeft} ${selected ? styles.beamActive : ''}`} />
        <div className={styles.beamCenter}>
          {particles.map((p) => (
            <div
              key={p.id}
              className={styles.particle}
              style={{ '--angle': `${p.angle}deg` } as React.CSSProperties}
            />
          ))}
        </div>
        <div className={`${styles.beamRight} ${selected ? styles.beamActive : ''}`} />
      </div>

      {/* Name plates */}
      <div className={styles.namePlates}>
        <div className={styles.playerSide}>
          <span className={styles.playerName}>龍堂 剛</span>
          {selected && (
            <span className={styles.chosenBadge} data-type={selected}>
              {MENCHI_TABLE[selected].label}
            </span>
          )}
        </div>
        <span className={styles.vs}>VS</span>
        <div className={styles.enemySide}>
          <span className={styles.enemyName}>{enemyName}</span>
          {phase !== 'choose' && enemyMenchiType && (
            <span className={styles.chosenBadge} data-type={enemyMenchiType}>
              {MENCHI_TABLE[enemyMenchiType].label}
            </span>
          )}
        </div>
      </div>

      {/* Power bar (visible after reveal) */}
      {phase !== 'choose' && (
        <div className={styles.powerBarWrapper}>
          <span className={styles.powerLabel} style={{ color: '#e74c3c' }}>龍堂</span>
          <div className={styles.powerBar}>
            <div
              className={`${styles.powerFill} ${playerWon ? styles.playerWins : styles.enemyWins}`}
              style={{ width: powerBarWidth }}
            />
            <div className={styles.powerCenter} />
          </div>
          <span className={styles.powerLabel} style={{ color: '#3498db' }}>敵</span>
        </div>
      )}

      {/* Result line */}
      {phase === 'result' && (
        <div className={`${styles.resultLine} ${playerWon ? styles.resultWin : styles.resultLose}`}>
          {playerWon ? 'メンチ勝ち！' : 'メンチ負け...'}
        </div>
      )}

      {/* Choice grid (only while choosing) */}
      {phase === 'choose' && (
        <>
          <p className={styles.prompt}>メンチのタイプを選べ！</p>
          <div className={styles.grid}>
            {MENCHI_TYPES.map((type) => {
              const def = MENCHI_TABLE[type]
              return (
                <button
                  key={type}
                  className={`${styles.btn} ${selected === type ? styles.chosen : ''}`}
                  onClick={() => choose(type)}
                  onMouseEnter={() => AudioSystem.playUIClick()}
                  disabled={!!selected}
                >
                  <span className={styles.btnLabel}>{def.label}</span>
                  <span className={styles.btnDesc}>{def.desc}</span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
