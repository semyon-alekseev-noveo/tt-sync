# 234 — Notebook / protected ids safe across restore+rebind

| Field | Value |
|-------|--------|
| Issue | [#234](https://github.com/semyon-alekseev-noveo/tt-sync/issues/234) |
| Epic | [#214](https://github.com/semyon-alekseev-noveo/tt-sync/issues/214) / E17 |
| Status | **unit pass**; live **not run** |
| Holds | `BUG-NOTEBOOK-NO-DELETE` (#160) |

## AF

| AF ID | Unit | Live |
|-------|------|------|
| `ID-NOTEBOOK-RESTORE-SAFE` | **pass** | **not run** |

## Behavior

- `planVaultTaskDeletions` skips `isNotebook` — Notebook never enters vault→TT / rematch delete set.
- `prepareDeletionGuard` sets `isNotebook` from `isNotebookTask` (kind NOTE).
- `rebindVaultFromPlanned` skips kind NOTE even if wrongly planned.
- Existing `deleteTasksByIds` notebook block unchanged / not weakened.

## Checklist

- [x] Unit (`idNotebookRestoreSafe.test.ts` + `bugNotebookNoDelete.test.ts`)
- [x] AF / TEST_PLAN
- [ ] Live tip with Notebook fixture (optional)
- [x] Comment #234
