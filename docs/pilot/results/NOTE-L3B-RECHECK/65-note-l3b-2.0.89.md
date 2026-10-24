# #65 — NOTE-L3b / BUG-COMMENT-NO-PUSH on 2.0.89

## Meta

| Field | Value |
|-------|--------|
| Gate | `NOTE-L3B-RECHECK` |
| GitHub | [#65](https://github.com/semyon-alekseev-noveo/tt-sync/issues/65) |
| Recorded | 2026-10-24 ~12:59 UTC |
| Build | **2.0.89** on `<pilot-vault>` (Thinkpad-tts-test) |
| Status | **pass** ×2 (two tasks) |

## Inputs

- Case: `ABYSS_FIRST_CASES.md` **NOTE-L3b** / **BUG-COMMENT-NO-PUSH**
- `TEST_PLAN.md` **TP-BUG-COMMENT-NO-PUSH**
- Prior tip pass: **2.0.85** `post102-nopush-123356` (`POST-PERF-REGRESSION/102-post-perf-regression.md`)
- Config precondition: [#64](https://github.com/semyon-alekseev-noveo/tt-sync/issues/64) verify same session (`PILOT-VAULT-CONFIG/64-pilot-config-2.0.89.md`)

## Evidence

Method: Obsidian CLI write child bullet → `tickticksync-abyss:tts-sync` → TickTick MCP `get_comment`.

| # | Task | Vault marker | TT comment id | Created (UTC) |
|---|------|--------------|---------------|---------------|
| 1 | `gate-comment-249` (`6ad6f43a0aa12c21f30de04a`) | `note-l3b-289-125855` | `6adcab95b51bd01f880ca10a` | 2026-10-24T12:59:01Z |
| 2 | `тест-абис-таск` (`6ad97afa24006c1f88d0aa13`) | `note-l3b-289b-125921` | `6adcababb91e021f884b9b19` | 2026-10-24T12:59:23Z |

Both on project `6ad1abfe8f08abb10392fe45`. Vault bullets remained under the parent lines in `00 Inbox/abyss-active.md` after Synchronize. Titles unchanged.

## Conclusion

**NOTE-L3b** / **TP-BUG-COMMENT-NO-PUSH** hold on release **2.0.89** (two independent tasks). Close #65. Historical **2.0.51** fail stays in the results log.

## Checklist

- [x] NOTE-L3b / TP-BUG-COMMENT-NO-PUSH re-run on named tip build (**2.0.89**)
- [x] `TEST_PLAN.md` + cases results log updated (this PR)
- [x] Pass → close #65
