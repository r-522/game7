@AGENTS.md

<!-- ───────────────────────────────────────────────────────────────────────
     Claude Code — project-specific notes
     Keep this file THIN.  All authoritative project context lives in AGENTS.md.
     This file handles Claude-specific conventions only.
     ─────────────────────────────────────────────────────────────────────── -->

## Claude Code Notes

### Windows host
This repository uses `@AGENTS.md` (file import) rather than a symlink because
Windows symlinks require elevated/Developer-Mode permissions.
Do **not** replace this with a symlink.

### Preferred skills
Use these slash commands for common tasks rather than ad-hoc code:
- `/add-entity`        — scaffold a new game entity (mesh + components + Rig + test stub)
- `/add-move`          — add a move/技 to moveTable with FSM state + hitId test
- `/add-knk-table`     — generate an SQL migration with knk_ prefix + RLS policies
- `/asset-pipeline`    — optimize a GLB/audio asset and register it in AssetManifest
- `/perf-profiling`    — frame-time / draw-call profiling checklist

### Path-scoped rules to follow
When working in these directories, read the matching rule file first:
| Path | Rule file |
|---|---|
| `src/systems/combat/**` | `.claude/rules/combat.md` |
| `src/backend/**`, `supabase/**` | `.claude/rules/supabase.md` |
| `src/render/**`, `useFrame` code | `.claude/rules/render-perf.md` |
| `src/assets/**`, `scripts/**` | `.claude/rules/assets.md` |

### Verify before finishing
After any change, run the full gate:
```
npm run typecheck && npm run lint && npm run test && npm run check:knk
```
Show the output.  Fix root causes — do not suppress errors.

### Node.js (portable install)
Node.js is installed at `C:\Users\ikere\node-portable\node-v24.16.0-win-x64\`.
If npm/node commands fail, add that path to PATH first:
```powershell
$env:PATH = "C:\Users\ikere\node-portable\node-v24.16.0-win-x64;" + $env:PATH
```
