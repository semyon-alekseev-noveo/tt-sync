# TickTickSync (Abyss fork) — TODO

Process: `DEV_FLOW.md`. Status: `PO_STATUS.md`. Plan: `ABYSS_FIRST_PLAN.md` (Steps 1–8). Cases: `ABYSS_FIRST_CASES.md`.

Latest release: track GitHub Releases for `tt-sync` / `manifest.json` on `abyss-mapping` (do not hard-code an old version here). Feature branches do not bump unless the PR is a release bump. The owner merges and tags.

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
- [x] Revoke the `tp_…` token that was pasted in chat ([#32](https://github.com/semyon-alekseev-noveo/tt-sync/issues/32), 2026-10-25).

## Still open in code

- [x] GAP-COMMENT-EDIT: unambiguous comment edit uses PUT and keeps the TickTick id (unit). Live PUT not run. PUT failure still delete+add.
- [ ] RISK-PULL-WINS-LOCAL: deferred. Proposed in `PO_STATUS.md` / `ABYSS_FIRST_CASES.md`. Not coded (local win can still leave the vault line old).
- [ ] RISK-DUAL-STORE: invariant documented (`tasks` vs `files` path). Detection not coded. RISK-LARGE-VAULT remainder and TECH-START-1 stay on [#86](https://github.com/semyon-alekseev-noveo/tt-sync/issues/86).
- [x] Break the `main` ↔ `services` cycle via `PluginContext` (PR #37 / **2.0.77** / epic #31). Remaining extract work → [#66](https://github.com/semyon-alekseev-noveo/tt-sync/issues/66).
- [ ] Redo journal is in the product (`Undo last sync`) and is not soaked on a vault in this branch.

## Archive

`GTD_SYNC_CASES.md`, `GTD_SYNC_RESEARCH.md`, `TT_ABYSS_ROADMAP.md`, `SYNC_PROJECTS_AND_SUBTASKS.md` are history. Do not add requirements there.
