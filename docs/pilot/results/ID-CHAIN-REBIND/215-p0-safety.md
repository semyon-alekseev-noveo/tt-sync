# 215 — P0 safety (empty-TT + archive/stale)

| Field | Value |
|-------|--------|
| Issue | [#215](https://github.com/semyon-alekseev-noveo/tt-sync/issues/215) |
| Epic | [#214](https://github.com/semyon-alekseev-noveo/tt-sync/issues/214) |
| Status | Archive / TT-gone live **pass** ×2; empty-TT live **not run** |
| Inputs | `214-plan-taxonomy-rebind.md`, `UX-OBS-TT-SOAK/34` |

## Goal

1. Live prove `BUG-208-EMPTY-TT-NO-AZ-STRIP` ×2 (pilot only).
2. `ID-ARCHIVE-NO-STRIP` / `ID-TT-GONE-DETACH`: Synchronize must not Confirm-wipe archive or live checklists for ids gone from TT.

## Evidence

- Code: `historicalVaultMarkers`; `VaultSyncCoordinator.confirmDeletions` always detach; push orphan skip strip.
- Unit: `historicalVaultMarkers.test.ts` + `VaultSyncCoordinator` detach tests — pass.

### Live prove ×2 (2026-10-29, tip after #224)

Pilot Thinkpad-tts-test. Runner: Obsidian CLI eval `scheduledSynchronization` + disk snip checks.

Fixtures (Dexie missing / gone ids):

- Archive: `30 Tasks/399 Архив/3993 Personal tasks/убрать-мусор-после-монтажа-свай-под-дом.md`
- Archive: `…/Написать_первую_статью_в_Новео.md`
- Live: `30 Tasks/303 Личные задачи/сарай-построить-лестницу-и-юбку.md`

| Prove | When (UTC) | Sync | Checklist titles kept | Result |
|-------|------------|------|----------------------|--------|
| 1 | 07:20 | ok | archive + live titles present after sync | **pass** |
| 2 | 07:21 | ok | same fixtures, second sync | **pass** |

Vault-local: `.tickticksync/_prove215-1.json`, `_prove215-2.json` (not committed). Marker ids still on disk after these runs (detach may be deferred / no remote toDelete this pass); **no** Confirm wipe of checklist text.

Empty-TT / wipe-shaped AZ strip: **not run** (needs controlled empty snapshot; still under #208 / this issue residual).

## Conclusion

`ID-ARCHIVE-NO-STRIP` + live TT-gone text-keep: live **pass** ×2. Do not close #215 solely on this if empty-TT live remains required by issue DoD — record residual honestly.

## Checklist

- [x] Unit for archive/stale policy
- [ ] Live empty-TT / wipe-shaped ×2
- [x] Archive + live fixture prove ×2
- [x] TEST_PLAN updated in code PR
