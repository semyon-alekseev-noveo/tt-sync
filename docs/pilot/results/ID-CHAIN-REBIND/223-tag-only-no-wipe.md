# 223 — tag-only must not Confirm-wipe TT

| Field | Value |
|-------|--------|
| Issue | [#223](https://github.com/semyon-alekseev-noveo/tt-sync/issues/223) |
| Epic | [#214](https://github.com/semyon-alekseev-noveo/tt-sync/issues/214) |
| Related | [#208](https://github.com/semyon-alekseev-noveo/tt-sync/issues/208), after #216 merge |
| Status | **unit pass**; live prove **not run** |
| Inputs | Owner screenshot Confirm Deletion for Selectel under Unknown; tip on merged #216 |

## Goal

`ID-TAG-ONLY-NO-WIPE`: tag `obsidian` without a vault file must not open Confirm Deletion to wipe TickTick.

## Evidence

- Live (pre-fix): TT task `6ae17a048f0871a7dbb8c8bf` «Selectel - JavaScript course» exists (children, tags `obsidian`/`course`/`wip`). Vault markdown: **no** line (only `ticktick-backup-*.csv`). Modal: Confirm Deletion / Unknown.
- Code: `planVaultTaskDeletions` + `collectTaskIdsAbsentFromVault` require vault file in push scope; drop tag-only eligibility.
- Unit: `massDeleteGuard.test.ts` `ID-TAG-ONLY-NO-WIPE`.

## Conclusion

Unit DoD met. Tip + Synchronize: Selectel must not appear on Confirm. Live prove ×2 before close.

## Checklist

- [x] Case + unit
- [ ] Live Synchronize ×2 (Selectel + second tag-only orphan if any)
- [x] TEST_PLAN in code PR
