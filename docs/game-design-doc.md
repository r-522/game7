# Game Design Document — 喧嘩番長7

## 1. Premise

主人公は新たな番長を目指す不良少年。極東線沿線の高校間抗争が勃発し、伝説の「喧嘩番長」の称号をかけて各高校の番長と渡り合う。喧嘩を通じて生まれる友情・義理を描く昭和ヤンキー青春譚。

## 2. Core Loop

```
街区フリーロームで行動予定表を収集
       ↓
ライバル番長を発見・メンチ開始
       ↓
メンチビーム激突（種類選択）
       ↓
タンカ切り QTE（先制権争い）
       ↓
3D近接戦闘
       ↓
勝利/敗北 → 男気判定 + XP
       ↓
舎弟勧誘 / テーラーショップ / 次の番長へ
```

## 3. メンチ (Menchi) System

### 6 Types and Effects

| Type | 表示 | 効果 |
|---|---|---|
| 睨 (Nirami) | 「睨」 | Standard; no modifier |
| 笑 (Warai) | 「笑」 | If opponent picks 睨, flip advantage (psychological trap) |
| 技 (Waza) | 「技」 | Win → wider cancel windows during FIGHT (+2 frames) |
| 漢 (Otoko) | 「漢」 | Win honorably → otokogi bonus ×1.5 |
| 気 (Ki) | 「気」 | Win → reduced enemy poise threshold during FIGHT |
| 冷 (Rei) | 「冷」 | Win → enemy attack speed reduced 10% |

### Clash Resolution

1. Player selects a menchi type.
2. Enemy also has a preferred type (data-defined per enemy).
3. Clash mini-contest: press/hold button in a timed window (or stick waggle).
4. **Winner** = player if timed correctly AND menchi type relationship favors them (data table).
5. **Result** stored in `useEncounterStore.menchiResult` for downstream use.

### Effect on Otokogi

Initiating menchi before attacking = honorable (シブイ).
Attacking without menchi = sneak attack = シャバい (−20 otokogi).

## 4. タンカ (Tanka) System

After menchi, a smacktalk QTE:
- 2–4 lines displayed for ~3 seconds (countdown ring)
- Each context (enemy type × situation) has a "correct" answer key stored in `src/data/tankaLines.ts`
- **Correct pick**: `firstStrike = 'player'` — enemy starts in an Open/Staggered sub-state (free heavy attack or wider first combo)
- **Wrong pick**: `firstStrike = 'enemy'` — player starts in HitReact (enemy gets a guaranteed opener)
- **Timeout**: same as wrong pick

### Sample Lines Pool

```typescript
// src/data/tankaLines.ts
export const TANKA_POOLS = {
  // Lines shown to player; correctKey = index of the correct answer
  standard_banchou: {
    lines: [
      'お前、俺の目が怖くないのか？',      // correct (0)
      '今日は天気がいいな…',               // wrong
      '名前を言え',                        // wrong
      '待っていたぞ',                       // wrong
    ],
    correctKey: 0,
  },
  // ... more contexts
}
```

## 5. 男気 (Otokogi) System

### Score Range

`-100` (最シャバい) to `+100` (最シブい). Default: `0`.

### Delta Rules (applied in `src/systems/progression/Otokogi.ts`)

| Action | Delta |
|---|---|
| Win via proper menchi → tanka → no-weapon fight | +15 |
| Win but used weapon | −10 (net +5 if won otherwise cleanly) |
| Win via 必殺技 (legitimate unlock) | +5 |
| Sneak attack (no menchi) | −20 |
| Hit a civilian | −30 |
| Flee a fight | −25 |
| Lose but fought honorably | −5 |
| Lose and fled | −25 |
| Recruit a shatei (honorable win required) | +5 |
| 漢メンチ clean win | extra +5 |

### Penalties by Otokogi Level

| Level | Range | Effects |
|---|---|---|
| 最シブい | 80–100 | Shatei capacity +1; menchi effectiveness +15% |
| シブい | 40–79 | Normal |
| 普通 | 0–39 | Normal |
| シャバい | −40 to −1 | Menchi effectiveness −15% |
| 最シャバい | −100 to −41 | Cannot recruit shatei; tailor shop door locked; menchi effectiveness −30% |

## 6. 番長度 / 喧嘩慣れ度 (Leveling)

### XP Sources

| Source | XP |
|---|---|
| Win a fight (grunt) | 30 |
| Win a fight (banchou) | 120 |
| Proper menchi + tanka sequence | +20 bonus |
| 漢メンチ bonus | +15 bonus |

### Level Thresholds and Unlocks (vertical slice: levels 1–5)

| Level | XP Required | Unlock |
|---|---|---|
| 1 | 0 | `attack_light_1`, `attack_light_2`, `dodge` |
| 2 | 300 | `attack_heavy`, `block` |
| 3 | 800 | `attack_light_3` (faster cancel window) |
| 4 | 1800 | `special_yamaarashi` (必殺技: rolling tackle) |
| 5 | 3500 | `special_ryu_no_kobushi` (必殺技: dragon punch) |

## 7. カスタマイズ (Customization)

All items defined in `supabase/migrations/0001_init_knk.sql` table `knk_customization_catalog`
and the client-side type definitions in `src/data/customization.ts`.

### Equipment Slots

| Slot | Options | Effect |
|---|---|---|
| 学ラン (gakuran) | 標準学ラン / 改造学ラン / 特注学ラン | menchi_mod: 0 / +5 / +10 |
| 髪型 (hair) | 角刈り / 七三 / リーゼント | menchi_mod: 0 / 0 / +8 |
| 下半身 (bottom) | ボンタン / ドカン / ジャージ下 | pocket_mod: 2 / 4 / 1 |
| 特攻服 (tokkofuku) | なし / 龍 / 虎 / 義 | menchi_mod: 0 / +12 / +12 / +15 |

### Pocket Capacity

`pocketCapacity = 2 + bottom.pocket_mod`
Items (health restoratives, menchi energy drinks) consume pocket slots.

### Menchi Effectiveness

`menchiEffectiveness = 100 + gakuran.menchi_mod + hair.menchi_mod + tokkofuku.menchi_mod`
Modified by otokogi level multiplier.

## 8. 舎弟 (Shatei) Recruitment

- Only available after defeating a **番長** (not a grunt) in an **honorable fight**
  (proper menchi + tanka, no weapon, otokogi ≥ 0)
- Player can have up to `1 + floor(otokogi / 50)` shatei at a time (max 3 in slice)
- In FIGHT: shatei assist by interrupting an enemy combo once per fight (player input)
  — the shatei appears, delivers a hit that staggers the enemy, then retreats
- Shatei data stored in `knk_saves.data.shatei[]`

## 9. Leaderboard Scoring Formula

```
baseScore = enemiesKO × 100
          + banchouKO × 500
          + combo × maxCombo × 10
          + (otokogi × 5)          // positive otokogi only
          + timeBonus               // 10000 - (runSeconds × 20), min 0
comboPenalty = snackAttacks × 200  // for each non-menchi attack
finalScore = max(0, baseScore - comboPenalty)
```

### Anti-Cheat Roadmap (documented here, not in scope for vertical slice)

1. **M7**: `CHECK` constraints on score column; `knk_submit_score` RPC with
   bounds check (score vs context.runDuration, maxCombo vs context.enemyCount)
2. **Post-MVP**: Per-user rate limit (1 submission per 30 seconds)
3. **Future**: Fixed-step deterministic replay server verification
   (feasible because simulation is deterministic at 60 Hz — see ADR 0003)

## 10. Day/Time and Itinerary System

- One in-game day = 10 minutes real time (accelerated, for pacing)
- Time periods: 朝 (morning) / 昼 (noon) / 放課後 (after school) / 夜 (night)
- Each defeated grunt drops an **行動予定表** (itinerary) listing a banchou's location by time period
- The day resets when the player sleeps at an inn / between arena sessions (vertical slice: no inn, day-time is cosmetic)

## 11. Story — Vertical Slice Chapter 1

**タイトル**: 「極東の新星」

**設定**: 極東駅北口周辺の一丁目アリーナ地区。

**主人公**: 鈴木 猛 (Suzuki Takeshi)（名前変更可、デフォルト設定）。転校初日、すでに腕っぷしの噂が広まっている。

**敵番長**: 荒木 竜二 (Araki Ryuji) — 一丁目を仕切る「竜の荒木」。リーゼントに龍の特攻服。口は悪いが義理に厚い。

**流れ**:
1. 一丁目アリーナを探索。ザコ不良と格闘してXPを稼ぐ。
2. 行動予定表で荒木の居場所を特定。
3. 荒木との遭遇 → メンチ → タンカ → ボス戦。
4. 勝利 → 荒木が仲間（舎弟）に → エンドカード「極東の旅はまだ始まったばかりだ…」

**必殺技イベント**: レベル4到達時に「山嵐」を習得するムービー（テキスト演出）。
