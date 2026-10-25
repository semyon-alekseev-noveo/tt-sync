# #19 — BUG-ACTIVEZONE-COMMENT-SHUFFLE prove×2 (2.0.89 tip)

## Meta

| Field | Value |
|-------|--------|
| Gate | `BUG-ACTIVEZONE-COMMENT-SHUFFLE` |
| GitHub | [#19](https://github.com/semyon-alekseev-noveo/tt-sync/issues/19) (CLOSED; post-merge pilot) |
| Fix PR | [#134](https://github.com/semyon-alekseev-noveo/tt-sync/pull/134) (`4a64d28`) |
| Recorded | 2026-10-25 ~04:17–04:18 UTC |
| Build | **2.0.89** tip with `repairProjectNoteTasks` hoist-with-children on `<pilot-vault>` (Thinkpad-tts-test) |
| Status | **pass** ×2 (two notes / fixtures) |

## Inputs

- `TEST_PLAN.md` **BUG-ACTIVEZONE-COMMENT-SHUFFLE**
- Unit: `projectScheme.test.ts` / `subtaskOrder.test.ts`
- Deploy: built tip → `tickticksync-abyss` on Thinkpad-tts-test; invoke `projectScheme.repairAllProjectNotes()` via Obsidian CLI

## Evidence

### Prove 1 — AF-3 Active Zone siblings

Note: `10 Projects/AF-3 pilot obs parent 142000.md`

Fixture under `## Active Zone`: orphan body line, then two sibling checkboxes each with one comment bullet.

After `repairAllProjectNotes()`:

| Check | Result |
|-------|--------|
| `comment-19-prove1-A` immediately under `prove1-A` | yes (lines 5→6) |
| `comment-19-prove1-B` immediately under `prove1-B` | yes (lines 7→8) |
| Comments swapped / floated above first task | **no** |

### Prove 2 — AF-2 Overview → Active Zone hoist

Note: `10 Projects/AF-2 pilot parent 135930.md` (different fixture)

Parked under `## Overview` (indented): two nested checkboxes each with a deeper comment.

After `repairAllProjectNotes()`:

| Check | Result |
|-------|--------|
| Both tasks + comments in `## Active Zone` | yes |
| `comment-19-prove2-X` under `prove2-X`; `…-Y` under `prove2-Y` | yes |
| Markers still under `## Overview` | **no** |

## Conclusion

Repair keeps Abyss comment bullets with their sibling tasks on rewrite and when hoisting nested parked tasks into Active Zone. Two independent notes. Fixtures removed from vault after recording.

## Checklist

- [x] Prove 1: sibling comments stay put on AF-3
- [x] Prove 2: nested hoist keeps comments on AF-2
- [x] Evidence under `BUG-ACTIVEZONE-COMMENT-SHUFFLE/`
