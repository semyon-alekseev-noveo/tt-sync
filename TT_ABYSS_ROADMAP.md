# Roadmap: TickTick comments, task↔note, subtasks

**Date:** 2026-10-19  
**Branch:** `abyss-mapping`  
**Status:** Planning (post–2.0.40 description sync)

Three workstreams requested after pilot smokes (description + embedded `Comments:` in `content`).

---

## Phase 1 — Abyss comments ↔ TickTick **Comments** UI

### Today

| Abyss (vault) | TickTick today |
|---------------|----------------|
| `- > …` description | `content` (top of note) |
| `- YYYY-MM-DD HH:MM: …` comment | Appended into **`content`** after `Comments:\n` (`abyssLinesToNote` / `noteToAbyssLines`) |

TickTick also has a **separate Comments API** (activity feed in app UI): `get_comment` / `add_comment` / `delete_comment` (MCP verified; comment body field is `title`, max 1024 chars, ids like `6ad5ff0f…`).

The plugin **does not call** comment endpoints yet (`TicktickRestAPI.ts` has no comment methods).

### Target

| Abyss | TickTick |
|-------|----------|
| `- > …` | `content` only (description) |
| `- <stamp>: …` (+ continuations) | **One API comment per Abyss comment thread** (native UI section) |

**Out of `content`:** stop writing/reading the synthetic `Comments:` block when setting `syncNotes` + new flag (proposed: `syncAbyssCommentsViaApi: true`, default on for Abyss builds).

### Design notes

1. **Identity map** (Dexie): `taskId` + Abyss comment fingerprint → `ticktickCommentId`.  
   - Fingerprint: normalized stamp + first line text (or hash of full thread including continuations).  
   - On pull: match by `createdTime` ↔ parsed stamp when possible, else by text.

2. **Push (Obs → TT)**  
   - Parse `taskLines` → split desc vs comment (`classifyChildren`).  
   - Update task `content` from descriptions only.  
   - For each local comment without mapped id → `add_comment`.  
   - Edit/delete: API may only expose delete (no `update_comment` in MCP) → delete + re-add or leave edit as LWW on text line only.

3. **Pull (TT → Obs)**  
   - After task fetch, `get_comment` for scoped tasks.  
   - `noteToAbyssLines`: descriptions from `content`; comments from API list (format stamp from `createdTime` in vault TZ).  
   - `mergeAbyssBlock` + `__baseContent` still applies to descriptions/items/subtasks; comment ids stored separately so TT-side deletes remove lines.

4. **Migration**  
   - One-time: if `content` contains `Comments:\n`, split on sync and optionally create API comments (user confirm) or strip header into vault-only.

5. **Edge cases** (from `ABYSS_MAPPING.md`)  
   - **Time entries** (`- date →`) today ride into `Comments:` — decide: own API comments, skip sync, or stay in `content`.  
   - Comments after subtasks in file order: still limited by `abyssRegionEnd` (document in smokes).

### Done criteria

- CASE-N3/N4 updated: comment in Abyss → visible in TT **Comments** panel, not only in description.  
- TT comment → `- stamp:` line under task after sync.  
- Description-only tasks unchanged (2.0.40 behaviour).

### Implementation touchpoints

- `src/services/TicktickRestAPI.ts` — comment CRUD  
- `src/abyssFormat.ts` — optional split: `abyssLinesToDescription` / comments excluded from `abyssLinesToNote` when API mode on  
- `src/services/TaskModificationDetector.ts` — push comment diff  
- `src/services/VaultSyncCoordinator.ts` or pull path — fetch comments, rewrite block  
- `src/db/schema.ts` — `taskComments` table or JSON on `LocalTask`  
- Settings + `NotesSettings.svelte`

---

## Phase 2 — TickTick task ↔ Obsidian **note** (align with Abyss)

### How Abyss models it (2.2.0, pilot vault)

| Concept | Behaviour |
|---------|-----------|
| **Task** | Checkbox line in markdown (+ child block: desc, comments, items, nested checkboxes). |
| **Home file** | `taskFilePath` → `00 Inbox/abyss-active.md` (capture / inbox list). |
| **Source note** | `sourceNoteDisplay: non-default` — UI link to the **file** where the line lives when it is not the “home” context (dashboard / project views). |
| **Project** | Note under `projects.membershipQuery` (vault should use `10 Projects/`, not `projects/` — see `GTD_SYNC_RESEARCH.md` §2.1). |
| **Task note (documentation)** | Separate `.md` in `30 Tasks/…` from template `60 templates/task.md` (`project:`, `task:` wikilink) — **not** a second TT task; checkboxes inside sync like any inline line. |

**PO line already in research:** project note = GTD project; task note = prose/subtasks doc; **TickTick entity = checkbox line** (`GTD_SYNC_RESEARCH.md` §2.2).

### What TickTickSync already has

| Setting | Role |
|---------|------|
| `fileLinksInTickTick` | `taskLink` / `noteLink` / `noLink` — Obsidian URL in TT title or note body |
| `taskLinksInObsidian` | Back-link style when pulling |
| `projectScheme` | MOC ↔ parent on Projects list |
| `resolveForFile` | `project:` in frontmatter → child of project parent |

### Options to “срастить” (pick in PO review)

| ID | Model | Pros | Cons |
|----|--------|------|------|
| **L1** | **Inline-first** (current pilot) | Matches Abyss inbox + Active Zone; 2.0.40 notes work | No dedicated note per TT task |
| **L2** | **noteLink in `content`** | TT opens vault file; one line in description | Pollutes TT note; fights Abyss `- >` body |
| **L3** | **Task note template** | Rich docs in `30 Tasks/`; `project:` for scheme | Manual or Templater create; sync still line-based |
| **L4** | **Frontmatter `ticktick_id` on task note** | Stable id if line moves | Not implemented; risk duplicate tasks if line + note both sync |
| **L5** | **Abyss project dashboard only** | Tasks stay in MOC Active Zone | Same as L1 for sync code |

**PO choice (2026-10-19):** **L1 + L3** confirmed.

**Config follow-up:** Abyss `projects.membershipQuery` → `10 Projects/` (pilot OK); `taskInsertionSection` → `## Active Zone`.

### Phase 2b — Abyss grouping vs flat TickTick

#### How Abyss groups tasks

| View | Binding |
|------|---------|
| **Projects** (dashboard) | MOC in `10 Projects/` + `status`; lines in **Active Zone** + notes with **`project: [[MOC]]`**. |
| **Source note** | File path chip (`sourceNoteDisplay: non-default`). |
| **Inbox** | Untagged lines in inbox file (`taskIgnoreQuery: #ticktick`). |
| **Tags / calendar** | `#type/*`, dates on the line. |

#### What sync sends to TickTick

| Origin | TT | Grouping in TT app |
|--------|-----|-------------------|
| Active Zone in MOC | `projectId` = TTS-Projects, `parentId` = MOC id | Children under **parent task** on **TTS-Projects** (open parent to see subtasks). |
| `abyss-active.md` | TTS-Inbox, `parentId` empty | Flat inbox — **no** project parent. |
| `#type/next` outside MOC | TTS-nextAction, no parent | Flat next-action list. |
| `#type/next` inside MOC | Stays on TTS-Projects + `parentId` | Under project parent (list routing skipped when `projectOf` set). |
| Task note without `project:` | File default list only | Orphan — no MOC link. |

Pilot: `fileLinksInTickTick=noLink` — no Obsidian URL in TT.

**Symptom “tasks from one project float”:** usually inbox/next-action lines **without** `parentId`, or task notes with **empty `project:`** — not missing TT UI, missing vault/scheme link.

#### Target mechanisms (PO)

| ID | What | TT effect |
|----|------|-----------|
| **C1** | `parentId` via `resolveForFile` | Subtasks under MOC (Active Zone) — largely **done** |
| **C2** | **`proj/<slug>`** tag from linked MOC path on push | **Shipped 2.0.41** (`contextTags.ts`) |
| **C3** | Fill **`project:`** on task-note template | Abyss + sync agree on MOC |
| **C4** | Optional MOC link in `content` / `noteLink` | Jump to Obs — optional |
| **C6** | `gtdStageVia=tag` | Stage as TT tag, stay on Projects list |

| **D1** | **`note/<slug>`** from task’s file path | **Shipped 2.0.41** |

**Bundle:** C2+D1 done in code; C3 vault template habit; user doc: TT filter `note/log-…` or `proj/…`.

### Done criteria (Phase 2)

- PO records L1+L3 and C2 in `PO_STATUS.md`.  
- Task template: non-empty `project:`.  
- Smoke: Active Zone child has `parentId`; inbox line does not; after C2 both share project tag.

---

## Phase 3 — Subtasks: descriptions, comments, both directions

Use `SYNC_PROJECTS_AND_SUBTASKS.md` taxonomy:

| Kind | Test focus |
|------|------------|
| **A. Project child** (Active Zone) | desc + comment (API after Phase 1) |
| **B. Nested TT tasks** (two `ticktick_id` lines) | same + `pushSubtaskOrder` / `pullSubtaskOrder` |
| **C. Checklist items** (`items[]`, 24-char id) | desc in `description` vs `content` split |
| **D. Abyss subtask without id** | stays `keep`; no false TT child |

### Test matrix (extend CASE-N + §5 of SYNC_PROJECTS)

| ID | Setup | Action | Pass |
|----|--------|--------|------|
| **S1** | Parent + child in Active Zone | Add `- >` on child, sync | TT child has body |
| **S2** | Same | Comment on child (Enter in Abyss) | TT Comments on **child** task (Phase 1) |
| **S3** | Nested under parent in `abyss-active.md` | Reorder lines, sync | TT `sortOrder` matches |
| **S4** | TT reorder children | Sync | Vault order matches |
| **S5** | Checklist item under task | Toggle in TT | Vault checkbox updates |
| **S6** | TT edits child title only | Sync | Vault line updates (rename path) |

**Order:** Finish Phase 1 → run S1–S2 on **тест-синк** + one Active Zone child → then S3–S6.

Record results in `SMOKE_TESTS.md` (same table style as SYNC-L*).

---

## Suggested sequence

```text
1. PO sign-off on Phase 2 model (L1+L3 recommended) + Abyss path preset
2. Implement Phase 1 (TT Comments API) behind setting
3. Execute Phase 3 matrix on pilot vault
4. Release note + BRAT tag
```

---

## References

- `ABYSS_NOTES_ALIGNMENT.md`, `ABYSS_MAPPING.md`
- `SYNC_PROJECTS_AND_SUBTASKS.md`
- `GTD_SYNC_RESEARCH.md` §2.2, `GTD_SYNC_CASES.md`
- `CHANGELOG.md`, `PROJECT_STATE.md`, `PO_STATUS.md`
