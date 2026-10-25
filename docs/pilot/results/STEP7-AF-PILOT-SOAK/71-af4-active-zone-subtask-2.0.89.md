# #71 — AF-4 Active Zone checkbox → TT subtask (2.0.89)

## Meta

| Field | Value |
|-------|--------|
| Gate | `STEP7-AF-PILOT-SOAK` |
| GitHub | [#71](https://github.com/semyon-alekseev-noveo/tt-sync/issues/71) (parent [#20](https://github.com/semyon-alekseev-noveo/tt-sync/issues/20)) |
| Recorded | 2026-10-25 ~02:59 UTC |
| Build | **2.0.89** on `<pilot-vault>` (Thinkpad-tts-test) |
| Status | **pass** (CLI Active Zone checkbox + sync) |

## Inputs

- `ABYSS_FIRST_CASES.md` **AF-4**
- Issue [#71](https://github.com/semyon-alekseev-noveo/tt-sync/issues/71)
- Host note: `10 Projects/AF-3 pilot obs parent 142000.md` (parent `6adcbea84de4201f884a6a4a` from AF-3)

## Evidence

1. Appended under `## Active Zone`: `- [ ] AF-4 az-subtask 025900 #obsidian #tts-test` (no id yet).
2. Open-note / Synchronize path created TT task **`6add70a0b51bd01f880ca10c`** with `parentId` = note parent; vault line gained the marker (journal `edit-mvn8oxfj…` / `obs->tt` create).

| Check | Result |
|-------|--------|
| TT `parentId` | `6adcbea84de4201f884a6a4a` (project parent) |
| TT `projectId` | TTS-Projects |
| Line still in same note under Active Zone | **yes** (line 19); only that path contains the marker |
| Sibling / comment shuffle | N/A — single Active Zone checkbox in this note |

## Conclusion

Active Zone checkbox becomes a subtask of the note’s parent and stays in the note. Close #71. Next: AF-5 (#72).

## Checklist

- [x] Checkbox under `## Active Zone` → sync
- [x] Subtask of note parent; line stays put
- [x] Evidence under `STEP7-AF-PILOT-SOAK/`
