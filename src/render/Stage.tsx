import { Canvas } from '@react-three/fiber'
import { PlayerRig } from '@/render/PlayerRig'
import { EnemyRig } from '@/render/EnemyRig'
import { CameraRig } from '@/render/camera/CameraRig'
import { GameLoop } from '@/render/GameLoop'
import { useCombatStore } from '@/state/useCombatStore'
import { useEffect, useState } from 'react'
import type { EntityId } from '@/types'

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

      {/* Arena walls (invisible collision helpers) */}
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

      {/* Camera + GameLoop */}
      <CameraRig />
      <GameLoop />
    </Canvas>
  )
}
