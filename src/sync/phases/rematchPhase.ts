import { Notice, TFile } from 'obsidian';
import type { SyncPhaseDeps } from '@/sync/phases/types';
import { rematchVaultFromPlanned } from '@/sync/rematchVault';
import { commitVaultText, syncRead } from '@/sync/vault-io';
import log from '@/utils/logger';

/**
 * After pull (Dexie current), if the owner chose Rematch on the held modal,
 * materialize missing vault lines from Dexie without applying TT deletes and
 * without the add-to-vault network path (Comments / updateTask).
 * Writes go through `commitVaultText` (TP-NO-WHOLE-NOTE-WRITE).
 */
export async function runRematchPhase(deps: SyncPhaseDeps): Promise<void> {
	const { plugin, ui, ctx } = deps;
	const planned = ctx.guardedPull?.rematch;
	if (!planned?.length) return;

	ui.setFullStep('Rematching vault from TickTick…');
	if (!plugin.taskRepository?.loadLocalTaskById || !plugin.taskParser?.convertTaskToLine) {
		log.error('TickTickSync rematch: taskRepository/taskParser missing');
		new Notice('TickTickSync: rematch failed (no task reader).', 8000);
		return;
	}

	const result = await rematchVaultFromPlanned(planned, {
		loadLiveTask: async (taskId) => {
			const row = await plugin.taskRepository!.loadLocalTaskById(taskId);
			if (!row) return null;
			return { taskId: row.taskId, deleted: row.deleted, task: row.task };
		},
		readFile: async (path) => {
			const f = plugin.app.vault.getAbstractFileByPath(path);
			if (!(f instanceof TFile)) return null;
			return syncRead(plugin.app.vault, f);
		},
		writeFile: async (path, text) => {
			const f = plugin.app.vault.getAbstractFileByPath(path);
			if (!(f instanceof TFile)) throw new Error(`missing file ${path}`);
			const snapshot = await syncRead(plugin.app.vault, f);
			const committed = await commitVaultText(plugin.app, f, snapshot, text);
			if (committed.status === 'deferred') {
				log.warn(`TickTickSync rematch: deferred write for ${path}`);
			}
		},
		convertTaskToLine: (task, tabs) => plugin.taskParser!.convertTaskToLine(task, tabs),
	});
	log.info(`TickTickSync rematch: wrote ${result.written} line(s) in ${result.files} file(s), skipped ${result.skipped}`);
	new Notice(
		`TickTickSync: rematched ${result.written} task(s) into ${result.files} note(s)`
			+ (result.skipped ? ` (${result.skipped} skipped)` : '')
			+ '. TickTick was not wiped.',
		10000,
	);
}
