# 53 — BUG-CREATE-MATCH-UNDEF live re-prove (create Notice)

| Field | Value |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Case | `BUG-CREATE-MATCH-UNDEF` / issue [#291](https://github.com/semyon-alekseev-noveo/tt-sync/issues/291) |
| Status | **live pass ×2** (2026-11-17, 2.0.98) |
| Plugin | tickticksync-abyss **2.0.98** (release asset) |
| Vault | Thinkpad-tts-test (pilot only) |
| Runner | agent — `obsidian-cli` + `obsidian-cli eval` |

## Method

Unmarked in-scope line whose title contains backticks / regex-special characters → manual **Synchronize** → watch the Notices. The pilot has `syncEnabled=false`, so the manual path (`checkFileForNewTasks` → `addNewTask`) was used — the same outer catch that produced the 2026-11-05 dual toast.

## Results

| Prove | Title | Notices observed | Marker |
|-------|-------|------------------|--------|
| A | ``PROVE-291 `tcp-services` `3000` map`` | `New TickTick task created: … (ID: 6afd2dc9…)` + `Sync completed.` — **no** `Failed to add … 'match'` | written |
| B | ``PROVE-291B `cpu.load` (5m) $5 [x] /tmp`` | `New TickTick task created: … (ID: 6afd2e01…)` + `Sync completed.` — **no** failure | written |

At most one create Notice; never both «created» and «Failed to add …». Fix #293 is in 2.0.98.

## Cleanup

Probe notes deleted; both probe TickTick tasks deleted; vault scan has no `PROVE-291`.
