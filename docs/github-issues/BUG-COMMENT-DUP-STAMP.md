# GitHub issue — Bug (analyst)

**Created:** [#25](https://github.com/semyon-alekseev-noveo/tt-sync/issues/25)

**Title:** `BUG-COMMENT-DUP-STAMP: Abyss push creates stamped+plain TickTick comment pairs`

**Labels:** (optional) `bug`

**Body:**

## Problem

**P0 / open** after **BUG-COMMENT-ABYSS-VIEW** (**2.0.75** / [#23](https://github.com/semyon-alekseev-noveo/tt-sync/issues/23)). Abyss-view comment push lands Comments, but TickTick shows **pairs**: vault-stamped title (`YYYY-MM-DD HH:MM: text`) and plain `text` for the same thread. Pilot task **`task-11-16`**: COMMENTS count 8 for four vault bullets.

Case: `ABYSS_FIRST_CASES.md` → **BUG-COMMENT-DUP-STAMP**.

Hypothesis: `normalizedCommentKey` should equate stamped vs plain, but push still POSTs twice (race / vaultOnly twice) or POST keeps the vault stamp while a second path posts plain.

## Repro

1. Stay in Abyss Tasks view; add child comments under `task-11-16`.
2. Wait for 5s open-note push (`vault.modify`).
3. TickTick Comments: stamped+plain pairs for each key.

## Expected

One TT comment per vault thread by normalized key.

## DEV_FLOW

1. Case already in `ABYSS_FIRST_CASES.md`.
2. Failing test named `BUG-COMMENT-DUP-STAMP`.
3. Minimal fix; `npx vitest run` + `npm run build`.
4. `TEST_PLAN.md` + `CHANGELOG.md` in same PR into `abyss-mapping`.
5. Pilot verify; evidence under `docs/pilot/results/BUG-COMMENT-DUP-STAMP/` when created.

## Links

- Issue: [#25](https://github.com/semyon-alekseev-noveo/tt-sync/issues/25)
- Related: [#23](https://github.com/semyon-alekseev-noveo/tt-sync/issues/23), **BUG-COMMENT-KEY-EQUIV**, **BUG-COMMENT-PULL-DOUBLE-STAMP**
- Push evidence (not dup): `docs/pilot/results/BUG-COMMENT-ABYSS-VIEW/`

## Out of scope

- Re-opening Abyss scheduling (#23)
- Release / tag

## Done when

Failing test → fix → green gate; pilot shows one TT comment per vault thread (else **not run**).
