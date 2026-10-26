# NOTE-BODY live on tip (after #158 wipe + #163 sync fix)

## Meta

| Field | Value |
|-------|--------|
| Issue | [#152](https://github.com/semyon-alekseev-noveo/tt-sync/issues/152) |
| Recorded | 2026-10-26 ~08:50 UTC |
| Build | tip `abyss-mapping` (post #162/#163); pilot plugin tip deploy |
| Runner | agent (Obsidian CLI + TickTick MCP) |
| Status | BODY-1 **pass** ×2; BODY-2 **fail**; BUG-NOTE-BODY-WIPE **pass** ×2 |

## Inputs

- `docs/pilot/NOTE-BODY.md` §5 (Abyss `- >` ↔ body)
- Fixtures under `<pilot-vault>/00 Inbox/`

## Evidence

### NOTE-BODY-1 (Obs→TT) — pass ×2

| Fixture | Vault | TT id | TT `content` |
|---------|-------|-------|----------------|
| A | `abyss-active.md` `- > note-body-1-marker-143100` | `6adf040a…4bdf` | `note-body-1-marker-143100` |
| B | `NOTE-BODY-live-b.md` `- > note-body-1-marker-B-143600` | `6adf040a…4bde` | `note-body-1-marker-B-143600` |

Created via vault checkbox + `- >` then Synchronize (earlier on 2.0.91; still present on tip).

### NOTE-BODY-2 (TT→Obs) — fail ×2

MCP set TT `content` to `note-body-2-from-tt-*-154850` and bumped titles with `body2`. Full Synchronize (`scheduledSynchronization(true)`):

- Titles updated in vault (**pass** for title pull).
- Abyss `- >` lines **unchanged** (still `note-body-1-marker…`).

So TT→vault body rewrite for Abyss description lines is **not** live-proven. Keep #152 open for BODY-2 implement / further diagnosis (`vaultLineBehind` local-edit / merge path likely).

### BUG-NOTE-BODY-WIPE — pass ×2

After title-only / mixed syncs, TT `content` on A/B remained the non-empty body text (not cleared to empty). Two fixtures.

## Conclusion

Ship BODY-1 + wipe as live green. BODY-2 needs a code follow-up before closing #152.

## Checklist

- [x] Live BODY-1 ×2
- [ ] Live BODY-2 (fail recorded)
- [x] Wipe ×2
- [ ] Close #152 (blocked on BODY-2)
