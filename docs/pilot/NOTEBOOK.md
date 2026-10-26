# FEAT-NOTEBOOK — product evolution (TickTick Notebook ↔ vault)

**Audience:** PO / analysts. **Size:** **M–L**. **Not** the same as task-body `syncNotes` / NOTE-BODY.

**Issues:** epic [#159](https://github.com/semyon-alekseev-noveo/tt-sync/issues/159); safety [#160](https://github.com/semyon-alekseev-noveo/tt-sync/issues/160) **BUG-NOTEBOOK-NO-DELETE**.

---

## 1. What Notebook is

In TickTick, Notebook items are API objects with `kind: "NOTE"` (often under note-type projects). Same unofficial `batch/task` surface as tasks; **not** Obsidian “note under checkbox” and **not** Comments.

Upstream TickTickSync docs “Notes” = **task body** (`docs-src/configuration/notes.md`). Neither upstream nor this fork sync Notebook today.

---

## 2. Why M–L

| Layer | Size | Notes |
|-------|------|--------|
| HTTP NOTE CRUD / note-projects | S | `kind` already on task/project types |
| Isolate from task sync / Phase 2 delete | M | [#160](https://github.com/semyon-alekseev-noveo/tt-sync/issues/160) first |
| Vault mapping (Abyss-first) | L | Dedicated folder, frontmatter id, vs KB |
| Conflicts / wipe / pilot DoD | M–L | Full markdown; prove×2 |

---

## 3. Slices

1. **Spike (S):** list note-projects; one NOTE CRUD; delta behaviour → `docs/pilot/results/`.
2. **MVP one-way TT→vault** (opt-in folder) — **M**.
3. **Bi-di + scope** — **L**; after PO folder/id rules.

**Default off** on Abyss-first pilots. Do not replace NOTE-BODY / Abyss `- >` / Comments API.

---

## 4. Safety gate (now)

**BUG-NOTEBOOK-NO-DELETE:** Synchronize must not delete Notebook notes from TT (e.g. treat as “missing vault tasks”). Guard landed (`notebookGuard` + `TaskDeletionHandler`); evidence `docs/pilot/results/BUG-NOTEBOOK-NO-DELETE/160-notebook-no-delete.md`. Close [#160](https://github.com/semyon-alekseev-noveo/tt-sync/issues/160) after merge.

---

## 5. Hand-off

| Role | Next |
|------|------|
| PO | Accept epic size; folder/id for MVP when spike done |
| Dev | MVP TT→vault: settings `syncNotebook` / `notebookFolder`; `notebookVault.ts`; case **FEAT-NOTEBOOK-MVP-1** |
| Tester | Live FEAT-NOTEBOOK-MVP-1 on `<pilot-vault>` (opt-in on); re-check no-delete after **2.0.92** |

**References:** #159, #160, `docs/pilot/NOTE-BODY.md`, TECH-API-1.
