# Slice 5 — cut quiet getTaskById / TP-IDLE-BYID-ZERO (#98)

## Meta

| Field | Value |
|-------|--------|
| Gate | `PERF-DELTA` |
| GitHub | [#98](https://github.com/semyon-alekseev-noveo/tt-sync/issues/98) (parent [#62](https://github.com/semyon-alekseev-noveo/tt-sync/issues/62)) |
| Case | `TP-IDLE-BYID-ZERO` |
| Recorded | 2026-10-23 ~08:17 UTC (agent) |
| Status | **unit locked** — live re-pilot is [#85](https://github.com/semyon-alekseev-noveo/tt-sync/issues/85) after release (do not invent pass) |

## Inputs

- Live baseline **2.0.84**: quiet `getTaskById` **44** / comments **0** (`84-idle-zero-2.0.84.md` when on tip).
- Trace: 20× `ProjectScheme.run` GET + 24× `applyModifications` list-move after false `parentChanged` (empty vault parent vs Dexie scheme parent).

## Evidence (unit)

### Policy

1. `ProjectScheme.run` uses `updated`/Dexie parents; `getTaskById` only when parent id missing from that batch.
2. `vaultParentMeaningfullyChanged` — empty vault parent + scheme parent for file ≠ real parent edit.
3. List-move GET only when line `projectId` ≠ Dexie `projectId`.

### Tests

- `tpIdleByIdZero.test.ts` — `TP-IDLE-BYID-ZERO`.

## Conclusion

Unit gate for slice 5 is green. Expected live effect after release: quiet `getTaskById` → **0** (or near-zero). No version bump in this PR.

## Checklist

- [x] Case `TP-IDLE-BYID-ZERO` in `ABYSS_FIRST_CASES.md` + `TEST_PLAN.md`
- [x] Vitest named by ID
- [ ] Live `[perf]` re-measure (#85) — **not run** in this PR
- [ ] Close #98 after merge (owner); leave #85/#62 open until re-pilot
