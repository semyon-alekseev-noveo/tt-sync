# 30 — Settings UX Phase 3 (names & defaults)

| Field | Value |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Phase | 30 (implement / unit) |
| Issue | [#193](https://github.com/semyon-alekseev-noveo/tt-sync/issues/193) — Settings UX Phase 3 |
| Epic | [#189](https://github.com/semyon-alekseev-noveo/tt-sync/issues/189) |
| Depends on | Phase 2 [#192](https://github.com/semyon-alekseev-noveo/tt-sync/issues/192) / PR #197 merged |
| Status | **unit pass**; pilot Settings UI **not run** |

## Inputs

- Plan: `27-settings-ux-redesign-plan.md` Phase 3
- Phase 2: `29-settings-ux-phase2.md`
- Cases: `UX-SET-SYNC-NOTES`, `UX-SET-NOTEBOOK-WARN`, `UX-SET-BKUP-DEFAULT`, `UX-SET-LEAN-WARN` (+ Status→tag/list headers, Full vault Abyss wording, quiet reading defaults)

## Evidence

### What landed (names / defaults / warnings — no sync engine change)

1. **Sync Notes** → **Sync task descriptions** (NOTE-BODY vs Notebook clarified).
2. **Status → tag** vs **Status → list** explicit headers; list-wins banner when list map non-empty.
3. **Notebook folder** warns if path looks like Inbox/capture (no forced rewrite of pilot `data.json`).
4. **`bkupFolder`** new-install default `TickTickSync/backups`; warn when value is vault root `/`.
5. **Full vault sync** Abyss/GTD-aware help + confirm modal copy; confirm still required.
6. **Quiet reading** defaults: Reading-mode `#ticktick` tag off for new installs (id already off).
7. **Project note template** lean warn when path looks like heavy `MOC.md` (soak P0); not a MOC engine.

### Automated

- `npx vitest run` — includes `src/test/uxSetPhase3.settingsNames.test.ts` (case-ID named).
- `npm run build` — pass (same PR).

### Pilot

- Settings UI visual smoke: **not run** (honest). Do not mark TEST_PLAN / AF live **pass** until pilot install + owner glance (≤30s: Sync Notes / Notebook / bkup / lean).

## Conclusion

Phase 3 naming/default contracts are ready for merge into `abyss-mapping`. Owner merges; then pilot exercises UX-SET-SYNC-NOTES / NOTEBOOK-WARN / BKUP-DEFAULT / LEAN-WARN.

## Checklist

- [x] Unit tests named by case IDs
- [x] Names/defaults/warns per scope; no sync logic change; no forced pilot data.json rewrite
- [x] TEST_PLAN + CHANGELOG in same PR
- [ ] Pilot Settings smoke (**not run**)
