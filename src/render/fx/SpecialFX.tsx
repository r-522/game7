import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Pre-allocated scratch (shared across all effects within a single frame pass)
const _col = new THREE.Color()

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  moveId: string | null
  phase: 'enter' | 'impact' | 'exit' | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function useTimer() {
  const t = useRef(0)
  return t
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SpecialFX({ moveId, phase }: Props): JSX.Element | null {
  if (!moveId || !phase) return null

  // Derive effect type from moveId suffix/prefix
  if (moveId.includes('lightning') || moveId.includes('thunder')) {
    return <LightningFX phase={phase} />
  }
  if (moveId.includes('tornado') || moveId.includes('wind')) {
    return <TornadoFX phase={phase} />
  }
  if (moveId.includes('fire') || moveId.includes('flame')) {
    return <FireFX phase={phase} />
  }
  if (moveId.includes('earth') || moveId.includes('ground')) {
    return <EarthFX phase={phase} />
  }
  if (moveId.includes('rush') || moveId.includes('dash')) {
    return <RushFX phase={phase} />
  }
  // Default: aura (covers 'aura', 'super', 'special', or unknown moves)
  return <AuraFX phase={phase} />
}

// ─── Lightning FX ────────────────────────────────────────────────────────────

function LightningFX({ phase }: { phase: string }): JSX.Element {
  const ring1Ref = useRef<THREE.Mesh>(null!)
  const ring2Ref = useRef<THREE.Mesh>(null!)
  const mat1Ref = useRef<THREE.MeshBasicMaterial>(null!)
  const mat2Ref = useRef<THREE.MeshBasicMaterial>(null!)
  const flashRef = useRef<THREE.Mesh>(null!)
  const flashMatRef = useRef<THREE.MeshBasicMaterial>(null!)
  const t = useTimer()

  useFrame((_, delta) => {
    t.current += delta
    const time = t.current
    const isEnter = phase === 'enter'
    const isImpact = phase === 'impact'
    const isExit = phase === 'exit'

    const r1 = ring1Ref.current
    const r2 = ring2Ref.current
    const m1 = mat1Ref.current
    const m2 = mat2Ref.current
    const flash = flashRef.current
    const flashMat = flashMatRef.current

    if (!r1 || !r2 || !flash) return

    if (isEnter) {
      // Expanding white/blue rings
      const expand = (time % 0.6) / 0.6
      r1.scale.setScalar(0.2 + expand * 2.2)
      r2.scale.setScalar(0.2 + ((time + 0.3) % 0.6) / 0.6 * 2.2)
      if (m1) m1.opacity = (1 - expand) * 0.9
      if (m2) m2.opacity = (1 - ((time + 0.3) % 0.6) / 0.6) * 0.9
      r1.visible = true; r2.visible = true
      if (flash) flash.visible = false
    } else if (isImpact) {
      // Full-screen bright flash
      if (flash) {
        flash.visible = true
        const fProgress = Math.min(time / 0.25, 1)
        if (flashMat) flashMat.opacity = Math.max(0, 1 - fProgress) * 0.95
        flash.scale.setScalar(3.5)
      }
      r1.visible = false; r2.visible = false
    } else if (isExit) {
      // Fade rings out
      const fade = Math.max(0, 1 - time / 0.4)
      r1.scale.setScalar(2.5 + time * 0.8)
      r2.scale.setScalar(2.8 + time * 0.8)
      if (m1) m1.opacity = fade * 0.5
      if (m2) m2.opacity = fade * 0.3
      if (flash) flash.visible = false
    }
  })

  return (
    <group>
      <mesh ref={ring1Ref} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.5, 0]}>
        <ringGeometry args={[0.7, 0.9, 32]} />
        <meshBasicMaterial ref={mat1Ref} color="#aaddff" transparent opacity={0.9} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring2Ref} rotation={[Math.PI / 2, 0, 0]} position={[0, 1.0, 0]}>
        <ringGeometry args={[0.7, 0.9, 32]} />
        <meshBasicMaterial ref={mat2Ref} color="#ffffff" transparent opacity={0.7} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {/* Flash sphere */}
      <mesh ref={flashRef} position={[0, 1.0, 0]} visible={false}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial ref={flashMatRef} color="#ffffff" transparent opacity={0.95} depthWrite={false} side={THREE.BackSide} />
      </mesh>
    </group>
  )
}

// ─── Tornado FX ───────────────────────────────────────────────────────────────

function TornadoFX({ phase }: { phase: string }): JSX.Element {
  const spiralRef = useRef<THREE.Mesh>(null!)
  const innerRef = useRef<THREE.Mesh>(null!)
  const matRef = useRef<THREE.MeshBasicMaterial>(null!)
  const innerMatRef = useRef<THREE.MeshBasicMaterial>(null!)
  const t = useTimer()

  useFrame((_, delta) => {
    t.current += delta
    const time = t.current
    const spiral = spiralRef.current
    const inner = innerRef.current
    const mat = matRef.current
    const innerMat = innerMatRef.current

    if (!spiral || !inner) return

    const isExit = phase === 'exit'
    const speed = phase === 'impact' ? 18 : 10
    spiral.rotation.y = time * speed
    inner.rotation.y = -(time * speed * 1.4)

    const scale = phase === 'enter'
      ? Math.min(time / 0.4, 1)
      : phase === 'exit'
        ? Math.max(0, 1 - time / 0.35)
        : 1

    spiral.scale.setScalar(scale)
    inner.scale.setScalar(scale * 0.6)

    if (mat) mat.opacity = scale * 0.75
    if (innerMat) innerMat.opacity = scale * 0.55

    spiral.visible = scale > 0.01
    inner.visible = scale > 0.01
    void isExit
  })

  return (
    <group position={[0, 0.8, 0]}>
      <mesh ref={spiralRef}>
        <coneGeometry args={[0.8, 2.2, 12, 6, true]} />
        <meshBasicMaterial ref={matRef} color="#88ccff" transparent opacity={0.75} depthWrite={false} side={THREE.DoubleSide} wireframe />
      </mesh>
      <mesh ref={innerRef}>
        <coneGeometry args={[0.45, 1.6, 8, 4, true]} />
        <meshBasicMaterial ref={innerMatRef} color="#cceeff" transparent opacity={0.55} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// ─── Fire FX ──────────────────────────────────────────────────────────────────

function FireFX({ phase }: { phase: string }): JSX.Element {
  const outerRef = useRef<THREE.Mesh>(null!)
  const innerRef = useRef<THREE.Mesh>(null!)
  const outerMatRef = useRef<THREE.MeshBasicMaterial>(null!)
  const innerMatRef = useRef<THREE.MeshBasicMaterial>(null!)
  const t = useTimer()

  useFrame((_, delta) => {
    t.current += delta
    const time = t.current
    const outer = outerRef.current
    const inner = innerRef.current
    const outerMat = outerMatRef.current
    const innerMat = innerMatRef.current

    if (!outer || !inner) return

    const pulse = 1 + Math.sin(time * 12) * 0.08

    const scale = phase === 'enter'
      ? Math.min(time / 0.3, 1) * pulse
      : phase === 'impact'
        ? (1 + Math.min(time / 0.15, 1) * 0.6) * pulse
        : Math.max(0, 1 - time / 0.4) * pulse

    outer.scale.setScalar(scale * 1.4)
    inner.scale.setScalar(scale * 0.85)

    // Flicker color between orange and red
    _col.setHex(0xff4400).lerp(_col.clone().setHex(0xff8800), (Math.sin(time * 20) + 1) * 0.5)

    if (outerMat) {
      outerMat.color.copy(_col)
      outerMat.opacity = Math.min(scale * 0.7, 0.7)
    }
    if (innerMat) {
      innerMat.opacity = Math.min(scale * 0.85, 0.85)
    }

    outer.visible = scale > 0.01
    inner.visible = scale > 0.01
  })

  return (
    <group position={[0, 0.7, 0]}>
      <mesh ref={outerRef}>
        <sphereGeometry args={[0.9, 16, 12]} />
        <meshBasicMaterial ref={outerMatRef} color="#ff4400" transparent opacity={0.7} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={innerRef}>
        <sphereGeometry args={[0.55, 12, 10]} />
        <meshBasicMaterial ref={innerMatRef} color="#ffaa00" transparent opacity={0.85} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ─── Earth FX ─────────────────────────────────────────────────────────────────

// Pre-built debris positions (no per-frame allocation)
const DEBRIS_COUNT = 10
const debrisPositions = Array.from({ length: DEBRIS_COUNT }, (_, i) => {
  const angle = (i / DEBRIS_COUNT) * Math.PI * 2
  const r = 0.7 + (i % 3) * 0.3
  return [Math.cos(angle) * r, (i % 4) * 0.18, Math.sin(angle) * r] as [number, number, number]
})
const debrisSizes = Array.from({ length: DEBRIS_COUNT }, (_, i) => 0.08 + (i % 4) * 0.04)

function EarthFX({ phase }: { phase: string }): JSX.Element {
  const ringRef = useRef<THREE.Mesh>(null!)
  const ringMatRef = useRef<THREE.MeshBasicMaterial>(null!)
  const debrisRefs = useRef<(THREE.Mesh | null)[]>(debrisPositions.map(() => null))
  const t = useTimer()

  useFrame((_, delta) => {
    t.current += delta
    const time = t.current
    const ring = ringRef.current
    const ringMat = ringMatRef.current

    const scale = phase === 'enter'
      ? Math.min(time / 0.25, 1)
      : phase === 'impact'
        ? 1 + Math.min(time / 0.2, 1) * 0.5
        : Math.max(0, 1 - time / 0.45)

    if (ring) {
      ring.scale.setScalar(scale * 1.6)
      ring.visible = scale > 0.01
      if (ringMat) ringMat.opacity = scale * 0.8
    }

    // Animate debris radially outward and up
    for (let i = 0; i < DEBRIS_COUNT; i++) {
      const mesh = debrisRefs.current[i]
      if (!mesh) continue

      const base = debrisPositions[i]
      const launch = phase === 'impact' ? Math.min(time / 0.35, 1) : scale
      const arc = Math.sin(launch * Math.PI) * 0.6
      mesh.position.set(
        base[0] * (1 + launch * 0.9),
        base[1] + arc,
        base[2] * (1 + launch * 0.9),
      )
      mesh.rotation.x += delta * 4
      mesh.rotation.z += delta * 3
      mesh.visible = scale > 0.01
    }
  })

  return (
    <group position={[0, 0.05, 0]}>
      {/* Ground ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.75, 28]} />
        <meshBasicMaterial ref={ringMatRef} color="#8B5E3C" transparent opacity={0.8} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {/* Debris chunks */}
      {debrisPositions.map((pos, i) => (
        <mesh
          key={i}
          ref={(el) => { debrisRefs.current[i] = el }}
          position={pos}
          visible={false}
        >
          <boxGeometry args={[debrisSizes[i], debrisSizes[i], debrisSizes[i]]} />
          <meshToonMaterial color="#7a5230" />
        </mesh>
      ))}
    </group>
  )
}

// ─── Rush FX (motion blur streaks) ───────────────────────────────────────────

const STREAK_COUNT = 6
const streakOffsets = Array.from({ length: STREAK_COUNT }, (_, i) => ({
  x: (Math.random() - 0.5) * 0.6,
  y: 0.5 + i * 0.22,
  len: 0.4 + Math.random() * 0.6,
  delay: i * 0.02,
}))

function RushFX({ phase }: { phase: string }): JSX.Element {
  const streakRefs = useRef<(THREE.Mesh | null)[]>(streakOffsets.map(() => null))
  const matRefs = useRef<(THREE.MeshBasicMaterial | null)[]>(streakOffsets.map(() => null))
  const t = useTimer()

  useFrame((_, delta) => {
    t.current += delta
    const time = t.current

    for (let i = 0; i < STREAK_COUNT; i++) {
      const mesh = streakRefs.current[i]
      const mat = matRefs.current[i]
      if (!mesh || !mat) continue

      const streak = streakOffsets[i]
      const localT = time - streak.delay

      const opacity = phase === 'enter'
        ? Math.max(0, Math.min(localT / 0.1, 1)) * 0.8
        : phase === 'impact'
          ? 0.85 + Math.sin(localT * 30) * 0.15
          : Math.max(0, 1 - localT / 0.3) * 0.8

      mat.opacity = opacity
      mesh.visible = opacity > 0.01

      // Streak moves backward during impact
      mesh.position.z = phase === 'impact' ? localT * -1.5 : 0
    }
  })

  return (
    <group>
      {streakOffsets.map((s, i) => (
        <mesh
          key={i}
          ref={(el) => { streakRefs.current[i] = el }}
          position={[s.x, s.y, 0]}
          rotation={[0, 0, 0]}
          visible={false}
        >
          <boxGeometry args={[0.04, 0.04, s.len]} />
          <meshBasicMaterial
            ref={(el) => { matRefs.current[i] = el }}
            color="#aaddff"
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

// ─── Aura FX (default / fallback) ────────────────────────────────────────────

function AuraFX({ phase }: { phase: string }): JSX.Element {
  const outerRef = useRef<THREE.Mesh>(null!)
  const innerRef = useRef<THREE.Mesh>(null!)
  const outerMatRef = useRef<THREE.MeshBasicMaterial>(null!)
  const innerMatRef = useRef<THREE.MeshBasicMaterial>(null!)
  const t = useTimer()

  // Pre-allocated color scratch
  const colA = useMemo(() => new THREE.Color('#ffcc00'), [])
  const colB = useMemo(() => new THREE.Color('#ff8800'), [])

  useFrame((_, delta) => {
    t.current += delta
    const time = t.current
    const outer = outerRef.current
    const inner = innerRef.current
    const outerMat = outerMatRef.current
    const innerMat = innerMatRef.current

    if (!outer || !inner) return

    const pulse = 1 + Math.sin(time * 7) * 0.06

    const scale = phase === 'enter'
      ? Math.min(time / 0.35, 1) * pulse
      : phase === 'impact'
        ? (1 + Math.min(time / 0.12, 1) * 0.45) * pulse
        : Math.max(0, 1 - time / 0.4) * pulse

    outer.scale.setScalar(scale * 1.3)
    inner.scale.setScalar(scale * 0.75)

    // Pulse between gold and orange
    const lerpT = (Math.sin(time * 10) + 1) * 0.5
    _col.copy(colA).lerp(colB, lerpT)

    if (outerMat) {
      outerMat.color.copy(_col)
      outerMat.opacity = Math.min(scale * 0.65, 0.65)
    }
    if (innerMat) {
      innerMat.opacity = Math.min(scale * 0.9, 0.9)
    }

    outer.visible = scale > 0.01
    inner.visible = scale > 0.01
  })

  return (
    <group position={[0, 0.9, 0]}>
      <mesh ref={outerRef}>
        <sphereGeometry args={[0.85, 16, 14]} />
        <meshBasicMaterial ref={outerMatRef} color="#ffcc00" transparent opacity={0.65} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={innerRef}>
        <sphereGeometry args={[0.5, 12, 10]} />
        <meshBasicMaterial ref={innerMatRef} color="#ffee88" transparent opacity={0.9} depthWrite={false} />
      </mesh>
    </group>
  )
}
