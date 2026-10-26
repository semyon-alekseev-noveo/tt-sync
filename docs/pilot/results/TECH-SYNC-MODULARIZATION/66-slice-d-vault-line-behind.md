# #66 slice D — vaultLineBehind extract

## Meta

- Issue: [#66](https://github.com/semyon-alekseev-noveo/tt-sync/issues/66)
- PR: #154
- Date: 2026-10-26
- Kind: extract-only

## Evidence

- `src/sync/vault-pull/vaultLineBehind.ts` — `vaultLineBehindTask` + `attachCommentPullState`
- `VaultSyncCoordinator` calls extracted helper; file under 30 KB
- Unit: `src/test/vaultCommentBehind.test.ts` (updated to call module)

## Conclusion

One fewer size exception. Remaining: `main.ts`, `fileOperation.ts`, `api/index.ts`.

## Checklist

- [x] Extract + wire
- [x] Drop exception entry
- [x] vaultCommentBehind green
