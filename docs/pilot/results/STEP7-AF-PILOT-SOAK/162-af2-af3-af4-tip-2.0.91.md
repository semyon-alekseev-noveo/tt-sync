# AF-2 / AF-3 / AF-4 live re-soak on tip (**2.0.91**)

## Meta

| Field | Value |
|-------|--------|
| Gate | `STEP7-AF-PILOT-SOAK` / project scheme |
| Recorded | 2026-10-26 ~07:10 UTC |
| Build | **2.0.91** (`tickticksync-abyss` on `<pilot-vault>` Thinkpad-tts-test) |
| Runner | agent (TickTick MCP + Obsidian CLI `tts-sync`) |
| Status | **pass** (AF-2, AF-3, AF-4) |

## Inputs

- `ABYSS_FIRST_CASES.md` AF-2 / AF-3 / AF-4
- TTS-Projects `6ad1abff8f0841315e870da9`
- Tip docs PR for Notebook backlog unrelated to this soak

## Evidence

### AF-2 (TT parent → project note)

1. MCP `create_task` on TTS-Projects: **AF-2 tip parent 140700** id **`6adefc3b8f08f395054076e7`**, tag `tts-test`.
2. `tickticksync-abyss:tts-sync`.

| Check | Result |
|-------|--------|
| Note | `10 Projects/AF-2 tip parent 140700.md` |
| Frontmatter `ticktick_id` | **`6adefc3b8f08f395054076e7`** |
| `## Active Zone` | present |
| Parent as checkbox in that note | **none** |

### AF-3 (Obs project note → TT parent)

1. Created `10 Projects/AF-3 tip obs parent 140800.md` with `system/moc`, `system/project`, `obsidian` — no id.
2. Synchronize → frontmatter **`ticktick_id: 6adefc597a7c111f881492fb`**.
3. TT: title **AF-3 tip obs parent 140800**, projectId TTS-Projects, tags `obsidian`/`project`, **no** `ticktick` tag.

### AF-4 (Active Zone checkbox → subtask)

1. Added `- [ ] AF-4 tip az-subtask 140835 #gtd/next` under Active Zone of AF-3 note.
2. Synchronize → line gained `%%[ticktick_id:: 6adefc787a7c111f881492fc]%%` (plus context tags).
3. TT task **`6adefc787a7c111f881492fc`**: `parentId` = **`6adefc597a7c111f881492fb`**, same TTS-Projects list; line stayed in the note.

## Conclusion

Project scheme AF-2/3/4 still **pass** on **2.0.91** pilot. Notebook safety (#160) and FEAT (#159) are separate backlog.

## Checklist

- [x] AF-2
- [x] AF-3
- [x] AF-4
- [ ] Second independent AF-4 fixture (optional prove×2 — not a bug fix close)
