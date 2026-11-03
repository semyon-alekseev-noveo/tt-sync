import { Notice, TFile } from 'obsidian';
import type { SyncPhaseDeps } from '@/sync/phases/types';
import { rebindVaultFromPlanned } from '@/sync/rebindVault';
import {
	applyDetachMarkerPlanned,
	withoutDetachMarkerPlanned,
} from '@/sync/applyDetachMarkers';
import {
	compileResidualDestructivesAfterIdentity,
	stampLinkTombstones,
} from '@/sync/syncIntent';
import { getGuardRun, setGuardRun } from '@/sync/massDeleteGuard';
import { scanVaultForDeletionGuard } from '@/sync/vaultDeletionScan';
import { commitVaultText, syncRead } from '@/sync/vault-io';
import { markerName } from '@/taskParser';
import log from '@/utils/logger';

/**
 * ARCH-SYNC #257/#258 — identity/Link pass (проход идентичности до удалений)
 * + DetachMarker drain (снять id, текст оставить) for remote-gone holds.
 *
 * If the owner chose Rematch on the held modal (`guardedPull.rematch` defined,
 * even when the Link candidate list is empty):
 * - rewrite/insert Link rows when candidates exist
 * - stamp Link tombstones (пометка вытесненного id)
 * - apply DetachMarker for remote-gone so detach-heavy holds do not re-loop
 * - re-scan `presentIds` and compile residual destructives (PushDeleteTT only)
 *
 * No TT task wipes; writes via `commitVaultText` (TP-NO-WHOLE-NOTE-WRITE).
 */
export async function runRematchPhase(deps: SyncPhaseDeps): Promise<void> {
	const { plugin, ui, ctx } = deps;
	// rematch: [] still means Rematch was chosen (Link candidates may be empty).
	const rematchLink = ctx.guardedPull?.rematch;
	if (rematchLink === undefined) return;

	ui.setFullStep('Rebinding vault markers from TickTick…');

	let displacedIds: string[] = [];
	let rebound = 0;
	let inserted = 0;
	let skippedLink = 0;
	let files = 0;

	if (rematchLink.length) {
		if (!plugin.taskRepository?.loadLocalTaskById || !plugin.taskParser?.convertTaskToLine) {
			log.error('TickTickSync rebind: taskRepository/taskParser missing');
			new Notice('TickTickSync: rebind failed (no task reader).', 8000);
			return;
		}

		const allLiveIds = new Set<string>();
		try {
			const locals = await plugin.taskRepository.loadAllLocalTasks();
			for (const row of locals) {
				if (!row.deleted && row.taskId) allLiveIds.add(row.taskId);
			}
		} catch (error) {
			log.warn('TickTickSync rebind: could not load full live id set; using rematch set only', error);
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
						log.warn(`TickTickSync rebind: deferred write for ${path}`);
					}
				},
				convertTaskToLine: (task, tabs) => plugin.taskParser!.convertTaskToLine(task, tabs),
			},
			{ allLiveIds },
		);
		displacedIds = result.displacedIds;
		rebound = result.rebound;
		inserted = result.inserted;
		skippedLink = result.skipped;
		files = result.files;
		stampLinkTombstones(displacedIds, 'rewrite');
	}

	// #258 — DetachMarker (снять id, текст оставить) drains remote-gone hold rows.
	let detachApplied = 0;
	let detachSkipped = 0;
	try {
		const run = getGuardRun();
		const detachSource = run?.planned?.length ? run.planned : [];
		if (detachSource.length && plugin.fileMetadataService && plugin.taskRepository) {
			const detachResult = await applyDetachMarkerPlanned(
				{
					app: plugin.app,
					markerName: markerName(),
					clearTaskFile: (id) => plugin.fileMetadataService!.clearTaskFile(id),
					deleteTask: (id) => plugin.taskRepository!.deleteTask(id),
				},
				detachSource,
			);
			detachApplied = detachResult.applied;
			detachSkipped = detachResult.skipped;
		}
	} catch (error) {
		log.warn('TickTickSync DetachMarker drain failed', error);
	}

	try {
		const scan = await scanVaultForDeletionGuard(plugin.app);
		const run = getGuardRun();
		if (run?.planned?.length) {
			const afterIdentity = compileResidualDestructivesAfterIdentity(run.planned, scan.presentIds);
			// DetachMarker applied above — drop from residual so next Sync does not re-hold.
			const residual = withoutDetachMarkerPlanned(afterIdentity);
			setGuardRun({
				...run,
				planned: residual,
				rematch: undefined,
			});
			log.info(
				`TickTickSync identity: residual planned ${residual.length} `
					+ `(was ${run.planned.length}); link tombstones=${displacedIds.length}; `
					+ `DetachMarker applied=${detachApplied}`,
			);
		}
	} catch (error) {
		log.warn('TickTickSync identity: post-Link residual compile failed', error);
	}

	if (rematchLink.length) {
		log.info(
			`TickTickSync rebind: wrote ${rebound + inserted} (rebound ${rebound}, inserted ${inserted}) `
				+ `in ${files} file(s), skipped ${skippedLink}`
				+ (displacedIds.length ? `, displaced ${displacedIds.length}` : ''),
		);
	}
	new Notice(
		`TickTickSync: rebound ${rebound}, inserted ${inserted}`
			+ (files ? ` in ${files} note(s)` : '')
			+ (skippedLink ? ` (${skippedLink} Link skipped)` : '')
			+ (detachApplied ? `; detached ${detachApplied} gone-from-TT marker(s)` : '')
			+ (detachSkipped ? ` (${detachSkipped} DetachMarker skipped)` : '')
			+ '. TickTick was not wiped.',
		10000,
	);
}
