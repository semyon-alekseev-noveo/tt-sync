# Slice 1 — Idle comment probe cut (code baseline)

## Meta

| Field | Value |
|-------|--------|
| Gate | `PERF-DELTA` |
| GitHub | [tt-sync #62](https://github.com/semyon-alekseev-noveo/tt-sync/issues/62) |
| Recorded | 2026-10-23 UTC (agent) |
| Build | tip of `feat/62-perf-delta-slice1` (no version bump) |
| Status | **open** — behavior locked in vitest; live vault **not run** |

## Inputs

- Issue checklist item 1 (measure) + item 4 (cut remaining probes).
- Canonical: `docs/TICKTICK_DELTA_API.md` §3.2 idle / comments; `TEST_PLAN.md` `TP-IDLE-ZERO`.
- Soft dependency: avoid thrashing pilot while editor-safety (#15) verifies — short code cut OK.

## Evidence

### Code hotspot (tip before this slice)

In `VaultSyncCoordinator.vaultLineBehindTask`, `shouldProbeComments` included `vaultThreads > 0`. That forced `getTaskComments` on **every** quiet task that already had Abyss comment bullets, even when Dexie `commentCount` matched the vault thread count. That matches the historical pilot band (~229 comment fetches on large vaults) better than remaining `getTaskById` (already idle-zero since **2.0.53**).

`vaultThreads > 0` was present since vault-ahead work (~2.0.59); **2.0.80** only added `vaultDupKeys`. Documented idle rule already said “fetch only when `commentCount` differs.”

### Change

Probe when:

- `commentCount` is a number and ≠ vault thread count, or
- count unknown and vault has threads, or
- stamp twins (`vaultDupKeys`).

Do **not** probe merely because vault threads exist.

### Automated

- `vaultCommentBehind.test.ts` — `TP-IDLE-ZERO does not getTaskComments when vault threads already match commentCount`
- `synchronizationInner.integration.test.ts` — same ID, full quiet sync with two matched comment bullets

Live `[perf]` JSON / wall-time on `<pilot-vault>`: **not run** this session.

## Conclusion

First measurable code win for #62 without inventing pilot pass rows. Next: capture `[perf]` on tip after merge, then TECH-START-1 / register scan / §3.5 delta pilot.

## Checklist (from #62)

- [ ] Capture a current `[perf]` baseline on tip (manual Synchronize + notice counts)
- [ ] Run delta pilot `TP-DELTA-*` (§3.5)
- [ ] Pilot-verify `TP-IDLE-ZERO` on tip (unit already exists; slice 1 strengthens matched-count)
- [x] Cut remaining per-task comment probes on idle when counts match (**this slice**)
- [ ] Soften or defer **TECH-START-1** full pull on plugin start
- [ ] Implement remaining §3.2 items only after §3.5 evidence
- [x] Update `TEST_PLAN.md` + `CHANGELOG.md` in the same PR as behavior change
