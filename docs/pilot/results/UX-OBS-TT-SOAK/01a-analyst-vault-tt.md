# 01a — Analyst A (vault → TickTick / project notes)

## Meta

| Field | Value |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Role | Analyst A |
| Vault | Thinkpad-tts-test (pilot) |
| Plugin | tickticksync-abyss **2.0.94** (confirmed `manifest.json`) |
| When | 2026-10-27 ~07:55 UTC |
| Focus | Obsidian → TickTick; project notes / MOC template / Active Zone |
| Tools | vault file inspect; Obsidian CLI `append` + `tickticksync-abyss:tts-sync`; TickTick MCP `get_task_by_id` / `get_project_with_undone_tasks` |

## What I ran

1. **Inspected** `60 templates/MOC.md` (Templater project-MOC path).
2. **Inspected existing project notes:**
   - `10 Projects/TTS-PILOT- Dishwasher project.md` (legacy synced; frontmatter `#ticktick`)
   - `10 Projects/TTS-PILOT- Phase C test.md` (dense Active Zone + ids)
   - `10 Projects/test03.md` (fresh small Abyss/MOC-shaped note from same day)
   - skim: `TTS-QA- Obs-origin project.md`
3. **Read Abyss + TTS settings (no secrets logged):**
   - Abyss: `membershipQuery` = `#system/project and "10 Projects/"`, `createFolder` = `10 Projects`, `taskIgnoreQuery` = `#ticktick`, project insert `## Active Zone`
   - TTS: `SyncTag` = `tts-test`, `syncedLists` = TTS-* (incl. TTS-Projects), `projectSchemeEnabled`, `projectsFolder` = `10 Projects`, `stopInjectingTickTickTag` = true, `taskDisplay.editing.id` = true
4. **Live Obs → TT (ran):**
   - Appended Active Zone line on Dishwasher:  
     `- [ ] UX-SOAK-1A-145515 Active Zone checkbox #tts-test #obsidian #note/tts-pilot-dishwasher-project`
   - Ran `obsidian vault=Thinkpad-tts-test command id=tickticksync-abyss:tts-sync`
   - Vault line became:  
     `- [ ] UX-SOAK-1A-145515 Active Zone checkbox #note/tts-pilot-dishwasher-project #obsidian #tts-test %%[ticktick_id:: 6ae058ecbee3821f88830454]%%`
   - TT MCP: task `6ae058ec…` title `UX-SOAK-1A-145515 Active Zone checkbox`, list **TTS-Projects**, `parentId` = Dishwasher parent `6ad1c787…`, tags `note/tts-pilot-dishwasher-project`, `tts-test`, `obsidian`
5. **Not run / out of lane:** Abyss UI panel walkthrough (Analyst B); UI toast text not captured via CLI (only journal create/commit records).

## Axis feedback

### 1. Шум в Obsidian-шаблонах — **high**

- **MOC Templater wall:** `60 templates/MOC.md` opens with ~25 lines of `tp.system.prompt` / suggester / rename before any markdown a human reads. Fine for power users; noisy for “just make a project.”
- **Scaffold leftovers in live notes:** Dishwasher still shows empty `> Тип:` / `> Область: ****`, Overview placeholders, and callout Metadata with empty `Source::` / `Next::` — sync did not clean these; human did not either.
- **Active Zone placeholders:** template ships `- [ ] 1/2/3` under “Открытые вопросы”; `test03.md` kept those as real synced tasks titled `"1"`, `"2"`, `"3"` in TTS-Projects (ugly titles on TT).
- **Section reorder after life:** Dishwasher Overview body drifted under the Metadata callout; Active Zone stayed usable but the note no longer matches template order — reading feels “broken MOC,” not “project dashboard.”

### 2. Избыточная информация — **high**

- **Per-line sync chrome (edit mode):** every linked task shows `#obsidian`, often `#note/<slug>`, optional `#tts-test` / `#gtd/next` / `#inbox`, plus `%%[ticktick_id:: …]%%`. Phase C Active Zone is a wall of tags+ids (example: `TTS-PILOT- Phase C test.md` lines under `## Active Zone`).
- **Frontmatter duplication:** note-level `ticktick_id:` **and** line-level `%%[ticktick_id::]%%`; tags `system/moc` + `system/project` + sometimes `ticktick` / `obsidian` / `tts-test`.
- **Status vocabulary clash:** MOC default `status: 🟢 In Progress` vs Abyss project statuses `inbox|todo|wip|done` (`test03.md` uses `todo`). Same property, two dialects — Abyss badges vs emoji prose.
- **Notices:** CLI sync produced no readable toast capture; journal shows dense create/move/update ops (e.g. test03 children first created under TTS-Inbox then moved/parented into TTS-Projects). If the UI surfaces each move, that is notice spam; not proven here beyond journal volume.

### 3. Удобство пользования — **medium (works if you know the runbook)**

- **What worked (live):** checkbox under an already-mapped project note + `#tts-test` + Synchronize → child under correct TT parent in TTS-Projects within ~seconds. Good.
- **Hidden prerequisites:**
  - New lines need SyncTag `#tts-test` (or already-linked id). Plain `- [ ] buy filter` under Active Zone is easy to forget.
  - Abyss project membership needs `#system/project` **and** path under `"10 Projects/"` (quotes required for space — landmine from brief confirmed in settings).
  - `createFolder` is `10 Projects` (no quotes) — easy to misconfigure vs membership query.
- **CLI discoverability:** command id `tickticksync-abyss:tts-sync` works; a person still needs ribbon/command palette. Automatic interval on pilot is `0` (manual only).
- **Template → TT titles:** leaving template `1/2/3` checkboxes creates worthless TT tasks; no guardrail.

### 4. Логичность использования (Obs projects vs TT TTS-Projects vs Abyss Projects) — **medium–low coherence**

| Layer | What it thinks a “project” is |
|-------|-------------------------------|
| Obsidian | Note in `10 Projects/` with MOC sections + `#system/project` |
| TickTick | Parent task in list **TTS-Projects** (title ≈ note title; tags `project` / `obsidian`) |
| Abyss Projects | Notes matching `membershipQuery`; tasks **excluding** `#ticktick` |

- **Landmine confirmed:** Dishwasher frontmatter includes `- ticktick`. Abyss `taskIgnoreQuery: #ticktick` means that project’s Active Zone lines are **hidden/blocked in Abyss task views** even though they sync fine Obs↔TT. Same pattern appears on TT→Obs created notes (journal: `UX-B tip parent 145447.md` created with `- ticktick`). `stopInjectingTickTickTag: true` helps *new* TTS injections, but **legacy + TT-origin project notes still carry `#ticktick`**.
- **Triple surface:** person can edit in vault note, Abyss Projects/Active Zone insert, or TickTick TTS-Projects — same object, three UIs, different filters.
- **Folder ≠ list:** many files under `10 Projects/` are real life projects; TTS only schemes allow-listed parents; Abyss only membershipQuery. FOOL / AF fixtures sit beside real MOCs — cognitive load for day-to-day use.

**Scores (1–5, 5 = excellent UX):** noise 2 · excess info 2 · usability 3 · logic 2.

## Surprises

1. Live soak line nested correctly under Dishwasher parent without manual parent tagging — scheme parenting **worked**.
2. `search_task` MCP returned empty for the soak title; `get_task_by_id` / project listing succeeded — TT search is not a reliable verify path.
3. Journal entry after soak create briefly showed Dishwasher `childIds` including **its own id** in an update payload (self-child noise) — worth a later bug glance; did not block the child create.
4. test03’s template `1/2/3` became three real TTS-Projects children — template placeholders are production tasks once synced.
5. Status emoji vs Abyss enum on the same `status` key is silent — no migration toast.

## Recommendations (product / docs — no code required here)

1. **Docs (pilot + product):** one-page “Create project task” — Active Zone checkbox + `#tts-test` + Sync; warn that `#ticktick` on the **note** hides it from Abyss; show quoted membershipQuery example `"10 Projects/"`.
2. **Docs / preset:** strip or never write frontmatter `#ticktick` on project notes when using Abyss `taskIgnoreQuery: #ticktick`; document Option B explicitly (marker on lines vs notes).
3. **Template hygiene:** MOC Active Zone should not ship syncable `- [ ] 1/2/3`; use comments or non-checkbox bullets for placeholders; align `status` values with Abyss (`todo`/`wip`/`done`) or map emoji→enum in docs.
4. **Display defaults:** keep reading mode id hidden (already); consider reading-mode tag trim (`#note/…` noise) for project Active Zones; editing-mode id=true is fine for power users only.
5. **Mental model diagram:** Obs note ↔ TTS-Projects parent ↔ Abyss Projects (membership vs ignore) in README / pilot SETUP — three boxes, one arrow each way.
6. **Works but ugly:** tag reorder after sync; empty MOC callouts left forever; Inbox→Projects move storm on first project bind (test03 journal) — soft toast summary preferred over per-move notices if that is what UI does.

## Blockers / works-but-ugly

| Kind | Item |
|------|------|
| Blocker (Abyss day-to-day) | Project notes tagged `#ticktick` disappear from Abyss task surfaces while still syncing to TT |
| Blocker (new user) | Must know SyncTag `#tts-test` + Synchronize; interval 0 |
| Works but ugly | Line tags + `%%ticktick_id%%` density in Active Zone |
| Works but ugly | Placeholder checkboxes become TT tasks `"1"`/`"2"`/`"3"` |
| Works but ugly | Dual status vocabularies on one frontmatter key |
| Logic debt | Three “Projects” concepts without a single canonical UI |

## Checklist

- [x] Plugin version confirmed **2.0.94**
- [x] MOC template inspected
- [x] ≥1 existing project note inspected (Dishwasher + Phase C + test03)
- [x] Abyss membership / createFolder / taskIgnoreQuery noted
- [x] Light live Obs→TT Active Zone create + sync + TT verify
- [x] Four axes scored with concrete vault-relative examples
- [x] No secrets / no absolute personal paths in this file
- [x] INDEX 1a status to be set **done** with this file
