import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCombatStore } from '@/state/useCombatStore'
import { vec3A } from '@/core/math/pools'

// Pre-allocated scratch values — no per-frame heap allocation
const _targetPos = new THREE.Vector3()

// Animation constants
const LERP_POS = 0.18
const LERP_ROT = 0.22
const BREATHE_FREQ = 1.4
const BREATHE_AMP = 0.025
const RUN_BOB_FREQ = 8.0
const RUN_BOB_AMP = 0.06

export function PlayerRig(): JSX.Element {
  const groupRef = useRef<THREE.Group>(null!)
  const bodyRef = useRef<THREE.Mesh>(null!)
  const headRef = useRef<THREE.Mesh>(null!)
  const hairRef = useRef<THREE.Mesh>(null!)
  const scarfRef = useRef<THREE.Mesh>(null!)
  const rightArmRef = useRef<THREE.Mesh>(null!)
  const leftArmRef = useRef<THREE.Mesh>(null!)
  const auraLightRef = useRef<THREE.PointLight>(null!)
  const bodyMatRef = useRef<THREE.MeshToonMaterial>(null!)

  // Mutable animation state (no React state — mutated imperatively)
  const animState = useRef({
    prevFsmState: '' as string,
    prevHp: 100,
    hitFlashTimer: 0,
    specialEnterTimer: 0,
    specialAuraIntensity: 0,
    koFallAngle: 0,
    t: 0,
  })

  useFrame((_, delta) => {
    const entity = useCombatStore.getState().entities['player']
    if (!entity || !groupRef.current) return

    const g = groupRef.current
    const body = bodyRef.current
    const head = headRef.current
    const hair = hairRef.current
    const scarf = scarfRef.current
    const rArm = rightArmRef.current
    const lArm = leftArmRef.current
    const aura = auraLightRef.current
    const mat = bodyMatRef.current
    const anim = animState.current
    const { state, frameCount } = entity.fsm
    const t = (anim.t += delta)

    // --- Position / rotation (no new THREE.Vector3) ---
    _targetPos.set(entity.position.x, entity.position.y, entity.position.z)
    g.position.lerp(_targetPos, LERP_POS)

    // Smooth y rotation
    const targetRy = entity.rotation
    const dy = targetRy - g.rotation.y
    const wrapped = ((dy + Math.PI) % (2 * Math.PI)) - Math.PI
    g.rotation.y += wrapped * LERP_ROT

    // --- Hit flash ---
    if (entity.hp < anim.prevHp) {
      anim.hitFlashTimer = 0.12
    }
    anim.prevHp = entity.hp

    if (anim.hitFlashTimer > 0) {
      anim.hitFlashTimer -= delta
      if (mat) mat.emissiveIntensity = Math.min(1, anim.hitFlashTimer / 0.12) * 2.5
    } else {
      if (mat) mat.emissiveIntensity = 0
    }

    // --- State-specific animation ---
    if (!body || !head) return

    if (state === 'IDLE') {
      const breathe = Math.sin(t * BREATHE_FREQ * Math.PI * 2) * BREATHE_AMP
      body.position.y = 0.9 + breathe
      body.rotation.x = 0
      body.rotation.z = 0
      body.scale.setScalar(1)
      if (rArm) { rArm.rotation.x = 0; rArm.position.set(0.5, 0.85, 0) }
      if (lArm) { lArm.rotation.x = 0; lArm.position.set(-0.5, 0.85, 0) }
      head.position.y = 1.85 + breathe
      if (hair) hair.position.y = 2.08 + breathe
      if (scarf) scarf.position.y = 1.55 + breathe
      if (aura) aura.intensity = 0
    }

    else if (state === 'LOCOMOTION') {
      const spd = Math.sqrt(entity.velocity.x ** 2 + entity.velocity.z ** 2)
      const bob = Math.sin(t * RUN_BOB_FREQ) * RUN_BOB_AMP * Math.min(spd * 2, 1)
      body.position.y = 0.9 + bob
      body.rotation.x = -0.18  // lean forward
      body.rotation.z = 0
      body.scale.setScalar(1)
      head.position.y = 1.85 + bob
      if (hair) hair.position.y = 2.08 + bob
      if (scarf) scarf.position.y = 1.55 + bob
      if (rArm) rArm.rotation.x = -Math.sin(t * RUN_BOB_FREQ) * 0.5
      if (lArm) lArm.rotation.x = Math.sin(t * RUN_BOB_FREQ) * 0.5
      if (aura) aura.intensity = 0
    }

    else if (state === 'ATTACK_LIGHT') {
      // Quick forward lunge: wind-up then snap forward
      const fc = frameCount
      const lungePhase = Math.min(fc / 6, 1)  // 0..1 over first 6 frames
      const recoil = fc > 6 ? Math.max(0, 1 - (fc - 6) / 8) : 0
      body.rotation.x = -lungePhase * 0.35 + recoil * 0.2
      body.position.z = -lungePhase * 0.15 + recoil * 0.08
      body.position.y = 0.9
      if (rArm) {
        rArm.rotation.x = -lungePhase * 1.2
        rArm.position.set(0.5, 0.85 + lungePhase * 0.1, -lungePhase * 0.25)
      }
      if (lArm) lArm.rotation.x = lungePhase * 0.3
      head.position.y = 1.85
      if (aura) aura.intensity = 0
    }

    else if (state === 'ATTACK_HEAVY') {
      const fc = frameCount
      // Wind-up: rotate back over startup (8 frames), then slam forward
      const startup = 8
      if (fc < startup) {
        const wu = fc / startup
        body.rotation.x = wu * 0.45   // lean back
        body.rotation.z = wu * 0.12
        body.position.y = 0.9 + wu * 0.08
        if (rArm) rArm.rotation.x = wu * 0.8
        if (lArm) lArm.rotation.x = wu * 0.8
      } else {
        const slam = Math.min((fc - startup) / 5, 1)
        body.rotation.x = 0.45 - slam * 0.75
        body.rotation.z = 0.12 - slam * 0.12
        body.position.y = 0.9 + 0.08 - slam * 0.12
        if (rArm) rArm.rotation.x = 0.8 - slam * 2.2
        if (lArm) lArm.rotation.x = 0.8 - slam * 2.2
      }
      head.position.y = 1.85
      if (aura) aura.intensity = 0
    }

    else if (state === 'SPECIAL') {
      const fc = frameCount
      const ENTER_FRAMES = 18
      const IMPACT_FRAMES = 28

      if (fc < ENTER_FRAMES) {
        // Rise up + aura builds
        const p = fc / ENTER_FRAMES
        body.position.y = 0.9 + p * 0.3
        head.position.y = 1.85 + p * 0.3
        if (hair) hair.position.y = 2.08 + p * 0.3
        if (scarf) scarf.position.y = 1.55 + p * 0.3
        body.rotation.x = 0
        anim.specialAuraIntensity += (3.5 * p - anim.specialAuraIntensity) * 0.15
        if (aura) aura.intensity = anim.specialAuraIntensity
      } else if (fc < IMPACT_FRAMES) {
        // Impact: thrust forward, bright flash
        const p = (fc - ENTER_FRAMES) / (IMPACT_FRAMES - ENTER_FRAMES)
        body.position.y = 1.2 - p * 0.35
        body.rotation.x = -p * 0.6
        body.position.z = -p * 0.3
        head.position.y = 2.15 - p * 0.3
        if (hair) hair.position.y = 2.38 - p * 0.3
        if (scarf) scarf.position.y = 1.85 - p * 0.3
        if (aura) aura.intensity = 5.0 * (1 - p)
        anim.specialAuraIntensity = aura ? aura.intensity : 0
      } else {
        // Settle back
        body.position.y += (0.9 - body.position.y) * 0.1
        body.rotation.x += (0 - body.rotation.x) * 0.1
        body.position.z += (0 - body.position.z) * 0.1
        head.position.y += (1.85 - head.position.y) * 0.1
        if (hair) hair.position.y += (2.08 - hair.position.y) * 0.1
        if (scarf) scarf.position.y += (1.55 - scarf.position.y) * 0.1
        anim.specialAuraIntensity *= 0.88
        if (aura) aura.intensity = anim.specialAuraIntensity
      }
    }

    else if (state === 'DODGE') {
      // Roll forward: body spins ~360 degrees
      const fc = frameCount
      const rollDur = 18
      const spinAngle = (fc / rollDur) * Math.PI * 2
      body.rotation.x = -spinAngle
      body.position.y = 0.9 + Math.abs(Math.sin(spinAngle * 0.5)) * 0.2
      head.position.y = 1.85 + Math.abs(Math.sin(spinAngle * 0.5)) * 0.2
      if (hair) hair.position.y = 2.08 + Math.abs(Math.sin(spinAngle * 0.5)) * 0.2
      if (scarf) scarf.position.y = 1.55 + Math.abs(Math.sin(spinAngle * 0.5)) * 0.2
      if (aura) aura.intensity = 0
    }

    else if (state === 'BLOCK') {
      // Crouch + arms up
      body.position.y = 0.78
      body.rotation.x = 0.15
      body.scale.y = 0.88
      head.position.y = 1.72
      if (hair) hair.position.y = 1.94
      if (scarf) scarf.position.y = 1.42
      if (rArm) { rArm.rotation.x = -1.1; rArm.position.set(0.44, 1.1, -0.15) }
      if (lArm) { lArm.rotation.x = -1.1; lArm.position.set(-0.44, 1.1, -0.15) }
      if (aura) aura.intensity = 0
    }

    else if (state === 'HIT_REACT') {
      const fc = frameCount
      const shake = Math.sin(fc * 1.8) * Math.max(0, 1 - fc / 12) * 0.18
      body.position.y = 0.9
      body.rotation.x = 0.3 + shake
      body.rotation.z = shake * 0.5
      head.position.y = 1.85
      if (hair) hair.position.y = 2.08
      if (scarf) scarf.position.y = 1.55
      if (rArm) rArm.rotation.x = 0.4
      if (lArm) lArm.rotation.x = 0.4
      if (aura) aura.intensity = 0
    }

    else if (state === 'KO') {
      // Fall to ground over 30 frames
      const targetAngle = -Math.PI / 2
      anim.koFallAngle += (targetAngle - anim.koFallAngle) * 0.05
      body.rotation.x = anim.koFallAngle
      // Shift position down as body falls
      const fallY = 0.9 + Math.sin(Math.max(anim.koFallAngle, -Math.PI / 2)) * 0.9
      body.position.y = Math.max(0.28, fallY)
      head.position.y = Math.max(0.28, fallY + 0.55)
      if (hair) hair.position.y = head.position.y + 0.22
      if (scarf) scarf.position.y = Math.max(0.28, fallY - 0.25)
      if (aura) aura.intensity = 0
    }

    else if (state === 'THROW') {
      // Grab motion: lunge forward
      const fc = frameCount
      const p = Math.min(fc / 10, 1)
      body.rotation.x = -p * 0.5
      body.position.y = 0.9
      body.position.z = -p * 0.25
      if (rArm) { rArm.rotation.x = -p * 1.5; rArm.position.set(0.5, 0.9, -p * 0.2) }
      if (lArm) { lArm.rotation.x = -p * 1.5; lArm.position.set(-0.5, 0.9, -p * 0.2) }
      if (aura) aura.intensity = 0
    }

    else {
      // Fallback: ease everything back to neutral
      body.position.y += (0.9 - body.position.y) * 0.15
      body.rotation.x += (0 - body.rotation.x) * 0.15
      body.rotation.z += (0 - body.rotation.z) * 0.15
      body.scale.y += (1 - body.scale.y) * 0.15
      head.position.y += (1.85 - head.position.y) * 0.15
      if (hair) hair.position.y += (2.08 - hair.position.y) * 0.15
      if (scarf) scarf.position.y += (1.55 - scarf.position.y) * 0.15
      if (aura) aura.intensity = 0
    }

    // Reset z drift when not in attack/throw/dodge
    if (state !== 'ATTACK_LIGHT' && state !== 'ATTACK_HEAVY' && state !== 'THROW' && state !== 'DODGE') {
      if (state !== 'SPECIAL') {
        body.position.z += (0 - body.position.z) * 0.12
      }
    }

    anim.prevFsmState = state
  })

  // Use a single pooled scratch to avoid lint unused-import warning
  void vec3A

  return (
    <group ref={groupRef}>
      {/* Body — 学ラン dark navy */}
      <mesh ref={bodyRef} position={[0, 0.9, 0]} castShadow>
        <capsuleGeometry args={[0.38, 1.1, 8, 16]} />
        <meshToonMaterial
          ref={bodyMatRef}
          color="#1a1a3a"
          emissive="#ffcc00"
          emissiveIntensity={0}
        />
      </mesh>

      {/* Yellow trim stripe on chest */}
      <mesh position={[0, 1.05, 0.37]} castShadow>
        <boxGeometry args={[0.55, 0.06, 0.04]} />
        <meshToonMaterial color="#d4a800" />
      </mesh>
      <mesh position={[0, 0.92, 0.37]} castShadow>
        <boxGeometry args={[0.55, 0.06, 0.04]} />
        <meshToonMaterial color="#d4a800" />
      </mesh>

      {/* Scarf */}
      <mesh ref={scarfRef} position={[0, 1.55, 0]} castShadow>
        <boxGeometry args={[0.55, 0.18, 0.55]} />
        <meshToonMaterial color="#cc1111" />
      </mesh>

      {/* Head */}
      <mesh ref={headRef} position={[0, 1.85, 0]} castShadow>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshToonMaterial color="#f0c080" />
      </mesh>

      {/* Eyes — left */}
      <mesh position={[-0.1, 1.87, 0.24]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshBasicMaterial color="#1a0a00" />
      </mesh>
      {/* Eyes — right */}
      <mesh position={[0.1, 1.87, 0.24]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshBasicMaterial color="#1a0a00" />
      </mesh>

      {/* Hair — regent pompadour */}
      <mesh ref={hairRef} position={[0, 2.1, -0.04]} castShadow>
        <coneGeometry args={[0.22, 0.42, 8]} />
        <meshToonMaterial color="#0d0700" />
      </mesh>
      {/* Hair base bulk */}
      <mesh position={[0, 1.97, 0.02]} castShadow>
        <sphereGeometry args={[0.27, 10, 8]} />
        <meshToonMaterial color="#0d0700" />
      </mesh>

      {/* Right arm */}
      <mesh ref={rightArmRef} position={[0.5, 0.85, 0]} castShadow>
        <boxGeometry args={[0.18, 0.72, 0.18]} />
        <meshToonMaterial color="#1a1a3a" />
      </mesh>

      {/* Left arm */}
      <mesh ref={leftArmRef} position={[-0.5, 0.85, 0]} castShadow>
        <boxGeometry args={[0.18, 0.72, 0.18]} />
        <meshToonMaterial color="#1a1a3a" />
      </mesh>

      {/* Special aura point light (intensity 0 at rest) */}
      <pointLight
        ref={auraLightRef}
        position={[0, 1.2, 0]}
        color="#ffcc00"
        intensity={0}
        distance={5}
        decay={2}
      />
    </group>
  )
}
