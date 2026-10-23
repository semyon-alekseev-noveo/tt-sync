# Slice 3 — stop double-sweep / TP-IDLE-MANUAL-SCOPE (#83)

## Meta

| Field | Value |
|-------|--------|
| Gate | `PERF-DELTA` |
| GitHub | [#83](https://github.com/semyon-alekseev-noveo/tt-sync/issues/83) (parent [#62](https://github.com/semyon-alekseev-noveo/tt-sync/issues/62)) |
| Case | `TP-IDLE-MANUAL-SCOPE` |
| Recorded | 2026-10-23 ~05:42 UTC (agent) |
| Status | **unit locked** — live re-pilot is [#85](https://github.com/semyon-alekseev-noveo/tt-sync/issues/85) after release (do not invent pass) |

## Inputs

- Live fail on **2.0.82**: [82-idle-zero-2.0.82.md](82-idle-zero-2.0.82.md) — quiet `getTaskComments` **1741** (~2× startup **871**).
- Analyst: [62-analyst-dual-brief.md](62-analyst-dual-brief.md) — double-sweep is slice 3; must stay **BUG-COMMENT-NO-PUSH**-safe.
- Slice 2 unit: [82-slice2-idle-fast.md](82-slice2-idle-fast.md).

## Evidence (unit)

### Policy

1. `pathsForPrePullPush` no longer expands to every registered path on `manualSync` — edited-since + active in-scope only.
2. `syncFiles` skips `checkFileForModifications` when `ctx.locallyEdited` already contains the path (pre-pull swept it).
3. **BUG-COMMENT-MANUAL-PRE-PULL** superseded; **BUG-COMMENT-NO-PUSH** / **BUG-COMMENT-ACTIVE-NOTE** retained for changed / active files.

### Tests

- `pushLocalPaths.test.ts` — `TP-IDLE-MANUAL-SCOPE` quiet empty set; edited+active still included.
- `TickTickService.test.ts` — `TP-IDLE-MANUAL-SCOPE` syncFiles skip already-swept.
- `bugCommentNoPush.test.ts` — still green.
- `synchronizationInner.integration.test.ts` — `TP-NO-SELF-REPUSH` no longer expects full-vault manual pre-pull.

## Conclusion

Unit gate for slice 3 is green. Expected live effect after release: quiet comment GETs drop from ~2× vault pass toward ~1× (startup order). Residual idle probes (unknown `commentCount`, etc.) remain for #85. No version bump in this PR.

## Checklist

- [x] Case `TP-IDLE-MANUAL-SCOPE` in `ABYSS_FIRST_CASES.md` + `TEST_PLAN.md`
- [x] Failing then passing vitest named by ID
- [x] BUG-COMMENT-NO-PUSH tests still pass
- [ ] Live `[perf]` re-measure (#85) — **not run** in this PR
- [ ] Close #83 after merge (owner); leave #85/#62 open until re-pilot
