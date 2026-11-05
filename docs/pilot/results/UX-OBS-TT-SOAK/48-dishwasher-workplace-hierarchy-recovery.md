# 48 — Dishwasher / workplace hierarchy recovery (post-#285)

| Field | Value |
|-------|-------|
| Gate | UX-OBS-TT-SOAK |
| Phase | 48 (owner recovery after prevention tip) |
| Case | Follow-on to `BUG-LISTROOT-NOTE-PROMOTE` |
| Status | **recovery pass** ×2 (dishwasher + workplace) |
| Issue | [#284](https://github.com/semyon-alekseev-noveo/tt-sync/issues/284) |
| Tip | `358690e` (merge #285) / plugin **2.0.96** |
| Vault | Thinkpad-tts-test (pilot only) |

## Meta

| Field | Value |
|-------|-------|
| Date (UTC) | 2026-11-05 |
| Issue | https://github.com/semyon-alekseev-noveo/tt-sync/issues/284 |
| Related | `47-listroot-note-promote.md` (creation path closed; dirty twins left for recovery) |

## Inputs

- Tip **2.0.96** already on pilot after #285 prove (`47-…`).
- TT Projects list parents flat with empty `childIds`:
  - «Подключение посудомойки» `6ae4236ad07c7a23f9eed4bf` (tags `project`+`obsidian`)
  - «оборудовать рабочее место» `6ae4236ad07c7a23f9eed4c2` (tags `project`+`obsidian`+`wip`)
- Orphans (list roots, `note/…`, no `project`): seven dishwasher + three workplace tasks (ids `…eed57c`…`…eed58d`).
- Pilot parent notes had dead `ticktick_id` + `%%tt-detached%%` Active Zone; each orphan had its own `#system/project` note under `10 Projects/`.

## Evidence

### 1. TickTick reparent (MCP)

`batch_update_tasks` set `parentId` on all ten orphans (no deletes of originals).

| Parent | `childIds` after |
|--------|------------------|
| `…eed4bf` dishwasher | `eed57c`, `eed57e`, `eed580`, `eed582`, `eed584`, `eed589`, `eed58a` (7) |
| `…eed4c2` workplace | `eed58b`, `eed58c`, `eed58d` (3) |

Spot-check: `get_task_by_id(…eed57c)` → `parentId=…eed4bf`; `get_task_by_id(…eed58b)` → `parentId=…eed4c2`.

### 2. Vault repair (pilot)

- Parent frontmatter `ticktick_id` → live parents (`…eed4bf`, `…eed4c2`).
- Cleared `%%tt-detached%%`; Active Zone restored as task lines.
- Ten spurious subtask-as-project notes moved to `zz-parked-listroot-promote-20261105/` (ids + `#system/project` stripped; tag `parked/listroot-promote`). Real parents and unrelated projects left in place.

### 3. Synchronize (caution)

First Synchronize after unmarked AZ lines **created ten same-title duplicate** TT children under the same parents (new ids `6aebe589…`–`6aebe591…`). **Apply once was not used.** Duplicates deleted via MCP; AZ lines rebound to the **original** nested ids; Confirm modal did not require owner click (no residual hold observed on follow-up syncs).

### 4. Prove ×2 (two fixtures)

| Prove | Fixture | After Synchronize |
|-------|---------|-------------------|
| 1 | Dishwasher parent | AZ = 7 task lines with original `…eed57c`…`…eed58a` markers; no `tt-detached`; no `10 Projects/<orphan>.md` |
| 2 | Workplace parent | AZ = 3 task lines with original `…eed58b`…`…eed58d`; same |

Second Synchronize (idle path): markers unchanged; `projectScheme.parents` contains both parents, **not** the ten children; clean prove fixtures A/B still **not** promoted; Dexie child `…eed57c` has `parentId=…eed4bf`.

## Conclusion

Hierarchy restored on pilot: TT nested under both parents; vault MOCs bind live parents with children as AZ task lines (not separate project notes). First sync same-title create was cleaned; recovery proved on both fixtures. No release.

## Checklist

- [x] TT reparent orphans → two parents (MCP)
- [x] Vault parent ids + park spurious notes
- [x] Clear detached; Synchronize without Apply once
- [x] Prove dishwasher + workplace (×2 fixtures)
- [x] No new `note/*` promote for orphans or clean prove A/B
- [ ] Optional: owner may delete `zz-parked-listroot-promote-20261105/` later
