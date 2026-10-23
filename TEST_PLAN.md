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

Implemented from `docs/TICKTICK_DELTA_API.md` §3.2 before the §3.5 pilot, on the document's default: echo by `etag`, vault compare against Dexie, comments fetched only when `commentCount` differs from the vault thread count (or count is unknown with vault threads, or stamp twins).

**#62 slice 1 (this PR):** removed the `vaultThreads > 0` always-probe branch that re-fetched Comments on every quiet task that already had matching Abyss bullets. Matched `commentCount` + clean keys → no `getTaskComments`.

1. Install a build that contains this change. Do not edit the vault. Prefer a note with synced Abyss comments whose Dexie `commentCount` matches the vault thread count. Run **Synchronize**.
2. Read the `[perf]` line.

Expected: `getTaskById` is 0 and `getTaskComments` is 0 when no task's `commentCount` differs from its vault threads (and no stamp twins / unknown count). A task whose Dexie title already differs is still rewritten from Dexie, without `getTaskById`. Quiet tasks that already have matching comment threads must not appear in `httpByEndpoint.getTaskComments`.

| ID | Pilot status | Evidence |
|----|----------------|----------|
| TP-IDLE-ZERO | not run | Automated: `synchronizationInner.integration.test.ts` + `vaultCommentBehind.test.ts` `TP-IDLE-ZERO` (incl. matched-count skip). Live `[perf]` on tip → `docs/pilot/results/PERF-DELTA/`. |

## After §3.5 (`docs/TICKTICK_DELTA_API.md` §3.2)

Items 1 and 2 shipped in **2.0.53** from the §3.2 defaults, before the §3.5 pilot. Treating them as future work is outdated. The four `TP-DELTA-*` rows above are still **not run**, and `skipPushWhenTickTickRenamedVaultLine` is already off in **2.0.53** without that evidence. Items 3–5 are not started. `syncTaskBean.add` is already merged in `getUpdatedTasks`.

1. **Echo. Done in 2.0.53.** `pull.ts` skips a delta row only when `rt.etag === local.task.etag`. `skipPushWhenTickTickRenamedVaultLine` no longer calls `getTaskById`. Still open: persist `id2etag` from `batch/task` without the follow-up `getTaskById` inside `TicktickRestAPI.updateTask`.
2. **Idle vault. Done in 2.0.53; comment idle cut restored in #62 slice 1.** `vaultLineBehindTask` compares the line to Dexie. `getTaskComments` runs only when `commentCount` differs from vault threads, count is unknown with vault threads, or stamp twins (`vaultDupKeys`) — not merely because vault threads exist. A manual Repair command that calls `getTaskById` is not added. Pilot **TP-IDLE-ZERO** stays **not run** in the table above.
3. **Comments. Not started.** A TickTick-only comment that changes neither `etag`, `commentCount`, nor `update[]` is not left to a daily reconcile. Confirm that delay on the §3.5 pilot before coding it.
4. **Closed and trash. Not started.** `project/all/closed` and trash pagination are not a daily job.
5. **Daily job. Not started.** Closed window, trash, comment backfill, and one `batch/check/0` compare are not implemented.
6. **Tests.** `TP-IDLE-ZERO` and `TP-ECHO-ETAG` exist and pass in vitest. Their pilot status is **not run**. `TP1-QUIET-TITLE-ETAG`, `TP-COMMENT-COUNT`, and `TP-DAILY-RECONCILE` are not implemented.

## PR — mass-deletion / empty-side guard

Branch `cursor/mass-delete-guard-761a`. No version bump. Build from this branch.

Settings (defaults): `massDeleteGuardEnabled` on, `massDeleteTaskThreshold` 10, `massDeletePercentThreshold` 20, `massDeletePreviewCount` 20, `startupSyncDelaySeconds` 30. Both the count and the percent must be exceeded. Tracked tasks are non-deleted rows in the local database. The report is a new file `.tickticksync/reports/deletions-<timestamp>.md`. The decision is a redo journal record with `field` `mass-delete-guard`.

Preconditions unless a case says otherwise: logged in, guard on, manual **Synchronize**, plugin id `tickticksync-abyss`, pilot vault only.

### TP-EMPTY-SIDE-GUARD — an empty vault or an empty TickTick snapshot deletes nothing

1. Sync a handful of tasks so Dexie has them.
2. Make the vault scan see no tracked tasks without deleting the notes by hand in a way the plugin can trust: quit Obsidian, move the in-scope notes out of the vault folder, and open the vault again. Or point `syncScopeFolders` at an empty folder only if that folder is the whole scan the plugin uses. Do not use `<live-vault>`.
3. Run **Synchronize**.

Expected: a notice that deletions were held (`empty-vault`). No TickTick task is deleted. `checkPoint` is unchanged. A new file `.tickticksync/reports/deletions-<timestamp>.md` lists the held deletions. The journal has a `mass-delete-guard` record with choice `skip` or `open-report` if you opened the report, not an applied delete. Creates and title updates that are not deletions still apply.

4. Restore the notes. Separately, if you can obtain a full TickTick snapshot that contains no tasks while Dexie still has tasks (do not do this against an account you care about), **Synchronize** once.

Expected: the same hold, reason `empty-ticktick`. No vault line is marked `[-]` or detached because of that snapshot.

### TP-MASS-DELETE-THRESHOLD — count and percent together

1. With the defaults (more than 10 and more than 20%), delete 11 lines that are more than 20% of the tracked tasks. **Synchronize**.

Expected: the guard dialog lists the counts and the first 20 items (or the preview setting). Choices are **Apply once**, **Skip deletions this run**, and **Open report**. Choosing skip deletes nothing and does not move `checkPoint`. Non-deletion edits in the same run still reach TickTick.

2. Delete 11 lines that are 20% or less of tracked tasks. **Synchronize** and confirm the usual deletion dialog.

Expected: the mass-delete guard does not hold them. The existing confirm dialog still appears.

### TP-MASS-DELETE-APPLY-ONCE — one confirmed run

1. Produce a held plan (TP-EMPTY-SIDE-GUARD or TP-MASS-DELETE-THRESHOLD).
2. Choose **Apply once**.

Expected: those deletions run this time. `checkPoint` may advance. The journal choice is `apply-once`. The next sync does not treat that click as a permanent off switch: another over-threshold plan is held again.

### TP-UNREADABLE-FILE-NO-DELETE — a bad read is not a deletion

1. Sync one task. Make its note unreadable, a `(Conflicted copy …)` file, or a Syncthing `.sync-conflict-` file, or leave Obsidian Sync still downloading it.
2. **Synchronize**.

Expected: that file's tasks are not offered for deletion in TickTick. A notice names the file when the read failed. A single readable deletion in another note still uses the existing confirm dialog.

### TP-STARTUP-OBSIDIAN-SYNC — first sync waits

1. Set the startup delay to 30 (the default). On a second device, open the vault while Obsidian Sync is still downloading a note that contains a completed task.
2. Watch the first sync.

Expected: the plugin does not sync until the layout is ready and Obsidian Sync is idle, and then it waits the configured seconds. The completed task is not duplicated and its checkbox is not cleared. A startup sync that wants a mass deletion only notifies; it does not apply the deletions.

### TP-EMPTY-DEXIE-BOOTSTRAP — an empty local database does not delete

1. On a copy of the pilot vault, clear the plugin's local database (or use a new device profile) while the vault and TickTick both still have the same tasks. Do not use `<live-vault>`.
2. Let the startup sync run, then run **Synchronize** once.

Expected: 0 tasks deleted on TickTick, 0 lines removed or detached in the vault, 0 duplicate tasks. The guard reason for any invented deletion is `empty-dexie`.

### Regressions

Pilot status for each: **not run**.

| ID | Steps | Expected |
|----|--------|----------|
| TP-GUARD-R-ONE-DELETE | Delete one synced line. **Synchronize**. Confirm the existing dialog. On a second line, delete, **Synchronize**, cancel. | Confirm removes that TickTick task. Cancel leaves it. The mass-delete dialog does not replace this dialog. |
| TP-GUARD-R-OFF | Turn **Hold mass deletions** off. Repeat a case that would have been held. | Deletions follow the previous confirm / detach behavior. `checkPoint` may advance on a successful sync. |
| TP-GUARD-R-SYNC-OK | With the network up and no mass deletion, **Synchronize**. | Notice is `Sync completed.` A normal title edit still reaches TickTick. |

## Results

| ID | Pilot status | Evidence |
|----|----------------|----------|
| TP-EMPTY-SIDE-GUARD | not run | |
| TP-MASS-DELETE-THRESHOLD | not run | |
| TP-MASS-DELETE-APPLY-ONCE | not run | |
| TP-UNREADABLE-FILE-NO-DELETE | not run | |
| TP-STARTUP-OBSIDIAN-SYNC | not run | |
| TP-EMPTY-DEXIE-BOOTSTRAP | not run | |
| TP-GUARD-R-ONE-DELETE | not run | |
| TP-GUARD-R-OFF | not run | |
| TP-GUARD-R-SYNC-OK | not run | |

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

### TP-COMPLETE-DURING-TYPE — checking a task does not wipe the open note

1. Open a synced note. Start completing a task from TickTick (or a command that checks the line) while you type on another line.
2. Keep typing for a couple of seconds, including into the task line itself.

Expected: text on the other line stays. The checkbox flips only if that task line still matches. If you are still typing, the check waits. The buffer is not replaced.

### TP-UNCOMPLETE-DURING-TYPE — reopening a task does not wipe the open note

Same as **TP-COMPLETE-DURING-TYPE**, but the task is reopened and the box returns to `[ ]`.

### TP-JOURNAL-EDITOR-PATCH — an open-note patch is in the redo journal before it lands

1. Open a synced note. Run **Synchronize** so it changes a task line while the note stays open.
2. Open `.tickticksync/journal/` for today.

Expected: a record for that file is pending before the editor changes, then committed. `before` is the buffer from before the patch. `after` is the buffer after it, including text you had already typed on another line. A patch that does not land (the task line changed, or you were still typing) has no committed record.

### TP-UNDO-EDITOR-PATCH — undo restores an editor patch with the note open or closed

1. After **TP-JOURNAL-EDITOR-PATCH**, run **Undo last sync** (preview, then apply) while the note is still open.
2. Patch the note again, close it, and run **Undo last sync** once more. Also try **Preview undo of last sync** and **restore task version** on that task.

Expected: preview lists the file restore. Apply puts the task line back. The same restore works when the note is closed. A record that was not committed is not undone.

### Other note writes on the same path

These also go through `commitVaultText`. Each one is **not run** on a vault.

| Site | What to watch |
|------|----------------|
| Recurring roll (`TaskModificationDetector.rollRecurring`) | The next-date line is inserted. Other lines typed during the roll stay. |
| Detach on TickTick delete (`VaultSyncCoordinator`, `syncModule`) | Only the deleted task line becomes `[-]`. |
| Duplicate id strip (`syncFiles`) | The copy loses its id. An open editor is patched on that line only. |
| Subtask reorder (`pullSubtaskOrder`) | Sibling lines move. A line the user changed is left. |
| Full-vault tag, TickTick link, tag rename, project-note repair, folder merge, `forceUpdates`, undo restore and id remap | The planned line change lands. Text typed on another line stays. Typing in the last two seconds defers the write. |

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
| TP-COMPLETE-DURING-TYPE | not run | Automated: `completeDuringType.test.ts`. No vault run. |
| TP-UNCOMPLETE-DURING-TYPE | not run | Automated: `completeDuringType.test.ts`. No vault run. |
| TP-JOURNAL-EDITOR-PATCH | not run | Automated: `journalEditorPatch.test.ts`. No vault run. |
| TP-UNDO-EDITOR-PATCH | not run | Automated: `journalEditorPatch.test.ts`. No vault run. |
| Recurring roll, detach, duplicate strip, subtask reorder, tag/link/rename/repair/merge/force update/undo | not run | Automated guard: `noWholeNoteWrite.test.ts` (no direct whole-note write outside `commitVaultText`). |

## Open note buffer must not roll back

Branch `cursor/open-note-buffer-reset-65a5` into `abyss-mapping`. No version bump. Cases in `ABYSS_FIRST_CASES.md`: **TP-NO-CARET-REWRITE**, **TP-ACTIVE-PUSH-DURING-SYNC**, **TP-NO-STALE-VIEW-READ**, **TP-ABYSS-LOCAL-CHILD-KEEP**, **TP-TWO-LEAVES**. Problem row **BUG-OPEN-NOTE-BUFFER** in `PO_STATUS.md`.

What changed: a successful vault→TickTick save sets `lastVaultSync`. A line whose hash differs from the stored `lineHash` is a local edit to push, not a vault line to overwrite. A span that contains the cursor or selection is not applied while that editor has focus, or while the note was typed in the last two seconds. One editor is patched per file. The 5-second push is rescheduled when a sync is running. `lastVaultPushWallMs` is taken before the deletion-guard prefetch; a file this plugin wrote is excluded by path and mtime, and only when that write moved the mtime. `app.vault.read` and `cachedRead` are not replaced. Plugin reads go through `syncRead` / `syncCachedRead`. A file open in an editor is not cached. `mergeAbyssBlock` keeps an unpushed local description or comment. The merge write-back inside the 5-second push does not run if the note changed after the push started.

### Write trace

Settings → **Write trace** (`debugWriteTrace`, default off). Reload the plugin after turning it on. Each write and each update decision is a `warn` line prefixed `[write-trace]` and one JSON line in `<vault>/.tickticksync/write-trace.jsonl`. Fields include path, api, trigger, phase, editor open/focused, whether the buffer matches disk (`adapter.read`), milliseconds since the last keystroke, cursor line, spans and whether they touch the cursor, the update reason, whether a file-run cache is active, and a short caller stack. With the setting on at load, a view reload whose text is not the disk text is logged too (`setViewData`, `bufferEqDisk: false`). `fileRunActive: true` on that line is the stale-view path. A transaction with `touchesCaret` and reason `behind` or `update` is the caret-overwrite path.

Pilot vault only: **Thinkpad-tts-test**. Do not use the live vault. None of these rows were run on a vault.

### TP-NO-CARET-REWRITE — typing on the line just pushed is kept

1. Open a synced note. Edit a task line that already has `ticktick_id`. Wait for the 5-second push to finish.
2. On that same line, type a second version. Wait 3 seconds (past the 2-second typing pause).
3. Run **Synchronize**.

Expected: the editor still shows the second version. The line under the cursor is not replaced with the copy that was just pushed.

### TP-ACTIVE-PUSH-DURING-SYNC — a push that comes due during sync still runs

1. Open a synced note and edit a task line. Start **Synchronize** before the 5-second push fires.
2. Let the sync finish without editing again. Wait until the rescheduled push has had time to run.
3. Save the note while a second **Synchronize** is running (after it has started pushing). Run **Synchronize** once more without editing.

Expected: the first push is not dropped. The save made during the sync is pushed on the next sync. A note the plugin itself rewrote, and that you did not edit, is not pushed again.

### TP-NO-STALE-VIEW-READ — Obsidian reads the disk, not the sync cache

1. Turn on **Write trace** and reload the plugin. Open a synced note.
2. Run **Synchronize** while the note is open. Watch `.tickticksync/write-trace.jsonl`.

Expected: a view reload is not logged with `bufferEqDisk: false` while `fileRunActive` is true. The editor does not flash back to an older copy of the note when the file on disk is already current.

### TP-ABYSS-LOCAL-CHILD-KEEP — an unpushed child line stays

1. On a synced Abyss task, edit the description line and a comment line. Do not wait for the 5-second push.
2. Run **Synchronize** once, soon enough that those child lines have not been pushed.

Expected: the edited description and the edited comment stay. The previous comment text does not reappear next to the edit.

### TP-TWO-LEAVES — one patch per file

1. Open the same synced note in two leaves. Focus one. Run **Synchronize** so it changes a task line.

Expected: the focused editor (or the first, if neither has focus) receives the patch once. The note is not patched a second time in the other leaf.

### TP-NEW-TASK-NOT-5S — new line without id (expectation, not a failure)

1. Open an inbox/daily note, add a **new** checkbox **without** `ticktick_id`, wait 5+ seconds (do not run Synchronize).

Expected: TickTick does **not** get a new task yet. The line is picked up after you leave the line (settled capture), run **Synchronize**, or edit the file while it is not the active tab. Automated guard: `identifiedOnly` in `pushSettledActiveFile` (`ABYSS_FIRST_CASES.md` **TP-NEW-TASK-NOT-5S**).

### TP-EMPTY-EDITOR-DISK — empty editor, text on disk

1. On the pilot vault, open a daily/inbox note, type a task line, wait until Obsidian has saved (or run a quiet 5s push).
2. Close the note tab and reopen the same file (or switch away and back).

Expected: the line is visible in the editor. `cat` on the file path matches what you typed. No TickTickSync notice.

Automated: `staleFileWrite.test.ts` (`TP-EMPTY-EDITOR-DISK`).

### BUG-COMMENT-ACTIVE-NOTE — comments on the open note

1. Open an in-scope note with a task that has `ticktick_id`.
2. Add a child comment bullet (`- 2026-…: text` or Abyss stamp line). Stay on that note.
3. **Synchronize** once.

Expected: comment appears in TickTick **Comments** (NOTE-L3b / `syncAbyssCommentsViaApi`). Vault comment lines stay.

Automated: `pushLocalPaths.test.ts` (`BUG-COMMENT-ACTIVE-NOTE`).

| ID | Pilot status | Evidence |
|----|----------------|----------|
| BUG-COMMENT-ACTIVE-NOTE | not run | Pilot 2026-10-21 `2026-10-21.md` comment bullets; journal lacked obs→tt comment pushes before fix. |
| BUG-COMMENT-NO-TT-WIPE | not run | Pilot: sync cleared all TT Comments; fixed stamp/plain fingerprint + no wipe when vault has no comment lines. `abyssCommentSync.test.ts`. |
| BUG-COMMENT-KEY-EQUIV | not run | `commentSyncModel.test.ts`; `apiCommentsDifferFromVault` + push via `planCommentSync`. |
| BUG-COMMENT-MERGE-NO-STRIP | not run | `abyssStep3.test.ts`; empty Comments API + unknown `commentCount` must not strip vault bullets on pull merge. |
| BUG-COMMENT-MANUAL-PRE-PULL | not run | `pushLocalPaths.test.ts`; manual sync pre-pull includes all in-scope registered paths. |
| BUG-COMMENT-VAULT-AHEAD | pass | Gate **2.0.74** Phase 3b: `test-11-12` (`6ad83bc…`) / `00 Inbox/2026-10-21.md` → TT Comments **`comment 1`**, **`test-new-verision`**. Evidence: `16-phase-3b-verify.md`. (Earlier probe unit coverage from **2.0.68**.) |
| PILOT-GATE-TEST-11-12 | pass | **2.0.74** Phase 3b Comments criterion. Evidence: `docs/pilot/results/PILOT-GATE-TEST-11-12/16-phase-3b-verify.md` (also `15-phase-2b-post-fix.md`). |
| BUG-COMMENT-NO-MASS-DELETE | not run | **2.0.61**: add 3rd Abyss comment on `2026-10-19.md` / `6ad83d…` — existing TT Comments must remain; journal must not show `deleteTaskComment` storm. `abyssCommentSync.test.ts`. |
| BUG-COMMENT-STALE-MAPS | partial | Agent 2026-10-21: Obsidian CLI manual sync → `write-trace` `vault-comments-ahead` for `6ad83d…`; MCP Comments not fully repopulated from vault (probe via MCP only). **2.0.62** deployed to pilot plugin folder. |
| BUG-COMMENT-TT-AHEAD-NO-DELETE | pass | Agent 2026-10-21 **2.0.63**: MCP added `pilot-tt-second-comment` on `6ad83d…`; manual sync; both TT comments remained. `abyssCommentSync.test.ts`. |
| BUG-COMMENT-BOTH-WAYS | not run | **2.0.64**: vault has `comment 2`/`comment 3` not in TT while TT has comments not yet in vault — one **Synchronize** must `addTaskComment` for vault-only keys **and** pull TT-only keys (`vaultCommentBehind.test.ts`). Pilot: `task-11-16` / `2026-10-19.md`. |
| BUG-COMMENT-PUSH-NO-ID | not run | **2.0.65**: unwrap POST `/comment` id; push plain comment text; stale multi-map must not block push (`addTaskCommentParse.test.ts`, `commentSyncMatch.test.ts`). Pilot: `task-11-16` → TT Comments include `comment 2`–`5`. |
| BUG-COMMENT-PULL-DOUBLE-STAMP | not run | **2.0.66**: TT `title` with embedded ISO must pull as `YYYY-MM-DD HH:MM: plainText` only (`abyssCommentSync.test.ts`). Pilot: no `14:46: 2026-10-21T12:09:07…` bullets after sync. |
| BUG-COMMENT-VAULT-WIPE | not run | **2.0.68**: remove all comment bullets, **Synchronize** (even if line hash already matches) → all TT Comments deleted; no `behindComments` re-pull; `vaultCommentBehind.test.ts` + `abyssCommentSync.test.ts`. Pilot: `task-11-16` (`6ad83d…`). |
| BUG-COMMENT-RECONCILE-UPDATE | mitigated | **2.0.73** Phase 3: write-trace kept **`vault-comments-ahead`** while Comments empty (guard OK). Unblocked by **2.0.74** POST fix — Phase 3b Comments land. Evidence: `13-phase-3-verify.md`, `16-phase-3b-verify.md`. |
| BUG-COMMENT-API-POST-500 | pass | **2.0.74**: webapp POST body + empty-200 client id (`bugCommentApiPost500.test.ts`). Pilot: reload + `tts-sync` → TT Comments **`comment 1`**, **`test-new-verision`**. Evidence: `15-phase-2b-post-fix.md`, `16-phase-3b-verify.md`. |
| BUG-COMMENT-ABYSS-VIEW | pass | **2.0.75**: Abyss/`vault.modify` schedules 5s push; flush `push-abyss-or-background`. Pilot `task-11-16` / `2026-10-19.md` → TT Comments include user `comment 1` / `коммент 2` + verify bullets. Evidence: `docs/pilot/results/BUG-COMMENT-ABYSS-VIEW/`. Automated: `activeFilePush.test.ts`. |
| BUG-COMMENT-DUP-STAMP | pass | **2.0.76**: stamped+plain TT pairs collapsed by `normalizedCommentKey`; creates always plain; no second POST when key present. Automated: `abyssCommentSync.test.ts`. Pilot: `task-11-16` → **4** plain Comments (no stamped twins). Evidence: `docs/pilot/results/BUG-COMMENT-DUP-STAMP/`. |
| BUG-COMMENT-VAULT-DUP-KEY | **pass** (**2.0.80** release) | **2.0.80**: quiet sync marks `vault-comment-dup-keys` → vault rewrite. Automated: `vaultCommentBehind.test.ts`, `abyssStep3.test.ts`. Pilot: `task-11-16` 20→4 then stay 4 after GitHub release deploy; evidence `27-vault-dup-key-2.0.80-unit.md`, `60-release-2.0.80-smoke.md`. **2.0.79** smoke: 21 Abyss lines (`58-release-2.0.79-smoke.md`). Issue #27 closed. |
| BUG-COMMENT-EMPTY-VAULT-WIPE | not run (unit pass) | **2.0.79**: wipe only with `obsidianRemovedCommentBullets`; delete vault-origin only; coordinator probe does not wipe. Automated: `abyssCommentSync.test.ts`, `vaultCommentBehind.test.ts`. Issue #28. |
| BUG-COMMENT-GET-FAIL-OPEN | not run (unit pass) | **2.0.79**: `getTaskComments` → `null` on failure; push skips creates/deletes. Automated: `abyssCommentSync.test.ts`. Issue #29. |

### BUG-COMMENT-VAULT-DUP-KEY — vault wall-clock + ISO twins

1. On pilot, open `00 Inbox/2026-10-19.md` under `task-11-16` with twin wall-clock + ISO Abyss bullets (or reproduce after Abyss push + pull).
2. Install **2.0.80**; **Synchronize** once.

Expected: one Abyss comment bullet per logical text (`normalizedCommentKey`); no ISO + wall-clock pair; write-trace reason can be `vault-comment-dup-keys` then settle (not sticky `local-edit` from twins alone). Automated: `vaultCommentBehind.test.ts`, `abyssStep3.test.ts` (`BUG-COMMENT-VAULT-DUP-KEY`).

### BUG-COMMENT-EMPTY-VAULT-WIPE — empty vault must not mass-delete TT-only

1. Task with vault-origin mapped comment + one TT-only comment (`origin: remote`).
2. Remove all vault Abyss comment bullets; **Synchronize** (hash change → wipe path).

Expected: vault-pushed TT comment deleted; TT-only comment remains. A sync that only sees empty threads without the hash-remove flag must not delete. Automated: `abyssCommentSync.test.ts` (`BUG-COMMENT-EMPTY-VAULT-WIPE`).

### BUG-COMMENT-GET-FAIL-OPEN — failed comments GET must not re-create

1. Task with two mapped vault Abyss comment threads already on TickTick.
2. Force `getTaskComments` failure (offline / 5xx) during **Synchronize**.

Expected: zero `addTaskComment` / `deleteTaskComment` for that task; Dexie maps unchanged. Automated: `abyssCommentSync.test.ts` (`BUG-COMMENT-GET-FAIL-OPEN`).

### BUG-COMMENT-DUP-STAMP — stamped+plain TickTick pairs

1. Task with vault Abyss comment bullets that already produced stamped+plain TT Comments (e.g. `task-11-16` after **2.0.75** Abyss push).
2. Install **2.0.76**; **Synchronize** once (or open-note push).
3. Optionally add one new Abyss-view comment and wait ≥5s.

Expected: TickTick **Comments** has **one** entry per vault thread (plain title preferred). No new stamped twin for the same text. Automated: `abyssCommentSync.test.ts` (`BUG-COMMENT-DUP-STAMP`).

### BUG-COMMENT-ABYSS-VIEW — Abyss Tasks view comment push

1. Open a synced task in **Abyss Tasks** (not the markdown editor). Stay in Abyss.
2. Add a child comment bullet under `task-11-16` (or any in-scope synced task).
3. Wait ≥5s without switching to the markdown editor and without **Synchronize**.

Expected: TickTick **Comments** shows the new text. write-trace may show `flushActiveFilePush` with reason `push-abyss-or-background`.

Automated: `activeFilePush.test.ts` (`BUG-COMMENT-ABYSS-VIEW`).

### BUG-COMMENT-NO-MASS-DELETE — new vault comment must not wipe TickTick

1. Task with **two** comments already in TickTick Comments and matching vault bullets + Dexie maps.
2. Add a **third** child comment bullet in the vault (ISO stamp line).
3. **Synchronize** once.

Expected: third comment is **added** via API; **no** `deleteTaskComment` for the first two. If `getTaskComments` returns empty transiently, push must **not** delete mapped comments.

Automated: `abyssCommentSync.test.ts` (**BUG-COMMENT-NO-MASS-DELETE**).

### BUG-DEFERRED-ID-PHASE2-DELETE — create on open note, no false deletion

1. Open a daily/inbox note with the caret on a new `- [ ]` line (no `ticktick_id`).
2. Run **Synchronize** (or wait for startup sync).

Expected: TickTick shows the new task; the note eventually gets `%%[ticktick_id:: …]%%` when the caret moves or typing pauses. **No** “task lines were removed from Obsidian” dialog for that task in the same run.

Automated: `pendingMarkerDeletion.test.ts` (`BUG-DEFERRED-ID-PHASE2-DELETE`).

| ID | Pilot status | Evidence |
|----|----------------|----------|
| BUG-DEFERRED-ID-PHASE2-DELETE | not run | Pilot 2026-10-21 `00 Inbox/2026-10-21.md` `test-10-35`: TT create + false delete modal, no id in file (`write-trace` defer caret). |

### Regressions that must still hold

| ID | What must still hold |
|----|----------------------|
| TP-IDLE-ZERO | A quiet sync does not probe each task. The shared plugin read is one per note; a closed detach reads that file from disk once more. `vault.read` itself is not cached. |
| TP-NO-SELF-REPUSH | A file the plugin just wrote, with no later user save, is not a local edit on the next sync. |
| TP-COMMENT-TT-DELETE | A comment deleted in TickTick still leaves the note. |
| TP1-DEBOUNCE | The open note still pushes about 5 seconds after the last keystroke. |
| NOTE-L3b | A child comment still reaches TickTick Comments. Live status stays the **2.0.51** fail until someone re-runs it. |

| ID | Pilot status | Evidence |
|----|----------------|----------|
| TP-NO-CARET-REWRITE | pass | **2.0.76** pilot: `2026-10-21.md` marker `caret-verify-*` survived Synchronize (disk + `obsidian read`). Evidence: `docs/pilot/results/PILOT-BATCH-EDITOR-SAFETY/16-open-note-editor.md`. |
| TP-ACTIVE-PUSH-DURING-SYNC | pass | **2.0.76** pilot: edit then immediate sync; vault kept `active-push-*`; MCP title landed. Evidence: same #16 file. |
| TP-NO-STALE-VIEW-READ | pass | **2.0.76** write-trace: `setViewData` with `bufferEqDisk: true` (no stale `fileRunActive` reload). Evidence: same #16 file. |
| TP-ABYSS-LOCAL-CHILD-KEEP | not run | Automated: `abyssStep3.test.ts`. Vault not run. |
| TP-TWO-LEAVES | not run | Automated: `tpTwoLeaves.test.ts`. Vault not run. |
| TP-EMPTY-EDITOR-DISK | pass | **2.0.76** pilot: close/reopen `2026-10-20.md` → task visible; matches disk. Evidence: same #16 file. |

## Release 2.0.77 — TECH-SYNC-MODULARIZATION epic close (#31)

Extract-only stack landed as PRs #34–#40 on `abyss-mapping`. No intended behavior change. Gate: vitest + build + one pilot **Synchronize** smoke.

### TP-MOD-RELEASE-SMOKE — deploy 2.0.77 and Synchronize once

1. Install release **2.0.77** into `<pilot-vault>/.obsidian/plugins/tickticksync-abyss/` (`main.js`, `manifest.json`, `styles.css`).
2. Reload the plugin (`obsidian plugin:reload id=tickticksync-abyss` or app reload).
3. Run **Synchronize** once (`tickticksync-abyss:tts-sync`).

Expected: sync finishes without a silent failure notice; plugin version in settings/manifest is **2.0.77**. This is a smoke check, not a comment-gate re-run.

| ID | Pilot status | Evidence |
|----|----------------|----------|
| TP-MOD-RELEASE-SMOKE | **pass** | Deploy **2.0.77**; CLI reload + `tts-sync`; `checkPoint` advanced; evidence `docs/pilot/results/TECH-SYNC-MODULARIZATION/31-release-2.0.77-smoke.md` |

Note: **2.0.75**/**2.0.76** comment fixes are included in combined tip **2.0.78** (this PR).


## Release 2.0.78 — comment fixes on modularized tip

Re-cuts **BUG-COMMENT-ABYSS-VIEW** (2.0.75) and **BUG-COMMENT-DUP-STAMP** (2.0.76) onto modularization + **2.0.77**. Supersedes open PRs #24/#26/#54.

### TP-COMMENT-FIXES-ON-MOD — deploy 2.0.78 and Synchronize once

1. Install release **2.0.78** into `<pilot-vault>/.obsidian/plugins/tickticksync-abyss/`.
2. Reload the plugin.
3. Run **Synchronize** once.

Expected: sync finishes; plugin version **2.0.78**. Smoke only — do not invent Abyss-view / DUP-STAMP re-verify unless re-run.

| ID | Pilot status | Evidence |
|----|----------------|----------|
| TP-COMMENT-FIXES-ON-MOD | **pass** | Deploy **2.0.78**; CLI reload + `tts-sync` (after clearing stuck `syncRunning`); `checkPoint` advanced; evidence `docs/pilot/results/COMMENT-FIXES-2.0.78/55-release-smoke.md` |
