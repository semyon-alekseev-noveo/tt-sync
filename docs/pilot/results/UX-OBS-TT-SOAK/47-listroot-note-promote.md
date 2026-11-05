# 47 — BUG-LISTROOT-NOTE-PROMOTE (note/* list-root → project note)

| Field | Value |
|-------|-------|
| Gate | UX-OBS-TT-SOAK |
| Phase | 47 (root cause / prevention) |
| Case | `BUG-LISTROOT-NOTE-PROMOTE` |
| Status | **live pass** ×2 (clean fixtures); unit **pass** |
| Issue | [#284](https://github.com/semyon-alekseev-noveo/tt-sync/issues/284) |
| Related | Hierarchy collapse on dishwasher / workplace; Deduplicate **won't-fix** (prevention first) |
| Tip | `358690e` (merge #285) / plugin **2.0.96** |

## Meta

| Field | Value |
|-------|-------|
| Date (UTC) | 2026-11-05 |
| Issue | https://github.com/semyon-alekseev-noveo/tt-sync/issues/284 |
| Vault | Thinkpad-tts-test (pilot) |
| Diagnosis | TT Projects list parents «Подключение посудомойки» `6ae4236ad07c7a23f9eed4bf` and «оборудовать рабочее место» `6ae4236ad07c7a23f9eed4c2` are flat (`childIds` empty). Former subtasks sit as list roots with tags like `obsidian` + `note/подключение-посудомойки` (no `project`). Plugin `isListRoot` treated every Projects root as a scheme parent → `createNote` → each became its own `#system/project` note; parents left with dead `ticktick_id` / `%%tt-detached%%` Active Zone. |
| Invariant | `isSchemeParentTask` must not promote a list-root that carries `note/<slug>` (or `note-…`) **without** tag `project`. |

## Inputs

- Critical-thinking skill: prevention before Deduplicate / mass wipe.
- Owner merged #285 into `abyss-mapping` (`358690e`).
- Tip install: `npm run build` → pilot `tickticksync-abyss`; `plugin:reload` → eval version **2.0.96**.
- Dirty dishwasher/workplace MOCs left untouched (owner recovery). Clean TT fixtures created for prove ×2.

## Evidence

### Unit

- `projectScheme.test.ts` — `BUG-LISTROOT-NOTE-PROMOTE: note/* without project is not a scheme parent`
- Commands: `npx vitest run` (merge PR) + re-check `npx vitest run src/test/projectScheme.test.ts -t BUG-LISTROOT-NOTE-PROMOTE` → **pass**; `npm run build` → **pass**

### Tip install

| Step | Result |
|------|--------|
| PR #285 MERGED | merge commit `358690eb5d12546909b56a67a6bc395a3f9b4c56` |
| `git pull --ff-only` abyss-mapping | tip = merge commit |
| Deploy dist + `plugin:reload` | enabled **2.0.96** (`tickticksync-abyss`) |

### Live / pilot

| Prove | Fixture | Result |
|-------|---------|--------|
| 1 | TT Projects root `BUG-LISTROOT-PROVE-A clean note-only` (`6aebe1d08f08b205a8b0d08a`), tags `obsidian` + `note/bug-listroot-prove-a` (no `project`) → Synchronize | **pass** — no `10 Projects/BUG-LISTROOT-PROVE-A…` MOC; id **absent** from `projectScheme.parents` |
| 2 | TT Projects root `BUG-LISTROOT-PROVE-B workplace-slug style` (`6aebe1f78f08f1480307bfad`), tags `obsidian` + `note/bug-listroot-prove-b` → Synchronize | **pass** — no MOC; id **absent** from `parents` |
| Smoke | `PKM - journaling` note-free/`obsidian` root | **kept** — vault MOC still present; id in `parents` |

Dirty dishwasher/workplace wrongly promoted notes (`нарисовать схему коммуникаций.md`, workplace children, etc.) still exist and still bind those TT ids in `parents` — **owner recovery**, not re-created this tip. No Apply once / mass-delete / vault wipe.

## Conclusion

Creation path closed and **live-proved ×2** on clean note/* fixtures after tip `358690e` / **2.0.96**. Existing wrongly promoted pilot notes remain until owner cleans.

## Checklist

- [x] Creation vs cleanup? → **creation** (`isSchemeParentTask` gate)
- [x] AF case `BUG-LISTROOT-NOTE-PROMOTE`
- [x] Failing-then-green unit named by ID
- [x] TEST_PLAN + CHANGELOG in same PR (fix) + this docs PR (live)
- [x] Live prove ×2 on clean fixtures
- [ ] Deduplicate UI — **not** shipping
- [ ] Owner: manual cleanup of dishwasher/workplace vault twins
