# Phase 0 — Baseline evidence

## Meta

| Field | Value |
|-------|--------|
| Gate | `PILOT-GATE-TEST-11-12` |
| GitHub | [tt-sync #10](https://github.com/semyon-alekseev-noveo/tt-sync/issues/10) |
| Recorded | 2026-10-21 UTC (agent) |
| Build | **2.0.72** (pilot `manifest.json` = repo `manifest.json`) |
| Status | **open** — optional fresh manual **Synchronize** + console not done |

## Inputs

- None (first phase).

## Evidence

### Settings

- `syncNotes`, `abyssTasksFormat`, `syncAbyssCommentsViaApi`: **true**
- `syncScopeFolders` includes `00 Inbox/`

### Disk (`00 Inbox/2026-10-21.md`)

- Task `test-11-12` → `6ad83bc73e30f4429d749e09`
- `- > new` (description / task body)
- Comment bullets: `comment 1`, `test-new-verision`

### TickTick Comments API

- MCP `get_comment` (project `6ad1abfe8f08abb10392fe45`, task `6ad83bc…`): **`comments: []`**

### Last `write-trace` (vaultReconcile, this task)

```json
{"ts":"2026-10-21T12:13:22.241Z","path":"00 Inbox/2026-10-21.md","trigger":"startup","reason":"in-sync","taskIds":["6ad83bc73e30f4429d749e09"],"bufferEqDisk":true}
```

Earlier same day for same task: `vault-comments-ahead` (≈10:19), `behindComments` (≈11:11–11:12), `hasChanged` (≈11:51) → then `in-sync`.

### `perf-pilot.log` (latest full syncs)

| trigger | addTaskComment | getTaskComments | vaultReconcile ms | total ms |
|---------|----------------|-----------------|-------------------|----------|
| manual | 27 | 7 | ~21085 | ~45990 |
| startup (fullSync) | 27 | 7 | ~27726 | ~45275 |

### Journal (`2026-10-21.jsonl`, task `6ad83bc…`)

- `obs->tt` task updates (`content: new`); **no** `kind: comment` / Comments API lines for this task.

### Obsidian console

- **Not captured** (no plugin log on disk).

## Conclusion

Deploy/version **OK**. Gate **failing**: plugin ends on **`in-sync`** while TickTick Comments are **empty**. Global sync shows many `addTaskComment` calls, but this task has no comment journal entries → push likely **not applied** to `6ad83bc…` or **no-op** with stale Dexie state.

## Checklist

- [x] Plugin version matches pilot folder **2.0.72**
- [x] Settings for Comments API / Abyss format
- [x] Disk bullets present
- [ ] One dedicated **manual** Synchronize after reload (last traces are **startup** ~12:13 UTC)
- [x] write-trace + perf attached above
- [x] TT Comments empty (MCP)
- [ ] Console: `Add Task Comment: response had no comment id` — **not run**
