import { Notice, TFile } from 'obsidian';
import type { SyncPhaseDeps } from '@/sync/phases/types';
import { rebindVaultFromPlanned } from '@/sync/rebindVault';
import {
	compileResidualDestructivesAfterIdentity,
	stampLinkTombstones,
} from '@/sync/syncIntent';
import { getGuardRun, setGuardRun } from '@/sync/massDeleteGuard';
import { scanVaultForDeletionGuard } from '@/sync/vaultDeletionScan';
import { commitVaultText, syncRead } from '@/sync/vault-io';
import log from '@/utils/logger';

/**
 * ARCH-SYNC #257 — identity/Link pass (проход идентичности до удалений) wired
 * into the existing Rematch/Rebind authority:
 * after pull (Dexie current), if the owner chose Rematch on the held modal:
 * rewrite stale markers by title, insert only missing lines, stamp Link
 * tombstones (пометка вытесненного id) for displaced markers, re-scan
 * `presentIds`, and compile residual destructives (without false PushDeleteTT).
 *
 * No TT deletes; no Comments/updateTask add path.
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

	// Full live Dexie set so Link does not treat another live marker as stale.
	const allLiveIds = new Set<string>();
	try {
		const locals = await plugin.taskRepository.loadAllLocalTasks();
		for (const row of locals) {
			if (!row.deleted && row.taskId) allLiveIds.add(row.taskId);
		}
	} catch (error) {
		log.warn('TickTickSync rebind: could not load full live id set; using rematch set only', error);
		for (const item of planned) {
			const id = item.taskId ?? item.id;
			if (id) allLiveIds.add(id);
		}
	}

	const result = await rebindVaultFromPlanned(
		planned,
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
					log.warn(`TickTickSync rebind: deferred write for ${path}`);
				}
			},
			convertTaskToLine: (task, tabs) => plugin.taskParser!.convertTaskToLine(task, tabs),
		},
		{ allLiveIds },
	);

	// Link tombstones: displaced ids must not become Confirm / PushDeleteTT this run.
	stampLinkTombstones(result.displacedIds, 'rewrite');

	// Re-scan presentIds after identity; residual plan drops linked + tombstoned wipe rows.
	try {
		const scan = await scanVaultForDeletionGuard(plugin.app);
		const run = getGuardRun();
		if (run?.planned?.length) {
			const residual = compileResidualDestructivesAfterIdentity(run.planned, scan.presentIds);
			setGuardRun({
				...run,
				planned: residual,
				rematch: undefined,
			});
			log.info(
				`TickTickSync identity: residual planned ${residual.length} `
					+ `(was ${run.planned.length}); link tombstones=${result.displacedIds.length}`,
			);
		}
	} catch (error) {
		log.warn('TickTickSync identity: post-Link residual compile failed', error);
	}

	log.info(
		`TickTickSync rebind: wrote ${result.written} (rebound ${result.rebound}, inserted ${result.inserted}) `
			+ `in ${result.files} file(s), skipped ${result.skipped}`
			+ (result.displacedIds.length ? `, displaced ${result.displacedIds.length}` : ''),
	);
	new Notice(
		`TickTickSync: rebound ${result.rebound}, inserted ${result.inserted} in ${result.files} note(s)`
			+ (result.skipped ? ` (${result.skipped} skipped)` : '')
			+ '. TickTick was not wiped.',
		10000,
	);
}
