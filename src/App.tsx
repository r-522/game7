import { useEffect, useState } from 'react'
import { Stage } from '@/render/Stage'
import { HUD } from '@/ui/hud/HUD'
import { MenchiOverlay } from '@/ui/menchi/MenchiOverlay'
import { TankaOverlay } from '@/ui/tanka/TankaOverlay'
import { ResultScreen } from '@/ui/result/ResultScreen'
import { TitleScreen } from '@/ui/title/TitleScreen'
import { KeyBindScreen } from '@/ui/settings/KeyBindScreen'
import { StoryDialog } from '@/ui/story/StoryDialog'
import type { DialogLine } from '@/ui/story/StoryDialog'
import { useUIStore } from '@/state/useUIStore'
import { spawnPlayer } from '@/entities/PlayerEntity'
import { spawnDistrictEnemies } from '@/entities/GruntEntity'
import { startRoam } from '@/systems/encounter/EncounterSystem'
import { AudioSystem } from '@/systems/audio/AudioSystem'
import { InputSystem } from '@/systems/input/InputSystem'
import { EventBus } from '@/core/events/EventBus'
import { ENEMY_CATALOG } from '@/data/enemies/allEnemies'
import './index.css'

// ─── GameScreen ───────────────────────────────────────────────────────────────

function GameScreen(): JSX.Element {
  return (
    <>
      <div className="canvas-wrapper">
        <Stage />
      </div>
      <HUD />
    </>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export function App(): JSX.Element {
  const screen = useUIStore((s) => s.screen)
  const setScreen = useUIStore((s) => s.setScreen)

  const [storyLines, setStoryLines] = useState<DialogLine[]>([])
  const [storyEnemyId, setStoryEnemyId] = useState<string | null>(null)

  // Initialise audio + input on first user interaction
  function handleFirstInteraction(): void {
    AudioSystem.init()
    InputSystem.bind()
  }

  // Listen for ENCOUNTER_START — if a banchou, show pre-fight story dialog
  useEffect(() => {
    const unsub = EventBus.on('ENCOUNTER_START', ({ enemyId, enemyName }) => {
      const def = ENEMY_CATALOG[enemyId]
      if (!def || !def.isBoss) return

      const lines: DialogLine[] = [
        {
          name: enemyName,
          text: def.dialogue.pre,
          portraitColor: def.bodyColor,
        },
      ]

      setStoryLines(lines)
      setStoryEnemyId(enemyId)
      setScreen('STORY_DIALOG')
    })
    return unsub
  }, [setScreen])

  // Handle game start from TitleScreen
  function handleStart(): void {
    AudioSystem.init()
    InputSystem.bind()

    spawnPlayer()
    spawnDistrictEnemies(0, 3)
    startRoam()
    // startRoam already calls AudioSystem.startBGM('roam')
  }

  // Wire handleStart to TitleScreen — TitleScreen calls setScreen('GAME') internally,
  // but we intercept the 'GAME' transition to do spawning. We use a side-effect on screen.
  const [hasStarted, setHasStarted] = useState(false)
  useEffect(() => {
    if (screen === 'GAME' && !hasStarted) {
      setHasStarted(true)
      handleStart()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen])

  function handleStoryComplete(): void {
    // After banchou dialog, show MENCHI (encounter was already started by EncounterSystem)
    setScreen('MENCHI')
    setStoryLines([])
    setStoryEnemyId(null)
  }

  const isTitleHidden = screen !== 'TITLE'
  const showCanvas = screen !== 'TITLE' && screen !== 'SETTINGS'

  return (
    // Capture first interaction anywhere on the app surface
    <div className="app" onPointerDown={handleFirstInteraction} onKeyDown={handleFirstInteraction}>
      {/* 3D canvas + HUD */}
      {showCanvas && <GameScreen />}

      {/* Screen routing */}
      {screen === 'TITLE' && <TitleScreen />}
      {screen === 'MENCHI' && <MenchiOverlay />}
      {screen === 'TANKA' && <TankaOverlay />}
      {screen === 'RESULT' && <ResultScreen />}
      {screen === 'SETTINGS' && (
        <div className="settings-overlay">
          <KeyBindScreen onClose={() => setScreen('GAME')} />
        </div>
      )}
      {screen === 'STORY_DIALOG' && storyLines.length > 0 && (
        <div className="story-overlay">
          <StoryDialog
            key={storyEnemyId ?? 'story'}
            lines={storyLines}
            onComplete={handleStoryComplete}
          />
        </div>
      )}

      {/* HUD is shown over canvas when in GAME phase */}
      {/* (HUD is already rendered inside GameScreen above) */}

      {/* Suppress unused-var lint for isTitleHidden (used implicitly via screen guard) */}
      {void isTitleHidden}
    </div>
  )
}
