# Phase 0 — Baseline + hypothesis (Abyss view comment miss)

## Meta

| Field | Value |
|-------|--------|
| Gate / case | `BUG-COMMENT-ABYSS-VIEW` |
| Recorded | 2026-10-21 14:20 UTC (agent) |
| Build on disk | **2.0.74** (`tickticksync-abyss/manifest.json`) |
| Status | **fail** (pre-fix) |

## Inputs

- User report: comment on **task-11-16** from Abyss view; did not leave Abyss; comment not in TickTick.
- Prior gate: POST body fixed in **2.0.74** (`PILOT-GATE-TEST-11-12` / BUG-COMMENT-API-POST-500).

## Evidence

### Plugin version

- Pilot folder `manifest.json` → **2.0.74**
- `main.js` mtime matched recent BRAT/release install before this investigation

### Disk note (`00 Inbox/2026-10-19.md`)

At investigation time:

```text
- [ ] task-11-16 … %%[ticktick_id:: 6ad83d003e30f4429d749e0a]%%
	- > коммент 6
	- 2026-10-21T21:11:41+07:00: comment 1
	- 2026-10-21T21:15:23+07:00: коммент 2
```

Disk mtime **2026-10-21 21:15:23 +07** (= 14:15:23Z).

### TickTick

- `get_task_by_id` `6ad83d003e30f4429d749e0a`: `content` = `коммент 6` (description / body), project `6ad1abfe8f08abb10392fe45`
- MCP `get_comment` → **empty** (no Comments panel entries for `comment 1` / `коммент 2`)

### write-trace / journal / perf

- Last `flushActiveFilePush` for `2026-10-19.md`: **2026-10-21T07:55:42Z** (hours before the Abyss comments)
- After **14:09Z** startup reconcile: decisions for this path are `in-sync`; **no** `vault.modify` / `flushActiveFilePush` for this path around 14:11–14:15Z
- Journal `obs->tt` for `6ad83d…`: task update that set `content` to `коммент 6` at **07:54Z**; **no** comment-add journal toward TickTick for the 21:11 / 21:15 bullets
- Recent `active-file` perf rows: several with `apiCalls: 0` (no comment POST)

## Hypothesis

1. Open-note push is wired only to `workspace.on('editor-change')`.
2. `vault.on('modify')` **returns early** when `getActiveFile()` is that note (avoids keystroke storms) and otherwise only runs `fullTextNewTaskCheck` (new tasks), **not** comment modification / Comments API.
3. Abyss Tasks writes the markdown file without markdown `editor-change`, so **no 5s push** runs while the user stays in Abyss.
4. Not a repeat of BUG-COMMENT-API-POST-500 (no POST attempted).

## Conclusion

Root cause is a **missing sync trigger** for Abyss-view writes, not the Comments POST body. Proceed to code fix under case **BUG-COMMENT-ABYSS-VIEW**.

## Checklist

- [x] Confirm plugin **2.0.74** on pilot
- [x] Confirm disk has new comment bullets
- [x] Confirm TT Comments empty via MCP
- [x] Confirm no recent `flushActiveFilePush` / comment POST for this task
- [x] Hypothesis written
