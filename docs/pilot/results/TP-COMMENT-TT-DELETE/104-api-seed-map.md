# #104 — API-seed key match must store the TickTick comment id

## Meta

| Field | Value |
|-------|--------|
| Date (UTC) | 2026-10-24 |
| Build | Branch off `abyss-mapping` at **2.0.88** (`2a78ea3`). No version bump. |
| Issue | [#104](https://github.com/semyon-alekseev-noveo/tt-sync/issues/104) stays **open** |
| Case | **TP-COMMENT-TT-DELETE** |
| Status | **pass (unit)** / live re-prove **not run** |

## Inputs

- Live fail: [104-live-2.0.88-box.md](104-live-2.0.88-box.md)
- F1/F1b already shipped in **2.0.88** ([104-analyst-f1-merge-hint.md](104-analyst-f1-merge-hint.md)). Not the residual.

## Evidence

Root cause in `syncAbyssCommentsToTickTick`: `planCommentSync` links a vault bullet and a TickTick comment by normalized key even when Dexie has no `taskCommentMap`. The linked loop returned on key equality without `upsertCommentMap`. After API DELETE the bullet was `vaultOnly` (no id) and the sweep called `addTaskComment`. Vault-first prove×2 created the map on POST, so it never took this path.

Empty `syncedLists` is a separate precondition, confirmed by the box log (`commentsByPhase.push` only, `vaultWrites: 0`). `allowVaultUpdate` skips `behindComments`, so the bullet is not stripped. The comment sweep still runs (`allowedListIds` size 0 does not filter). Strip requires the task's list in `syncedLists` and a comment probe (`commentCount` mismatch or unknown). That precondition does not by itself re-POST once the id is stored.

Unit (red before the upsert, green after):

- `TP-COMMENT-TT-DELETE #104: API-seed key-match without taskCommentMap upserts the TickTick id and does not POST`
- `TP-COMMENT-TT-DELETE #104: after that link, TT delete does not re-POST the vault bullet`
- `synchronizationInner` — same fixture: first sync stores `432b67b3…` and does not POST; with that map, `commentCount: 0`, empty GET, and `syncedLists` containing the project, the bullet is removed and `addTaskComment` is not called.

## Conclusion

The code fix is map bookkeeping on the equal-key link (`origin: 'remote'`, no `changed` flag). Live re-prove is **not run**. #104 stays open until the owner records two passes: vault-first and API-seed, each with the task's list in `syncedLists`.

## Checklist

- [x] Failing unit test, then fix
- [x] Delete does not `addTaskComment` when the link was stored
- [x] Bullet removed in the integration fixture when the list is in scope
- [x] `TEST_PLAN` records the 2.0.88 fail and the re-prove steps
- [ ] Live re-prove (vault-first + API-seed) — **not run**
- [ ] Close #104 — owner, after those passes
