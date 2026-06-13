# ADR 0001 — State Management: Zustand

**Status**: Accepted  
**Date**: 2026-06

## Context

The game needs shared state accessible from three different contexts:
1. **R3F render loop** (`useFrame`) — runs at 60+ Hz, must not trigger React re-renders
2. **React UI components** (HUD, menus) — need reactive subscriptions
3. **Game simulation** (`Scheduler.tick`) — pure TypeScript, no React imports

## Decision

Use **Zustand** for all shared game state.

## Rationale

- `getState()/setState()` API works outside React (in `useFrame`, in system functions)
  without triggering the reconciler — critical for the hot simulation path.
- Subscription selectors in React components (`useStore(s => s.health)`) only re-render
  when the selected value changes.
- Very small bundle (~1 KB), no boilerplate, no providers needed.
- TypeScript-friendly with full type inference.

## Alternatives Rejected

- **Redux Toolkit**: Too much boilerplate; `dispatch` in a 60 Hz loop is verbose.
- **Jotai/Recoil**: Atom-per-value model doesn't map well to game state (entity registries, etc.)
- **React Context**: Always triggers re-renders on any state change — catastrophic in a game loop.
- **MobX**: Observable system is heavier and less idiomatic for a simulation.

## Consequences

- Game simulation code (`core/`, `systems/`) imports from `zustand/vanilla` not React.
- Each store is a separate file: `usePlayerStore`, `useEncounterStore`, etc.
- The `useCombatStore` is transient (not persisted) — only the frame snapshot.
- `useSaveStore` drives autosave to Supabase.
