---
name: add-entity
description: Scaffold a new in-game 3D entity (player, enemy, prop) for 喧嘩番長7.
  Creates the entity factory, component registration, R3F Rig component, and a unit
  test stub. Use when adding a new game object, enemy type, or interactive prop.
---

# Add a 3D Entity

## Steps

1. **Create the entity factory** in `src/entities/<category>/<Name>Entity.ts`.
   Follow the pattern in `src/entities/player/PlayerEntity.ts`.
   - Define the entity's components (Health, Combatant, Transform, AIController if NPC)
   - Export a `spawn<Name>(registry: Registry): EntityId` function
   - Do NOT import React or R3F here

2. **Register in the world** — add the spawn call to the relevant district config
   in `src/data/district/arena01.ts` (or the target district).

3. **Create the R3F Rig component** in `src/render/rig/<Name>Rig.tsx`.
   - Subscribes to the entity's Zustand store slice or reads from the registry ref
   - Mounts `<RigidBody type="kinematicPosition">` with a `<CapsuleCollider>`
   - Includes `<HitboxColliders>` for hitbox/hurtbox sensors
   - Binds animations with `useCharacterAnimations`
   - Example: see `src/render/rig/PlayerRig.tsx`

4. **Wire the Rig** into `src/render/Stage.tsx` so it renders when the entity is alive.

5. **Add a unit test stub** in `src/test/unit/entities/<name>.spec.ts`.
   Test the spawn function: verify component types and default values.
   Run `npm run test` to confirm it passes.

6. **Run the verify gate:**
   ```bash
   npm run typecheck && npm run lint && npm run test
   ```

## File Naming Convention

| Category | Factory path | Rig path |
|---|---|---|
| Player | `src/entities/player/PlayerEntity.ts` | `src/render/rig/PlayerRig.tsx` |
| Enemy grunt | `src/entities/enemy/GruntEntity.ts` | `src/render/rig/GruntRig.tsx` |
| Enemy banchou | `src/entities/enemy/BanchouEntity.ts` | `src/render/rig/BanchouRig.tsx` |
| Prop | `src/entities/props/<Name>Entity.ts` | `src/render/rig/props/<Name>Rig.tsx` |

## Component Checklist for Characters

All character entities need these components:
- `Transform` — position/rotation/scale (physics-driven, not React state)
- `Health` — current HP, maxHp, alive flag
- `Combatant` — combatantId, faction, invulnUntilFrame, currentHitId, alreadyHit Set
- `AnimationState` — currentClip, blendWeight (cosmetic mirror of FSM state)
- For NPCs: `AIController` — behaviorTree ref, aggroRange, patrolPoints

## No-Alloc in Entity Update

Entity update functions run inside `Scheduler.tick()`.
Use `pools.ts` scratch objects for any Vector3/Quaternion calculations.
See `.claude/rules/render-perf.md`.
