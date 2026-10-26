# FEAT-NOTEBOOK-MVP-1 live — TT→vault folder

## Meta

| Field | Value |
|-------|--------|
| Issue | [#159](https://github.com/semyon-alekseev-noveo/tt-sync/issues/159) |
| Code | #166 (+ cycle fix #167) |
| Recorded | 2026-10-26 ~10:12 UTC |
| Build | tip `abyss-mapping` `468d7a5`+ tip deploy; `syncNotebook=true` for prove |
| Runner | agent (Obsidian CLI + TickTick MCP) |
| Status | FEAT-NOTEBOOK-MVP-1 **pass** ×2 (create A/B; update A/B) |

## Inputs

- `docs/pilot/NOTEBOOK.md` slice 2 (MVP one-way)
- Note project `TTS-Notebook-Safety` `6adeff608f08dc411431aff4`
- Pilot setting: `notebookFolder` = `TickTick Notebook` (opt-in on for prove; restored **off** after)

## Evidence

### Create (startup / first sync after enable) — pass ×2

| Fixture | TT id | Vault file | Body |
|---------|-------|------------|------|
| A | `6adf2649…2467` | `TickTick Notebook/FEAT-NOTEBOOK MVP A 100650 (14372467).md` | `notebook-mvp-body-A-100650` |
| B | `6adf264a…6fa0` | `TickTick Notebook/FEAT-NOTEBOOK MVP B 100650 (1c1a6fa0).md` | `notebook-mvp-body-B-100650` |

Frontmatter: `ticktick_id` + `ticktick_kind: NOTE`. Spike `…e3aa` also written with updated body. Prior #160 NOTES A/B/C appeared in the same folder (expected with opt-in on).

No checkbox lines for A/B ids outside the Notebook folder.

### Update (second Synchronize) — pass ×2

MCP set content to `notebook-mvp-body-*-UPDATED-101220`; `tts-sync`; both files rewrote to match.

## Conclusion

MVP TT→vault folder live-proven (create + update, two fixtures each). Bi-di / scope still out of scope for #159 epic remainder. Pilot `syncNotebook` restored to **false** after prove.

## Checklist

- [x] Enable `syncNotebook` on tip
- [x] Create path ×2
- [x] Update path ×2
- [x] No checkbox leak
- [x] Restore opt-in off on pilot
