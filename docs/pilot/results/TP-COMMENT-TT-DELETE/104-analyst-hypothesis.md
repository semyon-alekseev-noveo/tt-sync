# #104 residual — analyst + hypothesis tests

## Meta

| Field | Value |
|-------|--------|
| Date (UTC) | 2026-10-23 |
| Issue | [#104](https://github.com/semyon-alekseev-noveo/tt-sync/issues/104) |
| Cases | **TP-COMMENT-TT-DELETE** (extended), **BUG-COMMENT-DELETE-REPOST** |
| Live fail | `104-live-2.0.86.md` |

## Analyst brief (summary)

Reconcile correctly waits (`behindComments` / #108). Create path `syncAbyssCommentsToTickTick` still POSTs `plan.vaultOnly` for a single mapped miss on empty GET. Flush (`push-abyss-or-background`) and `preparePersistNetwork` share that create function. Merge may keep the bullet when Dexie `commentCount` is stale (`!== 0` guard).

Full ranked H1–H4: see agent analyst pass / `ABYSS_FIRST_CASES` **BUG-COMMENT-DELETE-REPOST**.

## Hypothesis tests (no production fix yet)

| ID | Test | Result |
|----|------|--------|
| **H1** | `BUG-COMMENT-DELETE-REPOST: syncAbyssCommentsToTickTick does not POST single mapped miss + empty GET` (`abyssCommentSync.test.ts`, `remoteCommentCount: 0` so network runs) | **fail (red)** — `addTaskComment` called once with plain title |
| **H2** | `TP-COMMENT-TT-DELETE: merge strips … stale commentCount` (`abyssStep3.test.ts`, `apiBodies: []`, `remoteCommentCount: 1`) | **fail (red)** — bullet `gone` kept |
| **H3** | strengthen `synchronizationInner` TT-DELETE `addTaskComment` not called | **not run** (existing TT-DELETE still green with `commentCount: 0`) |
| **H4** | flush/sweep harness | **not run** (deferred until H1–H2 green) |

Note: H1 with `remoteCommentCount: 1` **false-passes** via `canSkipAbyssCommentNetwork` (no GET, no POST) — that is idle skip, not delete-repost policy. Live re-POST needs a path that actually GETs (count 0 / mismatch / undefined).

## Developer (2026-10-23 16:13 UTC)

| ID | After fix |
|----|-----------|
| **H1** | **green** — skip POST when `mappedIdsGone <= 1` |
| **H2** | **green** — strip when `remoteCommentCount` is numeric (omit still = no-strip) |
| **H3** | **green** — integration asserts `addTaskComment` not called |
| **H4** | covered by H1 on shared create path; live re-pilot still needed |

## Next

Live re-pilot after release; do not invent pass.
