# GitHub issue — Phase 1

**Title:** `PILOT-GATE-TEST-11-12 Phase 1: Identify active push path (A/B/C)`

**Parent:** Epic PILOT-GATE-TEST-11-12  
**Blocked by:** Phase 0 closed

**Read first:** `docs/pilot/results/PILOT-GATE-TEST-11-12/10-phase-0-baseline.md`  
**Published result:** `docs/pilot/results/PILOT-GATE-TEST-11-12/11-phase-1-hypothesis.md`

**Body:**

From Phase 0 logs, decide which path should call `addTaskComment` for `6ad83bc…`:

| Path | Description |
|------|-------------|
| A | Pre-pull sweep (`pushLocalEditsFirst` / `sweepAbyssCommentsInFile`) |
| B | Reconcile (`vaultLineBehindTask` / `vault-comments-ahead`) |
| C | Pull write (`preparePersistNetwork`) |

## Checklist

- [ ] Confirmed `2026-10-21.md` in plugin file metadata (registered path)
- [ ] Marked which path(s) actually ran in the captured sync
- [ ] If **none** ran → root cause documented (scope, registration, `useAbyssCommentsApi`, project id)
- [ ] If path ran but `addTaskComment` = 0 → documented gate (`vaultHasUnpushed`, empty `taskLines`, `commentsNeedSync` false)
- [ ] If `addTaskComment` > 0 but TT empty → documented API parse / wrong task
- [ ] Linked **one** primary `BUG-*` case ID for Phase 2

## Outcome

- [ ] Comment on issue with hypothesis (1 paragraph) before any code change
