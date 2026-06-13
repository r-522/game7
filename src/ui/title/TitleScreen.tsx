import { useState, useEffect, useRef } from 'react'
import { useUIStore } from '@/state/useUIStore'
import { KeyBindScreen } from '@/ui/settings/KeyBindScreen'
import styles from './TitleScreen.module.css'

type MenuItem = 'start' | 'keybinds' | 'controls'

const MENU_ITEMS: { id: MenuItem; label: string }[] = [
  { id: 'start',    label: '喧嘩を始める' },
  { id: 'keybinds', label: 'キー設定' },
  { id: 'controls', label: '操作説明' },
]

const PARTICLE_COUNT = 60

interface Particle {
  id: number
  x: number
  y: number
  size: number
  speed: number
  opacity: number
  delay: number
}

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2.5 + 0.5,
    speed: Math.random() * 40 + 20,
    opacity: Math.random() * 0.6 + 0.15,
    delay: Math.random() * 20,
  }))
}

function ControlsInfo({ onClose }: { onClose: () => void }): JSX.Element {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.code === 'Escape') onClose() }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [onClose])

  return (
    <div className={styles.infoOverlay}>
      <div className={styles.infoPanel}>
        <h3 className={styles.infoTitle}>操作説明</h3>
        <table className={styles.infoTable}>
          <tbody>
            <tr><td>WASD</td><td>移動</td></tr>
            <tr><td>マウス移動</td><td>カメラ回転</td></tr>
            <tr><td>マウス左クリック</td><td>弱攻撃</td></tr>
            <tr><td>マウス右クリック</td><td>強攻撃</td></tr>
            <tr><td>F</td><td>必殺技（気合ゲージ満タン時）</td></tr>
            <tr><td>スペース</td><td>回避（無敵フレームあり）</td></tr>
            <tr><td>C（長押し）</td><td>ガード</td></tr>
            <tr><td>Shift+F</td><td>投げ（近距離時）</td></tr>
            <tr><td>Q</td><td>ロックオン切り替え</td></tr>
            <tr><td>Esc</td><td>ポーズ／メニュー</td></tr>
          </tbody>
        </table>
        <button className={styles.infoClose} onClick={onClose}>閉じる</button>
      </div>
    </div>
  )
}

export function TitleScreen(): JSX.Element | null {
  const screen = useUIStore((s) => s.screen)
  const setScreen = useUIStore((s) => s.setScreen)

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showKeybinds, setShowKeybinds] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [titleVisible, setTitleVisible] = useState(false)
  const [menuVisible, setMenuVisible] = useState(false)

  const particles = useRef<Particle[]>(generateParticles())

  // Staggered entrance animation
  useEffect(() => {
    if (screen !== 'TITLE') return
    const t1 = setTimeout(() => setTitleVisible(true), 100)
    const t2 = setTimeout(() => setMenuVisible(true), 900)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [screen])

  // Keyboard navigation
  useEffect(() => {
    if (screen !== 'TITLE' || showKeybinds || showControls) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        setSelectedIndex((i) => (i - 1 + MENU_ITEMS.length) % MENU_ITEMS.length)
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        setSelectedIndex((i) => (i + 1) % MENU_ITEMS.length)
      } else if (e.code === 'Enter' || e.code === 'Space') {
        handleSelect(MENU_ITEMS[selectedIndex].id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, selectedIndex, showKeybinds, showControls])

  if (screen !== 'TITLE') return null

  const handleSelect = (id: MenuItem) => {
    if (id === 'start') {
      setScreen('GAME')
    } else if (id === 'keybinds') {
      setShowKeybinds(true)
    } else if (id === 'controls') {
      setShowControls(true)
    }
  }

  return (
    <div className={styles.root}>
      {/* Scanline overlay */}
      <div className={styles.scanlines} aria-hidden="true" />

      {/* Particle background */}
      <div className={styles.particles} aria-hidden="true">
        {particles.current.map((p) => (
          <span
            key={p.id}
            className={styles.particle}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: p.opacity,
              animationDuration: `${p.speed}s`,
              animationDelay: `-${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Title block */}
      <div className={`${styles.titleBlock} ${titleVisible ? styles.titleVisible : ''}`}>
        <div className={styles.titleKanji} aria-label="喧嘩番長">
          {'喧嘩番長'.split('').map((ch, i) => (
            <span
              key={i}
              className={styles.titleChar}
              style={{ animationDelay: `${0.12 + i * 0.1}s` }}
            >
              {ch}
            </span>
          ))}
        </div>
        <div className={styles.titleNumber} aria-label="7">
          <span className={styles.titleNumberInner}>7</span>
        </div>
        <div className={styles.titleSubtitle}>
          ― KENKA BANCHOU 7 ―
        </div>
      </div>

      {/* Menu */}
      <nav
        className={`${styles.menu} ${menuVisible ? styles.menuVisible : ''}`}
        aria-label="メインメニュー"
      >
        {MENU_ITEMS.map(({ id, label }, idx) => (
          <button
            key={id}
            className={`${styles.menuItem} ${idx === selectedIndex ? styles.menuItemSelected : ''}`}
            onClick={() => { setSelectedIndex(idx); handleSelect(id) }}
            onMouseEnter={() => setSelectedIndex(idx)}
            style={{ animationDelay: `${idx * 0.08}s` }}
          >
            <span className={styles.menuItemArrow}>▶</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Copyright */}
      <div className={styles.copyright}>
        © 2025 喧嘩番長7 Project — All Rights Reserved
      </div>

      {/* Overlays */}
      {showKeybinds && (
        <KeyBindScreen onClose={() => setShowKeybinds(false)} />
      )}
      {showControls && (
        <ControlsInfo onClose={() => setShowControls(false)} />
      )}
    </div>
  )
}
