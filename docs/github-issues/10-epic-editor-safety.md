# GitHub issue — Epic

**Created:** [#15](https://github.com/semyon-alekseev-noveo/tt-sync/issues/15)

**Title:** `Epic: PILOT-BATCH-EDITOR-SAFETY — verify shipped open-note / empty-side / deferred-id guards`

**Labels:** (optional) `bug`, `documentation`

**Body:**

## Goal

On the **pilot vault only**, run and record pilot results for P0 fixes that already landed in code but are still **not run** in `TEST_PLAN.md` / `PO_STATUS.md`:

- **BUG-OPEN-NOTE-BUFFER** / **BUG-STALE-EDITOR-WRITE** / **BUG-EMPTY-EDITOR-DISK** (editor vs disk)
- **EMPTY-SIDE-GUARD** (no mass wipe on empty side)
- **BUG-DEFERRED-ID-PHASE2-DELETE** (no false delete while marker deferred)

This epic does **not** re-open comment push for `test-11-12` — that stays under [#14](https://github.com/semyon-alekseev-noveo/tt-sync/issues/14).

## Why next

`PO_STATUS.md` To Be Done #1: live vault stays blocked until these pilot verifies exist. Fixes are on branch; evidence is missing.

## Process

- Case IDs and expected behavior: `ABYSS_FIRST_CASES.md`, `TEST_PLAN.md`
- Canonical evidence: `docs/pilot/results/PILOT-BATCH-EDITOR-SAFETY/` (create `INDEX.md` + one file per checklist issue when starting)
- Issues are trackers; do not paste long logs into comments — link the result file

## Sub-issues

- [ ] Verify: open-note / editor buffer cluster
- [ ] Verify: EMPTY-SIDE-GUARD
- [ ] Verify: BUG-DEFERRED-ID-PHASE2-DELETE

## Soft dependency

Prefer not to run a large editor/deletion pilot session while [#14](https://github.com/semyon-alekseev-noveo/tt-sync/issues/14) still needs exclusive focus on `test-11-12`. EMPTY-SIDE-GUARD may run in a short dedicated session if #14 is waiting on deploy.

## Definition of done

- [ ] Each sub-issue has a result file under `docs/pilot/results/PILOT-BATCH-EDITOR-SAFETY/`
- [ ] `TEST_PLAN.md` pilot status updated for the exercised rows
- [ ] `ABYSS_FIRST_CASES.md` / `PO_STATUS.md` reflect pass/fail (no invented pass)
- [ ] No open sub-issue for this epic
