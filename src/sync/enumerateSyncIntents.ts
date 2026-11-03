/**
 * ARCH-SYNC #260 — shared Sync Intent enumerator for Synchronize and Check sync cache.
 * One classification dialect; Check is a rare full scan of the same planner, not a second wipe path.
 */
import {
	planRemoteCommentDeletions,
	planRemoteTaskDeletions,
	planVanishedListDeletions,
	planVaultCommentDeletions,
	planVaultTaskDeletions,
	shouldSkipOrphanVaultLineDelete,
	type DeletionAction,
	type LocalDeletionCandidate,
	type PlannedDeletion,
} from '@/sync/massDeleteGuard';
import {
	selectResidualDestructivePlanned,
	type PlannedDeletionLike,
} from '@/sync/syncIntent';

export interface EnumerateSyncIntentsInput {
	vaultTasks: readonly LocalDeletionCandidate[];
	presentIds: ReadonlySet<string>;
	untrustedFiles: ReadonlySet<string>;
	indexIncomplete: boolean;
	remoteDeleteIds: readonly string[];
	localById: ReadonlyMap<string, { title?: string; file?: string; deleted?: boolean }>;
	remoteAction: Extract<DeletionAction, 'detach' | 'mark-cancelled'>;
	vanishedProjects?: readonly { id: string }[] | undefined;
	vanishedLive?: readonly {
		taskId: string;
		deleted?: boolean;
		projectId?: string;
		title?: string;
		file?: string;
	}[];
	commentMaps?: readonly { taskId: string; ticktickCommentId: string; body: string }[];
	taskFile?: ReadonlyMap<string, string>;
	fileText?: ReadonlyMap<string, string>;
	remoteCommentUpdates?: readonly { id?: string; taskId?: string; commentCount?: number }[];
}

/**
 * Build the planned bag Synchronize uses for threshold / Sync discrepancies / Rematch.
 * Check sync cache must call the same function for classification (no second wipe dialect).
 */
export function enumerateSyncPlannedDeletions(input: EnumerateSyncIntentsInput): PlannedDeletion[] {
	const planned: PlannedDeletion[] = [
		...planVaultTaskDeletions({
			tasks: input.vaultTasks,
			presentIds: input.presentIds,
			untrustedFiles: input.untrustedFiles,
			indexIncomplete: input.indexIncomplete,
		}),
		...planRemoteTaskDeletions(input.remoteDeleteIds, input.localById, input.remoteAction),
	];
	if (input.vanishedProjects && input.vanishedLive) {
		planned.push(...planVanishedListDeletions(input.vanishedProjects, input.vanishedLive, input.remoteAction));
	}
	if (input.commentMaps && input.taskFile && input.fileText) {
		planned.push(...planVaultCommentDeletions({
			maps: input.commentMaps,
			taskFile: input.taskFile,
			fileText: input.fileText,
			untrustedFiles: input.untrustedFiles,
			indexIncomplete: input.indexIncomplete,
		}));
		if (input.remoteCommentUpdates) {
			planned.push(...planRemoteCommentDeletions(input.commentMaps, input.remoteCommentUpdates));
		}
	}
	return planned;
}

/**
 * Residual destructives that may be applied / shown in Sync discrepancies.
 * Empty Dexie / checkPoint 0 / bootstrap stay fail-closed (no invent / no wipe).
 */
export function residualDestructivesForApply<T extends PlannedDeletionLike>(
	planned: readonly T[],
	failClosed: { dexieTaskCount: number; checkPoint: number; syncBootstrapSkip?: boolean },
): T[] {
	if (shouldSkipOrphanVaultLineDelete(failClosed)) return [];
	return selectResidualDestructivePlanned(planned);
}
