# PR 5 — split `taskParser` by concern

## Meta

| Field | Value |
|-------|--------|
| Gate / epic | `TECH-SYNC-MODULARIZATION` |
| GitHub | [tt-sync #31](https://github.com/semyon-alekseev-noveo/tt-sync/issues/31) |
| Recorded | 2026-10-22 UTC |
| Base | `feat/tech-sync-modularization-pr4` (PR #37 still open) |
| Status | **open** — [PR #38](https://github.com/semyon-alekseev-noveo/tt-sync/pull/38) on `feat/tech-sync-modularization-pr5` (stacks on #37) |

## Inputs

- Prior phase: [`31-pr4-plugin-context.md`](31-pr4-plugin-context.md)
- Plan: `docs/SYNC_MODULARIZATION.md` § PR 5
- Constraint: extract-only; no parse/format behavior change; keep `@/taskParser` imports stable

## Evidence

### Module map (after)

| Module | Path | Owns |
|--------|------|------|
| regex / constants | `src/taskParser/regex.ts` | `REGEX`, `markerName`, `keywords`, priority maps |
| tags | `src/taskParser/tags.ts` | `flatTagName`, `abyssTagConflicts` |
| reminders | `src/taskParser/reminders.ts` | line ↔ reminder parse/format/preserve |
| markers | `src/taskParser/markers.ts` | ticktick id/tag/link on a line |
| structure | `src/taskParser/structure.ts` | indent, checkbox, priority, title strip |
| diff | `src/taskParser/diff.ts` | field change detection |
| notes | `src/taskParser/notes.ts` | note/item payload, `addNote` / `addItems` |
| convertToLine | `src/taskParser/convertToLine.ts` | `ITask` → markdown line + tag render |
| convertToTask | `src/taskParser/convertToTask.ts` | markdown line → `ITask` |
| facade | `src/taskParser/TaskParser.ts` + `applyMixins.ts` | composed class |
| barrel | `src/taskParser/index.ts` | public exports |
| transitional | `src/taskParser.ts` | re-export old path |

Call sites keep `import { TaskParser, … } from '@/taskParser'` (file re-export wins over directory).

### Gate

| Check | Result |
|-------|--------|
| `npx vitest run` | **99** files, **687** passed (includes `synchronizationInner.integration.test.ts`, parser suites) |
| `npm run build` | ok (`dist/main.js`) |

No live-vault pilot this slice (extract-only; no behavior claim).

## Conclusion

PR 5 parser split is extract-complete. Next slice: **PR 6** — see [`31-pr6-task-modification-detector.md`](31-pr6-task-modification-detector.md).

## Checklist

- [x] Concern modules under `src/taskParser/`; thin root re-export
- [x] Vitest + build green
- [ ] PR merged into `abyss-mapping` (owner; stacks on #37 / #36 / #35 / #34)
- [x] PR 6 TMD split — [`31-pr6-task-modification-detector.md`](31-pr6-task-modification-detector.md)
