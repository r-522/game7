---
paths:
  - "src/backend/**"
  - "supabase/**"
---

# Supabase Rules

These rules apply when working in `src/backend/` or `supabase/`.

## The knk_ Rule (absolute)

Every Postgres table, index, function, and policy MUST start with `knk_`.

```sql
-- ✓
create table public.knk_profiles (...)
create index knk_lb_score_idx on public.knk_leaderboard (score desc)
create function public.knk_submit_score(...)

-- ✗ CI FAILS
create table public.profiles (...)
```

`npm run check:knk` is a CI gate that verifies every migration.

## RLS on Every Table

Enable Row Level Security immediately after `CREATE TABLE`:

```sql
create table public.knk_example (...);
alter table public.knk_example enable row level security;
-- Then add policies before the table is usable
```

**No table ships without at least one policy.**

## Standard Policy Patterns

```sql
-- Owner read/write (saves, profiles)
create policy knk_example_rw_own on public.knk_example
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Read-all (leaderboard, catalog)
create policy knk_example_read_all on public.knk_example
  for select using (true);

-- Insert-own (leaderboard scores)
create policy knk_example_insert_own on public.knk_example
  for insert with check (auth.uid() = user_id);
```

No update/delete policies on append-only tables (leaderboard).
No write policies on server-owned tables (customization_catalog).

## Score Submission — Use the RPC

For leaderboard score submission, call `knk_submit_score()` RPC
(SECURITY DEFINER) rather than direct INSERT:

```typescript
// ✓ call the RPC — it validates bounds and context
const { error } = await supabase.rpc('knk_submit_score', {
  p_score: finalScore,
  p_category: 'arena01_score',
  p_context: { maxCombo, runDuration, otokogi },
})

// ✗ direct INSERT — bypasses server-side validation
await supabase.from('knk_leaderboard').insert(...)
```

The RPC is defined in `supabase/migrations/0002_leaderboard_rpc.sql` (M7).

## Client Secret Rule

Only use the **anon key** in `src/`:

```typescript
// ✓ safe
createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

// ✗ NEVER in src/ — service-role bypasses RLS entirely
createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY)
```

## Migrations Are Append-Only

Never edit an existing migration file after it has been applied.
Always create a new migration: `NNNN_description.sql` with the next sequence number.

## Type Generation

After any schema change, regenerate TypeScript types:

```bash
supabase gen types typescript --local > src/backend/schema.types.ts
```
