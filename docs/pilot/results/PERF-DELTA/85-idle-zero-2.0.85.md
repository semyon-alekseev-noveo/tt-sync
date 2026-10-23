# TP-IDLE-ZERO pilot — 2.0.85 quiet sync ×2

## Meta

| Field | Value |
|-------|--------|
| Gate | `PERF-DELTA` |
| GitHub | [#85](https://github.com/semyon-alekseev-noveo/tt-sync/issues/85) (parent [#62](https://github.com/semyon-alekseev-noveo/tt-sync/issues/62); slice 5 [#98](https://github.com/semyon-alekseev-noveo/tt-sync/issues/98)) |
| Case | `TP-IDLE-ZERO` / live check of `TP-IDLE-BYID-ZERO` |
| Recorded | 2026-10-23 ~08:49 UTC (agent) |
| Build | **2.0.85** on `<pilot-vault>` (Thinkpad-tts-test); plugin id `tickticksync-abyss` |
| Status | **pass** — quiet `getTaskById` **0**, `getTaskComments` **0**, `vaultWrites` 0 |

## Inputs

- Prior: [84-idle-zero-2.0.84.md](84-idle-zero-2.0.84.md) — quiet comments **0** / byId **44** / `totalMs` ~18 s.
- Slice 5: [98-slice5-idle-byid.md](98-slice5-idle-byid.md) / [#99](https://github.com/semyon-alekseev-noveo/tt-sync/pull/99).
- Release: https://github.com/semyon-alekseev-noveo/tt-sync/releases/tag/2.0.85
- Owner: plugin updated to **2.0.85** (BRAT) before this run.
- Method: Obsidian CLI (`vault=Thinkpad-tts-test`, `command id=tickticksync-abyss:tts-sync`) + console `[perf]` hook → `.tickticksync/perf-pilot.log`.

## Evidence

### Method

1. Confirmed disk + runtime manifest **2.0.85**.
2. Waited for in-flight sync; `plugin:reload id=tickticksync-abyss`; waited until startup `syncRunning` false.
3. Hooked `console.info` for `[perf]` + `trigger` + `httpByEndpoint` → `perf-pilot.log` (no vault note edits).
4. Quiet **Synchronize** ×2 via `tts-sync` with no vault edits between runs.
5. Deduplicated identical duplicate hook writes; numbers below are unique reports.

### Observed `[perf]` (unique reports)

| Run | trigger | fullSync | totalMs | getTaskById | getTaskComments | commentsFetched | vaultWrites | apiCalls |
|-----|---------|----------|---------|-------------|-----------------|-----------------|-------------|----------|
| Startup (post-reload) | startup | true | 6984.6 | **0** | **0** | 0 | 0 | 6 |
| Quiet 1 | manual | false | 7051.6 | **0** | **0** | 0 | 0 | 6 |
| Quiet 2 | manual | false | 7041.1 | **0** | **0** | 0 | 0 | 6 |

Quiet 1 / Quiet 2: `batch/check` = 2; no `getTaskById` / `getTaskComments` keys in `httpByEndpoint`. `phaseMs.push` ≈ **23–46 ms**; `phaseMs.syncFiles` ≈ **2.8 s** (was ~8.9 s on 2.0.84).

### Vs 2.0.84 baseline

| Metric | 2.0.84 quiet | 2.0.85 quiet | Δ |
|--------|--------------|--------------|---|
| `getTaskComments` | 0 | **0** | 0 |
| `getTaskById` | 44 | **0** | **−44** |
| `vaultWrites` | 0 | 0 | 0 |
| `totalMs` | ~18k | **~7k** | **~−61%** |
| `apiCalls` | 50 | **6** | **−44** |

### TP-IDLE-ZERO check

| Expectation | Quiet 1 | Quiet 2 |
|-------------|---------|---------|
| `getTaskById` = 0 | **0** (met) | **0** (met) |
| `getTaskComments` = 0 | **0** (met) | **0** (met) |
| No vault writes on quiet | 0 (met) | 0 (met) |

### TP-IDLE-BYID-ZERO (live)

Quiet no longer probes `getTaskById` for ProjectScheme Dexie parents, empty-vault vs scheme parent, or same-project list-move. Slice 5 delivered the expected live cut vs **44** on **2.0.84**.

## Conclusion

**TP-IDLE-ZERO = pass** on **2.0.85**. Close [#85](https://github.com/semyon-alekseev-noveo/tt-sync/issues/85). Epic [#62](https://github.com/semyon-alekseev-noveo/tt-sync/issues/62) stays open for `#84` `TP-DELTA-*` and P2 (#86/#87).

## Checklist

- [x] Capture live `[perf]` on **2.0.85** quiet ×2 — this file
- [x] Update `TEST_PLAN.md` + `CHANGELOG.md` honestly (pass)
- [x] Slice 5 byId cut (#98) live effect confirmed (`getTaskById` 0)
- [x] Idle-zero pass (`getTaskById` = 0 and `getTaskComments` = 0)
- [ ] `TP-DELTA-*` (#84)
