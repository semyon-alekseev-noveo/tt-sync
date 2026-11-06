import { mayPushTickTickReactively } from '@/sync/syncEnabled';
import { fencedLines } from '@/utils/vaultIdScan';
import { abyssLinesToNote, isAbyssNoteLine } from '@/abyssFormat';
import { syncAbyssCommentsToTickTick, useAbyssCommentsApi } from '@/abyssCommentSync';
import { Notice, TFile } from 'obsidian';
import { NewFileMap } from '@/services/NewFileMap';
import { commitVaultText, readNoteForWrite } from '@/sync/vault-io';
import { getSettings } from '@/settings';
import { getAllProjects } from '@/db/projects';
import { stageNeedsPushDespiteHash } from '@/listMapping';
import { isPathInPushScope, normalizeSyncTag, resolveSyncedListIds, tickTickTaskEntersVault, vaultParentMeaningfullyChanged, type TaskSyncLimitOptions } from '@/syncScope';
import { formatTtGoneDetachNotice, shouldSkipOrphanVaultLineDelete } from '@/sync/massDeleteGuard';
import { shouldPreserveVaultLinesOnRemoteDelete } from '@/sync/historicalVaultMarkers';
import { detachInContent } from '@/detach';
import { markerName } from '@/taskParser';
import log from '@/utils/logger';
import type { TaskModificationDetector } from '@/sync/vault-push/taskModification/TaskModificationDetector';
import type { PendingTickTickDeletion } from '@/sync/vault-push/taskModification/types';

export type TaskModificationScanOptions = {
	skipLines?: ReadonlySet<number>;
	identifiedOnly?: boolean;
	pushSnapshot?: string;
	deferCommentSweep?: boolean;
	/** Sticky sync-run bootstrap skip (empty Dexie / post-Reset). */
	skipOrphanVaultLineDeletes?: boolean;
};

/** Scan vault lines/files for modifications and route into detect + push. */
export class TaskModificationScan {
	/**
	 * Check a line for task modifications
	 */
	async checkLineForModifications(
		this: TaskModificationDetector,
		filepath: string | undefined,
		lineText: string,
		lineNumber: number | undefined,
		fileMap: NewFileMap,
		pendingDeletions?: PendingTickTickDeletion[],
		pushLimit?: TaskSyncLimitOptions,
		options?: TaskModificationScanOptions,
	): Promise<boolean> {
		// BUG-SYNC-OFF-REACTIVE-CREATE: no tag/status push while master off (unless Synchronize).
		if (!mayPushTickTickReactively({ syncRunning: this.plugin.syncRunning })) {
			return false;
		}
		// Outside syncScopeFolders: no update, no completion, no deletion push.
		if (!isPathInPushScope(filepath)) {
			return false;
		}
		await this.plugin.projectScheme?.ensurePushContext?.();
		// Only process full tasks here.  taskParser.isTaskItem handles item
		// identification; note-level content is skipped entirely.
		const taskIdEarly = this.plugin.taskParser.getTickTickId(lineText) ?? '';
		if (taskIdEarly && this.plugin.projectScheme?.lineDuplicatesProjectParent?.(filepath!, taskIdEarly)) {
			return false;
		}

		if (!this.plugin.taskParser?.isLineTrackedForSync(lineText, filepath)) {
			// Not a full task — checkbox items update the parent item list.
			// An Abyss comment or description line is not a checkbox; push the parent task instead.
			if (lineNumber !== undefined) {
				const fileLines = fileMap.getFileLines().split('\n');
				for (let i = lineNumber - 1; i >= 0; i--) {
					const ancestorLine = fileLines[i];
					if (this.plugin.taskParser.isMarkdownTask(ancestorLine) && this.plugin.taskParser.hasTickTickId(ancestorLine)) {
						const ancestorTabs = this.plugin.taskParser.getNumTabs(ancestorLine);
						if (this.plugin.taskParser.isTaskItem(lineText, ancestorTabs)) {
							return await this.checkTaskItemModification(lineText, fileMap, lineNumber);
						}
						if (isAbyssNoteLine(lineText, ancestorLine)) {
							return await this.checkLineForModifications(
								filepath, ancestorLine, i, fileMap, pendingDeletions, pushLimit, options,
							);
						}
						break;
					}
				}
			}
			return false;
		}

		const taskId = this.plugin.taskParser.getTickTickId(lineText) ?? '';
		const taskRecord = fileMap.getTaskRecord(taskId);

		if (!taskRecord || !taskRecord.task) {
			log.error('Task not found in file map', taskId, filepath);
			return false;
		}

		// Get saved task from database
		const savedTask = await this.plugin.taskRepository.loadTaskById(taskId);
		if (savedTask) {
			if (this.plugin.projectScheme?.isParentTask(savedTask)) return false;
			if (pushLimit?.allowedListIds?.size && !tickTickTaskEntersVault(savedTask, pushLimit)) return false;
		}
		if (!savedTask) {
			// Task not in local DB — check TickTick API before deleting.
			// Handles the race where a file syncs to this device via external
			// sync before the pull phase fetched the task from TickTick.
			let remoteTask: Awaited<ReturnType<NonNullable<typeof this.plugin.tickTickRestAPI>['getTaskById']>> = null;
			try {
				remoteTask = await this.plugin.tickTickRestAPI?.getTaskById(taskId, undefined);
			} catch (e) {
				log.warn(`ID-TT-GONE-DETACH: getTaskById failed for ${taskId}; leave marker`, e);
				return false;
			}
			if (remoteTask) {
				log.warn(`Task ${taskId} not in local DB but exists on TickTick. Importing.`);
				await this.plugin.taskRepository.upsertTask(remoteTask, filepath, Date.now());
				return false;
			}

			// BUG-RESET-CACHE-DELETE: never Confirm-wipe / deleteTaskFromSpecificFile
			// for vault lines after empty Dexie / post-Reset.
			// BUG-GHOST-MARKER-AFTER-RESET / ID-TT-GONE-DETACH (#215/#290): vault-only
			// marker + TT absent → detach (%%tt-detached%%, text kept). Never invent TT;
			// never leave a fake-live marker that blocks create.
			const dexieTaskCount = await this.plugin.taskRepository.getTaskCount();
			const resetBootstrap = shouldSkipOrphanVaultLineDelete({
				dexieTaskCount,
				checkPoint: getSettings().checkPoint ?? 0,
				syncBootstrapSkip: options?.skipOrphanVaultLineDeletes,
			});
			const hist = shouldPreserveVaultLinesOnRemoteDelete(filepath);
			log.warn(
				`${resetBootstrap ? 'BUG-GHOST-MARKER-AFTER-RESET' : 'ID-TT-GONE-DETACH'}: ` +
					`detach vault-only gone ${taskId} in ${filepath}` +
					(hist ? ' (historical path)' : ''),
			);
			try {
				const mapIdx = fileMap.getTaskIndex(taskId);
				const f = this.app.vault.getAbstractFileByPath(filepath!);
				if (f instanceof TFile) {
					const snapshot = await readNoteForWrite(this.app, f);
					const next = detachInContent(snapshot, taskId, markerName());
					if (next && next !== snapshot) {
						await commitVaultText(this.app, f, snapshot, next);
						if (mapIdx >= 0) {
							const detachedLine = next.split('\n')[mapIdx];
							if (detachedLine) fileMap.modifyTask(detachedLine, mapIdx);
						}
						if (getSettings().onTickTickDeletion === 'ask') {
							new Notice(formatTtGoneDetachNotice(1), 10000);
						}
					}
				}
				await this.plugin.fileMetadataService?.clearTaskFile?.(taskId);
				await this.plugin.taskRepository.deleteTask?.(taskId);
			} catch (e) {
				log.warn(`BUG-GHOST-MARKER-AFTER-RESET: detach failed for ${taskId}`, e);
			}
			return false;
		}

		// Calculate hash for change detection (Abyss often has exactly one `- >` child line)
		let taskNotes = '';
		if (getSettings().syncNotes && taskRecord.taskLines && taskRecord.taskLines.length > 0) {
			if (useAbyssCommentsApi()) {
				taskNotes = abyssLinesToNote(taskRecord.taskLines);
			} else {
				taskNotes = this.plugin.taskParser.getNoteString(taskRecord, taskId);
			}
		}
		const newHash = await this.plugin.taskParser?.getLineHash(lineText + taskNotes);

		// Check if hash matches (no changes)
		if (savedTask.lineHash && newHash === savedTask.lineHash) {
			// Check for moves
			const moveCheck = await this.checkForTaskMove(taskId, filepath!);
			// TP-IDLE-BYID-ZERO: empty vault parent vs Dexie scheme parent is not a real edit.
			const schemeParentForFile = filepath
				? this.plugin.projectScheme?.resolveForFile?.(filepath)?.parentId
				: undefined;
			const parentChanged = vaultParentMeaningfullyChanged(
				taskRecord.parentId,
				savedTask.parentId,
				{ schemeParentForFile },
			);

			if (!moveCheck.moved && !parentChanged) {
				const lineTask = await this.plugin.taskParser?.convertLineToTask(
					lineText, lineNumber!, filepath!, fileMap, taskRecord,
				);
				if (lineTask && await this.skipPushWhenTickTickRenamedVaultLine(lineTask, savedTask, taskId, filepath!)) {
					return false;
				}
				// AF-GTD-TAG-ADD: lineHash can match while dual stage tags still need a list
				// move / vault rewrite (e.g. hash updated after a skipped move).
				const stageTags = this.plugin.taskParser?.getAllTagsFromLineText(lineText) ?? [];
				const stageStuck = stageNeedsPushDespiteHash(
					stageTags,
					getSettings().tagListMappings,
					lineTask?.projectId,
					savedTask.projectId,
				);
				if (!stageStuck) {
					// Comments API on hash-unchanged:
					// - identifiedOnly (open-note debounce): only when a comment line
					//   changed the hash (hash-mismatch path) — skip here.
					// - Full-file check with deferCommentSweep: `sweepAbyssCommentsInFile`
					//   owns BUG-COMMENT-NO-PUSH (slice 4 — avoid double GET).
					// - Single-line / inline parent walk: sync here (no file sweep follows).
					if (
						useAbyssCommentsApi()
						&& savedTask.projectId
						&& !options?.identifiedOnly
						&& !options?.deferCommentSweep
					) {
						const lines = taskRecord.taskLines ?? [];
						const runCommentSync = true;
						if (runCommentSync) {
							try {
								await syncAbyssCommentsToTickTick(
									this.plugin.tickTickRestAPI,
									taskId,
									savedTask.projectId,
									lines,
									savedTask.content,
									{ remoteCommentCount: savedTask.commentCount },
								);
							} catch (e) {
								log.warn('Abyss comment API sync failed (hash unchanged)', taskId, e);
							}
						}
					}

					// Task hasn't changed, ensure sync timestamps are current
					const localTask = await this.plugin.taskRepository.loadLocalTaskById(taskId);
					if (localTask && (!localTask.lastVaultSync || localTask.lastVaultSync < localTask.updatedAt || !localTask.file)) {
						await this.plugin.taskRepository.upsertTask(localTask.task, filepath, Date.now());
					}
					return false;
				}
			}
		}

		// Convert line to task object
		const lineTask = (await this.plugin.taskParser?.convertLineToTask(lineText, lineNumber!, filepath!, fileMap, taskRecord));

		// If TickTick already has a genuine "ticktick" tag on this task, keep
		// it so comparisons/updates don't silently strip it (see
		// TaskParser.preserveTickTickTag).
		this.plugin.taskParser?.preserveTickTickTag(lineTask, savedTask);

		// Ensure task has required fields
		if (!savedTask.dateHolder) {
			this.plugin.dateMan?.addDateHolderToTask(savedTask, undefined);
			await this.plugin.taskRepository.upsertTask(savedTask, undefined, Date.now());
		}
		if (!savedTask.lineHash) {
			savedTask.lineHash = newHash!;
		}

		// Detect what changed
		const modifications = this.detectModifications(lineTask, savedTask, taskRecord);

		return await this.applyModifications(lineTask, savedTask, modifications, filepath!, taskId, newHash ?? '', taskRecord, options?.pushSnapshot);
	}

	/**
	 * Check entire file for modifications
	 */
	async checkFileForModifications(
		this: TaskModificationDetector,
		filepath: string | null,
		pendingDeletions?: PendingTickTickDeletion[],
		options?: TaskModificationScanOptions,
	): Promise<void> {
		// BUG-SYNC-OFF-REACTIVE-CREATE: open-note / pre-pull push while master off.
		if (!mayPushTickTickReactively({ syncRunning: this.plugin.syncRunning })) {
			return;
		}
		if (!filepath || !isPathInPushScope(filepath)) {
			return;
		}

		const file = this.app.vault.getAbstractFileByPath(filepath);
		if (!(file instanceof TFile)) {
			return;
		}

		let pushSnapshot: string | undefined;
		try {
			pushSnapshot = await readNoteForWrite(this.app, file);
		} catch (error) {
			log.debug('push snapshot failed', filepath, error);
		}
		// Slice 4: when we will sweep the whole file, skip per-line comment sync
		// on the hash-unchanged path (avoids 2× getTaskComments per task).
		const lineOptions = {
			...options,
			pushSnapshot,
			deferCommentSweep: !options?.identifiedOnly,
		};

		await this.plugin.projectScheme?.ensurePushContext?.();

		const fileMap = new NewFileMap(this.app, this.plugin, file);
		await fileMap.init();

		const lists = await getAllProjects();
		const pushLimit: TaskSyncLimitOptions = {
			syncTag: normalizeSyncTag(getSettings().SyncTag),
			syncProject: getSettings().SyncProject?.trim() || undefined,
			andOr: getSettings().tagAndOr,
			allowedListIds: resolveSyncedListIds(getSettings().syncedLists ?? [], lists),
		};

		const lines: string[] = fileMap.getFileLines().split('\n');
		const fenced = fencedLines(lines);

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			if (fenced.has(i)) continue; // code-block examples are not tasks
			if (options?.skipLines?.has(i)) continue;
			// Debounced push of the open note must not treat a half-typed new checkbox as a deletion.
			if (options?.identifiedOnly && !this.plugin.taskParser?.hasTickTickId(line)) continue;
			if (this.plugin.taskParser?.isMarkdownTask(line)) {
				try {
					await this.checkLineForModifications(filepath, line, i, fileMap, pendingDeletions, pushLimit, lineOptions);
				} catch (error) {
					log.error('Error checking task modification:', error);
				}
			}
		}
		// The debounced open-note push must not sweep every task. A changed comment line
		// already reaches the Comments API through that line's hash.
		if (!options?.identifiedOnly) {
			await this.sweepAbyssCommentsInFile(filepath, fileMap, pushLimit);
		}
	}

	/** BUG-COMMENT-NO-PUSH: push Comments API for every synced task in the file, not only lines that triggered hash diff. */
	async sweepAbyssCommentsInFile(
		this: TaskModificationDetector,
		filepath: string,
		fileMap: NewFileMap,
		pushLimit: TaskSyncLimitOptions,
	): Promise<void> {
		if (!useAbyssCommentsApi()) return;
		const lines = fileMap.getFileLines().split('\n');
		const fenced = fencedLines(lines);
		for (let i = 0; i < lines.length; i++) {
			if (fenced.has(i)) continue;
			const line = lines[i];
			if (!this.plugin.taskParser?.isMarkdownTask(line)) continue;
			const taskId = this.plugin.taskParser.getTickTickId(line);
			if (!taskId) continue;
			const taskRecord = fileMap.getTaskRecord(taskId);
			if (!taskRecord) continue;
			const savedTask = await this.plugin.taskRepository.loadTaskById(taskId);
			if (!savedTask?.projectId) continue;
			// Empty syncedLists → allowedListIds size 0, so this does not skip.
			// Vault reconcile still skips (allowVaultUpdate): TT-delete strip needs the
			// list on syncedLists. Push must not re-POST a comment already linked (#104).
			if (pushLimit.allowedListIds?.size && !tickTickTaskEntersVault(savedTask, pushLimit)) continue;
			let taskNotes = '';
			if (getSettings().syncNotes && taskRecord.taskLines?.length) {
				taskNotes = useAbyssCommentsApi()
					? abyssLinesToNote(taskRecord.taskLines)
					: (this.plugin.taskParser.getNoteString(taskRecord, taskId) ?? '');
			}
			const newHash = await this.plugin.taskParser?.getLineHash(taskRecord.task + taskNotes);
			try {
				const commentOpts = await this.abyssCommentSyncOptions(
					taskId,
					taskRecord.taskLines ?? [],
					savedTask.lineHash,
					newHash ?? '',
				);
				await syncAbyssCommentsToTickTick(
					this.plugin.tickTickRestAPI,
					taskId,
					savedTask.projectId,
					taskRecord.taskLines ?? [],
					savedTask.content,
					{ ...commentOpts, remoteCommentCount: savedTask.commentCount },
				);
			} catch (e) {
				log.warn('Abyss comment sweep failed', taskId, filepath, e);
			}
		}
	}
}
