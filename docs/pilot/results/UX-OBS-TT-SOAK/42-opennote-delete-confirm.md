# BUG-OPENNOTE-DELETE-CONFIRM — live fail (post-#274)

## Meta

| Field | Value |
|-------|-------|
| Case | `BUG-OPENNOTE-DELETE-CONFIRM` |
| Vault | Thinkpad-tts-test (pilot) |
| Tip | after [#274](https://github.com/semyon-alekseev-noveo/tt-sync/pull/274) |
| Status | **fail** (owner report + screenshot); unit fix pending merge; re-prove **not run** |

## Inputs

- Note: `10 Projects/PKM - journaling.md`
- Action: delete marked line(s) in Active Zone (Backspace/Delete)
- Toast visible: «TickTick: 🔄 Updating open note…»
- Modal: Sync discrepancies Confirm (PushDeleteTT), reason «The tasks were removed from the file»
- Ids listed (incl. orphan): `6aeae53f64633723f94008aa`, `6ae42396d07c7a23f9eed586`, `6ae42397d07c7a23f9eed587`, `6ae82059d07c7a23f9eed593`
- Rebind button present

## Evidence

### Root cause (code)

Not the 5s open-note push (`pushSettledActiveFile` / `identifiedOnly`). That path only runs `checkFileForModifications` and never opens Confirm.

Legacy path: `EventHandlerService` keyup on **Delete/Backspace** → `service.deletedTaskCheck(null)` → `TaskDeletionHandler.checkFileForDeletedTasks` → `deleteTasksByIds` → `TaskDeletionModal` (Sync discrepancies Confirm). Concurrent toast is editor-change debounce flush only.

### write-trace / journal

- Confirm open is **not** written to `.tickticksync/write-trace.jsonl` (no PushDeleteTT trace event).
- Expected concurrent write-trace (if `debugWriteTrace` on): `flushActiveFilePush` / `Updating open note…` for the same path — unrelated to Confirm.
- Journal TT deletes would appear only after **Apply once** — owner must use **Don’t delete** / Rebind while cleaning.

## Conclusion

Bug vs earlier “open-note does not Confirm” analysis: that claim was true for the **push** path and false for **Delete/Backspace keyup**. Product (UX-SYNC-ONE-FLOW): editor line delete must not Confirm; hold until Synchronize.

## Checklist

- [x] Live fail recorded (owner screenshot)
- [ ] Tip with keyup path removed
- [ ] Re-prove ×2 (different fixtures) after tip
