# GTD sync — real cases catalog

**Date:** 2026-10-16  
**Branch:** `abyss-mapping`  
**Plugin id:** `tickticksync-abyss` (TickTickSync Abyss fork)  
**Audience:** Product owner, testers, implementers  

This file is the **authoritative list of real-world scenarios** for Obsidian (Abyss Tasks) ⇄ TickTick sync under topology **R** (per-list files + project scheme + tag routing). Each case is written so you can execute it in a vault, compare results, and mark pass/fail without re-deriving intent from code.

**Related docs (do not duplicate their full analysis here):**

| Doc | Role |
|-----|------|
| `GTD_SYNC_RESEARCH.md` | Code paths, gaps G1–G13, hypotheses A/B/R |
| `PO_STATUS.md` | PO decisions, pilot checklist snapshot |
| `00 Inbox/TTS-PILOT-RUN.md` (test vault) | Operator steps for the **TTS-*** pilot |
| `00 Inbox/TTS-data-preset.json` (test vault) | Minimal `data.json` keys for pilot |
| `docs/BRAT_INSTALL.md` | Install and upgrade |
| `ABYSS_NOTES_ALIGNMENT.md` | Abyss checkbox block ↔ TT `content` / comments / items |
| `SYNC_PROJECTS_AND_SUBTASKS.md` | Project scheme + Active Zone + subtask order |

**Acceptance criteria IDs** (`AC-n`) refer to `GTD_SYNC_RESEARCH.md` §1.2.

---

## 1. Shared vocabulary

### 1.1 Objects (what we sync)

| Object | User meaning | Vault location (topology R) | TickTick representation |
|--------|----------------|------------------------------|-------------------------|
| **Inline GTD task** | A checkbox line you work from daily | Prefer **`30 Tasks/TickTick/<List>.md`** after push (target); may be created anywhere under `syncScopeFolders` | Task in list chosen by GTD tag (`tagListMappings`) or file default |
| **Project (MOC)** | A GTD project / area of focus | `10 Projects/<Title>.md`, tags `system/project` (+ often `system/moc`) | **Parent** task in projects list (`projectsListName`), tags `project`, `obsidian` |
| **Project child** | Next action inside a project | Under `## Active Zone` in the project note | Subtask of parent (or checklist item) |
| **List file stub** | Anchor file for a TickTick list | `30 Tasks/TickTick/TTS-nextAction.md` etc. | Not a task — file metadata binds list id |
| **Task note** | Long-form note about one task (`task:` frontmatter) | e.g. `30 Tasks/301 …/DON-109.md` | Only **checkbox lines inside** sync; not the note body as a whole |

### 1.2 Pilot vs production naming

| Environment | TickTick lists | Sync tag | Vault |
|-------------|----------------|----------|--------|
| **Pilot (isolated)** | `TTS-Inbox`, `TTS-nextAction`, … `TTS-Projects` | `tts-test` on tasks you intentionally test | `Thinkpad-tts-test` only |
| **Production (future)** | Real GTD lists: `Inbox`, `nextAction`, `Planned`, … | TBD (e.g. `obsidian` or per-vault tag) | Live `Thinkpad` — **blocked until cases pass** |

Pilot cases use **TTS-*** names; production cases are the same stories with real list names once PO signs off.

### 1.3 Reference configuration (pilot preset)

Unless a case says otherwise, preconditions assume plugin `data.json` merged from `TTS-data-preset.json`:

- `syncedLists`: six `TTS-*` lists (not empty).
- `SyncTag`: `tts-test` (pull filter **within** allow-listed lists).
- `syncScopeFolders`: `00 Inbox/`, `10 Projects/`, `30 Tasks/`.
- `TickTickTasksFilePath`: `30 Tasks/TickTick`.
- `tagListMappings`: `type/next` → `TTS-nextAction`, `type/planned` → `TTS-Planned`, `type/waiting` → `TTS-waitingFor`, `type/someday` → `TTS-someDay`.
- `projectSchemeEnabled`: true; `projectsFolder`: `10 Projects`; `projectsListName`: `TTS-Projects`; `projectTemplatePath`: `60 templates/MOC.md`.
- `fileLinksInTickTick` / `taskLinksInObsidian`: `noLink`.
- `stopInjectingTickTickTag`: true.
- `abyssTasksFormat`: true (pilot vault).
- `newTasksFile`: empty (per-list files, not hub).
- `automaticSynchronizationInterval`: 0 (manual sync only).

**Abyss Tasks (vault plugin, not TickTickSync):** for meaningful Inbox views, align `projects.membershipQuery` with `10 Projects/` and task insertion with **Active Zone** — see `GTD_SYNC_RESEARCH.md` §2.1.

### 1.4 How to run any case

1. Open the stated vault; plugin **enabled** and logged in (Access Control).
2. Confirm **Sync Control → GTD and projects** matches preconditions (or preset).
3. Set up **Given** state in Obsidian and/or TickTick.
4. Run **TickTickSync: Synchronize** (command `tts-sync`).
5. Compare **Then** sections for Obsidian paths and TickTick list/tag/title.
6. Record **Status** and evidence (redo journal under `.tickticksync/journal/`, task id in frontmatter `ticktick_id`).

---

## 2. Case index

| ID | Title | Category |
|----|--------|----------|
| CASE-S1 | Fresh install must not pull the whole account | Safety |
| CASE-S2 | Empty allow-list pulls nothing | Safety |
| CASE-S3 | Settings survive login, upgrade, disable/enable | Safety |
| CASE-S4 | Scoped sync tag limits pull within allow-list | Safety |
| CASE-P1 | TickTick: new parent in projects list → project note | Project scheme |
| CASE-P2 | Obsidian: new project note → parent in projects list | Project scheme |
| CASE-P3 | Project status done ↔ parent completed | Project scheme |
| CASE-P4 | Active Zone child → subtask on parent | Project scheme |
| CASE-P5 | Scheme must not adopt unrelated legacy project notes | Project scheme |
| CASE-P6 | Parent must not appear as duplicate checkbox in project note | Project scheme |
| CASE-T1 | Capture in inbox folder → TTS-Inbox | GTD task / list file |
| CASE-T2 | `#type/next` anywhere in scope → next action list | GTD task / list file |
| CASE-T3 | TickTick moves list → tag rewritten on line | GTD task / list file |
| CASE-T4 | **Obs push: line mirrored into per-list file (topology R)** | GTD task / list file |
| CASE-T5 | Context tag → TickTick tag (`tagMappings`) | GTD task / list file |
| CASE-T6 | Complete checkbox ↔ complete task | GTD task / list file |
| CASE-L1 | Pull task into correct list file | Pull |
| CASE-L2 | No new files at vault root | Pull |
| CASE-N1 | Note outside `syncScopeFolders` must not push | Negative |
| CASE-N2 | Non-allow-listed TickTick list must not pull | Negative |
| CASE-N3 | No `obsidian://` in TickTick titles | Negative |
| CASE-N4 | No forced `ticktick` tag on TickTick | Negative |
| CASE-M1 | Recover from first unlimited sync (test vault) | Migration |
| CASE-DEL-1 | Single line removed → one confirm → TT delete | Deletion (Obs→TT) |
| CASE-DEL-2 | Many files → one deletion modal (≥ 2.0.28) | Deletion (Obs→TT) |
| CASE-DEL-3 | Cancel on dialog → TT unchanged | Deletion (Obs→TT) |
| CASE-DEL-4 | Active Zone child removed → TT subtask deleted | Deletion (Obs→TT) |
| CASE-DEL-5 | Journal + second sync stable after delete | Deletion (Obs→TT) |
| CASE-DEL-N1 | Out of scope: line removed, no TT delete | Deletion (Obs→TT) |

---

## 3. Safety and configuration cases

### CASE-S1 — Fresh install must not pull the whole account

**Story:** I enable the plugin for the first time. Nothing in TickTick or Obsidian should change until I explicitly choose lists and sync.

| | |
|--|--|
| **Given** | New vault or reset `data.json`; `syncedLists` empty; not logged in or logged in with valid session |
| **When** | User enables plugin; optionally opens settings; does **not** run Synchronize |
| **Then (Obsidian)** | No new `*.md` list stubs at vault root; no mass `ticktick_id` lines |
| **Then (TickTick)** | No new tasks; no title changes |
| **Maps to** | AC-1 |
| **Status (2026-10-16)** | **Partial** — empty `syncedLists` + no manual sync OK; login/upgrade used to wipe settings (fixed 2.0.20–2.0.24). Auto sync interval 0 helps. |
| **Notes** | First **manual** sync with empty lists should log warn and pull nothing (CASE-S2). |

---

### CASE-S2 — Empty allow-list pulls nothing

**Story:** I untick all lists (or clear `syncedLists`) to pause sync without uninstalling.

| | |
|--|--|
| **Given** | Pilot preset except `syncedLists: []`; logged in |
| **When** | Synchronize once |
| **Then (Obsidian)** | No new `tt→obs` file creates in redo journal; existing files unchanged |
| **Then (TickTick)** | No new tasks from vault push beyond what is already linked (push may still run for edited lines — document if observed) |
| **Maps to** | AC-1, AC-3 |
| **Status (2026-10-16)** | **Pass (spot)** — journal did not grow on empty-list sync; preset restored after test |
| **Evidence** | Agent run 2026-10-16; `TTS-PILOT-RUN.md` Phase E |

---

### CASE-S3 — Settings survive login, upgrade, disable/enable

**Story:** I BRAT-update the plugin or toggle it off and on; GTD lists, mappings, and scheme flags remain.

| | |
|--|--|
| **Given** | Full pilot preset in `data.json` |
| **When** | BRAT update to new release **or** disable + enable plugin in Community plugins |
| **Then** | `syncedLists`, `tagListMappings`, `SyncTag`, `projectSchemeEnabled`, `TickTickTasksFilePath` unchanged in UI and on disk |
| **Maps to** | AC-12 (operational) |
| **Status (2026-10-16)** | **Pass** after 2.0.23+ (`buildPersistedSettings`, no store auto-save) |
| **Notes** | If wiped, merge `TTS-data-preset.json` with Obsidian **quit**; Import GTD JSON in UI |

---

### CASE-S4 — Scoped sync tag limits pull within allow-list

**Story:** Only tasks tagged `tts-test` in pilot lists are pulled, so my live TickTick account is not fully mirrored.

| | |
|--|--|
| **Given** | `syncedLists` = six TTS lists; `SyncTag` = `tts-test` |
| **When** | Parent task exists in `TTS-Projects` **with** `tts-test`; another parent exists **without** that tag |
| **Then** | Only the tagged parent creates/updates a project note on pull (when scheme + filters agree) |
| **Maps to** | AC-3, overlay scope in PO §6 |
| **Status (2026-10-16)** | **Pass** for dishwasher pilot parent; **Gap** — YAML tag `tts-test` on note did not always appear as TT tag on push (CASE-P2) |
| **Notes** | `SyncTag` is configured under **GTD and projects** (not Limit sync) as of UI 2.0.24 |

---

## 4. Project scheme cases

Project scheme ties **`10 Projects/` MOC notes** ↔ **parent tasks** in `projectsListName` (pilot: `TTS-Projects`). Parents are **not** normal checkbox lines in list files.

### CASE-P1 — TickTick: new parent in projects list → project note

**Story:** On my phone I add a project in TickTick Projects; after sync I want a proper MOC in Obsidian.

| | |
|--|--|
| **Given** | CASE-S4 preconditions; `TTS-Projects` allow-listed |
| **When** | In TickTick: create task **"TTS-PILOT: Dishwasher project"** in `TTS-Projects` with tags `project`, `obsidian`, `tts-test` |
| **When** | Synchronize |
| **Then (Obsidian)** | New file `10 Projects/TTS-PILOT- Dishwasher project.md` (title sanitized); frontmatter `ticktick_id`; tags include `system/project`; sections Overview / Active Zone from `projectTemplatePath` |
| **Then (TickTick)** | Title unchanged; no file link in title |
| **Maps to** | AC-5 |
| **Status (2026-10-16)** | **Pass** — id `6ad1c7878f0841315e89a10c` |
| **Evidence** | Journal `sync-mvalv6fr-1-ezhs`; `TTS-PILOT-RUN.md` Phase B |

---

### CASE-P2 — Obsidian: new project note → parent in projects list

**Story:** I create a project MOC in Obsidian; TickTick gets a parent task in Projects for mobile review.

| | |
|--|--|
| **Given** | Pilot preset; no existing `ticktick_id` on the note |
| **When** | Create `10 Projects/TTS-PILOT- Phase C test.md` with tags `system/moc`, `system/project`, body with `# Title` and `## Active Zone` |
| **When** | Synchronize |
| **Then (Obsidian)** | Frontmatter gains `ticktick_id`; tag `obsidian` added if missing |
| **Then (TickTick)** | New parent in **TTS-Projects**; title matches note; **no** `obsidian://` in title; tags include `project`, `obsidian` |
| **Maps to** | AC-4 |
| **Status (2026-10-16)** | **Pass** — id `6ad1dc711befa8582aceadd7` |
| **Gap** | Optional tag `tts-test` in YAML did not appear on TT task (pull filter for parents) |
| **Evidence** | Journal `sync-mvaowegq-l-tv6y` 08:12 UTC |

---

### CASE-P3 — Project status done ↔ parent completed

**Story:** I mark the project done in Obsidian (or complete parent in TickTick); the other side reflects completion.

| | |
|--|--|
| **Given** | Linked project note + parent (`ticktick_id` set) |
| **When** | Set frontmatter `status` to a done-like value (`✅ Done`, etc.) **or** complete parent in TT |
| **When** | Synchronize |
| **Then** | Opposite side shows completed; `projectSnapshot` avoids flip-flop |
| **Maps to** | AC-5 (status leg) |
| **Status** | **Not exercised** in pilot automation |
| **Test data** | Use dishwasher or Phase C note |

---

### CASE-P4 — Active Zone child → subtask on parent

**Story:** I add a next action inside the project MOC; it becomes a subtask of the TickTick parent, not a root task in nextAction list.

| | |
|--|--|
| **Given** | Linked project note |
| **When** | Add under `## Active Zone`: `- [ ] Install water line #ticktick` (and sync marker as required) |
| **When** | Synchronize |
| **Then (TickTick)** | Subtask under parent id; **not** a new root in `TTS-nextAction` unless tagged with `#type/next` on that line |
| **Then (Obsidian)** | Line remains in Active Zone with `ticktick_id` on child |
| **Maps to** | AC-4, AC-6 |
| **Status** | **Not exercised** |
| **Notes** | Distinguishes **project children** from **GTD list routing** (CASE-T2) |

---

### CASE-P5 — Scheme must not adopt unrelated legacy project notes

**Story:** I have old `10 Projects/*.md` with `ticktick_id` from a bad sync; a scoped pilot sync must not re-bind them to the wrong TickTick list.

| | |
|--|--|
| **Given** | Many legacy notes with `ticktick_id`; pilot uses `TTS-Projects` + `SyncTag` |
| **When** | Synchronize with **2.0.18+** scheme scope |
| **Then** | Only notes/tasks matching scheme + allow-list + sync tag are updated; others untouched |
| **Maps to** | G7 mitigation |
| **Status** | **Fail** on first pilot (2.0.17) — 16 notes touched; **fixed in 2.0.18** — **retest** recommended on clean note |
| **Notes** | Test vault may still contain polluted frontmatter from old run |

---

### CASE-P6 — Parent must not appear as duplicate checkbox in project note

**Story:** The project parent exists only as the note + TT parent — not also as a checkbox at the bottom of the MOC.

| | |
|--|--|
| **Given** | CASE-P1 note |
| **When** | After sync, inspect project note body |
| **Then** | No line like `- [ ] TTS-PILOT: Dishwasher project #ticktick ...` outside Active Zone intent |
| **Maps to** | AC-5 UX |
| **Status** | **Fail** observed — duplicate line was present; removed manually before Phase C run |
| **Action** | Investigate pull/render writing parent as line; add regression test |

---

## 5. GTD task and list-file cases (topology R)

These cases define **daily GTD**: tasks live in **list files** under `30 Tasks/TickTick/`, while you may **capture** from anywhere in `syncScopeFolders`.

### CASE-T1 — Capture in inbox folder → TTS-Inbox

**Story:** I drop a quick task in `00 Inbox/`; it should land in the TickTick inbox list and in `TTS-Inbox.md`.

| | |
|--|--|
| **Given** | Pilot preset; line in `00 Inbox/` |
| **When** | Add `- [ ] Buy filters #ticktick #tts-test` (no `type/*` tag) |
| **When** | Synchronize |
| **Then (TickTick)** | Task in **TTS-Inbox** (or `defaultProjectId` if configured to TTS-Inbox) |
| **Then (Obsidian)** | Line appears in `30 Tasks/TickTick/TTS-Inbox.md` with `ticktick_id` |
| **Maps to** | AC-7, AC-8, topology R |
| **Status** | **Not exercised** |
| **Depends on** | CASE-T4 if capture is outside list file |

---

### CASE-T2 — `#type/next` anywhere in scope → next action list

**Story:** I write a next action in a meeting note under `30 Tasks/`; GTD tag routes it to next action list on phone and in `TTS-nextAction.md`.

| | |
|--|--|
| **Given** | Pilot preset |
| **When** | In `30 Tasks/TTS-PILOT-tag-routing.md` add: `- [ ] Pilot next action — tag routing #ticktick #type/next #tts-test` |
| **When** | Synchronize |
| **Then (TickTick)** | Task in **TTS-nextAction**; title clean; tag `tts-test` on task |
| **Then (Obsidian)** | Line has `ticktick_id`; **`type/next` may be stripped from TT tags** (mapping consumes GTD tag) |
| **Maps to** | AC-7 |
| **Status (2026-10-16)** | **Partial** — TT list **pass** (id `6ad1dc721befa8582aceadd8`); line stayed in **source file**, not `TTS-nextAction.md` |
| **Evidence** | Journal `mvaowks1-t-eqxv` |

---

### CASE-T3 — TickTick moves list → tag rewritten on line

**Story:** I move a task to Planned in TickTick; Obsidian line gains `#type/planned` and moves to `TTS-Planned.md`.

| | |
|--|--|
| **Given** | Task line synced in `TTS-nextAction.md` with ids |
| **When** | In TickTick, move task to **TTS-Planned** |
| **When** | Synchronize |
| **Then (Obsidian)** | Line in `TTS-Planned.md`; GTD tag updated per `tagListMappings` |
| **Maps to** | AC-8 |
| **Status** | **Not exercised** |
| **Depends on** | CASE-T4 for file placement |

---

### CASE-T4 — Obs push: line mirrored into per-list file (topology R)

**Story:** When I create or edit a synced task **anywhere** in scope, the **canonical** copy for GTD views lives in the right **list file**, not only in the capture note.

| | |
|--|--|
| **Given** | Pilot preset; `tagListMappings` as preset; `newTasksFile` empty |
| **When** | Same as CASE-T2 (task born in `30 Tasks/TTS-PILOT-tag-routing.md`) |
| **When** | Synchronize |
| **Then (Obsidian)** | **Target (PO decision):** one canonical line in `30 Tasks/TickTick/TTS-nextAction.md` |
| **Then (behavior options)** | **O-A Move:** remove line from source file after successful mirror. **O-B Copy:** keep in both (risk duplicates). **O-A recommended.** |
| **Then (TickTick)** | Unchanged from CASE-T2 |
| **Maps to** | AC-2, AC-7, AC-8; PO topology R |
| **Status** | **Open — implementation target 2.0.25+** |
| **Blocks** | Pilot sign-off for daily GTD |

**Implementation notes (for dev):**

- Resolve list from `tagListMappings` first, else file default, else inbox.
- Append or move line in Abyss format to `TickTickTasksFilePath/<ListName>.md`.
- Update `db.files` / line registry so a second sync does not duplicate.
- Do **not** apply to project parents (scheme).

---

### CASE-T5 — Context tag → TickTick tag (`tagMappings`)

**Story:** `#context/work` on a line becomes a TickTick tag `work` (or mapped name), separate from list routing.

| | |
|--|--|
| **Given** | `tagMappings` entry `context/work = work` |
| **When** | Line: `- [ ] Call client #ticktick #type/next #context/work #tts-test` |
| **When** | Synchronize |
| **Then (TickTick)** | List = nextAction; tags include `work` (and `tts-test`) |
| **Maps to** | AC-7 |
| **Status** | **Not exercised** |

---

### CASE-T6 — Complete checkbox ↔ complete task

**Story:** Checking off in Obsidian completes in TickTick and vice versa.

| | |
|--|--|
| **Given** | Synced line with `ticktick_id` |
| **When** | Toggle `[ ]` → `[x]` in vault **or** complete in TT |
| **When** | Synchronize |
| **Then** | Both sides show completed; Abyss status chars respect `statusMappings` if used |
| **Maps to** | AC-6 |
| **Status** | **Not exercised** in pilot |

---

## 6. Pull and file-layout cases

### CASE-L1 — Pull task into correct list file

**Story:** A task created on phone in `TTS-Planned` appears in `TTS-Planned.md` on desktop.

| | |
|--|--|
| **Given** | Allow-listed list; task with `tts-test` if `SyncTag` set |
| **When** | Create task in TickTick in that list; Synchronize |
| **Then (Obsidian)** | Line in `30 Tasks/TickTick/TTS-Planned.md` |
| **Maps to** | AC-8 |
| **Status** | **Not exercised** (stubs only) |

---

### CASE-L2 — No new files at vault root

**Story:** List stubs and tasks never land in vault root.

| | |
|--|--|
| **Given** | `TickTickTasksFilePath` = `30 Tasks/TickTick`; `syncedLists` non-empty |
| **When** | Synchronize |
| **Then** | New list stubs only under `30 Tasks/TickTick/`; **no** new `Inbox.md` at root |
| **Maps to** | AC-2 |
| **Status** | **Partial** — pilot OK for stubs; **legacy** root files from pre-GTD sync remain until manual cleanup (CASE-M1) |

---

## 7. Negative cases (must not happen)

### CASE-N1 — Note outside `syncScopeFolders` must not push

**Story:** A task in `40 KB/` or `99 Archive/` must not create TickTick tasks.

| | |
|--|--|
| **Given** | `syncScopeFolders` = Inbox, Projects, Tasks only |
| **When** | Add checkbox with `#ticktick` under `40 KB/` |
| **When** | Synchronize |
| **Then** | No new TT task; or line ignored with log |
| **Maps to** | `syncScopeFolders` / `isPathInPushScope` |
| **Status** | **Not exercised** |

---

### CASE-N2 — Non-allow-listed TickTick list must not pull

**Story:** Tasks in live `Planned` (non-TTS) do not appear in vault during pilot.

| | |
|--|--|
| **Given** | `syncedLists` = TTS-* only |
| **When** | Task exists only in live `Planned` list |
| **When** | Synchronize |
| **Then** | No line in vault |
| **Maps to** | AC-3 |
| **Status** | **Assumed pass** if filters correct — **not explicitly tested** |

---

### CASE-N3 — No `obsidian://` in TickTick titles

| | |
|--|--|
| **Given** | `fileLinksInTickTick=noLink` |
| **When** | Any sync |
| **Then** | No new titles containing `obsidian://` |
| **Maps to** | AC-10 |
| **Status** | **Pass** on Phase C/D parents |

---

### CASE-N4 — No forced `ticktick` tag on TickTick

| | |
|--|--|
| **Given** | `stopInjectingTickTickTag=true` |
| **When** | Push new task |
| **Then** | TT tags do not gain spurious `ticktick` unless line had it |
| **Maps to** | AC-10 |
| **Status** | **Pass** on pilot tasks observed |

---

## 8. Obsidian → TickTick deletion (smoke)

**Story:** I remove a synced checkbox line (or template subtask) from the vault. After sync, the plugin asks once; if I confirm, the task disappears on TickTick and stays gone.

**Requires plugin ≥ 2.0.28** for aggregated confirm (`processSyncRemovedTasks`). Quick checklist: `SMOKE_TESTS.md`.

### CASE-DEL-1 — Single line removed, one confirm, TT delete

| | |
|--|--|
| **Given** | Task line in scope with `%%[ticktick_id:: …]%%` and pilot tag `#tts-test`; id recorded |
| **When** | Delete the **whole line** in Obsidian; run **Synchronize**; click **Confirm Deletion** on the dialog within the timeout |
| **Then (Obsidian)** | Line stays deleted; no ghost re-insert on next sync |
| **Then (TickTick)** | Task absent from its list (e.g. **TTS-Inbox**) |
| **Then (journal)** | `dir":"obs->tt"`, `op":"delete"`, same `taskId` |
| **Status** | **Open** — run on test vault after 2.0.28 |

### CASE-DEL-2 — Many files, one modal (2.0.28+)

| | |
|--|--|
| **Given** | Two or more scoped notes each missing at least one previously synced id (different files) |
| **When** | One **Synchronize** |
| **Then** | **One** “Task Deletion Confirmation” listing tasks from **multiple** file paths (not a chain of per-file modals) |
| **When** | **Confirm Deletion** |
| **Then** | All listed ids deleted on TT; one summary notice (`deleted N task(s)`) |
| **Status** | **Open** |

### CASE-DEL-3 — Cancel leaves TickTick unchanged

| | |
|--|--|
| **Given** | Same as DEL-1 with a **new** probe task |
| **When** | Remove line; sync; click **Cancel** (or close without confirm) |
| **Then** | Task **still** on TickTick; journal has **no** `obs->tt` delete for that id |
| **Then** | Next sync offers the dialog again (no permanent silent skip) |
| **Status** | **Open** |

### CASE-DEL-4 — Project Active Zone child removed

| | |
|--|--|
| **Given** | Child checkbox under `## Active Zone` in `10 Projects/<pilot>.md` synced to **TTS-Projects** (subtask or child task with id) |
| **When** | Remove child line only; sync; **Confirm Deletion** |
| **Then** | Child gone on **TTS-Projects**; parent project task remains |
| **Notes** | Template titles `1` / `2` / `3` behave like any other line — if the line remains in the note, TT **should** keep the task |
| **Status** | **Open** |

### CASE-DEL-5 — Journal and local DB align

| | |
|--|--|
| **Given** | DEL-1 or DEL-4 completed with confirm |
| **When** | Run **Synchronize** again with no vault edits |
| **Then** | No second delete dialog for the same ids; no new TT tasks for removed lines |
| **Status** | **Open** |

### CASE-DEL-N1 — Out of scope: line removed, no TT delete

| | |
|--|--|
| **Given** | Synced line in a path **outside** `syncScopeFolders` (if any test note exists) |
| **When** | Remove line; sync |
| **Then** | No Obs→TT delete prompt for that task; TT task unchanged |
| **Maps to** | Same intent as CASE-N1 (push scope) |
| **Status** | **Open** (skip if no fixture) |

---

## 9. Migration and cleanup

### CASE-M1 — Recover from first unlimited sync (test vault)

**Story:** Test vault already has root stubs and polluted TT titles from early sync; I want a known-clean baseline for pilot.

| | |
|--|--|
| **Given** | Root `Inbox.md`, `nextAction.md`, …; optional bad `ticktick_id` on legacy project notes |
| **When** | Operator cleanup (TT MCP strip links/tags; vault archive or delete root stubs; preset merge) |
| **Then** | Pilot cases run against TTS lists only; live account not re-polluted |
| **Status** | **Partial** — TT cleaned per PO_STATUS; **vault root stubs remain** |
| **Notes** | Do **not** run on live `Thinkpad` without separate plan |

---

## 10. Pilot execution matrix (2026-10-16)

| Case | Result | Next action |
|------|--------|-------------|
| S2 | Pass (spot) | Optional UI retest |
| S3 | Pass | — |
| S4 | Pass (pilot parent) | Tag YAML → TT for parents |
| P1 | Pass | — |
| P2 | Pass | Optional `tts-test` on TT |
| P5 | Fixed 2.0.18 | Retest on legacy notes |
| P6 | Fail | Fix render + test |
| T2 | Partial | **CASE-T4** implement |
| T4 | Open | **2.0.25** |
| L2 | Partial | CASE-M1 vault cleanup |
| N3, N4 | Pass | — |

**Operator runbook:** test vault `00 Inbox/TTS-PILOT-RUN.md` (phases A–E map to cases above).

---

## 10. Abyss notes & comments (`CASE-AN*`)

Maps to `ABYSS_NOTES_ALIGNMENT.md` §4 and `SMOKE_TESTS.md` § Abyss notes. **2.0.46+** uses TickTick Comments API when `syncAbyssCommentsViaApi` is on (Phase 1).

| ID | Scenario | Pass when |
|----|----------|-----------|
| CASE-AN1 | Obs `- >` → Sync | TT `content`/`desc` has description |
| CASE-AN2 | TT body edit → Sync | Vault `- >` lines updated |
| CASE-AN3 | Abyss comment in `.md` → Sync | **2.0.46+:** TT Comments API (`get_comment`); legacy: `content` has `Comments:\n…` |
| CASE-AN4 | TT `Comments:` block → Sync | Vault `- YYYY-MM-DD …` bullets |
| CASE-AN5 | Checklist item toggle on TT | Matching `- [ ]` / `[x]` under task |
| CASE-AN6 | TT desc change + new local comment | Both preserved after sync |
| CASE-AN7 | Comment in `.md`, title unchanged (**2.0.47** BUG-COMMENT-1) | TT Comments panel shows text after Sync (NOTE-L3b) |

**2.0.47 regressions:** duplicate `note/` / `proj/` tags (BUG-TAG-1) — `CTX-D1` / `CTX-D2` in `SMOKE_TESTS.md`.

Automated: `notesSmoke.test.ts` (NOTE-A*), `abyssCommentSync.test.ts` (NOTE-C*), `taskModificationCommentSmoke.test.ts`, `contextTags.test.ts`. Live: NOTE-L1–L5, NOTE-L3b in `SMOKE_TESTS.md`.

---

## 11. Planned engineering sequence (from cases)

1. **CASE-T4** — mirror/move obs-created lines into `30 Tasks/TickTick/<List>.md`; tests tied to CASE-T2.
2. **CASE-P6** — stop writing parent as checkbox in project notes.
3. **CASE-P3, P4, T3, T6, L1** — close loop on bidirectional daily use.
4. **CASE-M1** — script or doc for test-vault root stub cleanup.
5. **Production naming** — duplicate preset with real list names; re-run full matrix on `Thinkpad` only after all **Must** cases pass.

**Must pass before live vault:** S2, S3, S4, P1, P2, P5, T2+**T4**, L2, N1–N4 (exercised), M1 (acceptable clutter documented), **DEL-1–DEL-5** (see `SMOKE_TESTS.md`).

---

## 12. References

- `GTD_SYNC_CASES.md` (this file)
- `SMOKE_TESTS.md`
- `GTD_SYNC_RESEARCH.md`
- `PO_STATUS.md`
- `CHANGELOG.md`
- `src/projectScheme.ts`, `src/services/ProjectSchemeService.ts`, `src/services/VaultSyncCoordinator.ts`
- Test vault: `00 Inbox/TTS-PILOT-RUN.md`, `00 Inbox/TTS-data-preset.json`
