/**
 * Vault→TickTick deletion after the syncFiles file pass (Phase 2).
 * Owns clearPendingDeletions + TaskDeletionHandler.processSyncRemovedTasks.
 * Callers must hold LOCK_TASKS with the preceding file-pass when ordering matters.
 */
import type { PluginContext } from '@/pluginContext';
import { clearPendingDeletions } from '@/modals/TaskDeletionModal';
import type { SyncRunContext } from '@/sync/SyncRunContext';
import log from '@/utils/logger';

export interface VaultDeletionDeps {
	plugin: PluginContext;
	ctx: Pick<SyncRunContext, 'isPendingMarker'>;
}

export async function runVaultDeletionPhase(
	deps: VaultDeletionDeps,
	filePaths: string[],
): Promise<void> {
	clearPendingDeletions();
	try {
		await deps.plugin.taskDeletionHandler.processSyncRemovedTasks(filePaths, deps.ctx);
	} catch (error) {
		log.error('An error occurred in deletedTaskCheck:', error);
	}
}
