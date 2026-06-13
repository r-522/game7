# Architecture — 喧嘩番長7

## System Map

```
┌─────────────────────────────────────────────────────────────┐
│  Browser Tab                                                 │
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────────────┐ │
│  │  DOM Layer (React)   │  │  WebGL Layer (R3F / Three.js)│ │
│  │  ui/hud/  ui/menus/  │  │  render/Stage.tsx            │ │
│  │  ui/menchi/ ui/tanka/│  │  render/rig/  render/fx/     │ │
│  └──────────┬───────────┘  └────────────┬─────────────────┘ │
│             │ subscribe                  │ subscribe          │
│             └────────────┬──────────────┘                    │
│                          │                                    │
│             ┌────────────▼──────────────┐                    │
│             │  Zustand Stores           │                    │
│             │  usePlayerStore           │                    │
│             │  useEncounterStore        │                    │
│             │  useCombatStore           │                    │
│             │  useWorldStore            │                    │
│             │  useSaveStore             │                    │
│             └────────────▲──────────────┘                    │
│                          │ setState()                         │
│                          │                                    │
│  ┌───────────────────────┴────────────────────────────────┐  │
│  │  Game Simulation (React/R3F-free TypeScript)            │  │
│  │                                                         │  │
│  │  core/loop/GameClock  ──► Scheduler.tick(FIXED_DT)     │  │
│  │                                │                        │  │
│  │  Systems (in order):           ▼                        │  │
│  │  1. InputSystem.sample()                               │  │
│  │  2. EncounterSystem.update()  ← Menchi / Tanka / Res   │  │
│  │  3. EnemyAISystem.update()                             │  │
│  │  4. CombatSystem.update()    ← FSM / hitboxes          │  │
│  │     [Rapier physics step]                               │  │
│  │  5. HitResolution.collect()  ← sensor polling          │  │
│  │  6. Hitstop.apply()                                     │  │
│  │  7. ThirdPersonCamera.update()                          │  │
│  │  8. → flush transient store snapshot                    │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Golden Rule

`core/`, `systems/`, `data/` NEVER import React or R3F.
They write to Zustand stores imperatively via `getState()/setState()`.
`render/` and `ui/` ONLY subscribe — they are pure views.

This boundary enables:
- Unit-testing game logic with plain Vitest (no canvas, no DOM)
- Per-frame loop running without React reconciler overhead
- Clean separation of simulation and presentation

## Fixed-Step Loop

```
Display refresh (60/120/144 Hz)
    │
    ▼
useFrame(delta)
    │
    ▼  GameClock.tick(delta)
    │  accumulates delta; fires fixed steps
    │
    ├─ [if accumulated >= FIXED_DT (1/60 s)]
    │       Scheduler.tick(FIXED_DT)  ← simulation step
    │       (repeat if multiple steps owed)
    │
    └─ alpha = leftover / FIXED_DT   ← for render interpolation
```

**Why fixed step?** Gameplay timing (startup/active/recovery frames) is
expressed as integer counts at 60 Hz.  A fixed step guarantees identical
simulation results regardless of monitor refresh rate or frame spikes — critical
for consistent combat feel and for leaderboard replay fairness.

## Encounter Flow State Machine

```
ROAM
  │  player presses メンチ button near enemy
  ▼
MENCHI
  │  player picks menchi type (睨/笑/技/漢/気/冷)
  │  beam clash mini-contest → menchiResult
  ▼
TANKA
  │  smacktalk QTE: pick correct line from 2-4 options
  │  correct → firstStrike = 'player'
  │  wrong / timeout → firstStrike = 'enemy'
  ▼
FIGHT
  │  full melee; either side can win or flee
  │  win → proceed to RESULT
  │  flee (shame) → RESULT with heavy otokogi penalty
  ▼
RESULT
  │  compute otokogi delta (シブイ/シャバい)
  │  award 喧嘩慣れ度 XP → 番長度 level-up?
  │  shatei recruitment offer (if honorable win vs banchou)
  │  finalize score for leaderboard
  ▼
ROAM  (loop)
```

## Combat FSM per Combatant

```
Idle ⇄ Locomotion
         │
         ├─ [attack input] ──► AttackLight → (cancel window) → AttackLight/AttackHeavy/Dodge/Special
         │                     AttackHeavy
         ├─ [dodge input] ──► Dodge (i-frames via invulnUntilFrame)
         ├─ [block held] ──► Block → (too much guard meter) → GuardBreak
         │
any non-iframe  ◄─ HitReact ◄─ (hit received; poise check)
                     │
                     └─ (health ≤ 0 OR launched) ──► KO
```

Attack state phases (frame counter authoritative at 60 Hz):
```
[0, startup)        = Windup   — hitbox OFF, vulnerable
[startup, +active)  = Active   — hitbox ON
[+active, end)      = Recovery — hitbox OFF, cancel window opens
```

## Key Files Quick Reference

| Area | Entry point | Purpose |
|---|---|---|
| Game loop | `src/core/loop/GameClock.ts` | Fixed-step accumulator |
| System order | `src/core/loop/Scheduler.ts` | Ordered tick |
| Combat | `src/systems/combat/CombatSystem.ts` | Drives all combatant FSMs |
| Move data | `src/data/moves/moveTable.ts` | Startup/active/recovery per move |
| Hit detect | `src/systems/combat/HitResolution.ts` | Rapier sensor polling |
| Hit guard | `src/systems/combat/HitId.ts` | Already-hit-this-swing Set |
| Encounter | `src/systems/encounter/EncounterSystem.ts` | Phase orchestration |
| Menchi | `src/systems/encounter/Menchi.ts` | 6-type clash logic |
| Tanka | `src/systems/encounter/Tanka.ts` | Smacktalk QTE |
| Otokogi | `src/systems/progression/Otokogi.ts` | Honour delta rules engine |
| Render | `src/render/Stage.tsx` | R3F Canvas root |
| DB schema | `supabase/migrations/0001_init_knk.sql` | All knk_ tables |
