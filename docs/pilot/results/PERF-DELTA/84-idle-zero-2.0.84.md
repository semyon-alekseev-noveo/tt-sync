# TP-IDLE-ZERO pilot — 2.0.84 quiet sync ×2

## Meta

| Field | Value |
|-------|--------|
| Gate | `PERF-DELTA` |
| GitHub | [#85](https://github.com/semyon-alekseev-noveo/tt-sync/issues/85) (parent [#62](https://github.com/semyon-alekseev-noveo/tt-sync/issues/62); slice 4 [#94](https://github.com/semyon-alekseev-noveo/tt-sync/issues/94)) |
| Case | `TP-IDLE-ZERO` / live check of `TP-IDLE-EMPTY-SWEEP` |
| Recorded | 2026-10-23 ~07:53 UTC (agent) |
| Build | **2.0.84** on `<pilot-vault>` (Thinkpad-tts-test); plugin id `tickticksync-abyss` |
| Status | **fail** idle-zero (`getTaskById` **44** ≠ 0); **major win** — `getTaskComments` **0** (was **871** on 2.0.83) |

## Inputs

- Prior: [83-idle-zero-2.0.83.md](83-idle-zero-2.0.83.md) — quiet `getTaskComments` **871** / `getTaskById` **44** / `totalMs` ~250–276 s.
- Slice 4: [94-slice4-empty-sweep.md](94-slice4-empty-sweep.md) / [#95](https://github.com/semyon-alekseev-noveo/tt-sync/pull/95).
- Release: https://github.com/semyon-alekseev-noveo/tt-sync/releases/tag/2.0.84
- Owner: plugin updated to **2.0.84** (BRAT) before this run.
- Method: Obsidian CLI (`vault=Thinkpad-tts-test`, `command id=tickticksync-abyss:tts-sync`) + console `[perf]` hook → `.tickticksync/perf-pilot.log`.

## Evidence

### Method

1. Confirmed disk + runtime manifest **2.0.84**.
2. Waited for in-flight sync; `plugin:reload id=tickticksync-abyss`; waited until startup `syncRunning` false.
3. Hooked `console.info` for `[perf]` + `trigger` + `httpByEndpoint` → `perf-pilot.log` (no vault note edits).
4. Quiet **Synchronize** ×2 via `tts-sync` with no vault edits between runs.
5. Deduplicated identical duplicate hook writes; numbers below are unique reports.

### Observed `[perf]` (unique reports)

| Run | trigger | fullSync | totalMs | getTaskById | getTaskComments | commentsFetched | vaultWrites | apiCalls |
|-----|---------|----------|---------|-------------|-----------------|-----------------|-------------|----------|
| Startup (post-reload) | startup | true | 18103.6 | 44 | **0** | 0 | 0 | 50 |
| Quiet 1 | manual | false | 18353.2 | 44 | **0** | 0 | 0 | 50 |
| Quiet 2 | manual | false | 18035 | 44 | **0** | 0 | 0 | 50 |

Quiet 1 / Quiet 2: `batch/check` = 2; `phaseMs.push` ≈ **23–31 ms**; `phaseMs.syncFiles` ≈ **8.9 s** (was ~240–266 s on 2.0.83). No `getTaskComments` key in `httpByEndpoint`.

### Vs 2.0.83 baseline

| Metric | 2.0.83 quiet | 2.0.84 quiet | Δ |
|--------|--------------|--------------|---|
| `getTaskComments` | 871 | **0** | **−871** |
| `getTaskById` | 44 | **44** | 0 |
| `vaultWrites` | 0 | 0 | 0 |
| `totalMs` | ~250–276k | **~18k** | **~−93%** |
| `phaseMs.syncFiles` | ~240–266k | **~8.9k** | comment sweep gone |

### TP-IDLE-ZERO check

| Expectation | Quiet 1 | Quiet 2 |
|-------------|---------|---------|
| `getTaskById` = 0 | **44** | **44** |
| `getTaskComments` = 0 | **0** (met) | **0** (met) |
| No vault writes on quiet | 0 (met) | 0 (met) |

### TP-IDLE-EMPTY-SWEEP (live)

Quiet (and startup) no longer probe Comments for empty Abyss threads / empty maps. Slice 4 delivered the expected live cut vs **871** on **2.0.83**.

## Conclusion

**TP-IDLE-ZERO = fail** on **2.0.84** because `getTaskById` stays **44**. Comment idle is effectively done (`getTaskComments` **0**, wall-time ~18 s). Leave [#85](https://github.com/semyon-alekseev-noveo/tt-sync/issues/85) open for the byId residual (or retarget). Epic [#62](https://github.com/semyon-alekseev-noveo/tt-sync/issues/62) stays open — next leverage: cut quiet `getTaskById` probes; #84 `TP-DELTA-*`.

## Checklist

- [x] Capture live `[perf]` on **2.0.84** quiet ×2 — this file
- [x] Update `TEST_PLAN.md` + `CHANGELOG.md` honestly (fail + comment win)
- [x] Slice 4 empty-sweep (#94) live effect confirmed (`getTaskComments` 0)
- [ ] Idle-zero pass (`getTaskById` = 0)
- [ ] `TP-DELTA-*` (#84)
