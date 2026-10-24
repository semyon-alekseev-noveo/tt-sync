# #18 — BUG-DEFERRED-ID-PHASE2-DELETE (2.0.89)

## Meta

| Field | Value |
|-------|--------|
| Gate | `PILOT-BATCH-EDITOR-SAFETY` |
| GitHub | [#18](https://github.com/semyon-alekseev-noveo/tt-sync/issues/18) |
| Recorded | 2026-10-24 ~13:44 UTC |
| Build | **2.0.89** on `<pilot-vault>` (Thinkpad-tts-test) |
| Status | **pass** (CLI create + Synchronize) |

## Inputs

- `TEST_PLAN.md` **BUG-DEFERRED-ID-PHASE2-DELETE**
- Unit: `pendingMarkerDeletion.test.ts`
- Historical fail (2026-10-21): caret-deferred id + false delete modal on `test-10-35`

## Evidence

1. Opened `00 Inbox/abyss-active.md`.
2. Appended `- [ ] defer-18-134433 #obsidian #inbox` (**no** `ticktick_id`).
3. **Synchronize** once; hooked `deleteTask` to count attempts; auto-dismissed Skip/Cancel prompts if any.

| Check | Result |
|-------|--------|
| Vault line after sync | `- [ ] defer-18-134433 … %%[ticktick_id:: 6adcb651b91e021f884b9b20]%%` |
| TT task | present (`get_task_by_id` → title `defer-18-134433`, project `6ad1abfe…`) |
| `deleteTask` attempts | **0** |
| False “removed from Obsidian” delete for this id | **not observed** |

## Conclusion

New checkbox creates on TickTick and receives a vault marker without Phase 2 deleting that id. Close #18. Note: this CLI run did not force a long caret-defer window; unit coverage remains the pending-marker skip. Live recreate of the exact 2026-10-21 caret race is still optional soak.

## Checklist

- [x] Create without id → Synchronize
- [x] Id lands; TT task exists; no delete of that id
- [x] Evidence under `PILOT-BATCH-EDITOR-SAFETY/`
