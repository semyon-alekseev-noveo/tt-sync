import { db } from '@/db/dexie';
import { prepareDeletionGuard } from '@/sync/deletionGuardRun';
import type { SyncPhaseDeps } from '@/sync/phases/types';
import { loadPluginWrites } from '@/utils/editedSince';

/**
 * Stamp the vault-push wall clock, then plan deletions in both directions before
 * any are applied. Prefetch for getUpdatedTasks happens here (before push).
 */
export async function runDeletionGuardPhase(deps: SyncPhaseDeps): Promise<void> {
	const { plugin, ui, ctx, tickApi } = deps;
	if (!tickApi) throw new Error('deletionGuard phase requires tickApi');

	// Marker at the start of this sync's vault push. The deletion guard prefetches
	// getUpdatedTasks before that push, so the stamp is taken first. This run still
	// compares files to the previous stamp. Plugin writes are excluded by mtime.
	const pushMeta = await db.meta.get('sync');
	ctx.pushSinceMs = pushMeta?.lastVaultPushWallMs ?? 0;
	loadPluginWrites(pushMeta?.pluginWriteMtimes);
	await db.meta.update('sync', { lastVaultPushWallMs: Date.now() });

	ui.setFullStep('Checking deletions…');
	ctx.guardedPull = await prepareDeletionGuard(
		plugin,
		tickApi,
		ctx.trigger,
		ctx.fullSync,
		ctx.projects,
	);
}
