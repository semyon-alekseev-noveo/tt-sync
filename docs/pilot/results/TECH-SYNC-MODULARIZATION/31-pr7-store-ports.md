# PR 7 — store ports (`FileTaskQueries` / `TaskRepository` / `SyncMeta`)

## Meta

| Field | Value |
|-------|--------|
| Gate / epic | `TECH-SYNC-MODULARIZATION` |
| GitHub | [tt-sync #31](https://github.com/semyon-alekseev-noveo/tt-sync/issues/31) |
| Recorded | 2026-10-22 UTC |
| Base | `feat/tech-sync-modularization-pr6` (PR #39 still open) |
| Status | **open** — [PR #40](https://github.com/semyon-alekseev-noveo/tt-sync/pull/40) on `feat/tech-sync-modularization-pr7` (stacks on #39) |

## Inputs

- Prior phase: [`31-pr6-task-modification-detector.md`](31-pr6-task-modification-detector.md)
- Plan: `docs/SYNC_MODULARIZATION.md` § PR 7
- Constraint: extract-only / dependency inversion; no sync behavior change; orchestrator must not import `@/db/*`

## Evidence

### Module map (after)

| Piece | Path | Role |
|-------|------|------|
| ports | `src/repositories/ports/{FileTaskQueries,TaskRepository,SyncMeta}.ts` | Interfaces sync layers depend on |
| barrel | `src/repositories/ports/index.ts` | Re-exports |
| adapters | `FileTaskQueries.ts`, `TaskRepository.ts`, `SyncMetaRepository.ts` | Dexie implementations |
| context | `pluginContext.ts` / `main.ts` | Ports on `PluginContext`; adapters constructed at init |
| phases | `deletionGuardPhase`, `projectsPhase`, `pullPhase` | Use `plugin.syncMeta` / `plugin.taskRepository` only |
| consumers | `TaskDeletionHandler`, `TaskOperationsService` | `plugin.fileTaskQueries` (no local `new`) |
| guard | `src/test/storePorts.noDexieInOrchestrator.test.ts` | `sync/phases` forbids `@/db/` imports |

### Gate

| Check | Result |
|-------|--------|
| `npx vitest run` | **100** files, **688** passed (includes `synchronizationInner.integration.test.ts`, `storePorts.noDexieInOrchestrator`) |
| `npm run build` | ok (`dist/main.js`) |

No live-vault pilot this slice (extract-only; no behavior claim).

## Conclusion

PR 7 store ports are extract-complete: orchestrator phases no longer import Dexie. Next slice: **timed `vaultDeletion`**, or further store extraction from services / tt-remote.

## Checklist

- [x] Port interfaces + Dexie adapters; PluginContext typed to ports
- [x] Phases free of `@/db/*`; guard test
- [x] Vitest + build green
- [ ] PR merged into `abyss-mapping` (owner; stacks on #39 / #38 / #37 / #36 / #35 / #34)
- [ ] PR 8 timed `vaultDeletion` / further store extract
