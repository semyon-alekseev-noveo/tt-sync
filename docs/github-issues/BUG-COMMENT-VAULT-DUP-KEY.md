# GitHub issue — Bug (analyst)

**Created:** [#27](https://github.com/semyon-alekseev-noveo/tt-sync/issues/27)

**Title:** `BUG-COMMENT-VAULT-DUP-KEY: Pull/merge leaves wall-clock + ISO stamp twin bullets in vault`

**Labels:** (optional) `bug`

**Body:**

## Problem

**P0 / open** after **BUG-COMMENT-DUP-STAMP** (**2.0.76** / [#25](https://github.com/semyon-alekseev-noveo/tt-sync/issues/25)). TT Comments are deduped, but the vault under `task-11-16` still has **wall-clock + ISO** Abyss comment bullets for the same `normalizedCommentKey` (8 lines / 4 keys). Synchronize stays on `local-edit`.

Case: `ABYSS_FIRST_CASES.md` → **BUG-COMMENT-VAULT-DUP-KEY**.

## Repro

1. Pilot note `00 Inbox/2026-10-19.md` / `task-11-16`.
2. Count Abyss comment children — twins differ only by stamp style.
3. **Synchronize** → write-trace `local-edit` / `hasChanged`.

## Expected

One vault bullet per normalized key after pull/merge.

## DEV_FLOW

1. Case in `ABYSS_FIRST_CASES.md`.
2. Failing test named `BUG-COMMENT-VAULT-DUP-KEY`.
3. Minimal fix; gate tests; `TEST_PLAN.md` + `CHANGELOG.md` in PR → `abyss-mapping`.

## Links

- Issue: [#27](https://github.com/semyon-alekseev-noveo/tt-sync/issues/27)
- Found during: [#16](https://github.com/semyon-alekseev-noveo/tt-sync/issues/16)
- Related: [#25](https://github.com/semyon-alekseev-noveo/tt-sync/issues/25), **BUG-COMMENT-PULL-DOUBLE-STAMP**

## Done when

Failing test → fix → green gate; vault shows one bullet per key (else **not run**).
