# Abyss-first acceptance cases

Canonical case catalog for this fork. Analysts add or update a case here before a code change. Testers record results in the log at the bottom. An empty result means **not run**.

Plan: `ABYSS_FIRST_PLAN.md` Steps 6–8. Process: `DEV_FLOW.md`. Status: `PO_STATUS.md`. Per-PR manual cases: `TEST_PLAN.md`. Older CASE-* write-ups in `GTD_SYNC_CASES.md` are archive.

Vaults: `<pilot-vault>` only until the live gate below is filled by someone who watched Obsidian. `<live-vault>` stays closed. Manual sync. No tokens, passwords, or personal paths in this repo. If a `tp_` token was pasted in chat, revoke it in TickTick; this plugin logs in with the web session, not that token.

## Who may run a pilot

Rows that open an Obsidian modal (deletion confirm, undo preview) need the vault on a machine where Obsidian is actually running. A human does that, or a local agent on that machine. A cloud agent does not mark those rows passed.

## Cases

Preconditions for every AF row: plugin `tickticksync-abyss`, manual sync, `fileLinksInTickTick` = no link, no injected `ticktick` tag, pilot lists only (`TTS-*` or the names in the pilot preset).

| ID | Expected behavior |
|----|-------------------|
| AF-1 | `syncedLists` empty. Synchronize. No TickTick task is written into the vault. |
| AF-2 | A parent task on the projects list becomes a project note under `10 Projects/` with `## Active Zone`. The parent is not a checkbox line in that note. |
| AF-3 | A new project note (folder `10 Projects/`, tag `system/project`) creates the parent task on the projects list. |
| AF-4 | A checkbox under `## Active Zone` becomes a subtask of that note’s parent. The line stays in the note. |
| AF-5 | A checkbox in any in-scope note with `#type/next` lands on the next-action list. The line does not move to another file. |
| AF-6 | Checking the box completes the TickTick task. Completing it in TickTick checks the same line. |
| AF-7 | Moving the task to another mapped list rewrites the stage tag on that same line. |
| AF-8 | A checkbox in a note outside `syncScopeFolders` is not pushed. |
| NOTE-L3b | A child comment line, title unchanged, Synchronize. The text shows in the TickTick Comments panel. The description stays in the task body. |
| BUG-COMMENT-NO-PUSH | Same as NOTE-L3b; regression when only comment bullets change or hash path skips API (`PO_STATUS.md`). |
| BUG-TICKTICK-ID-LEAK | Title must not contain loose `ticktick_id::` outside `%%[ticktick_id:: <24hex>]%%`; canonical id wins if both present. |
| BUG-ACTIVEZONE-COMMENT-SHUFFLE | Sync in a project Active Zone note must not move comment bullets between sibling tasks or reorder tasks without user edit. |
| DEL-1 | Remove one in-scope checkbox, Synchronize, confirm the one dialog. The TickTick task is deleted. |
| DEL-3 | Same as DEL-1, then Cancel. The TickTick task remains. The notice does not say the sync succeeded at deleting it. |
| PERF-INDEX | `idsPresentInVault` matches a per-file `String.includes` scan: first markdown file in vault order, empty ids ignored, text inside a fence counts, a duplicate id stays with the first file. A file written during the run is not answered from an older index. |
| PERF-CACHE | In one sync, a file's text and its parsed task map are read once. A plugin write of that file drops both before the next read. |
| PERF-COUNTERS | One sync records phase times and counters (HTTP by endpoint, 429, files read, files scanned, tasks checked, vault writes) and logs one `[perf]` line. |
| TP-IDLE-ZERO | A quiet sync does not call `getTaskById`. `getTaskComments` runs only when `commentCount` differs from the vault comment threads. A quiet sync also performs no vault write. |
| TP-STALE-FILE-WRITE | A vault write planned from an earlier snapshot must not replace text that appeared in the file or the editor after that snapshot. An open note is patched on the task lines only, and only where those lines still match. Typing in the last two seconds defers the write. |
| TP-EDITOR-OTHER-LEAF | The editor buffer is used only when that editor's file is the file being read. Another leaf's buffer is never written into the target note. |
| TP-EDITOR-TYPE-DURING-SYNC | Typing in an open note during Synchronize stays in the editor. The task line updates, or the write waits until typing pauses. |
| TP-EDITOR-TYPE-DURING-PUSH | Same as TP-EDITOR-TYPE-DURING-SYNC for the 5-second open-note push. |
| TP-COMMENT-TT-DELETE | A comment removed in TickTick is removed from the note on the next sync, using the previous `taskCommentMaps` entry. The following sync does not write that note. |
| TP-NO-SELF-REPUSH | A file the plugin just wrote is not treated as a local edit on the next sync. The 5-second open-note push does not call the Comments API when no comment line changed. |
| TP-COMPLETE-DURING-TYPE | Completing a task checks that task line only. Text typed on another line stays. If that task line changed after the read, it is left alone. Typing in the last two seconds defers the check. |
| TP-UNCOMPLETE-DURING-TYPE | Reopening a task clears that task line only, with the same rules as TP-COMPLETE-DURING-TYPE. |

Unit tests cover parts of AF-1, AF-5, AF-8, comments, a failed pull, and PERF-INDEX / PERF-CACHE / PERF-COUNTERS. They do not replace the live gate.

## Old ids

| Old | Now |
|-----|-----|
| CASE-T4 (task must live in a per-list file) | **Cancelled.** Lines stay where they were written. |
| CASE-P2, CASE-P3, CASE-P4 | AF-2, AF-3, AF-4 |
| Inline tag / list routing cases | AF-5, AF-7 |
| Empty allow-list / out-of-scope cases | AF-1, AF-8 |
| Completion cases | AF-6 |
| CASE-DEL-1, CASE-DEL-3 | DEL-1, DEL-3 inside the one live gate |
| CASE-DEL-2, DEL-4, DEL-5, DEL-N1 | Not required for the gate. Run later if a deletion bug comes back. |
| NOTE-C1 | Automated stand-in for NOTE-L3b. The live row is still required. |

## One live gate

One session on `<pilot-vault>` before Step 8. All three must pass in that session. Do not open `<live-vault>` because a unit test passed.

1. **AF-5** (or AF-4 if you are already in a project note): add a checkbox, Synchronize, confirm the TickTick list and that the line did not move.
2. **NOTE-L3b** on that task: add a child comment line, Synchronize, confirm the Comments panel.
3. **DEL-1** on a throwaway copy of that task (or a second throwaway line): delete the line, Synchronize, confirm the dialog, confirm the task is gone.
4. **DEL-3** on another throwaway line: delete, Synchronize, Cancel, confirm the task remains.

Pass only with evidence: the note path, the `ticktick_id`, and either the journal line (`.tickticksync/journal/`) or a TickTick screenshot. If a step was skipped, write **not run**.

## Results log

| Date (UTC) | Vault | Build | Runner | Item | Result | Evidence |
|------------|-------|-------|--------|------|--------|----------|
| 2026-10-20 | Thinkpad-tts-test | 2.0.48 | Sam (manual) | AF-5 | partial | Checkbox in **project** (dishwasher / Active Zone): task on TTS-Projects, `#type/next` on line — not the plain-inbox AF-5 recipe; line stayed in vault. |
| 2026-10-20 | Thinkpad-tts-test | 2.0.51 | agent (Obsidian CLI) | NOTE-L3b | fail | `00 Inbox/abyss-active.md` `6ad6f43a…`: added `gate-251-retest-b`; **Synchronize** (`tickticksync-abyss:tts-sync`); journal strips comment line; MCP Comments empty. |
| 2026-10-20 | Thinkpad-tts-test | 2.0.51 | agent (Obsidian CLI) | BUG-COMMENT-NO-PUSH | fail | Same as NOTE-L3b row; `lastVaultPushWallMs` release did not reach TT Comments API on pilot. |
| 2026-10-20 | Thinkpad-tts-test | 2.0.48 | Sam (manual) | NOTE-L3b | fail | `00 Inbox/manual-test.md` `6ad6e474…`: comment bullets in vault, not in TT Comments; Active Zone tasks reordered / comment moved between tasks. |
| 2026-10-20 | Thinkpad-tts-test | 2.0.48 | Sam (manual) | DEL-1 | pass | Deleted line in Obs → **Synchronize** → confirm dialog → task removed in TT (slow sync; dialog is expected). |
| 2026-10-20 | Thinkpad-tts-test | 2.0.48 | Sam (manual) | DEL-3 | not run | |
| | `<live-vault>` | | | Step 8 | not run | Blocked until the four rows above are pass. |

This branch did not run the gate. Leave the result column as **not run** until you do.

## Live-vault rollout

Do this only after the four gate rows are pass.

1. **Backup.** Copy `<live-vault>` to a folder you can restore from. Do not open that copy in Obsidian while you sync the original.
2. **Install.** Same plugin build you just gated, plugin id `tickticksync-abyss`. Preset with the real list names, not the `TTS-*` pilot names, only when you mean to sync those lists.
3. **Manual sync.** `automaticSynchronizationInterval` is 0. Use the palette command **Synchronize**. Do not turn on a timer for the first session.
4. **Stop the plugin.** Settings → Community plugins → turn off TickTickSync. Sync stops. The journal stays on disk.
5. **Rollback.** Command palette: **Preview undo of last sync (dry run only)**, then **Undo last sync (preview first)** if the dry run is the change you want to reverse. The journal is `<vault>/.tickticksync/journal/YYYY-MM-DD.jsonl`. Undo writes its own journal session, so it can be undone too.
6. **If the plugin will not load.** Rename `<vault>/.obsidian/plugins/tickticksync-abyss` so Obsidian does not load it. Do not delete `.tickticksync/journal`.
7. **Secrets.** Do not copy `data.json` into git. Revoke any `tp_` token that left the TickTick account page.
