# GitHub issue — Bug (code)

**Created:** [#19](https://github.com/semyon-alekseev-noveo/tt-sync/issues/19)

**Title:** `BUG-ACTIVEZONE-COMMENT-SHUFFLE: Active Zone sync must not move comments between sibling tasks`

**Labels:** (optional) `bug`

**Body:**

## Problem

**P1 / open** in `PO_STATUS.md`. On sync in a project note (Active Zone), sibling tasks reorder and a comment bullet can move from one task to another.

Case: `ABYSS_FIRST_CASES.md` → **BUG-ACTIVEZONE-COMMENT-SHUFFLE**.

Suspected area: `pullSubtaskOrder` / `mergeAbyssBlock` (see PO To Be Done #4).

## Why next (alongside comment gate)

Independent of `test-11-12` Comments API path when scoped to Active Zone ordering. Soft-blocked: avoid overlapping large comment-gate PRs; start after [#14](https://github.com/semyon-alekseev-noveo/tt-sync/issues/14) Phase 2 lands or on a separate branch.

## DEV_FLOW

1. Confirm expected behavior in `ABYSS_FIRST_CASES.md` (already listed).
2. Add **failing** test named `BUG-ACTIVEZONE-COMMENT-SHUFFLE`.
3. Minimal fix; `npx vitest run` + `npm run build`.
4. Update `TEST_PLAN.md` + `CHANGELOG.md` in the same PR into `abyss-mapping`.
5. Pilot verify on a project MOC Active Zone note (pilot vault); evidence under `docs/pilot/results/` if a gate folder is created.

## Out of scope

- GAP-COMMENT-EDIT (delete+add on edit)
- PILOT-GATE-TEST-11-12 exclusive task

## Done when

Failing test → fix → green gate; pilot row recorded when run (else **not run**).
