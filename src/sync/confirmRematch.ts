/**
 * ARCH-SYNC / UX-SYNC-CONFIRM-REBIND — Confirm (under-threshold PushDeleteTT)
 * must offer the same Rebind=Link path as the held Sync discrepancies modal.
 *
 * Converts Confirm deletion items → PlannedDeletion vault→TT candidates and
 * runs `rebindVaultFromPlanned` (no TickTick deletes).
 */
import { Notice, TFile, type App } from 'obsidian';
import type { ITask } from '@/api/types/Task';
import {
	REBIND_GUARD_NOTICE,
} from '@/sync/massDeleteGuard';
import { rebindVaultFromPlanned } from '@/sync/rebindVault';
import { stampLinkTombstones } from '@/sync/syncIntent';
import { commitVaultText, syncRead } from '@/sync/vault-io';
import log from '@/utils/logger';
import {
	plannedFromConfirmDeletionItems,
	type ConfirmDeletionItem,
} from '@/sync/confirmRematchOffer';

export type { ConfirmDeletionItem } from '@/sync/confirmRematchOffer';
export {
	confirmOffersRematch,
	plannedFromConfirmDeletionItems,
} from '@/sync/confirmRematchOffer';

/** Narrow deps — avoid importing PluginContext (cycle via TaskDeletionHandler). */
export type ConfirmRematchHost = {
	app: App;
	taskRepository?: {
		loadLocalTaskById: (taskId: string) => Promise<{
			taskId: string;
			deleted?: boolean;
			task?: ITask | null;
		} | null>;
		loadAllLocalTasks: () => Promise<Array<{ taskId?: string; deleted?: boolean }>>;
	};
	taskParser?: {
		convertTaskToLine: (task: ITask, parentTabs: number) => string | Promise<string>;
	};
};

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
	plugin: ConfirmRematchHost,
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

	// BUG-CONFIRM-REBIND-DUP: Confirm reclaim may Link-displace a same-title live
	// sibling marker (tombstone displaced id). Held Rematch leaves this off.
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
			convertTaskToLine: async (task, tabs) =>
				plugin.taskParser!.convertTaskToLine(task, tabs),
		},
		{ allLiveIds, allowDisplaceLiveSameTitle: true },
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
