# BUG-SYNC-OFF-REACTIVE-CREATE — Sync off still created TT task

## Meta

| Field | Value |
|-------|-------|
| Case | `BUG-SYNC-OFF-REACTIVE-CREATE` |
| Issue | [#295](https://github.com/semyon-alekseev-noveo/tt-sync/issues/295) |
| Related | `UX-SET-SYNC-MASTER-OFF` [#287](https://github.com/semyon-alekseev-noveo/tt-sync/issues/287) / [#288](https://github.com/semyon-alekseev-noveo/tt-sync/pull/288) |
| Vault | Thinkpad-tts-test (pilot) |
| Status | **live fail** observed 2026-11-06; unit fix in PR; tip re-prove **not run** |

## Inputs

- Owner: Sync off, but task «создалась» in TickTick (DON-253).
- Toasts: `#status/cancelled` conflict dropped; `Task 6aedaecd83c55223f9dcb7ae updated: tags`.
- Pilot `data.json`: `syncEnabled=false`, interval `0` (no secrets logged).

## Evidence

- MCP `get_task_by_id` `6aedaecd83c55223f9dcb7ae`: **create** `2026-11-06T10:41:22Z`, modify `10:41:58Z` (not a pre-existing id).
- Journal `.tickticksync/journal/2026-11-06.jsonl`: `op:create` then `op:update` with `syncId` prefix **`edit-`** (reactive redo session — **not** `sync-` / manual Synchronize).
- Tip wrappers already had `isAutomaticSyncEnabled`; detector `addNewTask` / line modify did not seal; disk vs memory lag possible under LiveSync.

## Conclusion

**Bug** (not expected manual Sync). Owner toast looked like update-only; timeline is create then tag push while Sync off.

## Checklist

- [x] AF case + unit named by ID
- [ ] Tip install after merge
- [ ] Live prove ×2 Sync off → no reactive create/update
- [ ] Live: Synchronize while off still works
