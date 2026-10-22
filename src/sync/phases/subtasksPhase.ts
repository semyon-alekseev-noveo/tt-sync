import type { SyncPhaseDeps } from '@/sync/phases/types';
import log from '@/utils/logger';

/** Reorder sibling lines to TickTick sortOrder for files not edited locally this run. */
export async function runSubtasksPhase(deps: SyncPhaseDeps): Promise<void> {
	const { service, ui, ctx } = deps;
	ui.setFullStep('Finalizing subtask order…');
	try {
		await service.pullSubtaskOrder(ctx.locallyEdited);
	} catch (e) {
		log.warn('subtask order pull failed', e);
	}
}
