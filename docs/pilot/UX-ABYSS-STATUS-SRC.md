# UX-ABYSS-STATUS-SRC — Abyss Tasks settings as status source

**Issue:** [#185](https://github.com/semyon-alekseev-noveo/tt-sync/issues/185)  
**Status:** analyst spec only. **Not Definition of ready.** Pilot **not run**. No plugin code in this note.  
**Vault wording:** `<pilot-vault>` only.

Today (#182, `statusListMappings`) still applies until this spec is confirmed and implemented. Checkbox → list evidence stays in [`docs/pilot/results/UX-OBS-TT-SOAK/14-task-status-to-list-map.md`](results/UX-OBS-TT-SOAK/14-task-status-to-list-map.md) and [`16-status-map-prove.md`](results/UX-OBS-TT-SOAK/16-status-map-prove.md). Those files do **not** read Abyss settings at sync time.

## Scope

Sync of **task checkbox placement** and **project-note parent completion / status text TTS writes**. Settings copy. Not comments. Not deletion. Not a silent rewrite of existing vault lines.

## DoR

Cases below are checkable **only under the proposed rules**. Developer does not start until the owner confirms the three decisions in [Open questions](#open-questions-owner).

## Settings shape

Plugin id **`abyss-tasks`**. Static settings file: `<pilot-vault>/.obsidian/plugins/abyss-tasks/data.json` (Obsidian `loadData` / `saveData`). View layout lives in sibling `state.json` and is **not** the status source.

### Verified (public plugin source)

Source: [flowing-abyss/obsidian-abyss-tasks](https://github.com/flowing-abyss/obsidian-abyss-tasks) tag **2.3.0** (published 2026-10-27), `src/settings/types.ts`, `src/settings/defaults.ts`, `src/settings/persistence.ts`. This session did **not** open a vault `data.json`.

| Key | Shape | Role |
|-----|--------|------|
| `taskStatuses[]` | `{ id, symbol, name, type, icon, core }` | Task checkbox vocabulary |
| `taskStatuses[].symbol` | exactly one character inside `[ ]` | What TTS matches on the line |
| `taskStatuses[].type` | `todo` \| `in-progress` \| `done` \| `cancelled` | Open vs complete vs cancel. **Not** a TickTick list |
| `taskStatuses[].core` | `true` on the four built-ins | Symbol and type locked |
| `projects.statuses[]` | `{ id, name, color?, display?, displayName?, onLeftPanel }` | Project **names**. No symbol. No type |
| `projects.statusProperty` | string, default `status` | Frontmatter key on a project note |
| `projects.defaultStatusId` | id into `projects.statuses` | Default for a new open project |
| `projects.statusMigration` | optional `{ issue, legacyStatuses, propertyCandidates }` | Present only when legacy statuses did not migrate cleanly |

Default task rows (core): ` ` To-do `todo`; `/` In progress `in-progress`; `x` Done `done`; `-` Cancelled `cancelled`.

Default project names: `inbox`, `todo`, `wip`, `done`. Default `defaultStatusId` points at `wip`.

`stripMovedFields` removes `listViewStates`, `sectionCollapse`, and `projects.table|kanban|timeline|overviewView` from `data.json` into `state.json`. **`taskStatuses` and `projects.statuses` stay in `data.json`.**

`data.json` may also contain `savedViewStateSchemaVersion`. Ignore it for status logic.

Legacy project rows used `match.kind` of `property` or `tag`. Current plugin migrates property matches to `name`. Unresolved migration sets `projects.statusMigration` and may clear `statusProperty`.

### Verified (in-repo pilot notes, earlier runs — not re-read here)

- Plugin folder name `abyss-tasks` (`PILOT-VAULT-CONFIG/64-pilot-config-2.0.89.md`, `VaultSyncCoordinator.abyssCaptureFile` already reads this file for `taskFilePath` only).
- Pilot inbox: `inbox.mode = "tag"`, `inbox.tag = "#inbox"` (#64).
- Pilot projects: `membershipQuery` includes `#system/project` and `10 Projects/`; insert heading `## Active Zone` (`UX-OBS-TT-SOAK/01a-analyst-vault-tt.md`).
- Notes use frontmatter `status:` with both Abyss-like `todo` and TTS emoji `🟢 In Progress` (`01a`, `01b`). Emoji values are **outside** default Abyss names `inbox|todo|wip|done`.
- #182 owner map uses symbols `! ? = ~` as **TTS** `statusListMappings` rows. Adding those symbols inside Abyss is still an open checklist item in `14-task-status-to-list-map.md`. They are **not** in the public default `taskStatuses`.

### Assumptions (not verified on a live `data.json`)

- Installed pilot Abyss build is close to **2.3.0**. An older install may still store legacy `projects.statuses[].match` until that plugin migrates.
- Frontmatter value equals `projects.statuses[].name` (supported by `test03` `status: todo` in `01a`, not by a fresh settings dump).
- Kanban column `none` seen in `01b` (`state.json`) is an unmatched-property bucket, not a `projects.statuses` row. Do not sync `none` unless that name is actually in `projects.statuses`.
- `!`, `?`, `=`, `~` exist on the pilot only if someone added custom `taskStatuses` rows. Cases that use them require that precondition.

### What TTS does today (code on `abyss-mapping` tip `09a7c80`)

- `abyssTasksFormat` parses Abyss checkboxes. It does **not** load `taskStatuses` or `projects.statuses`.
- Non-empty `statusListMappings` + format on: checkbox **symbol** chooses the TickTick list (`UX-STATUS-MAP-*`). `#gtd/*` does not.
- Format off, or empty `statusListMappings`: legacy `tagListMappings` / **AF-5**.
- Project notes: parent task stays on the projects list (AF-2 / AF-3). `isDoneStatus` treats `done`, `✅`, `заверш`, `выполн` as done. New notes TTS writes use `🟢 In Progress` / `✅ Done`, not Abyss names.
- `GTD_ARRAY_KEYS` in `src/settingsMerge.ts` does **not** include `statusListMappings`. Protecting that array from an empty overwrite is an engineering follow-up, not a product case.

## Proposed rules (pending owner)

These are the expected behaviors in the catalog. They are **not** an owner decision yet.

1. **Task path — overlay.** With `abyssTasksFormat` on and a readable Abyss `taskStatuses` array, the **set of symbols, names, and types** comes from Abyss. TickTick list ids stay in TTS `statusListMappings`, keyed by `symbol`. Abyss has no TickTick list. TTS does not create lists from status names. TTS does not keep a second hand-typed symbol list as the vocabulary.
2. **Open vs terminal** comes from Abyss `type`, not from a hard-coded character: `todo` and `in-progress` are open (list overlay); `done` completes the TickTick task; `cancelled` cancels it. List does not change on complete/cancel. Core `x` / `-` still behave that way because their types are `done` / `cancelled`.
3. **Unmapped open symbol:** Notice once. Leave the task on its current TickTick list. Do not create a list. Do not fall through to `#gtd/*`.
4. **Symbol removed or no longer in `taskStatuses`:** do not rewrite existing vault lines. Notice. The stale overlay row must not place a **new** task. Existing TickTick tasks stay where they are until the user changes the line.
5. **Fallback.** Format **off:** do not read Abyss; current tag / empty-map behavior (AF-5). Format **on** but `data.json` missing, unreadable, or `taskStatuses` not a non-empty array: Notice once; **sync still finishes**; use non-empty TTS `statusListMappings` if present, otherwise the tag path. Do not move `checkPoint` backward and do not fail the run solely for a missing plugin file.
6. **Project path — not a list.** A project note’s `projects.statusProperty` (default `status`) is a **name** from `projects.statuses`. The parent TickTick task stays on the **projects list** (TTS-Projects / `projectsListName`). It does not move to TTS-WIP or another stage list. Active Zone checkbox lines ignore the note’s project status and use the task path.
7. **Project done.** Name `done` (trim, case-insensitive) means the parent is done, same slot as today’s `isDoneStatus` for the word `done`. Other configured names (`inbox`, `todo`, `wip`, custom) leave the parent **open**.
8. **Unknown project status** (value not in `projects.statuses`, including `🟢 In Progress`): quiet Synchronize does **not** rewrite the frontmatter and does **not** treat it as done (emoji `✅ …` / the words `done`, `заверш`, `выполн` still count as done so old TTS notes do not reopen).
9. **Strings TTS writes** when it creates a project note, or when TickTick completion of that parent changes: open → name of `projects.defaultStatusId`; completed → the status whose name is `done`. Not `🟢 In Progress` / `✅ Done`. If `statusMigration` is set, or no `done` name exists: Notice; do not invent a status string; leave existing frontmatter; parent completion still follows the existing project-snapshot 3-way for values `isDoneStatus` already understands.
10. **UI.** When format is on, settings copy says task and project statuses are read from Abyss Tasks, and **Status → list mapping** is only the TickTick list overlay. When format is off, copy does not claim Abyss is the source.

## Cases

Preconditions for every row unless the row says otherwise: plugin `tickticksync-abyss`, manual **Synchronize**, `<pilot-vault>`, `fileLinksInTickTick` = no link, no injected `ticktick` tag, in-scope note, SyncTag as on the pilot. Task rows also need `abyssTasksFormat` on. Project rows also need `projectSchemeEnabled` and the note under the projects folder with tag `system/project`.

| ID | Path | Preconditions | Steps | Expected vault | Expected TickTick |
|----|------|---------------|-------|----------------|-------------------|
| UX-ABYSS-STATUS-SRC-TASK | task | Abyss `taskStatuses` has symbol `!`, type `todo` or `in-progress`. TTS overlay `!` → list id of **TTS-nextAction**. No `#gtd/next` required. | In-scope line `- [!] UX-ABYSS-STATUS-SRC-TASK …`. Synchronize. | Line stays in the same note. Checkbox stays `[!]`. | Task on **TTS-nextAction**. Not created from the status display name. |
| UX-ABYSS-STATUS-SRC-UNMAPPED | task | Abyss has an open symbol that is **absent** from `statusListMappings` (example `?`, type `todo`). | Line `- [?] …` already on TTS-Inbox (or create it there). Synchronize. | Checkbox stays `[?]`. No `#gtd/*` added. | **Same list** as before. No new TickTick list. One Notice names the unmapped symbol. |
| UX-ABYSS-STATUS-SRC-STALE | task | Overlay still has `!` → TTS-nextAction, but Abyss `taskStatuses` has **no** symbol `!`. | (1) Existing synced `- [!] …` on TTS-nextAction. Synchronize. (2) A **new** unsynced `- [!] …`. Synchronize. | (1) Line text not rewritten. (2) New line not given a list solely by the stale `!` row. | (1) Existing task stays on its current list. (2) New task is not moved to TTS-nextAction by that row. Notice that `!` is not an Abyss status. |
| UX-ABYSS-STATUS-SRC-TERM | task | Abyss core `x` type `done`, `-` type `cancelled`. Optional: one custom symbol whose type is `done`. | Synchronize `- [x] …` and `- [-] …` (and the custom done symbol if configured). | Chars unchanged. Line stays in the note. | `[x]` / type `done`: task **completed**, list unchanged. `[-]` / type `cancelled`: task **cancelled**, list unchanged. |
| UX-ABYSS-STATUS-SRC-PULL | task | Overlay and Abyss both contain `?` as an open status, bound to **TTS-waitingFor**. | Move an open task to TTS-waitingFor in TickTick. Synchronize. | Checkbox becomes `[?]`. No new `#gtd/*`. | List stays TTS-waitingFor. |
| UX-ABYSS-STATUS-SRC-OFF | fallback | `abyssTasksFormat` **off**. `statusListMappings` may be non-empty. | Synchronize an in-scope `#gtd/next` line per **AF-5**. | AF-5 line behavior (tag path). Checkbox parsing is not Abyss-driven. | Next-action list from the tag map. Sync succeeds with **no** read of `abyss-tasks/data.json` required. |
| UX-ABYSS-STATUS-SRC-MISS | fallback | Format **on**. `abyss-tasks/data.json` missing or unreadable. TTS `statusListMappings` still has `!` → TTS-nextAction. | Synchronize `- [!] …`. | Line stays. Notice that Abyss settings were not loaded. | **TTS-nextAction** via the TTS overlay (legacy #182). Sync **completes** (`ok`), checkpoint not stuck for this reason. If the overlay is also empty, AF-5 tag path instead. |
| UX-ABYSS-STATUS-SRC-PROJ-OPEN | project | Abyss `projects.statuses` includes name `wip`. Note frontmatter `status: wip` (`statusProperty` = `status`). Parent already on the projects list. Active Zone has `- [!] …` with task overlay for `!`. | Synchronize. | Frontmatter stays `status: wip`. Active Zone checkbox stays `[!]`. | Parent **stays on TTS-Projects** (projects list) and stays **open**. The Active Zone task follows **UX-ABYSS-STATUS-SRC-TASK** (its own list), not `wip`. |
| UX-ABYSS-STATUS-SRC-PROJ-DONE | project | Abyss has a status named `done`. Note `status: done`. Parent on the projects list, currently open. | Synchronize. | Frontmatter stays `status: done`. Note stays a project note (parent is not a checkbox line). | Parent **completed**. List still the **projects list**, not a stage list. |
| UX-ABYSS-STATUS-SRC-PROJ-UNKNOWN | project | Note `status: 🟢 In Progress`, which is **not** in `projects.statuses`. Parent open on the projects list. No TickTick completion change. | Quiet Synchronize. | Frontmatter **unchanged** (still the emoji string). | Parent stays **open** on the projects list. No Notice storm beyond one warning that the value is not an Abyss project status. |
| UX-ABYSS-STATUS-SRC-PROJ-WRITE | project | Abyss has `done` and a `defaultStatusId` (default name `wip`). No `statusMigration`. | (1) New parent on the projects list, not completed. Synchronize (AF-2 create). (2) Complete that parent in TickTick. Synchronize. (3) Reopen it in TickTick. Synchronize. | (1) New note `status:` is the **default status name** (`wip` if that is the default), not `🟢 In Progress`. (2) `status:` becomes `done`, not `✅ Done`. (3) `status:` returns to the default status name. | Parent remains on the projects list. Completion matches TickTick. |
| UX-ABYSS-STATUS-SRC-PROJ-MIG | project | `projects.statusMigration` is present (legacy statuses not resolved). | Synchronize a project note. | Existing `status:` text not replaced with a guessed name. | Parent list and completion follow **current** `isDoneStatus` / project snapshot only. Notice that Abyss project statuses are unresolved. |
| UX-ABYSS-STATUS-SRC-UI | settings | Format toggled in TickTickSync settings. | Read the Abyss format control and **Status → list mapping**. | — | — (no task write). Format **on:** copy says statuses come from Abyss Tasks and the table is a list-id overlay. Format **off:** copy does not say Abyss is the source. |

**Regression that must keep working after an implementation:** UX-STATUS-MAP-1…PULL when Abyss symbols and the overlay agree; AF-5 when the map is empty or format is off; AF-2 / AF-3 / AF-4 parent and Active Zone parenting (list of the parent unchanged by project status).

## Open questions (owner)

Answer these before a developer writes a failing test. Recommended answers are the table above. A different answer replaces the affected rows; do not implement both.

| # | Question | Recommendation in the cases | If the owner disagrees |
|---|----------|------------------------------|------------------------|
| (a) | Abyss owns **symbols/types only**, TTS keeps symbol → `listId` overlay — or must TickTick lists be **derived** (auto-created from status names)? | Overlay. No auto-created lists. | Replace TASK, UNMAPPED, STALE, PULL. |
| (b) | Abyss file missing or format off: **block** the sync, or **warn and keep** today’s `statusListMappings` / tag path? | Warn and continue (OFF, MISS). | MISS becomes a failed sync (`ok: false`, checkpoint unchanged) instead of a completed fallback. |
| (c) | Project status maps to **which TickTick entity**? | Parent **completion** on the **projects list** only. Name `done` completes. Not a stage list. Not a tag. Unknown text kept on quiet sync. New/completion writes use Abyss names (PROJ-OPEN, PROJ-DONE, PROJ-UNKNOWN, PROJ-WRITE, PROJ-MIG). | If project status should move the parent to TTS-WIP / a tag, those five rows are void. |

Also confirm, as part of (a)/(c), not separate products:

- Unmapped open symbol: Notice + stay on the current list (UNMAPPED).
- Removed symbol: no vault rewrite; stale row does not place new tasks (STALE).
- `GTD_ARRAY_KEYS` / persisting `statusListMappings` across login save: **child engineering issue**, not this DoR.

## Priority

GitHub #185 is already labeled **P1**. `PO_STATUS.md` row **UX-ABYSS-STATUS-SRC** tracks that label as **not DoR**. Do not drop the label only because cases were missing; the remaining gate is the owner answers above.
