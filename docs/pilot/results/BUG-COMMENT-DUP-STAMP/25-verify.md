# Phase 1 — Pilot verify (BUG-COMMENT-DUP-STAMP)

## Meta

| Field | Value |
|-------|--------|
| Case | `BUG-COMMENT-DUP-STAMP` |
| Issue | https://github.com/semyon-alekseev-noveo/tt-sync/issues/25 |
| Recorded | 2026-10-21 14:55 UTC (agent) |
| Build | **2.0.76** (deployed + `plugin:reload`) |
| Status | **pass** |

## Inputs

- [25-fix.md](25-fix.md)
- Pre-fix report: COMMENTS **8** for 4 vault threads (stamped+plain pairs) on `task-11-16`

## Steps

1. Deploy `dist/` → `<pilot-vault>/.obsidian/plugins/tickticksync-abyss/`
2. `obsidian plugin:reload id=tickticksync-abyss vault=Thinkpad-tts-test` → version **2.0.76** enabled
3. `obsidian command id=tickticksync-abyss:tts-sync vault=Thinkpad-tts-test` → Executed
4. MCP `get_comment` for task `6ad83d003e30f4429d749e0a` / project `6ad1abfe8f08abb10392fe45`

## Evidence

### MCP comments after Synchronize

| id (suffix) | title |
|-------------|--------|
| …f0b0 | `comment 1` |
| …f0b1 | `коммент 2` |
| …762b | `abyss-view-verify-18380` |
| …762c | `abyss-view-verify-b` |

Count **4** — one plain title per vault thread. **No** `YYYY-MM-DD HH:MM: …` stamped twins.

Task `modifiedTime` advanced to `2026-10-21T14:54:44+0000` after sync.

## Conclusion

**BUG-COMMENT-DUP-STAMP** pass on pilot with **2.0.76**: stamped+plain pairs collapsed; Comments match vault threads by normalized key.

## Checklist

- [x] Deploy **2.0.76** to pilot; reload
- [x] Synchronize on note with `task-11-16`
- [x] TT Comments: one entry per vault thread (no stamped+plain pair)
- [ ] Optional new Abyss comment (not required for close)
