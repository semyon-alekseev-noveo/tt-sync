# 47 — BUG-LISTROOT-NOTE-PROMOTE (note/* list-root → project note)

| Field | Value |
|-------|-------|
| Gate | UX-OBS-TT-SOAK |
| Phase | 47 (root cause / prevention) |
| Case | `BUG-LISTROOT-NOTE-PROMOTE` |
| Status | **unit pass**; live prove ×2 **not run** |
| Issue | [#284](https://github.com/semyon-alekseev-noveo/tt-sync/issues/284) |
| Related | Hierarchy collapse on dishwasher / workplace; Deduplicate **won't-fix** (prevention first) |

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
- Owner «go» after diagnosis (this chat).
- TT sample (MCP): e.g. «нарисовать схему коммуникаций» `6ae42394…575c` — root, tags `obsidian` + `note/подключение-посудомойки`.

## Evidence

### Unit

- `projectScheme.test.ts` — `BUG-LISTROOT-NOTE-PROMOTE: note/* without project is not a scheme parent`
- Commands: `npx vitest run` + `npm run build` (see CHANGELOG iteration)

### Live / pilot

| Prove | Fixture | Result |
|-------|---------|--------|
| 1 | Clean note/* root without `project` | **not run** |
| 2 | Second title/slug (workplace vs dishwasher) | **not run** |

Do **not** invent pass. Dirty vault twins from prior promote are **owner recovery**, not this PR.

## Conclusion

Creation path closed in code: note-context list-roots without `project` no longer enter `planProjects` `createNote`. Existing wrongly promoted notes stay until owner cleans; prove ×2 still required before live **pass** / issue close.

## Checklist

- [x] Creation vs cleanup? → **creation** (`isSchemeParentTask` gate)
- [x] AF case `BUG-LISTROOT-NOTE-PROMOTE`
- [x] Failing-then-green unit named by ID
- [x] TEST_PLAN + CHANGELOG in same PR
- [ ] Live prove ×2 on clean fixtures
- [ ] Deduplicate UI — **not** shipping
