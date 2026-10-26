# BUG-NOTEBOOK-NO-DELETE — vault must not delete Notebook notes

## Meta

| Field | Value |
|-------|--------|
| Gate | `BUG-NOTEBOOK-NO-DELETE` |
| Issue | [#160](https://github.com/semyon-alekseev-noveo/tt-sync/issues/160) |
| Recorded | 2026-10-26 ~07:30 UTC |
| Build | tip `fix/160-notebook-no-delete` deployed to `<pilot-vault>` `tickticksync-abyss` |
| Runner | agent (vitest + Obsidian CLI `tts-sync` + TickTick MCP) |
| Status | **pass** (unit + live prove×2) |

## Inputs

- `docs/pilot/NOTEBOOK.md` §4 safety gate
- `ABYSS_FIRST_CASES.md` **BUG-NOTEBOOK-NO-DELETE**
- Prior: Notebook backlog docs (#161)

## Evidence

### Unit

`npx vitest run src/test/bugNotebookNoDelete.test.ts` — **6 pass** (orphan skip, file-missing skip, `deleteTasksByIds` last defense, NOTE project protect, TASK not blocked).

Full suite: **752** pass; `npm run build` OK; `check:sizes` 0 exceptions.

### Live prove×2 (two fixtures)

1. MCP created Notebook items (no vault lines):
   - **A** `6adeff4d8f08f3950540d5a5` — `kind: NOTE` in TTS-Inbox, title `BUG-NOTEBOOK-NO-DELETE A 142030`
   - **B** `6adeff5f8f0840807115f29e` — `kind: NOTE` in TTS-Inbox, title `BUG-NOTEBOOK-NO-DELETE B 142030`
   - **C** `6adeff648f08640fc3a0c2f6` — in NOTE project `TTS-Notebook-Safety` (`6adeff608f08dc411431aff4`)
2. Deployed tip `dist/` → plugin folder; `plugin:reload id=tickticksync-abyss`.
3. `tickticksync-abyss:tts-sync` **×2** (no vault markdown for those titles).
4. MCP `get_task_by_id`: **A**, **B**, and **C** still present with `kind: NOTE` and original content.

## Conclusion

Phase 2 / orphan vault→TT deletion skips Notebook notes (`notebookGuard` + `TaskDeletionHandler`). Live: two Inbox NOTE fixtures + one NOTE-project fixture survived Synchronize without vault mapping.

## Checklist

- [x] Guard on orphan / file-missing / `deleteTasksByIds`
- [x] Unit tests named BUG-NOTEBOOK-NO-DELETE
- [x] Live fixture A survives sync
- [x] Live fixture B survives sync (independent)
- [ ] Merge PR into `abyss-mapping` (owner)
- [ ] Close #160 after merge (owner)
