# #74 — AF-7 TT list move → stage tag (2.0.89)

## Meta

| Field | Value |
|-------|--------|
| Gate | `STEP7-AF-PILOT-SOAK` |
| GitHub | [#74](https://github.com/semyon-alekseev-noveo/tt-sync/issues/74) (parent [#20](https://github.com/semyon-alekseev-noveo/tt-sync/issues/20)) |
| Recorded | 2026-10-25 ~03:46–03:48 UTC |
| Build | **2.0.89** on `<pilot-vault>` (Thinkpad-tts-test) |
| Status | **pass** |

## Inputs

- `ABYSS_FIRST_CASES.md` **AF-7**
- Issue [#74](https://github.com/semyon-alekseev-noveo/tt-sync/issues/74)
- Mappings: `type/next` → TTS-nextAction; `type/waiting` → TTS-waitingFor
- Note: `00 Inbox/abyss-active.md`

## Evidence

1. Created `- [ ] AF-7 list-move 034600 #type/next …` → Synchronize → id **`6add7baf4de4201f884a6a4e`** on TTS-nextAction; vault `#type/next`.
2. MCP `move_task` → TTS-waitingFor (`6ad1abff8f0841315e870da2`).
3. Synchronize (`sync-mvnaf0yc-1e-como`).

| Check | Result |
|-------|--------|
| Stage tag after move | `#type/waiting` (was `#type/next`) |
| Same line / file | `00 Inbox/abyss-active.md` line 6 only |
| Journal | `tt->obs` line update `type/next` → `type/waiting` |

Unmapped-tag-by-name (2.0.32) not separately exercised; move used mapped lists only.

## Conclusion

List move rewrites the stage tag on the same vault line. Close #74. Next: AF-8 (#75).

## Checklist

- [x] Move synced task to another mapped list → Synchronize
- [x] Stage tag rewritten; line did not move
- [x] Evidence under `STEP7-AF-PILOT-SOAK/`
