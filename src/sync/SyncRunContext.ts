/**
 * Per-run state for one `synchronizationInner` execution.
 *
 * Goal: orchestration passes a single context through phase functions so
 * vault-io, push, pull, and lifecycle do not rely on scattered module globals.
 * Phase extraction PRs will take `SyncRunContext` as the first argument.
 */
import type { IProject } from '@/api/types/Project';
import type { GuardedPull } from '@/sync/deletionGuardRun';
import {
	isPendingMarkerTaskId,
	prunePendingMarkerTaskIds,
	registerPendingMarkerTaskId,
} from '@/sync/vault-io';
import type { SyncPerfTrigger } from '@/sync/perf';

/** Names match `timePhase` in `TickTickService.synchronizationInner`. */
export type SyncPhaseName =
	| 'prepare'
	| 'projects'
	| 'register'
	| 'deletionGuard'
	| 'push'
	| 'pull'
	| 'vaultReconcile'
	| 'subtasks'
	| 'syncFiles'
	| 'vaultDeletion'
	| 'activeFile';

export interface CreateSyncRunContextOptions {
	trigger: SyncPerfTrigger;
	fullSync: boolean;
	/** Redo journal prefix when a session is open; otherwise `sync-<id>`. */
	syncIdPrefix?: string;
}

export interface SyncRunContext {
	readonly syncId: string;
	readonly trigger: SyncPerfTrigger;
	readonly fullSync: boolean;
	readonly startedAt: number;

	/** `lastVaultPushWallMs` snapshot for this run's vault→TT push. */
	pushSinceMs: number;

	/** Projects loaded in the `projects` phase; used by deletionGuard and pull. */
	projects?: IProject[];

	/** Set by deletionGuard; consumed by pull. */
	guardedPull?: GuardedPull;

	/** File paths edited locally during push (subtask order). */
	locallyEdited: Set<string>;

	/** Task ids created/updated in TT before `%%[ticktick_id:: …]%%` is in the vault. */
	registerPendingMarker(taskId: string): void;
	isPendingMarker(taskId: string): boolean;
	reconcilePendingMarkers(
		present: (ids: string[]) => Promise<Map<string, string>>,
	): Promise<void>;

	resetLifecycle(): void;
}

let syncIdCounter = 0;

function nextSyncId(prefix: string): string {
	syncIdCounter += 1;
	return `${prefix}-${Date.now().toString(36)}-${syncIdCounter}`;
}

export function createSyncRunContext(options: CreateSyncRunContextOptions): SyncRunContext {
	const syncId = nextSyncId(options.syncIdPrefix ?? 'sync');
	const ctx: SyncRunContext = {
		syncId,
		trigger: options.trigger,
		fullSync: options.fullSync,
		startedAt: Date.now(),
		pushSinceMs: 0,
		guardedPull: undefined,
		locallyEdited: new Set(),

		registerPendingMarker(taskId: string) {
			registerPendingMarkerTaskId(taskId);
		},
		isPendingMarker(taskId: string) {
			return isPendingMarkerTaskId(taskId);
		},
		async reconcilePendingMarkers(present) {
			await prunePendingMarkerTaskIds(present);
		},
		resetLifecycle() {
			this.guardedPull = undefined;
		},
	};
	return ctx;
}
