# 03 — Researcher (try to use as knowledge + next actions)

## Meta

| Field | Value |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Role | Researcher (knowledge-work persona; not QA) |
| Vault | Thinkpad-tts-test (pilot) |
| Plugin | tickticksync-abyss **2.0.94** (confirmed `.obsidian/plugins/tickticksync-abyss/manifest.json`; `data.json` still `version=2.0.91`) |
| Abyss Tasks | membership `#system/project and "10 Projects/"`; `taskIgnoreQuery: #ticktick`; insert `## Active Zone` |
| When | 2026-10-27 ~08:02–08:04 UTC |
| Focus | One research thread as project + next actions + optional inbox; sync; TT verify; Abyss usability landmines; cognitive load |
| Tools | vault write; Obsidian CLI `append` + `tickticksync-abyss:tts-sync`; TickTick MCP `get_task_by_id` / `list_projects`; hybrid-search skim; settings inspect |
| Priors read | `00-brief.md`, skim `01a`, `01b`, `02-devops-fresh.md` |

## What I tried

Scenario: start a **small reading thread** (capture → clarify → project → next), keep the note lean (skip full MOC Templater), push next actions to phone via TickTick.

1. **Created** lean project note `10 Projects/UX-RESEARCH-read-capture 080217.md`:
   - `status: wip`, tags `#system/moc` `#system/project` `#obsidian` (no `#ticktick` — avoid Abyss ignore)
   - Short Overview question (one bullet)
   - Three Active Zone checkboxes, each with SyncTag `#tts-test`
2. **Inbox fleeting** via CLI append to `00 Inbox/abyss-active.md` (natural “where do lit notes go?” dump). Accidental **double append** → two identical inbox lines both synced (honest friction).
3. **Synchronize:** `obsidian vault=Thinkpad-tts-test command id=tickticksync-abyss:tts-sync` → **Executed**.
4. **Verify TT** via MCP `get_task_by_id` (not `search_task` — empty for this title, same as 01a).
5. **Abyss Projects usability (settings + priors, UI panel not run):** membership needs quoted `"10 Projects/"`; Obs-origin note without `#ticktick` should be editable; TT-origin peers still poisoned by `taskIgnoreQuery`.

Deliberately skipped `60 templates/MOC.md` — as a researcher mid-skim I want a card + nexts, not Russian scaffold + syncable `1/2/3`.

## What it felt like

| Step | Feel |
|------|------|
| Lean note create | Calm — readable Overview + AZ before sync |
| Remember `#tts-test` | Ritual tax; without priors I would have written plain checkboxes and wondered why phone stayed empty |
| Inbox append | Easy capture; file is an AF/REG landfill — my fleeting thought vanishes into noise |
| Double-append race | Sync (or concurrent CLI/open vault) landed **two** TTS-Inbox clones of the same title before I could clean — capture feels sticky and unforgiving |
| After sync on project | Edit-mode AZ became tag+id walls (`#obsidian` `#note/…` `%%[ticktick_id::]%%`) — I no longer want to *read* next to the note |
| Folder glance | `10 Projects/` mixes life MOCs, AF fixtures, UX soak debris — hard to treat as a research portfolio |
| Stay or flee? | Strong urge to keep **reading** in Obsidian plain markdown / one list, and park **only** phone nexts in TickTick — without the triple surface |

## What happened (evidence)

| Step | Result |
|------|--------|
| Project create | OK — lean file |
| Inbox append | Ran; **two** lines synced (dup titles) |
| Sync CLI | **Ran** (`Executed: tickticksync-abyss:tts-sync`) |
| Vault after sync | Note `ticktick_id: 6ae05adfae70021f88867378`; 3 AZ lines with tags + line ids |
| TT parent | Title `UX-RESEARCH-read-capture 080217`, list **TTS-Projects**, tags `obsidian` + `project`, `parentId` null |
| TT children (3) | All TTS-Projects; each `parentId` = research parent; titles match AZ |
| TT inbox (2) | Both on **TTS-Inbox**; titles match fleeting; **not** nested under research parent |
| Parent MCP `childIds` | `[]` while children have correct `parentId` (same ding as DevOps) |
| Abyss UI panel | **Not run** this lane (settings + landmines only) |

Scheme parenting for Obs→TT **worked**. Cognitive product after sync feels worse than before sync.

### Landmines this run

| Landmine | Bit me? |
|----------|---------|
| Abyss `#ticktick` ignore | **Avoided** on Obs-origin note; still a trap if I had clarified from phone-first TT tip |
| Quoted membership `"10 Projects/"` | Not reconfigured; easy to break Abyss Projects |
| SyncTag `#tts-test` | Required; remembered from priors |
| Empty MOC `1/2/3` | Avoided by lean path; still pollutes folder/TT from older notes |
| Inbox hygiene | **Hit** — landfill + duplicate create |
| Status emoji vs `wip` | Used `wip`; peers still emoji — Abyss kanban would look split |

## Axis feedback

### 1. Template noise in Obsidian — **medium on lean path; high on default**

- Lean card stayed quiet until sync. Good for research skim notes.
- Default MOC / TT-pull scaffolds around me (empty Overview, Metadata callouts, `1/2/3`) are hostile to “open one project and think.”
- Folder itself is template/fixture noise: hard to find *my* thread among soak parents.

### 2. Excess information — **high after first sync**

- One Synchronize turned three clean nexts into:

  `- [ ] … #obsidian #tts-test #note/ux-research-read-capture-080217 %%[ticktick_id:: …]%%`

- `#note/<slug>` repeats the note title on every line — useless while clarifying claims.
- Dual ids (note + line) + provenance tags are machine-correct, human-hostile for reading cadence.
- Inbox shows the same chrome; plus REG/AF leftovers — excess from *other people’s tests* contaminates my capture surface.
- Notices: **not run** / not UI-captured; journal shows dense create/rewrite storm per child.

### 3. Usability for research cadence (capture → clarify → project → next) — **medium if primed; low if cold**

What worked:

- Capture (inbox checkbox + SyncTag) → TTS-Inbox.
- Clarify into lean project under `10 Projects/` + AZ nexts → TTS-Projects parent with nested children.
- Sync CLI discoverable; parenting correct.

What breaks research rhythm:

- Must know SyncTag, membership tags, `#ticktick` ignore, quoted folder query — not discoverable from the blank note.
- Clarify step wants quiet markdown; sync pollutes the same surface I clarify on.
- Abyss Projects would help as a board **only** if Obs-origin and ignore landmine known; TT-first (phone while walking) is the wrong door for Abyss edit (01b).
- Inbox does not auto-attach fleeting to the research parent — GTD-correct, but I now have orphan questions next to project nexts with no link.
- `search_task` MCP empty — verification needs id from vault/journal; researchers without MCP are stuck eyeballing TickTick lists full of `"1"`/`"2"` and soak titles.

### 4. Logic of the model — **low–medium for knowledge + phone tasks**

| Layer | This fixture |
|-------|----------------|
| Obsidian | Lean research note + Overview question + AZ nexts |
| TickTick | Parent in TTS-Projects + 3 children; 2 orphan inbox tasks |
| Abyss Projects | Should match membership (no `#ticktick`); UI **not exercised** |

Mental model tension for research:

- “Project” = note / TT parent task / Abyss membership row — three ontologies.
- Reading notes want permanence and low chrome; sync injects task chrome into the note body.
- Phone tasks want a short list; TTS-Projects is a landfill of placeholders + pilots + life titles.
- Logic of nesting works mechanically; logic of *where I should think* does not — after sync I want to flee the note.

**Scores (1–5, 5 = excellent UX):** noise 3 (lean) / 2 (folder) · excess info 2 · usability 3 · logic 2.

## Adopt?

**Partial — no as default daily system; yes for a narrow split.**

- **Would adopt:** Obsidian for research notes / claims / Overview prose **without** syncing the prose body; TickTick mobile for a *small* next-action list if SyncTag + lean AZ were one-pager simple and line chrome hidden in reading mode.
- **Would not adopt:** full Obs project note ↔ TTS-Projects parent ↔ Abyss Projects as the place I live while reading; inbox-as-today; MOC Templater for every thread; trusting Abyss on TT-origin tips.
- **Flee risk:** high — one markdown list in Obsidian *or* plain TickTick beats this stack when cognitive load matters more than bidirectional fidelity.

## Recommendations

1. **Research preset:** title + Overview + `## Active Zone` only; never default MOC `1/2/3` / empty Metadata for knowledge threads.
2. **Reading mode / hide sync chrome** on AZ lines (`#note/…`, `#obsidian`, optional id) — keep machine ids for power users.
3. **Inbox live file** separate from AF/REG soak wall (or auto-archive completed) — fleeting capture must stay scannable.
4. **Dedup or soft-warn** identical unsynced titles on same note before creating a second TT task.
5. **Fix TT-origin `#ticktick` vs Abyss `taskIgnoreQuery`** — researchers often start a tip on the phone.
6. **One-pager cadence:** capture (inbox + SyncTag) → clarify (lean project) → next (AZ) → Synchronize — without membership/quote footnotes buried in settings.

## Checklist

- [x] Plugin version confirmed **2.0.94**
- [x] Brief + skim 01a / 01b / 02
- [x] Created `10 Projects/UX-RESEARCH-read-capture 080217.md` with Overview + 3 AZ + SyncTag
- [x] Optional inbox capture (dup noted)
- [x] Synchronize via Obsidian CLI **ran**
- [x] TT verify: parent + 3 children TTS-Projects; inbox on TTS-Inbox (×2)
- [x] Abyss landmines considered (`#ticktick` ignore; quoted membership)
- [x] Four axes + Adopt? answered
- [x] No plugin source changes; no push/merge/release
- [x] No secrets / no absolute personal paths in this file
- [x] INDEX row 3 → **done**
