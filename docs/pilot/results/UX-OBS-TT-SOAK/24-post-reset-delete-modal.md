# 24 — Post-Reset delete modal (orphan vault lines)

| Field | Value |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Phase | 24 |
| Case | **BUG-RESET-CACHE-DELETE** (alias BUG-RESET-ORPHAN-VAULT-DELETE; companion to **UX-RESET-1**) |
| Vault | Thinkpad-tts-test |
| Status | **fail** observed on tip before fix; fix merged #187; pilot re-prove → [`25-reset-cache-delete-prove.md`](25-reset-cache-delete-prove.md) |

## Owner action (immediate)

**Cancel** the modal — do **not** Confirm Deletion.

Confirming would strip vault checkbox lines (e.g. DON-253 «Merge MR, run deploy_prod») that still hold pre-wipe `ticktick_id` markers. Those ids are gone from TickTick after account wipe/restore; the lines are notes, not confirmed orphans.

## Inputs

- Owner screenshot after Reset → Synchronize: modal «Task(s) will be deleted because: task not found in local cache»; toast «Task not found. It will be removed from the file.»
- File: `30 Tasks/301 Noveo_tasks/DON-253.md` line with `%%[ticktick_id:: 6ad3324d80c8b04a254e8109]%%` (and siblings tagged `#obsidian #inbox`).
- Settings peek: `syncScopeFolders` includes `30 Tasks/`; `syncedLists` has Inbox + stage lists; note is in push scope.
- TickTick MCP: `get_task_by_id(6ad3324d80c8b04a254e8109)` → `resource_not_found` (pre-wipe id).

## Root cause

1. Pre-pull push (`pushLocalEditsFirst`) calls `checkFileForModifications` **without** a pending-deletions queue.
2. Scan path: not in Dexie → `getTaskById` 404 → toast + `deleteTaskFromSpecificFile(..., confirm)` with hardcoded reason «task not found in local cache.»
3. **EMPTY-SIDE-GUARD / empty-Dexie** only blocks planned *task* deletions toward TickTick/Dexie — it does **not** cover this vault-text strip.
4. After **Reset local sync database**, Dexie is empty and vault still holds old markers → Synchronize proposes vault-line deletes before re-link.

## Expected after fix

- Bootstrap Synchronize that starts with empty Dexie and/or `checkPoint` 0 sets sticky `skipOrphanVaultLineDeletes` for the whole run.
- Unknown remote ids leave vault markers alone (log warn); no toast / no modal for that path.
- If a healthy-Dexie orphan modal still appears later: **Cancel**; re-link via Synchronize after TT restore, or manually clear dead markers when intentional.

## Evidence

- Unit: `src/test/bugResetCacheDelete.test.ts`, `shouldSkipOrphanVaultLineDelete` in `massDeleteGuard.test.ts`.
- Pilot live re-prove after install: see [`25-reset-cache-delete-prove.md`](25-reset-cache-delete-prove.md) (install done; Reset-path prove owner-gated).

## Checklist

- [x] Owner told Cancel immediately
- [x] Root cause documented
- [x] Case + unit test + fail-closed code
- [x] Fix merged #187 + tip installed (phase 25)
- [ ] Pilot prove ×2 after Reset (owner; phase 25 checklist)
