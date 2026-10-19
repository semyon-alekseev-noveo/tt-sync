# Test plan

Manual cases for behavior changes. Automated tests do not replace a row here.

`ABYSS_FIRST_CASES.md` is the acceptance catalog (AF-*, the one live gate). This file is the per-PR test plan. A PR that changes behavior adds a section in the same PR: steps, expected result, pilot status. Reviewers and tester agents reject the PR when that section is missing or does not cover the diff. Process: `DEV_FLOW.md`.

Pilot means `<pilot-vault>`, manual **Synchronize**, plugin id `tickticksync-abyss`. Do not use `<live-vault>`. A cloud agent does not mark a row passed. Status stays **not run** until a person or a local agent on that Obsidian records what they saw.

## PR #1 — fail-closed sync, open-note push, comments

Branch `cursor/dev-flow-reliability-816a`. Build under test is still **2.0.47** plus this branch (no version bump). Every row below: **pilot status: not run**.

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

| ID | Pilot status | Evidence |
|----|----------------|----------|
| TP1-DEBOUNCE | not run | |
| TP1-ID-ONLY | not run | |
| TP1-CARET-UNFINISHED | not run | |
| TP1-DURING-SYNC | not run | |
| TP1-SWITCH-FILE | not run | |
| TP1-NEW-ON-LEAVE | not run | |
| TP1-NEW-ON-SYNC | not run | |
| TP1-CHILD-COMMENT | not run | |
| TP1-CHILD-DESC | not run | |
| TP1-SIBLING-COMMENTS | not run | |
| TP1-PULL-FAIL | not run | |
| TP1-LOAD-NOTICE | not run | |
| TP1-STALE-COMMENT | not run | |
| TP1-COMMENT-MAP | not run | |
| TP1-QUIET-TITLE | not run | |
| TP1-R-SYNC-OK | not run | |
| TP1-R-CHECKPOINT | not run | |
| TP1-R-TITLE | not run | |
| TP1-R-DESC-FIELD | not run | |
| TP1-R-HASH-COMMENT | not run | |
| TP1-R-KEYSTROKE | not run | |
| TP1-R-UNFINISHED-LEAVE | not run | |
| TP1-R-CHECKBOX | not run | |
| TP1-R-DEL | not run | |
| TP1-R-SCOPE | not run | |
| TP1-R-SUBTASK | not run | |
