# 15 — Release notes: task → list mapping (2.0.94)

## Meta

| Field | Value |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Topic | Honest mapping used by the current plugin / pilot install (release-facing) |
| Plugin | tickticksync-abyss **2.0.94** (`abyss-mapping` tip + pilot `manifest.json`) |
| Evidence | Pilot `tickticksync-abyss/data.json` (2026-10-27); tip `src/settings.ts` / `src/listMapping.ts` (no `statusListMappings` on tip) |
| Status | **docs** (no code / no version bump / no tag) |
| When | 2026-10-27 |

## Inputs

- Owner: «зафиксируй релиз ноутс для текущей версии плагина — какой маппинг использован».
- Tip: `tt-sync/abyss-mapping` @ merge #179 (`343284e`); GitHub Release **2.0.94** already published (PR changelog only — no mapping table there).
- Pilot plugin version **2.0.94**. Local WIP `statusListMappings` / owner Abyss symbol table are **not** on tip and have **no** open PR into `abyss-mapping` as of this note.

## Mapping mechanism (this version)

**Obsidian stage tags → TickTick lists** via settings `tagListMappings`, with `gtdStageVia = list`.

- Checkbox **status** (`[ ]` `/` `!` …) does **not** choose the TickTick list in **2.0.94**.
- `statusMappings` only maps checkbox chars to TickTick **tags** (not lists): `/` → `status/in-progress`, `-` → `status/cancelled`.
- Sync / allow-list scope: SyncTag **`tts-test`**; `syncedLists` = six `TTS-*` lists below; project parents use **`TTS-Projects`** (`projectsListName` + project scheme).

## Exact table (pilot `tagListMappings`)

| Obsidian stage tag | → TickTick list | Notes |
|--------------------|-----------------|--------|
| `#gtd/next` | **TTS-nextAction** | Stage tag not sent as a TT tag; list is the stage. |
| `#gtd/planned` | **TTS-Planned** | Same. |
| `#gtd/waiting` | **TTS-waitingFor** | Same. |
| `#gtd/someday` | **TTS-someDay** | Same. |
| *(no mapped stage tag)* | **TTS-Inbox** | Via `defaultProjectName` / default project — there is **no** `inbox = TTS-Inbox` row in pilot `tagListMappings`. |
| Project note / Active Zone child (scheme) | **TTS-Projects** | Parent + `parentId` children; list routing from stage tags is skipped when under a project parent. |

### `syncedLists` (pilot)

`TTS-Inbox`, `TTS-nextAction`, `TTS-Planned`, `TTS-waitingFor`, `TTS-someDay`, `TTS-Projects`.

### Code defaults (empty vault / no preset)

`DEFAULT_SETTINGS.tagListMappings = []` — **no** built-in GTD rows. List routing appears only after preset / settings load (pilot table above). Empty `syncedLists` pulls nothing.

## What is NOT in this version

| Item | Status on **2.0.94** / tip |
|------|----------------------------|
| Checkbox status → TTS list (`statusListMappings` / UX-STATUS-MAP) | **Not shipped.** Tip has no `statusListMappings` setting. Owner-clarified Abyss symbol map (`[!]`→nextAction, `[/]`→WIP, …) is aspirational design only. |
| TickTick list **TTS-WIP** | **Does not exist** in pilot `syncedLists` / current MCP set; needed only if/when status→list lands. |
| Dual routing (tags **and** status both move list) | Rejected for the future cutover; today tags alone move the list. |

**Update 2026-10-27 (post-#182):** tip `41d734c` **does** ship `statusListMappings`. Published GitHub Release / tag **2.0.94** zip is still tag→list only. Tip installs after #182 (same version string until bump) use status→list when `statusListMappings` is set — prove: `16-status-map-prove.md`.

## Checklist

- [x] Version pinned to **2.0.94** (tip + pilot)
- [x] Mechanism: tags (`tagListMappings`), not checkbox status
- [x] Exact pilot table recorded
- [x] Explicit non-claims for status→list / TTS-WIP
- [x] CHANGELOG iteration + INDEX row 15
- [ ] Owner merge of this docs PR (no tag / no `gh release` edit from this task)
