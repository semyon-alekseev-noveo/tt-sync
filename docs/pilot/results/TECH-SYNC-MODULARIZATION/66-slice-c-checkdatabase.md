# #66 slice C — checkDatabase extract + size CI

## Meta

- Issue: [#66](https://github.com/semyon-alekseev-noveo/tt-sync/issues/66)
- PR: stacks on A+B (#154)
- Date: 2026-10-26
- Kind: extract-only + DoD CI

## Evidence

- `src/services/checkDatabase.ts` — `runCheckDatabase(host)`
- `TickTickService.checkDataBase` thin wrapper; `registerNewVaultFile` public for host
- `src/services/index.ts` under 30 KB
- `npm run check:sizes` + `docs/file-size.exceptions.json`
- Unit: `src/test/checkDatabase.extract.test.ts`

## Conclusion

#31 DoD file-size item largely met for the god-class; remaining exceptions are main / fileOperation / api / VaultSyncCoordinator.

## Checklist

- [x] checkDataBase extracted
- [x] services/index.ts ≤ 30 KB
- [x] CI size check (strict)
- [x] Docs / TEST_PLAN / CHANGELOG
