/**
 * Sync phase entry points. PR 1 moves bodies from TickTickService into these modules.
 */
export type { SyncPhaseDeps } from '@/sync/phases/types';
export { runPreparePhase } from '@/sync/phases/preparePhase';
export { runProjectsPhase } from '@/sync/phases/projectsPhase';
export { runRegisterPhase } from '@/sync/phases/registerPhase';
export { runDeletionGuardPhase } from '@/sync/phases/deletionGuardPhase';
export { runPushPhase } from '@/sync/phases/pushPhase';
export { runPullPhase } from '@/sync/phases/pullPhase';
export { runVaultReconcilePhase } from '@/sync/phases/vaultReconcilePhase';
export { runSubtasksPhase } from '@/sync/phases/subtasksPhase';
export { runSyncFilesPhase } from '@/sync/phases/syncFilesPhase';
