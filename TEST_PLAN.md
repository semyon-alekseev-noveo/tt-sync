# Test plan

Manual cases for behavior changes. Automated tests do not replace a row here.

`ABYSS_FIRST_CASES.md` is the acceptance catalog (AF-*, the one live gate). This file is the per-PR test plan. A PR that changes behavior adds a section in the same PR: steps, expected result, pilot status. Reviewers and tester agents reject the PR when that section is missing or does not cover the diff. Process: `DEV_FLOW.md`.

Pilot means `<pilot-vault>`, manual **Synchronize**, plugin id `tickticksync-abyss`. Do not use `<live-vault>`. A cloud agent does not mark a row passed. Status stays **not run** until a person or a local agent on that Obsidian records what they saw.

## PR #1 — fail-closed sync, open-note push, comments

Branch `abyss-mapping` (PR #1 merged). Release build under test: **2.0.48** (tag on `tt-sync`). Manual rows below stay **not run** until executed on `<pilot-vault>` with that build installed.

Preconditions unless a case says otherwise: logged in, `syncNotes` and `abyssTasksFormat` on, `syncAbyssCommentsViaApi` on, the note is inside `syncScopeFolders`, sync is manual.

### TP1-DEBOUNCE — open note pushes 5 seconds after the last keystroke

1. Open an in-scope note. Edit the title of a line that already has `ticktick_id`. Keep the caret in that note.
2. Wait 4 seconds. Do not run Synchronize.
3. Wait until 5 seconds after the last keystroke.

Expected: nothing is pushed at 4 seconds. After 5 seconds of quiet the edited task updates in TickTick. Another keystroke before 5 seconds restarts the wait. One pause produces one push, not one push per keystroke.

### TP1-ID-ONLY — the debounced push ignores lines with no TickTick id

1. In the same open note, add a new checkbox with a real title and no `ticktick_id`. Leave the caret in the note.
2. On another line, change a task that already has `ticktick_id`.
3. Wait 5 seconds without leaving the note and without Synchronize.

Expected: the existing task updates in TickTick. The new checkbox is not created in TickTick and is not deleted from the note. It gains an id only later (TP1-NEW-ON-LEAVE or TP1-NEW-ON-SYNC).

### TP1-CARET-UNFINISHED — an open `%%` on the caret line is not pushed

1. On a task line that already has `ticktick_id`, start an Obsidian comment and stop with an odd number of `%` (type `%%` once, or a bare `%`). Leave the caret on that line.
2. Wait 5 seconds.
3. On a different line in the same note, change another task that already has an id. Wait 5 seconds with the caret still on the unfinished line.

Expected: the unfinished line is not sent to TickTick (no half-typed title, no new task from `%`). The other identified line does update. A finished line under the caret is not skipped: if the caret sits on a complete task with an id, that task is included in the debounced push.

### TP1-DURING-SYNC — no debounced push while a sync is running

1. Start **Synchronize** (or reload so startup sync is running).
2. While it is running, edit an identified task in the open note and let 5 seconds pass before sync finishes.

Expected: that pause does not push. The notice for the in-flight sync is the only sync notice. After sync ends, a new edit plus another 5 seconds of quiet does push. The pause that elapsed during sync does not fire a late push by itself.

### TP1-SWITCH-FILE — leaving the note before 5 seconds

1. Edit an identified task and switch to another note before 5 seconds.

Expected: the debounced push for the note you left does not run. This does not cancel the older paths: moving the caret off a new checkbox still creates it (TP1-NEW-ON-LEAVE), and saving a note that is no longer active can still create new tasks through the existing file-modify handler.

### TP1-NEW-ON-LEAVE — a new checkbox is created when the caret leaves the line

1. On a new line type `- [ ] pilot debounce task` with a finished title. Do not add `ticktick_id`.
2. Stay on that line for more than 5 seconds.

Expected: TickTick does not gain the task yet.
3. Move the caret to another line.

Expected: the task is created and the line receives `ticktick_id`. **Synchronize** on a note that contains a finished new checkbox also creates it (TP1-NEW-ON-SYNC).

### TP1-NEW-ON-SYNC — Synchronize still creates a finished new checkbox

1. Add a finished checkbox with no id. Do not leave the line and do not wait for a create.
2. Run **Synchronize**.

Expected: the task is created and the line receives `ticktick_id`. An unfinished line (`- [ ] %%` or a blank title) is still not created.

### TP1-CHILD-COMMENT — a child comment line pushes the parent

1. Under a synced task, edit only a child comment bullet (`- 2026-10-19 20:00: hello`). Do not change the parent title.
2. Leave that child line, or wait 5 seconds in the note.

Expected: TickTick’s Comments panel shows the new text on that same task. The parent title is unchanged. The description stays in the task body.

### TP1-CHILD-DESC — a child description line pushes the parent

1. Edit only the `- >` description under a synced task.
2. Leave that line, or wait 5 seconds.

Expected: TickTick task content/description updates. The line is not created as a separate task and does not appear as a comment.

### TP1-SIBLING-COMMENTS — neighbouring comment bullets stay separate

1. Under one synced task write two comment bullets:
   `- alpha`
   `- beta`
2. Synchronize.

Expected: TickTick shows two comments, `alpha` and `beta`. It does not show one comment whose text is both lines joined. A continuation line (deeper indent, no bullet) stays part of the comment above it.

### TP1-PULL-FAIL — a failed pull is visible and does not skip ahead

1. Note the plugin `checkPoint` (settings data; do not copy `data.json` into git). Turn off the network or use a bad session.
2. Change a task in TickTick that this vault already has.
3. Run **Synchronize**.

Expected: a notice starting with `Sync failed:` and the error text. The notice is not `Sync completed.`. The vault line does not change. `checkPoint` is unchanged. Auto-cleanup does not run for this manual sync (a tombstone you can still recover stays recoverable).
4. Restore the network and Synchronize again.

Expected: notice `Sync completed.` The TickTick change from step 2 arrives. A checkpoint that had moved ahead would have dropped that change.

Scheduled sync uses the same failure notice and also skips auto-cleanup. Startup is different: after a failed startup sync you still get `Sync failed: …`, the checkpoint stays, and auto-cleanup **does** run once because load always calls it after startup sync. Do not treat that startup cleanup as a failure of this case.

### TP1-LOAD-NOTICE — load notice follows the backup setting

1. Set skip-backup off. Reload Obsidian after a successful login.
2. Set skip-backup on. Reload again.

Expected: step 1 notice is `TickTickSync loaded successfully. TickTick data has been backed up.` Step 2 notice is `TickTickSync loaded successfully. Skipping backup.` A failed startup sync adds a second notice `Sync failed: …` and does not replace the load sentence.

### TP1-STALE-COMMENT — TickTick-only comments are detected by text, not by order

1. Give a synced task two comments that already match the vault bullets, in either order. Synchronize twice.

Expected: the second sync does not rewrite the comment lines and does not add a duplicate.
2. Add a comment only in the TickTick Comments panel. Synchronize.

Expected: a new comment bullet appears under the same task. The comparison is the comment text (trimmed, case-insensitive, inner whitespace collapsed). A vault bullet whose text is not the TickTick title is treated as different. After the first pull, a second Synchronize must not change those lines. If a time stamp in the bullet makes every later sync rewrite the note, record **fail** and paste the before/after bullets.

### TP1-COMMENT-MAP — deleting a task drops its comment map

1. Sync a task that has a comment, so TickTick has that comment.
2. Delete the line, Synchronize, confirm the deletion dialog.
3. Synchronize again.

Expected: the TickTick task is gone after the confirm. The second sync does not recreate that comment on another task and does not end with `Sync failed:`. The same cleanup applies when TickTick deletes the task and the pull marks it deleted. A new task does not reuse the deleted task’s comment ids.

### TP1-QUIET-TITLE — a TickTick title change with no `modifiedTime` bump still arrives

1. Rename a synced task in TickTick in a way that does not bump `modifiedTime` (edit the title and save if the app leaves the timestamp unchanged). If you cannot produce that, mark this row **not run** and say so.
2. Synchronize.

Expected: the vault line shows the new title. The plugin reads the task from TickTick once when the cached copy still matches the line. It does not need a second read of the same task in the vault-write loop.

### Regression — behavior that already worked and must keep working

Pilot status for each: **not run**.

| ID | Steps | Expected |
|----|--------|----------|
| TP1-R-SYNC-OK | With the network up, **Synchronize**. | Notice is `Sync completed.` A real task edit in the vault is on TickTick afterwards. |
| TP1-R-CHECKPOINT | After TP1-R-SYNC-OK, compare `checkPoint` with the value from before that sync. | It may advance. A later TickTick edit still arrives on the next successful sync (the success path did not freeze the checkpoint). |
| TP1-R-TITLE | Change only the title of a synced line. Move the caret off the line. | TickTick title updates. The line stays in the same note. |
| TP1-R-DESC-FIELD | Set a `- >` description and a comment on the same task. Synchronize. | Description is the task body. The comment is in Comments, not inside that body. |
| TP1-R-HASH-COMMENT | Change only a comment, then Synchronize again without editing the parent title. | The comment still reaches TickTick (the 2.0.47 case where an unchanged parent hash dropped the comment). |
| TP1-R-KEYSTROKE | Type several characters in an open synced line and stop before 5 seconds, then keep typing. | TickTick does not update on each keystroke. `vault` modify still ignores the file you are typing in. |
| TP1-R-UNFINISHED-LEAVE | Type `- [ ] %%` and move the caret off the line. | No TickTick task is created. |
| TP1-R-CHECKBOX | Toggle a synced checkbox. | The TickTick task completes or reopens. |
| TP1-R-DEL | Delete one synced line, Synchronize, confirm. On a second line, delete, Synchronize, cancel. | Confirm removes the TickTick task. Cancel leaves it. One dialog for the confirm, not a silent success. |
| TP1-R-SCOPE | Edit a checkbox in a note outside `syncScopeFolders`. Leave the line and Synchronize. | TickTick is unchanged. |
| TP1-R-SUBTASK | A checkbox with its own `ticktick_id` under a parent, and a checklist item with a 24-character item id. Synchronize. | The subtask stays its own task. The checklist item stays an item. Neither is turned into a comment. |

## Results

Release **2.0.48** (`8f4c524`, tag pushed 2026-10-20). Pilot plugin on `Thinkpad-tts-test` updated from `dist/` (manifest **2.0.48**). BRAT frozen version set to **2.0.48**. GitHub Actions **Release Obsidian plugin** publishes the zip when the tag workflow finishes.

| ID | Pilot status | Evidence |
|----|----------------|----------|
| AUTO-GATE | pass (CI) | `npx vitest run` on **2.0.48** → 569 passed. |
| TP1-DEBOUNCE | pass | Sam: rename with id in `manual-test`, ~5s → TT title updated (no ribbon). |
| TP1-ID-ONLY | pass | New line without id not pushed on debounce; titled line updated quickly. Id for new line: **Synchronize** or leave line (not debounce-only). |
| TP1-CARET-UNFINISHED | pass | Broken `%%` line not sent; needed one **Synchronize** before id on another new line. |
| TP1-DURING-SYNC | not run | Same. |
| TP1-SWITCH-FILE | not run | Same. |
| TP1-NEW-ON-LEAVE | partial | Task created on leave with id; watch blank `- [ ]` line at EOF — may create empty TT task. |
| TP1-NEW-ON-SYNC | pass | `00 Inbox/tp1-cli-smoke.md`: two new lines → **Synchronize** (`tickticksync-abyss:tts-sync`); ids `6ad6d78f…`, `6ad6d915…`. Journal `2026-10-20.jsonl`. |
| TP1-CHILD-COMMENT | fail | **2.0.51** pilot: `gate-comment-249` `6ad6f43a…` — child line `gate-251-retest-b` stripped on sync; MCP `get_comment` empty. |
| TP1-CHILD-DESC | pass | `- > tp1-desc-2048` → TickTick `content` = `tp1-desc-2048` (task `6ad6d78f…`, MCP). |
| TP1-SIBLING-COMMENTS | not run | Blocked on comment API push. |
| TP1-PULL-FAIL | not run | Network/session toggle not automated this session. |
| TP1-LOAD-NOTICE | not run | Needs two Obsidian reloads + notice read. |
| TP1-STALE-COMMENT | not run | |
| TP1-COMMENT-MAP | not run | Needs deletion confirm modal. |
| TP1-QUIET-TITLE | not run | |
| TP1-R-SYNC-OK | pass | CLI sync + journal `commit` lines; pilot vault updated. |
| TP1-R-CHECKPOINT | pass | `checkPoint` unchanged on no-delta sync (`1792465263108`); advances on pull when TT changes. |
| TP1-R-TITLE | pass (UI) | Sam: title change in editor behaves like debounce path. CLI disk-only rename still fails (journal `mvg3m29s`). |
| TP1-R-DESC-FIELD | partial | Desc in `content` pass; comment in Comments panel fail (same as TP1-CHILD-COMMENT). |
| TP1-R-HASH-COMMENT | not run | |
| TP1-R-KEYSTROKE | not run | Editor-only. |
| TP1-R-UNFINISHED-LEAVE | not run | Editor-only. |
| TP1-R-CHECKBOX | not run | UI checkbox. |
| TP1-R-DEL | not run | Confirm/cancel modals. |
| TP1-R-SCOPE | not run | |
| TP1-R-SUBTASK | not run | |

Pilot run **2026-10-20** (Obsidian CLI + `command id=tickticksync-abyss:tts-sync`, journal wait). Note: `plugin.syncRunning` stayed `true` in eval after a forced clear; use journal commits, not `syncRunning`, to detect completion.

## PR — sync perf index and file cache

Branch merged in **2.0.50**. Pilot vault **Thinkpad-tts-test**, plugin **2.0.50** (owner install). Automated run 2026-10-20 via Obsidian CLI + hook on `syncActivity.endFull` (see Results).

What this PR must not change: which TickTick calls a sync makes, and which file wins for an id. `vaultLineBehindTask` still calls `getTaskById` and `getTaskComments` on the same conditions as before. The id scan is still the first markdown file in vault order whose text contains the id (`String.includes`), including text inside a fence. Empty ids are ignored.

Preconditions unless a case says otherwise: logged in, `syncNotes` and `abyssTasksFormat` on, `syncAbyssCommentsViaApi` on, the note is inside `syncScopeFolders`, sync is manual, log level is info (the default).

### TP-PERF-LOG — one structured summary per full sync

1. Run **Synchronize** on the pilot vault.
2. Open the plugin log (info or debug).

Expected: one new line that starts with `[perf]` and then one JSON object. The object has `trigger` `manual`, `phaseMs` for the phases that ran (`prepare`, `projects`, `register`, `push`, `pull`, `vaultReconcile`, `subtasks`, `syncFiles`; `journal` inside pull when the journal wrote; `comments` inside vault reconcile when comments were fetched; `backup` when a backup ran), and `counts`: `httpByEndpoint` (with `getTaskById` and `getTaskComments` when those HTTP calls happened), `http429`, `filesRead`, `filesScanned`, `tasksChecked`, `vaultWrites`. A second Synchronize writes a second line.

### TP-PERF-UI — the finished sync notice shows a short count line

1. Run **Synchronize** so the progress notice is visible.
2. Read the notice before it hides.

Expected: the finished notice still says the sync completed or failed, and its detail line is `api N · probe N · read N · write N`. If TickTick returned HTTP 429, the line also ends with `· 429 N`.

### TP-PERF-SAME — a quiet sync still probes and does not rewrite the line

1. Pick a synced line whose title, status, and body already match TickTick.
2. Do not edit the note. Run **Synchronize**.
3. Compare the line and the TickTick task with what they were before the sync.

Expected: the line text is unchanged. The `[perf]` counts include one `getTaskById` probe for that quiet task, and a comments fetch when the line still matches (`probe` at least 1). A task whose title already differs, and a deleted task, are not probed. This is the same probe as on PR #1.

### TP-PERF-ACTIVE — the open-note push still pushes and logs its own summary

1. Open an in-scope note. Edit a line that already has `ticktick_id`. Wait 5 seconds of quiet (TP1-DEBOUNCE).
2. Read the plugin log.

Expected: TickTick shows the edit, same as on PR #1. One `[perf]` line has `"trigger":"active-file"` and an `activeFile` phase. It is a separate line from a full Synchronize summary.

### Regressions

| ID | Steps | Expected |
|----|--------|----------|
| TP-PERF-R-PROBE | Quiet title match, as in TP1-QUIET-TITLE. | Still one `getTaskById` for that task. Comments are still fetched when the line matches. |
| TP-PERF-R-FENCE | The same `ticktick_id` appears only inside a fenced code block in an earlier file, and as a real task in a later file. Synchronize. | The id is still treated as present in the earlier file. The later task is not treated as missing from the vault. |
| TP-PERF-R-DUP | The same `ticktick_id` is in two notes. Synchronize. | The first markdown file in vault order is the one associated with that id, same as before. |
| TP-PERF-R-MOVE | Move a synced task line from note A to note B (cut and paste), then Synchronize. | The task is found in B. The sync does not keep using A's old text. |
| TP-PERF-R-SYNC-OK | With the network up, **Synchronize**. Then compare `checkPoint` with the value from before that sync. | Notice is `Sync completed.` A real task edit in the vault is on TickTick afterwards. The checkpoint may advance. A later TickTick edit still arrives on the next successful sync. |

## Results

| ID | Pilot status | Evidence |
|----|----------------|----------|
| TP-PERF-LOG | partial | CLI hook on `console.info` did not persist across `obsidian` invocations; no `[perf]` JSON file captured. **Manual:** DevTools → filter `[perf]` on one **Synchronize** — expect one JSON line with `trigger:"manual"`, `phaseMs`, `counts`. |
| TP-PERF-UI | pass | After **Synchronize** (hooks in same Obsidian session): notice detail `api 254 · probe 126 · read 735 · write 0` (quiet-ish run); second run same session `api 721 · probe 716 · read 737 · write 1`. Matches `formatSyncPerfShort`. |
| TP-PERF-SAME | pass | Task `6ad5bb47…` in `00 Inbox/abyss-active.md`: line md5 unchanged across sync; `probe` ≥ 126 on first captured run (vault ~719 `.md` files). |
| TP-PERF-ACTIVE | not run | Needs editor open + 5 s debounce; not automated this session. |
| TP-PERF-R-PROBE | partial | Same as TP-PERF-SAME (`probe` 126 / 716 logged); no per-task TT API audit. |
| TP-PERF-R-FENCE | not run | No dedicated fence fixture exercised. |
| TP-PERF-R-DUP | not run | No duplicate-id fixture run. |
| TP-PERF-R-MOVE | not run | |
| TP-PERF-R-SYNC-OK | pass | **Synchronize** completed; `checkPoint` `1792472586718` → `1792472716421` on one run; unchanged on no-delta run. Vault line stable when quiet. |

Pilot **2026-10-20** (agent, **2.0.50**): Obsidian CLI `tts-sync`; avoid polling with repeated `obsidian eval` during sync (reload drops hooks). CI: `syncPerf.test.ts`, `vaultIdScan.equivalence.test.ts`, `syncFileCache.test.ts`, `vaultIdScan.bench.test.ts` — pass on `abyss-mapping`.

## PR — BUG-COMMENT-NO-PUSH and delta docs

Branch targets `abyss-mapping`. Build from this branch (not necessarily a GitHub release tag until owner publishes).

Preconditions: same as TP1-CHILD-COMMENT (`syncAbyssCommentsViaApi` on, in-scope note with `ticktick_id`).

### TP-BUG-COMMENT-NO-PUSH — child comment reaches TickTick Comments after Synchronize

1. On a synced task, add a child comment bullet (title unchanged). Save the note.
2. Run **Synchronize** once (no need to edit the title line).

Expected: the text appears in the TickTick **Comments** panel, not only in task `content`. Matches **NOTE-L3b** / `ABYSS_FIRST_CASES.md` **BUG-COMMENT-NO-PUSH**.

Automated: `bugCommentNoPush.test.ts`, `synchronizationInner.integration.test.ts` (`BUG-COMMENT-NO-PUSH pushes comments when vault mtime is below TickTick checkpoint`). `getUpdatedTasks.deltaAdd.test.ts` covers delta `add` merge only (no pilot).

| ID | Pilot status | Evidence |
|----|----------------|----------|
| TP-BUG-COMMENT-NO-PUSH | fail | **2.0.51** Thinkpad-tts-test: `00 Inbox/abyss-active.md` `6ad6f43a…`; journal `sync-mvgaaegu` / `sync-mvg8smb7` **tt→obs** removed `gate-251-l3b-agent` / `gate-251-retest-b`; TickTick Comments empty (MCP). Plugin version via eval `2.0.51`. |

## Release 2.0.52 — vault comments survive a line rewrite

Tag **2.0.52** (`b974d85`) shipped on `abyss-mapping` without this section. The build keeps a vault comment that is not inside a synced `Comments:` block when the task line is rewritten, and `persistToFile` pushes those comments to the Comments API before the write. It does not remove a comment that was deleted in TickTick; that case is **TP-COMMENT-TT-DELETE** in the hotfix section below.

Preconditions: `syncAbyssCommentsViaApi` on, in-scope note, task already has `ticktick_id`. Install **2.0.52** (or a later build that still contains this keep-and-push behavior).

### TP-252-KEEP-ON-REWRITE — a title change in TickTick leaves the vault comment in place

1. On a synced task, add a child comment bullet. Run **Synchronize** once.
2. Change only the task title in TickTick. Run **Synchronize** again.

Expected: the comment bullet is still under the task. The title matches TickTick.

### TP-252-PUSH-BEFORE-REWRITE — the same bullet reaches TickTick Comments

Same steps as **TP-BUG-COMMENT-NO-PUSH** / **NOTE-L3b**, on a **2.0.52** build: child comment, title unchanged, one **Synchronize**.

Expected: the text is in the TickTick Comments panel, and the bullet is still in the note.

| ID | Pilot status | Evidence |
|----|----------------|----------|
| TP-252-KEEP-ON-REWRITE | not run | |
| TP-252-PUSH-BEFORE-REWRITE | not run | NOTE-L3b was not re-run on **2.0.52**. The **2.0.51** fail above is not a 2.0.52 result. |

## Delta API pilot (`docs/TICKTICK_DELTA_API.md` §3.5)

Run **before** replacing `modifiedTime` echo suppression with `etag` or dropping per-task `getTaskById` on idle sync. Needs a logged-in session (MCP or local `batch/check` capture). Record raw `update[]` fields (`modifiedTime`, `etag`, `commentCount`) in the Results table.

### TP-DELTA-MCP-RENAME — API rename in delta

1. Note `checkPoint` from meta or last successful sync.
2. Rename a pilot task via TickTick MCP or Open API (not the mobile/desktop app).
3. `GET batch/check/{checkPoint}` (or one **Synchronize** and log delta size).

Expected: task appears in `update[]`. Note whether `modifiedTime` and `etag` changed vs before.

### TP-DELTA-APP-RENAME — in-app rename in delta

Same as above, but rename in the TickTick app.

Expected: `modifiedTime` and `etag` typically change; task in `update[]`.

### TP-DELTA-COMMENT — comment added in TickTick app

1. Add a comment in the TickTick UI on a synced pilot task.
2. Inspect delta for that task id.

Expected: document whether the task is in `update[]` and whether `etag`, `modifiedTime`, or `commentCount` changed (**open** until pilot runs).

### TP-DELTA-CLOSE-DELETE — complete and trash

Complete one task and delete another. Inspect `update[]` / `delete[]`.

Expected: closed task may appear as `update` with `status` 2 or -1; deleted id in `delete[]` (**verify** on pilot).

### Delta pilot — Results

| ID | Pilot status | Evidence |
|----|----------------|----------|
| TP-DELTA-MCP-RENAME | not run | |
| TP-DELTA-APP-RENAME | not run | |
| TP-DELTA-COMMENT | not run | |
| TP-DELTA-CLOSE-DELETE | not run | |

## TP-IDLE-ZERO — quiet sync does not probe each task

Implemented from `docs/TICKTICK_DELTA_API.md` §3.2 before the §3.5 pilot, on the document's default: echo by `etag`, vault compare against Dexie, comments fetched only when `commentCount` differs from the vault thread count.

1. Install a build that contains this change. Do not edit the vault. Run **Synchronize**.
2. Read the `[perf]` line.

Expected: `getTaskById` is 0 and `getTaskComments` is 0 when no task's `commentCount` differs from its vault threads. A task whose Dexie title already differs is still rewritten from Dexie, without `getTaskById`.

| ID | Pilot status | Evidence |
|----|----------------|----------|
| TP-IDLE-ZERO | not run | Automated: `synchronizationInner.integration.test.ts` `TP-IDLE-ZERO`. |

## After §3.5 (`docs/TICKTICK_DELTA_API.md` §3.2)

Items 1 and 2 shipped in **2.0.53** from the §3.2 defaults, before the §3.5 pilot. Treating them as future work is outdated. The four `TP-DELTA-*` rows above are still **not run**, and `skipPushWhenTickTickRenamedVaultLine` is already off in **2.0.53** without that evidence. Items 3–5 are not started. `syncTaskBean.add` is already merged in `getUpdatedTasks`.

1. **Echo. Done in 2.0.53.** `pull.ts` skips a delta row only when `rt.etag === local.task.etag`. `skipPushWhenTickTickRenamedVaultLine` no longer calls `getTaskById`. Still open: persist `id2etag` from `batch/task` without the follow-up `getTaskById` inside `TicktickRestAPI.updateTask`.
2. **Idle vault. Done in 2.0.53.** `vaultLineBehindTask` compares the line to Dexie. `getTaskComments` runs only when `commentCount` is a number and differs from the vault thread count. A manual Repair command that calls `getTaskById` is not added. Pilot **TP-IDLE-ZERO** stays **not run** in the table above.
3. **Comments. Not started.** A TickTick-only comment that changes neither `etag`, `commentCount`, nor `update[]` is not left to a daily reconcile. Confirm that delay on the §3.5 pilot before coding it.
4. **Closed and trash. Not started.** `project/all/closed` and trash pagination are not a daily job.
5. **Daily job. Not started.** Closed window, trash, comment backfill, and one `batch/check/0` compare are not implemented.
6. **Tests.** `TP-IDLE-ZERO` and `TP-ECHO-ETAG` exist and pass in vitest. Their pilot status is **not run**. `TP1-QUIET-TITLE-ETAG`, `TP-COMMENT-COUNT`, and `TP-DAILY-RECONCILE` are not implemented.

## Hotfix — open note must not be rewritten from a stale snapshot

Branch `cursor/stale-editor-write-5809` into `abyss-mapping`. No version bump. Case **BUG-STALE-EDITOR-WRITE** in `ABYSS_FIRST_CASES.md` and `PO_STATUS.md`.

What changed: Comments API work finishes before the note is read for writing. A closed file is written only when it still matches that read; otherwise the same line spans are applied once to the fresh text. An open file is patched with `editor.transaction` / `replaceRange` on the task lines that still match. Typing in the last two seconds defers the write. `readFileContent` uses the editor only when `activeEditor.file` is the target file. A comment deleted in TickTick is removed using `taskCommentMaps` from the previous sync. The 5-second open-note push does not sweep comments. `lastVaultPushWallMs` is set after the vault writes.

Pilot vault only. None of these rows were run on a vault.

### TP-EDITOR-TYPE-DURING-SYNC — typing during Synchronize stays in the editor

1. Open a synced note. Start **Synchronize**.
2. While it runs, type a new sentence on a line that is not the task line being updated, and keep typing for a couple of seconds.

Expected: the sentence is still in the editor when the sync finishes. The task line is updated, or a notice says the open note will update when typing pauses. The journal `after` text for that file contains the sentence. The buffer is not cleared.

### TP-EDITOR-TYPE-DURING-PUSH — typing during the 5-second push stays in the editor

1. Open a synced note and edit a task line that already has `ticktick_id`.
2. Wait for the 5-second push. During that push, type on another line.

Expected: same as **TP-EDITOR-TYPE-DURING-SYNC**. The push does not call the Comments API unless a comment line changed.

### TP-EDITOR-OTHER-LEAF — another leaf's buffer is not written into this note

1. Leave note A open. Focus a hover editor or another leaf on note B.
2. Run **Synchronize** so it rewrites A.

Expected: A does not gain B's text. An empty buffer is never saved into A.

### TP-COMMENT-TT-DELETE — a comment deleted in TickTick leaves the note

1. On a synced task, confirm a comment exists both in the note and in TickTick Comments.
2. Delete that comment in TickTick. Run **Synchronize**.
3. Run **Synchronize** again without editing the note.

Expected: after the first sync the comment bullet is gone. The second sync does not rewrite the note (`tt→obs` count 0 for that file) and does not call `getTaskComments` for that task.

### TP-NO-SELF-REPUSH — a file the plugin just wrote is not a local edit

1. Run **Synchronize** so it rewrites a note. Do not edit that note.
2. Run **Synchronize** again.

Expected: the note is not scanned by the pre-pull local push. The comment sweep does not run for it.

### TP-STALE-FILE-WRITE — unit

Automated in `src/test/staleFileWrite.test.ts`. The file or the editor changes between the snapshot and the write. The write must not replace that newer text with text built from the snapshot. Also covers the other-leaf read and the two-second typing defer.

### Regressions

These already have automated tests. Re-run them with the suite. Do not mark a live row from an earlier section as passed because this suite passed.

| ID | What must still hold |
|----|----------------------|
| TP-IDLE-ZERO | A quiet sync performs no vault write and does not probe each task. |
| TP-BUG-COMMENT-NO-PUSH | A vault comment with no previous map entry is still kept and pushed. |
| BUG-PULL-COMMENT-STALE | A TickTick comment the note lacks is still written into the note. |
| TP1-DEBOUNCE | The open note still pushes about 5 seconds after the last keystroke. |
| NOTE-L3b | A child comment still reaches TickTick Comments. Live status stays the **2.0.51** fail until someone re-runs it. |

| ID | Pilot status | Evidence |
|----|----------------|----------|
| TP-EDITOR-TYPE-DURING-SYNC | not run | |
| TP-EDITOR-TYPE-DURING-PUSH | not run | |
| TP-EDITOR-OTHER-LEAF | not run | |
| TP-COMMENT-TT-DELETE | not run | Automated: `abyssStep3.test.ts`, `synchronizationInner.integration.test.ts`. |
| TP-NO-SELF-REPUSH | not run | Automated: `bugCommentNoPush.test.ts`, `synchronizationInner.integration.test.ts`. |
| TP-STALE-FILE-WRITE | not run | Automated only: `staleFileWrite.test.ts`. No vault run. |
