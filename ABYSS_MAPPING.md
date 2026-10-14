# TickTickSync ⇄ Abyss Tasks mapping (branch `abyss-mapping`)

## Code map (upstream 1723aff)
- Parse MD → task: `src/taskParser.ts` `convertLineToTask`, `getNoteText` (~L670, builds desc/content from `taskRecord.taskLines`), `getNoteString` (~L731, strips delimiters/links), `getItemFromLine` (checklist items), priority/tags/dates helpers; `src/dateMan.ts` dates.
- Collect note lines under a task: `src/services/NewFileMap.ts` `getTaskLinesByIdx` (~L481, delimiter or 2-space block); `markAllTasks` + `taskParser.isNoteLevel` (~L981) keep note lines from becoming tasks.
- Write task → MD: `taskParser.convertTaskToLine` (~L100-200) → `addNote` (~L1202, delimiter block, 2-space prefix), `addItems`, `addPriorityToLine`.
- Change detection/hash: `src/services/TaskModificationDetector.ts` L146/L271, `src/fileOperation.ts` L578 (hash = line + getNoteString).
- Settings: `src/settings.ts` (interface + DEFAULT_SETTINGS), UI `src/ui/settings/svelte/NotesSettings.svelte`.
- Projects/files: `src/services/NewFileMap.ts`, `src/services/FolderSyncService.ts`, `src/fileOperation.ts`; default project per file in `src/services/index.ts`.
- Conflict/sync: `src/services/syncModule.ts` (whole-task last-write-wins by modifiedTime).

## Mapping
| Abyss | TickTick | Status |
|---|---|---|
| `\t- > text` under task | note (`content`/`desc`) | **done** (step 1) |
| `\t- text` (comment) | note, after line `Comments:` | **done**; parsed back to `- ` lines |
| indented `- [ ]` | checklist item / subtask (unchanged) | upstream |
| custom status `[/]`,`[-]`… | tag `status/<name>`; restored to checkbox char on pull | TODO: `convertLineToTask` status + `convertTaskToLine` checkbox; table char↔name in settings |
| note in `projects/X.md` | list X | TODO: settings table path→projectId (wrap `getDefaultProjectIdForFilepath` in services/index.ts) |
| `#type/next`, `#context/work` | setting `tagMappings` (`obsidian/tag = ticktick-tag`), both directions; unmapped → upstream hierarchy logic | **done** (`src/tagMapping.ts`, hooks in `convertLineToTask` tag resolve + `addTagsToLine`) |
| ⏳ scheduled | setting `scheduledAsStartDate`: ⏳ → TickTick `startDate` when line has no 🛫; on pull `startDate` → ⏳ unless the previous local task had 🛫 | **done** (`convertLineToTask` actualStartDate, `DateMan.addDateHolderToTask`) |
| priority, 📅/🛫/🔁/⏰ | as upstream | upstream |
| conflicts | per-field merge: store last-synced snapshot per task, merge fields changed on one side only, LWW per field | TODO: syncModule.ts + snapshot in data.json |

Comments decision: sent to TickTick (under `Comments:`) rather than kept local, because pull rewrites the whole child block from the note — keeping them local would lose them on every TickTick-side edit. Cost: typing a line `Comments:` in a TickTick note splits it.

## Step-1 implementation
Setting `abyssTasksFormat` (default false → upstream behavior unchanged). `src/abyssFormat.ts` pure helpers; hooks in `NewFileMap.getTaskLinesByIdx`, `TaskParser.getNoteString`, `TaskParser.addNote`. Abyss child lines = exactly task tabs + 1 tab, non-checkbox, contiguous right after task line.
Limitations: description lines placed *after* subtasks aren't collected; `taskLinksInObsidian=noteLink` link line not written in Abyss mode; space-indented (non-tab) Abyss lines not recognised.

## Step 2 findings (Abyss Tasks 2.1.0 source, /tmp/abt)
- Indent: reader (`parser/SubItemParser.ts`) accepts any deeper indent, tab = 4 cols, also `>` blockquote prefixes. Writer uses vault `useTab` (`nativeTaskIndentation.ts`): `\t` default, else 4 spaces. We read both (width-based) and write per setting `abyssIndent`.
- Descriptions: `- > text` (`taskBlockSyntax.ts`), edits keep original prefixes (`TaskBlockEditor.replaceDescriptionLines`).
- Comments: `- <stamp>: text`, continuation lines = prefix + 2 spaces (`TaskBlockEditor.addComment`). Continuations kept in TickTick note as lines starting with 2 spaces.
- Time entries are also `- <stamp> →` child bullets → they land in Comments section (round-trip OK).
- Statuses default: ` ` todo, `/` in-progress, `x` done, `-` cancelled (`settings/defaults.ts`); user-definable.
- New comments/subtasks are appended at end of the child block → a comment after subtasks is not in our contiguous block (limitation; next step: collect all direct non-checkbox children, requires block-aware rewrite in fileOperation).
- Blockquote/callout-nested tasks (`> - [ ]`) not supported by TickTickSync.
