# #73 — AF-6 Complete ↔ complete both directions (2.0.89)

## Meta

| Field | Value |
|-------|--------|
| Gate | `STEP7-AF-PILOT-SOAK` |
| GitHub | [#73](https://github.com/semyon-alekseev-noveo/tt-sync/issues/73) (parent [#20](https://github.com/semyon-alekseev-noveo/tt-sync/issues/20)) |
| Recorded | 2026-10-25 ~03:11–03:14 UTC |
| Build | **2.0.89** on `<pilot-vault>` (Thinkpad-tts-test) |
| Status | **pass** (vault→TT and TT→vault) |

## Inputs

- `ABYSS_FIRST_CASES.md` **AF-6**
- Issue [#73](https://github.com/semyon-alekseev-noveo/tt-sync/issues/73)
- Note: `00 Inbox/abyss-active.md`

## Evidence

Seeded two open checkboxes; Synchronize assigned ids.

### A — Vault check → TickTick complete

1. Changed `- [ ] AF-6 vault-complete 031100` → `- [x] …` (`6add73564de4201f884a6a4c`).
2. Synchronize.

| Check | Result |
|-------|--------|
| TT status | **2** (completed); `completedTime` set |
| Vault line | stays `[x]` on same line |

### B — TickTick complete → vault check

1. MCP `complete_task` on `6add73564de4201f884a6a4d` (TTS-Inbox) while vault still `[ ]`.
2. Synchronize.

| Check | Result |
|-------|--------|
| Vault line | `- [x] AF-6 tt-complete 031100 … ✅ 2026-10-25` |
| Same line / no duplicate | only one match in vault |

### Recurring

Not exercised (throwaway non-recurring tasks). Status: **not run** for that sub-criterion.

## Conclusion

Completion syncs both ways on the same line. Close #73. Next: AF-7 (#74).

## Checklist

- [x] Vault check → TT completed
- [x] TT complete → same vault line checked; no duplicate
- [ ] Recurring roll (not run)
- [x] Evidence under `STEP7-AF-PILOT-SOAK/`
