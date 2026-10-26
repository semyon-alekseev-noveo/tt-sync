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
| AF-5 | A checkbox in any in-scope note with `#gtd/next` lands on the next-action list. The line does not move to another file. (`#type/next` migrates to `#gtd/next` — AF-GTD-PREFIX.) |
| AF-6 | Checking the box completes the TickTick task. Completing it in TickTick checks the same line. |
| AF-7 | Moving the task to another mapped list rewrites the stage tag on that same line. |
| AF-8 | A checkbox in a note outside `syncScopeFolders` is not pushed. |
| AF-NEST-1 | Two synced sibling checkboxes in an in-scope note. Nest the second under the first (Abyss View drag-onto-task / indent). Synchronize. TickTick: child `parentId` = parent task id; same list as parent; GTD stage tags unchanged unless the line tags changed. |
| AF-GTD-TAG-ADD | Synced task with one stage tag (`#gtd/next`). Writer **adds** another (`#gtd/waiting`) without removing the first. **Expected (Option A):** mover wins list; vault → exactly one stage tag; open-note ~1.2s; no stage conflict toast. See **AF-GTD-STAGE-MOVE**. |
| AF-GTD-STAGE-MOVE | Moving stage A → B means **replace**. After sync: one list-mapped stage tag (B); TT list = B. Spec: `docs/pilot/AF-GTD-STAGE-REPLACE.md`. **PO:** keep Option A. |
| AF-GTD-PREFIX | On load, `tagListMappings` / `tagMappings` LHS `type/…` → `gtd/…`; synced lines (`ticktick_id`) rewrite. New tasks use `#gtd/next` etc. Spec: `docs/pilot/AF-GTD-PREFIX.md`. |
| NOTE-L3b | A child comment line, title unchanged, Synchronize. The text shows in the TickTick Comments panel. The description stays in the task body. |
| NOTE-BODY-1 | Synced task; `syncNotes` on. Add an **upstream-style note** under the checkbox (indented block; optional `noteDelimiter`). Synchronize. TickTick task **body** (`content`/`desc`) contains that text; **Comments** panel does not gain a new comment for it; title unchanged. Spec: `docs/pilot/NOTE-BODY.md`. **unit pass**; live **pass** ×2 (Abyss `- >`). |
| NOTE-BODY-2 | Edit the same task’s note/body in TickTick. Synchronize. Vault note block under the checkbox updates; Abyss comment bullets (if any) stay as comments. Spec: `docs/pilot/NOTE-BODY.md`. **unit pass** (pre-merge note base); live **fail** pre-fix — re-prove after merge. |
| BUG-NOTE-BODY-WIPE | Synced task with TT body text. Vault note empty or Abyss delimiter children (not `- >`) while another field changes. Synchronize. TickTick **body must not clear** unless the Abyss `- >` description was removed. Spec: `docs/pilot/NOTE-BODY.md`. **unit pass**; live **pass** ×2. |
| BUG-NOTEBOOK-NO-DELETE | TickTick Notebook note (`kind: NOTE`, optionally under a NOTE project) with **no** vault task line. Synchronize (including Phase 2 / orphan scan). The Notebook note **must remain** in TickTick — never treated as a vault-deleted task. Spec: `docs/pilot/NOTEBOOK.md`. **unit pass**; live **pass** ×2. |
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
| TP-COMMENT-TT-DELETE | A comment removed in TickTick is removed from the note on the next sync when that task's list is in `syncedLists`. Empty `syncedLists` skips vault reconcile (`behindComments` never runs; bullet stays) while the comment sweep may still push. The previous `taskCommentMaps` row is required (any `origin`). A sync that sees the same normalized key on the vault bullet and on TickTick with **no** Dexie row (API-seeded comment) must `upsertCommentMap` that TickTick id and must **not** POST. After delete, a single mapped miss with an empty Comments GET must **not** re-POST even when Dexie `commentCount` is still >0 — reconcile, `preparePersistNetwork`, and flush/sweep. Reconcile `behindComments` must attach `__ticktickComments` so `mergeAbyssBlock` can strip. Strip also needs a comment probe (`commentCount` mismatch or unknown). Live: **fail** on **2.0.88** box (API-seed, empty `syncedLists`, re-POST). Re-prove **not run**. [#104](https://github.com/semyon-alekseev-noveo/tt-sync/issues/104) stays open. |
| BUG-COMMENT-DELETE-REPOST | Residual of **TP-COMMENT-TT-DELETE**. **2.0.88** still re-POSTs when the bullet and the TickTick comment match by key and Dexie has no map (API-seed). F1 (`__ticktickComments` on `behindComments`) is already in **2.0.88** and is not this residual. Distinct from **BUG-COMMENT-STALE-MAPS** (several mapped misses still re-push). |
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
| 2026-10-26 | Thinkpad-tts-test | tip | agent (CLI+MCP) | NOTE-BODY-1 / wipe | **pass** ×2 | `- >` → TT content A/B; wipe kept TT body. BODY-2 **fail**. `NOTE-BODY/02-live-tip.md`. |
| 2026-10-26 | Thinkpad-tts-test | tip | agent (CLI+MCP) | NOTE-BODY-1 / wipe | **pass** ×2; BODY-2 **fail** | `NOTE-BODY/02-live-tip.md`. |
| 2026-10-26 | Thinkpad-tts-test | tip (#160) | agent (CLI+MCP) | BUG-NOTEBOOK-NO-DELETE | **pass** ×2 | NOTES `…d5a5` / `…f29e` (Inbox) + `…c2f6` (NOTE project) survived `tts-sync` ×2. `BUG-NOTEBOOK-NO-DELETE/160-notebook-no-delete.md`. |
| 2026-10-26 | Thinkpad-tts-test | **2.0.91** | agent (CLI+MCP) | AF-2 / AF-3 / AF-4 | **pass** | TT parent `…076e7` → note; Obs parent `…492fb`; AZ subtask `…492fc` parentId=`…492fb`. `STEP7-AF-PILOT-SOAK/162-af2-af3-af4-tip-2.0.91.md`. |
| 2026-10-26 | unit | tip (#152) | agent | BUG-NOTE-BODY-WIPE | **pass** (unit); live **not run** | `src/test/bugNoteBodyWipe.test.ts` — empty vault / delimiter must not clear TT body. |
| 2026-10-26 | unit | tip (#152) | agent | NOTE-BODY-1 / NOTE-BODY-2 / NOTE-BODY-3 | **pass** (unit); live **not run** | `src/test/noteBody.upstream.test.ts`; `docs/pilot/results/NOTE-BODY/01-unit-discovery.md`. |
| 2026-10-25 | Thinkpad-tts-test | **2.0.91** | agent (CLI+MCP) | AF-5 / NOTE-L3b×2 / AF-GTD-STAGE-MOVE / AF-6 / AF-7 | **pass** | Live regression; DEL-1/3 **not run**. `REGRESSION-2.0.91/01-…`. |
| 2026-10-25 | Thinkpad-tts-test | 2.0.89 | agent (Obsidian CLI + MCP) | AF-NEST-1 | **pass** | Child `…439` `parentId`=`…438`; same TTS-Inbox. `ABYSS-NEST-GTD/137-af-nest-gtd-pilot.md`. |
| 2026-10-25 | Thinkpad-tts-test | 2.0.89 | agent (Obsidian CLI + MCP) | AF-GTD-TAG-ADD | **fail** (vs desired) | Dual `#type/next`+`#type/waiting` stayed on vault; TT stayed TTS-nextAction (`…43a`). Evidence `ABYSS-NEST-GTD/137-…`. Pre–Option A. |
| 2026-10-25 | unit | tip (#137 Option A) | agent | AF-GTD-TAG-ADD | **pass** (unit) | Last stage → list; exclusive rewrite flag. |
| 2026-10-25 | Thinkpad-tts-test | tip #140 + hash-stuck fix | agent | AF-GTD-TAG-ADD | **pass** ×2 | P1 `…65b2` / P2 `…7c37` → waitingFor + single `#type/waiting`. `ABYSS-NEST-GTD/140-af-gtd-tag-add-option-a.md`. |
| 2026-10-25 | Thinkpad-tts-test | tip #144 local deploy | agent | AF-GTD-TAG-ADD | **pass** ×2 | Open-note next→waiting on P1/P2; BRAT 2.0.90 was pre-fix (`first type tag` toast). `ABYSS-NEST-GTD/144-…`. |
| 2026-10-25 | Thinkpad-tts-test | 2.0.89 tip (#134) | agent (Obsidian CLI) | BUG-ACTIVEZONE-COMMENT-SHUFFLE | pass ×2 | AF-3 siblings + AF-2 Overview→AZ hoist; comments stayed under tasks. `BUG-ACTIVEZONE-COMMENT-SHUFFLE/19-prove-2.0.89.md`. #19. |
| 2026-10-25 | unit | tip (#19) | agent | BUG-ACTIVEZONE-COMMENT-SHUFFLE | pass (unit) | `repairProjectNoteTasks` keeps comments with siblings; reorder subtrees. #19. |
| 2026-10-25 | Thinkpad-tts-test | 2.0.89 | agent (Obsidian CLI) | DEL-3 / CTX-D2 / AF-5 Inbox (#76 gate) | pass | Cancel keeps TT `…4f`; CTX-D2 single `#note/…`; AF-5 Inbox→nextAction `…51`. Evidence: `STEP7-AF-PILOT-SOAK/76-gate-del3-ctxd2-af5-inbox-2.0.89.md`. #76. |
| 2026-10-25 | Thinkpad-tts-test | 2.0.89 | agent (Obsidian CLI) | AF-8 | pass | `80 Sandbox/…` checkbox not pushed; no id; 0 journal; TT search []. Evidence: `STEP7-AF-PILOT-SOAK/75-af8-out-of-scope-2.0.89.md`. #75. |
| 2026-10-25 | Thinkpad-tts-test | 2.0.89 | agent (Obsidian CLI) | AF-7 | pass | Move `6add7baf…` nextAction→waitingFor; vault `#type/next`→`#type/waiting` same line. Evidence: `STEP7-AF-PILOT-SOAK/74-af7-list-move-tag-2.0.89.md`. #74. |
| 2026-10-25 | Thinkpad-tts-test | 2.0.89 | agent (Obsidian CLI) | AF-6 | pass | Vault `[x]`→TT status 2 (`6add7356…4c`); TT complete→vault `[x]` (`…4d`). Recurring not run. Evidence: `STEP7-AF-PILOT-SOAK/73-af6-complete-both-ways-2.0.89.md`. #73. |
| 2026-10-25 | Thinkpad-tts-test | 2.0.89 | agent (Obsidian CLI) | AF-5 | pass | Inbox `#type/next` → TTS-nextAction `6add71c5…`; line stayed in `abyss-active.md`. Evidence: `STEP7-AF-PILOT-SOAK/72-af5-type-next-2.0.89.md`. #72. |
| 2026-10-25 | Thinkpad-tts-test | 2.0.89 | agent (Obsidian CLI) | AF-4 | pass | Active Zone `AF-4 az-subtask 025900` → subtask `6add70a0…` of parent `6adcbea8…`; line stayed. Evidence: `STEP7-AF-PILOT-SOAK/71-af4-active-zone-subtask-2.0.89.md`. #71. |
| 2026-10-24 | Thinkpad-tts-test | 2.0.89 | agent (Obsidian CLI) | AF-3 | pass | Obs note → TT parent `6adcbea8…` on TTS-Projects; no `ticktick` tag; 2nd sync idle. Evidence: `STEP7-AF-PILOT-SOAK/70-af3-obs-project-note-2.0.89.md`. #70. |
| 2026-10-24 | Thinkpad-tts-test | 2.0.89 | agent (Obsidian CLI) | AF-2 | pass | TT parent `6adcb9f5…` → `10 Projects/AF-2 pilot parent 135930.md` + Active Zone; not a checkbox. Evidence: `STEP7-AF-PILOT-SOAK/69-af2-project-parent-2.0.89.md`. #69. |
| 2026-10-24 | Thinkpad-tts-test | 2.0.89 | agent (Obsidian CLI) | AF-1 | pass | Empty `syncedLists` → Synchronize; 0 new ids / stubs / `tt->obs` creates. Evidence: `STEP7-AF-PILOT-SOAK/68-af1-empty-syncedlists-2.0.89.md`. #68. |
| 2026-10-20 | Thinkpad-tts-test | 2.0.48 | Sam (manual) | AF-5 | partial | Checkbox in **project** (dishwasher / Active Zone): task on TTS-Projects, `#type/next` on line — not the plain-inbox AF-5 recipe; line stayed in vault. |
| 2026-10-24 | Thinkpad-tts-test | 2.0.89 | agent (Obsidian CLI) | BUG-DEFERRED-ID-PHASE2-DELETE | pass | `defer-18-134433` → TT + vault id; 0 deletes. Evidence: `PILOT-BATCH-EDITOR-SAFETY/18-deferred-id-2.0.89.md`. #18. |
| 2026-10-24 | Thinkpad-tts-test | 2.0.89 | agent (Obsidian CLI) | TP-EMPTY-SIDE-GUARD (empty-vault) | pass | Guard `empty-vault`, skip, checkpoint held, 0 deletes. Evidence: `PILOT-BATCH-EDITOR-SAFETY/17-empty-side-guard-2.0.89.md`. #17. |
| 2026-10-24 | Thinkpad-tts-test | 2.0.89 | agent (Obsidian CLI) | BUG-COMMENT-EMPTY-VAULT-WIPE | pass | `wipe-28-fixture`: vault-origin deleted; TT-only kept; quiet sync keeps it. Evidence: `PILOT-BATCH-EDITOR-SAFETY/28-empty-vault-wipe-2.0.89.md`. #28. |
| 2026-10-24 | Thinkpad-tts-test | 2.0.89 | agent (Obsidian CLI) | BUG-COMMENT-GET-FAIL-OPEN | pass ×2 | Injected null GET; 0 add/delete on `gate-comment-249` + `wipe-28-fixture`. Evidence: `PILOT-BATCH-EDITOR-SAFETY/29-get-fail-open-2.0.89.md`. #29. |
| 2026-10-24 | Thinkpad-tts-test | 2.0.89 | agent (Obsidian CLI) | NOTE-L3b / BUG-COMMENT-NO-PUSH | pass ×2 | `note-l3b-289-125855` / `note-l3b-289b-125921` → TT Comments. Evidence: `NOTE-L3B-RECHECK/65-note-l3b-2.0.89.md`. #65. |
| 2026-10-24 | Thinkpad-tts-test | 2.0.89 | agent (Obsidian CLI) | Pilot vault config (#64) | pass | Abyss Inbox tag `#inbox`; SyncTag `tts-test` + TTS-* `syncedLists`. Evidence: `PILOT-VAULT-CONFIG/64-pilot-config-2.0.89.md`. |
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
| 2026-10-24 | Thinkpad-tts-test | tip F1+F1b | agent | TP-COMMENT-TT-DELETE | pass ×2 | Vault-first only. Does not cover API-seed. Evidence: `TP-COMMENT-TT-DELETE/104-live-f1-prove-twice.md`. |
| 2026-10-24 | box | 2.0.88 | box | TP-COMMENT-TT-DELETE | fail | API-seed `post288-ttdelete-seed` re-POSTed as `6adc431e…`; bullet kept; `syncedLists` empty. Evidence: `TP-COMMENT-TT-DELETE/104-live-2.0.88-box.md`. #104 reopened. |
| 2026-10-24 | unit | tip (#104) | agent | TP-COMMENT-TT-DELETE | pass (unit) | Equal-key link stores the TickTick id; delete does not re-POST. Live re-prove **not run**. Evidence: `TP-COMMENT-TT-DELETE/104-api-seed-map.md`. |
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
