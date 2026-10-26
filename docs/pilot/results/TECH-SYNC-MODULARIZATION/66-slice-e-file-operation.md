# #66 slice E — fileOperation persist + sort

## Meta

- Issue: [#66](https://github.com/semyon-alekseev-noveo/tt-sync/issues/66)
- PR: #154
- Date: 2026-10-26
- Kind: extract-only

## Evidence

- `src/sync/vault-pull/persistTasksToFile.ts` — `persistToFile` / `recordVaultSync`
- `src/sync/vault-pull/taskSort.ts` — tree sort helpers
- `fileOperation.ts` under 30 KB
- Unit: `updatePathWritesMissingTasks`, `staleFileWrite`, `synchronizationInner.integration`

## Conclusion

Two size exceptions remain: `main.ts`, `api/index.ts`.

## Checklist

- [x] Extract + wire
- [x] Drop exception
- [x] Related tests green
