import type { SyncPhaseDeps } from '@/sync/phases/types';

/**
 * Project-note file pass + vault→TT deletion (Phase 2 via lifecycle).
 * Passes SyncRunContext so TaskDeletionHandler uses `ctx.isPendingMarker` only.
 */
export async function runSyncFilesPhase(deps: SyncPhaseDeps): Promise<void> {
	const { service, ui, ctx } = deps;
	ui.setFullStep('Syncing project notes…');
	await service.syncFiles(false, ctx);
}
