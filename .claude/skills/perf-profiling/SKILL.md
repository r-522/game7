---
name: perf-profiling
description: Profile 喧嘩番長7's frame performance — find draw-call hotspots,
  per-frame allocations, and physics overhead. Use when frame rate drops below
  target (60 FPS desktop), before a milestone ship, or when adding expensive features.
---

# Performance Profiling

## Target Budget

| Metric | Target | Hard limit |
|---|---|---|
| Frame time | ≤ 16.6 ms | ≤ 20 ms (50 FPS floor) |
| Draw calls | ≤ 100–150 | ≤ 200 |
| GPU memory | ≤ 400 MB | ≤ 512 MB |
| JS heap | ≤ 150 MB | ≤ 256 MB |
| GC pauses | 0 per second ideally | ≤ 1 short pause / 5 s |

## Step 1 — Enable Overlay Tools

Add to `src/render/debug/Stats.tsx` (dev-only):

```tsx
import { Perf } from 'r3f-perf'

// Inside <Canvas> (dev only):
{import.meta.env.DEV && <Perf position="top-left" />}
```

Install r3f-perf: `npm install -D r3f-perf`

The `<Perf>` panel shows:
- FPS + frame time (CPU + GPU)
- Draw calls
- Memory (JS heap + GPU)
- Render list (which objects are drawing)

## Step 2 — Chrome DevTools Performance Tab

1. Open DevTools → Performance
2. Start recording (Ctrl+E or record button)
3. Play ~5 seconds including combat
4. Stop recording
5. Look for:
   - **Long frames** (red bars in the timeline > 16.6 ms)
   - **GC events** (grey bars = garbage collection pauses)
   - **requestAnimationFrame** callback duration

If you see frequent GC spikes → per-frame allocation bug.
Check: `useFrame` callbacks, `Scheduler.tick`, `update()` functions.

## Step 3 — Identify Per-Frame Allocations

Per the `.claude/rules/render-perf.md` no-alloc rule:

Search for these patterns inside hot-path code:

```bash
# Find potential per-frame allocations in systems/
grep -rn "new THREE\." src/systems/
grep -rn "new THREE\." src/core/
grep -rn "\.clone()" src/systems/
grep -rn "filter(" src/systems/
grep -rn "map(" src/systems/
```

Each `new`, `.clone()`, `Array.map/filter` inside a per-frame function
is a potential GC pressure source.

Fix: replace with pre-allocated scratch objects from `src/core/math/pools.ts`.
If the needed scratch doesn't exist, add it to `pools.ts`.

## Step 4 — Draw Call Analysis

In `<Perf>`, click "Render" to see the draw call breakdown.
High draw counts are usually caused by:

1. **Unique materials** — merge materials where possible; share material instances
2. **Unbatched repeated props** — use `InstancedMesh` or drei `<Instances>`
3. **Dynamic shadows** — limit shadow casters/receivers
4. **Post-processing passes** — each effect = extra draw calls

Quick fix checklist:
- [ ] Static arena geometry merged into one mesh per material
- [ ] Repeated props (debris, barriers) use `InstancedMesh`
- [ ] Characters share the same base material (toon ramp), differentiated by uniforms
- [ ] Post-processing: ≤ 3 passes (outline, color grade, bloom)

## Step 5 — Physics Budget

Open Rapier's debug renderer during profiling:
```tsx
<Physics debug timeStep={1/60}>
```

Look for:
- Excessive collider count (> 200 active colliders)
- Mesh colliders on enemies (use capsules instead)
- Sleeping bodies that aren't sleeping

Fix: ensure all inactive enemies have sleeping rigid bodies.
Use capsule/cuboid colliders for characters — never mesh colliders in combat.

## Step 6 — Fix and Verify

After fixing each issue:
1. Re-run the game and check `<Perf>` numbers
2. Run a quick Chrome DevTools recording to confirm GC pauses are gone
3. Note the improvement in a comment: `// Was 240 draw calls; now 87 after InstancedMesh`

## Common Fixes Reference

| Issue | Fix |
|---|---|
| Per-frame `new THREE.Vector3` | Use `vec3A` from `pools.ts` |
| Per-frame `Array.filter` | Pre-compute and cache alive-entity list |
| Too many draw calls | `InstancedMesh`, merge static geo |
| Skinned mesh cloning GC | Use `SkeletonUtils.clone` once, cache |
| Physics overshoot | Reduce collider count; cap dynamic bodies |
| Post-processing too slow | Remove bloom, reduce resolution scale |
