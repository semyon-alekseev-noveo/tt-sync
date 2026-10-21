# Phase 0 — Fix (BUG-COMMENT-DUP-STAMP)

## Meta

| Field | Value |
|-------|--------|
| Case | `BUG-COMMENT-DUP-STAMP` |
| Issue | https://github.com/semyon-alekseev-noveo/tt-sync/issues/25 |
| Recorded | 2026-10-21 14:52 UTC (agent) |
| Build | **2.0.76** |
| Status | **code done** (unit); pilot verify separate |

## Inputs

- Issue #25 + screenshot (stamped+plain pairs on `task-11-16`)
- Prior gate: `docs/pilot/results/BUG-COMMENT-ABYSS-VIEW/` (push works; race dup noted)
- `docs/github-issues/BUG-COMMENT-DUP-STAMP.md`

## Evidence

### Root cause (code)

1. Linked content re-post called `addTaskComment(..., vaultBody)` with the Abyss stamp still in the title.
2. Race / twin remotes with the same `normalizedCommentKey` (stamped title + plain title) were never collapsed; `planCommentSync` links only one remote per vault thread and leaves the twin as `remoteOnly`.

### Fix

In `syncAbyssCommentsToTickTick`:

- Before planning: delete extras that share a normalized key (prefer plain title).
- vaultOnly: skip POST when the key is already on TickTick; map instead.
- All creates (including linked re-post) use `tickTickCommentTitle` (stamp stripped).

### Automated

`abyssCommentSync.test.ts` — three `BUG-COMMENT-DUP-STAMP` cases.  
`npx vitest run` → **685 passed**.

## Conclusion

Unit-proven fix ships as **2.0.76**. Pilot must confirm `task-11-16` Comments collapse to one per vault thread after Synchronize.

## Checklist

- [x] Failing test named `BUG-COMMENT-DUP-STAMP`
- [x] Fix (strip + dedupe + skip-if-present)
- [x] `npx vitest run` + `npm run build` (build in verify / release step)
- [ ] Pilot re-verify; close #25 when Comments match vault threads
