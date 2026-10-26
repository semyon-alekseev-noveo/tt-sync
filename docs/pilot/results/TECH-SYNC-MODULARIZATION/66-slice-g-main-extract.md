# #66 slice G — main.ts under 30 KB

## Meta

- Gate: TECH-SYNC-MODULARIZATION / [#66](https://github.com/semyon-alekseev-noveo/tt-sync/issues/66)
- Date: 2026-10-26
- Scope: extract-only (settings migrate / Obsidian Sync wait / palette commands; dead dumpDB + ribbon stubs removed)

## Inputs

- Post-merge #155; sole size exception was `src/main.ts`

## Evidence

- `src/sync/waitForObsidianSync.ts`
- `src/settingsDataMigrate.ts`, `src/settingsVaultMigrate.ts`
- `src/pluginCommands.ts`
- `docs/file-size.exceptions.json` — **empty** (0 exceptions)
- `npm run check:sizes` OK; vitest 738; build OK

## Conclusion

#31 / #66 file-size DoD met for listed god-files (split or previously extracted). Import-cycle CI already landed in slice A. TECH-API-1 live playbook remains a standing risk in `PO_STATUS.md`, not a size/cycle gate.

## Checklist

- [x] `npm run check:sizes` (0 exceptions)
- [x] `npm run check:cycles`
- [x] `npx vitest run` + `npm run build`
- [ ] Pilot load / settings migrate / Synchronize — **not run**
