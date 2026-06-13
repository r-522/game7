-- ============================================================
-- 0001_init_knk.sql
-- Initial schema for 喧嘩番長7
--
-- Rules:
--   ✓ ALL tables prefixed knk_
--   ✓ RLS enabled on EVERY table
--   ✓ Service-role key never used in client code
-- ============================================================

-- ── knk_profiles ──────────────────────────────────────────────────────────
-- One row per authenticated user (created via trigger on auth.users insert).
create table public.knk_profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  banchou_name  text not null check (char_length(banchou_name) between 1 and 24),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.knk_profiles enable row level security;

-- Owner can read/upsert their own profile
create policy knk_profiles_select_own on public.knk_profiles
  for select using (auth.uid() = id);

create policy knk_profiles_insert_own on public.knk_profiles
  for insert with check (auth.uid() = id);

create policy knk_profiles_update_own on public.knk_profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ── knk_saves ─────────────────────────────────────────────────────────────
-- Cloud save / progression state (one save slot per user for the vertical slice).
-- Denormalized columns (otokogi, banchou_level, kenka_exp) enable server-side
-- leaderboard queries; the full state lives in the `data` JSONB blob.
create table public.knk_saves (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  schema_ver     int  not null default 1,          -- bump when the JSONB shape changes
  otokogi        int  not null default 0,           -- 男気: honour score
  banchou_level  int  not null default 1,           -- 番長度: player level
  kenka_exp      int  not null default 0,           -- 喧嘩慣れ度: fight XP
  data           jsonb not null default '{}'::jsonb,
  -- Full save shape:
  -- {
  --   stats:    { hp, atk, def, menchi },
  --   equipped: { gakuran, hair, bottom, tokkofuku },
  --   unlocks:  { moves: [], outfits: [] },
  --   shatei:   [],
  --   worldFlags: {},
  --   defeatedBanchou: [],
  --   itineraries: {}
  -- }
  updated_at     timestamptz not null default now()
);

alter table public.knk_saves enable row level security;

-- Owner can read/write their own save (no other users can touch it)
create policy knk_saves_rw_own on public.knk_saves
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── knk_customization_catalog ─────────────────────────────────────────────
-- Server-owned item definitions (outfit pieces, hair, etc.).
-- Clients can SELECT but cannot INSERT/UPDATE/DELETE — the catalog is seeded
-- via supabase/seed.sql and managed by migrations only.
create table public.knk_customization_catalog (
  item_key     text primary key,
  slot         text not null check (slot in ('gakuran','hair','bottom','tokkofuku')),
  display_name text not null,           -- Japanese label shown in TailorShop UI
  price        int  not null check (price >= 0),
  menchi_mod   int  not null default 0, -- ± modifier to menchi effectiveness
  pocket_mod   int  not null default 0, -- ± modifier to item pocket capacity
  meta         jsonb not null default '{}'::jsonb
);

alter table public.knk_customization_catalog enable row level security;

-- Anyone (anon / authenticated) can read the catalog
create policy knk_catalog_read_all on public.knk_customization_catalog
  for select using (true);
-- No insert/update/delete policy → clients can NEVER write to the catalog

-- ── knk_leaderboard ───────────────────────────────────────────────────────
-- Append-only run scores.  Clients can read all rows but may only insert
-- rows attributed to themselves.  Score anti-cheat is handled by the
-- knk_submit_score() RPC (SECURITY DEFINER) — see 0002_leaderboard_rpc.sql.
create table public.knk_leaderboard (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  banchou_name  text not null,                    -- snapshot of display name at run time
  score         int  not null check (score >= 0 and score <= 100000000),
  category      text not null default 'arena01_score'
                check (category in ('arena01_score', 'arena01_combo', 'arena01_time')),
  context       jsonb not null default '{}'::jsonb,
  -- Audit context shape: { maxCombo, runDuration, menchiTypes, otokogi }
  -- Used for future server-side validation — see docs/game-design-doc.md §anti-cheat
  created_at    timestamptz not null default now()
);

alter table public.knk_leaderboard enable row level security;

-- Anyone can read the leaderboard
create policy knk_lb_read_all on public.knk_leaderboard
  for select using (true);

-- You may only insert a row attributed to yourself
create policy knk_lb_insert_own on public.knk_leaderboard
  for insert with check (auth.uid() = user_id);

-- No update/delete policy → rows are immutable once written

-- Index for fast top-N queries per category
create index knk_lb_category_score_idx
  on public.knk_leaderboard (category, score desc);

-- ── Convenience view: best score per user per category ───────────────────
create view public.knk_leaderboard_top as
  select distinct on (user_id, category)
    id, user_id, banchou_name, score, category, created_at
  from public.knk_leaderboard
  order by user_id, category, score desc;

-- ── Trigger: keep knk_profiles.updated_at fresh ──────────────────────────
create or replace function public.knk_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger knk_profiles_set_updated_at
  before update on public.knk_profiles
  for each row execute function public.knk_set_updated_at();

create trigger knk_saves_set_updated_at
  before update on public.knk_saves
  for each row execute function public.knk_set_updated_at();

-- ── Auto-create profile row when a new user signs up ─────────────────────
create or replace function public.knk_handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.knk_profiles (id, banchou_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'banchou_name', '新入り番長'));
  return new;
end;
$$;

create trigger knk_on_auth_user_created
  after insert on auth.users
  for each row execute function public.knk_handle_new_user();
