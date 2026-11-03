# 36 — Modal / notice copy review (UX-NOTICE-*)

## Meta
- Date: 2026-11-03
- Trigger: Owner saw `New task created` toasts for tasks that already existed in TickTick (orphan re-attach).
- Cases: `UX-NOTICE-REATTACH`, `UX-NOTICE-MODAL-COPY`
- Status: **unit pass** this PR; pilot **not run**

## Scope
Owner-facing **modals** under `src/modals/` plus high-traffic sync Notices that misstate create/delete/cache.

## Findings → action

| Surface | Before | Verdict | Action this PR |
|---------|--------|---------|----------------|
| Vault push notice (`newTasks.ts`) | Always `New task created` even on orphan re-attach | **Misleading** | Split: created vs `Reattached existing…` |
| Orphaned TickTick Tasks | `database`; `Add to file & db`; `Delete from ticktick`; bare Cancel | **Jargon / unclear** | `local sync cache`; Add to vault & cache; Delete from TickTick; Cancel (leave…) |
| Clean up database | «database» wipe tone | **Jargon** | Clean up local sync cache |
| Permanently delete deleted tasks | Doubled «deleted»; «database» | **Confusing** | Soft-deleted cache rows wording |
| Latest Changes title | `TicTickSync` typo | **Typo** | TickTickSync |
| Check sync cache Notices | «database» | **Jargon** | local sync cache |
| Mass delete guard / Rematch | Already Skip / Rebind / Apply once + wipe hint | OK | No change |
| Task Deletion Confirmation | Cancel vs Confirm Deletion | OK (glossary) | No change |
| Confirm Full Sync / Password | Caller-supplied | OK | No change |
| Duplicate tasks / lists | Clear abort vs apply | OK | No change |
| File location conflict | Move / Delete / Skip | OK | Deferred polish only |
| Recover deleted tasks | Recover paths clear | OK | Deferred: still says «deleted tasks» vs soft-deleted |
| Sync journal | Diagnostic | OK | No change |
| Default project modal | Classic path | Deferred | Abyss path rarely shows it |
| Misc Notices (login, sync done, move file, …) | Operational | Deferred | Batch later if noise |

## Deferred (not blocking)
- Recover / Purge button microcopy still slightly uneven vs Settings purge label.
- `TaskDeletionModal` title capitalization (`Task Deletion Confirmation`).
- Progress / sync-complete Notices volume (noise, not wrong meaning).

## Checklist
- [x] Analyst cases in `ABYSS_FIRST_CASES.md`
- [x] Unit `uxNoticeReattach.test.ts`
- [ ] Owner tip: force one re-attach (strip marker) → toast says Reattached, not Created
- [ ] Owner: open Orphan / Cleanup modals once after Check sync cache (labels match)
