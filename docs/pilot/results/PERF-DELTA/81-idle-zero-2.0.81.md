# TP-IDLE-ZERO pilot — 2.0.81 quiet sync ×2

## Meta

| Field | Value |
|-------|--------|
| Gate | `PERF-DELTA` |
| GitHub | [tt-sync #62](https://github.com/semyon-alekseev-noveo/tt-sync/issues/62) |
| Case | `TP-IDLE-ZERO` |
| Recorded | 2026-10-23 ~03:17 UTC (agent) |
| Build | **2.0.81** on `<pilot-vault>` (Thinkpad-tts-test); plugin id `tickticksync-abyss` |
| Status | **fail** — live quiet sync still probes comments / by-id |

## Inputs

- Prior: [62-slice1-idle-comment-probe.md](62-slice1-idle-comment-probe.md) (unit-only; live `[perf]` not run).
- Canonical: `TEST_PLAN.md` TP-IDLE-ZERO; `docs/TICKTICK_DELTA_API.md` §3.2 idle / comments.
- Release: https://github.com/semyon-alekseev-noveo/tt-sync/releases/tag/2.0.81
- Owner: plugin already updated to **2.0.81** in the pilot vault before this run.
- Obsidian hybrid-search MCP: unavailable this session; used Obsidian CLI (`vault=Thinkpad-tts-test`, `command id=tickticksync-abyss:tts-sync`) + console `[perf]` hook appending to `<pilot-vault>/.tickticksync/perf-pilot.log`.

## Evidence

### Method

1. Confirmed `manifest.json` / eval → **2.0.81**.
2. `plugin:reload id=tickticksync-abyss`; waited until `syncRunning` false after startup.
3. Hooked `console.info` to append lines containing `[perf]` + `"trigger"` + `"httpByEndpoint"` into `.tickticksync/perf-pilot.log` (same-session hook; no vault note edits).
4. Ran **Synchronize** twice via `tickticksync-abyss:tts-sync` with no vault edits between runs.
5. Deduplicated identical duplicate hook writes of the same report (stacked `console.info` wrappers from earlier agent attempts); numbers below are the unique report per run.

### Observed `[perf]` (unique reports)

| Run | trigger | fullSync | totalMs | getTaskById | getTaskComments | commentsFetched | vaultWrites | apiCalls |
|-----|---------|----------|---------|-------------|-----------------|-----------------|-------------|----------|
| Startup (post-reload, before quiet ×2) | startup | true | 244601 | 44 | 879 | 879 | 0 | 929 |
| Quiet 1 | manual | false | 468373.5 | 68 | 1757 | 1757 | 0 | 1831 |
| Quiet 2 | manual | false | 471829.7 | 68 | 1757 | 1757 | 0 | 1831 |

Quiet 1 / Quiet 2 also logged heavy `phaseMs.comments` (~435–438 s) and `push` / `syncFiles` (~230 s each). `batch/check` = 2 on both quiet runs.

### TP-IDLE-ZERO check

| Expectation | Quiet 1 | Quiet 2 |
|-------------|---------|---------|
| `getTaskById` = 0 | **68** | **68** |
| `getTaskComments` = 0 (when counts match / no twins) | **1757** | **1757** |
| No vault writes on quiet | 0 (met) | 0 (met) |

## Conclusion

**TP-IDLE-ZERO = fail** on **2.0.81** pilot quiet sync ×2. Slice 1 unit gate (matched-count skip in `vaultLineBehindTask`) is not enough for live idle: quiet runs still issue thousands of comment GETs and dozens of `getTaskById`. Next #62 slice should find remaining call sites (e.g. persist/reconcile paths that still GET comments) and/or Dexie `commentCount` unknown → forced probe, then re-measure.

## Checklist (from #62)

- [x] Capture a current `[perf]` baseline on tip (manual Synchronize + counts) — this file
- [ ] Run delta pilot `TP-DELTA-*` (§3.5)
- [x] Pilot-verify `TP-IDLE-ZERO` on tip — **fail** (not pass)
- [ ] Cut remaining per-task probes / full-vault scans (slice 1 only covered matched-count in coordinator)
- [ ] Soften or defer **TECH-START-1** full pull on plugin start
- [ ] Implement remaining §3.2 items only after §3.5 evidence
- [x] Update `TEST_PLAN.md` + `CHANGELOG.md` in the same PR as this evidence
