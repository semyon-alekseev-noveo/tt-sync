/**
 * Vault line vs Dexie/TT reconcile helpers (#66).
 * Extracted from VaultSyncCoordinator — behavior unchanged.
 */
import type { App } from 'obsidian';
import { TFile } from 'obsidian';
import type { PluginContext } from '@/pluginContext';
import type { ITask } from '@/api/types/Task';
import type { ITaskComment } from '@/api/types/TaskComment';
import type { TaskCommentMap } from '@/db/schema';
import { getSettings } from '@/settings';
import { deletionConfirmMode } from '@/sync/massDeleteGuard';
import { syncFileMap, syncRead } from '@/sync/vault-io';
import { deferActiveFilePush } from '@/services/activeFilePush';
import {
	apiCommentsDifferFromVault,
	syncAbyssCommentsToTickTick,
	useAbyssCommentsApi,
	vaultHadSyncedCommentBullets,
} from '@/abyssCommentSync';
import { listCommentMapsForTask } from '@/db/taskCommentMaps';
import {
	remoteCommentKeysAheadOfVault,
	vaultCommentKeysAheadOfRemote,
	vaultHasDuplicateCommentKeys,
	vaultHasUnpushedCommentThreads,
} from '@/sync/comments';
import {
	abyssLinesToNote,
	extractAbyssCommentThreads,
	rewriteAbyssChildrenCollapsingCommentKeys,
	tickTickCommentMergeHint,
} from '@/abyssFormat';
import log from '@/utils/logger';
import { defineLocalLwwRewrite } from '@/sync/localLwwWin';

export interface VaultLineBehindDeps {
	app: App;
	plugin: PluginContext;
}

/** Attach API list + merge hint for vault write (TP-COMMENT-TT-DELETE F1). */
export function attachCommentPullState(
	remote: ITask,
	comments: ITaskComment[],
	maps: TaskCommentMap[],
	commentCount: number | undefined,
): void {
	Object.defineProperty(remote, '_apiComments', { value: comments, enumerable: false, configurable: true });
	Object.defineProperty(remote, '__ticktickComments', {
		value: tickTickCommentMergeHint(maps, comments, commentCount),
		enumerable: false,
		configurable: true,
	});
}


export interface VaultLineBehindOptions {
	/** This pull kept the local task. A hash mismatch rewrites the line from that task. */
	localLwwWin?: boolean;
}

/** Vault line differs from the Dexie copy. Idle sync does not call getTaskById (docs/TICKTICK_DELTA_API.md §3.2). */
export async function vaultLineBehindTask(
	deps: VaultLineBehindDeps,
	task: ITask,
	filePath: string,
	opts?: VaultLineBehindOptions,
): Promise<{ behind: boolean; task: ITask; localEdit: boolean; reason: string }> {
	const same = { behind: false, task, localEdit: false, reason: 'in-sync' };
	const file = deps.app.vault.getAbstractFileByPath(filePath);
	if (!(file instanceof TFile)) return same;
	const parser = deps.plugin.taskParser;
	if (!parser) return same;
	// Reconcile comment push/pull uses on-disk note text. An open editor buffer can omit
	// child comment lines while the task line still matches Dexie (test-11-12 pilot).
	let text: string;
	try {
		text = await syncRead(deps.app.vault, file);
	} catch {
		return same;
	}
	const fileMap = await syncFileMap(deps.app, deps.plugin, file, text);
	const lineIdx = fileMap.getTaskIndex(task.id);
	if (lineIdx < 0) return same;
	const taskRec = fileMap.getTaskRecord(task.id);
	const lineTask = await parser.convertLineToTask(
		taskRec.task, lineIdx, filePath, fileMap, taskRec,
	);
	if (!lineTask) return same;
	if (task.lineHash || opts?.localLwwWin) {
		let taskNotes = '';
		if (getSettings().syncNotes && taskRec.taskLines?.length) {
			taskNotes = useAbyssCommentsApi()
				? abyssLinesToNote(taskRec.taskLines)
				: (parser.getNoteString(taskRec, task.id) ?? '');
		}
		const hash = await parser.getLineHash((taskRec.task ?? '') + taskNotes);
		// RISK-PULL-WINS-LOCAL: the winning local task is the line to write.
		// A mismatch is a stale note, not a sticky local edit.
		if (opts?.localLwwWin && hash && hash !== (task.lineHash || '')) {
			defineLocalLwwRewrite(task);
			return { behind: true, task, localEdit: false, reason: 'local-lww-rewrite' };
		}
		if (hash && task.lineHash && hash !== task.lineHash) {
			// Twins alone can make hash ≠ lineHash while TT keys already match; do not
			// treat that as a sticky local-edit that skips vault rewrite (BUG-COMMENT-VAULT-DUP-KEY).
			const lines = taskRec.taskLines ?? [];
			if (
				useAbyssCommentsApi()
				&& vaultHasDuplicateCommentKeys(lines)
			) {
				const collapsedNotes = abyssLinesToNote(rewriteAbyssChildrenCollapsingCommentKeys(lines));
				const collapsedHash = await parser.getLineHash((taskRec.task ?? '') + collapsedNotes);
				if (collapsedHash !== task.lineHash) {
					return { behind: false, task, localEdit: true, reason: 'local-edit' };
				}
				// Fall through: collapse rewrite via behind + mergeAbyssBlock.
			} else {
				return { behind: false, task, localEdit: true, reason: 'local-edit' };
			}
		}
	}

	const fieldsDiffer = (remote: ITask) => {
		if (parser.isTitleChanged(lineTask, remote)
			|| parser.isStatusChanged(lineTask as unknown as Record<string, unknown>, remote as unknown as Record<string, unknown>)) {
			return true;
		}
		if (getSettings().syncNotes) {
			if (parser.areNotesChanged(lineTask.content ?? '', remote.content ?? '')) return true;
			if (parser.areNotesChanged(lineTask.desc ?? '', remote.desc ?? '')) return true;
		}
		return false;
	};

	const remote = task;
	let behind = fieldsDiffer(task);
	let reason = behind ? 'behind' : 'in-sync';
	const commentCount = (task as ITask & { commentCount?: number }).commentCount;
	const taskLines = taskRec.taskLines ?? [];
	const vaultThreads = extractAbyssCommentThreads(taskLines).length;
	const vaultDupKeys = vaultHasDuplicateCommentKeys(taskLines);
	const commentCountKnown = typeof commentCount === 'number';
	const commentCountMismatch = commentCountKnown && commentCount !== vaultThreads;
	const vaultHasUnmappedComments = vaultThreads > 0 && !commentCountKnown;
	// TP-IDLE-ZERO / docs/TICKTICK_DELTA_API.md §3.2: do not GET comments merely because
	// the vault already has threads. Probe only on count mismatch, unknown count with
	// vault threads, or stamp twins (vaultDupKeys). Matched count + clean keys → idle skip.
	const shouldProbeComments =
		commentCountMismatch || vaultHasUnmappedComments || vaultDupKeys;
	if (useAbyssCommentsApi() && remote.projectId && shouldProbeComments) {
		try {
			const comments = await deps.plugin.tickTickRestAPI?.getTaskComments(remote.projectId, remote.id);
			// BUG-COMMENT-GET-FAIL-OPEN: unknown remote → no create/delete/map decisions.
			if (comments === null || comments === undefined) {
				log.warn('vault comment lookup unknown; skipping comment reconcile', task.id);
				// Still rewrite vault twins via merge collapse without TT create/delete.
				if (vaultDupKeys) {
					behind = true;
					reason = 'vault-comment-dup-keys';
				}
			} else {
			const commentsNeedSync =
				apiCommentsDifferFromVault(taskLines, comments) || commentCountMismatch || vaultDupKeys;
			if (commentsNeedSync) {
				const mapsForProbe = await listCommentMapsForTask(remote.id);
				// Probe-only empty vault threads must not wipe TT (BUG-COMMENT-EMPTY-VAULT-WIPE).
				// Intentional clear goes through push.ts with obsidianRemovedCommentBullets.
				const vaultClearedMapsOnly = vaultThreads === 0 && vaultHadSyncedCommentBullets(mapsForProbe);
				const remoteAhead = remoteCommentKeysAheadOfVault(taskLines, comments);
				const vaultAhead = vaultCommentKeysAheadOfRemote(taskLines, comments);
				let pushedVaultComments = false;
				let vaultWantsPush = false;
				if (vaultClearedMapsOnly) {
					// Do not wipe from coordinator; let remoteAhead re-pull if TT still has comments.
					deferActiveFilePush(filePath);
				} else if (vaultAhead) {
					const maps = mapsForProbe;
					vaultWantsPush = vaultHasUnpushedCommentThreads(
						taskLines,
						comments,
						maps,
						commentCount,
					);
					if (vaultWantsPush) {
						try {
							pushedVaultComments = await syncAbyssCommentsToTickTick(
								deps.plugin.tickTickRestAPI,
								remote.id,
								remote.projectId,
								taskLines,
								remote.content,
								{ remoteCommentCount: commentCount },
							);
						} catch (e) {
							log.warn('vault-ahead comment push failed', task.id, e);
						}
						deferActiveFilePush(filePath);
					}
				}
				// BUG-COMMENT-BOTH-WAYS: TT-ahead must not skip vault-ahead push when both sides differ.
				// TP-COMMENT-TT-DELETE F1: behindComments must attach __ticktickComments (not only _apiComments)
				// so mergeAbyssBlock can strip; same hint as preparePersistNetwork.
				if (remoteAhead && deletionConfirmMode() !== 'skip') {
					behind = true;
					reason = 'behindComments';
					attachCommentPullState(remote, comments, mapsForProbe, commentCount);
				} else if (pushedVaultComments) {
					return { behind: false, task: remote, localEdit: true, reason: 'vault-comments-ahead' };
				} else if (vaultAhead && !vaultWantsPush && deletionConfirmMode() !== 'skip') {
					behind = true;
					reason = 'behindComments';
					attachCommentPullState(remote, comments, mapsForProbe, commentCount);
				} else if (vaultWantsPush && !pushedVaultComments) {
					// BUG-COMMENT-RECONCILE-UPDATE: no-op / failed POST must not report in-sync
					// while vault bullets are still missing from TickTick Comments.
					log.warn('vault-ahead comment push returned no changes', task.id);
					return { behind: false, task: remote, localEdit: true, reason: 'vault-comments-ahead' };
				} else if (vaultDupKeys) {
					// Keys match TT but vault still has wall-clock+ISO twins — merge rewrite
					// (BUG-COMMENT-VAULT-DUP-KEY). Do not POST/DELETE on TT.
					behind = true;
					reason = 'vault-comment-dup-keys';
					attachCommentPullState(remote, comments, mapsForProbe, commentCount);
				}
			}
			}
		} catch (e) {
			log.debug('vault comment lookup failed', task.id, e);
			if (vaultDupKeys) {
				behind = true;
				reason = 'vault-comment-dup-keys';
			}
		}
	}
	return { behind, task: remote, localEdit: false, reason };
}

