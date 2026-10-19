# TickTickSync (Abyss fork) — TODO

Process: `DEV_FLOW.md`. Status: `PO_STATUS.md`. Plan: `ABYSS_FIRST_PLAN.md` (Steps 1–8). Cases: `ABYSS_FIRST_CASES.md`.

Release in git is **2.0.47**. This branch does not bump the version. The owner merges and tags.

## Done on this branch (not a release)

- [x] Fail-closed pull and an honest sync notice (BUG-SYNC-SILENT-FAIL, BUG-NOTICE-1).
- [x] Push the parent when only a child comment or description line changes (BUG-COMMENT-INLINE).
- [x] Debounced push of the open note, skipping an unfinished `%%` line (RISK-OPEN-FILE-EDIT).
- [x] Pull treats a TickTick-only API comment as the vault line being behind (BUG-PULL-COMMENT-STALE). One `getTaskById` when cached fields already match; no second fetch in the vault loop.
- [x] Delete `taskCommentMaps` with the task (BUG-COMMENT-MAP-ORPHAN).
- [x] `src/test/synchronizationInner.integration.test.ts` (fake API + fake-indexeddb).

## Not done — needs a person in Obsidian

- [ ] NOTE-L3b, CTX-D2, and the one live gate (AF + DEL + NOTE-L3b) on `<pilot-vault>`. Record results in `ABYSS_FIRST_CASES.md`. Do not fill them in from CI.
- [ ] Confirm Abyss Inbox is **With inbox tag** `#inbox`. Untagged mode still drops a line after `#obsidian`.
- [ ] Revoke the `tp_…` token that was pasted in chat, if it is still valid.

## Still open in code

- [ ] GAP-COMMENT-EDIT: editing a comment deletes and recreates it.
- [ ] RISK-PULL-WINS-LOCAL: a local LWW win can leave the vault line old.
- [ ] RISK-DUAL-STORE, RISK-LARGE-VAULT, TECH-START-1 (startup full pull blocks load).
- [ ] Break the `main` ↔ `services` cycle. Do not start that until the live gate has a recorded result.
- [ ] Redo journal is in the product (`Undo last sync`) and is not soaked on a vault in this branch.

## Archive

`GTD_SYNC_CASES.md`, `GTD_SYNC_RESEARCH.md`, `TT_ABYSS_ROADMAP.md`, `SYNC_PROJECTS_AND_SUBTASKS.md` are history. Do not add requirements there.
