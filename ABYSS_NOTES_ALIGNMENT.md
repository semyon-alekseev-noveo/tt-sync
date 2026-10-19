# Abyss task block ↔ TickTick notes — alignment spec

**Date:** 2026-10-19  
**Branch:** `abyss-mapping`  
**Audience:** PO, testers, implementers  
**Code:** `src/abyssFormat.ts`, `src/taskParser.ts`, `src/services/NewFileMap.ts`, `src/services/TaskModificationDetector.ts`

This document saves the analysis of how **Abyss Tasks** represents a task in a note versus what **TickTickSync** maps to TickTick fields. Use it to design smokes and PO rules before live vault.

**Related:** `ABYSS_MAPPING.md` (step 3 merge), `GTD_SYNC_CASES.md` (CASE-P4, CASE-DEL-4), `GTD_SYNC_RESEARCH.md` (AC-9, R1).

---

## 1. What Abyss shows as one “task”

In the editor, one synced **task** is a **block**, not a single checkbox line:

```text
- [ ] Title #tags 📅 … %%[ticktick_id:: <task-id>]%%     ← parent checkbox (TickTick task)
	- > Description line(s)                              ← Abyss description
	- 2026-10-14 09:00: comment text                     ← Abyss comment (optional timestamp)
	  continuation of comment                            ← continuation (deeper indent)
	- [ ] Checklist item %%<24-char-item-id>%%           ← TickTick checklist item (not a separate task)
	- [ ] Nested subtask #obsidian %%[ticktick_id:: …]%%  ← real TT child task (separate id)
```

Rules (match Abyss `SubItemParser` behaviour, implemented in `abyssFormat.ts`):

| Child line (deeper indent than checkbox) | Role |
|------------------------------------------|------|
| `- >` / `- > text` | **Description** → note body before `Comments:` |
| `- text` (bullet, not checkbox) | **Comment** → after `Comments:` in TT `content` |
| Deeper non-checkbox under comment/desc | **Continuation** |
| `- [ ]` with **24-char** `%%…%%` (not `ticktick_id`) | **Checklist item** → TT `items[]` |
| `- [ ]` with `ticktick_id` | **Subtask** (separate TT task); preserved as `keep` in merge |
| Other nested structure | **keep** — not deleted when TT updates description |

Canonical merge order on pull: **task line → descriptions → checklist items → kept subtasks → comments** (`mergeAbyssBlock`).

---

## 2. Mapping to TickTick

| Abyss (vault) | TickTick field | Notes |
|---------------|----------------|--------|
| Checkbox title + inline tags/dates | `title`, `status`, `tags`, dates | `convertTaskToLine` / `convertLineToTask` |
| `- > …` | `content` (before `Comments:`) | `abyssLinesToNote` / `noteToAbyssLines` |
| `- …` comments | `content` after `Comments:\n` | Same string; round-trip in tests |
| Checklist lines | `items` + often `desc` vs `content` split | `getTaskPayLoad`: if items exist, note text may go to `description` |
| Nested task line | Separate task with `parentId` | Project scheme + hierarchy; not the same as checklist item |

**Settings required for bidirectional body sync:**

- `abyssTasksFormat: true`
- `syncNotes: true` — otherwise `TaskModificationDetector` does not push/pull note changes (`detectNotesModification` returns false when off).

**Out of scope:** Project note **body** (Overview, prose outside Active Zone), KB folders, dashboards — only checkbox blocks under `syncScopeFolders`.

---

## 3. Sync directions (implementation)

| Direction | Path |
|-----------|------|
| Obs → TT | `convertLineToTask` → `taskRecord.taskLines` → `abyssLinesToNote` → `content` / `items` |
| TT → Obs | `convertTaskToLine` + `addNotesToLine` → `noteToAbyssLines`; updates use `mergeAbyssBlock` + `__baseContent` so new local comments are not dropped |
| Hash / change detect | Line hash includes note string from `getNoteString` |

**Known limitations** (`ABYSS_MAPPING.md`):

- Description lines placed *after* subtasks in the file may sit outside the contiguous Abyss region (edge case).
- Editing `.md` on disk without Obsidian does not trigger push (editor buffer / file watcher).

**Known API quirk:** Title-only or body-only TT edits may not bump `modifiedTime` — same class of issue as rename; mitigations exist for title (`vaultLineBehindTask`, `skipPushWhenTickTickRenamedVaultLine`); body may need similar soak.

---

## 4. Proposed smoke matrix (CASE-N)

| ID | Action | Pass when |
|----|--------|-----------|
| N1 | Add `- >` under task in Obs → Sync | TT `content` contains description; subtasks unchanged |
| N2 | Edit description in TT → Sync | `- >` lines updated; `mergeAbyssBlock` keeps alien children |
| N3 | Abyss comment with date → Sync | `Comments:` section in TT `content` |
| N4 | Comment in TT → Sync | `- YYYY-MM-DD …` bullets under task |
| N5 | Toggle checklist item in TT | Matching `- [ ]` / `[x]` line |
| N6 | TT description change + new local comment not yet on TT | Both preserved after sync |

**Automated today:** `abyssFormat.test.ts`, `abyssStep3.test.ts`, `abyssConvertLine.test.ts`. **Live:** N1–N4 not in `SMOKE_TESTS.md` result log yet.

---

## 5. Alignment backlog (PO / engineering)

1. Add **CASE-N1–N6** to `GTD_SYNC_CASES.md` (or link this file as §9).
2. Pilot preset: confirm `syncNotes: true` when testing notes.
3. After smokes pass: document in `PO_STATUS.md` as “Step 3b — notes/comments”.
4. Optional: extend TT-ahead detection for `content` parity (mirror 2.0.36 title work).

---

## References

- `CHANGELOG.md`
- `PROJECT_STATE.md`
- `SMOKE_TESTS.md`
