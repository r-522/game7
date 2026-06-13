---
name: add-knk-table
description: Generate a new Supabase Postgres migration for 喧嘩番長7 with the correct
  knk_ prefix, RLS enabled, and standard policy boilerplate. Use whenever a new database
  table is needed. Ensures check:knk passes.
---

# Add a knk_ Database Table

## Steps

1. **Determine the migration number** — check the highest number in
   `supabase/migrations/` and increment by 1.

2. **Create the migration file** `supabase/migrations/NNNN_<description>.sql`.

3. **Write the migration** using this template:

   ```sql
   -- NNNN_<description>.sql
   -- Purpose: <what this table stores and why>

   create table public.knk_<name> (
     id          bigint generated always as identity primary key,
     user_id     uuid not null references auth.users(id) on delete cascade,
     -- ... your columns ...
     created_at  timestamptz not null default now(),
     updated_at  timestamptz not null default now()
   );

   alter table public.knk_<name> enable row level security;

   -- Choose the appropriate policy pattern:

   -- Pattern A: Owner read/write (saves, player data)
   create policy knk_<name>_rw_own on public.knk_<name>
     using (auth.uid() = user_id)
     with check (auth.uid() = user_id);

   -- Pattern B: Read-all + insert-own (leaderboard-like)
   create policy knk_<name>_read_all on public.knk_<name>
     for select using (true);
   create policy knk_<name>_insert_own on public.knk_<name>
     for insert with check (auth.uid() = user_id);

   -- Pattern C: Read-all, no writes (server-owned catalog)
   create policy knk_<name>_read_all on public.knk_<name>
     for select using (true);
   -- (no insert/update/delete policy)
   ```

4. **Run the prefix guard:**
   ```bash
   npm run check:knk
   ```
   Must pass before continuing.

5. **Regenerate TypeScript types:**
   ```bash
   supabase gen types typescript --local > src/backend/schema.types.ts
   ```
   (Requires Supabase local dev running via `supabase start`)

6. **Add a client helper** in `src/backend/` (e.g. `src/backend/myFeature.ts`):

   ```typescript
   import { supabase } from './supabaseClient'
   import type { Database } from './schema.types'

   type Row = Database['public']['Tables']['knk_<name>']['Row']

   export async function getMyData(userId: string): Promise<Row[]> {
     const { data, error } = await supabase
       .from('knk_<name>')
       .select('*')
       .eq('user_id', userId)
     if (error) throw error
     return data
   }
   ```

7. **Run the verify gate:**
   ```bash
   npm run typecheck && npm run lint && npm run test && npm run check:knk
   ```

## Rules Summary

- ✓ Name: `knk_<name>` (lowercase, snake_case)
- ✓ `alter table ... enable row level security` — required
- ✓ At least one policy before the table is usable
- ✓ Policy names also prefixed `knk_`
- ✓ Index names also prefixed `knk_`
- ✗ Never use the service-role key in `src/backend/`
- ✗ Never edit existing migration files — create a new one

See `.claude/rules/supabase.md` for full RLS and knk_ documentation.
