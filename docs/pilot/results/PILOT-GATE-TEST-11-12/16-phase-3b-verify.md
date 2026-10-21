# Phase 3b — Re-verify Comments after 2.0.74 POST fix

## Meta

| Field | Value |
|-------|--------|
| Gate | `PILOT-GATE-TEST-11-12` |
| GitHub | [tt-sync #13](https://github.com/semyon-alekseev-noveo/tt-sync/issues/13), [BUG #21](https://github.com/semyon-alekseev-noveo/tt-sync/issues/21) |
| Recorded | 2026-10-21 13:34 UTC (agent) |
| Build | **2.0.74** |
| Status | **pass** (Comments non-empty for gate titles) |

## Inputs

- [15-phase-2b-post-fix.md](15-phase-2b-post-fix.md) — webapp POST body fix
- [13-phase-3-verify.md](13-phase-3-verify.md) — prior fail (Comments empty on 2.0.73)

## Steps

1. Deployed `dist/` → pilot `tickticksync-abyss/`
2. `obsidian plugin:reload id=tickticksync-abyss vault=Thinkpad-tts-test` → **version 2.0.74** enabled
3. Opened `00 Inbox/2026-10-21.md`
4. `obsidian command id=tickticksync-abyss:tts-sync` (Executed)

## Evidence

### TickTick Comments (cookie GET + MCP)

Task `6ad83bc73e30f4429d749e09` / project `6ad1abfe8f08abb10392fe45`:

| Source | n | Titles |
|--------|---|--------|
| Plugin session cookie `GET .../comments` | **2** | `comment 1`, `test-new-verision` |
| MCP `get_comment` | **2** | same |

`createdTime` ≈ **2026-10-21T13:32:50+0000** (matches sync window after reload).

### Caveats

- `write-trace.jsonl` did **not** append a new `6ad83bc…` decision after this sync (last gate line still `vault-comments-ahead` at 13:23 UTC from prior startup). Known stall / incomplete reconcile logging; **Comments API** is the gate criterion and passes.
- Task body `content` was not re-probed in this file; Phase 3 previously confirmed `new` — no vault edits this run.

## Checklist

- [x] Loaded **2.0.74**
- [x] Synchronize triggered
- [x] TT Comments include **`comment 1`** and **`test-new-verision`**
- [x] Not a fake pass — live GET + MCP
- [ ] Optional: confirm write-trace `in-sync` on a clean sync (follow-up if stall persists)

## Conclusion

Gate Comments criterion **pass** on **2.0.74** after BUG-COMMENT-API-POST-500 fix. Prior Phase 3 fail was empty Comments from broken v2 POST body, not reconcile false `in-sync`.
