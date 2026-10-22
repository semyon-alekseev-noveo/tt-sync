# Comment sync model (vault Abyss ↔ TickTick Comments API)

**Status:** Wired — `apiCommentsDifferFromVault`, `syncAbyssCommentsToTickTick`, and `mergeAbyssBlock` deletion hints use `normalizedCommentKey` / `planCommentSync`.

**Related:** `ABYSS_NOTES_ALIGNMENT.md`, `docs/SYNC_MODULARIZATION.md` (`sync/comments` owns keys/plan; push still via `vault-push` / TMD; orchestrator phases in `src/sync/phases/*`).

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
- **Create (v2 POST):** body must match the TickTick web client (`id`, `taskId`, `projectId`, `createdTime`, `title`, …). Title-only payloads return HTTP 500 (`BUG-COMMENT-API-POST-500`, **2.0.74**). Empty 200 body still succeeds using the client-generated id.

## When vault comments are pushed (triggers)

Matching and POST body are useless if nothing schedules a push. See also `docs/ANALYST_REFERENCE_DIAGRAMS.md` §2b.

| Path | Entry | Notes |
|------|--------|--------|
| Full **Synchronize** | `TaskModificationDetector.checkFileForModifications` → `syncAllAbyssCommentsInFile` | Always sweeps in-scope notes on manual/idle sync (with pre-pull push rules). |
| Markdown typing | `workspace.on('editor-change')` → 5s debounce → `pushSettledActiveFile` | Caret path often uses `identifiedOnly: true`. |
| **Abyss Tasks view** | `vault.on('modify')` → `shouldNotifyPushOnVaultModify` → same 5s debounce | No `editor-change`. Flush must not require `getActiveFile() === path`; Abyss/background uses `identifiedOnly: false` (**BUG-COMMENT-ABYSS-VIEW**, **2.0.75**). |

Abyss view write ≠ editor-change. If only the editor path is wired, Comments stay empty until Synchronize.

## PR sequence

1. **This PR:** types, keys, match plan, unit tests + `it.fails` for legacy `apiCommentsDifferFromVault`.
2. **Next:** wire `apiCommentsDifferFromVault` + push delete rules to `planCommentSync`.
3. **Then:** canonical push `title` policy (plain vs stamped) and pull stamp stability.
