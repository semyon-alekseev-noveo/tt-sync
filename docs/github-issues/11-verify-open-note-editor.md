# GitHub issue — Checklist

**Created:** [#16](https://github.com/semyon-alekseev-noveo/tt-sync/issues/16) · Parent [#15](https://github.com/semyon-alekseev-noveo/tt-sync/issues/15)

**Title:** `PILOT-BATCH-EDITOR-SAFETY: Verify open-note / editor buffer (2.0.54–2.0.56)`

**Parent:** Epic PILOT-BATCH-EDITOR-SAFETY

**Body:**

## Scope

Pilot vault only. Confirm shipped behavior for:

| Case ID | Focus |
|---------|--------|
| TP-NO-CARET-REWRITE | Typing after open-note push kept |
| TP-ACTIVE-PUSH-DURING-SYNC | Deferred push not dropped |
| TP-NO-STALE-VIEW-READ | No stale buffer overwrite |
| TP-EMPTY-EDITOR-DISK | Empty leaf repaired from disk |
| TP-COMMENT-TT-DELETE / TP-EDITOR-* (smoke) | As time allows; record **not run** if skipped |

Related bugs: **BUG-OPEN-NOTE-BUFFER**, **BUG-STALE-EDITOR-WRITE**, **BUG-EMPTY-EDITOR-DISK**.

## Steps

1. Install build from current `manifest.json` into pilot plugin folder; confirm version in Obsidian.
2. Follow steps in `TEST_PLAN.md` for the rows above (open note, type during/after sync, empty-editor reopen).
3. Publish evidence to `docs/pilot/results/PILOT-BATCH-EDITOR-SAFETY/<issue#>-open-note-editor.md` (Meta, Inputs, Evidence, Conclusion, Checklist).
4. Update `TEST_PLAN.md` pilot status; short comment on this issue with link to the result file only.

## Out of scope

- `PILOT-GATE-TEST-11-12` / `test-11-12` Comments API (#14)
- Changing deletion-guard thresholds

## Done when

Result file + `TEST_PLAN.md` updated for every row that was actually run; unrun rows stay **not run**.
