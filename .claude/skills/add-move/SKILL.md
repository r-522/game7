---
name: add-move
description: Add a new attack move or 必殺技 (special technique) to 喧嘩番長7.
  Updates moveTable, wires the FSM state, ensures the hitId/already-hit guard,
  and adds a unit test for the hit-detection logic. Use when adding a new attack,
  combo extension, or unlockable 必殺技 finisher.
---

# Add a Move / 技

## Steps

1. **Define the move** in `src/data/moves/moveTable.ts`:

   ```typescript
   export const MOVES: Record<string, MoveDef> = {
     // ... existing moves ...
     attack_light_3: {
       id: 'attack_light_3',
       anim: 'attack_light_3',         // must match clip name in player GLB
       startup: 5,                     // frames windup (hitbox OFF)
       active: 4,                      // frames hitbox ON
       recovery: 12,                   // frames recovery
       damage: 15,
       knockback: { dir: [0, 0.2, -1], mag: 4 },
       hitstop: 5,                     // frames of freeze on impact
       poise: 20,
       cancelInto: ['dodge', 'attack_heavy'],
       cancelWindow: [8, 16],          // frames within recovery where cancel is possible
     },
   }
   ```

   Frame values are at **60 Hz** — see `.claude/rules/combat.md`.

2. **Create or update the FSM state** in `src/systems/combat/states/AttackLight.ts`
   (or create a new file for a new state type).
   - On `enter`: play `move.anim`, reset `frameCount = 0`, mint `hitId++`, clear `alreadyHit`
   - On `update`: enable/disable hitbox based on frame window; check cancel window
   - On `exit`: disable hitbox collider

3. **Register the animation clip** — ensure the clip name (`move.anim`) exists in
   the character GLB.  Check in `src/render/anim/useCharacterAnimations.ts`.

4. **Wire the transition** — update the FSM transition table in `CombatSystem.ts`
   so the new move is reachable (e.g., `attack_light_2 → attack_light_3` on cancel).

5. **Unlock condition** (if a 必殺技 or level-gated move):
   Add the unlock to `src/systems/progression/Leveling.ts`'s unlock table.
   Add it to the player's initial unlocks array or the gate level.

6. **Write a unit test** in `src/test/unit/combat/hitId.spec.ts` (or a new file):
   - Verify the move's active window correctly gates hits (frame < startup = no hit,
     frame in active = hit, same entity only hit once per swing)
   - Example pattern from existing tests

7. **Run the verify gate:**
   ```bash
   npm run typecheck && npm run lint && npm run test
   ```

## 技 / 必殺技 Naming Convention

| Type | id | anim clip |
|---|---|---|
| Light attack chain | `attack_light_1`, `attack_light_2`, … | `attack_light_1`, … |
| Heavy attack | `attack_heavy` | `attack_heavy` |
| Dodge | `dodge` | `dodge` |
| Block | `block` | `block` |
| 必殺技 (special) | `special_<name>` (Japanese romanized) | `special_<name>` |
| 必殺技 follow-up | `special_<name>_2` | `special_<name>_2` |

## Balancing Guide

For reference when tuning `startup / active / recovery` values:

| Move type | Startup | Active | Recovery | Hitstop |
|---|---|---|---|---|
| Fastest jab | 3–4 | 2–3 | 8–10 | 3 |
| Standard light | 5–7 | 3–5 | 10–14 | 4 |
| Heavy | 10–14 | 4–6 | 18–24 | 8 |
| 必殺技 finisher | 20–30 | 8–12 | 30–40 | 16 |

Tune in `moveTable.ts` (data) — do NOT hardcode values in system code.
