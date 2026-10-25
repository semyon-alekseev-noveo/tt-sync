# #72 — AF-5 `#type/next` → next-action list (2.0.89)

## Meta

| Field | Value |
|-------|--------|
| Gate | `STEP7-AF-PILOT-SOAK` |
| GitHub | [#72](https://github.com/semyon-alekseev-noveo/tt-sync/issues/72) (parent [#20](https://github.com/semyon-alekseev-noveo/tt-sync/issues/20)) |
| Recorded | 2026-10-25 ~03:04 UTC |
| Build | **2.0.89** on `<pilot-vault>` (Thinkpad-tts-test) |
| Status | **pass** (plain Inbox note + `#type/next`) |

## Inputs

- `ABYSS_FIRST_CASES.md` **AF-5**
- Issue [#72](https://github.com/semyon-alekseev-noveo/tt-sync/issues/72)
- `tagListMappings`: `type/next` → TTS-nextAction (`6ad1abfe8f08abb10392fe46`)
- Non-project note: `00 Inbox/abyss-active.md`

## Evidence

1. Appended `- [ ] AF-5 type-next 030400 #type/next #obsidian #inbox #tts-test` under `## Tasks`.
2. Synchronize (`sync-mvn8v2lr-a-7qd5`): `obs->tt` create with `projectId` = TTS-nextAction; vault line gained id **`6add71c54de4201f884a6a4b`**.

| Check | Result |
|-------|--------|
| TT `projectId` | `6ad1abfe8f08abb10392fe46` (TTS-nextAction) |
| Line still in `00 Inbox/abyss-active.md` | **yes** (only that path) |
| `#type/next` still on the line | yes |
| Prior partial (project Active Zone, 2.0.48) | superseded by this plain-inbox pass |

## Conclusion

`#type/next` in an in-scope non-project note lands on the next-action list; the line does not move. Close #72. Next: AF-6 (#73).

## Checklist

- [x] Inbox checkbox with `#type/next` → Synchronize
- [x] On TTS-nextAction; line stayed put
- [x] Evidence under `STEP7-AF-PILOT-SOAK/`
