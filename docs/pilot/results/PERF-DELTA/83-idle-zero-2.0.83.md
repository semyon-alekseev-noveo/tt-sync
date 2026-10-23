# TP-IDLE-ZERO pilot — 2.0.83 quiet sync ×2

## Meta

| Field | Value |
|-------|--------|
| Gate | `PERF-DELTA` |
| GitHub | [#85](https://github.com/semyon-alekseev-noveo/tt-sync/issues/85) (parent [#62](https://github.com/semyon-alekseev-noveo/tt-sync/issues/62); slice 3 [#83](https://github.com/semyon-alekseev-noveo/tt-sync/issues/83)) |
| Case | `TP-IDLE-ZERO` / live check of `TP-IDLE-MANUAL-SCOPE` |
| Recorded | 2026-10-23 ~06:54 UTC (agent) |
| Build | **2.0.83** on `<pilot-vault>` (Thinkpad-tts-test); plugin id `tickticksync-abyss` |
| Status | **fail** idle-zero (probes ≠ 0); **partial win** vs 2.0.82 — comment GETs ~½, wall-time ~½ |

## Inputs

- Prior fail: [82-idle-zero-2.0.82.md](82-idle-zero-2.0.82.md) — quiet `getTaskComments` **1741** / `getTaskById` **68** / `totalMs` ~475–478 s.
- Slice 3: [83-slice3-manual-scope.md](83-slice3-manual-scope.md) / [#91](https://github.com/semyon-alekseev-noveo/tt-sync/pull/91).
- Release: https://github.com/semyon-alekseev-noveo/tt-sync/releases/tag/2.0.83
- Owner: plugin updated to **2.0.83** (BRAT) before this run.
- Method: Obsidian CLI (`vault=Thinkpad-tts-test`, `command id=tickticksync-abyss:tts-sync`) + console `[perf]` hook → `.tickticksync/perf-pilot.log`.

## Evidence

### Method

1. Confirmed disk + runtime manifest **2.0.83**.
2. Waited for in-flight sync; `plugin:reload id=tickticksync-abyss`; waited until startup `syncRunning` false.
3. Hooked `console.info` for `[perf]` + `trigger` + `httpByEndpoint` → `perf-pilot.log` (no vault note edits).
4. Quiet **Synchronize** ×2 via `tts-sync` with no vault edits between runs.
5. Deduplicated identical duplicate hook writes; numbers below are unique reports.

### Observed `[perf]` (unique reports)

| Run | trigger | fullSync | totalMs | getTaskById | getTaskComments | commentsFetched | vaultWrites | apiCalls |
|-----|---------|----------|---------|-------------|-----------------|-----------------|-------------|----------|
| Startup (post-reload) | startup | true | ~250252–251058 | 44 | 871 | 871 | 0 | 921 |
| Quiet 1 | manual | false | 249829.4 | 44 | **871** | 871 | 0 | 921 |
| Quiet 2 | manual | false | 275985.4 | 44 | **871** | 871 | 0 | 921 |

Quiet 1 / Quiet 2: `batch/check` = 2; `phaseMs.push` ≈ **30–34 ms** (was ~233–237 s on 2.0.82); `phaseMs.syncFiles` ≈ **240–266 s** still owns the remaining comment GETs.

### Vs 2.0.82 baseline

| Metric | 2.0.82 quiet | 2.0.83 quiet | Δ |
|--------|--------------|--------------|---|
| `getTaskComments` | 1741 | **871** | **−870 (~½)** |
| `getTaskById` | 68 | **44** | −24 |
| `vaultWrites` | 0 | 0 | 0 |
| `totalMs` | ~475–478k | **~250–276k** | **~−45%** |
| `phaseMs.push` | ~233–237k | **~30–34** | pre-pull full sweep gone |

### TP-IDLE-ZERO check

| Expectation | Quiet 1 | Quiet 2 |
|-------------|---------|---------|
| `getTaskById` = 0 | **44** | **44** |
| `getTaskComments` = 0 | **871** | **871** |
| No vault writes on quiet | 0 (met) | 0 (met) |

### TP-IDLE-MANUAL-SCOPE (live)

Quiet manual no longer doubles comment GETs vs startup (871 ≈ startup 871). Pre-pull expand removed (`push` ≈ idle). Remaining cost is a **single** `syncFiles` comment sweep — expected until further idle-fast / count policy cuts remaining GETs.

## Conclusion

**TP-IDLE-ZERO = fail** on **2.0.83** (probes not zero). **Slice 3 delivered the expected live cut:** quiet comment GETs and wall-time ≈ half of **2.0.82**, matching one vault pass rather than two. Leave [#85](https://github.com/semyon-alekseev-noveo/tt-sync/issues/85) open until idle-zero (or an agreed partial bar). Epic [#62](https://github.com/semyon-alekseev-noveo/tt-sync/issues/62) stays open — next leverage: idle-fast / `commentCount` on the remaining `syncFiles` sweep (#82 path not enough alone) and/or #84 `TP-DELTA-*`.

## Checklist

- [x] Capture live `[perf]` on **2.0.83** quiet ×2 — this file
- [x] Update `TEST_PLAN.md` + `CHANGELOG.md` honestly (fail + partial improvement)
- [x] Slice 3 double-sweep (#83) live effect confirmed
- [ ] Idle-zero pass
- [ ] `TP-DELTA-*` (#84)
