# Pilot batch: editor / empty-side / deferred-id (shipped, not run)

**Status:** open (2026-10-21)  
**Epic:** [tt-sync #15](https://github.com/semyon-alekseev-noveo/tt-sync/issues/15)  
**Soft-blocked by:** comment gate [#14](https://github.com/semyon-alekseev-noveo/tt-sync/issues/14) (prefer exclusive focus on `test-11-12` until Phase 2–3)

## Scope

Pilot vault only. Verify fixes already in code:

| Checklist | Issue | Cases |
|-----------|-------|--------|
| Open-note / editor buffer | [#16](https://github.com/semyon-alekseev-noveo/tt-sync/issues/16) | TP-NO-CARET-REWRITE, TP-ACTIVE-PUSH-DURING-SYNC, TP-NO-STALE-VIEW-READ, TP-EMPTY-EDITOR-DISK, … |
| EMPTY-SIDE-GUARD | [#17](https://github.com/semyon-alekseev-noveo/tt-sync/issues/17) | TP-EMPTY-SIDE-GUARD (+ mass-delete smoke) |
| Deferred id Phase 2 | [#18](https://github.com/semyon-alekseev-noveo/tt-sync/issues/18) | BUG-DEFERRED-ID-PHASE2-DELETE |

## Evidence

When starting: create `docs/pilot/results/PILOT-BATCH-EDITOR-SAFETY/INDEX.md` and one result file per issue. Do not mark pass without that evidence.

## Out of scope

- `PILOT-GATE-TEST-11-12` / NOTE-L3b / `test-11-12` (epic #14)
- Step 7 AF-* ([#20](https://github.com/semyon-alekseev-noveo/tt-sync/issues/20)) until #14 + this batch
