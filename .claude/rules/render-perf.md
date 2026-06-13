---
paths:
  - "src/render/**"
  - "src/core/loop/**"
---

# Render Performance Rules

These rules apply to any code that runs every frame: `useFrame` callbacks,
`Scheduler.tick()`, and systems in `src/systems/`.

## No Per-Frame Allocation

```typescript
// ✗ FORBIDDEN — allocates on the heap every frame (60× per second)
function update(dt: number) {
  const dir = new THREE.Vector3(0, 0, -1)
  const pos = player.position.clone()
  const arr = enemies.filter(e => e.alive)
}

// ✓ CORRECT — reuse pre-allocated scratch objects
import { vec3A, vec3B, quatA } from '@/core/math/pools'
function update(dt: number) {
  vec3A.set(0, 0, -1)
  vec3B.copy(player.position)
  // iterate over pre-computed alive list, don't filter inside the loop
}
```

Named scratch variables in `pools.ts`:
- `vec3A`, `vec3B`, `vec3C` — THREE.Vector3
- `quatA`, `quatB`          — THREE.Quaternion
- `mat4A`                    — THREE.Matrix4
- `eulerA`                   — THREE.Euler
- `colorA`                   — THREE.Color

Add new scratch objects if the existing pool is insufficient.

## Keep React Out of the Per-Frame Path

```typescript
// ✗ FORBIDDEN — triggers React reconciliation every frame
function GameLoop() {
  const [frame, setFrame] = useState(0)
  useFrame(() => setFrame(f => f + 1))  // re-renders 60× per second
}

// ✓ CORRECT — mutate refs and Zustand stores transient snapshots
function GameLoop() {
  useFrame((_, delta) => {
    clock.tick(delta)            // updates Zustand imperatively
    meshRef.current.position.x = playerState.x  // mutate ref, no React
  })
}
```

Use `useRef` for values the render loop needs; `useState/useEffect` only for
UI state changes (menus, HUD values that change infrequently).

## Draw Call Budget

Target for the vertical-slice arena: **≤ 100–150 draw calls per frame**.

Strategies:
- Merge static geometry (buildings, floor tiles) into single meshes
- Use `InstancedMesh` / drei `<Instances>` for repeated props (debris, crowd sprites)
- Share materials — identical material properties = single Three.js Material object
- Use texture atlases — combine small textures to reduce material count
- Frustum culling is automatic; add distance-based culling for distant objects

## Post-Processing Budget

Vertical-slice post-FX stack (M8):
1. Toon outline (single pass)
2. Color grade / LUT
3. Subtle bloom (threshold high, no glow bleed)

Do NOT add additional passes without checking frame time budget first.
Each post-processing pass costs ~0.5–2 ms on mid hardware.

## LOD and Culling

- Use drei `<Detailed>` for characters visible at many distances
- Disable `AnimationMixer` updates for enemies outside player's engagement range
- Only run physics simulation for objects near the player

## Camera Collision

Camera pullback uses a Rapier raycast from player head to desired camera position.
Use a **pre-allocated ray** — do not construct `new Ray(...)` every frame.
Shorten the arm length if the ray hits geometry; lerp the arm length smoothly.

## Profiling

Use `/perf-profiling` skill to run a profiling session with:
- drei `<Perf>` panel (r3f-perf) for GPU/CPU per-frame breakdown
- `Stats.js` overlay for FPS / memory
- Chrome DevTools Performance tab for GC pressure

Target: 60 FPS / ≤ 16.6 ms on a mid-2021 laptop.
