# Slice 2 — commentCount backfill + idle-fast sync / preparePersist

## Meta

| Field | Value |
|-------|--------|
| Gate | `PERF-DELTA` |
| GitHub | [#82](https://github.com/semyon-alekseev-noveo/tt-sync/issues/82) (parent [#62](https://github.com/semyon-alekseev-noveo/tt-sync/issues/62)) |
| Case | `TP-IDLE-ZERO-SWEEP` |
| Recorded | 2026-10-23 UTC (agent) |
| Build | tip of `feat/62-perf-delta-slice2` (no version bump) |
| Status | **open** — unit locked; live re-pilot **not run** (#85) |

## Inputs

- Dual brief: [62-analyst-dual-brief.md](62-analyst-dual-brief.md)
- Live fail: [81-idle-zero-2.0.81.md](81-idle-zero-2.0.81.md)
- Canonical: `docs/TICKTICK_DELTA_API.md` §3.2; `TEST_PLAN.md` TP-IDLE-ZERO / TP-IDLE-ZERO-SWEEP

## Evidence

### Code

1. `pull.ts` — on etag echo-skip, backfill missing Dexie `commentCount` from delta `update[]` (does not count as applied content change).
2. `canSkipAbyssCommentNetwork` + early return in `syncAbyssCommentsToTickTick` when count matches, maps biject, no wipe/dup keys.
3. `preparePersistNetwork` — same predicate skips `getTaskComments` (and idle sync); merge keeps vault bullets without `_apiComments`.
4. Call sites pass `remoteCommentCount` from Dexie/`savedTask` where available.
5. Double-sweep **not** removed (slice 3 / #83).

### Automated

- `abyssCommentSync.test.ts` — `TP-IDLE-ZERO-SWEEP` canSkip + sync skip GET
- `pull_field_mapping.test.ts` — echo-skip commentCount backfill
- `preparePersistNetworkIdle.test.ts` — preparePersist skip / unknown still GET

Live `[perf]` on `<pilot-vault>`: **not run** this session.

## Conclusion

Slice 2 locks the highest-leverage safe cut in vitest. Do not mark `TP-IDLE-ZERO` pass until #85 re-measures after merge/release. Remaining quiet cost likely includes double-sweep (#83).

## Checklist

- [x] Dual-analyst brief published
- [x] Unit tests for `TP-IDLE-ZERO-SWEEP`
- [ ] Live re-pilot after release (#85)
- [ ] Slice 3 double-sweep (#83)
