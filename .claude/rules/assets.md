---
paths:
  - "src/assets/**"
  - "scripts/**"
---

# Asset Pipeline Rules

These rules apply when working with 3D models, textures, audio, or the scripts/ directory.

## Never Bundle Large Assets

Game assets (.glb, .ktx2, .mp3, .ogg) must **not** be imported into the Vite JS bundle.

```typescript
// ✗ FORBIDDEN — Vite will bundle the binary, exploding the initial load
import playerGlb from './assets/models/player.glb'

// ✓ CORRECT — load at runtime via URL from Supabase Storage / CDN
import { ASSETS } from '@/assets/loaders/AssetManifest'
const { scene, animations } = useGLTF(ASSETS.playerModel)
```

All asset URLs are registered in `src/assets/loaders/AssetManifest.ts`.
Add a key there when adding a new asset.

## Asset Manifest Pattern

```typescript
// src/assets/loaders/AssetManifest.ts
export const ASSETS = {
  playerModel:     `${CDN_BASE}/characters/player-v1.glb`,
  enemyGrunt:      `${CDN_BASE}/characters/grunt-v1.glb`,
  arenaFloor:      `${CDN_BASE}/environments/arena01-floor.glb`,
  bgmArena01:      `${CDN_BASE}/audio/bgm-arena01.ogg`,
} as const

// CDN_BASE points to Supabase Storage public bucket URL
const CDN_BASE = import.meta.env.VITE_SUPABASE_URL + '/storage/v1/object/public/game-assets'
```

## Source Format

- **3D models**: source as FBX or glTF; **export GLB** for runtime use.
- **Textures**: source as PNG; export KTX2 (Basis Universal) for runtime.
- **Audio**: source as WAV/AIFF; export OGG Vorbis (broad browser support) + MP3 fallback.
- **Animations**: Mixamo FBX → Blender merge → single GLB with multiple clips.
  All characters use the **same Mixamo standard skeleton** for clip compatibility.

## Optimization Pipeline (M8)

Before uploading any asset to Supabase Storage, run:

```bash
node scripts/asset-optimize.mjs input.glb output.glb
```

This applies (once `@gltf-transform/cli` is configured in M8):
1. `prune` — remove unused nodes, extensions, textures
2. `dedup` — deduplicate identical meshes/materials
3. `draco` — geometry compression (~50–70% smaller)
4. `ktx2` — GPU-native texture compression (smaller download AND less VRAM)
5. `meshopt` — vertex cache + overdraw optimization

## Mixamo Animation Workflow

1. Upload a humanoid mesh to Mixamo (or use a Mixamo character).
2. Select desired animations; download "Without Skin" for extra clips.
3. Import all FBX files into Blender (one mesh, many animation imports).
4. Merge animations onto a single armature using NLA editor.
5. Export as a single GLB with all clips baked.
6. Name clips consistently: `idle`, `walk`, `run`, `attack_light_1`,
   `attack_light_2`, `attack_heavy`, `dodge`, `hit_react`, `ko`, etc.
   These names must match the `anim` field in `moveTable.ts`.

## Prefer In-Place Animations

For animations that move the character (walk, run, dash), prefer **in-place**
variants (baked out root motion) so the kinematic physics controller drives
position. Root-motion animations fighting the Rapier controller cause jitter.

## Compression Targets

| Asset type | Max size (uncompressed) | Notes |
|---|---|---|
| Player GLB (all clips) | ~3 MB | Post-Draco |
| Enemy GLB | ~1.5 MB | Shared rig with player if possible |
| Arena environment | ~5 MB | Static geometry can be large chunk-split |
| BGM (per track) | ~2 MB | OGG at 128 kbps |
| SFX (per clip) | ~50 KB | OGG at 64 kbps |
