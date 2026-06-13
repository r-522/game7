---
name: asset-pipeline
description: Optimize a 3D model (GLB) or audio file for 喧嘩番長7's production asset
  pipeline. Applies Draco/KTX2 compression, registers the asset in AssetManifest,
  and notes the Supabase Storage upload step. Use when adding or updating game assets.
---

# Asset Pipeline

## Overview

```
Source (FBX / raw GLB / PNG / WAV)
  → Blender (cleanup, animation merge, export GLB)
  → scripts/asset-optimize.mjs (Draco + KTX2 + prune)
  → Supabase Storage (public CDN bucket)
  → AssetManifest.ts (register URL)
  → useGLTF(ASSETS.key) in render code
```

**Never** commit large binaries to the repo.
**Never** `import` them into the Vite bundle.

## Steps

### 1. Prepare the source asset

**Characters (GLB with animations):**
- Use Mixamo for rigging and animations (standard humanoid skeleton)
- Merge all clips onto a single armature in Blender (NLA editor)
- Export as GLB from Blender with these settings:
  - Include: Meshes + Armature + Animations
  - Transform: Apply Unit Scale
  - Animation: NLA Strips, Bake All Actions, Limit to Playback Range
- Name animation clips consistently (must match `anim` in `moveTable.ts`):
  `idle`, `walk`, `run`, `attack_light_1`, `attack_heavy`, `dodge`, `hit_react`, `ko`, `special_*`

**Environments (GLB):**
- Keep static geometry merged (reduces draw calls)
- Separate dynamic/interactive objects as child nodes
- UV-unwrap for baked lightmaps (M8)

### 2. Optimize (M8 — requires @gltf-transform/cli)

```bash
# Install once (M8):
npm install -D @gltf-transform/cli

# Run the pipeline:
node scripts/asset-optimize.mjs src/assets/models/source.glb public-output.glb
```

Until M8, note the manual steps:
```bash
npx @gltf-transform/cli optimize source.glb optimized.glb \
  --compress draco \
  --texture-compress ktx2
```

Target sizes after optimization:
- Player character (all clips): ≤ 3 MB
- Enemy grunt: ≤ 1.5 MB
- Arena environment: ≤ 5 MB

### 3. Upload to Supabase Storage

```bash
# Via Supabase CLI (requires login):
supabase storage cp optimized.glb ss:///game-assets/characters/player-v1.glb

# Or via Supabase Dashboard → Storage → game-assets bucket
```

Note the public URL:
`<SUPABASE_URL>/storage/v1/object/public/game-assets/characters/player-v1.glb`

### 4. Register in AssetManifest

Edit `src/assets/loaders/AssetManifest.ts`:

```typescript
export const ASSETS = {
  // ... existing assets ...
  playerModel: `${CDN_BASE}/characters/player-v1.glb`,
} as const
```

### 5. Preload (optional)

Add to `src/assets/loaders/preload.ts` if the asset is needed immediately at game start:

```typescript
import { ASSETS } from './AssetManifest'
import { useGLTF } from '@react-three/drei'

export function preloadGameAssets() {
  useGLTF.preload(ASSETS.playerModel)
}
```

### 6. Use in render code

```typescript
// In a Rig component (src/render/rig/PlayerRig.tsx)
import { ASSETS } from '@/assets/loaders/AssetManifest'
import { useGLTF, useAnimations } from '@react-three/drei'

const { scene, animations } = useGLTF(ASSETS.playerModel)
const { actions } = useAnimations(animations, groupRef)
```

### 7. Run verify gate

```bash
npm run typecheck && npm run lint
```

## Audio Files

Same pattern applies:
1. Export OGG Vorbis (128 kbps BGM, 64 kbps SFX) + MP3 fallback
2. Upload to `game-assets/audio/` bucket
3. Register in `ASSETS` as `bgmArena01`, `sfxHit`, etc.
4. Load via `AudioManager` (`src/assets/loaders/audio/AudioManager.ts`)
