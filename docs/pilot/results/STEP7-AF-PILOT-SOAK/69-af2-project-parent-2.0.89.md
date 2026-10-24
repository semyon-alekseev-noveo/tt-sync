# #69 — AF-2 TickTick project parent → note (2.0.89)

## Meta

| Field | Value |
|-------|--------|
| Gate | `STEP7-AF-PILOT-SOAK` |
| GitHub | [#69](https://github.com/semyon-alekseev-noveo/tt-sync/issues/69) (parent [#20](https://github.com/semyon-alekseev-noveo/tt-sync/issues/20)) |
| Recorded | 2026-10-24 ~14:00 UTC |
| Build | **2.0.89** on `<pilot-vault>` (Thinkpad-tts-test) |
| Status | **pass** (MCP create parent + Synchronize) |

## Inputs

- `ABYSS_FIRST_CASES.md` **AF-2**
- Issue [#69](https://github.com/semyon-alekseev-noveo/tt-sync/issues/69)
- `projectSchemeEnabled: true`, `projectsFolder: 10 Projects`, `projectsListId` = TTS-Projects

## Evidence

1. Created TickTick parent on TTS-Projects (`6ad1abff8f0841315e870da9`): title **`AF-2 pilot parent 135930`**, id **`6adcb9f58f08408070ddfd06`**, tag `tts-test`.
2. Ran `tickticksync-abyss:tts-sync` (manual Synchronize). Journal sync `sync-mvmguluu-1-bp4i`.

| Check | Result |
|-------|--------|
| Note path | `10 Projects/AF-2 pilot parent 135930.md` |
| Frontmatter `ticktick_id` | `6adcb9f58f08408070ddfd06` |
| Tags include `system/project` | yes |
| `## Active Zone` section | present |
| Parent as checkbox inside that note | **none** (`- [ ]` lines: 0) |
| TT parent title unchanged | **AF-2 pilot parent 135930** (same id; no duplicate parent) |
| Journal | `tt->obs` `file` `op:create` for that path |

## Conclusion

TT project parent becomes a project note under `10 Projects/` with `## Active Zone` and is not mirrored as a checkbox in that note. Close #69. Next: AF-3 (#70).

## Checklist

- [x] Parent on TTS-Projects → Synchronize
- [x] Note under `10 Projects/` with Active Zone; not a checkbox line
- [x] TT parent title kept
- [x] Evidence under `STEP7-AF-PILOT-SOAK/`
