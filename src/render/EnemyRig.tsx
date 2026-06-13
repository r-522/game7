import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCombatStore } from '@/state/useCombatStore'
import type { EntityId } from '@/types'

// Pre-allocated scratch — no per-frame heap allocation
const _targetPos = new THREE.Vector3()

const LERP_POS = 0.15
const LERP_ROT = 0.2
const BREATHE_FREQ = 1.1
const BREATHE_AMP = 0.022

interface Props {
  entityId: EntityId
  bodyColor?: string
}

export function EnemyRig({ entityId, bodyColor = '#2d2d6e' }: Props): JSX.Element {
  const groupRef = useRef<THREE.Group>(null!)
  const bodyRef = useRef<THREE.Mesh>(null!)
  const headRef = useRef<THREE.Mesh>(null!)
  const rArmRef = useRef<THREE.Mesh>(null!)
  const lArmRef = useRef<THREE.Mesh>(null!)
  const bodyMatRef = useRef<THREE.MeshToonMaterial>(null!)

  const animState = useRef({
    prevHp: -1,
    hitFlashTimer: 0,
    koFallAngle: 0,
    t: 0,
  })

  useFrame((_, delta) => {
    const entity = useCombatStore.getState().entities[entityId]
    if (!entity || !groupRef.current) return

    const g = groupRef.current
    const body = bodyRef.current
    const head = headRef.current
    const rArm = rArmRef.current
    const lArm = lArmRef.current
    const mat = bodyMatRef.current
    const anim = animState.current
    const { state, frameCount } = entity.fsm
    const t = (anim.t += delta)

    // First tick: initialise prevHp
    if (anim.prevHp < 0) anim.prevHp = entity.hp

    // --- Position ---
    _targetPos.set(entity.position.x, entity.position.y, entity.position.z)
    g.position.lerp(_targetPos, LERP_POS)

    // --- Rotation (smooth, shortest arc) ---
    const dy = entity.rotation - g.rotation.y
    const wrapped = ((dy + Math.PI) % (2 * Math.PI)) - Math.PI
    g.rotation.y += wrapped * LERP_ROT

    // Visible only while alive (or falling)
    g.visible = true

    // --- Hit flash ---
    if (entity.hp < anim.prevHp) {
      anim.hitFlashTimer = 0.14
    }
    anim.prevHp = entity.hp

    if (anim.hitFlashTimer > 0) {
      anim.hitFlashTimer -= delta
      if (mat) mat.emissiveIntensity = (anim.hitFlashTimer / 0.14) * 2.0
    } else {
      if (mat) mat.emissiveIntensity = 0
    }

    if (!body || !head) return

    // --- State animation ---
    if (state === 'KO') {
      const targetAngle = -Math.PI / 2
      anim.koFallAngle += (targetAngle - anim.koFallAngle) * 0.04
      body.rotation.x = anim.koFallAngle
      const fallY = 0.9 + Math.sin(Math.max(anim.koFallAngle, -Math.PI / 2)) * 0.9
      body.position.y = Math.max(0.28, fallY)
      head.position.y = Math.max(0.28, fallY + 0.55)
      body.rotation.z = 0
      if (rArm) rArm.rotation.x = 0
      if (lArm) lArm.rotation.x = 0
    }

    else if (state === 'HIT_REACT') {
      const shake = Math.sin(frameCount * 1.9) * Math.max(0, 1 - frameCount / 12) * 0.2
      body.position.y = 0.9
      body.rotation.x = 0.32 + shake
      body.rotation.z = shake * 0.6
      head.position.y = 1.85
      if (rArm) rArm.rotation.x = 0.5
      if (lArm) lArm.rotation.x = 0.5
    }

    else if (state === 'ATTACK_LIGHT') {
      const p = Math.min(frameCount / 6, 1)
      const recoil = frameCount > 6 ? Math.max(0, 1 - (frameCount - 6) / 8) : 0
      body.rotation.x = -p * 0.3 + recoil * 0.18
      body.position.y = 0.9
      body.rotation.z = 0
      if (rArm) rArm.rotation.x = -p * 1.0
      if (lArm) lArm.rotation.x = 0
      head.position.y = 1.85
    }

    else if (state === 'ATTACK_HEAVY') {
      const startup = 8
      if (frameCount < startup) {
        const wu = frameCount / startup
        body.rotation.x = wu * 0.4
        body.rotation.z = wu * 0.1
        body.position.y = 0.9 + wu * 0.07
        if (rArm) rArm.rotation.x = wu * 0.7
      } else {
        const slam = Math.min((frameCount - startup) / 5, 1)
        body.rotation.x = 0.4 - slam * 0.7
        body.rotation.z = 0.1 - slam * 0.1
        body.position.y = 0.97 - slam * 0.1
        if (rArm) rArm.rotation.x = 0.7 - slam * 2.0
      }
      head.position.y = 1.85
    }

    else if (state === 'IDLE') {
      const breathe = Math.sin(t * BREATHE_FREQ * Math.PI * 2) * BREATHE_AMP
      body.position.y = 0.9 + breathe
      body.rotation.x += (0 - body.rotation.x) * 0.1
      body.rotation.z += (0 - body.rotation.z) * 0.1
      head.position.y = 1.85 + breathe
      if (rArm) rArm.rotation.x += (0 - rArm.rotation.x) * 0.1
      if (lArm) lArm.rotation.x += (0 - lArm.rotation.x) * 0.1
    }

    else if (state === 'LOCOMOTION') {
      const bob = Math.sin(t * 8.0) * 0.055
      body.position.y = 0.9 + bob
      body.rotation.x = -0.16
      body.rotation.z = 0
      head.position.y = 1.85 + bob
      if (rArm) rArm.rotation.x = -Math.sin(t * 8.0) * 0.45
      if (lArm) lArm.rotation.x = Math.sin(t * 8.0) * 0.45
    }

    else if (state === 'BLOCK') {
      body.position.y = 0.78
      body.rotation.x = 0.15
      body.scale.y = 0.88
      head.position.y = 1.72
      if (rArm) { rArm.rotation.x = -1.0; rArm.position.set(0.44, 1.1, -0.12) }
      if (lArm) { lArm.rotation.x = -1.0; lArm.position.set(-0.44, 1.1, -0.12) }
    }

    else {
      // Ease to neutral
      body.position.y += (0.9 - body.position.y) * 0.15
      body.rotation.x += (0 - body.rotation.x) * 0.15
      body.rotation.z += (0 - body.rotation.z) * 0.15
      body.scale.y += (1 - body.scale.y) * 0.15
      head.position.y += (1.85 - head.position.y) * 0.15
      if (rArm) {
        rArm.rotation.x += (0 - rArm.rotation.x) * 0.15
        rArm.position.x += (0.5 - rArm.position.x) * 0.15
        rArm.position.y += (0.85 - rArm.position.y) * 0.15
        rArm.position.z += (0 - rArm.position.z) * 0.15
      }
      if (lArm) {
        lArm.rotation.x += (0 - lArm.rotation.x) * 0.15
        lArm.position.x += (-0.5 - lArm.position.x) * 0.15
        lArm.position.y += (0.85 - lArm.position.y) * 0.15
        lArm.position.z += (0 - lArm.position.z) * 0.15
      }
    }
  })

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh ref={bodyRef} position={[0, 0.9, 0]} castShadow>
        <capsuleGeometry args={[0.38, 1.1, 8, 16]} />
        <meshToonMaterial
          ref={bodyMatRef}
          color={bodyColor}
          emissive="#ff4400"
          emissiveIntensity={0}
        />
      </mesh>

      {/* Head */}
      <mesh ref={headRef} position={[0, 1.85, 0]} castShadow>
        <sphereGeometry args={[0.27, 10, 10]} />
        <meshToonMaterial color="#e8b870" />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.09, 1.87, 0.23]}>
        <sphereGeometry args={[0.035, 6, 6]} />
        <meshBasicMaterial color="#200a00" />
      </mesh>
      <mesh position={[0.09, 1.87, 0.23]}>
        <sphereGeometry args={[0.035, 6, 6]} />
        <meshBasicMaterial color="#200a00" />
      </mesh>

      {/* Right arm */}
      <mesh ref={rArmRef} position={[0.5, 0.85, 0]} castShadow>
        <boxGeometry args={[0.17, 0.7, 0.17]} />
        <meshToonMaterial color={bodyColor} />
      </mesh>

      {/* Left arm */}
      <mesh ref={lArmRef} position={[-0.5, 0.85, 0]} castShadow>
        <boxGeometry args={[0.17, 0.7, 0.17]} />
        <meshToonMaterial color={bodyColor} />
      </mesh>

      {/* World-space HP bar (hidden when KO) */}
      <EnemyHpBar entityId={entityId} />
    </group>
  )
}

// ─── HP Bar ──────────────────────────────────────────────────────────────────

interface HpBarProps {
  entityId: EntityId
}

function EnemyHpBar({ entityId }: HpBarProps): JSX.Element {
  const rootRef = useRef<THREE.Group>(null!)
  const fgRef = useRef<THREE.Mesh>(null!)
  const fgMatRef = useRef<THREE.MeshBasicMaterial>(null!)

  useFrame(() => {
    const entity = useCombatStore.getState().entities[entityId]
    if (!entity || !rootRef.current) return

    const isDead = entity.hp <= 0 || entity.fsm.state === 'KO'
    rootRef.current.visible = !isDead

    if (!isDead && fgRef.current) {
      const pct = Math.max(0, entity.hp / entity.maxHp)
      fgRef.current.scale.x = pct
      fgRef.current.position.x = (pct - 1) * 0.45

      // Color gradient: green -> yellow -> red
      if (fgMatRef.current) {
        if (pct > 0.5) {
          fgMatRef.current.color.setHex(0x22cc44)
        } else if (pct > 0.25) {
          fgMatRef.current.color.setHex(0xddcc00)
        } else {
          fgMatRef.current.color.setHex(0xee2222)
        }
      }
    }
  })

  return (
    <group ref={rootRef} position={[0, 2.5, 0]}>
      {/* Background bar */}
      <mesh>
        <boxGeometry args={[0.9, 0.1, 0.01]} />
        <meshBasicMaterial color="#222222" />
      </mesh>
      {/* Foreground health fill */}
      <mesh ref={fgRef} position={[0, 0, 0.005]}>
        <boxGeometry args={[0.9, 0.08, 0.01]} />
        <meshBasicMaterial ref={fgMatRef} color="#22cc44" />
      </mesh>
    </group>
  )
}
