# Sync modularization plan

**Status:** **PR 7 landed**; **#66 slice A** — TECH-API-1 playbook + contract tests, CI import-cycle allowlist (`npm run check:cycles`), `date_holder_type` extracted to break `Task`↔`dateMan`. Next: timed `vaultDeletion` phase, and/or further `TickTickService` extract when a bug needs a seam. Evidence: `docs/pilot/results/TECH-SYNC-MODULARIZATION/`; playbook `docs/TECH_API_BREAKAGE.md`.

**Canonical boundaries:** [`ANALYST_REFERENCE_DIAGRAMS.md`](ANALYST_REFERENCE_DIAGRAMS.md). Process: [`DEV_FLOW.md`](../DEV_FLOW.md).

## Why

`TickTickService` (`src/services/index.ts`, ~1200 lines) owns orchestration, push, pull hooks, `syncFiles`, and deletion phase 2. Fixes in one area (open-note write, Phase 2 delete) regress another because state lives on the service instance and in module-level sets.

The [Todoist Obsidian plugin](https://github.com/jamiebrynes7/obsidian-todoist-plugin) is **not** a line-sync model; useful ideas are **adapter + repository + subscriptions**, not vault markdown. Our split follows **vault-io / push / pull / remote / lifecycle / store**.

## Module map

| Module | Path (current → target) | Owns | Must not |
|--------|-------------------------|------|----------|
| **orchestrator** | `services/index.ts` → `sync/orchestrator/` | Phase order, locks, perf, `SyncRunContext` | Line parse rules, `vault.process` |
| **vault-io** | `src/sync/vault-io/` (`vaultWrite`, `fileRunCache`, `pendingMarkerTaskIds`; facade `index.ts`) | Read/write note, defer, cache, pending markers | TT API, deletion modals |
| **vault-push** | `src/sync/vault-push/taskModification/` (+ `services/TaskModificationDetector.ts` re-export), `activeFilePush`, `NewFileMap`, `pushLocalPaths` | Obsidian → TT | Pull, Phase 2 delete |
| **vault-pull** | `VaultSyncCoordinator`, `fileOperation` (pull) | TT/Dexie → lines | Push hash, create in TT |
| **tt-remote** | `sync/sync.ts`, `pull.ts`, `api/` | Delta, Dexie ingest | `commitVaultText` |
| **lifecycle** | `TaskDeletionHandler`, `massDeleteGuard`, `deletionGuardRun`, `lifecycle/runVaultDeletionPhase` | Delete prompts, guards | Direct editor patch |
| **store** | `repositories/ports/*` + Dexie adapters (`TaskRepository`, `FileTaskQueries`, `SyncMetaRepository`), `db/*` | Dexie access behind ports | Vault I/O; phases must not import `@/db/*` |
| **parser** | `src/taskParser/` (+ root `taskParser.ts` re-export) | Line ↔ `ITask` parse/format | TT API, vault write |

## `SyncRunContext`

One object per `synchronizationInner` run (`src/sync/SyncRunContext.ts`):

- Identity: `syncId`, `trigger`, `fullSync`
- Cross-phase: `pushSinceMs`, `guardedPull`, `locallyEdited`
- Lifecycle bridge: `registerPendingMarker` / `reconcilePendingMarkers` / `isPendingMarker` (wraps `pendingMarkerTaskIds` until state moves fully into context)

Future: `createdTaskIdsThisRun`, `filesPushed`, `pluginWritePaths` — add when a phase needs them; do not grow the service class.

## Phases (`synchronizationInner`)

| Order | `SyncPhaseName` | Today (method / block) |
|------|-----------------|-------------------------|
| 0 | (preflight) | `prunePendingMarkerTaskIds`, `beginFileRun`, `clearGuardRun` |
| 1 | `prepare` | settings, migration, task cache |
| 2 | `projects` | `saveProjectsToCache`, folder reorganize |
| 3 | `register` | `ensureVaultFilesRegistered` |
| 4 | `deletionGuard` | `prepareDeletionGuard` → `ctx.guardedPull` |
| 5 | `push` | `pushLocalEditsFirst(pushSince)` |
| 6 | `pull` | `syncTickTickWithDexie`, list mapping heal, vanished lists |
| 7 | `vaultReconcile` | `vaultSyncCoordinator.syncVaultWithDatabase` |
| 8 | `subtasks` | `pullSubtaskOrder` |
| 9 | `syncFiles` | `syncFiles` (file pass + calls `runVaultDeletionPhase` inside same `LOCK_TASKS`) |

Phase 2 vault→TT deletion is implemented in **lifecycle** (`runVaultDeletionPhase`); still invoked from `syncFiles` so Phase 1→2 stays under one lock. A later PR may promote it to a timed `vaultDeletion` phase after the file pass.

## PR sequence

### PR 1 — Extract phases only (no behavior change)

**Goal:** Thin orchestrator; each phase is a function `runXPhase(ctx, deps): Promise<void>` that contains **moved code**, not rewritten logic.

| Action | Files |
|--------|--------|
| Add | `src/sync/SyncRunContext.ts` (done) |
| Add | `src/sync/phases/types.ts` — `SyncPhaseDeps` (plugin, service facades) |
| Add | `src/sync/phases/preparePhase.ts` (**done**) |
| Add | `src/sync/vault-push/pushLocalPaths.ts` (**done**, comment active-note path) |
| Add | `src/sync/phases/projectsPhase.ts` (**done**) |
| Add | `src/sync/phases/registerPhase.ts` (**done**) |
| Add | `src/sync/phases/deletionGuardPhase.ts` (**done**) |
| Add | `src/sync/phases/pushPhase.ts` (**done**) |
| Add | `src/sync/phases/pullPhase.ts` (**done**) |
| Add | `src/sync/phases/vaultReconcilePhase.ts` (**done**) |
| Add | `src/sync/phases/subtasksPhase.ts` (**done**) |
| Add | `src/sync/phases/syncFilesPhase.ts` (**done** — thin call; body still on service) |
| Add | `src/sync/phases/index.ts` — re-exports (**done**) |
| Change | `src/services/index.ts` — `synchronizationInner` calls phases; remove duplicated bodies (**done**) |
| Add | `src/test/syncRunContext.test.ts` (**done**, Phase 0) |
| Add | `docs/SYNC_MODULARIZATION.md` (this file) |
| Change | `PROJECT_STATE.md` — snapshot + link here |

**Out of scope PR 1:** moving `syncFiles` / deletion **bodies** out of `index.ts`; breaking `main` ↔ `services` cycle; changing `pendingMarkerTaskIds` storage.

**Gate:** `npx vitest run`, `npm run build`, `synchronizationInner.integration.test.ts` unchanged green.

### PR 2 — Lifecycle boundary (**done**)

- Extract `processSyncRemovedTasks` call to `lifecycle/runVaultDeletionPhase.ts` (**done**).
- `TaskDeletionHandler` reads `ctx.isPendingMarker` only — no direct import of `pendingMarkerTaskIds` (**done**).
- `runSyncFilesPhase` / `syncFiles` pass `SyncRunContext`; direct `syncFiles` callers get a fallback context.

**Out of scope PR 2:** promoting deletion to a separate `timePhase('vaultDeletion')`; moving `syncFiles` Phase 1 body out of the service.

**Gate:** same as PR 1; `runVaultDeletionPhase.test.ts` + `pendingMarkerDeletion` (BUG-DEFERRED-ID-PHASE2-DELETE).

### PR 3 — `vault-io` facade (**done**)

- Move `vaultWrite.ts`, `fileRunCache.ts`, `pendingMarkerTaskIds.ts` under `src/sync/vault-io/`.
- `src/sync/vault-io/index.ts` exports `readNoteForWrite`, `commitVaultText`, cache APIs, pending-marker helpers.
- Push (`TaskModificationDetector`), pull (`VaultSyncCoordinator`, `fileOperation`), orchestrator, and tests import from `@/sync/vault-io`.
- Thin re-exports remain at old paths (`services/vaultWrite.ts`, `sync/fileRunCache.ts`, `sync/pendingMarkerTaskIds.ts`) for transitional imports.

**Out of scope PR 3:** moving pending-marker *storage* into `SyncRunContext`; changing write/defer behavior; timed `vaultDeletion` phase.

**Gate:** same as PR 1; `noWholeNoteWrite` allow-list points at `src/sync/vault-io/vaultWrite.ts`.

### Comment sync (`src/sync/comments/`)

See **`docs/COMMENT_SYNC_MODEL.md`**. PR A: keys + `planCommentSync` + tests (incl. failing wire test). PR B: wire `abyssCommentSync` + `apiCommentsDifferFromVault` + merge hints.

### PR 4 — Break `main` ↔ `services` (**done**)

- Add `src/pluginContext.ts` (`PluginContext` extends Obsidian `Plugin` + sync collaborators).
- `TickTickSync` in `main.ts` `implements PluginContext`.
- Services, `fileOperation`, `taskParser`, sync phases/lifecycle/vault-io, and service-used modals import `@/pluginContext` — not `@/main`.
- Guard test: `src/test/pluginContext.noMainImport.test.ts`.

**Out of scope PR 4:** remaining `main` cycles via `query/` / `redo/` / `ui/settings` value imports; god-class splits (`TaskModificationDetector`, `TickTickService`); store ports.

**Gate:** same as PR 1; `pluginContext.noMainImport` green.

### PR 5 — Split `taskParser` (**done**)

- Move implementations under `src/taskParser/` by concern; compose `TaskParser` via mixins (`applyMixins`).
- Root `src/taskParser.ts` re-exports `TaskParser`, `REGEX`, `markerName`, `flatTagName`, `abyssTagConflicts` (call sites unchanged).
- Module map: `regex`, `tags`, `reminders`, `markers`, `structure`, `diff`, `notes`, `convertToLine`, `convertToTask`, facade `TaskParser.ts` + `index.ts`.

**Out of scope PR 5:** changing parse/format behavior; splitting `TaskModificationDetector`; store ports.

**Gate:** same as PR 1; parser suites + `synchronizationInner.integration.test.ts` green.

### PR 6 — Split `TaskModificationDetector` (**done**)

- Move implementations under `src/sync/vault-push/taskModification/` by concern; compose via mixins (`applyMixins`).
- Modules: `types`, `detect`, `push`, `newTasks`, `scan`, facade `TaskModificationDetector.ts` + `index.ts`.
- Root `src/services/TaskModificationDetector.ts` re-exports (call sites unchanged).
- Barrel: `src/sync/vault-push/index.ts` also exports the facade + pre-pull path helpers.

**Out of scope PR 6:** changing detect/push behavior; store ports; timed `vaultDeletion`.

**Gate:** same as PR 1; TMD suites + `synchronizationInner.integration.test.ts` green.

### PR 7 — store ports (**done**)

- Ports: `src/repositories/ports/{FileTaskQueries,TaskRepository,SyncMeta}.ts` (+ barrel `index.ts`).
- Dexie adapters: `FileTaskQueries` / `TaskRepository` / `SyncMetaRepository` `implements` those ports.
- `PluginContext.taskRepository` / `fileTaskQueries` / `syncMeta` typed as ports; `main` constructs adapters.
- Orchestrator phases (`deletionGuard`, `projects`, `pull`) use ports only — no `@/db/*` imports.
- `TaskDeletionHandler` / `TaskOperationsService` take `plugin.fileTaskQueries` (port) instead of `new FileTaskQueries()`.
- Guard: `src/test/storePorts.noDexieInOrchestrator.test.ts`.

**Out of scope PR 7:** moving `tt-remote` (`sync.ts` / `pull.ts`) off Dexie; timed `vaultDeletion`; splitting `TickTickService`.

**Gate:** same as PR 1; storePorts guard + `synchronizationInner.integration.test.ts` green.

### PR 8 / #66 slice A — cycles + TECH-API-1 (**this branch**)

- CI: `scripts/check-import-cycles.mjs` + `docs/import-cycles.allowlist.json` (madge; list may only shrink). Wired in `.github/workflows/ci.yml`.
- Broke `api/types/Task` ↔ `dateMan` by moving `date_holder_type` to `api/types/DateHolder.ts` (allowlist 134 → 108).
- TECH-API-1: `docs/TECH_API_BREAKAGE.md` + `src/test/api/techApi1.contract.test.ts`.

### Files over 30 KB — exceptions (#66 / #31 DoD)

| File | ~bytes | Exception / plan |
|------|--------|------------------|
| `src/services/index.ts` | ~49 KB | **Exception (temporary):** god-class remainder after PR 1–7. Shrink via timed `vaultDeletion` + further extract when a bug needs a seam — not drive-by. |
| `src/main.ts` | ~40 KB | **Exception:** Obsidian entry wires the service graph; further extract waits on settings/query/redo seams. |
| `src/fileOperation.ts` | ~38 KB | **Exception:** vault-pull / file ops; split when a concrete pull bug needs a seam. |
| `src/api/index.ts` | ~36 KB | **Exception:** unofficial `Tick` client; prefer contract tests + playbook (`TECH_API_BREAKAGE.md`) over a big bang split. Optional later: group methods by resource. |

Optional size warn CI: deferred (document-only for now).

### PR 9+ — next slices

- Timed `vaultDeletion` phase (promote `runVaultDeletionPhase` out of `syncFiles` lock body), and/or further store extraction from services / tt-remote.

## Bug → module (quick routing)

| Symptom | Module first |
|---------|----------------|
| False delete / marker missing | lifecycle + vault-io + orchestrator context |
| Empty editor / disk ≠ buffer | vault-io |
| Comment not in TT API | vault-push + `abyssCommentSync` |
| Stale line after pull | vault-pull |
| Silent sync / checkpoint | tt-remote |
| Mass delete guard | lifecycle |
