# 31 — Settings UX Phase 4 (cold-start & polish)

| Field | Value |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Phase | 31 (implement / unit) |
| Issue | [#194](https://github.com/semyon-alekseev-noveo/tt-sync/issues/194) — Settings UX Phase 4 |
| Epic | [#189](https://github.com/semyon-alekseev-noveo/tt-sync/issues/189) |
| Depends on | Phase 3 [#193](https://github.com/semyon-alekseev-noveo/tt-sync/issues/193) / PR #198 merged |
| Status | **unit pass**; pilot Settings UI **not run** |

## Inputs

- Plan: `27-settings-ux-redesign-plan.md` Phase 4
- Phase 3: `30-settings-ux-phase3.md`
- Cases: `UX-SET-COLD-START`, `UX-SET-DEVICE-PRUNE`, `UX-SET-INTERVAL-ZERO`, `UX-SET-PW-CONFIRM` (+ Generate Debug dump GTD / statusListMappings)

## Evidence

### What landed (cold-start / polish — no sync engine change)

1. **Cold-start strip** at top of Sync Control: Projects note + `#system/project` + Active Zone + Synchronize; new TT list must be ticked under Synced lists.
2. **Device list:** clearer Known devices copy; **Remove** prunes stale (non-current) devices.
3. **Generate Debug Info** dump includes `gtd` block with `statusListMappings`, `syncedLists`, scheme flags, etc.
4. **Password:** explicit plaintext confirm modal before storing a new non-empty password; banner copy.
5. **Progress-on-scheduled:** grey/disabled when automatic sync interval = 0, with hint.

### Automated

- `npx vitest run` — includes `src/test/uxSetPhase4.settingsColdStart.test.ts` (case-ID named).
- `npm run build` — pass (same PR).

### Pilot

- Settings UI visual smoke: **not run** (honest). Do not mark TEST_PLAN / AF live **pass** until pilot install + owner glance (≤30s: cold-start strip, prune, interval=0 grey, password confirm).

## Conclusion

Phase 4 cold-start/polish contracts are ready for merge into `abyss-mapping`. After merge, owner can treat epic #189 phase checklist as code-complete pending pilot Settings smoke across phases — **do not invent live pass**; owner closes phases after smoke.

## Checklist

- [x] Unit tests named by case IDs
- [x] Cold-start / prune / debug dump / password confirm / interval-zero grey; no sync logic change; no forced pilot data.json rewrite
- [x] TEST_PLAN + CHANGELOG in same PR
- [ ] Pilot Settings smoke (**not run**)
