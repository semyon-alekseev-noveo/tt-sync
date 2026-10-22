# Phase 0 map + PR 1 extract

## Meta

| Field | Value |
|-------|--------|
| Gate / epic | `TECH-SYNC-MODULARIZATION` |
| GitHub | [tt-sync #31](https://github.com/semyon-alekseev-noveo/tt-sync/issues/31) |
| Recorded | 2026-10-22 UTC |
| Base | `abyss-mapping` @ `25eed74` |
| Status | **open** — PR 1 extract in [PR #34](https://github.com/semyon-alekseev-noveo/tt-sync/pull/34); not merged |

## Inputs

- `docs/SYNC_MODULARIZATION.md` (Phase 0: `SyncRunContext`, `preparePhase`, `pushLocalPaths`)
- Pilot perf from `docs/pilot/results/PILOT-GATE-TEST-11-12/10-phase-0-baseline.md` (build 2.0.72)
- PO_STATUS: **TECH-CIRC-1 / GOD-1/2**

## Evidence

### Hotspots (pilot `perf-pilot.log`, gate baseline)

| trigger | vaultReconcile ms | total ms | Notes |
|---------|-------------------|----------|--------|
| manual | ~21085 | ~45990 | ~46% of wall in vaultReconcile |
| startup (fullSync) | ~27726 | ~45275 | Same total band; reconcile dominates |

Historical note from owner: `vaultReconcile` + `syncFiles` often **20–45s** combined on the pilot vault. Comment HTTP (`addTaskComment` / `getTaskComments`) also clusters inside reconcile/push paths — modular boundaries make those countable per phase.

**Implication:** First extract does **not** claim a perf win; it makes the next measurement slice (vaultReconcile vs syncFiles vs push) safe to change without regressing pull/lifecycle.

### Target module map

| Module | Path | Owns |
|--------|------|------|
| orchestrator | `services/index.ts` → thin `synchronizationInner` | Phase order, locks, perf, `SyncRunContext` |
| phases | `src/sync/phases/*` | One function per `timePhase` name |
| vault-io | `vaultWrite`, `fileRunCache`, `pendingMarkerTaskIds` | Read/write note (PR 3 facade) |
| vault-push | TMD, `activeFilePush`, `NewFileMap`, `vault-push/pushLocalPaths` | Obsidian → TT |
| vault-pull | `VaultSyncCoordinator`, `fileOperation` | TT/Dexie → lines |
| tt-remote | `sync/sync.ts`, `pull.ts`, `api/` | Delta / Dexie ingest |
| lifecycle | `TaskDeletionHandler`, mass-delete guard | Delete prompts (PR 2) |
| store | `repositories/*`, `db/*` | Dexie (PR 7 ports) |
| comments | `src/sync/comments/` | Keys + `planCommentSync` |

### What landed in this PR (PR 1)

Extract-only; public plugin API unchanged.

| Phase | File |
|-------|------|
| prepare | `preparePhase.ts` (pre-existing) |
| projects | `projectsPhase.ts` |
| register | `registerPhase.ts` |
| deletionGuard (+ push wall stamp) | `deletionGuardPhase.ts` |
| push | `pushPhase.ts` |
| pull | `pullPhase.ts` |
| vaultReconcile | `vaultReconcilePhase.ts` |
| subtasks | `subtasksPhase.ts` |
| syncFiles | `syncFilesPhase.ts` (thin; body still on `TickTickService.syncFiles`) |

Also: `SyncRunContext.projects`; `pushSinceMs` / `guardedPull` / `locallyEdited` wired through phases; `pushLocalEditsFirst` returns the edited path set.

**Not moved:** `syncFiles` body / Phase 2 delete; `TaskModificationDetector` split; `main` ↔ `services` cycle.

## Conclusion

PR 1 completes the phase extract checklist item on #31. Next slice was **PR 2** — see [`31-pr2-lifecycle.md`](31-pr2-lifecycle.md).

## Checklist

- [x] Module map documented
- [x] Hotspots from pilot perf recorded
- [x] Phase functions extracted; orchestrator thin
- [ ] PR merged into `abyss-mapping` (owner)
- [x] PR 2 lifecycle extract — [`31-pr2-lifecycle.md`](31-pr2-lifecycle.md)
- [ ] Import-cycle CI / file-size DoD (epic close)
