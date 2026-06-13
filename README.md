# 喧嘩番長7

喧嘩番長シリーズ（2005–2015 / Spike Chunsoft）の完全後継作。
ブラウザで動く三人称視点(TPS)3Dブロウラー。

## Quick Start

```bash
npm install
cp .env.example .env.local   # fill in VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm run dev                   # → http://localhost:5173
```

## Stack

| Layer | Tech |
|---|---|
| Rendering | React Three Fiber + drei |
| Physics | @react-three/rapier |
| State | Zustand |
| Backend | Supabase (Auth + Postgres + Storage) |
| Build | Vite 6 + TypeScript strict |
| Deploy | Vercel (static SPA) |

## Development Commands

```bash
npm run dev          # dev server
npm run build        # production build
npm run typecheck    # tsc strict check
npm run lint         # ESLint (max-warnings 0)
npm run test         # Vitest unit tests
npm run check:knk    # verify knk_ table prefix rule
npm run assets:optimize  # M8: compress GLB/audio assets
```

## For AI Agents

Read `AGENTS.md` — it is the authoritative reference for architecture,
verify gates, code style, and hard rules (knk_ prefix, no-alloc hot paths, etc.).
