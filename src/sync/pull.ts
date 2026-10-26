import { db } from "@/db/dexie";
import { resolveTaskConflict } from "./conflicts";
import { logSyncEvent } from "./journal";
import type { TickTickRestAPI } from '@/services/TicktickRestAPI';
import type { LocalTask, SyncMeta } from "@/db/schema";
import type { ITask } from '@/api/types/Task';
import { updateSettings } from '@/settings';
import { deleteCommentMapsForTask } from '@/db/taskCommentMaps';
import { deletionIdOf } from '@/sync/massDeleteGuard';
import log from '@/utils/logger';
import { addCount } from '@/sync/perf';
import { rememberPreMergeNoteBase } from '@/sync/preMergeNoteBase';
import { clearLocalLwwWins, markLocalLwwWin } from '@/sync/localLwwWin';

export interface PullApplyOptions {
	/** Default true. False leaves remote delete[] unapplied. */
	applyDeletions?: boolean;
	/** Default true. False leaves the checkpoint and meta where they were. */
	advanceCheckpoint?: boolean;
	/** Delta already fetched for the deletion guard. Skips a second getUpdatedTasks. */
	prefetched?: { update: ITask[]; delete: Array<string | { id?: string; taskId?: string }> };
	restoreCheckpoint?: number;
}

/** Resolve a task identifier that may appear as `id` or `taskId`. */
function resolveTaskId(task: { id?: string; taskId?: string }): string | undefined {
	return task.id || task.taskId;
}

/** Resolve a deletion entry that may be a string or an object with `id`/`taskId`. */
function resolveDeletionItem(item: string | { id?: string; taskId?: string }): string | null {
	return deletionIdOf(item);
}

export async function pullFromTickTick(
	ticktickRestApi: TickTickRestAPI,
	meta: SyncMeta,
	fullSync = true,
	options?: PullApplyOptions,
) {
	const applyDeletions = options?.applyDeletions !== false;
	const advanceCheckpoint = options?.advanceCheckpoint !== false;
	clearLocalLwwWins();

	const { update, delete: deletedIds } = options?.prefetched ?? await ticktickRestApi.getUpdatedTasks(
		fullSync ? 0 : meta.lastDeltaSync
	);
	addCount('tasksDelta', update.length);

	let applied = 0;

	// 1️⃣ Bulk fetch local tasks for all updates
	const remoteIds = update.map(rt => resolveTaskId(rt as { id?: string; taskId?: string })).filter((id): id is string => !!id);
	const localTasks = await db.tasks.where("taskId").anyOf(remoteIds).toArray();
	const localMap = new Map(localTasks.map(lt => [lt.taskId, lt]));

	const toPut: LocalTask[] = [];

	for (const rt of update) {
		const remoteId = resolveTaskId(rt);
		if (!remoteId) {
			log.warn("[TickTickSync] Invalid task in update", rt);
			continue;
		}

		const local = localMap.get(remoteId);
		const remoteUpdatedAt = rt.modifiedTime ? new Date(rt.modifiedTime).getTime() : Date.now();

		// Echo suppression uses etag, not modifiedTime. API edits often keep modifiedTime
		// and still change etag (docs/TICKTICK_DELTA_API.md §3.2). Skip only when we
		// already stored that etag. Missing etag is not an echo: apply the delta row.
		const remoteEtag = rt.etag;
		if (local && remoteEtag && local.task.etag === remoteEtag) {
			// TP-IDLE-ZERO-SWEEP / #62 slice 2: echo-skip must still backfill missing
			// commentCount (and etag is already present) so idle paths can skip GET.
			// Do not treat this as an applied content change.
			const remoteCount = (rt as ITask).commentCount;
			if (
				typeof local.task.commentCount !== 'number'
				&& typeof remoteCount === 'number'
			) {
				toPut.push({
					...local,
					task: { ...local.task, commentCount: remoteCount },
				});
			}
			continue;
		}

		// Ensure dateHolder is correctly merged with local task if available
		if (local) {
			// NOTE-BODY-2: vault merge needs pre-pull content; Dexie will hold remote next.
			rememberPreMergeNoteBase(remoteId, local.task.content);
			ticktickRestApi.plugin.dateMan?.addDateHolderToTask(rt, local.task);
		}

		const remoteLocalTask: LocalTask = {
			localId: local?.localId ?? `tt:${remoteId}`,
			taskId: remoteId,
			task: rt,
			updatedAt: remoteUpdatedAt,
			file: local?.file ?? "",
			source: "ticktick",
			deleted: rt.deleted === 1,
			lastVaultSync: local?.lastVaultSync
		};

		const { resolved, conflictDetected, winner } = resolveTaskConflict(local, remoteLocalTask);
		// Local body stays in Dexie. Vault reconcile rewrites a line whose hash differs.
		if (winner === 'local') markLocalLwwWin(resolved.taskId);
		if (conflictDetected) {
			logSyncEvent(meta.deviceId, "conflict:resolved", {
				taskId: resolved.taskId,
				winner,
				localUpdatedAt: local?.updatedAt ? new Date(local.updatedAt).toLocaleString() : undefined,
				remoteUpdatedAt: new Date(remoteUpdatedAt).toLocaleString()
			});
		}
		toPut.push(resolved);
		applied++;
	}

	if (toPut.length > 0) {
		const unique = Array.from(new Map(toPut.map(t => [t.localId, t])).values());
		if (unique.length !== toPut.length) {
			log.warn(`[TickTickSync] pull: deduplicated ${toPut.length - unique.length} duplicate tasks`);
		}
		await db.tasks.bulkPut(unique);
	}

	// 2️⃣ Handle deletions
	const deletionIds = deletedIds.map(taskIdOrObj => resolveDeletionItem(taskIdOrObj as string | { id?: string; taskId?: string })).filter((id): id is string => !!id && typeof id === 'string');

	if (applyDeletions && deletionIds.length > 0) {
		const localToDelete = await db.tasks.where("taskId").anyOf(deletionIds).toArray();
		const toUpdateDeletion: LocalTask[] = [];

		for (const local of localToDelete) {
			if (!local.deleted) {
				local.deleted = true;
				local.updatedAt = Date.now();
				toUpdateDeletion.push(local);
				applied++;
				await deleteCommentMapsForTask(local.taskId);
			}
		}

		if (toUpdateDeletion.length > 0) {
			await db.tasks.bulkPut(toUpdateDeletion);
		}
	}
	if (!advanceCheckpoint && typeof options?.restoreCheckpoint === 'number') {
		ticktickRestApi.checkpoint = options.restoreCheckpoint;
	}
	if (advanceCheckpoint) {
		if (fullSync) {
			await db.meta.update("sync", {
				lastFullSync: ticktickRestApi.checkpoint
			});
		} else {
			await db.meta.update("sync", {
				lastDeltaSync: ticktickRestApi.checkpoint
			});
		}
		// Persist checkpoint to data.json so it survives Dexie DB resets
		updateSettings({ checkPoint: ticktickRestApi.checkpoint }, { persist: false });
		await ticktickRestApi.plugin.saveSettings();
	}
	logSyncEvent(meta.deviceId, "pull:complete", { applied });

	return applied;
}
