# BUG-OPENNOTE-DELETE-CONFIRM — live fail (post-#274)

## Meta

| Field | Value |
|-------|-------|
| Case | `BUG-OPENNOTE-DELETE-CONFIRM` |
| Vault | Thinkpad-tts-test (pilot) |
| Tip | after [#274](https://github.com/semyon-alekseev-noveo/tt-sync/pull/274) |
| Status | **live pass ×2** (2026-11-17, 2.0.98) — keyup path removed; no Confirm mid-edit |

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
- [x] Tip with keyup path removed (unit `bugOpennoteDeleteConfirm.test.ts`)
- [x] Re-prove ×2 (different fixtures) after tip — **pass** 2026-11-17 (see below)

---

## Live re-prove — **pass ×2** (2026-11-17, 2.0.98, pilot vault)

| Field | Value |
|-------|--------|
| Plugin | tickticksync-abyss **2.0.98** |
| Vault | Thinkpad-tts-test (pilot only) |
| Runner | agent — `obsidian-cli eval` |
| Method | open the note; delete the marked line in the **editor buffer** (`view.data` — the exact signal `checkFileForDeletedTasks(null)` reads); dispatch `keyup` Backspace/Delete on `document` |

**Harness note:** the Obsidian window is not the OS-focused window under Wayland (`document.hasFocus()` is false), so the in-page focus gate `document.hasFocus() && root.activeElement == contentDOM` was satisfied by overriding `document.hasFocus` to `true` for the run. No plugin code was changed.

| Prove | Note | Editor buffer after delete | Keys | Modal |
|-------|------|----------------------------|------|-------|
| A | `30 Tasks/PROVE-42.md` | `# keep` (marked line removed) | Backspace, Delete | **none** |
| B | `30 Tasks/PROVE-42B.md` | `# keep` (marked line removed) | Delete, Backspace | **none** |

No Sync discrepancies / PushDeleteTT Confirm, no Apply once; TickTick tasks stayed alive. With the legacy keyup path this exact state (marked line gone from `view.data`) opened the Confirm.

Cleanup: both probe notes deleted; both probe TickTick tasks deleted; vault scan has no `PROVE-42`.
