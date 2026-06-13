import { Canvas } from '@react-three/fiber'
import { PlayerRig } from '@/render/PlayerRig'
import { EnemyRig } from '@/render/EnemyRig'
import { CameraRig } from '@/render/camera/CameraRig'
import { GameLoop } from '@/render/GameLoop'
import { HitSpark } from '@/render/fx/HitSpark'
import { SpecialFX } from '@/render/fx/SpecialFX'
import { useCombatStore } from '@/state/useCombatStore'
import { EventBus } from '@/core/events/EventBus'
import { getActiveSpecial } from '@/systems/combat/SpecialSystem'
import { useEffect, useState, useRef } from 'react'
import type { EntityId } from '@/types'

// ─── EnemyRigs ────────────────────────────────────────────────────────────────

function EnemyRigs(): JSX.Element {
  const [enemyIds, setEnemyIds] = useState<EntityId[]>([])

  useEffect(() => {
    const unsub = useCombatStore.subscribe((state) => {
      const ids = Object.values(state.entities)
        .filter((e) => e.team === 'ENEMY')
        .map((e) => e.id)
      setEnemyIds((prev) =>
        prev.length === ids.length && prev.every((id, i) => id === ids[i]) ? prev : ids,
      )
    })
    return unsub
  }, [])

  return (
    <>
      {enemyIds.map((id) => (
        <EnemyRig key={id} entityId={id} />
      ))}
    </>
  )
}

// ─── HitSparkManager — subscribes to HIT_LANDED, renders sparks ──────────────

interface SparkEntry {
  id: string
  position: [number, number, number]
  type: 'light' | 'heavy' | 'special'
  active: boolean
}

function HitSparkManager(): JSX.Element {
  const [sparks, setSparks] = useState<SparkEntry[]>([])
  const sparkIdRef = useRef(0)

  useEffect(() => {
    const unsub = EventBus.on('HIT_LANDED', ({ attackerId, targetId, hitId }) => {
      const { entities } = useCombatStore.getState()
      const target = entities[targetId]
      if (!target) return

      // Determine spark type from hitId prefix
      let sparkType: SparkEntry['type'] = 'light'
      if (hitId.startsWith('special_')) sparkType = 'special'
      else {
        const attacker = entities[attackerId]
        if (attacker?.fsm.state === 'ATTACK_HEAVY') sparkType = 'heavy'
      }

      const sparkId = `spark_${sparkIdRef.current++}`
      const pos: [number, number, number] = [
        target.position.x,
        target.position.y + 1.0,
        target.position.z,
      ]

      const entry: SparkEntry = { id: sparkId, position: pos, type: sparkType, active: true }

      setSparks((prev) => [...prev.slice(-7), entry])

      // Deactivate after the spark's fade duration (longest is 0.5s for special)
      setTimeout(() => {
        setSparks((prev) =>
          prev.map((s) => (s.id === sparkId ? { ...s, active: false } : s)),
        )
      }, 600)
    })

    return unsub
  }, [])

  return (
    <>
      {sparks.map((s) => (
        <HitSpark key={s.id} position={s.position} type={s.type} active={s.active} />
      ))}
    </>
  )
}

// ─── SpecialFXProxy — polls getActiveSpecial() each frame ────────────────────

import { useFrame } from '@react-three/fiber'
import type { SpecialFxPhase } from '@/systems/combat/SpecialSystem'

function SpecialFXProxy(): JSX.Element | null {
  const [moveId, setMoveId] = useState<string | null>(null)
  const [phase, setPhase] = useState<SpecialFxPhase | null>(null)

  useFrame(() => {
    const sp = getActiveSpecial()
    if (!sp) {
      if (moveId !== null) setMoveId(null)
      if (phase !== null) setPhase(null)
      return
    }
    if (sp.moveId !== moveId) setMoveId(sp.moveId)
    if (sp.fxPhase !== phase) setPhase(sp.fxPhase)
  })

  if (!moveId || !phase) return null
  return <SpecialFX moveId={moveId} phase={phase} />
}

// ─── Stage ────────────────────────────────────────────────────────────────────

export function Stage(): JSX.Element {
  return (
    <Canvas
      shadows
      camera={{ fov: 60, near: 0.1, far: 300, position: [0, 4, 8] }}
      style={{ width: '100%', height: '100%' }}
      onPointerDown={() => {
        document.body.requestPointerLock()
      }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        castShadow
        position={[10, 20, 10]}
        intensity={1.2}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={60}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <hemisphereLight args={['#87ceeb', '#8B7355', 0.4]} />

      {/* Ground */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshLambertMaterial color="#6b5a3e" />
      </mesh>

      {/* Arena walls */}
      <mesh position={[0, 1, -20]}>
        <boxGeometry args={[40, 2, 0.5]} />
        <meshLambertMaterial color="#7a6040" />
      </mesh>
      <mesh position={[0, 1, 20]}>
        <boxGeometry args={[40, 2, 0.5]} />
        <meshLambertMaterial color="#7a6040" />
      </mesh>
      <mesh position={[-20, 1, 0]}>
        <boxGeometry args={[0.5, 2, 40]} />
        <meshLambertMaterial color="#7a6040" />
      </mesh>
      <mesh position={[20, 1, 0]}>
        <boxGeometry args={[0.5, 2, 40]} />
        <meshLambertMaterial color="#7a6040" />
      </mesh>

      {/* Grid lines on ground */}
      <gridHelper args={[40, 20, '#4a3a20', '#4a3a20']} position={[0, 0.01, 0]} />

      {/* Characters */}
      <PlayerRig />
      <EnemyRigs />

      {/* FX */}
      <HitSparkManager />
      <SpecialFXProxy />

      {/* Camera + GameLoop */}
      <CameraRig />
      <GameLoop />
    </Canvas>
  )
}
