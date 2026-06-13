---
paths:
  - "src/systems/combat/**"
  - "src/core/fsm/**"
---

# Combat System Rules

These rules apply when working in `src/systems/combat/` or `src/core/fsm/`.

## FSM State Contract

Every state in `src/systems/combat/states/` must implement this interface:

```typescript
interface CombatState {
  enter(ctx: CombatContext): void   // mint a new hitId here; clear alreadyHit Set
  update(ctx: CombatContext, dt: number): void
  exit(ctx: CombatContext): void    // disable hitbox collider here
}
```

- **`enter`** — play the animation clip (via `useCharacterAnimations`), reset frame counter to 0,
  generate a fresh `hitId` (monotonic counter), clear `alreadyHit = new Set()`.
- **`update`** — advance frame counter.  Enable hitbox sensor during `[startup, startup+active)`.
  Disable it at end of active window.  Check cancel windows and dispatch combo transitions.
- **`exit`** — ensure hitbox sensor is disabled.

## Move Table Fields

All moves are data-defined in `src/data/moves/moveTable.ts`:

```typescript
interface MoveDef {
  id: string
  anim: string           // animation clip name in the character's GLB
  startup: number        // frames (at 60 Hz): windup phase, hitbox OFF
  active: number         // frames: hitbox ON
  recovery: number       // frames: vulnerable, no hitbox
  damage: number         // HP damage on confirmed hit
  knockback: { dir: [number, number, number]; mag: number }
  hitstop: number        // frames to freeze simulation on hit (for feel)
  poise: number          // stagger threshold damage dealt
  cancelInto: string[]   // move IDs that can cancel from the cancel window
  cancelWindow: [number, number]  // [startFrame, endFrame] in recovery
}
```

To add a new move, use the `/add-move` skill.

## Already-Hit-This-Swing Guard

Every active hitbox owns a `Set<EntityId>` called `alreadyHit`.
On sensor intersection with an enemy hurtbox:

1. If `alreadyHit.has(targetId)` → skip (prevents multi-hit in one swing arc)
2. Else → add `targetId`, apply hit (damage, knockback, hitstop)

Clear `alreadyHit` in `enter()` (new swing = fresh Set).
Do NOT reuse Sets across swings or attacks.

## Hitbox Timing is Frame-Counter Authoritative

```typescript
// ✓ CORRECT — frame counter drives hitbox enable/disable
const inActiveWindow =
  fsm.frameCount >= move.startup &&
  fsm.frameCount < move.startup + move.active
hitboxCollider.setEnabled(inActiveWindow)

// ✗ FORBIDDEN — animation mixer time is cosmetic, not authoritative
if (mixer.time > 0.15 && mixer.time < 0.35) { ... }
```

## Rapier Sensor Polling (not events only)

`HitResolution.collect()` polls `world.intersectionPairsWith(hitboxCollider)` every
fixed simulation step — do NOT rely solely on `onIntersectionEnter` events.
Polling inside the fixed step is more deterministic for frame-precise combat.

## Invulnerability (i-frames)

During `Dodge` state: set `combatant.invulnUntilFrame = frameCount + dodgeDuration`.
In `HitResolution`: skip damage if `frameCount < combatant.invulnUntilFrame`.
This is simpler and more robust than disabling the hurtbox collider.

## Hit-Stop

On a confirmed hit, `Hitstop.trigger(move.hitstop)` sets a global counter.
`GameClock` skips fixed-step advances while the counter is > 0.
Both attacker AND victim freeze (that's the feel — the mutual crunch).
Pair with: hit-spark VFX, 1-frame impact flash, short screen shake, SFX.
Heavier moves = larger `hitstop` value in moveTable.
