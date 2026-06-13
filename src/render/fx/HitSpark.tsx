import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Particle config per type
const CONFIGS = {
  light: { count: 8, speed: 2.8, size: 0.06, colorA: '#ffffff', colorB: '#ffdd88', fadeDur: 0.28 },
  heavy: { count: 12, speed: 4.2, size: 0.1, colorA: '#ffffff', colorB: '#ff8833', fadeDur: 0.36 },
  special: { count: 16, speed: 6.0, size: 0.14, colorA: '#ffee44', colorB: '#ffaa00', fadeDur: 0.5 },
} as const

interface Props {
  position: [number, number, number]
  type: 'light' | 'heavy' | 'special'
  active: boolean
}

// Pre-allocated per-instance scratch — one set per HitSpark mount
// (not per frame, so no hot-path alloc)
function makeParticles(count: number, speed: number) {
  const dirs: THREE.Vector3[] = []
  const seeds: number[] = []
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI
    dirs.push(new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.sin(phi) * Math.sin(theta),
      Math.cos(phi),
    ).multiplyScalar(speed * (0.6 + Math.random() * 0.8)))
    seeds.push(Math.random())
  }
  return { dirs, seeds }
}

export function HitSpark({ position, type, active }: Props): JSX.Element {
  const cfg = CONFIGS[type]

  // Particle positions buffer (updated imperatively — no React state)
  const posArr = useMemo(() => new Float32Array(cfg.count * 3), [cfg.count])
  const bufAttr = useRef<THREE.BufferAttribute>(null!)
  const pointsRef = useRef<THREE.Points>(null!)
  const matRef = useRef<THREE.PointsMaterial>(null!)
  const ringRef = useRef<THREE.Mesh>(null!)
  const ringMatRef = useRef<THREE.MeshBasicMaterial>(null!)

  // Particle simulation state (reset each time active flips true)
  const sim = useRef({
    alive: false,
    timer: 0,
    particles: makeParticles(cfg.count, cfg.speed),
    origins: new Float32Array(cfg.count * 3), // birth positions
  })

  // Track previous active to detect rising edge
  const prevActive = useRef(false)

  useFrame((_, delta) => {
    const s = sim.current
    const pts = pointsRef.current
    const mat = matRef.current
    const ring = ringRef.current
    const ringMat = ringMatRef.current

    // Rising edge: activate burst
    if (active && !prevActive.current) {
      s.alive = true
      s.timer = 0
      // Re-randomise directions on each burst
      s.particles = makeParticles(cfg.count, cfg.speed)
      // Reset all particle origins to spawn position
      for (let i = 0; i < cfg.count; i++) {
        s.origins[i * 3] = 0
        s.origins[i * 3 + 1] = 0
        s.origins[i * 3 + 2] = 0
      }
    }
    prevActive.current = active

    if (!s.alive) {
      if (pts) pts.visible = false
      if (ring) ring.visible = false
      return
    }

    s.timer += delta
    const progress = s.timer / cfg.fadeDur

    if (progress >= 1) {
      s.alive = false
      if (pts) pts.visible = false
      if (ring) ring.visible = false
      return
    }

    // Update particle positions
    for (let i = 0; i < cfg.count; i++) {
      const dir = s.particles.dirs[i]
      posArr[i * 3] = dir.x * progress
      posArr[i * 3 + 1] = dir.y * progress
      posArr[i * 3 + 2] = dir.z * progress
    }

    if (bufAttr.current) {
      bufAttr.current.needsUpdate = true
    }

    if (pts) {
      pts.visible = true
    }

    // Fade opacity
    const opacity = Math.max(0, 1 - progress)
    if (mat) {
      mat.opacity = opacity
      mat.size = cfg.size * (1 + progress * 0.8)
    }

    // Ring expansion (special only)
    if (type === 'special' && ring) {
      ring.visible = true
      const ringScale = 0.1 + progress * 2.5
      ring.scale.setScalar(ringScale)
      if (ringMat) ringMat.opacity = opacity * 0.85
    } else if (ring) {
      ring.visible = false
    }
  })

  const colorA = new THREE.Color(cfg.colorA)
  const colorB = new THREE.Color(cfg.colorB)
  // Lerp color to midpoint for the material
  const midColor = colorA.clone().lerp(colorB, 0.5)

  return (
    <group position={position}>
      {/* Particle burst */}
      <points ref={pointsRef} visible={false}>
        <bufferGeometry>
          <bufferAttribute
            ref={bufAttr}
            attach="attributes-position"
            array={posArr}
            count={cfg.count}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          ref={matRef}
          color={midColor}
          size={cfg.size}
          transparent
          opacity={1}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      {/* Ring expansion — special only */}
      {type === 'special' && (
        <mesh ref={ringRef} visible={false} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 1.0, 32]} />
          <meshBasicMaterial
            ref={ringMatRef}
            color="#ffee44"
            transparent
            opacity={0.85}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  )
}
