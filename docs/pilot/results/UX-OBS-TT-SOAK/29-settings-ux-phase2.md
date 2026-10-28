# 29 — Settings UX Phase 2 (hide redundancy in Abyss mode)

| Field | Value |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Phase | 29 (implement / unit) |
| Issue | [#192](https://github.com/semyon-alekseev-noveo/tt-sync/issues/192) — Settings UX Phase 2 |
| Epic | [#189](https://github.com/semyon-alekseev-noveo/tt-sync/issues/189) |
| Depends on | Phase 1 [#191](https://github.com/semyon-alekseev-noveo/tt-sync/issues/191) / PR #196 merged |
| Status | **unit pass**; pilot Settings UI **not run** |

## Inputs

- Plan: `27-settings-ux-redesign-plan.md` Phase 2
- Phase 1: `28-settings-ux-phase1.md`
- Cases: `UX-SET-HIDE-DEFAULTS`, `UX-SET-EXTRA-FILTERS`, `UX-SET-STATUS-VS-STAGE` (+ hub / strip-on-reset / Keep TickTick folders in #192 scope)

## Evidence

### What landed (visibility / merge only — no sync engine change)

1. **Defaults Tasks folder twin** — hidden when UX-STUB-1 Abyss path active; note points to GTD Tasks folder (`TickTickTasksFilePath`).
2. **Extra filters** — entire Limit / Extra filters section omitted when `syncedLists` non-empty.
3. **Hub single-tasks file** — hidden on Abyss path.
4. **Strip ticktick on reset** — always hidden (dead with wipe-only Reset).
5. **Keep TickTick folders** — hidden when `projectSchemeEnabled`.
6. **GTD stage→list** — inactive banner (controls hidden) when `statusListMappings` non-empty; Status → list under Notes unchanged.

### Automated

- `npx vitest run` — includes `src/test/uxSetPhase2.settingsVisibility.test.ts` (case-ID named).
- `npm run build` — pass (same PR).

### Pilot

- Settings UI visual smoke: **not run** (honest). Do not mark TEST_PLAN / AF live **pass** until pilot install + owner glance.

## Conclusion

Phase 2 visibility contracts are ready for merge into `abyss-mapping`. Owner merges; then pilot exercises UX-SET-HIDE-DEFAULTS / EXTRA-FILTERS / STATUS-VS-STAGE.

## Checklist

- [x] Unit tests named by case IDs
- [x] Visibility per scope; no sync logic change
- [x] TEST_PLAN + CHANGELOG in same PR
- [ ] Pilot Settings smoke (**not run**)
