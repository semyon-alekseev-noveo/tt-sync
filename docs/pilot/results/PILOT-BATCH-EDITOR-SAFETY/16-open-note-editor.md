# #16 — Verify open-note / editor buffer

## Meta

| Field | Value |
|-------|--------|
| Issue | https://github.com/semyon-alekseev-noveo/tt-sync/issues/16 |
| Parent | [#15](https://github.com/semyon-alekseev-noveo/tt-sync/issues/15) |
| Recorded | 2026-10-21 14:59 UTC (agent) |
| Build | **2.0.76** (`obsidian plugin` → version 2.0.76 enabled) |
| Status | **partial pass** — rows below run; others **not run** |

## Inputs

- Epic checklist #15 / template `docs/github-issues/11-verify-open-note-editor.md`
- `TEST_PLAN.md` TP-NO-CARET-REWRITE, TP-ACTIVE-PUSH-DURING-SYNC, TP-NO-STALE-VIEW-READ, TP-EMPTY-EDITOR-DISK
- Automated already green: `staleFileWrite`, `activeFilePush`, `tpNoStaleViewRead`, `synchronizationInner` (7 targeted tests)

## Evidence

### TP-EMPTY-EDITOR-DISK — **pass**

1. Disk `00 Inbox/2026-10-20.md` had task `test2-10-04` (prior empty-UI repro path).
2. `workspace:close` then `open` + `obsidian read` → same line visible; `bufferEqDisk: true` on `setViewData` in write-trace.

### TP-NO-CARET-REWRITE — **pass** (CLI edit approximation)

1. Opened `00 Inbox/2026-10-21.md` (`test-10-35` / `6ad8330e7c73b3429dd8cb76`).
2. After prior push, rewrote title with marker `caret-verify-1792594698`; waited ≥3s; **Synchronize**.
3. Disk + `obsidian read` still showed the marker (not rolled back to pre-edit title).

### TP-ACTIVE-PUSH-DURING-SYNC — **pass**

1. Rewrote title to `active-push-1792594730` and immediately ran **Synchronize** (before 5s quiet push).
2. Vault kept the marker through sync.
3. MCP `get_task_by_id` later showed title `test-10-35 active-push-1792594730` (`modifiedTime` 14:58:55Z) — deferred/open-note path landed the edit.

### TP-NO-STALE-VIEW-READ — **pass** (write-trace)

With `debugWriteTrace` already on: `setViewData` for `2026-10-20.md` / `2026-10-21.md` during this session logged `bufferEqDisk: true` and `fileRunActive: false`. No `bufferEqDisk: false` + `fileRunActive: true` view reload observed for these notes.

### Not run

- TP-ABYSS-LOCAL-CHILD-KEEP, TP-TWO-LEAVES, TP-COMMENT-TT-DELETE / TP-EDITOR-* smoke — **not run**

### Side finding (new bug, not #16)

`00 Inbox/2026-10-19.md` under `task-11-16` has **eight** Abyss comment bullets — wall-clock stamp + ISO stamp for the same four texts. Sync repeatedly decides `local-edit` / `hasChanged` for that path. Filed separately (vault-side comment twin bullets).

## Conclusion

Open-note / editor buffer cluster **pass** for the four scoped rows on **2.0.76**. Epic #15 remains open until #17 and #18 are verified.

## Checklist

- [x] Plugin version confirmed **2.0.76**
- [x] TP-EMPTY-EDITOR-DISK
- [x] TP-NO-CARET-REWRITE
- [x] TP-ACTIVE-PUSH-DURING-SYNC
- [x] TP-NO-STALE-VIEW-READ
- [ ] TP-ABYSS-LOCAL-CHILD-KEEP / TP-TWO-LEAVES / extra smokes (**not run**)
- [x] Result file + TEST_PLAN update
