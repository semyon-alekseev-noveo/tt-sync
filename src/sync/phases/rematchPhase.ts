import { Notice } from 'obsidian';
import type { SyncPhaseDeps } from '@/sync/phases/types';
import { rematchVaultFromPlanned } from '@/sync/rematchVault';
import log from '@/utils/logger';

/**
 * After pull (Dexie current), if the owner chose Rematch on the held modal,
 * materialize missing vault lines from Dexie without applying TT deletes.
 */
export async function runRematchPhase(deps: SyncPhaseDeps): Promise<void> {
	const { plugin, ui, ctx } = deps;
	const planned = ctx.guardedPull?.rematch;
	if (!planned?.length) return;

	ui.setFullStep('Rematching vault from TickTick…');
	if (!plugin.fileOperation?.synchronizeToVault) {
		log.error('TickTickSync rematch: fileOperation.synchronizeToVault missing');
		new Notice('TickTickSync: rematch failed (no vault writer).', 8000);
		return;
	}

	const result = await rematchVaultFromPlanned(planned, {
		synchronizeToVault: (file, tasks, updating) =>
			plugin.fileOperation!.synchronizeToVault(file, tasks, updating),
	});
	log.info(`TickTickSync rematch: wrote ${result.written}, skipped ${result.skipped}`);
	new Notice(
		`TickTickSync: rematched ${result.written} task(s) into the vault`
			+ (result.skipped ? ` (${result.skipped} skipped)` : '')
			+ '. TickTick was not wiped.',
		10000,
	);
}
