# Sync: projects, Active Zone children, and subtasks

**Date:** 2026-10-19  
**Branch:** `abyss-mapping`  
**Cases:** `GTD_SYNC_CASES.md` **CASE-P1–P6**, **CASE-T*** for list routing  
**Code:** `src/projectScheme.ts`, `src/services/ProjectSchemeService.ts`, `src/services/VaultSyncCoordinator.ts`, `src/subtaskOrder.ts`

---

## 1. Projects (MOC ↔ TickTick parent)

### User model

| Obsidian | TickTick |
|----------|----------|
| Note in `10 Projects/` with `system/project` (+ template: `## Active Zone`, `ticktick_id` in frontmatter) | **Parent** task on **projects list** (`TTS-Projects` in pilot), tags `project` / `obsidian` |
| Parent is **not** a checkbox line in the note | `isParentTask` → never written as a task line in vault sync |

### When it runs

At the **start** of `VaultSyncCoordinator.syncVaultWithDatabase()`:

```text
scheme.run(tasks)  →  ProjectSchemeService
```

Then per-task routing: children with `parentId` = project parent id → **project note path** (`noteForParent`), not flat list file.

### Directions

| ID | Direction | Behaviour |
|----|-----------|-----------|
| **P1** | TT → Obs | New parent on projects list → create/adopt project note (`planProjects`, template) |
| **P2** | Obs → TT | New project note → create parent on projects list; link `ticktick_id` |
| **P3** | Both | `status` in frontmatter ↔ parent completed (`projectSnapshot` anti flip-flop) |
| **P5** | Guard | Only scheme + `syncedLists` + sync tag scope — no mass-adopt of legacy notes |
| **P6** | Guard | No duplicate parent checkbox in note (`stripProjectParentDuplicateLines`, `repairProjectNoteTasks`) |

### Push context (critical for children)

Before any line push, `projectScheme.ensurePushContext()` must know `listId` for projects list. Without it, Active Zone lines can wrongly land on **inbox** list (documented fix in 2.0.29+).

**Settings:** `projectSchemeEnabled`, `projectsFolder`, `projectsListName` / `projectsListId`, projects list in `syncedLists`.

---

## 2. Tasks inside a project (Active Zone)

### User model

| Obsidian | TickTick |
|----------|----------|
| `- [ ] …` under `## Active Zone` in project note (or in a note with `project:` → that MOC) | **Child task** on **TTS-Projects** with `parentId` = parent task id |
| GTD tag `#type/next` on same line | May **also** move/list-route to `TTS-nextAction` — **different** from pure project child (CASE-T2 vs P4) |

### Implementation sketch

1. **Push:** `convertLineToTask` + `resolveForFile(path)` → sets `parentId`, `projectId` = projects list.
2. **Pull:** Vault sync writes/updates line in **Active Zone** of linked note, not in `30 Tasks/TickTick/TTS-Projects.md` stub.
3. **Filter:** `VaultSyncCoordinator` skips `isParentTask`; uses `actualFile` / `presentAt` so line stays in place (Abyss-first).

### What to verify (pilot)

- **LOGIC-8 / LOGIC-9:** `test 3` / `test 4` as subtasks of Phase C parent on TTS-Projects.
- **CASE-P4:** New Active Zone line → subtask under parent, not orphan on nextAction.
- **R7 / R8:** Rename TT ↔ Obs on project child lines.

---

## 3. Subtasks — three different mechanisms

Do not confuse them:

| Kind | Vault shape | TickTick | Sync mechanism |
|------|-------------|----------|----------------|
| **A. Project child** | Checkbox in Active Zone (or linked task note) | Child **task** `parentId` = project parent | Project scheme + normal task push/pull |
| **B. Nested task hierarchy** | Checkbox **one indent level** under another checkbox (both have `ticktick_id`) | Child task under parent task | `parentId` on push; vault nesting in `NewFileMap` |
| **C. TickTick checklist items** | `- [ ] item %%24hex%%` under task (Abyss) | `items[]` on same task | `getTaskPayLoad` / items API — **not** a separate task |
| **D. Abyss “subtask” without id** | Nested checkbox without `ticktick_id` | Not synced as TT task | Stays as `keep` in `mergeAbyssBlock` until promoted to real task |

### Sibling **order** (B and A at same parent)

**Not** the same as creating parent/child links.

| Phase | Direction | Code |
|-------|-----------|------|
| Before pull | Obs → TT | `pushSubtaskOrder(path)` — line order under parent → `sortOrder` via API |
| After vault sync | TT → Obs | `pullSubtaskOrder(skip)` — reorder contiguous sibling blocks to match TT `sortOrder` |

**Scope:** Direct children only (one tab deeper than parent), contiguous siblings; code blocks ignored (`childBlocks` in `subtaskOrder.ts`).

**Skip pull** for files in `locallyEdited` set during same sync cycle (avoid fighting user edits).

---

## 4. Full sync pipeline (order)

```text
pushLocalEditsFirst (per scoped file)
  → pushSubtaskOrder (sibling order out)
pull TickTick → Dexie
ProjectScheme.run (notes ↔ parents)
VaultSyncCoordinator (lines in notes)
pullSubtaskOrder (sibling order in)
syncFiles (project note bodies / metadata)
```

---

## 5. Recommended test order (after rename smokes)

1. **CASE-P2** — new project note → parent on TTS-Projects.  
2. **CASE-P4** — Active Zone child → subtask.  
3. **CASE-P3** — complete parent one side → other side.  
4. **CASE-P6** — no duplicate parent checkbox.  
5. **Subtask order** — two siblings under same parent, reorder in Obs → Sync → TT order; reorder in TT → Sync → vault order.  
6. **CASE-T2** — same line with `#type/next` still list-routes correctly vs P4.

---

## References

- `ABYSS_NOTES_ALIGNMENT.md` — descriptions/comments (not project MOC body)
- `ABYSS_FIRST_PLAN.md` Step 2 (project scheme)
- `SMOKE_TESTS.md`, `CHANGELOG.md`
