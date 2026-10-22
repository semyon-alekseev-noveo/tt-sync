import type { SyncPhaseDeps } from '@/sync/phases/types';

/**
 * Project-note file pass (+ Phase 2 vault→TT deletion today lives inside syncFiles).
 * Body stays on TickTickService until the lifecycle PR.
 */
export async function runSyncFilesPhase(deps: SyncPhaseDeps): Promise<void> {
	const { service, ui } = deps;
	ui.setFullStep('Syncing project notes…');
	await service.syncFiles(false);
}
