# 215 — P0 safety (empty-TT + archive/stale)

| Field | Value |
|-------|--------|
| Issue | [#215](https://github.com/semyon-alekseev-noveo/tt-sync/issues/215) |
| Epic | [#214](https://github.com/semyon-alekseev-noveo/tt-sync/issues/214) |
| Status | **not run** (scaffold) |
| Inputs | `214-plan-taxonomy-rebind.md`, `UX-OBS-TT-SOAK/34` |

## Goal

1. Live prove `BUG-208-EMPTY-TT-NO-AZ-STRIP` ×2 (pilot only).
2. `ID-ARCHIVE-NO-STRIP`: Synchronize must not Confirm-wipe archive/historical checklists for ids gone from TT.

## Evidence

- None yet.

## Conclusion

Await implementation PR.

## Checklist

- [ ] Unit for archive/stale policy
- [ ] Live empty-TT / wipe-shaped ×2
- [ ] Archive fixture prove
- [ ] TEST_PLAN updated in code PR
