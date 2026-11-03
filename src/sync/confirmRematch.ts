/**
 * ARCH-SYNC / UX-SYNC-CONFIRM-REBIND — Confirm (under-threshold PushDeleteTT)
 * must offer the same Rebind=Link path as the held Sync discrepancies modal.
 *
 * Converts Confirm deletion items → PlannedDeletion vault→TT candidates and
 * runs `rebindVaultFromPlanned` (no TickTick deletes).
 */
import { Notice, TFile } from 'obsidian';
import type { PluginContext } from '@/pluginContext';
import {
	canOfferRematch,
	REBIND_GUARD_NOTICE,
	type PlannedDeletion,
} from '@/sync/massDeleteGuard';
import { rebindVaultFromPlanned } from '@/sync/rebindVault';
import { stampLinkTombstones } from '@/sync/syncIntent';
import { commitVaultText, syncRead } from '@/sync/vault-io';
import log from '@/utils/logger';

/** Minimal Confirm modal row (avoids circular import with TaskDeletionModal). */
export type ConfirmDeletionItem = {
	title: string;
	filePath?: string;
	id?: string;
	line?: string;
};

/** Map Confirm list rows to rematchCandidates shape (vault→TT delete). */
export function plannedFromConfirmDeletionItems(
	items: readonly ConfirmDeletionItem[],
): PlannedDeletion[] {
	const out: PlannedDeletion[] = [];
	for (const it of items) {
		const id = (it.id ?? '').trim();
		const file = (it.filePath ?? '').trim();
		if (!id || !file) continue;
		out.push({
			id,
			taskId: id,
			kind: 'task',
			direction: 'vault-to-ticktick',
			action: 'delete',
			title: it.title,
			file,
		});
	}
	return out;
}

export function confirmOffersRematch(items: readonly ConfirmDeletionItem[]): boolean {
	return canOfferRematch(plannedFromConfirmDeletionItems(items));
}

export type ConfirmRematchResult = {
	rebound: number;
	inserted: number;
	skipped: number;
	files: number;
};

/**
 * Link / InsertLine for Confirm Rebind. Never deletes TickTick tasks.
 */
export async function applyConfirmRematch(
	plugin: PluginContext,
	items: readonly ConfirmDeletionItem[],
): Promise<ConfirmRematchResult> {
	const rematchLink = plannedFromConfirmDeletionItems(items);
	if (!rematchLink.length) {
		return { rebound: 0, inserted: 0, skipped: 0, files: 0 };
	}
	if (!plugin.taskRepository?.loadLocalTaskById || !plugin.taskParser?.convertTaskToLine) {
		log.error('TickTickSync confirm rematch: taskRepository/taskParser missing');
		new Notice('TickTickSync: rebind failed (no task reader).', 8000);
		return { rebound: 0, inserted: 0, skipped: 0, files: 0 };
	}

	const allLiveIds = new Set<string>();
	try {
		const locals = await plugin.taskRepository.loadAllLocalTasks();
		for (const row of locals) {
			if (!row.deleted && row.taskId) allLiveIds.add(row.taskId);
		}
	} catch (error) {
		log.warn('TickTickSync confirm rematch: live id set fallback', error);
		for (const item of rematchLink) {
			const id = item.taskId ?? item.id;
			if (id) allLiveIds.add(id);
		}
	}

	const result = await rebindVaultFromPlanned(
		rematchLink,
		{
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
					log.warn(`TickTickSync confirm rematch: deferred write for ${path}`);
				}
			},
			convertTaskToLine: (task, tabs) => plugin.taskParser!.convertTaskToLine(task, tabs),
		},
		{ allLiveIds },
	);

	stampLinkTombstones(result.displacedIds, 'rewrite');
	new Notice(
		`TickTickSync: ${REBIND_GUARD_NOTICE} rebound=${result.rebound} inserted=${result.inserted}`,
		8000,
	);
	return {
		rebound: result.rebound,
		inserted: result.inserted,
		skipped: result.skipped,
		files: result.files,
	};
}
