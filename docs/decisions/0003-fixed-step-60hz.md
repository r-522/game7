# ADR 0003 — Fixed Simulation Step at 60 Hz

**Status**: Accepted  
**Date**: 2026-06

## Context

Game simulation must be deterministic and frame-rate independent for:
1. Consistent combat feel regardless of monitor refresh rate (60/120/144 Hz)
2. Fair leaderboard scoring (run replay is possible in the future)
3. Correct physics integration (Rapier works best at a fixed timestep)

## Decision

Run the game simulation at a **fixed timestep of 1/60 second** using a
**delta accumulator** in `GameClock.ts`.

```
Display refresh fires useFrame(delta)
  → GameClock accumulates delta
  → fires Scheduler.tick(1/60) one or more times per frame
  → remaining alpha for render interpolation
```

Rapier is configured with `timeStep={1/60}` to match.

Combat timing (startup/active/recovery frames) is expressed as **integer frame counts
at 60 Hz** — not wall-clock milliseconds.

## Rationale

- **Determinism**: Given the same inputs, a fixed-step simulation produces identical
  outputs regardless of when each frame renders. This is the prerequisite for future
  server-side replay verification of leaderboard scores.
- **Combat feel**: Frame data (3/4/5/8 frame windows) is the standard vocabulary for
  fighting game design. Expressing timing in frames = tunable, portable data.
- **Physics stability**: Variable-step physics engines produce different results at
  different framerates. Fixed step gives Rapier consistent behavior.

## Trade-offs

- On high-refresh monitors (144 Hz), Scheduler.tick may run 2–3 times per render frame.
  This is fine — simulation is fast, and Rapier handles it.
- Render interpolation using `alpha = leftover / FIXED_DT` smooths out character positions
  between fixed steps (prevents jitter at high FPS).

## Consequences

- `GameClock.ts` is the authoritative source for simulation time.
- Hit detection polls sensors on the **fixed-step frame counter**, never on wall-clock or `mixer.time`.
- Save-state snapshots are taken at fixed-step boundaries (consistent state).
- Future anti-cheat replay verification is feasible (deterministic fixed-step + seed).
