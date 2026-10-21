# GitHub issues — open epics (tt-sync)

Tracker issues live on [`semyon-alekseev-noveo/tt-sync`](https://github.com/semyon-alekseev-noveo/tt-sync/issues). Long evidence lives under [`docs/pilot/results/`](../pilot/results/) — not in issue comments.

| Epic / issue | GitHub | Priority | Status | Blocked by |
|--------------|--------|----------|--------|------------|
| PILOT-GATE-TEST-11-12 | [#14](https://github.com/semyon-alekseev-noveo/tt-sync/issues/14) | P0 | **closed / pass** (**2.0.74**) | — |
| Phase 0–3 (comment gate) | [#10](https://github.com/semyon-alekseev-noveo/tt-sync/issues/10)–[#13](https://github.com/semyon-alekseev-noveo/tt-sync/issues/13) | P0 | **closed** | under #14 |
| BUG-COMMENT-API-POST-500 | [#21](https://github.com/semyon-alekseev-noveo/tt-sync/issues/21) | P0 | **closed / pass** (**2.0.74**) | — |
| BUG-COMMENT-ABYSS-VIEW | [#23](https://github.com/semyon-alekseev-noveo/tt-sync/issues/23) | P0 | **closed / pass** (**2.0.75**) | — |
| PILOT-BATCH-EDITOR-SAFETY | [#15](https://github.com/semyon-alekseev-noveo/tt-sync/issues/15) | P0 | open | Soft: was #14; now unblocked for focus |
| └ open-note / editor | [#16](https://github.com/semyon-alekseev-noveo/tt-sync/issues/16) | P0 | open | #15 |
| └ EMPTY-SIDE-GUARD | [#17](https://github.com/semyon-alekseev-noveo/tt-sync/issues/17) | P0 | open | #15 |
| └ deferred-id | [#18](https://github.com/semyon-alekseev-noveo/tt-sync/issues/18) | P0 | open | #15 |
| BUG-ACTIVEZONE-COMMENT-SHUFFLE | [#19](https://github.com/semyon-alekseev-noveo/tt-sync/issues/19) | P1 | open | Soft: #15 |
| Step 7 AF-* pilot soak | [#20](https://github.com/semyon-alekseev-noveo/tt-sync/issues/20) | P1 | open | #14 pass + #15 |
| TECH-SYNC-MODULARIZATION | [#31](https://github.com/semyon-alekseev-noveo/tt-sync/issues/31) | P1 | **closed** — release **2.0.77** (PRs #34–#40 on `abyss-mapping`) | extract-only stack |
| └ PR1 phases | [#41](https://github.com/semyon-alekseev-noveo/tt-sync/issues/41) | P1 | **closed** → [PR #34](https://github.com/semyon-alekseev-noveo/tt-sync/pull/34) | #31 |
| └ PR2 lifecycle | [#47](https://github.com/semyon-alekseev-noveo/tt-sync/issues/47) | P1 | **closed** → [PR #35](https://github.com/semyon-alekseev-noveo/tt-sync/pull/35) | #31 |
| └ PR3 vault-io | [#42](https://github.com/semyon-alekseev-noveo/tt-sync/issues/42) | P1 | **closed** → [PR #36](https://github.com/semyon-alekseev-noveo/tt-sync/pull/36) | #31 |
| └ PR4 PluginContext | [#43](https://github.com/semyon-alekseev-noveo/tt-sync/issues/43) | P1 | **closed** → [PR #37](https://github.com/semyon-alekseev-noveo/tt-sync/pull/37) | #31 |
| └ PR5 taskParser | [#45](https://github.com/semyon-alekseev-noveo/tt-sync/issues/45) | P1 | **closed** → [PR #38](https://github.com/semyon-alekseev-noveo/tt-sync/pull/38) | #31 |
| └ PR6 TaskModificationDetector | [#46](https://github.com/semyon-alekseev-noveo/tt-sync/issues/46) | P1 | **closed** → [PR #39](https://github.com/semyon-alekseev-noveo/tt-sync/pull/39) | #31 |
| └ PR7 store ports | [#48](https://github.com/semyon-alekseev-noveo/tt-sync/issues/48) | P1 | **closed** → [PR #40](https://github.com/semyon-alekseev-noveo/tt-sync/pull/40) | #31 |

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

## Naming

Product roadmap phases are **Steps 1–8** in `ABYSS_FIRST_PLAN.md` (not “modules”). Pilot-gate checklists may use Phase 0–3 **inside one gate** only.
