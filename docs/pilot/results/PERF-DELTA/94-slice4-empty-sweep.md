# Slice 4 — empty-thread skip + deferCommentSweep (#94)

## Meta

| Field | Value |
|-------|--------|
| Gate | `PERF-DELTA` |
| GitHub | [#94](https://github.com/semyon-alekseev-noveo/tt-sync/issues/94) (parent [#62](https://github.com/semyon-alekseev-noveo/tt-sync/issues/62)) |
| Case | `TP-IDLE-EMPTY-SWEEP` |
| Recorded | 2026-10-23 ~07:05 UTC (agent) |
| Status | **unit locked** — live re-pilot is [#85](https://github.com/semyon-alekseev-noveo/tt-sync/issues/85) after release (do not invent pass) |

## Inputs

- Live baseline on **2.0.83**: [83-idle-zero-2.0.83.md](83-idle-zero-2.0.83.md) — quiet `getTaskComments` **871** (one vault pass vs **1741** on 2.0.82).
- Analyst: [62-analyst-dual-brief.md](62-analyst-dual-brief.md) — residual GETs include empty-comment tasks.
- Slice 3 unit: [83-slice3-manual-scope.md](83-slice3-manual-scope.md).

## Evidence (unit)

### Policy

1. `canSkipAbyssCommentNetwork`: empty Abyss threads + empty Dexie maps → skip GET (even when `commentCount` unknown).
2. Full-file `checkFileForModifications` sets `deferCommentSweep` on line checks so hash-unchanged does not call `syncAbyssCommentsToTickTick`; `sweepAbyssCommentsInFile` still owns **BUG-COMMENT-NO-PUSH**.
3. Single-line / inline parent walks (no following file sweep) still sync comments on hash-unchanged.

### Tests

- `abyssCommentSync.test.ts` — `TP-IDLE-EMPTY-SWEEP` empty skip + sync no GET.
- `taskModificationCommentSmoke.test.ts` — `deferCommentSweep` skips hash-unchanged comment sync on `checkLineForModifications`.
- `bugCommentInline` / `bugCommentNoPush` suites remain green under full vitest.

## Conclusion

Unit gate for slice 4 is green. Expected live effect after release: quiet comment GETs drop well below **871** (tasks without Abyss bullets stop probing). Residual matched-count / unknown-count cases remain for #85. No version bump in this PR.

## Checklist

- [x] Case `TP-IDLE-EMPTY-SWEEP` in `ABYSS_FIRST_CASES.md` + `TEST_PLAN.md`
- [x] Failing then passing vitest named by ID
- [x] Full `npx vitest run` green (712)
- [ ] Live `[perf]` re-measure (#85) — **not run** in this PR
- [ ] Close #94 after merge (owner); leave #85/#62 open until re-pilot
