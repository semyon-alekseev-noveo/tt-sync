# 45 — TT orphan cleanup + create-path audit

| Field | Value |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Phase | 45 (cleanup + prevention audit) |
| Cases | `BUG-TT-CREATE-PATH-BYPASS` (code); manual TT delete (owner-authorized) |
| Status | Cleanup **done**; create-path units **pass**; ProjectScheme live prove **not run** |
| Related | #279 / #280 / #281 create prevention; #276 Deduplicate **won't-fix** (closed) |

## Meta

| Field | Value |
|-------|--------|
| Vault | Thinkpad-tts-test (pilot) |
| Note | `10 Projects/PKM - journaling.md` |
| Parent | `6ae17a048f0871a7dbb8c8ca` |
| Tip base | `8c9318c` (after #280) |

## Part 1 — TT orphan cleanup (owner «убери»)

Vault keepers (markers in note):

| Title | Keeper id |
|-------|-----------|
| Подумать над механикой | `6aeae53f64633723f94008aa` |
| Подумать над шаблонами | `6ae82058d07c7a23f9eed592` |
| Подумать над интеграцией с другими механиками обсидиан | `6ae82059d07c7a23f9eed593` |

Deleted via TickTick MCP `delete_task` (project `6ae17a048f0871a7dbb8c89a`) — verified `get_task_by_id` → not found:

| Title | Deleted id |
|-------|------------|
| Подумать над механикой | `6ae82055d07c7a23f9eed591` |
| Подумать над механикой | `6ae9baf1eec3d823f964606e` |
| Подумать над механикой | `6aeafcb083c55223f9dcb7a2` |
| Подумать над интеграцией… | `6ae42397d07c7a23f9eed588` |

Already gone / not deleted: `…eed586`, `…eed587` (stale parent `childIds` only). Unrelated children not touched. Шаблоны had a single live id (= keeper).

## Part 2 — Create-path audit

| Path | Finding | Action |
|------|---------|--------|
| `addNewTask` / `checkFileForNewTasks` / `lineSettledCheck` | Primary unmarked create | Already `resolveSameTitleCreate` (#279/#280) |
| `ProjectSchemeService` `createParent` | Note without `ticktick_id` could invent a second same-title project parent | **Fix:** `decideCreateOrReattachParent` → reattach / skip |
| `SyncMan.syncTickTickToObsidian` recreate loop | Unguarded `createTask`; caller commented out | **Fix:** remove `createTask`; warn only |
| Confirm InsertLine / Rematch | Vault markers only | No TT create (N/A) |
| `redo` wrap | Journal wrapper | Not an entrypoint |

#276 Deduplicate: **won't-fix** — owner closed after prevention + this cleanup; no Sync discrepancies Deduplicate UI.

## Checklist

- [x] Owner-authorized TT deletes vs vault keepers
- [x] AF `BUG-TT-CREATE-PATH-BYPASS`
- [x] Units for inventory + ProjectScheme reattach/skip
- [x] TEST_PLAN / CHANGELOG
- [ ] Pilot prove ProjectScheme reattach ×2 (**not run**)
