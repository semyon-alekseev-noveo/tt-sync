# 223 — tag-only must not Confirm-wipe TT

| Field | Value |
|-------|--------|
| Issue | [#223](https://github.com/semyon-alekseev-noveo/tt-sync/issues/223) |
| Epic | [#214](https://github.com/semyon-alekseev-noveo/tt-sync/issues/214) |
| Related | [#208](https://github.com/semyon-alekseev-noveo/tt-sync/issues/208), after #216 merge |
| Status | **live pass** ×2 (tip after #224) |
| Inputs | Owner screenshot Confirm Deletion for Selectel under Unknown; tip on merged #224 (`6bfb8a3`) |

## Goal

`ID-TAG-ONLY-NO-WIPE`: tag `obsidian` without a vault file must not open Confirm Deletion to wipe TickTick.

## Evidence

- Live (pre-fix): TT task `6ae17a048f0871a7dbb8c8bf` «Selectel - JavaScript course» exists (children, tags `obsidian`/`course`/`wip`). Vault markdown: **no** line (only `ticktick-backup-*.csv`). Modal: Confirm Deletion / Unknown.
- Code: `planVaultTaskDeletions` + `collectTaskIdsAbsentFromVault` require vault file in push scope; drop tag-only eligibility.
- Unit: `massDeleteGuard.test.ts` `ID-TAG-ONLY-NO-WIPE`.

### Live prove ×2 (2026-10-29, tip #224)

Pilot vault Thinkpad-tts-test. Tip: `plugin:reload` after install of merged `#224`. Runner: Obsidian CLI `tts-sync` + `eval` (`collectTaskIdsAbsentFromVault`).

| Prove | When (UTC) | Fixture | `plannedCount` | id planned? | TT alive | Result |
|-------|------------|---------|----------------|-------------|----------|--------|
| 1 | 07:13–07:14 | Selectel `6ae17a048f0871a7dbb8c8bf` | 0 | no | yes | **pass** |
| 2 | 07:14–07:15 | Selectel + Гоша - школа `6ae17a048f0871a7dbb8c8c6` (second tag-only / no Dexie `file`) | 0 | neither | both yes | **pass** |

Vault-local JSON (not committed): `.tickticksync/_prove223-1.json`, `_prove223-2.json`. No new `reports/deletions-*` today. MCP `get_task_by_id` confirmed both tasks still present after prove 2.

## Conclusion

`ID-TAG-ONLY-NO-WIPE` live **pass** ×2. Issue #223 closable on evidence (already closed on merge; this records prove).

## Checklist

- [x] Case + unit
- [x] Live Synchronize ×2 (Selectel + Гоша)
- [x] TEST_PLAN in code PR
