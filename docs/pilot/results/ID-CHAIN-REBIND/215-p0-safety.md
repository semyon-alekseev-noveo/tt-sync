# 215 — P0 safety (empty-TT + archive/stale)

| Field | Value |
|-------|--------|
| Issue | [#215](https://github.com/semyon-alekseev-noveo/tt-sync/issues/215) |
| Epic | [#214](https://github.com/semyon-alekseev-noveo/tt-sync/issues/214) |
| Status | Archive / TT-gone live **pass** ×2; empty-TT live **pass** ×2 |
| Inputs | `214-plan-taxonomy-rebind.md`, `UX-OBS-TT-SOAK/34` |

## Goal

1. Live prove `BUG-208-EMPTY-TT-NO-AZ-STRIP` ×2 (pilot only).
2. `ID-ARCHIVE-NO-STRIP` / `ID-TT-GONE-DETACH`: Synchronize must not Confirm-wipe archive or live checklists for ids gone from TT.

## Evidence

- Code: `historicalVaultMarkers`; `VaultSyncCoordinator.confirmDeletions` always detach; push orphan skip strip; `looksLikeTickTickWipe` → `empty-ticktick`.
- Unit: `historicalVaultMarkers.test.ts` + `VaultSyncCoordinator` detach + `massDeleteGuard` wipe tests — pass.

### Live prove ×2 — archive / TT-gone (2026-10-29, tip after #224)

Pilot Thinkpad-tts-test. Runner: Obsidian CLI eval `scheduledSynchronization` + disk snip checks.

Fixtures (Dexie missing / gone ids):

- Archive: `30 Tasks/399 Архив/3993 Personal tasks/убрать-мусор-после-монтажа-свай-под-дом.md`
- Archive: `…/Написать_первую_статью_в_Новео.md`
- Live: `30 Tasks/303 Личные задачи/сарай-построить-лестницу-и-юбку.md`

| Prove | When (UTC) | Sync | Checklist titles kept | Result |
|-------|------------|------|----------------------|--------|
| 1 | 07:20 | ok | archive + live titles present after sync | **pass** |
| 2 | 07:21 | ok | same fixtures, second sync | **pass** |

Vault-local: `.tickticksync/_prove215-1.json`, `_prove215-2.json` (not committed).

### Live prove ×2 — empty-TT / wipe-shaped (2026-10-30, tip after #241)

Owner OK: backup → empty pilot-synced TT lists → Synchronize Skip ×2 → restore.

Method:

1. Snapshot AZ hashes for `Подключение посудомойки` / `Годовые задачи` / `PKM - journaling`.
2. Backup 195 Dexie live tasks in synced lists (Inbox/nextAction/WIP/waitingFor/Planned/someDay/Projects) → vault-local `_empty-tt-backup.json`.
3. Delete those 195 via plugin `tickTickRestAPI.deleteTask` (children first).
4. Synchronize ×2 with Skip-only clicker (never Apply).
5. Recreate 195 via `createTask` (new ids); rewrite vault markers from `_empty-tt-idmap.json`.

| Prove | When (UTC) | Guard | AZ sha/markers | Clicks | Result |
|-------|------------|-------|----------------|--------|--------|
| 1 | 04:54–04:55 | `empty-ticktick` (195 held, ~95%) | dish 7 / год 5 / PKM 3 unchanged | Skip 1, Apply 0 | **pass** |
| 2 | 04:55 | `empty-ticktick` (195 held) | same AZ shas | Skip 1, Apply 0 | **pass** |

Journal: `mass-delete-guard` choice `skip`, reason `empty-ticktick` @ `04:54:37Z` and `04:55:23Z`. Reports: `deletions-2026-10-30T04-54-37-269Z.md`, `…04-55-23-176Z.md`. Vault-local result: `_prove215-empty-result.json` (`pass: true`, `azPass: true`).

Residual (cleanup, not a fail): recreate used new TT ids; vault markers rebound via idMap. Old deletes may remain in TickTick trash — do **not** restore trash (would duplicate); empty trash when convenient. Some parent/child links may need a quiet Rematch later.

## Conclusion

`ID-ARCHIVE-NO-STRIP`, `ID-TT-GONE-DETACH`, and `BUG-208-EMPTY-TT-NO-AZ-STRIP` live **pass** ×2. #215 DoD met.

## Checklist

- [x] Unit for archive/stale policy
- [x] Live empty-TT / wipe-shaped ×2
- [x] Archive + live fixture prove ×2
- [x] TEST_PLAN updated in same docs PR
