# Phase 3 — Pilot verify

## Meta

| Field | Value |
|-------|--------|
| Gate | `PILOT-GATE-TEST-11-12` |
| GitHub | [tt-sync #13](https://github.com/semyon-alekseev-noveo/tt-sync/issues/13) |
| Recorded | 2026-10-21 13:12 UTC (agent, Obsidian CLI); corroboration 13:22 UTC |
| Build | **2.0.73** |
| Status | **fail** (gate acceptance not met; issues left open) |

## Inputs

- [12-phase-2-fix.md](12-phase-2-fix.md)
- [11-phase-1-hypothesis.md](11-phase-1-hypothesis.md)

## Evidence

### Reload / version

| Step | Result |
|------|--------|
| Deploy already on disk | `<pilot-vault>/.obsidian/plugins/tickticksync-abyss/manifest.json` = **2.0.73** |
| Reload (primary) | `obsidian plugin:reload id=tickticksync-abyss vault=Thinkpad-tts-test` (exit 0) |
| Reload (also used) | `obsidian command id=app:reload vault=Thinkpad-tts-test` → `Executed: app:reload` |
| Loaded version | `obsidian plugin id=tickticksync-abyss vault=Thinkpad-tts-test` → **version 2.0.73**, enabled |
| Settings | `syncNotes` / `abyssTasksFormat` / `syncAbyssCommentsViaApi` = true; `data.json` version **2.0.73** |

### Synchronize

| Step | Result |
|------|--------|
| Open note | `obsidian open path="00 Inbox/2026-10-21.md" vault=Thinkpad-tts-test` |
| Command | `obsidian command id=tickticksync-abyss:tts-sync vault=Thinkpad-tts-test` → `Executed: tickticksync-abyss:tts-sync` |
| Note | `plugin.syncRunning` can stick `true` after reload (known); completion judged by write-trace, not the flag. Cleared once via `eval` then re-ran sync. |
| Completion | Several runs reached vaultReconcile decisions then **stalled** (no new `perf-pilot.log` line after ~13:00 UTC). Last decision for this task still written; full sync notice/perf often missing — treat as partial sync run for comment-push purposes. |

### Disk (still ahead)

Relative path: `00 Inbox/2026-10-21.md`

- Task `test-11-12` / `6ad83bc73e30f4429d749e09`
- `- > new`
- Comment bullets: `comment 1`, `test-new-verision`

### write-trace (this task, after reload)

| ts (UTC) | trigger | reason |
|----------|---------|--------|
| 2026-10-21T13:06:03.396Z | manual | **`vault-comments-ahead`** |
| 2026-10-21T13:06:20.401Z | manual | **`vault-comments-ahead`** |
| 2026-10-21T13:10:48.527Z | startup | **`vault-comments-ahead`** |
| 2026-10-21T13:18:53.076Z | manual | **`vault-comments-ahead`** |

Phase 2 regression check: reason is **not** `in-sync` while vault bullets remain (coordinator guard holds). Same pattern on a second agent pass after `app:reload`.

### TickTick Comments API

- Via plugin in Obsidian (`tickTickRestAPI.getTaskComments` → wrote probe then deleted): **`n: 0`, `titles: []`** at 2026-10-21T13:12:29Z
- MCP `get_comment` (project `6ad1abfe8f08abb10392fe45`, task `6ad83bc…`): empty / no comment rows (consistent with plugin probe)
- Direct GET `…/project/{id}/task/{id}/comments` with plugin cookie auth (2026-10-21 13:22 UTC): **HTTP 200 `[]`**
- MCP `get_task_by_id`: title `test-11-12`, **`content`: `new`** (description OK)

### Journal

- No new `kind: comment` / Comments API journal lines for `6ad83bc…` after 13:00 UTC (only older task/file rows).

## Conclusion

**Gate fail.** Build **2.0.73** is loaded and Synchronize was triggered; reconcile correctly reports **`vault-comments-ahead`** (no false `in-sync`), and task body stays `new`. TickTick **Comments remain empty** — `comment 1` / `test-new-verision` were **not** pushed. Do **not** close #12/#13/#14. Next: new hypothesis (why `vaultOnly` / POST still empty while vault-ahead; optional: why sync stalls after vaultReconcile) before another version bump.

## Checklist

- [x] Reload Obsidian / plugin; confirm version **2.0.73**
- [x] One **Synchronize** (CLI `tts-sync`; no task-line edits during run)
- [ ] TickTick Comments show `comment 1` and `test-new-verision` — **FAIL** (empty)
- [x] Task body still `new`
- [x] `ABYSS_FIRST_CASES.md` results log updated (**fail**, with evidence)
- [x] `TEST_PLAN.md` pilot row updated (**fail**)
- [ ] Close this issue and the epic — **not done** (gate failed)
- [x] Fail path: leave open; do not bump version without new hypothesis
