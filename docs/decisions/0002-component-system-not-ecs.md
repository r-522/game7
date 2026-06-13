# ADR 0002 — Entity System: Lightweight Component/System (not ECS)

**Status**: Accepted  
**Date**: 2026-06

## Context

The game needs to manage game objects (player, enemies, props) with shared behavior
(combat, AI, physics binding). A formal ECS (Entity Component System) architecture
(bitecs, miniplex) is an option.

## Decision

Use a **lightweight component/system pattern** instead of a formal ECS library.

Implementation:
- `Registry` (a `Map<EntityId, Entity>`) holds entity data.
- Entity is a plain TypeScript object `{ id, components: { health, combatant, ... } }`.
- System functions (`CombatSystem.update(dt)`, `EnemyAISystem.update(dt)`) iterate over
  the registry and process entities they care about.
- `Scheduler` runs systems in a fixed order every tick.

## Rationale

- **Scope**: The vertical slice has at most ~20–30 entities simultaneously. ECS wins at
  10,000+ entities (cache locality) — meaningless at our scale.
- **Readability**: Plain objects and functions are easier for AI-assisted development
  and debugging than ECS query syntax.
- **Iteration speed**: Adding a component or system is adding a field or function — no
  framework API to learn or type gymnastics.
- **Migration path**: If entity count ever requires it, the `Registry` and `Entity` types
  can be adapted to use a proper ECS without changing the system interfaces.

## Alternatives Rejected

- **bitecs**: High performance, but data-oriented (typed arrays) — harder to debug and
  serialize (save/load). Overkill for this scope.
- **miniplex**: Nice API, but adds a framework layer that obscures the simple data flow
  we want. Also overkill.

## Consequences

- Entity data is in plain JS objects — easy to serialize to JSONB for cloud saves.
- System code is straightforward TypeScript — easy to unit-test with Vitest.
- No ECS-specific query language — systems iterate with `for...of` or `Array.filter`.
- If entity count grows beyond ~500, revisit with miniplex (it's easy to migrate to).
