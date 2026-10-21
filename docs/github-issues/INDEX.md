# GitHub issues — open epics (tt-sync)

Tracker issues live on [`semyon-alekseev-noveo/tt-sync`](https://github.com/semyon-alekseev-noveo/tt-sync/issues). Long evidence lives under [`docs/pilot/results/`](../pilot/results/) — not in issue comments.

| Epic / issue | GitHub | Priority | Status | Blocked by |
|--------------|--------|----------|--------|------------|
| PILOT-GATE-TEST-11-12 | [#14](https://github.com/semyon-alekseev-noveo/tt-sync/issues/14) | P0 | **closed / pass** (**2.0.74**) | — |
| Phase 0–3 (comment gate) | [#10](https://github.com/semyon-alekseev-noveo/tt-sync/issues/10)–[#13](https://github.com/semyon-alekseev-noveo/tt-sync/issues/13) | P0 | **closed** | under #14 |
| BUG-COMMENT-API-POST-500 | [#21](https://github.com/semyon-alekseev-noveo/tt-sync/issues/21) | P0 | **closed / pass** (**2.0.74**) | — |
| BUG-COMMENT-ABYSS-VIEW | [#23](https://github.com/semyon-alekseev-noveo/tt-sync/issues/23) | P0 | **closed / pass** (**2.0.75**) | — |
| BUG-COMMENT-DUP-STAMP | [#25](https://github.com/semyon-alekseev-noveo/tt-sync/issues/25) | P0 | **closed / pass** (**2.0.76**) | Soft: after #23; stamped+plain TT pairs |
| BUG-COMMENT-VAULT-DUP-KEY | [#27](https://github.com/semyon-alekseev-noveo/tt-sync/issues/27) | P0 | open (analyst) | Soft: after #25; vault wall-clock+ISO twins |
| PILOT-BATCH-EDITOR-SAFETY | [#15](https://github.com/semyon-alekseev-noveo/tt-sync/issues/15) | P0 | open (#17/#18 left) | Soft: was #14; now unblocked for focus |
| └ open-note / editor | [#16](https://github.com/semyon-alekseev-noveo/tt-sync/issues/16) | P0 | **closed / pass** (**2.0.76**) | #15 |
| └ EMPTY-SIDE-GUARD | [#17](https://github.com/semyon-alekseev-noveo/tt-sync/issues/17) | P0 | open | #15 |
| └ deferred-id | [#18](https://github.com/semyon-alekseev-noveo/tt-sync/issues/18) | P0 | open | #15 |
| BUG-ACTIVEZONE-COMMENT-SHUFFLE | [#19](https://github.com/semyon-alekseev-noveo/tt-sync/issues/19) | P1 | open | Soft: #15 |
| Step 7 AF-* pilot soak | [#20](https://github.com/semyon-alekseev-noveo/tt-sync/issues/20) | P1 | open | #14 pass + #15 |

## Templates

| File | Maps to |
|------|---------|
| `00–04-*.md` | Epic #14 / phases #10–#13 |
| `10-epic-editor-safety.md` | #15 |
| `11-verify-open-note-editor.md` | #16 |
| `12-verify-empty-side-guard.md` | #17 |
| `13-verify-deferred-id.md` | #18 |
| `15-bug-activezone-comment-shuffle.md` | #19 |
| `20-epic-step7-af-soak.md` | #20 |
| `BUG-COMMENT-DUP-STAMP.md` | #25 |
| `BUG-COMMENT-VAULT-DUP-KEY.md` | #27 |

## Naming

Product roadmap phases are **Steps 1–8** in `ABYSS_FIRST_PLAN.md` (not “modules”). Pilot-gate checklists may use Phase 0–3 **inside one gate** only.
