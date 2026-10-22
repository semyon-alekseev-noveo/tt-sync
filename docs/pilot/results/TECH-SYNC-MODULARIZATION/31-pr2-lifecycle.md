# PR 2 — lifecycle / vaultDeletion extract

## Meta

| Field | Value |
|-------|--------|
| Gate / epic | `TECH-SYNC-MODULARIZATION` |
| GitHub | [tt-sync #31](https://github.com/semyon-alekseev-noveo/tt-sync/issues/31) |
| Recorded | 2026-10-22 UTC |
| Base | `feat/tech-sync-modularization-pr1` (PR #34 still open) |
| Status | **open** — [PR #35](https://github.com/semyon-alekseev-noveo/tt-sync/pull/35) on `feat/tech-sync-modularization-pr2` |

## Inputs

- Prior phase: [`31-phase-0-map.md`](31-phase-0-map.md) (PR 1 phases under `src/sync/phases/*`)
- Plan: `docs/SYNC_MODULARIZATION.md` § PR 2
- Constraint: extract-only; Phase 1→2 stays under one `LOCK_TASKS` acquisition

## Evidence

### What moved

| Before | After |
|--------|--------|
| Inline `clearPendingDeletions` + `processSyncRemovedTasks` in `TickTickService.syncFiles` | `src/sync/lifecycle/runVaultDeletionPhase.ts` |
| `TaskDeletionHandler` imported `isPendingMarkerTaskId` from `pendingMarkerTaskIds` | `processSyncRemovedTasks(filePaths, ctx)` uses `ctx.isPendingMarker` only |
| `runSyncFilesPhase` called `syncFiles(false)` | Passes `deps.ctx` as second arg |

`syncFiles` still invokes `runVaultDeletionPhase` inside the same lock after the file pass (ordering preserved). Timed `vaultDeletion` phase rename is deferred.

### Gate

| Check | Result |
|-------|--------|
| `npx vitest run` | **98** files, **686** passed (includes `synchronizationInner.integration.test.ts`, `runVaultDeletionPhase.test.ts`, BUG-DEFERRED-ID-PHASE2-DELETE) |
| `npm run build` | ok (`dist/main.js`) |

No live-vault pilot this slice (extract-only; no behavior claim).

## Conclusion

PR 2 lifecycle boundary is extract-complete. Next slice: **PR 3** — `vault-io` facade (`readNoteForWrite` / `commitVaultText` / cache), then optional timed `vaultDeletion` phase and `main` ↔ `services` break (PR 4).

## Checklist

- [x] `runVaultDeletionPhase` extracted
- [x] `TaskDeletionHandler` via `SyncRunContext` only for pending markers
- [x] Vitest + build green
- [ ] PR merged into `abyss-mapping` (owner; depends on #34 or stacked review)
- [ ] PR 3 vault-io facade
