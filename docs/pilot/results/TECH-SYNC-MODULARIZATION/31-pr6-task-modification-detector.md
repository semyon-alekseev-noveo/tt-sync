# PR 6 — split `TaskModificationDetector` (detect vs push)

## Meta

| Field | Value |
|-------|--------|
| Gate / epic | `TECH-SYNC-MODULARIZATION` |
| GitHub | [tt-sync #31](https://github.com/semyon-alekseev-noveo/tt-sync/issues/31) |
| Recorded | 2026-10-22 UTC |
| Base | `feat/tech-sync-modularization-pr5` (PR #38 still open) |
| Status | **open** — [PR #39](https://github.com/semyon-alekseev-noveo/tt-sync/pull/39) on `feat/tech-sync-modularization-pr6` (stacks on #38) |

## Inputs

- Prior phase: [`31-pr5-task-parser.md`](31-pr5-task-parser.md)
- Plan: `docs/SYNC_MODULARIZATION.md` § PR 6
- Constraint: extract-only; no detect/push behavior change; keep `@/services/TaskModificationDetector` imports stable

## Evidence

### Module map (after)

| Module | Path | Owns |
|--------|------|------|
| types | `src/sync/vault-push/taskModification/types.ts` | `TaskModifications`, `PendingTickTickDeletion` |
| detect | `…/detect.ts` | `detectModifications`, `detectNotesModification`, `hasContentChanges` |
| push | `…/push.ts` | `applyModifications`, move/status/parent handlers, items, comment opts, project-group |
| newTasks | `…/newTasks.ts` | create / re-attach / file scan for new tasks + marker write-back |
| scan | `…/scan.ts` | `checkLine/FileForModifications`, abyss comment sweep |
| facade | `…/TaskModificationDetector.ts` + `applyMixins.ts` | composed class |
| barrel | `…/index.ts`, `src/sync/vault-push/index.ts` | public exports |
| transitional | `src/services/TaskModificationDetector.ts` | re-export old path |

Call sites keep `import { TaskModificationDetector, … } from '@/services/TaskModificationDetector'`.

### Gate

| Check | Result |
|-------|--------|
| `npx vitest run` | **99** files, **687** passed (includes `synchronizationInner.integration.test.ts`, TMD / comment smoke suites) |
| `npm run build` | ok (`dist/main.js`) |

No live-vault pilot this slice (extract-only; no behavior claim).

## Conclusion

PR 6 TMD split is extract-complete. Next slice: **PR 7** — see [`31-pr7-store-ports.md`](31-pr7-store-ports.md).

## Checklist

- [x] Concern modules under `src/sync/vault-push/taskModification/`; thin services re-export
- [x] Vitest + build green
- [ ] PR merged into `abyss-mapping` (owner; stacks on #38 / #37 / #36 / #35 / #34)
- [x] PR 7 store ports — [`31-pr7-store-ports.md`](31-pr7-store-ports.md)
