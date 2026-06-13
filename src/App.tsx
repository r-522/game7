import { Stage } from '@/render/Stage'
import { HUD } from '@/ui/hud/HUD'
import { MenchiOverlay } from '@/ui/menchi/MenchiOverlay'
import { TankaOverlay } from '@/ui/tanka/TankaOverlay'
import { ResultScreen } from '@/ui/result/ResultScreen'
import { useUIStore } from '@/state/useUIStore'
import { spawnPlayer } from '@/entities/PlayerEntity'
import { spawnGrunt, spawnBanchou } from '@/entities/GruntEntity'
import { startRoam } from '@/systems/encounter/EncounterSystem'
import './index.css'

function TitleScreen(): JSX.Element {
  function handleStart(): void {
    spawnPlayer()
    spawnGrunt(8, -5)
    spawnGrunt(-6, 8)
    spawnBanchou(12, 12)
    startRoam()
  }

  return (
    <div className="title-screen">
      <div className="title-logo">
        <span className="title-kanji">喧嘩番長</span>
        <span className="title-num">7</span>
      </div>
      <p className="title-tagline">最強の番長への道</p>
      <button className="title-btn" onClick={handleStart}>
        喧嘩を始める
      </button>
      <div className="title-controls">
        <p>WASD / 矢印キー ：移動</p>
        <p>Z キー / 左クリック：弱攻撃</p>
        <p>X キー：強攻撃</p>
        <p>Space：回避</p>
        <p>クリックでマウスロック</p>
      </div>
    </div>
  )
}

export function App(): JSX.Element {
  const screen = useUIStore((s) => s.screen)

  return (
    <div className="app">
      {screen !== 'TITLE' && (
        <div className="canvas-wrapper">
          <Stage />
        </div>
      )}

      {screen === 'TITLE' && <TitleScreen />}
      {screen === 'MENCHI' && <MenchiOverlay />}
      {screen === 'TANKA' && <TankaOverlay />}
      {screen === 'RESULT' && <ResultScreen />}
      {screen === 'GAME' && <HUD />}
    </div>
  )
}
