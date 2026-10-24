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
| TP-IDLE-ZERO | A quiet sync does not call `getTaskById`. `getTaskComments` runs only when `commentCount` differs from the vault comment threads, count is unknown with vault threads, or stamp twins need collapse — not merely because vault threads exist. A quiet sync also performs no vault write. |
| TP-IDLE-ZERO-SWEEP | When Dexie `commentCount` is known and matches vault Abyss comment threads, Dexie maps cover those threads (bijection), and no wipe / stamp-twin repair is needed: `syncAbyssCommentsToTickTick` and `preparePersistNetwork` do **not** call `getTaskComments`. Pull echo-skip still **backfills** missing `commentCount` from delta `update[]`. Double-sweep removal is out of scope for this case (slice 3 / #83 → `TP-IDLE-MANUAL-SCOPE`). |
| TP-IDLE-MANUAL-SCOPE | Quiet / manual **Synchronize** must not run a full-vault comment sweep twice (pre-pull push + `syncFiles`). Pre-pull paths are **edited-since last vault push** and the **active in-scope note** only — not every registered path. `syncFiles` skips `checkFileForModifications` (and thus `sweepAbyssCommentsInFile`) for paths already swept in that run’s pre-pull set. **BUG-COMMENT-NO-PUSH** / **NOTE-L3b** still apply for files that actually changed (mtime / edited set / active leaf). |
| TP-IDLE-EMPTY-SWEEP | Quiet `syncFiles` must not call `getTaskComments` for tasks with **no** Abyss comment threads and **no** Dexie comment maps (`canSkipAbyssCommentNetwork` empty-fast). Full-file checks set `deferCommentSweep` so hash-unchanged lines do not also call `syncAbyssCommentsToTickTick` — `sweepAbyssCommentsInFile` owns **BUG-COMMENT-NO-PUSH**. Inline / single-line parent walks still sync comments when the file sweep does not follow. |
| TP-IDLE-BYID-ZERO | Quiet Synchronize must not call `getTaskById` for: (1) project-scheme parents already present in the Dexie/`updated` batch (`ProjectScheme.run` uses the local task; GET only when the parent is missing from that batch); (2) hash-unchanged project-note children whose vault `parentId` is empty but Dexie parent is the scheme parent for that file (not a real parent change — do not enter `applyModifications`); (3) list-move probe inside `applyModifications` when line `projectId` already equals Dexie `projectId`. |
| EMPTY-SIDE-GUARD | A sync that would delete more than 10 tracked tasks and more than 20% of them, or any deletion while the vault scan found 0 tracked tasks and Dexie has some, or while a TickTick full snapshot is empty and Dexie has tasks, applies no deletions and does not move `checkPoint`. Creates and updates still apply. Manual sync asks Apply once, Skip deletions this run, or Open report. Startup and scheduled sync only notify. A file that failed to read, is a conflict copy, is sync-pending, or was skipped does not produce deletions. An incomplete vault index does not produce deletions. The first sync with an empty Dexie deletes nothing. Startup waits until the layout is ready and Obsidian Sync is idle, then the configured delay (default 30 seconds). |
| TP-STALE-FILE-WRITE | A vault write planned from an earlier snapshot must not replace text that appeared in the file or the editor after that snapshot. An open note is patched on the task lines only, and only where those lines still match. Typing in the last two seconds defers the write. |
| TP-EMPTY-EDITOR-DISK | When a markdown leaf shows an empty buffer but the file on disk has text, opening or focusing that leaf repairs the buffer from disk (no notice), except during the same typing defer window as `commitVaultText`. Sync reads use disk when the buffer is still empty. After an open-note plugin patch, disk is aligned with the editor. |
| TP-NEW-TASK-NOT-5S | A new checkbox line without `ticktick_id` in an open inbox/daily note is not created in TickTick by the 5-second open-note push (`identifiedOnly`). Creation runs on settled line / manual Synchronize / modify when the file is not the active editor. |
| BUG-DEFERRED-ID-PHASE2-DELETE | A new in-scope checkbox on an open note: TickTick create may succeed while `%%[ticktick_id:: …]%%` write is deferred (caret on the line). Phase 2 must not prompt to delete that task in the same or a later sync until the marker is in the vault or the line is really removed. |
| BUG-COMMENT-ACTIVE-NOTE | Child comment bullets under a synced task on the **active** in-scope note: manual **Synchronize** runs the Comments API push (and comment sweep) even when disk mtime did not pass `editedSince`. Matches NOTE-L3b for the open-leaf case. |
| BUG-COMMENT-NO-TT-WIPE | **Synchronize** must not delete TickTick Comments that still match vault threads (stamp vs plain title) or that exist only on TickTick when the vault has no comment bullets under that task. |
| BUG-COMMENT-KEY-EQUIV | Vault comment threads and TickTick `title` match by `normalizedCommentKey` (stamp stripped), not raw line hash; `apiCommentsDifferFromVault` and push/pull use `src/sync/comments/`. |
| BUG-COMMENT-MERGE-NO-STRIP | Pull merge must not drop vault comment bullets when the Comments API returned an empty list but TickTick did not report `commentCount: 0` (avoids tt→obs strip before push). |
| BUG-COMMENT-MANUAL-PRE-PULL | **Superseded by `TP-IDLE-MANUAL-SCOPE` (#83):** pre-pull is edited + active only (not every registered note). Kept as historical ID; do not reintroduce full-vault manual pre-pull. |
| BUG-COMMENT-VAULT-AHEAD | Vault has Abyss comment bullets and TickTick Comments API is empty (or behind on keys): reconcile must **push** to TickTick, not mark the line `behindComments` and pull from TickTick. |
| BUG-COMMENT-NO-MASS-DELETE | Adding a new Abyss comment bullet and **Synchronize** must not call TickTick comment **delete** for existing mapped threads; empty `getTaskComments` must not trigger mass delete on push. |
| BUG-COMMENT-STALE-MAPS | After a mass TickTick Comments wipe, several vault bullets with stale Dexie maps must still **push** (`vaultHasUnpushedCommentThreads`); single mapped miss with other TT comments still waits for pull. |
| BUG-COMMENT-TT-AHEAD-NO-DELETE | A comment created only in TickTick must survive **Synchronize** (push runs before pull; no `deleteTaskComment` for TT-ahead keys). |
| BUG-COMMENT-BOTH-WAYS | When vault and TickTick both have comment keys the other side lacks, reconcile must **push** unpushed vault threads and still **pull** TT-ahead (not TT-ahead-only `behindComments`). |
| BUG-COMMENT-PUSH-NO-ID | POST `/comment` responses without a top-level `id` must still yield a comment id (unwrap `ok`/`result`/`data`); vault-only pushes use plain comment text; several stale maps with TT comments still present must not block push. |
| BUG-COMMENT-PULL-DOUBLE-STAMP | Pull must format TT comment bullets as `YYYY-MM-DD HH:MM: plainText` — strip any ISO/Abyss stamp already in the API `title` before applying `createdTime` stamp (no `14:46: 2026-10-21T12:09:07+07:00: …`). |
| TP-EDITOR-OTHER-LEAF | The editor buffer is used only when that editor's file is the file being read. Another leaf's buffer is never written into the target note. |
| TP-EDITOR-TYPE-DURING-SYNC | Typing in an open note during Synchronize stays in the editor. The task line updates, or the write waits until typing pauses. |
| TP-EDITOR-TYPE-DURING-PUSH | Same as TP-EDITOR-TYPE-DURING-SYNC for the 5-second open-note push. |
| TP-COMMENT-TT-DELETE | A comment removed in TickTick is removed from the note on the next sync, using the previous `taskCommentMaps` entry (any `origin`, including vault-pushed maps). A single mapped miss with empty Comments GET must **not** re-push even when Dexie `commentCount` is still >0 — including from reconcile (`vaultHasUnpushedCommentThreads`), `preparePersistNetwork`, and `flushActiveFilePush` / abyss comment sweep. Reconcile `behindComments` must attach `__ticktickComments` (same hint as `preparePersistNetwork`) so `mergeAbyssBlock` can strip; `_apiComments` alone is not enough (**F1** / #104). After strip: no stamp rewrite of that bullet, no new TickTick comment id, second sync quiet for that note. Live residual: [#104](https://github.com/semyon-alekseev-noveo/tt-sync/issues/104) / `104-analyst-f1-merge-hint.md` (2.0.86 fail; 2.0.87 agent pass voided by owner). |
| BUG-COMMENT-DELETE-REPOST | Residual of **TP-COMMENT-TT-DELETE**: (1) **F1** — `behindComments` omits `__ticktickComments` so merge cannot strip; (2) **F2** — flush re-POSTs while the bullet remains. H1 create gate + H2 merge strip are not enough without reconcile wiring. Distinct from **BUG-COMMENT-STALE-MAPS** (multi mapped miss still re-pushes). |
| BUG-COMMENT-VAULT-WIPE | When all Abyss comment bullets are removed and the push path sets `obsidianRemovedCommentBullets` (line-hash change), **Synchronize** must `deleteTaskComment` for **vault-origin** mapped TT comments; TT-only comments survive (**BUG-COMMENT-EMPTY-VAULT-WIPE**). Dexie maps alone / coordinator probe without the hash flag must not wipe. `- >` description lines are not Comments API. |
| BUG-COMMENT-RECONCILE-UPDATE | When Dexie marks a task `update` (`updatedAt` > `lastVaultSync`), vault reconcile must still run comment probe/push (`vaultLineBehindTask`). `vaultHasUnpushedCommentThreads` re-pushes when **several** mapped threads are missing from an empty GET (`test-11-12` / STALE-MAPS); a **single** mapped miss waits for pull (**TP-COMMENT-TT-DELETE**). When vault is comment-ahead and push is still needed (`vaultWantsPush`), reconcile must **not** set `behindComments` (pull); only TT-delete-pending vault-ahead may pull. After a no-op / failed vault-ahead push (`vaultWantsPush && !pushed`), reason must stay **`vault-comments-ahead`** (localEdit), never **`in-sync`**. |
| BUG-COMMENT-DISK-READ | `vaultLineBehindTask` must use on-disk note text (`syncRead`) for comment bullets, not a partial open-editor buffer. Dexie-only `remoteOnly` map upsert must not report push success (`vault-comments-ahead` when TT still empty). |
| BUG-COMMENT-API-POST-500 | Plugin `addTaskComment` via TickTick **v2** `POST .../task/{id}/comment` must create a comment (HTTP 2xx + usable id) when auth works for GET comments / getTask. Body must match the web client (`id`, `taskId`, `projectId`, `createdTime`, `title`, …) — `{ title }` / `{ title, content }` alone returns HTTP 500 `unknown_exception`. Empty 200 body still counts as success using the client-generated id (**2.0.74**). Evidence: `docs/pilot/results/PILOT-GATE-TEST-11-12/14-phase-1b-no-post.md`, `15-phase-2b-post-fix.md`. |
| BUG-COMMENT-ABYSS-VIEW | Adding a child comment on a synced task **from Abyss Tasks view** (stay in Abyss; do not open the markdown editor) must still schedule the debounced open-note push and land in TickTick **Comments**. `vault.modify` must notify the push scheduler; flush must not require `getActiveFile()` to match; Abyss/background flush uses full comment sweep (`identifiedOnly: false`). Evidence: `docs/pilot/results/BUG-COMMENT-ABYSS-VIEW/`. |
| BUG-COMMENT-DUP-STAMP | After Abyss-view (or open-note) comment push, TickTick **Comments** must show **one** comment per vault thread by `normalizedCommentKey` — not a pair of vault-stamped title (`YYYY-MM-DD HH:MM: text`) and plain `text`. Observed on `task-11-16` after **BUG-COMMENT-ABYSS-VIEW** verify (COMMENTS 8 for 4 threads). Issue [#25](https://github.com/semyon-alekseev-noveo/tt-sync/issues/25). Fixed **2.0.76**: dedupe remote twins, plain-only POST, skip create when key already on TT. |
| BUG-COMMENT-VAULT-DUP-KEY | Vault Abyss comment bullets under one task must be **one line per** `normalizedCommentKey` — not wall-clock stamp + ISO stamp twins for the same text. Observed on `task-11-16` / `2026-10-19.md` after Abyss push + pull (8 bullets / 4 keys); sticky `local-edit`. Issue [#27](https://github.com/semyon-alekseev-noveo/tt-sync/issues/27). **2.0.79** added merge collapse only (quiet sync still left twins). Fixed **2.0.80**: `vaultLineBehindTask` marks `vault-comment-dup-keys` so Synchronize rewrites via `mergeAbyssBlock` / collapse when twins exist even if TT keys already match. |
| BUG-COMMENT-EMPTY-VAULT-WIPE | Removing vault Abyss comment bullets must delete only **vault-origin** TickTick comments; TT-only (`origin: remote` / unmapped) survive. Empty vault read without `obsidianRemovedCommentBullets` must not wipe. Issue [#28](https://github.com/semyon-alekseev-noveo/tt-sync/issues/28). Fixed **2.0.79**. |
| BUG-COMMENT-GET-FAIL-OPEN | Failed / unparseable `getTaskComments` must return unknown (`null`), not `[]`. Push must not re-create every mapped vault thread. Issue [#29](https://github.com/semyon-alekseev-noveo/tt-sync/issues/29). Fixed **2.0.79**. |
| PILOT-GATE-TEST-11-12 | Pilot gate on Thinkpad-tts-test: `00 Inbox/2026-10-21.md` task `test-11-12` (`6ad83bc73e30f4429d749e09`). After **Synchronize**, TickTick **Comments** contain `comment 1` and `test-new-verision`; `- > new` stays task body only. Tracked in `docs/pilot/PILOT-GATE-TEST-11-12.md`. |
| TP-NO-SELF-REPUSH | A file the plugin just wrote is not treated as a local edit on the next sync. The 5-second open-note push does not call the Comments API when no comment line changed. |
| TP-COMPLETE-DURING-TYPE | Completing a task checks that task line only. Text typed on another line stays. If that task line changed after the read, it is left alone. Typing in the last two seconds defers the check. |
| TP-UNCOMPLETE-DURING-TYPE | Reopening a task clears that task line only, with the same rules as TP-COMPLETE-DURING-TYPE. |
| TP-JOURNAL-EDITOR-PATCH | An open-note line patch is written to `.tickticksync/journal` before the editor changes. `before` and `after` are the buffer. A patch that does not land has no committed record. |
| TP-UNDO-EDITOR-PATCH | Undo last sync, preview, and restore task version reverse that patch when the note is open and when it is closed. |
| TP-NO-CARET-REWRITE | After the 5-second open-note push, typing a new version of that same line and waiting past the 2-second typing pause must not be overwritten by the next full sync. The editor line stays the typed text. No editor transaction rewrites that line. |
| TP-ACTIVE-PUSH-DURING-SYNC | A 5-second open-note push that comes due while a sync is running is run after that sync, not dropped. A file saved during the sync is a local edit on the next sync. `lastVaultPushWallMs` is the start of the push phase. A file this plugin wrote is excluded by path and mtime. |
| TP-NO-STALE-VIEW-READ | During a sync or a 5-second push, Obsidian's own `vault.read` is not replaced. A modify listener registered before the run reads the new disk text. |
| TP-ABYSS-LOCAL-CHILD-KEEP | Rewriting an Abyss block keeps a description or comment the user edited locally and has not pushed. The previous TickTick comment does not reappear beside the edit. |
| TP-TWO-LEAVES | A line patch for one file is applied to one editor. A second leaf showing that file is not patched again. |

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
| 2026-10-21 | Thinkpad-tts-test | 2.0.62 | agent (Obsidian CLI) | BUG-COMMENT-STALE-MAPS / NOTE-L3b | partial | `00 Inbox/2026-10-19.md` `6ad83d…`: Abyss bullets on disk; **Synchronize** → `write-trace` `vault-comments-ahead`; MCP Comments not fully repopulated (probe comment only). Plugin **2.0.62** in vault folder. |
| 2026-10-21 | Thinkpad-tts-test | 2.0.72 | | PILOT-GATE-TEST-11-12 | not run | Gate: `6ad83bc…` / `2026-10-21.md`. Plan `docs/pilot/PILOT-GATE-TEST-11-12.md`. No pass until Phase 3 evidence. |
| 2026-10-21 | Thinkpad-tts-test | 2.0.73 | agent (Obsidian CLI) | PILOT-GATE-TEST-11-12 | fail | Reload + `tts-sync`. write-trace `vault-comments-ahead` (not `in-sync`). Plugin `getTaskComments` → **0** titles; body `new` OK. Evidence: `docs/pilot/results/PILOT-GATE-TEST-11-12/13-phase-3-verify.md`. |
| 2026-10-21 | Thinkpad-tts-test | 2.0.73 | agent (Obsidian CLI) | BUG-COMMENT-API-POST-500 | fail | Dexie `taskCommentMaps` empty (task + global). Plugin `addTaskComment` → HTTP **500** `unknown_exception`; MCP Open API POST OK then deleted. Evidence: `docs/pilot/results/PILOT-GATE-TEST-11-12/14-phase-1b-no-post.md`. |
| 2026-10-21 | Thinkpad-tts-test | 2.0.74 | agent | BUG-COMMENT-API-POST-500 | pass | Webapp POST body + empty-200 client id. After reload + `tts-sync`: Comments **`comment 1`**, **`test-new-verision`**. Evidence: `15-phase-2b-post-fix.md`, `16-phase-3b-verify.md`. |
| 2026-10-21 | Thinkpad-tts-test | 2.0.74 | agent (Obsidian CLI) | PILOT-GATE-TEST-11-12 | pass (Comments) | Phase 3b: Comments non-empty for gate titles. write-trace for this sync incomplete (stall caveat). Evidence: `16-phase-3b-verify.md`. |
| 2026-10-21 | Thinkpad-tts-test | 2.0.74+local | agent (Obsidian CLI) | BUG-COMMENT-ABYSS-VIEW | pass | Abyss/`vault.modify` → `push-abyss-or-background`; `task-11-16` Comments include `comment 1`, `коммент 2`, verify bullets. Evidence: `docs/pilot/results/BUG-COMMENT-ABYSS-VIEW/`. Shipped as **2.0.75**. |
| 2026-10-21 | Thinkpad-tts-test | 2.0.76 | agent (Obsidian CLI) | BUG-COMMENT-DUP-STAMP | pass | After sync, `task-11-16` Comments = 4 plain titles (no stamped twins). Evidence: `docs/pilot/results/BUG-COMMENT-DUP-STAMP/`. |
| 2026-10-21 | Thinkpad-tts-test | 2.0.76 | agent (Obsidian CLI) | TP-NO-CARET-REWRITE / TP-ACTIVE-PUSH-DURING-SYNC / TP-NO-STALE-VIEW-READ / TP-EMPTY-EDITOR-DISK | pass | #16 open-note cluster. Evidence: `docs/pilot/results/PILOT-BATCH-EDITOR-SAFETY/16-open-note-editor.md`. |
| 2026-10-21 | Thinkpad-tts-test | 2.0.76 | agent | BUG-COMMENT-VAULT-DUP-KEY | fail | `2026-10-19.md` has 8 Abyss bullets (wall-clock + ISO) for 4 keys; sticky `local-edit`. Issue #27. |
| 2026-10-22 | unit | 2.0.79 | agent | BUG-COMMENT-VAULT-DUP-KEY / EMPTY-VAULT-WIPE / GET-FAIL-OPEN | pass (unit) | Vitest **697**; pilot vault — **not run**. Issues #27/#28/#29. |
| 2026-10-22 | Thinkpad-tts-test | 2.0.79 | agent | release Synchronize smoke | pass | Deploy/reload/`tts-sync`; CP advanced; release https://github.com/semyon-alekseev-noveo/tt-sync/releases/tag/2.0.79. |
| 2026-10-22 | Thinkpad-tts-test | 2.0.79 | agent | BUG-COMMENT-VAULT-DUP-KEY | fail | `task-11-16` still ~21 Abyss lines after Synchronize (unit pass only). Evidence: `58-release-2.0.79-smoke.md`. Issue #27. |
| 2026-10-22 | unit | 2.0.80 | agent | BUG-COMMENT-VAULT-DUP-KEY | pass (unit) | Quiet sync marks `vault-comment-dup-keys`; vitest **701**. Issue #27. |
| 2026-10-22 | Thinkpad-tts-test | 2.0.80 (PR tip) | agent | BUG-COMMENT-VAULT-DUP-KEY | pass | Local deploy PR #60; `tts-sync` → `vault-comment-dup-keys`; `task-11-16` 20→4 bullets, no ISO. Evidence: `27-vault-dup-key-2.0.80-unit.md`. |
| 2026-10-22 | Thinkpad-tts-test | 2.0.80 (release) | agent | BUG-COMMENT-VAULT-DUP-KEY | pass | GitHub release assets deploy + Synchronize; `task-11-16` stays **4** wall-clock, no ISO. Evidence: `60-release-2.0.80-smoke.md`. Issue #27 closed. |
| 2026-10-23 | Thinkpad-tts-test | 2.0.81 | agent | TP-IDLE-ZERO | fail | Quiet ×2: `getTaskComments` **1757** / `getTaskById` **68**. Evidence: `docs/pilot/results/PERF-DELTA/81-idle-zero-2.0.81.md`. |
| 2026-10-23 | unit | tip (#82) | agent | TP-IDLE-ZERO-SWEEP | pass (unit) | commentCount backfill + idle-fast sync/preparePersist; live still fail on 2.0.82. |
| 2026-10-23 | Thinkpad-tts-test | 2.0.82 | agent | TP-IDLE-ZERO | fail | Quiet ×2: `getTaskComments` **1741** / `getTaskById` **68** (−16 vs 81). Evidence: `docs/pilot/results/PERF-DELTA/82-idle-zero-2.0.82.md`. #85 open; next #83. |
| 2026-10-23 | unit | tip (#83) | agent | TP-IDLE-MANUAL-SCOPE | pass (unit) | Narrow pre-pull + skip syncFiles re-sweep. |
| 2026-10-23 | Thinkpad-tts-test | 2.0.83 | agent | TP-IDLE-ZERO / TP-IDLE-MANUAL-SCOPE | fail / partial | Quiet ×2: comments **871** (~½ of 1741), `totalMs` ~250–276 s, `push` ~30 ms. Evidence: `PERF-DELTA/83-idle-zero-2.0.83.md`. #85 open. |
| 2026-10-23 | unit | tip (#94) | agent | TP-IDLE-EMPTY-SWEEP | pass (unit) | Empty-thread skip + deferCommentSweep. |
| 2026-10-23 | Thinkpad-tts-test | 2.0.84 | agent | TP-IDLE-ZERO / TP-IDLE-EMPTY-SWEEP | fail / pass | Quiet ×2: comments **0**, byId **44**, `totalMs` ~18 s. Evidence: `PERF-DELTA/84-idle-zero-2.0.84.md`. #85 open (byId). |
| 2026-10-23 | unit | tip (#98) | agent | TP-IDLE-BYID-ZERO | pass (unit) | ProjectScheme Dexie + parentChanged + list-move gate. |
| 2026-10-23 | Thinkpad-tts-test | 2.0.85 | agent | TP-IDLE-ZERO / TP-IDLE-BYID-ZERO | pass / pass | Quiet ×2: byId **0**, comments **0**, `totalMs` ~7 s. Evidence: `PERF-DELTA/85-idle-zero-2.0.85.md`. #85 close. |
| 2026-10-23 | unit | tip (#104) | agent | TP-COMMENT-TT-DELETE | pass (unit) | Single mapped miss + empty GET (any origin / stale count) → no re-push. Evidence: `TP-COMMENT-TT-DELETE/104-unit-fix.md`. |
| 2026-10-23 | Thinkpad-tts-test | 2.0.86 | agent | TP-COMMENT-TT-DELETE | fail | `behindComments` then `flushActiveFilePush` re-POST + stamp. Evidence: `TP-COMMENT-TT-DELETE/104-live-2.0.86.md`. |
| 2026-10-24 | Thinkpad-tts-test | 2.0.87 | owner | TP-COMMENT-TT-DELETE | fail | Re-prove voided agent pass (`commetn 1`). |
| 2026-10-24 | Thinkpad-tts-test | tip F1+F1b | agent | TP-COMMENT-TT-DELETE | pass ×2 | Two tasks. Evidence: `TP-COMMENT-TT-DELETE/104-live-f1-prove-twice.md`. |
| 2026-10-23 | Thinkpad-tts-test | 2.0.85 | agent | TP-DELTA-MCP-RENAME / COMMENT / CLOSE-DELETE | pass / pass(MCP) / pass | App rename/comment **not run**. Evidence: `PERF-DELTA/84-tp-delta-pilot.md`. #84. |
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
