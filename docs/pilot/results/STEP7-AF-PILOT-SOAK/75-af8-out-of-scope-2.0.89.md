# #75 — AF-8 outside syncScopeFolders → not pushed (2.0.89)

## Meta

| Field | Value |
|-------|--------|
| Gate | `STEP7-AF-PILOT-SOAK` |
| GitHub | [#75](https://github.com/semyon-alekseev-noveo/tt-sync/issues/75) (parent [#20](https://github.com/semyon-alekseev-noveo/tt-sync/issues/20)) |
| Recorded | 2026-10-25 ~03:51 UTC |
| Build | **2.0.89** on `<pilot-vault>` (Thinkpad-tts-test) |
| Status | **pass** |

## Inputs

- `ABYSS_FIRST_CASES.md` **AF-8**
- Issue [#75](https://github.com/semyon-alekseev-noveo/tt-sync/issues/75)
- `syncScopeFolders`: `00 Inbox/`, `10 Projects/`, `30 Tasks/`
- Out-of-scope path: `80 Sandbox/AF-8 out-of-scope 035100.md`

## Evidence

1. Created note outside scope with `- [ ] AF-8 out-of-scope 035100 #obsidian #inbox #tts-test` (no id).
2. Synchronize once.

| Check | Result |
|-------|--------|
| `ticktick_id` on line | **none** |
| Journal hits for path/title | **0** |
| TickTick search for title | **[]** |

## Conclusion

Out-of-scope checkbox is not pushed. Close #75. AF-1…AF-8 case pilots complete on **2.0.89**; epic #20 still needs combined live-gate row / [#76](https://github.com/semyon-alekseev-noveo/tt-sync/issues/76) before Step 8.

## Checklist

- [x] Checkbox outside `syncScopeFolders` → Synchronize
- [x] No TT task / no vault id / no `obs->tt` create
- [x] Evidence under `STEP7-AF-PILOT-SOAK/`
