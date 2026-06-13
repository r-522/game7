import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCombatStore } from '@/state/useCombatStore'
import type { EntityId } from '@/types'

interface Props {
  entityId: EntityId
}

export function EnemyRig({ entityId }: Props): JSX.Element | null {
  const groupRef = useRef<THREE.Group>(null!)

  useFrame(() => {
    const entity = useCombatStore.getState().entities[entityId]
    if (!entity || !groupRef.current) return
    const g = groupRef.current
    g.position.lerp(new THREE.Vector3(entity.position.x, entity.position.y, entity.position.z), 0.15)
    g.rotation.y = entity.rotation
    g.visible = entity.hp > 0
  })

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <capsuleGeometry args={[0.4, 1.0, 8, 16]} />
        <meshToonMaterial color="#2980b9" />
      </mesh>
      <mesh position={[0, 1.85, 0]} castShadow>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshToonMaterial color="#f0c080" />
      </mesh>
      {/* HP bar (world space) */}
      <EnemyHpBar entityId={entityId} />
    </group>
  )
}

function EnemyHpBar({ entityId }: { entityId: EntityId }): JSX.Element {
  const bgRef = useRef<THREE.Mesh>(null!)
  const fgRef = useRef<THREE.Mesh>(null!)

  useFrame(() => {
    const entity = useCombatStore.getState().entities[entityId]
    if (!entity) return
    const pct = entity.hp / entity.maxHp
    if (fgRef.current) {
      fgRef.current.scale.x = Math.max(0, pct)
      fgRef.current.position.x = (pct - 1) * 0.4
    }
  })

  return (
    <group position={[0, 2.4, 0]}>
      <mesh ref={bgRef}>
        <boxGeometry args={[0.8, 0.08, 0.01]} />
        <meshBasicMaterial color="#333" />
      </mesh>
      <mesh ref={fgRef}>
        <boxGeometry args={[0.8, 0.06, 0.02]} />
        <meshBasicMaterial color="#e74c3c" />
      </mesh>
    </group>
  )
}
