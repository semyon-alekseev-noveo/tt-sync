# 215 — P0 safety (empty-TT + archive/stale)

| Field | Value |
|-------|--------|
| Issue | [#215](https://github.com/semyon-alekseev-noveo/tt-sync/issues/215) |
| Epic | [#214](https://github.com/semyon-alekseev-noveo/tt-sync/issues/214) |
| Status | **unit pass** (archive path); live prove **not run** |
| Inputs | `214-plan-taxonomy-rebind.md`, `UX-OBS-TT-SOAK/34` |

## Goal

1. Live prove `BUG-208-EMPTY-TT-NO-AZ-STRIP` ×2 (pilot only).
2. `ID-ARCHIVE-NO-STRIP`: Synchronize must not Confirm-wipe archive/historical checklists for ids gone from TT.

## Evidence

- Code: `src/sync/historicalVaultMarkers.ts`; `VaultSyncCoordinator.confirmDeletions` auto-detach on historical paths; push orphan scan skips archive strip.
- Unit: `npx vitest run src/test/historicalVaultMarkers.test.ts` — pass.
- Live: **not run** (owner tip + Synchronize on `399 Архив` fixture; empty-TT live ×2 still open).

## Conclusion

Archive Confirm wipe closed in code for `Архив`/`Archive`/`zz-parked*`. Tip + live prove still required before #215 close. Empty-TT live prove remains open (unit already on #208).

## Checklist

- [x] Unit for archive/stale policy
- [ ] Live empty-TT / wipe-shaped ×2
- [ ] Archive fixture prove
- [x] TEST_PLAN updated in code PR
