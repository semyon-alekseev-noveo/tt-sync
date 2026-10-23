# TP-IDLE-ZERO pilot — 2.0.82 quiet sync ×2

## Meta

| Field | Value |
|-------|--------|
| Gate | `PERF-DELTA` |
| GitHub | [#85](https://github.com/semyon-alekseev-noveo/tt-sync/issues/85) (parent [#62](https://github.com/semyon-alekseev-noveo/tt-sync/issues/62)) |
| Case | `TP-IDLE-ZERO` |
| Recorded | 2026-10-23 ~04:47 UTC (agent) |
| Build | **2.0.82** on `<pilot-vault>` (Thinkpad-tts-test); plugin id `tickticksync-abyss` |
| Status | **fail** — quiet sync still probes comments / by-id (slice 2 not enough live) |

## Inputs

- Prior fail: [81-idle-zero-2.0.81.md](81-idle-zero-2.0.81.md) — quiet `getTaskComments` 1757 / `getTaskById` 68.
- Slice 2 unit: [82-slice2-idle-fast.md](82-slice2-idle-fast.md) / [#82](https://github.com/semyon-alekseev-noveo/tt-sync/issues/82).
- Canonical: `TEST_PLAN.md` TP-IDLE-ZERO; `docs/TICKTICK_DELTA_API.md` §3.2.
- Release: https://github.com/semyon-alekseev-noveo/tt-sync/releases/tag/2.0.82
- Owner: plugin already updated to **2.0.82** in the pilot vault before this run.
- Obsidian hybrid-search MCP: unavailable; same method as 2.0.81 — Obsidian CLI (`vault=Thinkpad-tts-test`, `command id=tickticksync-abyss:tts-sync`) + console `[perf]` hook → `<pilot-vault>/.tickticksync/perf-pilot.log`.

## Evidence

### Method

1. Confirmed `manifest.json` / eval → **2.0.82**.
2. Waited for any in-flight sync; `plugin:reload id=tickticksync-abyss`; waited until `syncRunning` false after startup.
3. Hooked `console.info` to append lines containing `[perf]` + `"trigger"` + `"httpByEndpoint"` into `.tickticksync/perf-pilot.log` (no vault note edits).
4. Ran **Synchronize** twice via `tickticksync-abyss:tts-sync` with no vault edits between runs.
5. Deduplicated identical duplicate hook writes of the same report; numbers below are the unique report per run.

### Observed `[perf]` (unique reports)

| Run | trigger | fullSync | totalMs | getTaskById | getTaskComments | commentsFetched | vaultWrites | apiCalls |
|-----|---------|----------|---------|-------------|-----------------|-----------------|-------------|----------|
| Startup (post-reload, before quiet ×2) | startup | true | 242652.9 | 44 | 871 | 871 | 0 | 921 |
| Quiet 1 | manual | false | 477966.4 | 68 | 1741 | 1741 | 0 | 1815 |
| Quiet 2 | manual | false | 474896 | 68 | 1741 | 1741 | 0 | 1815 |

Quiet 1 / Quiet 2: `batch/check` = 2; heavy `phaseMs.comments` (~441–444 s) and `push` / `syncFiles` (~233–237 s each).

### Vs 2.0.81 baseline

| Metric | 2.0.81 quiet | 2.0.82 quiet | Δ |
|--------|--------------|--------------|---|
| `getTaskComments` | 1757 | 1741 | −16 |
| `getTaskById` | 68 | 68 | 0 |
| `vaultWrites` | 0 | 0 | 0 |
| `totalMs` | ~468–472k | ~475–478k | ≈ same |

### TP-IDLE-ZERO check

| Expectation | Quiet 1 | Quiet 2 |
|-------------|---------|---------|
| `getTaskById` = 0 | **68** | **68** |
| `getTaskComments` = 0 (when counts match / no twins) | **1741** | **1741** |
| No vault writes on quiet | 0 (met) | 0 (met) |

## Conclusion

**TP-IDLE-ZERO = fail** on **2.0.82**. Slice 2 (commentCount backfill + idle-fast sync/preparePersist) did **not** deliver a sharp live drop vs **1757** on **2.0.81** (only −16 comment GETs). Remaining quiet cost is still dominated by Abyss comment orchestration; next leverage is likely **double-sweep removal (#83)** then re-measure. Do not mark pass. Leave [#85](https://github.com/semyon-alekseev-noveo/tt-sync/issues/85) open until a future build hits idle-zero (or an agreed partial bar). Epic [#62](https://github.com/semyon-alekseev-noveo/tt-sync/issues/62) stays open.

## Checklist

- [x] Capture live `[perf]` on **2.0.82** quiet ×2 — this file
- [x] Update `TEST_PLAN.md` + `CHANGELOG.md` honestly (fail, not invent pass)
- [ ] Slice 3 double-sweep (#83)
- [ ] Re-pilot after #83
- [ ] `TP-DELTA-*` (#84)
