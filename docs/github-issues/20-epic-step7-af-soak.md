# GitHub issue — Epic

**Created:** [#20](https://github.com/semyon-alekseev-noveo/tt-sync/issues/20)

**Title:** `Epic: Step 7 AF-* pilot soak (ABYSS_FIRST_PLAN) — before live vault`

**Labels:** (optional) `documentation`

**Body:**

## Goal

Run **AF-1 … AF-8** on the pilot vault per `ABYSS_FIRST_PLAN.md` Step 7 and the combined live gate in `ABYSS_FIRST_CASES.md`. Live vault (Step 8) stays closed until this passes.

## Blocked by

1. [#14](https://github.com/semyon-alekseev-noveo/tt-sync/issues/14) **PILOT-GATE-TEST-11-12** pass (comment push gate)
2. Epic **PILOT-BATCH-EDITOR-SAFETY** (open-note / empty-side / deferred-id pilot verifies)

Do not invent AF pass rows. Evidence → `docs/pilot/results/STEP7-AF-PILOT-SOAK/` when started.

## Checklist (create child issues only when unblocked)

- [ ] AF-1 Empty syncedLists → no pull
- [ ] AF-2 TT project parent → note under `10 Projects/`
- [ ] AF-3 New MOC → TT parent
- [ ] AF-4 Active Zone checkbox → TT subtask
- [ ] AF-5 Random note + `#type/next` → list; line stays put
- [ ] AF-6 Complete ↔ complete
- [ ] AF-7 TT list move → tag on same line
- [ ] AF-8 Outside syncScopeFolders → no push
- [ ] Combined gate row in `ABYSS_FIRST_CASES.md` results log

## Definition of done

- [ ] AF-1–AF-8 recorded pass on pilot with build version
- [ ] `PO_STATUS.md` / `ABYSS_FIRST_PLAN.md` Step 7 status updated
- [ ] Step 8 (live) still explicitly **not run** until PO signs off
