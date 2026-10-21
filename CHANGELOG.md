# Changelog

### Iteration 2026-10-21 07:50 UTC

- Context: Pilot **2.0.64**: manual sync logged **27** `addTaskComment` HTTP calls but `task-11-16` still had only two TickTick Comments; vault had `comment 2`–`comment 5`.
- Target: **BUG-COMMENT-PUSH-NO-ID** — comments must actually land in TickTick after push.
- Actions log: Parse POST `/comment` responses (`ok`/`result`/`data`); push plain comment text (no ISO stamp in TT title); `vaultHasUnpushedCommentThreads` when several stale maps + TT still has other comments; refresh remote before delete phase in `syncAbyssCommentsToTickTick`. Bump **2.0.65**.
- Validation: `npx vitest run` → **665 passed**; `npm run build` ok.
- Problems: Pilot **BUG-COMMENT-PUSH-NO-ID** — **not run** (deploy **2.0.65**, sync `2026-10-19.md`).
- To Be Done: Tag **2.0.65**; verify MCP `get_comment` on `6ad83d…`.
- References: `src/api/index.ts`, `src/sync/comments/match.ts`, `CHANGELOG.md`

### Iteration 2026-10-21 07:06 UTC

- Context: Pilot on **2.0.63**: TickTick comments pulled into Obsidian, but vault `comment 2` / `comment 3` did not reach TickTick after **Synchronize**.
- Target: **BUG-COMMENT-BOTH-WAYS** — reconcile must push vault-ahead threads before (or alongside) TT-ahead pull, not TT-ahead-only `behindComments`.
- Actions log: `VaultSyncCoordinator.vaultLineBehindTask` — push when `vaultAhead`, then still set `behindComments` when `remoteAhead`; test in `vaultCommentBehind.test.ts`. Bump **2.0.64**.
- Validation: `npx vitest run` → **659 passed**; `npm run build` ok.
- Problems: Pilot **BUG-COMMENT-BOTH-WAYS** — **not run** (deploy **2.0.64** to pilot, reload, sync `2026-10-19.md`).
- To Be Done: Tag **2.0.64**; pilot verify MCP Comments include `comment 2` and `comment 3`.
- References: `src/services/VaultSyncCoordinator.ts`, `ABYSS_FIRST_CASES.md`, `CHANGELOG.md`

### Iteration 2026-10-21 06:42 UTC

- Context: Pilot on **2.0.62**: Abyss comment did not reach TT; second comment created in TickTick disappeared after **Synchronize**.
- Target: Release **2.0.63** — **BUG-COMMENT-TT-AHEAD-NO-DELETE** plus shipped **2.0.61**/**2.0.62** comment fixes.
- Actions log: Push must not `deleteTaskComment` for TT-ahead keys (`remoteCommentKeysAheadOfVault`) because push runs before pull; **BUG-COMMENT-STALE-MAPS**, **BUG-COMMENT-NO-MASS-DELETE**, coordinator comment probe. Tests **658**; pilot MCP both TT comments after sync on **2.0.63**.
- Validation: `npx vitest run` → **658 passed**; `npm run build` ok; pilot `6ad83d…` kept `comment 1` + `pilot-tt-second-comment` after manual sync.
- Problems: Vault→TT push for new Abyss-only lines — still verify in UI after **2.0.63** BRAT install.
- To Be Done: Tag **2.0.63**; PR into `abyss-mapping`.
- References: `src/abyssCommentSync.ts`, `CHANGELOG.md`

### Iteration 2026-10-21 06:20 UTC

- Context: Pilot **Thinkpad-tts-test** `00 Inbox/2026-10-19.md` / `task-11-16`; agent ran Obsidian + **Synchronize**; MCP `get_comment` stayed empty while vault had Abyss bullets.
- Target: **BUG-COMMENT-STALE-MAPS** — push after mass TT wipe with stale Dexie maps; keep **TP-COMMENT-TT-DELETE** when TT still has other comments.
- Actions log: Rework `vaultHasUnpushedCommentThreads`; allow comment probe/push when mass-delete guard is `skip` but vault is ahead on keys; pilot line + deploy **2.0.62**. Automated **657** tests.
- Validation: `npx vitest run` → **657 passed**; pilot: `write-trace` `vault-comments-ahead` on `2026-10-19.md` (manual sync 06:17 UTC); MCP still showed only probe comment — plugin `addTaskComment` from Obsidian not confirmed in this run.
- Problems: Pilot **BUG-COMMENT-STALE-MAPS** — **partial** (reconcile push path fires; TT Comments panel not fully verified).
- To Be Done: User re-test from Abyss UI + **Synchronize** on **2.0.62**; tag release.
- References: `src/sync/comments/match.ts`, `CHANGELOG.md`

### Iteration 2026-10-21 05:52 UTC

- Context: Pilot after **2.0.60**: add Abyss comment on `2026-10-19.md` / `task-11-16`, **Synchronize** → all TickTick Comments deleted.
- Target: Hotfix **2.0.61** — **BUG-COMMENT-NO-MASS-DELETE** on push path.
- Actions log: `syncAbyssCommentsToTickTick` uses `plan.mapWithoutVault` + vault key set; skip TT deletes when `getTaskComments` returns `[]`; regression tests in `abyssCommentSync.test.ts`. Case in `ABYSS_FIRST_CASES.md`, `TEST_PLAN.md`. Bump **2.0.61**.
- Validation: `npx vitest run` → **655 passed**; `npm run build` ok.
- Problems: Pilot **BUG-COMMENT-NO-MASS-DELETE** — **not run** (pending BRAT **2.0.61**).
- To Be Done: Tag **2.0.61**; pilot re-sync `2026-10-19.md`.
- References: `src/abyssCommentSync.ts`, `CHANGELOG.md`

### Iteration 2026-10-21 05:38 UTC

- Context: CI failed **TP-COMMENT-TT-DELETE** after **2.0.59** `vault-comments-ahead` push treated mapped TT-deleted threads as unpushed vault edits.
- Target: Hotfix **2.0.60** on `abyss-mapping`.
- Actions log: `vaultHasUnpushedCommentThreads` — push only when vault comment bullets are not mapped deletions with `commentCount === 0`; else `behindComments` pull for merge strip. Bump **2.0.60**.
- Validation: `npx vitest run` → **653 passed**; `npm run build` ok.
- Problems: — 
- To Be Done: Tag **2.0.60**; BRAT on pilot.
- References: `commentSyncMatch.test.ts`, `CHANGELOG.md`

### Iteration 2026-10-21 05:30 UTC

- Context: Pilot `task-11-16` on `00 Inbox/2026-10-19.md` (ISO Abyss comment bullets, TT Comments empty); owner asked for push and release **2.0.59**.
- Target: Tag **2.0.59** on `abyss-mapping`.
- Actions log: **BUG-COMMENT-VAULT-AHEAD** — `VaultSyncCoordinator` pushes when vault has comment threads and TT API does not (no false `behindComments` pull). **BUG-COMMENT-MERGE-NO-STRIP** — empty Comments API without `commentCount: 0` does not drop vault bullets on merge. **BUG-COMMENT-MANUAL-PRE-PULL** — manual sync pre-pull walks all in-scope registered notes. Bump to **2.0.59**; `PO_STATUS.md`.
- Validation: `npx vitest run` → **93** files, **652 passed**; `npm run build` ok.
- Problems: Pilot NOTE-L3b / **BUG-COMMENT-VAULT-AHEAD** on Thinkpad after install — **not run** (pending BRAT **2.0.59**).
- To Be Done: BRAT **2.0.59**; re-sync `2026-10-19.md` and confirm TT Comments for `6ad83d003e30f4429d749e0a`.
- References: `ABYSS_FIRST_CASES.md`, `TEST_PLAN.md`, `CHANGELOG.md`

### Iteration 2026-10-21 05:05 UTC

- Context: PR #9 merged into `abyss-mapping`; owner asked for release **2.0.58**.
- Target: Tag **2.0.58** on `abyss-mapping`.
- Actions log: Bump `package.json`, `manifest.json`, `versions.json` to **2.0.58**; `PO_STATUS.md` install baseline. Ships PR #9: normalized comment keys (`planCommentSync`, **BUG-COMMENT-KEY-EQUIV**), no TT comment wipe when vault has no bullets (**BUG-COMMENT-NO-TT-WIPE**), active note in pre-pull push (**BUG-COMMENT-ACTIVE-NOTE**), `SyncRunContext` / `preparePhase` scaffold.
- Validation: `npx vitest run` → **93** files, **649 passed**; `npm run build` ok.
- Problems: Pilot **NOTE-L3b** / comment cases in `TEST_PLAN.md` — **not run**.
- To Be Done: `git push tt-sync 2.0.58`; BRAT **2.0.58** on Thinkpad-tts-test; pilot comment soak.
- References: `docs/COMMENT_SYNC_MODEL.md`, `TEST_PLAN.md`, `PO_STATUS.md`, `CHANGELOG.md`

### Iteration 2026-10-21 04:55 UTC

- Context: Owner said go on PR B — wire comment sync model to push/pull equivalence checks.
- Target: Branch `feat/comment-sync-wire` — **BUG-COMMENT-KEY-EQUIV** + modular scaffold + pilot comment fixes (merged as PR #9).
- Actions log: Wire `apiCommentsDifferFromVault` and `syncAbyssCommentsToTickTick` to `planCommentSync` / `normalizedCommentKey`; `mergeAbyssBlock` TT-delete hints use normalized keys; `src/sync/comments/*`, `SyncRunContext`, `preparePhase`, `pushLocalPaths`.
- Validation: `npx vitest run` → **93** files, **649 passed**; `npm run build` ok.
- Problems: Pilot **NOTE-L3b** / **BUG-COMMENT-KEY-EQUIV** not run on Thinkpad-tts-test.
- To Be Done: Release **2.0.58** (done in 05:05 iteration).
- References: `docs/COMMENT_SYNC_MODEL.md`, `TEST_PLAN.md`, `CHANGELOG.md`

### Iteration 2026-10-21 04:45 UTC

- Context: Owner asked for comment match model (Abyss stamp vs TickTick plain title) and failing tests before wiring push/pull.
- Target: `src/sync/comments/` + `docs/COMMENT_SYNC_MODEL.md`; no full wire to `apiCommentsDifferFromVault` yet.
- Actions log: `normalizedCommentKey`, `planCommentSync`, `commentSetsEquivalentByNormalizedKey`; tests `commentSyncKeys`, `commentSyncMatch`, `commentSyncModel` (`it.fails` wire test). Case **BUG-COMMENT-KEY-EQUIV**. Prior local fixes: **BUG-COMMENT-NO-TT-WIPE**, **BUG-COMMENT-ACTIVE-NOTE**, `preparePhase`, `pushLocalPaths`.
- Validation: `npx vitest run` → **648 passed**, **1 expected fail** (`commentSyncModel.test.ts` wire gap).
- Problems: Push/pull still use legacy fingerprints in places; pilot comments not re-validated.
- To Be Done: Wire `apiCommentsDifferFromVault` + `syncAbyssCommentsToTickTick` to `planCommentSync`; release **2.0.58**; continue sync phase extract.
- References: `docs/COMMENT_SYNC_MODEL.md`, `docs/SYNC_MODULARIZATION.md`, `CHANGELOG.md`

### Iteration 2026-10-21 04:10 UTC

- Context: Owner asked for modular sync plan after comparing with obsidian-todoist-plugin; reduce `TickTickService` god-object risk (`TECH-CIRC-1`).
- Target: Phase 0 scaffolding only — no behavior change to sync phases.
- Actions log: `src/sync/SyncRunContext.ts`; `src/sync/phases/types.ts` stub; `docs/SYNC_MODULARIZATION.md` (module map, PR 1 file list); `synchronizationInner` uses `createSyncRunContext` for pending-marker reconcile + debug `syncId`. `syncRunContext.test.ts`. `PROJECT_STATE.md` updated.
- Validation: `npx vitest run` → 89 files, **637 passed**; `npm run build` ok.
- Problems: Phase 1 extract not started; `guardedPull` / `locallyEdited` still on `TickTickService`.
- To Be Done: PR 1 per `docs/SYNC_MODULARIZATION.md`.
- References: `docs/SYNC_MODULARIZATION.md`, `PROJECT_STATE.md`, `CHANGELOG.md`

### Iteration 2026-10-21 03:58 UTC

- Context: Pilot repro **BUG-DEFERRED-ID-PHASE2-DELETE** on Thinkpad-tts-test (`00 Inbox/2026-10-21.md`, `test-10-35`) on **2.0.56**: TickTick task created while `%%[ticktick_id:: …]%%` deferred (caret on line) → false Phase 2 deletion prompt.
- Target: Release **2.0.57** on branch `feat/bug-deferred-id-phase2-delete`.
- Actions log: `pendingMarkerTaskIds` registry; `registerPendingMarkerTaskId` when marker write defers; `TaskDeletionHandler.processSyncRemovedTasks` skips pending ids; `prunePendingMarkerTaskIds` at sync start via `idsPresentInVault`. Regression `pendingMarkerDeletion.test.ts`. Docs in `ABYSS_FIRST_CASES.md`, `TEST_PLAN.md`, `PO_STATUS.md`. Bump `manifest.json`, `package.json`, `versions.json` to **2.0.57**.
- Validation: `npx vitest run` → 88 files, **635 passed**; `npm run build` ok.
- Problems: Pilot **BUG-DEFERRED-ID-PHASE2-DELETE** in `TEST_PLAN.md` is **not run**.
- To Be Done: PR into `abyss-mapping`; owner tags **2.0.57** after merge; pilot case on Thinkpad-tts-test.
- References: `TEST_PLAN.md`, `ABYSS_FIRST_CASES.md`, `PO_STATUS.md`, `CHANGELOG.md`

### Iteration 2026-10-21 03:32 UTC

- Context: Owner asked for release **2.0.56** after **TP-EMPTY-EDITOR-DISK** on `feat/tp-empty-editor-disk`.
- Target: Tag **2.0.56**.
- Actions log: Merged `feat/tp-empty-editor-disk` into `abyss-mapping`. **2.0.56** ships empty-editor repair (`repairEmptyEditorFromDisk`, disk fallback in `readNoteForWrite`, `syncDiskToMatchEditor` after open patch); `PO_STATUS.md` install baseline.
- Validation: `npx vitest run` → 87 files, **634 passed**; `npm run build` ok.
- Problems: Pilot **TP-EMPTY-EDITOR-DISK** in `TEST_PLAN.md` is **not run**.
- To Be Done: BRAT **2.0.56**; pilot empty-editor case on Thinkpad-tts-test.
- References: `TEST_PLAN.md`, `PO_STATUS.md`, `CHANGELOG.md`

### Iteration 2026-10-21 03:25 UTC

- Context: Pilot repro **BUG-EMPTY-EDITOR-DISK** on Thinkpad-tts-test (`00 Inbox/2026-10-20.md`): disk had text, markdown view empty after reopen on **2.0.55**.
- Target: **TP-EMPTY-EDITOR-DISK** / release **2.0.56** on branch `feat/tp-empty-editor-disk`.
- Actions log: `repairEmptyEditorFromDisk` on file-open and active-leaf focus; `readNoteForWrite` disk fallback when buffer empty; `syncDiskToMatchEditor` after open-note patch; `identifiedOnly` documented as **TP-NEW-TASK-NOT-5S**. Docs in `ABYSS_FIRST_CASES.md`, `TEST_PLAN.md`, `PO_STATUS.md`.
- Validation: `npx vitest run` → 87 files, **634 passed**; `npm run build` ok. Copied `dist/main.js` (+ manifest) to Thinkpad-tts-test plugin folder.
- Problems: Pilot **TP-EMPTY-EDITOR-DISK** row still **not run** after install.
- To Be Done: Manual pilot on Thinkpad-tts-test; PR into `abyss-mapping`.
- References: `TEST_PLAN.md`, `ABYSS_FIRST_CASES.md`, `PO_STATUS.md`, `CHANGELOG.md`

### Iteration 2026-10-21 02:50 UTC

- Context: Owner merged PR #6 (open note buffer rollback on 2.0.54) and asked for release **2.0.55**.
- Target: Tag **2.0.55**.
- Actions log: Bumped `package.json`, `manifest.json`, `versions.json` to **2.0.55**; `PO_STATUS.md` install baseline. **2.0.55** ships PR #6: `lastVaultSync` after vault save, cursor/selection defer spans, `syncRead` / `syncCachedRead`, local Abyss child keep in `mergeAbyssBlock`, optional `debugWriteTrace`, and related tests in `TEST_PLAN.md`.
- Validation: `npx vitest run` → 87 files, **631 passed**; `npm run build` ok.
- Problems: Pilot rows for **BUG-OPEN-NOTE-BUFFER** and prior **2.0.54** hotfix cases in `TEST_PLAN.md` are **not run**.
- To Be Done: BRAT **2.0.55**; pilot open-note-buffer and hotfix sections.
- References: `TEST_PLAN.md`, `PO_STATUS.md`, `CHANGELOG.md`

### Iteration 2026-10-20 15:20 UTC

- Context: On 2.0.54 the open note's editor buffer rolled back while the file on disk stayed current. It did not happen on 2.0.47. `commitVaultText` (PR #4) did not stop it.
- Target: No version bump. A local edit on the open line is pushed, not overwritten. The 5-second push is rescheduled when a sync is running. Obsidian's own `vault.read` is not replaced during a sync.
- Actions log: After a vault→TickTick save, `lastVaultSync` matches `updatedAt`. `vaultLineBehindTask` treats a hash mismatch as a local edit. A span that covers the cursor or selection is deferred while that editor has focus; the 2-second typing window still defers the whole file. One editor is patched per file. Notes large enough to skip the line diff use a prefix/suffix span while an editor is open. `lastVaultPushWallMs` is taken before the deletion-guard prefetch (that prefetch is `getUpdatedTasks`), and this run still compares files to the previous stamp. Plugin writes are excluded by path and mtime, only when the write moved the mtime. `app.vault.read` / `cachedRead` are not swapped; plugin code uses `syncRead` / `syncCachedRead` and does not cache a file open in an editor. `mergeAbyssBlock` keeps an unpushed local description or comment and does not put the old TickTick comment back beside it. The merge write-back in the 5-second push is skipped when the note changed after the push started. Setting `debugWriteTrace` (default off) logs each write and update decision to the console (`warn`, prefix `[write-trace]`) and to `<vault>/.tickticksync/write-trace.jsonl`. Reload the plugin after turning it on so the view-reload check is installed. Enable it in Settings → Write trace.
- Validation: `npx vitest run` → 87 files, **631 passed**; `npm run build` ok. The five new cases failed before the fix and pass now. Pilot rows in `TEST_PLAN.md` are **not run** (vault Thinkpad-tts-test).
- Problems: Pilot not run. A task with no `lineHash` still uses the field compare. An editor patch does not move disk mtime; a later autosave can look like a user edit. The second leaf is not patched. The `setViewData` check needs a reload.
- To Be Done: Pilot the new section. Do not tag from this branch.
- References: `TEST_PLAN.md`, `ABYSS_FIRST_CASES.md`, `PO_STATUS.md`

### Iteration 2026-10-20 14:15 UTC

- Context: Owner merged PR #4 (stale editor write hotfix) and PR #5 (mass-deletion guard) and asked for release **2.0.54**.
- Target: Tag **2.0.54**.
- Actions log: Bumped `package.json`, `manifest.json`, `versions.json` to **2.0.54**; `PO_STATUS.md` install baseline. **2.0.54** ships open-note writes through `commitVaultText`, redo journal patches for editor transactions, and mass-deletion / empty-side guard (`massDeleteGuard.ts`, settings, manual modal).
- Validation: `npx vitest run` → 85 files, **625 passed**; `npm run build` ok.
- Problems: Pilot hotfix rows and `TP-EMPTY-SIDE-GUARD` in `TEST_PLAN.md` are **not run**.
- To Be Done: BRAT **2.0.54**; pilot hotfix and deletion-guard cases.
- References: `TEST_PLAN.md`, `PO_STATUS.md`, `CHANGELOG.md`

### Iteration 2026-10-20 13:50 UTC

- Context: Owner asked to record open-editor line patches in the redo journal.
- Target: `commitVaultText` writes a journal entry before an `editor.transaction` and before a re-applied span, with the buffer from before and after. Undo restores that patch with the note open or closed. A patch that does not land is not committed.
- Actions log: `setNoteJournal` from `instrumentVault`. `makeEnv.read` uses the open editor. Cases **TP-JOURNAL-EDITOR-PATCH** and **TP-UNDO-EDITOR-PATCH** in `TEST_PLAN.md` (not run on a vault).
- Validation: `npx vitest run` → 84 files, **613 passed**; `npm run build` — this iteration. `noWholeNoteWrite.test.ts` still passes.
- Problems: Pilot **TP-JOURNAL-EDITOR-PATCH** and **TP-UNDO-EDITOR-PATCH** are not run. If the file changes again after the re-applied span was journaled, that record stays uncommitted and the note is not written.
- To Be Done: Pilot the two new rows.
- References: `src/services/vaultWrite.ts`, `src/redo/obsidian.ts`, `src/test/journalEditorPatch.test.ts`, `TEST_PLAN.md`

### Iteration 2026-10-20 11:40 UTC

- Context: Owner extended the stale-editor hotfix. `completeTaskInTheFile` and `uncompleteTaskInTheFile` still wrote the whole note with `vault.modify`.
- Target: Every note that may be open goes through `commitVaultText`. No version bump.
- Actions log: Checkbox complete and uncomplete, tag and link stamps, recurring roll, detach, duplicate-id strip, subtask reorder, tag rename, project-note repair, folder merge, `forceUpdates`, and undo restore/remap use the helper. `TEST_PLAN.md` adds **TP-COMPLETE-DURING-TYPE** and **TP-UNCOMPLETE-DURING-TYPE** (not run). A source scan refuses `vault.modify`, `vault.process`, `adapter.write`, and `editor.setValue` outside the helper.
- Validation: `npx vitest run` → 83 files, **607 passed**; `npm run build` — this iteration. Pilot rows stay **not run**.
- Problems: Journal jsonl (`.tickticksync/journal`) and CSV backups are new files, not open notes. Pilot rows stay **not run**.
- To Be Done: Pilot **TP-COMPLETE-DURING-TYPE** and **TP-UNCOMPLETE-DURING-TYPE**.
- References: `TEST_PLAN.md`, `src/services/vaultWrite.ts`, `src/test/noWholeNoteWrite.test.ts`

### Iteration 2026-10-20 11:10 UTC

- Context: Open note editor was cleared or reverted while the file on disk stayed current (`BUG-STALE-EDITOR-WRITE`). A comment deleted in TickTick stayed in the note, so the stale write ran on every sync.
- Target: No version bump. Network work finishes before the write snapshot. An open note is patched on matching task lines. A quiet second sync writes nothing.
- Actions log: `commitVaultText` refuses a stale `vault.process` and uses `editor.transaction` on open files. `readFileContent` checks `activeEditor.file`. `mergeAbyssBlock` drops comments present in the previous `taskCommentMaps` and absent from the Comments API. The 5-second push skips the comment sweep. `lastVaultPushWallMs` is set after vault writes. Cases in `ABYSS_FIRST_CASES.md`. `TEST_PLAN.md` hotfix section, the missing **2.0.52** section, and **After §3.5** items 1–2 marked done in **2.0.53**.
- Validation: `npx vitest run` → 81 files, **600 passed**; `npm run build` — this iteration. Pilot rows in the hotfix section are **not run**.
- Problems: `TP-EDITOR-*`, `TP-COMMENT-TT-DELETE`, and `TP-NO-SELF-REPUSH` are not run on the pilot. `TP-DELTA-*` are still not run, while `skipPushWhenTickTickRenamedVaultLine` stays off.
- To Be Done: Owner merges. Pilot the hotfix section. Do not tag from this branch.
- References: `TEST_PLAN.md`, `PO_STATUS.md`, `ABYSS_FIRST_CASES.md`

### Iteration 2026-10-20 09:10 UTC

- Context: Owner asked to release the idle-sync change.
- Target: Tag **2.0.53**.
- Actions log: Bumped `package.json`, `manifest.json`, `versions.json` to **2.0.53**; `PO_STATUS.md` install baseline.
- Validation: `npx vitest run` → **589 passed**; `npm run build` ok.
- Problems: `TP-IDLE-ZERO` and `TP-DELTA-*` not run on the pilot. Daily reconcile, closed, and trash are not in this tag.
- To Be Done: BRAT **2.0.53**; read one `[perf]` line on a quiet Synchronize.
- References: `TEST_PLAN.md`, `PO_STATUS.md`, `CHANGELOG.md`

### Iteration 2026-10-20 09:05 UTC

- Context: Owner asked to implement `docs/TICKTICK_DELTA_API.md` §3. §3.5 is still not run; defaults from §3.2 are in code.
- Target: Idle sync does not call `getTaskById` per quiet task. Echo uses `etag`.
- Actions log: `pull.ts` skips a row only when etags match. `vaultLineBehindTask` reads Dexie; `getTaskComments` only if `commentCount` ≠ vault threads. `skipPushWhenTickTickRenamedVaultLine` no longer fetches the task. Tests `TP-IDLE-ZERO`, `TP-ECHO-ETAG`.
- Validation: `npx vitest run` → **589 passed**; `npm run build` ok.
- Problems: Closed/trash endpoints and the daily job are not implemented. `updateTask` still refetches the task after a push. §3.5 rows stay **not run**.
- To Be Done: Run `TP-DELTA-*`, then daily reconcile if the pilot requires it.
- References: `docs/TICKTICK_DELTA_API.md`, `TEST_PLAN.md`, `CHANGELOG.md`

### Iteration 2026-10-20 08:40 UTC

- Context: Owner asked to release the comment round-trip fix after the **2.0.51** pilot fail.
- Target: Tag **2.0.52**.
- Actions log: Bumped `package.json`, `manifest.json`, `versions.json` to **2.0.52**; `PO_STATUS.md` install baseline.
- Validation: `npx vitest run` → 80 files, **587 passed**; `npm run build` — this iteration.
- Problems: NOTE-L3b not re-run on **2.0.52**.
- To Be Done: BRAT **2.0.52**; NOTE-L3b on the pilot.
- References: `TEST_PLAN.md`, `PO_STATUS.md`, `CHANGELOG.md`

### Iteration 2026-10-20 08:35 UTC

- Context: NOTE-L3b on **2.0.51** stripped vault comment bullets on **tt→obs** rewrite while TickTick Comments stayed empty.
- Target: A vault comment thread is the same entity as a TickTick comment: keep it across a line rewrite and push it before that rewrite.
- Actions log: `mergeAbyssBlock` keeps local comments unless they were in a synced `Comments:` block and are absent from the new block. `persistToFile` calls `syncAbyssCommentsToTickTick` before `convertTaskToLine`.
- Validation: `npx vitest run` → 80 files, **587 passed**.
- Problems: Pilot NOTE-L3b not re-run on this build.
- To Be Done: Build and re-run NOTE-L3b on the pilot.
- References: `src/abyssFormat.ts`, `src/fileOperation.ts`, `CHANGELOG.md`

### Iteration 2026-10-20 06:22 UTC

- Context: Owner installed **2.0.51** on pilot; requested tester run per `DEV_FLOW.md`.
- Target: **TP-BUG-COMMENT-NO-PUSH** / **NOTE-L3b** on Thinkpad-tts-test.
- Actions log: Added comment bullets on `gate-comment-249` (`6ad6f43a…`); **Synchronize** via Obsidian CLI (`vault=Thinkpad-tts-test`, `tickticksync-abyss:tts-sync`); MCP `get_comment`; journal `2026-10-20.jsonl`. Updated `TEST_PLAN.md`, `ABYSS_FIRST_CASES.md`, `PO_STATUS.md`.
- Validation: `npx vitest run` → **586 passed** (repo). Pilot NOTE-L3b → **fail**; TP1-CHILD-COMMENT → **fail**; sync completes (journal commits).
- Problems: Vault comment lines removed on **tt→obs** without TT Comments API entries; tag shuffle on `gate-comment-249` (`#note/note-l3b-gate` → `#note/abyss-active`); overlapping `sync-mvgaaegu` / `sync-mvg8smb7` at same second.
- To Be Done: Root-cause why `syncAbyssCommentsToTickTick` / sweep does not run or pull overwrites before map; consider isolated single-task note for next gate.
- References: `TEST_PLAN.md`, `ABYSS_FIRST_CASES.md`, `CHANGELOG.md`

### Iteration 2026-10-20 06:15 UTC

- Context: Owner merged PR #3 into `abyss-mapping` and requested release **2.0.51**.
- Target: Tag **2.0.51** (BUG-COMMENT-NO-PUSH pre-pull push, delta `add` parsing, delta API research doc).
- Actions log: Bumped `package.json`, `manifest.json`, `versions.json` to **2.0.51**; `PO_STATUS.md` install baseline.
- Validation: `npx vitest run` → 80 files, **586 passed**; `npm run build` → ok.
- Problems: NOTE-L3b live gate still **not run** on **2.0.51** build.
- To Be Done: BRAT **2.0.51** on pilot; **TP-BUG-COMMENT-NO-PUSH**; **TP-DELTA-*** per `docs/TICKTICK_DELTA_API.md`.
- References: `TEST_PLAN.md`, `PO_STATUS.md`, `CHANGELOG.md`

### Iteration 2026-10-20 06:10 UTC

- Context: Owner shared delta API research (`tt-sync-ticktick-delta-api.md`); canonical copy and small code alignment.
- Target: Preserve research in repo; stop dropping `syncTaskBean.add`; pilot plan for etag/comment policy.
- Actions log: Added `docs/TICKTICK_DELTA_API.md`; `getUpdatedTasks` merges `add` into `update`; `getUpdatedTasks.deltaAdd.test.ts`; `TEST_PLAN.md` TP-DELTA-*; pointers in `PROJECT_STATE.md`, `PO_STATUS.md`, `ANALYST_REFERENCE_DIAGRAMS.md`.
- Validation: `npx vitest run` → 80 files, **586 passed**; `npm run build` ok.
- Problems: etag echo and idle zero-probe remain design-only until TP-DELTA-* pilot.
- To Be Done: Run TP-DELTA-* on pilot; NOTE-L3b with BUG-COMMENT-NO-PUSH build.
- References: `docs/TICKTICK_DELTA_API.md`, `DEV_FLOW.md`, `CHANGELOG.md`

### Iteration 2026-10-20 06:00 UTC

- Context: Owner approved fix path for **BUG-COMMENT-NO-PUSH** per `DEV_FLOW.md`.
- Target: Pre-pull push must run when vault `mtime` > last push wall time even if TickTick checkpoint is newer.
- Actions log: `SyncMeta.lastVaultPushWallMs`; `pushLocalEditsFirst` uses it instead of checkpoint; integration test `BUG-COMMENT-NO-PUSH`.
- Validation: `npx vitest run` → **585 passed** (superseded by 06:10 run, 586 with delta test); `npm run build` ok in same session as 06:10.
- Problems: NOTE-L3b live gate still **not run** on build with this fix.
- To Be Done: Release or pilot copy; NOTE-L3b on `abyss-active.md`; merge via PR.
- References: `DEV_FLOW.md`, `TEST_PLAN.md`, `CHANGELOG.md`

### Iteration 2026-10-20 05:50 UTC

- Context: Owner installed **2.0.50** on pilot; requested TP-PERF performance test.
- Target: Run `TEST_PLAN.md` TP-PERF-* on **Thinkpad-tts-test**.
- Actions log: Obsidian CLI sync with session hooks on `endFull` / `console.info`; quiet-task check on `abyss-active.md` `6ad5bb47…`. Updated `TEST_PLAN.md` perf Results.
- Validation: TP-PERF-UI, TP-PERF-SAME, TP-PERF-R-SYNC-OK → pass; TP-PERF-LOG → partial (JSON line needs DevTools or single long-lived Obsidian session). `npx vitest run` perf tests → 10 passed; bench test → pass.
- Problems: Each `obsidian eval` reloads app package and clears hooks; file append hook did not fire when CLI sync ran without a stable desktop session.
- To Be Done: Sam — one manual `[perf]` JSON screenshot; TP-PERF-ACTIVE + R-FENCE/DUP/MOVE if needed.
- References: `TEST_PLAN.md`, `CHANGELOG.md`

### Iteration 2026-10-20 05:15 UTC

- Context: Owner merged PR #2 into `abyss-mapping` and requested release **2.0.50**.
- Target: Tag **2.0.50** (vault id index, per-sync file cache, `[perf]` sync timings).
- Actions log: Bumped `package.json`, `manifest.json`, `versions.json` to **2.0.50**; `PO_STATUS.md` install baseline.
- Validation: `npx vitest run` → 79 files, 584 passed; `npm run build` → ok.
- Problems: NOTE-L3b / BUG-COMMENT-NO-PUSH still open on pilot; TP-PERF-* not run live yet.
- To Be Done: BRAT **2.0.50** on pilot; TP-PERF-* rows in `TEST_PLAN.md`; return to comment push fix.
- References: `TEST_PLAN.md`, `PO_STATUS.md`, `CHANGELOG.md`

### Iteration 2026-10-20 04:45 UTC

- Context: Owner requested release **2.0.49**, cleanup pilot test notes/tasks, assess PR #2 merge.
- Target: Tag **2.0.49** (comment sweep + ticktick id leak fixes); remove `manual-test.md` / `tp1-cli-smoke.md` and related TT tasks on pilot vault.
- Actions log: Version **2.0.49**; push tag to `tt-sync`. Deleted pilot notes under `00 Inbox/`; deleted TickTick tasks `6ad6e474…`, `6ad6ea84…`, `6ad6ea86…`, `6ad6d78f…`, `6ad6d915…` on TTS-Inbox project.
- Validation: `npx vitest run` → 75 files, 572 passed; `npm run build` → ok.
- Problems: PR #2 branch **behind** `abyss-mapping` by 3 commits (draft); rebase before merge.
- To Be Done: BRAT **2.0.49** on pilot; re-run NOTE-L3b; rebase/merge PR #2 after owner review.
- References: `PO_STATUS.md`, `CHANGELOG.md`

### Iteration 2026-10-20 04:30 UTC

- Context: PO попросил завести три пункта в `PO_STATUS.md` и продолжить по `DEV_FLOW.md` после ручного пилота 2.0.48.
- Target: Зафиксировать P0/P1 баги; regression tests + mitigations для Comments sweep и loose `ticktick_id`.
- Actions log: `PO_STATUS.md` — BUG-COMMENT-NO-PUSH, BUG-ACTIVEZONE-COMMENT-SHUFFLE, BUG-TICKTICK-ID-LEAK; кейсы в `ABYSS_FIRST_CASES.md`. `TaskModificationDetector.sweepAbyssCommentsInFile`; `taskParser` canonical id + title strip. Tests `bugCommentNoPush.test.ts`, `bugTicktickIdLeak.test.ts`.
- Validation: `npx vitest run` → 75 files, **572 passed**; `npm run build` → ok.
- Problems: BUG-ACTIVEZONE-COMMENT-SHUFFLE open; pilot NOTE-L3b not re-run on new build.
- To Be Done: Deploy build to pilot; NOTE-L3b; repro test for Active Zone shuffle.
- References: `PO_STATUS.md`, `DEV_FLOW.md`, `CHANGELOG.md`

### Iteration 2026-10-20 03:05 UTC

- Context: Owner enabled Obsidian CLI; asked to run `TEST_PLAN.md` on pilot vault **2.0.48**.
- Target: Execute pilot rows where CLI + **Synchronize** + TickTick MCP suffice; record honest pass/fail.
- Actions log: `00 Inbox/tp1-cli-smoke.md`; `obsidian command id=tickticksync-abyss:tts-sync`; journal wait on `.tickticksync/journal/2026-10-20.jsonl`; MCP task/comment checks. Updated `TEST_PLAN.md` Results and `ABYSS_FIRST_CASES.md` gate log.
- Validation: pass — TP1-NEW-ON-SYNC, TP1-CHILD-DESC, TP1-R-SYNC-OK, TP1-R-CHECKPOINT. fail — TP1-CHILD-COMMENT, TP1-R-TITLE, NOTE-L3b (Comments API). not run — debounce/editor/modal/network rows.
- Problems: Comment bullets do not reach TickTick Comments on vault-disk + sync path (open). Title rename via `vault.modify` lost on pull (TP1-R-TITLE). `syncRunning` unreliable after manual clear; journal `commit` lines are the completion signal.
- To Be Done: UI pass for debounce rows; fix or case-id comment push from `pushLocalEditsFirst`; manual AF-5 + DEL-* gate.
- References: `TEST_PLAN.md`, `ABYSS_FIRST_CASES.md`, `CHANGELOG.md`

### Iteration 2026-10-20 02:40 UTC

- Context: Owner requested release **2.0.48** then pilot tests per `TEST_PLAN.md` / `ABYSS_FIRST_CASES.md`.
- Target: Tag **2.0.48** on merged PR #1 (`fail-closed` pull, debounced open-file push, child-comment push, integration test); run automated gate and deploy build to pilot vault.
- Actions log: Bumped `package.json`, `manifest.json`, `versions.json` to **2.0.48**; `npx vitest run` and `npm run build` on `8f58d9a` + version commit; push tag `2.0.48` to `tt-sync` (GitHub Actions release zip). Copied `dist/*` into `<pilot-vault>/.obsidian/plugins/tickticksync-abyss/`. Stash `pre-PR1-merge WIP` not merged (conflicts); comment-hash sweep deferred.
- Validation: `npx vitest run` → 73 files, **569 passed**; `npm run build` → ok. Manual TP1-* / AF gate: **not run** — Obsidian was not running on the test host (`pgrep` empty); pilot plugin files updated to **2.0.48** for the next Obsidian session.
- Problems: Manual rows remain **not run** until owner opens pilot Obsidian and executes steps (or BRAT pull after release assets publish).
- To Be Done: Run live gate AF-5 → NOTE-L3b → DEL-1 → DEL-3; fill `TEST_PLAN.md` Results; set BRAT frozen version to **2.0.48** after release zip is live.
- References: `TEST_PLAN.md`, `ABYSS_FIRST_CASES.md`, `DEV_FLOW.md`, `CHANGELOG.md`

### Iteration 2026-10-20 02:25 UTC

- Context: Owner approved merge of cloud PR #1 (`cursor/dev-flow-reliability-816a`) into `abyss-mapping`.
- Target: Land dev flow docs, fail-closed sync, integration test, and analyst reference diagrams without reverting PR #1 PO statuses.
- Actions log: Fast-forward merge to `0a9b805`; added `docs/ANALYST_REFERENCE_DIAGRAMS.md`; linked from `PO_STATUS.md` and `DEV_FLOW.md`. Local pre-merge WIP remains in git stash `pre-PR1-merge WIP` (not applied).
- Validation: `npx vitest run` → 73 files, 569 passed; `npm run build` → ok.
- Problems: Version still **2.0.47** in `manifest.json` until owner tags next release; stash may contain comment-hash sweep to replay in a follow-up branch.
- To Be Done: Push `abyss-mapping`; pilot TP1-* and AF gate (`TEST_PLAN.md`, `ABYSS_FIRST_CASES.md`); optionally cherry-pick stash comment fixes.
- References: `DEV_FLOW.md`, `docs/ANALYST_REFERENCE_DIAGRAMS.md`, `CHANGELOG.md`

### Iteration 2026-10-19 17:24 UTC

- Context: First slice of the large-vault performance review. Do not change sync results. The `getTaskById` / `getTaskComments` probe in `vaultLineBehindTask` stays for a later PR.
- Target: Per-run timings and counters; an id→path index with the same hits as `String.includes`; a per-run cache of file text and `NewFileMap`.
- Actions log: Branch `cursor/sync-perf-index-cache-aa83`, rebased onto `abyss-mapping` after PR #1 and **2.0.49**. No version bump. No tag. No merge.
- Validation: `npx vitest run` → 77 files, 581 passed; `npm run build` → ok. Synthetic vault 2000 notes / 5000 tasks: id scan 555.8 ms → 5.1 ms, file reads 6000 → 4000, reconcile 586.9 ms → 22.3 ms. Idle-sync `getTaskById` baseline stays 3. Live vault and pilot Obsidian were **not** run.
- Problems: RISK-LARGE-VAULT is only partly mitigated. `ensureVaultFilesRegistered` still walks every markdown file, and a quiet task is still probed with `getTaskById`.
- To Be Done: Owner merges PR #2; run TP-PERF-* on `<pilot-vault>`.
- References: `TEST_PLAN.md`, `ABYSS_FIRST_CASES.md` PERF-INDEX, PERF-CACHE, PERF-COUNTERS, `CHANGELOG.md`

### Iteration 2026-10-19 16:55 UTC

- Context: Owner rule — every behavior change is recorded in the test plan, in the same PR.
- Target: `TEST_PLAN.md` for PR #1; the rule in `DEV_FLOW.md`, `AGENTS.md`, `.cursor/rules/dev-flow.mdc`.
- Actions log: Manual cases for the open-note debounce, child comment/description push, fail-closed pull, load notice, comment fingerprints, comment-map cleanup, and the regressions those must not break. Pilot status is **not run**.
- Validation: docs only; `npx vitest run` and `npm run build` re-run on this commit.
- Problems: None in code. Startup sync still runs auto-cleanup after a failed pull; manual and scheduled sync skip it. The test plan says so.
- To Be Done: A person or a local agent runs the TP1-* rows on `<pilot-vault>`.
- References: `TEST_PLAN.md`, `DEV_FLOW.md`

### Iteration 2026-10-19 15:30 UTC

- Context: Owner asked for one development flow and the P1/P2 reliability fixes before another live soak. Version stays **2.0.47** until the owner releases.
- Target: `DEV_FLOW.md`; fail-closed pull; honest notice; parent push on a child comment line; debounced open-file push; API comments in `vaultLineBehindTask`; comment-map cleanup; `synchronizationInner` integration test; docs aligned to the code.
- Actions log: Branch `cursor/dev-flow-reliability-816a`. No tag. No merge.
- Validation: `npx vitest run` → 73 files, 569 passed; `npm run build` → ok. Live vault and pilot Obsidian were **not** run.
- Problems: GAP-COMMENT-EDIT, untagged Abyss Inbox, `tp_…` revoke, NOTE-L3b / AF gate still open. Stamp test in `abyssCommentSync.test.ts` now expects the local wall-clock of `createdTime` so UTC CI matches a +07 machine.
- To Be Done: Owner merges. Human or local agent runs the one live gate on `<pilot-vault>`.
- References: `DEV_FLOW.md`, `PO_STATUS.md`, `ABYSS_FIRST_CASES.md`, `src/test/synchronizationInner.integration.test.ts`

### Iteration 2026-10-19 14:10 UTC

- Context: Release **2.0.47** shipped; three read-only analysts reviewed Abyss tasks, plugin architecture, sync stability.
- Target: Tag/push 2.0.47; consolidate findings into `PO_STATUS.md`.
- Actions log: Committed 47505f5; tagged `2.0.47`; pushed `abyss-mapping` + tag to `tt-sync`; rewrote `PO_STATUS.md`; refreshed `PROJECT_STATE.md`.
- Validation: `npx vitest run` → 67 files, 550 passed; `npm run build` → ok; `git ls-remote tt-sync` shows branch and tag at 47505f5.
- Problems: First branch push got `remote: fatal error in commit_refs`; retry succeeded (resolved). Analyst P0 claim (checkpoint skip) downgraded to P1 BUG-SYNC-SILENT-FAIL after code check.
- To Be Done: Fail-closed pull + honest notice; child comment-line push; integration test for `synchronizationInner`.
- References: `PO_STATUS.md`, `PROJECT_STATE.md`, `CHANGELOG.md`

### Iteration 2026-10-19 13:40 UTC

- Context: Pilot — comments not in TT Comments UI; duplicate `note/`/`proj/` tags (BUG-COMMENT-1, BUG-TAG-1).
- Target: **2.0.47** fixes + smoke IDs NOTE-L3b, NOTE-C1, CTX-D1/D2 in `SMOKE_TESTS.md`.
- Actions log: Comment sync on hash-unchanged path; tag mirror strip/dedupe; automated NOTE-C1 / CTX-D1.
- Validation: `npx vitest run` → 550 passed; `npm run build` → ok.
- Problems: Live CTX-D2 on polluted tasks needs one re-sync after upgrade.
- To Be Done: BRAT **2.0.47**; run NOTE-L3b on «юбка» task.
- References: `SMOKE_TESTS.md`, `CHANGELOG.md`

### Iteration 2026-10-19 13:10 UTC

- Context: PO needs Abyss comments in TickTick **Comments** UI, not embedded in task body.
- Target: **2.0.46** — Phase 1 `syncAbyssCommentsViaApi` (default on with Abyss format).
- Actions log: Tick API `get/add/delete` comment; `abyssCommentSync.ts`; Dexie `taskCommentMaps`; push in `TaskModificationDetector`; pull in `fileOperation` + `convertTaskToLine`; setting in `NotesSettings.svelte`.
- Validation: `npx vitest run` → 545 passed; `npm run build` → ok.
- Problems: Comment edit = delete+recreate; live NOTE-L3 on pilot vault still manual.
- To Be Done: BRAT **2.0.46**; re-sync tasks with old `Comments:` in `content` to migrate.
- References: `TT_ABYSS_ROADMAP.md` Phase 1, `SMOKE_TESTS.md`, `CHANGELOG.md`

### Iteration 2026-10-19 12:52 UTC

- Context: PO reported comment sync “not working”; need smokes for 2.0.40–2.0.45 behaviour.
- Target: Document **content**-field comments vs TT Comments API; automate NOTE-A*; extend live matrix.
- Actions log: `src/test/notesSmoke.test.ts`; `SMOKE_TESTS.md` (UX, COMMENT expectations, NOTE-L*); `GTD_SYNC_CASES.md` §10 CASE-AN*.
- Validation: `npx vitest run src/test/notesSmoke.test.ts` → 5 passed; full suite 541 passed.
- Problems: Native TT comment UI still **open** (Phase 1); live NOTE-L3 not executed in vault this iteration.
- To Be Done: PO run NOTE-L3 on disk + MCP `content`; implement Phase 1 if Comments UI required.
- References: `TT_ABYSS_ROADMAP.md`, `SMOKE_TESTS.md`, `CHANGELOG.md`

### Iteration 2026-10-19 12:50 UTC

- Context: PO wants one palette sync command; full pull duplicated startup behavior.
- Target: **2.0.45** — remove **Synchronize (full pull from TickTick)**; keep **Synchronize** + ribbon.
- Actions log: Dropped `tts-sync-full` from `registerSyncUi()`; updated `SMOKE_TESTS.md`, `PROJECT_STATE.md`.
- Validation: `npm run build` ok.
- Problems: Manual full pull only via reload Obsidian (startup still uses `synchronization(true)`).
- To Be Done: Optional setting for manual full pull if needed later.
- References: `src/main.ts`, `CHANGELOG.md`

### Iteration 2026-10-19 12:42 UTC

- Context: User saw renamed palette entries; ribbon sync icon missing while startup sync blocked `pluginLoad`.
- Target: **2.0.44** — restore **Synchronize** naming; register ribbon in `onload` with commands.
- Actions log: `registerSyncUi()` adds ribbon + both commands; removed duplicate ribbon from `pluginLoad`.
- Validation: `npx vitest run` → 536 passed; `npm run build` → ok.
- Problems: No changes.
- To Be Done: BRAT **2.0.44** + reload.
- References: `src/main.ts`, `CHANGELOG.md`

### Iteration 2026-10-19 12:28 UTC

- Context: Palette had no sync commands while startup sync blocked deferred `pluginLoad`.
- Target: **2.0.43** — register sync commands synchronously in `onload`.
- Actions log: `registerSyncPaletteCommands()`; names **TickTickSync: Synchronize** / **Full synchronize from TickTick**.
- Validation: `npx vitest run` → pass; `npm run build` → ok.
- Problems: Startup sync still blocks other features until it finishes; commands now visible immediately.
- To Be Done: BRAT **2.0.43**; search palette `TickTick` or `sync`.
- References: `src/main.ts`, `CHANGELOG.md`

### Iteration 2026-10-19 12:15 UTC

- Context: Docs and smokes for notes/context tags; palette lost one-shot full TickTick pull.
- Target: **2.0.42** — restore command; document NOTE-* / CTX-*; automated SYNC-12.
- Actions log: `tts-sync-full` in `src/main.ts`; `SMOKE_TESTS.md` sections; `syncSmoke.test.ts` SYNC-12; version bump.
- Validation: `npx vitest run` → 536 passed; `npm run build` → ok; MCP `test 3` still `obsidian` only until vault re-sync with **2.0.41+**.
- Problems: Live CTX-1/2 need Obsidian push after **2.0.41+**; `40 KB/` out of default scope.
- To Be Done: BRAT **2.0.42**; user re-sync Active Zone child for `proj/` tag; Phase 1 comments.
- References: `SMOKE_TESTS.md`, `CHANGELOG.md`

### Iteration 2026-10-19 12:02 UTC

- Context: PO asked for TickTick filter tags mirroring Abyss grouping by source note (and project MOC), not only `parentId`.
- Target: **2.0.41** — push `note/<slug>` / `proj/<slug>` on sync; strip on pull.
- Actions log: `src/contextTags.ts`; hook in `convertLineToTask` / `convertTaskToLine`; setting `syncNoteContextTags` (Abyss format); UI in `NotesSettings.svelte`; preset `TTS-data-preset.json`.
- Validation: `npx vitest run` → 535 passed; `npm run build` → ok.
- Problems: `40 KB/` still outside default `syncScopeFolders` — add folder to push log tasks.
- To Be Done: Phase 1 TT Comments API; re-sync lines to attach tags in TickTick.
- References: `TT_ABYSS_ROADMAP.md`, `CHANGELOG.md`

### Iteration 2026-10-19 11:45 UTC

- Context: PO confirmed L1+L3; TT tasks lack project/note context vs Abyss grouping.
- Target: Document Abyss UI grouping vs TT `parentId`/lists; propose C1–C6 in roadmap.
- Actions log: Expanded `TT_ABYSS_ROADMAP.md` Phase 2b; verified `test 3` has `parentId` on TTS-Projects.
- Validation: MCP `get_task_by_id` for Active Zone child shows parent link; inbox tasks do not.
- Problems: Empty `project:` on task notes breaks `resolveForFile` (`open` in vault).
- To Be Done: Implement C2 `projectContextTag`; Phase 1 comments API.
- References: `TT_ABYSS_ROADMAP.md`, `CHANGELOG.md`

### Iteration 2026-10-19 11:30 UTC

- Context: Pilot confirmed Abyss comments need Enter to persist; descriptions sync in 2.0.40; user wants TT Comments UI, task↔note model, subtask smokes.
- Target: Three-phase roadmap (API comments, Abyss note topology, subtask matrix).
- Actions log: Added `TT_ABYSS_ROADMAP.md`; verified TickTick `add_comment`/`get_comment`/`delete_comment` via MCP; updated `PROJECT_STATE.md` backlog.
- Validation: MCP probe comment on `6ad5c3c3…` created and deleted; `get_task_by_id` still has description-only `content`.
- Problems: No `update_comment` in MCP — edit sync may be delete+recreate (`open`).
- To Be Done: Implement Phase 1 (`syncAbyssCommentsViaApi`); PO sign-off Phase 2 (L1+L3 recommended).
- References: `TT_ABYSS_ROADMAP.md`, `ABYSS_NOTES_ALIGNMENT.md`, `CHANGELOG.md`

### Iteration 2026-10-19 09:28 UTC

- Context: Pilot smokes — Abyss description on **тест-синк** did not reach TickTick; TT body on **task-13-43-vault-r3** did not refresh Obsidian when `modifiedTime` was stale.
- Target: **2.0.40** — Obs→TT push and TT→Obs pull for single-line Abyss notes (`- >`).
- Actions log: Line-hash includes note text when `syncNotes` and `taskLines.length > 0` (was `> 1`); `vaultLineBehindTask` parses full Abyss block and compares `content`/`desc` to live TT.
- Validation: `npx vitest run` → 530 passed; root cause matched journal pushes with `"content":""` while vault had `- >` children.
- Problems: Comments (`- stamp:`) still need soak; Abyss UI must flush child lines to `.md` before sync.
- To Be Done: Reload **2.0.40** on pilot vault; re-sync **тест-синк** and a TT-only body edit.
- References: `src/services/TaskModificationDetector.ts`, `src/services/VaultSyncCoordinator.ts`, `ABYSS_NOTES_ALIGNMENT.md`, `CHANGELOG.md`

### Iteration 2026-10-19 07:25 UTC

- Context: Save Abyss↔TT notes analysis; refocus pilot on project scheme and subtask sync.
- Target: Durable docs for notes alignment and for projects / Active Zone / subtask order.
- Actions log: Added `ABYSS_NOTES_ALIGNMENT.md`, `SYNC_PROJECTS_AND_SUBTASKS.md`; linked from `GTD_SYNC_CASES.md` and `PROJECT_STATE.md`.
- Validation: No code change.
- Problems: CASE-P3/P4/P6 and subtask-order live smokes still open.
- To Be Done: Execute §5 in `SYNC_PROJECTS_AND_SUBTASKS.md` on `Thinkpad-tts-test`.
- References: `ABYSS_NOTES_ALIGNMENT.md`, `SYNC_PROJECTS_AND_SUBTASKS.md`, `CHANGELOG.md`

### Iteration 2026-10-19 07:18 UTC

- Context: Full-sync progress modal blocked the vault; user wanted the same top-right toast style as other plugin Notices.
- Target: **2.0.39** — replace modal with persistent `Notice` for full and inline sync progress.
- Actions log: `SyncProgressNotice`; removed `SyncProgressModal`; inline activity uses the same notice stack (not status bar).
- Validation: `npm run build` → ok.
- Problems: open until release.
- To Be Done: Release **2.0.39**.
- References: `src/modals/SyncProgressNotice.ts`, `src/services/SyncActivityIndicator.ts`, `CHANGELOG.md`

### Iteration 2026-10-19 07:08 UTC

- Context: Progress UI should cover inline TickTick updates; scheduled full sync should be optional noise.
- Target: **2.0.38** — `SyncActivityIndicator` (modal + status bar); setting `showSyncProgressOnScheduledSync` (default off).
- Actions log: Wired inline indicator on line push, checkbox, subtask, check database; full sync respects trigger `manual` / `scheduled` / `startup`.
- Validation: `npx vitest run src/test/syncActivityIndicator.test.ts` → 3 passed; `npm run build` → ok.
- Problems: open until release.
- To Be Done: Release **2.0.38**; reload plugin on pilot vault.
- References: `src/services/SyncActivityIndicator.ts`, `AutoSyncIntervalSection.svelte`, `CHANGELOG.md`

### Iteration 2026-10-19 06:58 UTC

- Context: Phase B live smokes with vault open; operator wanted visible sync activity during long runs.
- Target: Ship **2.0.37** progress modal; log Phase B results; skip Phase C.
- Actions log: `SyncProgressModal` + steps in `synchronizationInner`; Phase B agent pass (pull, TT→Obs rename, R7); R3 not automated (disk edit ≠ editor push).
- Validation: `npx vitest run` → pass; live `agent-phase-b-*` + `test-3-phase-b-tt` on pilot vault.
- Problems: Shipped in **2.0.37** (reload plugin to see modal). R3/R8 still need in-editor edits by user.
- To Be Done: Release **2.0.37**; user R3 in Obsidian editor; optional R5/R6.
- References: `src/modals/SyncProgressModal.ts`, `src/services/index.ts`, `SMOKE_TESTS.md`, `CHANGELOG.md`

### Iteration 2026-10-19 06:52 UTC

- Context: Close rename investigation; document what agents can automate vs deletion modals in Obsidian.
- Target: `SMOKE_TESTS.md` rename matrix R1–R8, phased plan A–D, result log; align `PROJECT_STATE` / `PO_STATUS` with **2.0.36** pilot status.
- Actions log: User **R1/R2 pass** on 2.0.36; agent `npx vitest run` → 527 pass, smoke bundle 51 pass; MCP live pull skipped when vault inactive.
- Validation: `npx vitest run` → 527 passed (2026-10-19).
- Problems: CASE-DEL-* still need human **Confirm** on `TaskDeletionModal` (agent cannot click UI).
- To Be Done: Phase B R3/R7/R8; Phase C deletion suite; Phase D AF-* soak.
- References: `SMOKE_TESTS.md`, `TaskDeletionModal.ts`, `CHANGELOG.md`

### Iteration 2026-10-19 05:36 UTC

- Context: Delta pull skipped title-only TT renames when `modifiedTime` stayed unchanged; `pushLocalEditsFirst` then overwrote TT from stale `abyss-active` lines (see sync journal `obs->tt` on `6ad5ab55…`).
- Target: **2.0.36** — never push a stale vault title when live TickTick is ahead; still rewrite vault when the checkbox lags.
- Actions log: `skipPushWhenTickTickRenamedVaultLine` in `TaskModificationDetector`; `vaultLineBehindTask` + fresh `getTaskById` in `VaultSyncCoordinator`; cleaned pilot probes in TT and vault (`AF-dup-*`, regression task, LOGIC-A32, FOOL-TT).
- Validation: `npx vitest run` → 527 passed; `npm run build` → ok; `main.js` copied to Thinkpad-tts-test plugin folder.
- Problems: Shipped in **2.0.36**.
- To Be Done: No changes (R1/R2 verified by user on 2.0.36).
- References: `src/services/TaskModificationDetector.ts`, `src/services/VaultSyncCoordinator.ts`, `CHANGELOG.md`

### Iteration 2026-10-19 05:32 UTC

- Context: TT rename on TTS-Inbox did not update `abyss-active.md`; inflated `updatedAt` after vault push made pull keep stale Dexie rows.
- Target: Prefer TickTick `modifiedTime` in conflict resolution; refresh vault lines when checkbox text lags the DB task.
- Actions log: `effectiveTaskRevision` in `conflicts.ts`; `vaultLineBehindTask` in `VaultSyncCoordinator`; `upsertTask` uses TT `modifiedTime`; removed bogus `modifiedTime` stamp in `forceUpdates`. Pilot vault/TT smoke probes removed.
- Validation: `npx vitest run src/test/conflicts.test.ts` → pass.
- Problems: mitigated in **2.0.36** (see iteration above).
- To Be Done: No changes.
- References: `src/sync/conflicts.ts`, `src/services/VaultSyncCoordinator.ts`, `CHANGELOG.md`

### Iteration 2026-10-19 04:56 UTC

- Context: Pull wrote `#obsidian` on TickTick-born lines when `stopInjectingTickTickTag` was on; that tag should mean vault birth only.
- Target: On pull, `#obsidian` only when TickTick still carries the `obsidian` tag; otherwise `#ticktick`.
- Actions log: Fixed `convertTaskToLine` source-tag branch; extended `taskParser.sourceTag.test.ts`; noted SYNC-L6 in `SMOKE_TESTS.md`.
- Validation: `npx vitest run src/test/taskParser.sourceTag.test.ts src/test/syncSmoke.test.ts` → pass; `npm run build` → ok.
- Problems: Shipped in **2.0.35**.
- To Be Done: BRAT → 2.0.35; reload plugin; re-sync TT-born lines to rewrite `#obsidian` → `#ticktick` where appropriate.
- References: `src/taskParser.ts`, `src/test/taskParser.sourceTag.test.ts`, `SMOKE_TESTS.md`, `CHANGELOG.md`

### Iteration 2026-10-19 03:45 UTC

- Context: A pause while typing pushed half-finished lines such as `%%`.
- Target: Push a line when the cursor leaves it. Keep checkbox clicks and manual Synchronize.
- Actions log: Removed the editor-change timer. `lineNumberCheck` calls `lineSettledCheck`, which creates or updates the line that was left.
- Validation: Typecheck not gated; `lineSettledCheck` is wired from the existing cursor-move path.
- Problems: Shipped in **2.0.34**. A line is pushed when the cursor leaves it, or on Synchronize.
- To Be Done: Install 2.0.34. Type a checkbox, pause, then press Enter. The task appears only after Enter.
- References: `src/services/EventHandlerService.ts`, `src/main.ts`, `src/services/index.ts`, `CHANGELOG.md`

### Iteration 2026-10-19 03:40 UTC

- Context: A new TTS-Inbox task was going to `30 Tasks/TickTick/TTS-Inbox.md`. That broke Abyss capture.
- Target: Inbox tasks born in TickTick land in the Abyss capture note with `#inbox`.
- Actions log: `fileForNewTickTickTask` uses `abyss-tasks` `taskFilePath` (`00 Inbox/abyss-active.md`). The line gets `#inbox`.
- Validation: `npx vitest run src/test/syncScope.test.ts src/test/projectParentKeep.test.ts` → 20 passed.
- Problems: Shipped in **2.0.33**.
- To Be Done: Install 2.0.33, create a task in TTS-Inbox, confirm the line in `abyss-active.md`.
- References: `src/services/VaultSyncCoordinator.ts`, `src/taskParser.ts`, `CHANGELOG.md`

### Iteration 2026-10-19 03:35 UTC

- Context: Smoke list did not cover the inbox-tag drop, the unfinished `%%` line, or the 5s editor wait.
- Target: Those rows run with the existing unit suite.
- Actions log: Added LOGIC-10–12 and live LOGIC-E/F to `SMOKE_TESTS.md`. A project list keeps a stage tag that is not `inbox`.
- Validation: `npx vitest run src/test/logicSmoke.test.ts src/test/listMapping.test.ts src/test/projectParentKeep.test.ts src/test/foolCases.test.ts` → 18 passed.
- Problems: LOGIC-E and LOGIC-F need a reload and a task created in the TickTick app (`open`).
- To Be Done: Reload, create a task in TTS-Inbox, move it to TTS-nextAction, confirm the line and the missing `inbox` tag.
- References: `SMOKE_TESTS.md`, `CHANGELOG.md`

### Iteration 2026-10-19 03:30 UTC

- Context: `#inbox` stayed on a task after it left TTS-Inbox. A task created in TTS-Inbox had no file to land in. Editor sync fired after 1s and saved lines like `%%`.
- Target: Drop `inbox` off a task that is not on the inbox list. Write a new allow-listed task into `30 Tasks/TickTick/<list>.md`. Wait 5s and skip an unfinished `%` line.
- Actions log: `tagsForCurrentList` on pull and push; `dropStaleStageTags` updates TickTick; `determineTargetFile` registers a list file; editor debounce 5s; `isUnfinishedCapture`.
- Validation: `npx vitest run src/test/foolCases.test.ts src/test/listMapping.test.ts src/test/services/VaultSyncCoordinator.test.ts` → 33 passed.
- Problems: The task already titled `%%` stays until deleted (`open`). Needs a plugin reload.
- To Be Done: Reload Obsidian. Create a task in TTS-Inbox and confirm a line in `30 Tasks/TickTick/TTS-Inbox.md`. Move a task off the inbox and confirm the `inbox` tag is gone.
- References: `src/services/EventHandlerService.ts`, `src/services/VaultSyncCoordinator.ts`, `src/listMapping.ts`, `CHANGELOG.md`

### Iteration 2026-10-19 02:30 UTC

- Context: LOGIC-B2 title updated on TTS-Inbox while the local record already said TTS-nextAction, so no project move was sent.
- Target: Move from the project TickTick actually reports, and do not keep a destination list locally when that move fails.
- Actions log: `listMoveSource` in the modification path; `moveTaskProject` returns false when `projectMove` fails; empty project-move responses count as failure.
- Validation: `npx vitest run src/test/syncScope.test.ts src/test/listMapping.test.ts` → 20 passed.
- Problems: Live move confirmed after reload (`resolved`). LOGIC-B2 `6ad4df192f54922b67e55fa4` is on TTS-nextAction.
- To Be Done: Add `inbox = TTS-Inbox` only if `#inbox` should be a mapped stage.
- References: `src/syncScope.ts`, `src/services/TaskModificationDetector.ts`, `src/services/TicktickRestAPI.ts`, `CHANGELOG.md`

### Iteration 2026-10-19 00:50 UTC

- Context: Re-run the logic smokes on 2.0.32 in the open test vault.
- Target: `#inbox` stays on TTS-Inbox. Adding `#type/next` moves the task to TTS-nextAction.
- Actions log: Updated `SMOKE_TESTS.md` rows A–D. Ran the unit files. Created LOGIC-A32 and edited LOGIC-B2, then synchronized.
- Validation: `npx vitest run` on logicSmoke, listMapping, projectParentKeep → 13 passed. LOGIC-A32 on TTS-Inbox. LOGIC-B2 title updated on TTS-Inbox; list did not change (`open`).
- Problems: List move is still not applied on the live task (`open`).
- To Be Done: Trace `moveTaskProject` for LOGIC-B2 `6ad4df192f54922b67e55fa4`.
- References: `SMOKE_TESTS.md`, `CHANGELOG.md`

### Iteration 2026-10-18 15:10 UTC

- Context: `#inbox` created tasks on the real Inbox list. Adding `#type/next` later did not move a task, because the stage tag is stripped before the tag-diff.
- Target: Unmapped tags stay on the file's default list. A mapped stage still moves the TickTick list.
- Actions log: Skip list-name matching when `tagListMappings` is set. Move the task when `projectId` changes even if the remaining tags match.
- Validation: `npx vitest run src/test/listMapping.test.ts` → 4 passed.
- Problems: Shipped in **2.0.32**.
- To Be Done: Install 2.0.32 and re-sync a line whose tag changes from none to `#type/next`. Add `inbox = TTS-Inbox` if that tag should select the pilot inbox.
- References: `src/taskParser.ts`, `src/services/TaskModificationDetector.ts`, `CHANGELOG.md`

### Iteration 2026-10-18 14:55 UTC

- Context: The settled task, folder, mapping, and pull rules were scattered across chat notes.
- Target: One logic section, a smoke list, and a run of the rows that do not need the Obsidian UI.
- Actions log: Updated `ABYSS_FIRST_PLAN.md` §6 and `SMOKE_TESTS.md`; added `src/test/logicSmoke.test.ts`.
- Validation: `npx vitest run src/test/logicSmoke.test.ts src/test/listMapping.test.ts src/test/projectParentKeep.test.ts` → 12 passed. TickTick: test 3 `6ad4902e…` and test 4 `6ad4b062…` are children of Phase C on TTS-Projects.
- Problems: LOGIC-A, LOGIC-B, and LOGIC-C need a click-through in Obsidian (`open`).
- To Be Done: Run LOGIC-A–C in `Thinkpad-tts-test` after 2.0.31 is installed.
- References: `SMOKE_TESTS.md`, `ABYSS_FIRST_PLAN.md`, `src/test/logicSmoke.test.ts`, `CHANGELOG.md`

### Iteration 2026-10-18 14:45 UTC

- Context: Template bullets `- [[]]` under related-articles sections were read as checkboxes.
- Target: A wiki-link placeholder is not a task. Real checkboxes `[ ]`, `[x]`, `[/]` still are.
- Actions log: Tightened `checkboxRegex` in `src/taskParser.ts` so the status character cannot be `[` or `]`.
- Validation: `npx vitest run src/test/foolCases.test.ts` → 3 passed.
- Problems: Abyss Tasks uses the same loose pattern and still lists these lines (`open`, not our plugin). Shipped in **2.0.31**.
- To Be Done: Install 2.0.31. Abyss will keep showing these lines until its own matcher changes.
- References: `src/taskParser.ts`, `CHANGELOG.md`

### Iteration 2026-10-18 14:15 UTC

- Context: GTD stages can be TickTick lists or TickTick tags used by filter views. Moves must work both ways.
- Target: Setting `gtdStageVia` = `list` (default) or `tag`, same mapping table.
- Actions log: Helpers in `listMapping.ts`; push and pull in `taskParser.ts`; select in GTD settings.
- Validation: `npx vitest run src/test/listMapping.test.ts src/test/projectParentKeep.test.ts` → 6 passed.
- Problems: Filter views are created in the TickTick app, not by the plugin (`open` as a manual step). Shipped in **2.0.30**.
- To Be Done: Install 2.0.30; choose Tag → list or Tag → tag and sync one `#type/next` line.
- References: `src/listMapping.ts`, `src/taskParser.ts`, `ABYSS_FIRST_PLAN.md`, `CHANGELOG.md`

### Iteration 2026-10-18 12:20 UTC

- Context: Pull of new TickTick tasks should be list OR `tts-test`, not both. Birth tags stay. Date views share the due date.
- Target: `tickTickTaskEntersVault` uses OR; plan §6 matches that, and C/D/E are checked.
- Actions log: OR gate in `src/syncScope.ts` and the Obsidian update check; rewrote `ABYSS_FIRST_PLAN.md` §6.A–E.
- Validation: `npx vitest run` on syncScope, listMapping, projectParentKeep, projectSchemePushContext → 22 passed. TickTick: test 3 and test 4 are subtasks on TTS-Projects; no TTS task due 2026-10-18 through 2026-10-25.
- Problems: Installed plugin is still 2.0.29, so the OR gate is not live (`open`).
- To Be Done: Release when asked; add `📅` on a pilot line and confirm TickTick Today.
- References: `src/syncScope.ts`, `ABYSS_FIRST_PLAN.md`, `CHANGELOG.md`

### Iteration 2026-10-18 12:10 UTC

- Context: Abyss 2.1.2 inbox is untagged top-level lines; `#obsidian` ejects them while they remain on TTS-Inbox.
- Target: A written order for the next alignment, after the tag and view rules were checked in the plugin.
- Actions log: Added `ABYSS_FIRST_PLAN.md` §6; pointed `PROJECT_STATE.md` Target at that order.
- Validation: Read Abyss `main.js` inbox rule (`depth===0 && tags.length===0`) and test-vault `data.json`.
- Problems: No code change in this iteration (`open` work remains §6.A–B).
- To Be Done: Release the linked-line pull; drop the `tts-test` gate on later edits of linked lines; stop writing `#obsidian` on the checkbox.
- References: `ABYSS_FIRST_PLAN.md`, `PROJECT_STATE.md`, `CHANGELOG.md`

### Iteration 2026-10-18 11:50 UTC

- Context: Completing test 2 on TTS-Inbox left the Active Zone line unchecked. The task only has the tag `obsidian`.
- Target: A line that already has `ticktick_id` follows TickTick completion on sync. New unlinked tasks still require SyncTag.
- Actions log: `allowVaultUpdate` used by `VaultSyncCoordinator` so linked tasks on an allow-listed list are written back.
- Validation: `npx vitest run src/test/syncScope.test.ts src/test/services/VaultSyncCoordinator.test.ts` → 39 passed.
- Problems: Installed 2.0.29 still skips these updates (`open` until the next release).
- To Be Done: Release and sync again; the test 2 line should become checked.
- References: `src/syncScope.ts`, `src/services/VaultSyncCoordinator.ts`, `CHANGELOG.md`

### Iteration 2026-10-18 09:40 UTC

- Context: Active Zone lines on a project note sometimes landed on TTS-Inbox; a later line became a subtask on TTS-Projects.
- Target: File-save push uses the same project parent and list as a full sync; a later parent attach also moves the list.
- Actions log: `ProjectSchemeService.ensurePushContext` before new-task and modification scans; `moveTaskProject` before `parentMove` when the list id changes; skip non-string tags in `addTagsToLine`.
- Validation: `npx vitest run` → 500 passed (2 new cases in `projectSchemePushContext.test.ts`).
- Problems: Shipped in **2.0.29** (`resolved` once BRAT installs that release).
- To Be Done: Install 2.0.29 on `Thinkpad-tts-test`; re-add an Active Zone line and confirm it appears under the project on TTS-Projects.
- References: `src/services/ProjectSchemeService.ts`, `src/services/TaskModificationDetector.ts`, `src/taskParser.ts`, `CHANGELOG.md`

### Iteration 2026-10-17 12:05 UTC

- Context: Need repeatable pilot proof that Obsidian line removal deletes on TickTick after 2.0.28.
- Target: Smoke checklist and formal `CASE-DEL-*` scenarios.
- Actions log: Added `SMOKE_TESTS.md`; `GTD_SYNC_CASES.md` §8 deletion cases; updated `PROJECT_STATE.md` validation pointers.
- Validation: Doc-only; execute on `Thinkpad-tts-test` with plugin 2.0.28.
- Problems: DEL-* status **open** until tester fills result log (`open`).
- To Be Done: Run DEL-1 through DEL-5; mark pass/fail in `SMOKE_TESTS.md`.
- References: `SMOKE_TESTS.md`, `GTD_SYNC_CASES.md`, `CHANGELOG.md`

### Iteration 2026-10-17 11:45 UTC

- Context: Obs→TT delete UX failed bulk cleanup; Step/1/2/3 still on TTS-Projects while lines remain in pilot notes.
- Target: One confirm per sync for all removed/orphan tasks; longer modal timeout; orphan scan; clearer notices (2.0.28).
- Actions log: `processSyncRemovedTasks`, `collectTaskIdsAbsentFromVault`, scaled `deletionPromptTimeoutMs`; phase 2 calls vault-wide pass once.
- Validation: `npm test -- --run` → 498 passed; `npm run build` ok.
- Problems: Tasks still in vault (e.g. pilot Active Zone `- [ ] 1/2/3`) stay on TT until lines removed (`open`).
- To Be Done: Install 2.0.28 in test vault; remove template lines from project notes if unwanted on TT.
- References: `CHANGELOG.md`, `src/services/TaskDeletionHandler.ts`, `src/modals/TaskDeletionModal.ts`

### Iteration 2026-10-17 11:01 UTC

- Context: Pilot vault Step 1/2/3 cleanup; owner saw repeated “Tasks will not be deleted… rectify” with no delete dialog on later syncs.
- Target: Clear UX for Obs→TT delete prompts; each manual sync should re-offer deletion after timeout/cancel.
- Actions log: `TaskDeletionModal` returns `DeletionPromptResult`; `clearPendingDeletions()` at sync Phase 2; clearer notices in `TaskDeletionHandler`.
- Validation: `npm test -- --run src/test/modalTimeout.test.ts src/test/services/deletionGuard.test.ts` → 3 passed.
- Problems: Leftover TT orphans still need Confirm on dialog or manual TT delete until build deployed (`open`).
- To Be Done: Build 2.0.28; reload plugin in test vault; sync with Confirm Deletion on each prompt.
- References: `CHANGELOG.md`, `src/modals/TaskDeletionModal.ts`, `src/services/TaskDeletionHandler.ts`

### Iteration 2026-10-16 15:55 UTC

- Context: Owner asked to execute Abyss-first Step 4 (lines stay put; scope push without mandatory `#ticktick`).
- Target: `abyssTasksFormat` + configured `syncScopeFolders` track/push in-place; pull prefers vault `presentAt`; no file move on TT list change.
- Actions log:
  - `syncScope.ts` — `scopePushWithoutMarker()`, `hasConfiguredPushScope()`.
  - `taskParser.ts` — `isLineTrackedForSync`, `#obsidian` on push when `stopInjectingTickTickTag`; no `#ticktick` injection in convert.
  - Wired tracking into `TaskModificationDetector`, `syncModule.forceUpdates`, `index` checkDB, `TaskOperationsService`, `NewFileMap`.
  - `VaultSyncCoordinator` — pull target: vault location wins over list-file/DB.
  - `fileOperation.ts` — skip markdown relocate on list tag change when `abyssTasksFormat`.
  - Tests: `src/test/step4ScopeSync.test.ts`, extended `taskParser.sourceTag.test.ts`.
- Validation: `npm test -- --run` → 498 passed; `npm run build` ok.
- Problems: Phase D pilot spot-check in Obsidian still owner verify (`open`).
- To Be Done: Deploy build to test vault; normal Sync on `TTS-PILOT-tag-routing`; Step 5 settings copy + P6 regression doc.
- References: `CHANGELOG.md`, `ABYSS_FIRST_PLAN.md` Step 4, `src/taskParser.ts`, `src/syncScope.ts`

### Iteration 2026-10-16 15:51 UTC

- Context: Reset tasks hollowed project parent lines and pushed live Projects; owner asked to fix reset/repair.
- Target: Safe reset path, vault repair, pilot-only push for out-of-list tasks.
- Actions log:
  - `repairProjectNoteTasks` hoists synced children into Active Zone; drops parent-id lines.
  - `forceUpdates` skips/removes scheme parents, duplicate parent lines, out-of-`syncedLists` tasks.
  - Reset runs `repairAllProjectNotes` first; modification push respects same limits.
  - Repaired test vault `10 Projects/*.md` via repair helper.
- Validation: `npm test -- --run` → 494 passed; sample note `оборудовать рабочее место.md` Active Zone only.
- Problems: TickTick live **Projects** may still need manual check after prior reset (`open`).
- To Be Done: Reload Obsidian 2.0.26; normal sync (not reset) on test vault.
- References: `CHANGELOG.md`, `src/projectScheme.ts`, `src/services/syncModule.ts`

### Iteration 2026-10-16 15:36 UTC

- Context: Owner reported P6 on pilot project note (duplicate parent checkbox; subtasks under Metadata); continue Step 4–5 hardening.
- Target: Scheme parents never sync as lines; children insert into Active Zone, not under duplicate parent / callout.
- Actions log:
  - `projectScheme.ts` — `isProjectParentDuplicateLine`, `stripProjectParentDuplicateLines`.
  - `ProjectSchemeService` — strip duplicate parent line on scheme run; `lineDuplicatesProjectParent`.
  - `NewFileMap` — do not nest under scheme parent id; Active Zone insert on parent move.
  - `taskParser`, `TaskModificationDetector`, `fileOperation` — ignore/push-skip duplicate parent lines.
  - Tests in `projectScheme.test.ts`.
- Validation: `npm test -- --run` → 493 passed; `npm run build` ok.
- Problems: Existing mis-placed lines need one sync after plugin deploy to relocate (`open` on test vault).
- To Be Done: Copy `dist/` to test vault; sync; Step 4 scope-based push without line tag.
- References: `CHANGELOG.md`, `GTD_SYNC_CASES.md` CASE-P6, `src/projectScheme.ts`

### Iteration 2026-10-16 15:30 UTC

- Context: Owner chose Step 3 Option B (untagged inbox + ignore sync marker in Abyss); asked to record presets and explain `taskIgnoreQuery`.
- Target: Close §3.1 in plan; apply B on test vault; document in pilot runbook.
- Actions log:
  - `ABYSS_FIRST_PLAN.md` §3.1 — **Option B** + one-liner.
  - Test vault: `TTS-abyss-preset.json`; `abyss-tasks/data.json` `taskIgnoreQuery` → `#ticktick`.
  - `TTS-PILOT-RUN.md` Phase A — Abyss preset step; `TODO.md`, `PROJECT_STATE.md` updated.
- Validation: `abyss-tasks/data.json` contains `"taskIgnoreQuery": "#ticktick"`; preset file present under `00 Inbox/`.
- Problems: Inbox UI behavior after reload still needs owner verify (`open`).
- To Be Done: Reload Obsidian; Inbox (`I`) spot-check; Step 4 no-tag sync in plugin.
- References: `CHANGELOG.md`, `ABYSS_FIRST_PLAN.md`, test vault `00 Inbox/TTS-abyss-preset.json`, `TTS-PILOT-RUN.md`

### Iteration 2026-10-16 14:12 UTC

- Context: Owner asked to execute Abyss-first Step 2 and expand Step 3 inbox options.
- Target: Align test vault Abyss config with sync; document Step 3 A/B/C in depth.
- Actions log:
  - Test vault: `abyss-tasks/data.json` — `membershipQuery` `10 Projects/`, project insert `## Active Zone`, `taskFilePath` `00 Inbox/abyss-active.md`; created `00 Inbox/abyss-active.md`.
  - Expanded `ABYSS_FIRST_PLAN.md` Step 3 (variants, comparison table, preset note).
- Validation: Settings match MOC template Active Zone heading; capture path inside `syncScopeFolders`.
- Problems: Step 3 decision still open; Option B needs UI verify for `taskIgnoreQuery`.
- To Be Done: Reload Obsidian; verify Abyss Projects + add task in MOC; pick Step 3 A/B/C.
- References: `CHANGELOG.md`, `ABYSS_FIRST_PLAN.md`, test vault `abyss-tasks/data.json`

### Iteration 2026-10-16 14:05 UTC

- Context: Owner confirmed Abyss-first principles P1–P6 for the sync plan.
- Target: Close Step 1 in `ABYSS_FIRST_PLAN.md`; record PO sign-off.
- Actions log: Marked Step 1 done in plan, `PO_STATUS.md`, `PROJECT_STATE.md`, `TODO.md`.
- Validation: Owner message "confirmed" in chat.
- Problems: Step 3 inbox/marker choice still open.
- To Be Done: Step 2 (Abyss vault config on test vault); Step 3 decision.
- References: `CHANGELOG.md`, `ABYSS_FIRST_PLAN.md`, `PO_STATUS.md`

### Iteration 2026-10-16 13:55 UTC

- Context: Owner overwhelmed by topology R complexity; wants sync aligned with Abyss Tasks logic, planned in steps.
- Target: Single phased plan; park CASE-T4 / canonical list-file requirement for v1.
- Actions log:
  - Added `ABYSS_FIRST_PLAN.md` — principles P1–P6, Steps 1–8, inbox options A/B/C, scope cut, AF-* case outline.
  - Updated `PROJECT_STATE.md`, `PO_STATUS.md` (step 4 / T4), `TODO.md` checklist.
- Validation: No code changes; plan cross-check with `GTD_SYNC_RESEARCH.md` §2.
- Problems: Step 3 inbox choice and Step 3.1 still pending owner input (`open`).
- To Be Done: Owner Step 1 + 3; vault Step 2 on test vault.
- References: `CHANGELOG.md`, `ABYSS_FIRST_PLAN.md`, `PROJECT_STATE.md`

### Iteration 2026-10-16 12:20 UTC

- Context: Owner asked for detailed real-world GTD sync cases, not a short summary.
- Target: Single catalog testers and implementers can execute and sign off against.
- Actions log:
  - Added `GTD_SYNC_CASES.md` — vocabulary, pilot preset, 22 CASE-* scenarios (safety, project scheme, topology R tasks, pull, negatives, migration), pilot matrix, engineering sequence.
  - Linked from `PO_STATUS.md`, `PROJECT_STATE.md`, `GTD_SYNC_RESEARCH.md`; test vault `TTS-PILOT-RUN.md` phase → case map.
- Validation: Cross-check against pilot journal ids and `TTS-PILOT-RUN.md` outcomes (2026-10-16).
- Problems: **CASE-T4** (list-file mirror) and **CASE-P6** (parent as duplicate checkbox) remain open.
- To Be Done: Implement CASE-T4 for **2.0.25**; exercise untested cases in §9 matrix.
- References: `CHANGELOG.md`, `GTD_SYNC_CASES.md`, `PO_STATUS.md`, `GTD_SYNC_RESEARCH.md`

### Iteration 2026-10-16 08:15 UTC

- Context: Owner asked for hands-on pilot testing (Phases C–E) on `Thinkpad-tts-test` after **2.0.24**.
- Target: Verify sync end-to-end against `TTS-PILOT-RUN.md` success criteria.
- Actions log:
  - Created `10 Projects/TTS-PILOT- Phase C test.md` and `30 Tasks/TTS-PILOT-tag-routing.md`; triggered sync via `obsidian://adv-uri` + `tickticksync-abyss:tts-sync`.
  - Phase C pass: parent `6ad1dc711befa8582aceadd7` in **TTS-Projects**, `ticktick_id` on note, no link in TT title.
  - Phase D partial: task `6ad1dc721befa8582aceadd8` in **TTS-nextAction**; vault line in source file only (list stub still empty).
  - Phase E spot: `syncedLists=[]` sync did not append journal pulls; preset restored.
  - Updated test vault `TTS-PILOT-RUN.md` checkboxes; `PO_STATUS.md` pilot table.
- Validation: TickTick MCP task/list lookup; redo journal `sync-mvaowegq-l-tv6y` at 08:12 UTC.
- Problems: Per-list file mirror for obs-created tasks (`open`); legacy vault root stubs from first unlimited sync (`open`).
- To Be Done: Product decision on list-file vs source-file; optional soak; live `Thinkpad` still blocked.
- References: `CHANGELOG.md`, `PO_STATUS.md`, `00 Inbox/TTS-PILOT-RUN.md` (test vault)

### Iteration 2026-10-16 07:58 UTC

- Context: Settings UI duplicated GTD/project controls under Notes and legacy Limit sync conflicted with synced lists.
- Target: Phase A — single canonical GTD surface, clearer tab names, advanced filters only when needed.
- Actions log:
  - Removed `projectSchemeEnabled` and `tagListMappings` from Notes; hid legacy project mapping when scheme on; renamed tab to **Task & note format** with cross-link to GTD.
  - Added **Sync tag** to `GtdSection`; Limit section renamed **Extra filters (advanced)** when lists are ticked; disabled legacy single-list dropdown.
  - Sync Control opens **GTD and projects** by default; intro blurb at top.
- Validation: `npm test` — 492 passed; `npm run build` OK.
- Problems: No changes.
- To Be Done: BRAT **2.0.24**; reload plugin; confirm Notes tab no longer shows scheme/tag→list.
- Version **2.0.24**.
- References: `CHANGELOG.md`, `GtdSection.svelte`, `NotesSettings.svelte`, `LimitSyncSection.svelte`, `SettingsTabs.svelte`

### Iteration 2026-10-16 07:38 UTC

- Context: After every BRAT upgrade, GTD settings (lists, mappings) disappeared in UI and often in `data.json`.
- Target: Upgrades must not rewrite GTD from in-memory defaults; checkpoint/login saves must not trigger stray full-file writes.
- Actions log:
  - `buildPersistedSettings`: merge disk + GTD-safe memory on every `saveSettings`.
  - Version bump on load patches only `data.json` `version`, no full `saveSettings`.
  - Removed `settingsStore.set` auto-save; `updateSettings` defaults to store-only (`persist: true` opt-in).
  - Startup/sync paths use `updateSettings(..., { persist: false })` + explicit `saveSettings`.
  - Version **2.0.23**.
- Validation: `npm test` — 492 passed.
- Problems: Vaults already wiped need one-time preset merge (`TTS-data-preset.json`) (`open`).
- To Be Done: Release **2.0.23**; BRAT update; disable/enable + upgrade smoke test.
- References: `CHANGELOG.md`, `src/settingsMerge.ts`, `src/main.ts`, `src/ui/settings/settingsstore.ts`

### Iteration 2026-10-16 07:25 UTC

- Context: Disabling and re-enabling the plugin cleared GTD keys in `data.json` (`syncedLists`, mappings) even when disk had a full preset.
- Target: No `data.json` rewrite on enable unless version migration actually changed; sync/init must not run before settings load completes.
- Actions log:
  - `ensureSettingsLoaded()` single-flight promise; `onLayoutReady` awaits it before `pluginLoad()` / `initDB`.
  - `loadSettings`: save only when `merged.version !== versionBefore` (not every enable).
  - `settingsStore.set`: auto-save only when `plugin.settingsReady`.
  - `trackDeviceInSettings`: `updateSettings(..., { persist: false })`.
  - Version **2.0.22**.
- Validation: `npm test` — 491 passed; `npm run build` OK.
- Problems: Prior wipes on disk need preset merge once (`open` for affected vaults).
- To Be Done: BRAT to **2.0.22**; disable/enable plugin twice; confirm GTD section and `data.json` unchanged.
- References: `CHANGELOG.md`, `src/main.ts`, `src/ui/settings/settingsstore.ts`, `src/db/dexie.ts`

### Iteration 2026-10-16 07:12 UTC

- Context: On **2.0.20**, Thinkpad test vault `data.json` had six `syncedLists` and four `tagListMappings` on disk but GTD UI showed empty checkboxes and tag textarea (API list fetch empty + Svelte store still on defaults).
- Target: Show disk-backed GTD config in UI before any save; block writes that would wipe on-disk GTD; release **2.0.21**.
- Actions log:
  - `GtdSection`: `loadFields()` from `getSettings()` on mount; `checkboxLists` merges API projects with saved `syncedLists`; status line for loaded count vs preset hint; `wouldWipeGtdFromDisk` guard on UI save; `refreshSettingsStore` when store lags module settings.
  - `wouldWipeGtdFromDisk` in `settingsMerge.ts`; `saveSettings` blocks persist and re-hydrates when wipe detected.
  - Vitest extended; merged `TTS-data-preset.json` into test-vault `data.json` (session fields kept); `dist/` → `tickticksync-abyss`.
  - Version **2.0.21**.
- Validation: `npm test --run` — 491 passed; `npm run build` OK; vault merge → six lists, four mappings.
- Problems: Empty checkbox UI when TickTick login fails is mitigated by showing saved list names (`mitigated`).
- To Be Done: Owner reload plugin in Obsidian; open GTD section and confirm status + mappings.
- References: `CHANGELOG.md`, `src/ui/settings/svelte/sections/GtdSection.svelte`, `src/settingsMerge.ts`, `src/main.ts`

### Iteration 2026-10-16 07:00 UTC

- Context: After BRAT upgrade to **2.0.19** + TickTick login on `Thinkpad-tts-test`, GTD tab showed empty lists/mappings; vault `data.json` on disk was also empty (not UI-only).
- Target: Durable fix so login/early `saveSettings(true)` cannot overwrite GTD keys; restore test-vault preset; release **2.0.20**.
- Actions log:
  - Root cause: race — `saveSettings(true)` on login (or `settingsStore.set` before `loadSettings` completes) wrote in-memory `DEFAULT_SETTINGS` over `data.json`; `loadSettings` then persisted the already-wiped file.
  - `preserveGtdFromDisk` / `hydrateSettingsFromDisk` in `settingsMerge.ts`; `saveSettings` hydrates from disk on forced pre-load saves and merges GTD arrays from disk/snapshot before every write.
  - `GtdSection`: `gtdHydrated` gate — no persist until `plugin.settingsReady`; import GTD JSON from clipboard; token/projectsVersion only reload list checkboxes.
  - Login paths use `updateSettings(loginPatch, { persist: false })` so `settingsStore.set` cannot auto-save before GTD hydrate; `NotesSettings` same hydration gate.
  - Vitest: `settingsPreserveGtd.test.ts`; merged `00 Inbox/TTS-data-preset.json` into test vault `data.json` (session fields kept); `dist/` → test vault.
  - Version **2.0.20**.
- Validation: `npm test --run` — 490 passed; `npm run build` OK; vault merge script → six `syncedLists`, `SyncTag=tts-test`, scheme on.
- Problems: Prior wipe already committed to disk until preset merge (`resolved` for test vault).
- To Be Done: Owner reload plugin **2.0.20** in Obsidian; confirm GTD tab; re-run pilot step 2 if needed.
- References: `CHANGELOG.md`, `src/settingsMerge.ts`, `src/main.ts`, `src/ui/settings/svelte/sections/GtdSection.svelte`, test vault `TTS-data-preset.json`

### Iteration 2026-10-16 06:52 UTC

- Context: Phase B pilot **FAIL** on scoped pull — `SyncTag=tts-test` did not bound project scheme; 16 legacy `10 Projects/` notes touched via live **Projects** list id.
- Target: Scheme parents only from allow-listed `projectsListName` + `syncedLists` + SyncTag; no re-bind of out-of-scope notes; MOC placeholder cleanup; `TTS-Projects.md` stub; release **2.0.18**.
- Actions log: Added `taskMatchesSyncLimit`, `resolveProjectsList`, `isSchemeParentTask`; tightened `ProjectSchemeService.run`; shared filter in `VaultSyncCoordinator`; scheme Projects list gets list stub; `stripActiveZonePlaceholders` in template render; Vitest; version bump.
- Validation: `npm test --run` — 486 passed.
- Problems: Prior pilot note touch-ups in vault not auto-reverted (`open`, manual if needed).
- To Be Done: Re-run Phase B on **2.0.18**; Phases C–E per `TTS-PILOT-RUN.md`.
- References: `CHANGELOG.md`, `src/syncScope.ts`, `src/projectScheme.ts`, `src/services/ProjectSchemeService.ts`

### Iteration 2026-10-16 06:55 UTC

- Context: Owner ran Phase B pilot sync (`sync-mvalv6fr-1-ezhs`) on `Thinkpad-tts-test`; agent verified vault + TickTick MCP.
- Target: Confirm checklist step 2 (TT parent → project note + per-list stubs) without widening scope to live lists.
- Actions log: Read pilot note, `data.json` (secrets redacted), journal `2026-10-16.jsonl`; TickTick MCP `get_task_by_id`, `get_project_with_undone_tasks`, `filter_tasks` tag `tts-test`.
- Validation:
  - Plugin preset: six `syncedLists`, `SyncTag=tts-test`, scheme + `tagListMappings` match `TTS-data-preset.json` — pass.
  - TT task `6ad1c7878f0841315e89a10c`: title `TTS-PILOT: Dishwasher project`, tags `tts-test`/`project`/`obsidian`, no `obsidian://` in title — pass.
  - `TTS-Projects` undone: only pilot parent — pass.
  - Obsidian: `10 Projects/TTS-PILOT- Dishwasher project.md` created with `ticktick_id`, `system/project`, `## Active Zone`, MOC body — pass.
  - List stubs: five files under `30 Tasks/TickTick/` (no `TTS-Projects.md`); pilot sync created no new vault-root list files (root `Inbox.md` mtime predates sync) — partial.
  - Same sync updated 16 existing `10 Projects/*.md` notes tied to live list `69569c948f087c3908f43b93` (added `#ticktick` / metadata) — fail scoped pull.
  - Phases C–E (Obs→TT project, `#type/next` inline, empty `syncedLists`) — not run (no file evidence).
- Problems:
  - `SyncTag` did not limit project-scheme refresh of vault notes already mapped to live **Projects** (`open`).
  - MOC template left placeholder Active Zone checkboxes `1`/`2`/`3` in pilot note; TT `childIds` null (`open`, risk on next Obs→TT).
  - Missing per-list stub for `TTS-Projects` (`open`).
- To Be Done: Fix scope (project scheme + tag filter); strip template placeholders or skip empty template tasks; run Phases C–D; optional cleanup of 16 note touch-ups.
- References: `CHANGELOG.md`, `PO_STATUS.md`, test vault `00 Inbox/TTS-PILOT-RUN.md`, `.tickticksync/journal/2026-10-16.jsonl`

### Iteration 2026-10-16 06:50 UTC

- Context: Owner confirmed settings UI on plugin 2.0.17; pilot soak on `Thinkpad-tts-test` next.
- Target: Harden vault `data.json`, one TT pilot parent, operator runbook, PO checklist status.
- Actions log:
  - Merged `00 Inbox/TTS-data-preset.json` into test-vault `tickticksync-abyss/data.json` (kept session fields); fixed drift (`syncedLists` empty, scheme off, wrong `projectsListId`).
  - Verified vault `manifest.json` **2.0.17** and `main.js` matches repo `dist/`.
  - TickTick MCP: created parent **TTS-PILOT: Dishwasher project** in `TTS-Projects` (`6ad1c7878f0841315e89a10c`, tags `tts-test`, `project`, `obsidian`).
  - Added `00 Inbox/TTS-PILOT-RUN.md`; updated `PO_STATUS.md` pilot checklist table.
- Validation: `node` merge script printed expected GTD keys; `cmp` dist vs vault `main.js` identical.
- Problems: `data.json` had regressed to pre-pilot defaults before merge (`open`, mitigated).
- To Be Done: User runs Phases B–E in `TTS-PILOT-RUN.md`; optional commit/push docs on `tt-sync`.
- References: `CHANGELOG.md`, `PO_STATUS.md`, `00 Inbox/TTS-PILOT-RUN.md` (test vault), `TTS-data-preset.json` (test vault)

### Iteration 2026-10-16 06:45 UTC

- Context: Thinkpad-tts-test Obsidian 1.13.7 — plugin 2.0.16 enabled but no gear on Installed row; vault `main.js` matched release build.
- Target: Settings tab registers on enable; fallback command; release 2.0.17.
- Actions log:
  - Root cause: 2.0.16 still `await loadSettings()` before `addSettingTab` — slow or stuck `loadData`/`saveSettings` blocked tab registration for the gear and sidebar entry.
  - `addSettingTab` runs synchronously at start of `onload`; `loadSettings` moved to `completeSettingsLoad()`; `refreshSettingsStore()` after async load.
  - Command `tickticksync-abyss:open-settings`; ribbon + notice when tab registration throws; docs for 1.13 left-sidebar entry.
  - Version 2.0.17.
- Validation: `npm test -- --run`; `npm run build`; copied `dist/` to test vault.
- Problems: No changes.
- To Be Done: Push `abyss-mapping`, tag `2.0.17`, reload plugin in Obsidian and confirm gear + sidebar entry.
- References: `CHANGELOG.md`, `src/main.ts`, `docs/BRAT_INSTALL.md`

### Iteration 2026-10-16 06:30 UTC

- Context: BRAT install 2.0.15 on Thinkpad-tts-test — no settings gear on **Settings → Community plugins → Installed** row.
- Target: Settings tab registers on enable; release 2.0.16 with same install layout as 2.0.15.
- Actions log:
  - Vault check: folder `tickticksync-abyss`, `community-plugins.json` id match, `data.json` present, `main.js` 649 KiB, `node --check` OK.
  - Release 2.0.15 assets: flat `manifest.json` + `main.js` + `styles.css`; zip `tickticksync-abyss/{main.js,manifest.json,styles.css}` (not a wrong folder name).
  - Root cause: `addSettingTab` ran only inside `onLayoutReady` after `waitForObsidianSync` → gear absent until layout + sync idle (sync can wait indefinitely).
  - `registerSettingsTab()` in `onload` before deferred work; `pluginLoad` no longer loads settings or adds tab; try/catch on deferred load.
  - Version 2.0.16; `docs/BRAT_INSTALL.md` notes Installed-list gear vs catalog page.
- Validation: `npm test -- --run` 481 passed; `npm run build` OK; copied `dist/` to test vault.
- Problems: Users on 2.0.15 need BRAT **Check for updates** or tag `2.0.16` release (`open`).
- To Be Done: Push `abyss-mapping`, publish GitHub release `2.0.16`, reload plugin in Obsidian and confirm gear on Installed row.
- References: `CHANGELOG.md`, `src/main.ts`, `docs/BRAT_INSTALL.md`

### Iteration 2026-10-16 06:22 UTC

- Context: BRAT v1.1+ installs from GitHub release assets; `tt-sync` had no releases and no CI on `abyss-mapping`.
- Target: GitHub Actions CI + release workflow; BRAT install docs aligned with release-based installs.
- Actions log:
  - Added `.github/workflows/ci.yml` (push/PR to `abyss-mapping`: `npm ci`, test, build).
  - Reworked `.github/workflows/release.yml` for `tickticksync-abyss`, tag `v*` / semver, `workflow_dispatch`, release assets.
  - Updated `docs/BRAT_INSTALL.md` (releases vs branch, first-release steps).
- Validation: `npm test` 57 files / 481 passed; `npm run build` OK locally.
- Problems: No GitHub release until workflow runs on `tt-sync` (`open`).
- To Be Done: Run release workflow or push version tag; BRAT add beta plugin after first release.
- References: `CHANGELOG.md`, `docs/BRAT_INSTALL.md`, `.github/workflows/ci.yml`, `.github/workflows/release.yml`

### Iteration 2026-10-16 06:05 UTC

- Context: Community plugin id `tickticksync` would be overwritten by catalog updates; Abyss fork needs a distinct id for BRAT installs.
- Target: Plugin id `tickticksync-abyss`, BRAT install docs, test vault on new folder path with preserved `data.json`.
- Actions log:
  - Updated `manifest.json` (id, name, version 2.0.15), `package.json`, `versions.json`, dev `vite.config.mts` out path.
  - Added `docs/BRAT_INSTALL.md`; README install pointer.
  - Codebase: no runtime plugin-id strings; vault redo log stays `.tickticksync/journal` (not plugin folder).
  - Thinkpad-tts-test: `community-plugins.json` → `tickticksync-abyss`; moved plugin dir; copied `dist/` to new path.
- Validation: `npm test -- --run` 57 files / 481 passed; `npm run build` OK; `dist/manifest.json` id `tickticksync-abyss`.
- Problems: Branch `abyss-mapping` must be pushed to GitHub before BRAT can pull (`open` until push).
- To Be Done: Push branch; BRAT add repo + branch; disable/remove community `tickticksync` on other vaults.
- References: `CHANGELOG.md`, `docs/BRAT_INSTALL.md`, `manifest.json`, `PO_STATUS.md`

### Iteration 2026-10-16 05:45 UTC

- Context: Thinkpad-tts-test vault showed no TickTickSync settings tab (only Disable/Uninstall on community card).
- Target: Settings tab must register even when `loadSettings` or login fails; load errors must not abort `pluginLoad`.
- Actions log:
  - Root cause: `pluginLoad` returned before `addSettingTab` when `loadSettings` returned false (migration or `loadData` failure).
  - Always call `addSettingTab` after `loadSettings`; continue initialization with a notice on partial load.
  - `loadSettings`: migration errors keep in-memory merge without auto-save; total failure falls back to defaults and sets `settingsReady`.
  - Copied `dist/` to `<pilot-vault>/.obsidian/plugins/tickticksync/`.
- Validation: `npm test -- --run` 57 files / 481 passed; `npm run build` OK.
- Problems: Test vault `manifest.json` still lists `author: thesamim` (fork); community browser may show upstream X-isfor-Adam if BRAT points elsewhere (`open`).
- To Be Done: Reload plugin in Obsidian; open settings via gear on plugin row in Settings → Community plugins.
- References: `CHANGELOG.md`, `src/main.ts`

### Iteration 2026-10-16 05:36 UTC

- Context: Re-enabling TickTickSync in Obsidian wiped GTD preset fields (`syncedLists`, `tagListMappings`, etc.) in test vault `data.json`.
- Target: Enable/disable must only merge missing keys from defaults; never persist in-memory defaults over an existing `data.json`.
- Actions log:
  - Root cause: `updateSettings` always called `settingsStore.set`, which auto-saved; settings tab was registered before `loadSettings`, so `DeviceIdentitySection` could `updateSettings({ devices })` while module settings were still `DEFAULT_SETTINGS` and overwrite disk.
  - `loadSettings` before `addSettingTab`; `settingsReady` gate on `saveSettings`; load uses `mergeSettingsWithDefaults` + `updateSettings(..., { persist: false })` then one save after merge.
  - `settingsLoad` always refreshes `currentPlugin` and re-hydrates the Svelte store without save on re-enable.
  - Added `src/settingsMerge.ts` and `src/test/settingsMerge.test.ts`; `DeviceIdentitySection` uses non-persisting device merge then explicit save.
  - Re-merged `00 Inbox/TTS-data-preset.json` into test-vault `data.json` (kept token, checkPoint, inbox, devices); copied `dist/` to Thinkpad-tts-test.
- Validation: `npm test -- --run` 57 files / 481 passed; `npm run build` OK.
- Problems: Real Obsidian re-enable with settings tab open not re-tested in UI yet (`open`).
- To Be Done: Disable and re-enable plugin with GTD tab open; confirm `data.json` keeps six `syncedLists` and tag mappings.
- References: `CHANGELOG.md`, `src/main.ts`, `src/settings.ts`, `src/settingsMerge.ts`, `src/ui/settings/settingsstore.ts`

### Iteration 2026-10-16 05:30 UTC

- Context: Test vault owner wants login at plugin start (stored username/password), lists in GTD section without a click on Login.
- Target: On load auto-authenticate, then refill list cache and refresh GtdSection; preset applied to test vault `data.json`.
- Actions log:
  - Found: no auto-login existed (`initializePlugin` only said "Please login from settings"); creds were never stored.
  - Added `src/autoLogin.ts` (`ensureSession`): no token + creds -> login; token rejected (`getUserStatus` null) + creds -> re-login; no creds -> old behavior.
  - `main.ts`: `ensureLoggedIn()` at the start of `initializePlugin()`; applies `loginPatch` (GTD settings kept); `bumpProjectsVersion()` after `saveProjectsToCache`.
  - New `src/projectsVersion.ts` store; `GtdSection.svelte` reloads lists on it (+ re-run if a reload was in flight).
  - New optional settings keys `username`, `password` (plaintext in `data.json`); `AccessControlLogin.svelte` prefills and saves them on change; banner text updated.
  - Merged `00 Inbox/TTS-data-preset.json` into test-vault `data.json` (token, checkPoint, inboxID, inboxName, devices kept); backup `/tmp/tts-data.json.bak`.
  - Built and copied `dist/main.js`, `styles.css`, `manifest.json` to Thinkpad-tts-test.
- Validation: `npm test -- --run` 56 files / 478 passed (new `autoLogin.test.ts`); `npm run build` OK; `tsc --noEmit` clean; `cmp dist/main.js` = vault copy.
- Problems: test-vault `data.json` has no `username`/`password` yet, so auto-login only re-logs in once they are added (`open`); Obsidian was running during edit, a running plugin can overwrite `data.json` (`open`, reload plugin).
- To Be Done: Add `username`/`password` (settings or data.json), reload plugin, check lists appear in GTD section; then pilot checklist in `PO_STATUS.md`.
- References: `CHANGELOG.md`, `src/autoLogin.ts`, `src/main.ts`, `src/projectsVersion.ts`, `src/ui/settings/svelte/AccessControlLogin.svelte`, `<pilot-vault>/.obsidian/plugins/tickticksync/data.json`

### Iteration 2026-10-16 05:25 UTC

- Context: GTD table (synced lists, tag→list mapping) empty after every login; preset in `data.json` was gone (`syncedLists`/`tagListMappings` = `[]`).
- Target: Login and settings UI never clear GTD settings; failed list fetch shows an error.
- Actions log:
  - `GtdSection.svelte`: fill inputs from store before the async list fetch; save one field per edit (was: all inputs, empty ones overwrote `tagListMappings`/`syncScopeFolders`/`projectTemplatePath`); no save before mount; reload lists on token change + button; error text on fetch failure.
  - `main.ts` `migrateData`: dropped `saveSettings()` that wrote in-memory DEFAULT_SETTINGS over `data.json` on load.
  - `loginSettings.ts` + `AccessControlLogin.svelte`: login patches only token/inbox/checkpoint.
  - Added `src/test/loginSettings.test.ts`; deployed `dist/main.js`, `styles.css` to Thinkpad-tts-test.
- Validation: `npm test` 471 passed; `npm run build` OK. `data.json` not touched (re-apply preset).
- Problems: root cause of the file wipe was two paths (GtdSection full-field save after failed `onMount`; default-settings save in `migrateData`); real-UI re-check pending (`open`).
- To Be Done: Re-apply GTD preset in `data.json`, restart plugin, login again, confirm table stays filled.
- References: `CHANGELOG.md`, `src/ui/settings/svelte/sections/GtdSection.svelte`, `src/main.ts`, `src/loginSettings.ts`

### Iteration 2026-10-16 06:10 UTC

- Context: GTD MVP code landed; test vault needed deploy and `TTS-*` preset before pilot.
- Target: Build plugin and align test-vault `data.json` with list-file mode (not hub).
- Actions log: `npm run build`; copied `dist/` to test vault; set `syncedLists`, `syncScopeFolders`, `projectTemplatePath`, `TTS-*` tag mappings, `projectsListName`/`projectsListId`; cleared `newTasksFile`; updated `TTS-PILOT.md`, `PO_STATUS.md` checklist.
- Validation: `npm run build` OK.
- Problems: Hub mode and per-list files remain mutually exclusive (`open`).
- To Be Done: Owner runs pilot steps in `PO_STATUS.md` §6.
- References: `CHANGELOG.md`, `PO_STATUS.md`, `1e62ac3c-b7eb-4c25-ac0c-60e7e5cbacb9`

### Iteration 2026-10-16 05:00 UTC

- Context: Owner said "go" on GTD MVP (`GTD_SYNC_RESEARCH.md` §6.3–6.4); branch `abyss-mapping`, not committed.
- Target: No stub files for non-synced lists; `syncedLists` / `syncScopeFolders` / `projectTemplatePath`; source-tag fix; GTD settings UI; safe fork defaults.
- Actions log:
  - Added `src/syncScope.ts` (allow-list match by name/id, rename heal, `SyncProject` migration, folder prefix scope).
  - G1: `ProjectSyncService` and `VaultSyncCoordinator.ensureProjectFilesExist` create entries/stubs only for allow-listed lists (never the scheme Projects list).
  - Pull gate: `VaultSyncCoordinator.matchesFilter` + `syncModule` filter + `ProjectSchemeService` (skips when Projects list not allowed); empty list = nothing + notice.
  - Push scope: `TaskModificationDetector` (new, modify, file scan), `TaskDeletionHandler`, checkbox handler in `main.ts`; tasks folder/projects folder/hub file always in scope.
  - R1/AC-9: `TaskParser.hasTickTickTag` accepts `#obsidian` when `ticktick_id` is present.
  - `projectScheme.renderProjectTemplate` (skips `<%*` blocks, fills title/id/date, forces tags/ticktick_id/Active Zone); used when `projectTemplatePath` is set.
  - New UI section "GTD and projects" (`GtdSection.svelte`); defaults: `fileLinksInTickTick=noLink`, `stopInjectingTickTickTag=true`, interval 0, `syncedLists=[]`.
  - Tests: new `syncScope.test.ts`, `taskParser.sourceTag.test.ts`; extended `ProjectSyncService`, `VaultSyncCoordinator`, `projectScheme` tests.
- Validation: `npm test` → 54 files, 468 tests passed; `npx tsc --noEmit` clean; `npm run build` OK. Not run in Obsidian.
- Problems:
  - Existing installs with `SyncTag` but no `SyncProject` now get `syncedLists=[]` (pull nothing) until lists are ticked (`open`, by design).
  - Hub mode (`newTasksFile`) writes every allowed list into one file; pilot vault has it set (`open`, owner choice).
  - Reverse `projectMappings` still unwired (`open`).
- To Be Done: Install build in test vault, tick `TTS-*` lists, run plan A/B; then decide hub vs per-list files.
- References: `CHANGELOG.md`, `TODO.md`, `src/syncScope.ts`, `src/services/ProjectSyncService.ts`, `src/services/VaultSyncCoordinator.ts`, `src/ui/settings/svelte/sections/GtdSection.svelte`

### Iteration 2026-10-16 05:15 UTC

- Context: GTD research subagent finished; test vault `data.json` had drifted to unlimited sync.
- Target: Re-harden test vault before any manual sync; align Abyss project folder with `10 Projects/`.
- Actions log: Set `SyncTag=tts-test`, scheme on, tasks path `30 Tasks/TickTick`, `tagListMappings` for `type/*`; Abyss `membershipQuery` and Active Zone insertion; updated `PO_STATUS.md` §6.
- Validation: Read back test-vault `data.json` keys; no `npm test` (no code changes).
- Problems: Stub files for all lists still land under `30 Tasks/TickTick/` on sync until G1 fix (`open`).
- To Be Done: Owner confirms `GTD_SYNC_RESEARCH.md` §9; implement MVP items in `TODO.md` GTD section.
- References: `CHANGELOG.md`, `GTD_SYNC_RESEARCH.md`, `PO_STATUS.md`, `<pilot-vault>/.obsidian/plugins/tickticksync/data.json`

### Iteration 2026-10-16 05:35 UTC

- Context: Owner answered GTD research §9; pilot can use isolated TickTick lists.
- Target: Record decisions; create `TTS-*` lists; align test vault hub path.
- Actions log: Updated `PO_STATUS.md` §6 confirmations; MCP `create_project` for seven `TTS-*` lists; `newTasksFile` → `00 Inbox/TickTick-capture.md`; wrote `00 Inbox/TTS-PILOT.md` in test vault.
- Validation: TickTick MCP returned ids for all seven lists.
- Problems: `tagListMappings` still target production list names until soak remapped (`open`).
- To Be Done: Implement G1 + `syncedLists`; remap pilot to `TTS-*`; `projectTemplatePath` for MOC template.
- References: `CHANGELOG.md`, `PO_STATUS.md`, `GTD_SYNC_RESEARCH.md`, `<pilot-vault>/00 Inbox/TTS-PILOT.md`

### Iteration 2026-10-16 04:45 UTC

- Context: Owner wants GTD objects (tasks, projects), no root-level list files, clear settings, configurable folder/tag ↔ list/tag mapping.
- Target: One research report: how the plugin works, how Abyss defines a project, PO acceptance criteria, hypotheses A/B, recommended model.
- Actions log:
  - Read `PO_STATUS.md`, `ABYSS_MAPPING.md`, `PROJECT_STATE.md`, `src/settings.ts`, sync/routing/scheme code, settings UI, test vault templates and Abyss `data.json`.
  - Wrote `GTD_SYNC_RESEARCH.md` (analyst sections, gaps G1–G13, hypotheses A/B, recommendation R, test plans, open questions).
  - Added PO decision section to `PO_STATUS.md`; added next steps to `TODO.md`; refreshed `PROJECT_STATE.md` pointers.
- Validation: `npm test` → 52 files, 437 tests passed. No plugin code or vault files changed.
- Problems:
  - Root stubs come from `ProjectSyncService.checkProjectRename` for every list, regardless of Sync Tag/Project (`open`).
  - `projectMappings` reverse path (`pathForProjectId`) is not wired in pull routing (`open`).
  - Test vault `data.json` has empty `SyncTag`/`SyncProject` and scheme off, unlike `PO_STATUS.md` §2 (`open`, do not Sync now).
  - Obsidian-born project lines with `#obsidian` may lack the `#ticktick` marker needed for detection (unverified, `open`).
- To Be Done: Owner answers §9 questions in `GTD_SYNC_RESEARCH.md`; then stubs fix, `syncedLists`, `syncScopeFolders`, GTD settings UI; soak per §4.3.
- References: `CHANGELOG.md`, `GTD_SYNC_RESEARCH.md`, `PO_STATUS.md`, `TODO.md`, `PROJECT_STATE.md`

### Iteration 2026-10-16 04:10 UTC

- Context: Owner does not want a sync when the plugin is enabled; settings come first.
- Target: Interval stays 0; remove the one-shot sync from plugin load.
- Actions log: Dropped the enable-time `scheduledSynchronization` call; rebuilt and copied into the test vault.
- Validation: `npm run build` OK; test-vault interval is 0.
- Problems: - No changes
- To Be Done: Enable the plugin, set options, then use Sync now.
- References: `CHANGELOG.md`, `src/main.ts`

### Iteration 2026-10-16 04:08 UTC

- Context: Owner wants no repeating sync, and one sync when the plugin is enabled.
- Target: Default interval 0; `pluginLoad` runs one sync if a token is saved.
- Actions log: Default `automaticSynchronizationInterval` set to 0; one-shot sync after `reloadInterval`; test-vault `data.json` interval set to 0; rebuilt and copied into the test vault.
- Validation: `npm run build` OK.
- Problems: - No changes
- To Be Done: Disable and enable TickTickSync in the test vault to run that one sync.
- References: `CHANGELOG.md`, `src/main.ts`, `src/settings.ts`

### Iteration 2026-10-16 03:59 UTC

- Context: Owner asked for missing Projects parents, missing subtasks, and a source tag.
- Target: Every root task in list Projects becomes a project note; children land in Active Zone; source tag `ticktick` or `obsidian`.
- Actions log: `isListRoot` replaces the `project`-tag gate; VaultSyncCoordinator prefers the parent note over a stale list file; notes stamped with source tag; child lines show `#obsidian` or `#ticktick`. Rebuilt and copied `main.js` into the test vault.
- Validation: `vitest run` projectScheme + projectParentKeep → 9 passed; `npm run build` OK.
- Problems: Checklist items inside a TickTick task are still not child tasks (`open`).
- To Be Done: Reload the test vault plugin and Sync Now; confirm Годовые задачи / PKM notes and Active Zone children.
- References: `CHANGELOG.md`, `src/projectScheme.ts`, `src/services/ProjectSchemeService.ts`, `src/services/VaultSyncCoordinator.ts`

### Iteration 2026-10-16 03:02 UTC

- Context: Owner confirmed PO §1 target scheme for projects.
- Target: Record approval; keep next step as Projects-only limited soak.
- Actions log: Updated `PO_STATUS.md` §5 and `PROJECT_STATE.md` Target.
- Validation: Owner message — “1 - yes, target scheme for projects is like that.”
- Problems: - No changes
- To Be Done: Configure test vault for Projects-only sync; try one parent task ↔ one note.
- References: `CHANGELOG.md`, `PO_STATUS.md`, `PROJECT_STATE.md`

### Iteration 2026-10-16 01:55 UTC

- Context: Restore TickTick after sync pollution; deliver PO brief for project-scheme direction.
- Target: Clean TT titles/tags; delete TTS samples; document desired TT↔Obsidian Projects flow for PO.
- Actions log:
  - Cleaned ~120 tasks via TickTick MCP `batch_update_tasks` (strip Obsidian title links, drop `ticktick` tag).
  - Deleted TTS samples A/B via MCP `delete_task`.
  - Hardened test-vault plugin settings (SyncTag `tts-test`, noLink, stopInject tag, 24h interval).
  - Wrote `PO_STATUS.md` for product-owner analysis.
- Validation: MCP `filter_tasks` tag=`ticktick` → empty; probe task title clean; samples deleted.
- Problems: Web-session `batch/task` POST returned 403 earlier (`resolved` via MCP Open API).
- To Be Done: PO review of `PO_STATUS.md`; then limited Projects-only soak.
- References: `CHANGELOG.md`, `PO_STATUS.md`, `PROJECT_STATE.md`

### Iteration 2026-10-16 01:30 UTC

- Context: Parse live test-vault settings and compare Obsidian copy vs TickTick account after first sync.
- Target: Clear inventory of settings effect and cross-side mutation.
- Actions log: Read `data.json`; counted vault `ticktick_id`s; queried TickTick projects/tasks via plugin session.
- Validation: Obsidian ~123 synced ids in 8 files; TickTick ~224 open tasks across lists; 123 TT tasks now have `ticktick` tag + Obsidian title links; samples A/B in Inbox with empty note body.
- Problems:
  - Sync limits still empty → full mirror behavior remains (`open`).
  - TickTick titles/tags polluted by bidirectional link injection (`open` for cleanup).
  - Abyss note lines on A not present in TT `content`/`desc` (`open`).
- To Be Done: Set SyncTag / raise interval; decide cleanup of TT title links + `ticktick` tags; optional re-sync notes.
- References: `CHANGELOG.md`, `<pilot-vault>/.obsidian/plugins/tickticksync/data.json`

### Iteration 2026-10-15 11:12 UTC

- Context: User ran first sync on Thinkpad-tts-test after login.
- Target: Assess limited-sync soak result and real-vault safety.
- Actions log: Inspected `data.json`, `TTS-Test.md`, new root project notes, backup CSV; compared real Thinkpad vault.
- Validation: Local samples A/B got `ticktick_id` + Inbox links; ~123 `ticktick_id` lines across 8 files; real vault has no TTS plugin / no `Inbox.md`.
- Problems:
  - Sync limits wiped: `SyncTag`/`SyncProject` empty, Abyss off, interval 300s → full list pull into test vault (`open` for settings UX).
  - Root notes `Inbox.md`, `Projects.md`, etc. + empty numbered stubs created in test vault only (`mitigated` by copy isolation).
- To Be Done: Re-apply SyncTag `tts-test` + raise interval in UI before next sync; disable plugin or pause sync; decide cleanup of pulled list files in copy.
- References: `CHANGELOG.md`, `<pilot-vault>/00 Inbox/TTS-Test.md`

### Iteration 2026-10-15 11:03 UTC

- Context: Resume Abyss fork soak-test after TickTick web backup; user created Open API token.
- Target: Safe test vault with rebuilt plugin and limited-sync defaults (no full account pull).
- Actions log:
  - Rebuilt `abyss-mapping` (`npm ci` + `npm run build`).
  - Copied vault `<live-vault>` → `<pilot-vault>`.
  - Installed plugin into copy; enabled in community-plugins; registered vault in Obsidian.
  - Wrote limited-sync `data.json` (SyncTag `tts-test`, Abyss on, 24h interval) + `00 Inbox/TTS-Test.md` / `TTS-SETUP.md`.
- Validation: `npm run build` → dist `main.js`/`styles.css` OK; plugin files present under test vault plugins dir.
- Problems:
  - Open API `tp_…` token does not auth this plugin (session login only); token was pasted in chat — revoke recommended (`open`).
- To Be Done:
  - User: revoke/rotate exposed API token.
  - User: open Thinkpad-tts-test → plugin login → tag 2–3 TT tasks `tts-test` → Sync Now.
  - Observe first sync; only then widen Sync Project/Tag.
- References: `CHANGELOG.md`, `TODO.md`, `ABYSS_MAPPING.md`, `<pilot-vault>/00 Inbox/TTS-SETUP.md`
