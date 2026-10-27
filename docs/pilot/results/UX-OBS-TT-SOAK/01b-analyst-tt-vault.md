# 01b — Analyst B (TickTick → vault / Abyss view)

## Meta

| Field | Value |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Role | Analyst B |
| Vault | Thinkpad-tts-test (pilot) |
| Plugin | tickticksync-abyss **2.0.94** (confirmed `.obsidian/plugins/tickticksync-abyss/manifest.json`; `data.json` still reports `version=2.0.91`) |
| Abyss Tasks | **2.2.3** |
| When | 2026-10-27 ~07:55–08:00 UTC |
| Focus | TickTick → Obsidian pull; Abyss Projects / Tasks mental model; notice noise |
| Tools | TickTick MCP (`create_task`, `list_projects`, `get_project_with_undone_tasks`); vault file inspect; `.tickticksync/journal/`; Abyss `data.json` / `state.json` |
| Lane | Does **not** duplicate Analyst A Obs→TT Active Zone append |

## What I ran

1. **Confirmed** plugin manifest **2.0.94**; Abyss settings:
   - `membershipQuery`: `#system/project and "10 Projects/"` (quotes required)
   - `createFolder`: `10 Projects`
   - `taskIgnoreQuery`: `#ticktick`
   - Project insert target: `## Active Zone`
2. **Inspected** existing TT→Obs / tip fixtures under `10 Projects/`:
   - `AF-2 tip parent 140700.md` (TT-origin; `#ticktick`; empty MOC scaffold; no AZ children)
   - `TTS-QA- TT-origin project.md` (same empty MOC pattern)
   - `AF-3 tip obs parent 140800.md` (obsidian tags; one AZ checkbox with `#note/…` + id)
   - Dense AZ: `TTS-PILOT- Phase C test.md`, `TTS-PILOT- Dishwasher project.md`, `home-change-water-filters.md`
   - Abyss Projects kanban state: emoji/`none` buckets vs configured `inbox|todo|wip|done`
3. **Live TT → Obs (ran):**
   - MCP create parent on **TTS-Projects**: `UX-B tip parent 145447` → id `6ae058df8f08f395056f30dc`
   - MCP create child: `UX-B tip child next 145447` → id `6ae058f38f08408071449367`, `parentId` = tip parent
   - Obsidian sync (owner/vault side, same window as Analyst A soak) journaled `tt->obs` **create** `10 Projects/UX-B tip parent 145447.md` at `2026-10-27T07:55:30.104Z` (~19s after MCP create)
4. **Verified pull result on disk** (note exists; see Axis 1).
5. **Polled ~40s** for child line / journal entry for `6ae058f3` — **not landed** in Active Zone or journal yet (parent-only first sync / race with child create ~20s later).
6. **Notices:** no Obsidian UI session in this lane — cannot quote live toast text. Correlated **#404** (`none`→`none` parent-change Notice) + Abyss kanban bucket `"none"`; same-sync journal noise into `zz-parked-17/…`.

## Axis feedback

### 1. Шум в шаблонах / vault lines after pull — **high**

Live TT→Obs tip parent is a **full empty MOC dump**, not a lean project card:

- Path: `10 Projects/UX-B tip parent 145447.md`
- Frontmatter auto-filled: `status: 🟢 In Progress`, empty `kind`/`type`/`areas`, tags `system/moc`, `system/project`, **`ticktick`**, `ticktick_id`
- Body: `> Тип:` blank, `> Область: ****`, Overview bullets still “Цель: (что должно…)”, Active Zone still “❓ Открытые вопросы / 💡 Свежие инсайты / 1 2 3”, empty Metadata callout `Source::` / `Next::`
- TT `content` (“Analyst B UX soak…”) landed under Overview; **useful signal buried in scaffold**

Same pattern on older TT-origin notes (`AF-2 tip parent 140700.md`, `TTS-QA- TT-origin project.md`). Count: ≥7 notes still matching empty “Область: **** / Цель: (что должно” placeholders.

Same sync (`sync-mvqe4xqv-v-3ydn`) also **re-created** stub list files under `zz-parked-17/30 Tasks/TickTick/TTS-*.md` (`== Added by TickTickSync (Abyss fork) -- 2.0.94 ==`) — pull feels like a dump into parked trees, not a deliberate GTD project create.

### 2. Избыточная информация — **high**

- **Line chrome (edit view):** Active Zone lines commonly carry 3–5 tags + hidden id, e.g. Phase C:
  - `- [ ] one more #obsidian #note/tts-pilot-phase-c-test %%[ticktick_id:: 6ae04e51…]%% ➕ 2026-10-27`
  - AF-3 tip: `#note/af-3-tip-obs-parent-140800 #obsidian #gtd/next %%[ticktick_id:: …]%%`
- **`#note/<slug>`** repeats the note name on every child — useful for Dataview, noisy for reading/editing in Abyss or markdown.
- **Dual ids:** note `ticktick_id` + per-line `%%[ticktick_id::]%%`.
- **Origin tag `ticktick` on TT-pulled projects** (UX-B, AF-2 tip, Dishwasher) vs `#obsidian` on Obs-origin — correct for provenance, but see Axis 3/4 collision with Abyss ignore.
- **Notices (known + structural):**
  - Issue **#404**: parent-change toast `none`→`none` when titles missing from local cache (seen on pilot around test03 nesting).
  - Sync “Done” / progress toasts not captured in this MCP/file lane; journal shows dense create/move/commit bursts (Analyst A’s test03: inbox create → project move → parentId moves) — if UI Notices each step, that is timing spam.

### 3. Удобство (Abyss create into project / sync loop) — **low–medium**

| Intent | What actually happens |
|--------|----------------------|
| See TT tip parent in Abyss Projects | Note has `#system/project` + path under `10 Projects/` → **membership OK** |
| Edit / add task via Abyss on that note | Frontmatter `#ticktick` + `taskIgnoreQuery: #ticktick` → Abyss treats note as ignored → **«No target file found for task»** (brief landmine; TT-origin projects are the worst hit) |
| Create task into project from Abyss | Works only on notes **without** `#ticktick` (Obs-origin like `test03`, `AF-3 tip`); TT-pulled projects are second-class in Abyss |
| Sync loop TT→Obs→Abyss | Parent appears ~20s; child may need **another** sync; AZ still shows template “1/2/3” text, not checkboxes — easy to mistake placeholders for tasks |
| Config landmines | Membership needs quoted `"10 Projects/"`; createFolder unquoted `10 Projects` — easy to break Projects panel |

Abyss Projects kanban already has a literal **`none`** column containing `AF-3 tip obs parent 140800.md` (state.json), while many TT-pulled notes use `status: 🟢 In Progress` which is **outside** Abyss statuses `inbox|todo|wip|done` → badges/columns look broken even when the file is “a project.”

### 4. Логичность (pull feels like GTD / Abyss vs sync dump) — **low (sync dump)**

Pull of a TTS-Projects parent does **not** feel like “new GTD project in Abyss”:

1. Injects Templater MOC skeleton with empty Russian prompts (not Abyss-shaped `todo`/`wip`).
2. Tags note `#ticktick`, which **locks Abyss editing** by design of this vault’s ignore query.
3. Children may lag; Active Zone stays decorative until a later sync or Obs-side checkbox create.
4. Parallel surfaces: TT list TTS-Projects ↔ vault MOC ↔ Abyss Projects (different status dialects, different ignore rules).

Obs-origin lean notes (`TTS-QA- Obs-origin project.md`, `AF-3 tip…`) read closer to “project + one next action.” TT-origin pulls read like **template materialization**.

**Scores (1–5, 5 = excellent UX):** noise 2 · excess info 2 · usability 2 · logic 2.

## Surprises

1. **Live TT parent landed fast (~19s)** with full MOC scaffold including `#ticktick` — confirms TT→Obs path works, and confirms Abyss-ignore collision on day-one pull.
2. **Child present in TTS-Projects MCP** (`parentId` set) but **absent from vault AZ and journal** after ~40s poll — parent/child not atomic from a UX “I created a project with a next action” perspective.
3. Same sync batch wrote **parked** TTS list stubs under `zz-parked-17/` — unexpected side noise for a tip-parent create.
4. Abyss Projects UI already materializes a **`none`** status bucket — pairs mentally with #404’s `none`→`none` toast (different layers, same “none means unknown” smell).
5. Hybrid search MCP returned **no hits** for `10 Projects` scope (index/path quirk); file tools required — tooling friction only, not product.

## Recommendations

1. **TT→Obs project materialize:** optional lean template (title + `## Active Zone` + empty checklist) instead of full MOC with placeholders; or strip empty scaffold sections on first pull.
2. **Stop tagging TT-origin project notes `#ticktick` when `taskIgnoreQuery` is `#ticktick`** (or document that Abyss cannot edit TT-pulled projects; use a different provenance tag).
3. **Map default project status** to Abyss vocabulary (`wip` / `todo`) instead of `🟢 In Progress` so Projects kanban does not invent `none` / raw emoji columns.
4. **Parent-change Notice (#404):** show ids when titles missing; suppress no-op `none`→`none`.
5. **Child inclusion:** ensure first sync after parent+child create brings AZ checkboxes in the same pass when possible; avoid leaving template `1/2/3` looking like real tasks.
6. **Avoid recreating parked list stubs** on unrelated project pulls (or exclude `zz-parked-*` from sync write targets).

## Checklist

- [x] Plugin version confirmed **2.0.94** from vault manifest
- [x] TTS-Projects tip parent created via MCP (`UX-B tip parent 145447`)
- [x] Note observed under `10 Projects/` after sync
- [x] Abyss membership / createFolder / `taskIgnoreQuery` landmines checked against settings + TT-origin tags
- [x] Axis feedback with concrete paths/examples
- [x] #404 / Done-toast noise noted (UI toast text **not** live-captured; issue + journal/structure only)
- [ ] Child AZ line after second sync — **not run / pending** (still missing at poll end)
- [x] INDEX updated for phase 1b
- [x] No git push / merge / release; no secrets in evidence
