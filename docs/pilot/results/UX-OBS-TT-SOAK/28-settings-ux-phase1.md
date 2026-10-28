# 28 — Settings UX Phase 1 (traps + mini-help)

| Field | Value |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Phase | 28 (implement / unit) |
| Issue | [#191](https://github.com/semyon-alekseev-noveo/tt-sync/issues/191) — Settings UX Phase 1 |
| Epic | [#189](https://github.com/semyon-alekseev-noveo/tt-sync/issues/189) |
| Depends on | Phase 0 [#190](https://github.com/semyon-alekseev-noveo/tt-sync/issues/190) / PR #195 merged |
| Status | **unit pass**; pilot Settings UI **not run** |

## Inputs

- Plan / glossary: `27-settings-ux-redesign-plan.md`
- Cases: `ABYSS_FIRST_CASES.md` `UX-SET-GLOSSARY`, `UX-SET-SYNCTAG-EMPTY`, `UX-SET-MANAGE-DELETED`, `UX-SET-RESET-ONE`, `UX-SET-SYNCED-LISTS-HELP`, `UX-SET-MAINT-SYNC-PRIMARY`

## Evidence

### What landed (copy / layout only — no sync engine change)

1. **Deletion glossary** — `DeletionGlossary.svelte` in Maintenance (full table) + Deletion guard (compact chips).
2. **Pull filter tag** — label/help; empty-state badge `pull ALL` + tooltip.
3. **Synced lists** — allow-list help; new TT list ≠ synced until ticked.
4. **Reset** — single **Danger zone** under Maintenance; removed from Tasks / Notes; vault + TickTick intact copy.
5. **Purge trash (DB)** — renames former Manage Deleted; help ≠ held / Apply once.
6. **Maintenance** — **Synchronize** sole `mod-cta`; Check / Backup / Purge secondary.

### Automated

- `npx vitest run` — includes `src/test/uxSetPhase1.settingsCopy.test.ts` (case-ID named).
- `npm run build` — pass.

### Pilot

- Settings UI visual smoke: **not run** (honest). Do not mark TEST_PLAN / AF live **pass** until pilot install + owner glance.

## Conclusion

Phase 1 code/contracts are ready for merge into `abyss-mapping`. Owner merges; then pilot exercises UX-SET-* rows.

## Checklist

- [x] Unit tests named by case IDs (where testable)
- [x] Copy/layout per scope; no sync logic change
- [x] TEST_PLAN + CHANGELOG in same PR
- [ ] Pilot Settings smoke (**not run**)
- [ ] Owner 30s glossary check (UX-SET-GLOSSARY)
