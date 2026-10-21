# Comment sync model (vault Abyss ↔ TickTick Comments API)

**Status:** Wired — `apiCommentsDifferFromVault`, `syncAbyssCommentsToTickTick`, and `mergeAbyssBlock` deletion hints use `normalizedCommentKey` / `planCommentSync`.

**Related:** `ABYSS_NOTES_ALIGNMENT.md`, `docs/SYNC_MODULARIZATION.md` (future `sync/comments` module owner).

## Wire formats

| Side | Storage | Example |
|------|---------|---------|
| Vault | `- {stamp?}: text` under task | `- 2026-10-21T11:14:22+07:00: hello` |
| TickTick | `ITaskComment.title` | `hello` or full stamped line from an earlier push |
| Pull display | `formatApiCommentAsAbyssLines` | may add `YYYY-MM-DD HH:mm` from `createdTime` |

Stamps are **display metadata**; they must not be the only match key.

## Matching layers

1. **Stable:** `taskCommentMaps.ticktickCommentId` ↔ `ITaskComment.id`
2. **Content:** `normalizedCommentKey(text)` = `commentFingerprint(commentBodyWithoutStamp(text))`
3. **Aliases:** full-line fingerprint + plain key (`aliasKeysForBody`, `commentFingerprintsForThread`)

## API

- `normalizedCommentKey`, `planCommentSync`, `commentSetsEquivalentByNormalizedKey` — `src/sync/comments/`
- Target: `syncAbyssCommentsToTickTick`, `apiCommentsDifferFromVault`, and `mergeAbyssBlock` deletion hints call into this module only.

## PR sequence

1. **This PR:** types, keys, match plan, unit tests + `it.fails` for legacy `apiCommentsDifferFromVault`.
2. **Next:** wire `apiCommentsDifferFromVault` + push delete rules to `planCommentSync`.
3. **Then:** canonical push `title` policy (plain vs stamped) and pull stamp stability.
