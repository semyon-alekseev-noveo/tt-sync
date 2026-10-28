import { Notice, TFile } from 'obsidian';
import type { ITask } from '@/api/types/Task';
import { db } from '@/db/dexie';
import { MassDeleteGuardModal } from '@/modals/MassDeleteGuardModal';
import { getSettings } from '@/settings';
import {
	deletionConfirmModeOf,
	evaluateMassDeleteGuard,
	formatDeletionReport,
	guardDecisionRecord,
	guardNotice,
	isEmptyTickTickSnapshot,
	looksLikeTickTickWipe,
	massDeleteSettingsFrom,
	planRemoteCommentDeletions,
	planRemoteTaskDeletions,
	planVanishedListDeletions,
	planVaultCommentDeletions,
	planVaultTaskDeletions,
	pullOptionsForMode,
	rematchCandidates,
	setGuardRun,
	settleGuardChoice,
	writeDeletionReport,
	deletionIdOf,
	type DeletionAction,
	type GuardChoice,
	type GuardRunState,
	type PlannedDeletion,
	type SyncRunTrigger,
} from '@/sync/massDeleteGuard';
import { scanVaultForDeletionGuard } from '@/sync/vaultDeletionScan';
import { isPathInPushScope } from '@/syncScope';
import log from '@/utils/logger';
import type { TickTickRestAPI } from '@/services/TicktickRestAPI';
import type { PluginContext } from '@/pluginContext';

export interface GuardedPull {
	applyDeletions: boolean;
	advanceCheckpoint: boolean;
	prefetched?: { update: ITask[]; delete: string[] };
	restoreCheckpoint?: number;
	/** BUG-208-REMATCH: write these Dexie tasks back into vault lines (no TT delete). */
	rematch?: PlannedDeletion[];
}

export async function prepareDeletionGuard(
	plugin: PluginContext,
	api: TickTickRestAPI,
	trigger: SyncRunTrigger,
	fullSync: boolean,
	projects: { id: string }[] | undefined,
): Promise<GuardedPull> {
	const settings = massDeleteSettingsFrom(getSettings());
	const previousCheckpoint = api.checkpoint;
	if (!settings.enabled) {
		const decision = evaluateMassDeleteGuard([], {
			vaultTrackedCount: 0,
			dexieTaskCount: 0,
			ticktickSnapshotEmpty: false,
			vaultIndexIncomplete: false,
		}, settings);
		setGuardRun({ trigger, decision, choice: 'allow', planned: [], mode: 'normal' });
		return { applyDeletions: true, advanceCheckpoint: true };
	}

	const since = fullSync ? 0 : (await db.meta.get('sync'))?.lastDeltaSync ?? 0;
	const [scan, locals, maps, delta] = await Promise.all([
		scanVaultForDeletionGuard(plugin.app),
		db.tasks.toArray(),
		db.taskCommentMaps.toArray().catch(() => []),
		api.getUpdatedTasks(since),
	]);
	const live = locals.filter(row => !row.deleted && row.taskId);
	const dexieTaskCount = live.length;
	const deleteIds = (delta.delete ?? []).map(deletionIdOf).filter((id): id is string => !!id);
	const ticktickSnapshotEmpty = isEmptyTickTickSnapshot(fullSync, since, delta.update.length)
		|| looksLikeTickTickWipe({
			updateCount: delta.update.length,
			deleteCount: deleteIds.length,
			dexieTaskCount,
			taskCountThreshold: settings.taskCountThreshold,
			taskPercentThreshold: settings.taskPercentThreshold,
		});
	const remoteAction: DeletionAction = getSettings().onTickTickDeletion === 'cancel' ? 'detach' : 'mark-cancelled';
	const localById = new Map(live.map(row => [row.taskId, {
		title: row.task?.title,
		file: row.file,
		deleted: row.deleted,
	}]));
	const taskFile = new Map<string, string>();
	for (const row of live) if (row.file) taskFile.set(row.taskId, row.file);
	const planned: PlannedDeletion[] = [
		...planVaultTaskDeletions({
			tasks: live.map(row => ({
				taskId: row.taskId,
				title: row.task?.title,
				file: row.file,
				deleted: row.deleted,
				isParent: plugin.projectScheme?.isParentTask(row.task) || plugin.projectScheme?.isParentId(row.taskId),
				tags: row.task?.tags,
				inPushScope: row.file ? isPathInPushScope(row.file) : false,
			})),
			presentIds: scan.presentIds,
			untrustedFiles: scan.untrustedFiles,
			indexIncomplete: scan.incomplete,
		}),
		...planRemoteTaskDeletions(deleteIds, localById, remoteAction),
		...planVanishedListDeletions(projects, live.map(row => ({
			taskId: row.taskId,
			deleted: row.deleted,
			projectId: row.task?.projectId,
			title: row.task?.title,
			file: row.file,
		})), remoteAction),
		...planVaultCommentDeletions({
			maps,
			taskFile,
			fileText: scan.fileText,
			untrustedFiles: scan.untrustedFiles,
			indexIncomplete: scan.incomplete,
		}),
		...planRemoteCommentDeletions(maps, delta.update),
	];
	const decision = evaluateMassDeleteGuard(planned, {
		vaultTrackedCount: scan.trackedCount,
		dexieTaskCount,
		ticktickSnapshotEmpty,
		vaultIndexIncomplete: scan.incomplete,
	}, settings);

	let choice: GuardChoice = 'allow';
	let reportPath: string | undefined;
	if (decision.block) {
		const now = new Date();
		choice = await settleGuardChoice(trigger, decision, () => new MassDeleteGuardModal(
			plugin.app,
			decision,
			planned,
			settings.previewCount,
		).show());
		const checkpoint = choice === 'apply-once' ? 'advanced' as const : 'held' as const;
		const markdown = formatDeletionReport({
			now,
			trigger,
			choice,
			decision,
			planned,
			vaultTrackedCount: scan.trackedCount,
			checkpoint,
		});
		try {
			const adapter = plugin.app.vault.adapter as {
				exists(path: string): Promise<boolean>;
				mkdir(path: string): Promise<void>;
				append(path: string, data: string): Promise<void>;
			};
			reportPath = await writeDeletionReport(adapter, markdown, now);
		} catch (error) {
			log.error('TickTickSync: could not write the deletion report', error);
		}
		try {
			if (plugin.redo && reportPath) {
				const id = await plugin.redo.begin(guardDecisionRecord({ reportPath, decision, choice }));
				await plugin.redo.commit(id);
			}
		} catch (error) {
			log.error('TickTickSync: could not record the deletion-guard decision', error);
		}
		new Notice(guardNotice(decision, choice), 10000);
		if (choice === 'open-report' && reportPath) await openReport(plugin, reportPath);
	}

	const mode = deletionConfirmModeOf(choice, decision.block);
	const pull = pullOptionsForMode(mode);
	const rematch = choice === 'rematch' ? rematchCandidates(planned) : undefined;
	const run: GuardRunState = { trigger, decision, choice, planned, reportPath, mode, rematch };
	setGuardRun(run);
	if (!pull.advanceCheckpoint) api.checkpoint = previousCheckpoint;
	return {
		...pull,
		prefetched: delta,
		restoreCheckpoint: previousCheckpoint,
		rematch,
	};
}

async function openReport(plugin: PluginContext, path: string): Promise<void> {
	try {
		const file = plugin.app.vault.getAbstractFileByPath(path);
		if (file instanceof TFile) {
			await plugin.app.workspace.getLeaf(true).openFile(file);
			return;
		}
	} catch (error) {
		log.warn('TickTickSync: could not open the deletion report', error);
	}
	new Notice(`TickTickSync: deletion report written to ${path}`, 10000);
}
