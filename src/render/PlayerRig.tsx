import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCombatStore } from '@/state/useCombatStore'

const LERP = 0.2

export function PlayerRig(): JSX.Element {
  const groupRef = useRef<THREE.Group>(null!)
  const bodyRef = useRef<THREE.Mesh>(null!)

  useFrame(() => {
    const entity = useCombatStore.getState().entities['player']
    if (!entity || !groupRef.current) return

    const g = groupRef.current
    g.position.lerp(new THREE.Vector3(entity.position.x, entity.position.y, entity.position.z), LERP)
    g.rotation.y = entity.rotation

    // Animate based on FSM state
    if (bodyRef.current) {
      const state = entity.fsm.state
      const fc = entity.fsm.frameCount
      if (state === 'ATTACK_LIGHT' || state === 'ATTACK_HEAVY') {
        bodyRef.current.rotation.x = Math.sin(fc * 0.3) * 0.4
      } else if (state === 'HIT_REACT') {
        bodyRef.current.rotation.x = -0.3
      } else {
        bodyRef.current.rotation.x += (0 - bodyRef.current.rotation.x) * 0.2
      }
    }
  })

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh ref={bodyRef} position={[0, 0.9, 0]} castShadow>
        <capsuleGeometry args={[0.4, 1.0, 8, 16]} />
        <meshToonMaterial color="#c0392b" />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.85, 0]} castShadow>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshToonMaterial color="#f0c080" />
      </mesh>
      {/* Hair (regent style) */}
      <mesh position={[0, 2.08, -0.05]} castShadow>
        <coneGeometry args={[0.2, 0.35, 8]} />
        <meshToonMaterial color="#1a0a00" />
      </mesh>
    </group>
  )
}
