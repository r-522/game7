# ADR 0004 — Database Naming: knk_ Prefix + RLS on Every Table

**Status**: Accepted  
**Date**: 2026-06

## Context

Supabase exposes all public schema tables via PostgREST. Without RLS, any table
is publicly readable/writable with the anon key. The project also needs a clear
naming convention to avoid collisions with Supabase's own tables (`auth.*`,
`storage.*`, `realtime.*`).

## Decision

1. **Every table created by this project must start with `knk_`** (Kenka Banchou 7).
2. **RLS must be enabled on every table** immediately after creation.
3. **CI check** (`npm run check:knk`) fails the build if any migration creates a
   table without the `knk_` prefix.
4. Every new table gets at least one policy before it can be used by the client.

## Rationale

- **Safety**: Without RLS, a leaked anon key gives full read (and possibly write)
  access to every table. RLS ensures users can only access their own data.
- **Clarity**: The `knk_` prefix makes it immediately clear which tables belong to
  this application versus Supabase's system tables.
- **Automation**: The `check-knk-prefix.mjs` CI script catches mistakes at commit
  time rather than at runtime. This is especially important for AI-generated migrations.
- **Convention over configuration**: A consistent prefix avoids ad-hoc naming decisions
  and makes the schema easier to reason about.

## Consequences

- Every `CREATE TABLE` in `supabase/migrations/` must be prefixed `knk_`.
- `npm run check:knk` blocks CI if violated.
- All policies, indexes, and functions are also prefixed `knk_` (by convention, not
  enforced by the script — enforced by code review).
- RLS ensures the service-role key is never needed in client code.
- Adding a new table requires the `/add-knk-table` skill to ensure compliance.
