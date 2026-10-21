# GitHub issue — Checklist

**Created:** [#17](https://github.com/semyon-alekseev-noveo/tt-sync/issues/17) · Parent [#15](https://github.com/semyon-alekseev-noveo/tt-sync/issues/15)

**Title:** `PILOT-BATCH-EDITOR-SAFETY: Verify EMPTY-SIDE-GUARD (mass / empty-side deletions)`

**Parent:** Epic PILOT-BATCH-EDITOR-SAFETY

**Body:**

## Scope

Pilot vault only. Case **EMPTY-SIDE-GUARD** / `TP-EMPTY-SIDE-GUARD` (+ smoke `TP-MASS-DELETE-THRESHOLD` if feasible).

Shipped in **2.0.54**; pilot still **not run**.

## Why P0

A bad empty-side sync can wipe tracked tasks or advance checkpoint incorrectly. Must be proven on pilot before live vault (Step 8).

## Steps

1. Confirm plugin version matches deployed build.
2. Follow `TEST_PLAN.md` → **TP-EMPTY-SIDE-GUARD** (and mass-delete threshold if safe on pilot fixtures).
3. Evidence → `docs/pilot/results/PILOT-BATCH-EDITOR-SAFETY/<issue#>-empty-side-guard.md`
4. Update `TEST_PLAN.md`; comment with link only.

## Safety

Do not use live vault. Prefer held-plan / confirm-modal paths; do not Apply mass deletions unless the case requires it and fixtures are disposable TTS-* tasks.

## Done when

Pilot status recorded (pass/fail/not run with reason); result file linked.
