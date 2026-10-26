# NOTE-BODY-2 live prove ×2 (after #165 pre-merge base)

## Meta

| Field | Value |
|-------|--------|
| Issue | [#152](https://github.com/semyon-alekseev-noveo/tt-sync/issues/152) |
| Recorded | 2026-10-26 ~10:01 UTC |
| Build | tip `abyss-mapping` post #165/#167; tip deploy to `<pilot-vault>` |
| Runner | agent (Obsidian CLI `tts-sync` + TickTick MCP) |
| Status | BODY-2 **pass** ×2 (two sync rounds; fixtures A + B each round) |

## Inputs

- Prior fail: [`02-live-tip.md`](02-live-tip.md)
- Fix: `preMergeNoteBase` (#165); cycle break #167
- Fixtures: `00 Inbox/abyss-active.md` id `6adf040a…4bdf`; `00 Inbox/NOTE-BODY-live-b.md` id `6adf040a…4bde`

## Evidence

### Align (precondition)

MCP reset TT `content` to vault body-1 markers; Synchronize. Titles → `… reset`; `- >` stayed body-1.

### Round 1 — pass ×2

MCP set TT `content` / title:

| Fixture | TT `content` | Vault `- >` after sync |
|---------|--------------|-------------------------|
| A | `note-body-2-prove-A-100104` | `note-body-2-prove-A-100104` |
| B | `note-body-2-prove-B-100104` | `note-body-2-prove-B-100104` |

Titles pulled (`body2prove`). Journal sync `sync-mvp36v68-8-6nbj` (tt→obs line updates).

### Round 2 — pass ×2 (independent markers)

| Fixture | TT `content` | Vault `- >` after sync |
|---------|--------------|-------------------------|
| A | `note-body-2-prove2-A-ROUND2` | `note-body-2-prove2-A-ROUND2` |
| B | `note-body-2-prove2-B-ROUND2` | `note-body-2-prove2-B-ROUND2` |

Titles pulled (`body2r2`).

## Conclusion

NOTE-BODY-2 live-proven twice on tip. Safe to close #152 with BODY-1 / wipe / BODY-2 all live green.

## Checklist

- [x] Tip deploy with #165 fix
- [x] Live BODY-2 round 1 ×2 fixtures
- [x] Live BODY-2 round 2 ×2 fixtures
- [x] Close #152 (after this evidence lands)
