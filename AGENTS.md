# AGENTS.md — 喧嘩番長7

> Source of truth for all AI coding agents (Claude Code, Codex, Cursor, Copilot, etc.).
> This file is imported by `CLAUDE.md`.  Claude-specific notes live there, not here.

---

## Project Overview

**喧嘩番長7** は、2005年から2015年にかけてスパイク・チュンソフトが発売した不良アクションアドベンチャーシリーズ「喧嘩番長」の完全後継作として開発するブラウザ動作の三人称視点(TPS)3Dブロウラーゲームです。

シリーズの魂（メンチ→タンカ→3D格闘→男気判定ループ、昭和ヤンキー世界観）を継承しつつ、WebGL/ブラウザで動く形で再実装します。

---

## Setup

```bash
# Node.js 20+ required
npm install

# Copy .env.example to .env.local and fill in your Supabase credentials
# (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY — anon key only, never service-role)

npm run dev          # dev server → http://localhost:5173
```

Optional — Supabase local development:
```bash
supabase start       # requires Docker + Supabase CLI
supabase db reset    # apply migrations + seed
```

---

## Verify Gates (Definition of Done)

**Before declaring any task complete, ALL of the following must pass:**

```bash
npm run typecheck    # tsc --noEmit (strict mode — no errors, no warnings)
npm run lint         # ESLint with --max-warnings 0
npm run test         # Vitest unit tests (pure system logic, no DOM/canvas)
npm run build        # Vite production build must exit 0
npm run check:knk    # All SQL tables must have the knk_ prefix
```

Show actual command output as evidence.  Never declare done by assertion alone.

---

## Architecture Map

```
src/
 core/         Engine kernel — NO React, NO Three.js, NO R3F imports
               loop/ (GameClock fixed-step, Scheduler ordered-tick)
               fsm/  (generic StateMachine<TCtx>)
               ecs-lite/ (Entity, Registry, components)
               math/pools.ts  (reusable Vector3/Quaternion scratch — no-alloc)
               events/EventBus.ts (typed pub/sub: HIT_LANDED, KO, MENCHI_WON…)

 systems/      Pure update functions — also NO React/R3F imports
               combat/    (CombatSystem, states/, moves/moveTable, HitResolution,
                           HitId, Combo, Hitstop)
               encounter/ (EncounterSystem, Menchi, Tanka, Resolution)
               ai/        (EnemyAISystem, behaviors)
               camera/    (ThirdPersonCamera — produces a target transform)
               input/     (InputSystem snapshot, bindings, buffer)
               progression/ (Otokogi, Leveling, Shatei)
               world/     (DayTime, Itinerary)

 entities/     Spawn factories — assemble components + register (no React)

 render/       R3F view layer — SUBSCRIBES to Zustand, never drives simulation
               Stage.tsx  PlayerRig.tsx  EnemyRig.tsx  HitboxColliders.tsx
               camera/CameraRig.tsx
               fx/  (PostFX, CelMaterial, MenchiBeam, HitSpark, SpeedLines)
               anim/useCharacterAnimations.ts
               debug/HitboxDebug.tsx

 ui/           DOM HUD + menus (React, outside Canvas)
               hud/  menchi/  tanka/  menus/  result/  theme/

 state/        Zustand stores (usePlayerStore, useEncounterStore,
               useCombatStore, useWorldStore, useSaveStore, useUIStore)

 data/         Static authored content (NO side effects, plain TS/JSON)
               menchiTypes.ts  tankaLines.ts  customization.ts
               enemies/  district/arena01.ts

 backend/      Supabase client (supabaseClient.ts, auth, saves, leaderboard)
               schema.types.ts (generated: supabase gen types typescript)

 assets/       loaders/ (AssetManifest, preload, AudioManager)
```

**Golden Rule**: `core/`, `systems/`, `data/` **never** import React or R3F.
They update Zustand stores via `getState()/setState()`.
`render/` and `ui/` subscribe.
→ Simulation is testable with plain Vitest (no canvas, no DOM).
→ Per-frame loop runs without React reconciliation overhead.

### Fixed-step loop (60 Hz)

`<GameLoop>` runs `useFrame((_, delta) => clock.tick(delta))`.
`GameClock` accumulates delta and fires `Scheduler.tick(FIXED_DT)` one or more
times per render frame (fixed at 1/60 s).  Rapier physics also uses `timeStep={1/60}`.

System execution order per tick:
```
1. InputSystem.sample()
2. EncounterSystem.update(dt)
3. EnemyAISystem.update(dt)
4. CombatSystem.update(dt)        ← advances every combatant FSM
   [Rapier physics step]
5. HitResolution.collect()        ← poll sensor intersections AFTER physics
6. Hitstop.apply()
7. ThirdPersonCamera.update(dt)
8. Store flush (write transient snapshot for render/UI)
```

---

## Code Style

- **TypeScript strict** — `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`
- **No `any`** — use `unknown` + type narrowing instead
- **No semicolons**, single quotes, 2-space indent (enforced by Prettier)
- Named exports only (no default exports in `src/`)
- File naming: `PascalCase.tsx` for React components, `camelCase.ts` for logic
- Path alias: `@/` → `src/`  (e.g. `import { EventBus } from '@/core/events/EventBus'`)

---

## THE knk_ RULE  ⚠️  NON-NEGOTIABLE

Every Postgres table, policy name, index, and function created in this project
**must** start with the `knk_` prefix.

```sql
-- ✓ correct
create table public.knk_profiles (...)
create policy knk_profiles_select_own on public.knk_profiles ...

-- ✗ FORBIDDEN — CI will fail
create table public.profiles (...)
```

`npm run check:knk` runs a static check on every `.sql` migration file.
It **blocks the build** if any `CREATE TABLE` is missing the prefix.

**Row Level Security is required on every table.** No exceptions.

---

## Hot-Path No-Alloc Rule

Code inside `useFrame`, `Scheduler.tick()`, and any per-frame system function
**must not allocate** on the heap each frame:

```typescript
// ✗ DO NOT: per-frame allocation
function update(dt: number) {
  const dir = new THREE.Vector3(0, 0, -1)  // allocates every frame
  player.position.add(dir.multiplyScalar(speed * dt))
}

// ✓ DO: reuse scratch objects from pools.ts
import { vec3A } from '@/core/math/pools'
function update(dt: number) {
  vec3A.set(0, 0, -1).multiplyScalar(speed * dt)
  player.position.add(vec3A)
}
```

No `new THREE.*`, no array spreads (`[...arr]`), no object literals `{}`,
no `Array.from`, no closures creating new objects — inside hot paths.

---

## Combat Timing Rule

**Frame counters are authoritative.  Animation is cosmetic.**

Hit windows (startup/active/recovery) are defined in frames at 60 Hz in
`src/data/moves/moveTable.ts`.  `HitResolution` polls sensor intersections
on the **fixed-step frame counter**, not on `mixer.time` or wall-clock time.

```typescript
// ✗ FORBIDDEN — ties hit detection to animation playback speed
if (mixer.time > hitStart && mixer.time < hitEnd) { resolve() }

// ✓ CORRECT — frame counter drives everything
if (fsm.frameCount >= move.startup && fsm.frameCount < move.startup + move.active) {
  hitboxCollider.setEnabled(true)
}
```

Never adjust hit windows by changing `timeScale` on the AnimationMixer.
Tune feel via the `moveTable` frame values.

---

## Assets Rule

Large `.glb`, `.ktx2`, and audio files **must not** be imported into the JS bundle.
They must be loaded at runtime from `AssetManifest.ts` which maps keys to
Supabase Storage / CDN URLs.

```typescript
// ✗ FORBIDDEN — bloats the bundle
import playerModel from './player.glb'

// ✓ CORRECT — runtime fetch from CDN
import { ASSETS } from '@/assets/loaders/AssetManifest'
useGLTF(ASSETS.playerModel)
```

Run `npm run assets:optimize` to compress assets before uploading to Storage.
See `docs/art-direction.md` — Asset Pipeline.

---

## Secrets Rule

Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` belong in the client bundle.
**The Supabase service-role key must never appear in `src/`.**

```typescript
// ✓ safe — anon key is public by design
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

// ✗ NEVER — service-role key bypasses RLS, it's a server-only secret
const adminClient = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY)
```

---

## Definition of Done — Checklist Template

Copy this into any task description:

```
[ ] npm run typecheck    passes (0 errors, 0 warnings)
[ ] npm run lint         passes (0 errors, 0 warnings)
[ ] npm run test         passes (all unit tests green)
[ ] npm run build        exits 0
[ ] npm run check:knk    passes (all SQL tables knk_-prefixed)
[ ] Hot-path code uses pools.ts scratch objects (no per-frame alloc)
[ ] Any new SQL migration has RLS enabled and uses knk_ prefix
[ ] Large assets are not imported into JS bundle
[ ] No service-role key in src/
```
