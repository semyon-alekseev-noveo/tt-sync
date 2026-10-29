import { Notice, TFile } from 'obsidian';
import type { SyncPhaseDeps } from '@/sync/phases/types';
import { rebindVaultFromPlanned } from '@/sync/rebindVault';
import { commitVaultText, syncRead } from '@/sync/vault-io';
import log from '@/utils/logger';

/**
 * After pull (Dexie current), if the owner chose Rematch on the held modal:
 * ID-REBIND (#216) — rewrite stale markers by title, then insert only missing
 * lines. No TT deletes; no Comments/updateTask add path.
 * Writes go through `commitVaultText` (TP-NO-WHOLE-NOTE-WRITE).
 */
export async function runRematchPhase(deps: SyncPhaseDeps): Promise<void> {
	const { plugin, ui, ctx } = deps;
	const planned = ctx.guardedPull?.rematch;
	if (!planned?.length) return;

	ui.setFullStep('Rebinding vault markers from TickTick…');
	if (!plugin.taskRepository?.loadLocalTaskById || !plugin.taskParser?.convertTaskToLine) {
		log.error('TickTickSync rebind: taskRepository/taskParser missing');
		new Notice('TickTickSync: rebind failed (no task reader).', 8000);
		return;
	}

	const result = await rebindVaultFromPlanned(planned, {
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
				log.warn(`TickTickSync rebind: deferred write for ${path}`);
			}
		},
		convertTaskToLine: (task, tabs) => plugin.taskParser!.convertTaskToLine(task, tabs),
	});
	log.info(
		`TickTickSync rebind: wrote ${result.written} (rebound ${result.rebound}, inserted ${result.inserted}) `
			+ `in ${result.files} file(s), skipped ${result.skipped}`,
	);
	new Notice(
		`TickTickSync: rebound ${result.rebound}, inserted ${result.inserted} in ${result.files} note(s)`
			+ (result.skipped ? ` (${result.skipped} skipped)` : '')
			+ '. TickTick was not wiped.',
		10000,
	);
}
