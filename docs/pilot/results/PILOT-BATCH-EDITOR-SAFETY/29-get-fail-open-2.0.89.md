# #29 — BUG-COMMENT-GET-FAIL-OPEN case pilot (2.0.89)

## Meta

| Field | Value |
|-------|--------|
| Gate | `PILOT-BATCH-EDITOR-SAFETY` |
| GitHub | [#29](https://github.com/semyon-alekseev-noveo/tt-sync/issues/29) |
| Recorded | 2026-10-24 ~13:11 UTC |
| Build | **2.0.89** on `<pilot-vault>` (Thinkpad-tts-test) |
| Status | **pass** ×2 |

## Inputs

- Unit fix since **2.0.79** (`getTaskComments` → `null`; push skips create/delete)
- `TEST_PLAN.md` **BUG-COMMENT-GET-FAIL-OPEN**

## Evidence

Obsidian CLI eval: temporarily replace `tickTickRestAPI.getTaskComments` with `async () => null`, wrap `addTaskComment` / `deleteTaskComment` to count attempts, run `synchronizeNow()`, restore, re-GET.

### Prove A — `gate-comment-249` (`6ad6f43a…`)

| | |
|--|--|
| Before | `6adcab95…` / `note-l3b-289-125855` |
| After | same id/title |
| `addAttempts` | **0** |
| `delAttempts` | **0** |
| `syncErr` | null |

### Prove B — `wipe-28-fixture` (`6adcade3…`)

| | |
|--|--|
| Before | `6adcadf9…` / `wipe28-ttonly-130843` |
| After | same id/title |
| `addAttempts` | **0** |
| `delAttempts` | **0** |

Raw JSON written under vault `.tickticksync/pilot-29-result.json` / `pilot-29b-result.json` (not committed).

## Conclusion

Failed Comments GET does not re-POST or delete. Close #29.

## Checklist

- [x] Forced `getTaskComments` failure during Synchronize
- [x] Zero add/delete attempts; comment ids unchanged
- [x] Second task prove
- [x] Evidence under `PILOT-BATCH-EDITOR-SAFETY/`
