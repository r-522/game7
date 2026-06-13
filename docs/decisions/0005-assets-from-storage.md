# ADR 0005 — Game Assets Served from Supabase Storage (Not Bundled)

**Status**: Accepted  
**Date**: 2026-06

## Context

The game uses 3D models (GLB), textures (KTX2), and audio files. These are typically
large (1–5 MB each) and would bloat the initial JavaScript bundle if imported directly.

## Decision

Large game assets (`.glb`, `.ktx2`, `.mp3`, `.ogg`) are **served at runtime from
Supabase Storage** via a public CDN URL. They are **never imported into the Vite bundle**.

- All asset URLs are registered in `src/assets/loaders/AssetManifest.ts`.
- Assets are compressed with Draco (geometry) + KTX2 (textures) before upload.
- The `AssetManifest` is the single source of truth for asset locations.

## Rationale

- **Initial load time**: A Vite bundle that includes 5 MB of GLBs would require users
  to download 5+ MB before the game starts. With lazy-loaded CDN assets, the initial
  bundle is lean (< 500 KB target) and assets load progressively.
- **Caching**: CDN-served assets are cached by the browser with long TTLs (1 year,
  immutable). Bundled assets change hash on every build even if unchanged.
- **Iteration**: Updating a character model only requires re-uploading to Storage and
  bumping the URL version — no code change, no full rebuild.
- **Compression**: KTX2 textures decompress to GPU-native formats, reducing VRAM
  consumption (not possible with bundled PNG/JPG).

## Consequences

- Assets cannot be accessed offline without explicit service-worker caching.
- A valid Supabase URL is required in `.env.local` to load assets in development.
- `AssetManifest.ts` must be updated when any asset URL changes.
- The `assets:optimize` script runs before uploading to ensure compression.
- `useGLTF.preload()` is called for critical assets (player, environment) to begin
  fetching before they are needed.
- The `.claude/rules/assets.md` rule enforces this pattern for all asset additions.
