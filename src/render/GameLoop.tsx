import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { GameClock } from '@/core/loop/GameClock'
import { scheduler } from '@/core/loop/Scheduler'
import { InputSystem } from '@/systems/input/InputSystem'
import { CombatSystem } from '@/systems/combat/CombatSystem'
import { HitResolution } from '@/systems/combat/HitResolution'
import { SpecialSystem } from '@/systems/combat/SpecialSystem'
import { EnemyAISystem } from '@/systems/ai/EnemyAISystem'
import { EncounterSystem } from '@/systems/encounter/EncounterSystem'
import { ThirdPersonCamera } from '@/systems/camera/ThirdPersonCamera'
import { useEncounterStore } from '@/state/useEncounterStore'
import { useUIStore } from '@/state/useUIStore'

export function GameLoop(): null {
  const clockRef = useRef<GameClock | null>(null)

  useEffect(() => {
    InputSystem.bind()

    scheduler
      .register('input', () => {
        InputSystem.sample()
        ThirdPersonCamera.setYaw(InputSystem.getYaw())
      })
      .register('encounter', (dt, frame) => EncounterSystem(dt, frame))
      .register('ai', (dt, frame) => EnemyAISystem(dt, frame))
      .register('combat', (dt, frame) => CombatSystem(dt, frame))
      .register('hitResolution', (_dt, frame) => HitResolution(frame))
      .register('special', (dt, frame) => SpecialSystem(dt, frame))

    clockRef.current = new GameClock((dt, frame) => scheduler.tick(dt, frame))

    return () => {
      // cleanup if needed
    }
  }, [])

  useFrame((_state, delta) => {
    const phase = useEncounterStore.getState().phase
    if (phase === 'MENCHI' || phase === 'TANKA' || phase === 'RESULT' || phase === 'NONE') return
    clockRef.current?.tick(delta)

    // Tick hit-flash timer every frame
    useUIStore.getState().tickHitFlash()
  })

  return null
}
