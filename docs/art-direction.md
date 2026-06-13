# Art Direction — 喧嘩番長7

## Vision

**昭和ヤンキー×現代WebGL**

「喧嘩番長」シリーズの昭和ヤンキー漫画（クローズ、ビー・バップ・ハイスクール等）的な雰囲気を、
ブラウザWebGLのローポリ＋トゥーン表現で再構築する。
「AI生成感」「テンプレ的無機質さ」ではなく、手書き感と荒削りなエネルギーが宿るデザインを目指す。

---

## Color Palette

### World / Environment

| Role | Hex | Notes |
|---|---|---|
| Background (sky/void) | `#0a0500` | Deep night black with warm undertone |
| Ground / asphalt | `#2a2218` | Dirty dark brown-grey |
| Street lamp glow | `#c87820` | Warm sodium orange |
| Neon accent (shops) | `#e83030` | Aggressive red |
| Night sky mid | `#1a0f2e` | Dark navy-purple |

### Character

| Role | Hex | Notes |
|---|---|---|
| 学ラン base | `#1a1a1a` | Near-black — strict school jacket |
| 学ラン collar trim | `#c0a020` | Brass gold braid |
| 特攻服 base | `#0d0d0d` | Ink black |
| 特攻服 embroidery | `#c82020` / `#c8a020` | Red or gold kanji/dragon motifs |
| Skin (base) | `#d4a070` | Warm Japanese skin tone |
| Skin (shadow) | `#9a6040` | 2-step toon shading |
| Hair (dark) | `#1a0f00` | Black-brown for base characters |
| Hair (リーゼント sheen) | `#4a3010` | Pomade highlight |
| Blood/impact | `#cc2010` | Saturated red for hit sparks |

### HUD / UI

| Role | Hex | Notes |
|---|---|---|
| HUD background | `#120800` + 60% opacity | Very dark warm black |
| HUD text primary | `#e8d5a0` | Old paper yellow |
| 男気 meter fill (シブい) | `#e8c040` | Burnished gold |
| 男気 meter fill (シャバい) | `#404040` | Dull grey |
| HP bar | `#c83020` | Warning red |
| Combo counter | `#e89020` | Amber |
| メンチ beam | `#a0e0ff` | Electric ice blue |
| Hit flash | `#ffffff` → transparent | 1-frame full-white flash |

---

## Toon / Cel Shading Setup (M8)

### CelMaterial

Custom `ShaderMaterial` or `MeshToonMaterial` with:
- **2-step gradient ramp**: base tone → shadow (no smooth gradient)
- **Hard terminator**: sharp shadow edge, not soft
- **Rim light**: subtle warm orange (street lamp) on edges facing away from camera
- **No specular**: matte finish, consistent with cell-animation look

### Outline Pass

`@react-three/postprocessing` `Outline` effect:
- Outlines: 2–3 px, `#000000` (absolute black)
- Only on characters and interactive objects
- Background/environment: no outline (too noisy)
- Slightly thicker outlines on the player character (readability)

### Color Grade / LUT

Target: slightly desaturated mid-tones, boosted warm highlights, crushed blacks.
Evokes an aged anime/film look.

Parameters (approximate):
- Saturation: 0.80 (slightly muted)
- Contrast: 1.15 (punchy)
- Shadows: warm shift (+5 red)
- Highlights: warm shift (+8 red, +5 green)
- Blacks: crushed to 5% (deep dark areas)

Implement as: `HueSaturation` + `BrightnessContrast` from `@react-three/postprocessing`,
or a custom LUT texture (512px) loaded from Supabase Storage in M8.

### Speed Lines (スピード線)

On dodge / dash / 必殺技 startup:
- Full-screen radial speed lines centered on player
- White/grey lines, short duration (0.2 s), fade in/out quickly
- Implement as a screen-space overlay (React DOM `<canvas>` or WebGL pass)

### メンチ Beam Effect

When two opponents lock eyes:
- **Both eyes**: emissive glow point → shoots a rectangular beam sprite
- **Beam clash center**: sparks + shockwave ring (`<RingGeometry>` animated)
- Colors: player = ice blue (`#a0e0ff`), enemy = crimson (`#ff4020`)
- Camera: slight zoom-in + chromatic aberration flash on clash

---

## Typography (筆文字)

### Primary Font — Game Titles, 必殺技 Names, メンチ Types

**Font**: 「源暎エムゴ」(GenEi M Gothic) or 「851ゴチカクット」— free for commercial use.
Alternatively: any bold brush-stroke-influenced Gothic with angular tension.

**Usage**:
- Damage numbers: large, angled (kerning +10), color = hit type
- 必殺技 name card: full-width display, white on black with red drop shadow
- メンチ type labels (睨/笑/技/漢/気/冷): heavy weight, red or gold

### Secondary Font — HUD Values, Body Text

**Font**: Noto Sans JP Bold — universal fallback, available via Google Fonts CDN.
Keep file size low: subset to kanji/kana/Latin used in the game.

### HUD Design Language

- **Brush stroke frames**: meter containers use a custom brush-stroke border SVG/PNG
  (loaded from Storage), not CSS borders
- **Torn paper aesthetic**: result screen uses a diagonal tear/rip texture overlay
- **Washi paper background**: tanka/menu overlays use a subtle washi texture (#e0d0b0 base)
- **No clean geometric UI**: avoid perfect rounded rectangles — everything has slight
  imperfection (slight rotation, brush-edge)

---

## Character Design

### Player Hero (鈴木 猛)

- CC0 base body (Quaternius humanoid) with reskinned materials
- **学ラン** (standard school uniform): near-black jacket, gold buttons, white collar
- **リーゼント**: tall pompadour, dark hair, slight forward lean
- **ボンタン**: wide-leg trousers, slight sag

Accessory layers (slot system):
- 学ラン → 特攻服 over top (opacity blend or mesh swap)
- Hair mesh swapped by slot (角刈り / 七三 / リーゼント)

### Enemy Grunts

- Same base rig (Mixamo standard) as player for animation compatibility
- Slightly shorter / rougher proportions
- Varied colors on 学ラン (dark navy / dark green variants)

### Boss (荒木 竜二)

- 特攻服 with embroidered dragon motif (hand-drawn texture)
- リーゼント slightly taller than player
- More muscle mass (scale Y +5%, X +3%)
- Idle animation: arms crossed + occasional snort

---

## Visual FX

### Hit Spark

- 3D billboard sprite burst at impact point
- Yellow-orange (light hit) → red-white (heavy) → gold (必殺技)
- Scale: 0.4m light → 0.8m heavy → 1.5m special
- Duration: 3 frames on, then fade over 4 frames
- Implement as: `<InstancedMesh>` sprite pool (pre-allocated, reused)

### Impact Flash

- Full-scene: `BrightnessContrast` + `HueSaturation` spike for 1 frame on heavy hit
- Character: brief emissive flash on hurtbox mesh for 2 frames

### KO Effect

- **Screen effects**: desaturate + slow-motion (hitstop extended), then snap back
- **Character**: ragdoll impulse (Rapier dynamic body, release kinematic on KO)
- **Text**: 「KO!!」大文字カード, brush-style, 0.5s display

### Menu Transitions

- Screen wipe: diagonal black triangle wipe (top-right to bottom-left)
- Duration: 0.3s
- Sound: dramatic taiko drum hit

---

## Environment Design — Arena01

One district (一丁目, Icchome) for the vertical slice:

- **Size**: ~50m × 50m playable area (brawler arena scale, not open world)
- **Setting**: back alley + vacant lot behind a train station, night
- **Atmosphere**: flickering street lamps, steam vents, graffiti walls, scattered rubbish
- **CC0 source**: Kenney urban props + custom geometry in Blender
- **Color**: muted darks with pools of warm sodium light; neon shop signs as accent
- **Playfield edge**: invisible barriers disguised as fences / walls / chain-link

No open-world navigation for the vertical slice — the "district" is a contained arena.
Future milestones will add proper streets and a free-roam map.
