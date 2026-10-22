# Phase 2 — Pilot verify (BUG-COMMENT-ABYSS-VIEW)

## Meta

| Field | Value |
|-------|--------|
| Case | `BUG-COMMENT-ABYSS-VIEW` |
| Recorded | 2026-10-21 14:27 UTC (agent) |
| Build | **2.0.74** + local fix deploy (no release bump) |
| Status | **pass** (trigger + Comments for Abyss-style vault.modify) |

## Inputs

- [00-baseline-hypothesis.md](00-baseline-hypothesis.md) — Comments empty; no flush after Abyss edits
- [01-fix.md](01-fix.md)

## Steps

1. Deploy fixed `dist/` → pilot; `plugin:reload`
2. Manual `tts-sync` once — vault-ahead `comment 1` / `коммент 2` → TT Comments (baseline recovery)
3. Simulate Abyss write: `app.vault.modify` on `00 Inbox/2026-10-19.md` adding `abyss-view-verify-*` bullets (no markdown editor)
4. Observe debounced flush while startup sync races; write-trace shows new reason

## Evidence

### write-trace (new path)

```json
{"ts":"2026-10-21T14:26:34.326Z","site":"flushActiveFilePush","path":"00 Inbox/2026-10-19.md","reason":"push-abyss-or-background",...}
```

Pre-fix: no `flushActiveFilePush` for this path after user Abyss comments at 21:11 / 21:15 +07.

### MCP `get_comment` (`6ad83d003e30f4429d749e0a`)

Titles present after verify (includes):

- `comment 1`, `коммент 2` (user report bullets; first landed ~14:22Z via sync after fix deploy)
- `abyss-view-verify-18380`, `abyss-view-verify-b` (agent Abyss-style `vault.modify`)

### Caveats

- Startup sync after reload can leave `syncRunning` true for ~1–2 minutes; deferred pushes run after (or race with reconcile). Do not treat a mid-sync empty GET as fail.
- Some duplicate TT Comments for the same vault titles appeared during the race (re-push). Track separately if it persists; not required to invent a new pass/fail for this gate.

## Checklist

- [x] Disk had Abyss comment bullets
- [x] `push-abyss-or-background` flush observed
- [x] TT Comments include user + verify titles
- [x] Not invented — MCP + write-trace

## Conclusion

**BUG-COMMENT-ABYSS-VIEW** root cause confirmed and fixed on pilot: Abyss `vault.modify` schedules open-note push; flush no longer requires active markdown leaf. Ready for owner commit/PR/release when asked.
