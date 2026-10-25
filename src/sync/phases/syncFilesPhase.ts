import type { SyncPhaseDeps } from '@/sync/phases/types';
import { runSyncFilesPass } from '@/sync/phases/syncFilesPass';

/**
 * Project-note file pass + vault→TT deletion (Phase 2 via lifecycle).
 * Times `syncFiles` and `vaultDeletion` inside one LOCK_TASKS (#66).
 */
export async function runSyncFilesPhase(deps: SyncPhaseDeps): Promise<void> {
	const { service, ui, ctx, plugin } = deps;
	ui.setFullStep('Syncing project notes…');
	await runSyncFilesPass({ plugin, service, ctx }, false);
}
