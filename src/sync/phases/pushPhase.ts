import type { SyncPhaseDeps } from '@/sync/phases/types';

/**
 * Push vault edits made since the last sync BEFORE pulling, otherwise the pull
 * re-renders the line from TickTick and the local edit is lost (seen on [x] lines
 * edited outside the editor, where no editor-change check fires).
 */
export async function runPushPhase(deps: SyncPhaseDeps): Promise<void> {
	const { service, ui, ctx } = deps;
	ui.setFullStep('Pushing vault changes to TickTick…');
	const edited = await service.pushLocalEditsFirst(ctx.pushSinceMs, ctx.trigger, {
		skipOrphanVaultLineDeletes: ctx.skipOrphanVaultLineDeletes,
	});
	ctx.locallyEdited = edited;
}
