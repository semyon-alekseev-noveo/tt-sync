import { nextOccurrence, rollRecurringLines } from '@/recurrence';
import { fencedLines } from '@/utils/vaultIdScan';
import { mergeTask, conflictNote } from '@/merge3';
import { extractAbyssCommentThreads, stripLegacyCommentsBlock } from '@/abyssFormat';
import { syncAbyssCommentsToTickTick, useAbyssCommentsApi, type AbyssCommentSyncOptions } from '@/abyssCommentSync';
import { listCommentMapsForTask } from '@/db/taskCommentMaps';
import { appendContextTags, dedupeTags, stripInjectedContextTags } from '@/contextTags';
import { Notice, TFile } from 'obsidian';
import type { ITask } from '@/api/types/Task';
import type { LocalTask } from '@/db/schema';
import type { ITaskItemRecord, ITaskRecord, NewFileMap } from '@/services/NewFileMap';
import { commitVaultText, readNoteForWrite } from '@/sync/vault-io';
import { getSettings } from '@/settings';
import { rewriteLineExclusiveStage } from '@/listMapping';
import { listMoveSource } from '@/syncScope';
import log from '@/utils/logger';
import ObjectID from 'bson-objectid';
import type { TaskModificationDetector } from '@/sync/vault-push/taskModification/TaskModificationDetector';
import type { TaskModifications } from '@/sync/vault-push/taskModification/types';

/** Apply detected vault→TickTick changes (API update, moves, status, items, comments). */
export class TaskModificationPush {
	/**
	 * Apply detected modifications
	 */
	async applyModifications(
		this: TaskModificationDetector,
		lineTask: ITask,
		savedTask: ITask,
		modifications: TaskModifications,
		filepath: string,
		taskId: string,
		newHash: string,
		taskRecord: ITaskRecord,
		pushSnapshot?: string,
	): Promise<boolean> {
		let modified = false;

		// Preserve timezone
		lineTask.timeZone = savedTask.timeZone;

		// Check for project move
		const moveCheck = await this.checkForTaskMove(taskId, filepath);
		if (moveCheck.moved) {
			await this.handleProjectMove(lineTask, savedTask, moveCheck.oldFilePath, filepath);
			modifications.projectMoved = true;
			modified = true;

			// Immediately persist the new file mapping to DB so subsequent API
			// failures don't leave the local record stale, preventing a sync loop.
			lineTask.lineHash = newHash;
			await this.plugin.taskRepository.upsertTask(lineTask, filepath, Date.now());
		}

		// List move: probe TickTick only when the line and Dexie disagree on list
		// (TP-IDLE-BYID-ZERO). Same projectId → no getTaskById on quiet applyModifications.
		// Residual: local already updated to destination while TT still has the old list
		// (failed prior move) is not covered until another field edit — see #98.
		if (
			!modifications.projectMoved
			&& lineTask.projectId
			&& lineTask.projectId !== savedTask.projectId
		) {
			let remoteProject: string | undefined;
			try {
				const remote = await this.plugin.tickTickRestAPI?.getTaskById(taskId, undefined);
				remoteProject = remote?.projectId;
			} catch (e) { log.warn('list move lookup failed', e); }
			const from = listMoveSource(remoteProject, savedTask.projectId, lineTask.projectId);
			if (from) {
				const moved = await this.plugin.tickTickRestAPI?.moveTaskProject(lineTask, from, lineTask.projectId);
				if (moved) {
					savedTask.projectId = lineTask.projectId;
					modified = true;
				} else {
					log.error(`List move failed for ${taskId}: ${from} -> ${lineTask.projectId}`);
					lineTask.projectId = from;
				}
			}
		}

		// Handle parent change (project-scheme children must land on the projects list, not inbox)
		if (modifications.parentIdModified) {
			if (lineTask.projectId && savedTask.projectId && lineTask.projectId !== savedTask.projectId) {
				await this.plugin.tickTickRestAPI?.moveTaskProject(lineTask, savedTask.projectId, lineTask.projectId);
			}
			await this.handleParentChange(lineTask, savedTask, taskId);
			modified = true;
		}

		// Handle status change (complete/incomplete)
		if (modifications.statusModified) {
			await this.handleStatusChange(lineTask, filepath);
			modified = true;
		}

		// Update task if any content changed
		if (this.hasContentChanges(modifications)) {
			if (await this.skipPushWhenTickTickRenamedVaultLine(lineTask, savedTask, taskId, filepath)) {
				return false;
			}
			// Both sides edited since last sync? merge per field instead of blindly overwriting TickTick.
			let mergedFromRemote = false;
			try {
				const remote = await this.plugin.tickTickRestAPI?.getTaskById(taskId, savedTask.projectId);
				if (remote) {
					const r = mergeTask(savedTask as never, lineTask as never, remote as never);
					mergedFromRemote = r.taken.length + r.conflicts.length > 0;
					if (r.taken.length) log.info(`Merged TickTick-side change(s) ${r.taken.join(', ')} into ${taskId}`);
					if (r.conflicts.length) {
						const note = conflictNote(r.conflicts, new Date());
						lineTask.content = [lineTask.content, note].filter(Boolean).join('\n');
						log.warn(`Edit conflict on ${taskId}: kept Obsidian, saved TickTick version as note`, r.conflicts);
					}
				}
			} catch (e) { log.warn('merge check failed', e); }
			savedTask.modifiedTime = this.plugin.dateMan?.formatDateToISO(new Date());
			const saveDateHolder = lineTask.dateHolder;
			// Preserve reminder fields from saved task when the line task lacks
			// them (and the user didn't explicitly clear/change them with `⏰ off`
			// or a new `⏰` value).
			if (!modifications.remindersModified) {
				this.plugin.taskParser?.preserveReminders(lineTask, savedTask);
			}
			if (!lineTask.repeatFlag && savedTask.repeatFlag) {
				lineTask.repeatFlag = savedTask.repeatFlag;
			}
			if (useAbyssCommentsApi()) {
				lineTask.content = stripLegacyCommentsBlock(lineTask.content ?? '');
				lineTask.desc = stripLegacyCommentsBlock(lineTask.desc ?? '');
			}
			if (getSettings().syncNoteContextTags && getSettings().abyssTasksFormat) {
				const schemePid = lineTask.parentId && this.plugin.projectScheme?.isParentId?.(lineTask.parentId)
					? lineTask.parentId : undefined;
				const projectNotePath = schemePid ? this.plugin.projectScheme?.noteForParent?.(schemePid) : undefined;
				const base = (lineTask.tags ?? []).filter(t => {
					const l = t.toLowerCase();
					return !l.startsWith('note-') && !l.startsWith('proj-');
				});
				lineTask.tags = dedupeTags(
					appendContextTags(stripInjectedContextTags(base), { filePath: filepath, projectNotePath }),
				);
			}
			const updatedTask = await this.plugin.tickTickRestAPI?.updateTask(lineTask) as ITask;
			updatedTask.dateHolder = saveDateHolder;
			updatedTask.lineHash = newHash;

			const targetPath: string | undefined = modifications.projectMoved ? filepath : undefined;
			await this.plugin.taskRepository.upsertTask(updatedTask, targetPath, Date.now());
			if (!targetPath) await this.plugin.taskRepository.markVaultInSync?.(updatedTask.id);
			modified = true;
			// show merged TickTick values / conflict note in the note right away
			if (mergedFromRemote) {
				// make the pull step treat TickTick as newer so the line is re-rendered with merged values
				const fresh = { ...updatedTask, modifiedTime: '2000-01-01T00:00:00.000+0000', dateHolder: undefined } as unknown as ITask;
				this.plugin.dateMan?.addDateHolderToTask(fresh, undefined);
				await this.plugin.taskRepository.upsertTask(fresh, targetPath, Date.now());
				const liveFile = this.app.vault.getAbstractFileByPath(filepath);
				let live = pushSnapshot;
				if (liveFile instanceof TFile) {
					try { live = await readNoteForWrite(this.app, liveFile); } catch (error) { log.debug('merge live read failed', error); }
				}
				if (pushSnapshot != null && live !== pushSnapshot) {
					log.info(`Skipping merge write-back of ${filepath}: the note changed after the push started`);
				} else {
					try { await this.plugin.fileOperation?.synchronizeToVault(filepath, [fresh], true); } catch (e) { log.warn('merge write-back failed', e); }
				}
			}

			this.notifyUserOfChanges(taskId, modifications);
		}

		// Update hash even if no API call was made
		if (!modified && newHash !== savedTask.lineHash) {
			lineTask.lineHash = newHash;
			await this.plugin.taskRepository.upsertTask(lineTask, undefined, Date.now());
			await this.plugin.taskRepository.markVaultInSync?.(lineTask.id);
		}

		// AF-GTD-TAG-ADD: surgical strip of rival stage tags (keeps Abyss chip order for the rest).
		const exclusive = lineTask as ITask & { __exclusiveStageRewrite?: boolean; __exclusiveStageWinner?: string };
		if (exclusive.__exclusiveStageRewrite && exclusive.__exclusiveStageWinner) {
			const liveFile = this.app.vault.getAbstractFileByPath(filepath);
			if (liveFile instanceof TFile) {
				try {
					const live = await readNoteForWrite(this.app, liveFile);
					const lines = live.split('\n');
					const idx = lines.findIndex(l => l.includes(taskId));
					if (idx >= 0) {
						const nextLine = rewriteLineExclusiveStage(
							lines[idx],
							getSettings().tagListMappings,
							exclusive.__exclusiveStageWinner,
						);
						if (nextLine !== lines[idx]) {
							lines[idx] = nextLine;
							const committed = await commitVaultText(this.app, liveFile, live, lines.join('\n'));
							if (committed.status === 'deferred') log.warn('exclusive-stage write-back deferred', committed);
						}
					}
				} catch (e) {
					log.warn('exclusive-stage write-back failed', e);
				}
			}
		}

		if (useAbyssCommentsApi()) {
			const projectId = lineTask.projectId || savedTask.projectId;
			if (projectId) {
				try {
					const commentOpts = await this.abyssCommentSyncOptions(
						taskId,
						taskRecord.taskLines ?? [],
						savedTask.lineHash,
						newHash,
					);
					const commentPushed = await syncAbyssCommentsToTickTick(
						this.plugin.tickTickRestAPI,
						taskId,
						projectId,
						taskRecord.taskLines ?? [],
						savedTask.content,
						{ ...commentOpts, remoteCommentCount: savedTask.commentCount },
					);
					if (commentPushed) modified = true;
				} catch (e) {
					log.warn('Abyss comment API sync failed', taskId, e);
				}
			}
		}

		return modified;
	}

	/**
	 * TickTick renames arrive via delta etag, not a getTaskById on every quiet line
	 * (docs/TICKTICK_DELTA_API.md §3.2). Returning false keeps comment sync on the
	 * unchanged-hash path. A line whose hash matches Dexie is not pushed.
	 */
	async abyssCommentSyncOptions(
		this: TaskModificationDetector,
		taskId: string,
		taskLines: string[],
		savedLineHash: string | undefined,
		newLineHash: string,
	): Promise<AbyssCommentSyncOptions | undefined> {
		if (!savedLineHash || !newLineHash || newLineHash === savedLineHash) return undefined;
		if (extractAbyssCommentThreads(taskLines).length > 0) return undefined;
		const maps = await listCommentMapsForTask(taskId);
		if (!maps.length) return undefined;
		return { obsidianRemovedCommentBullets: true };
	}

	async skipPushWhenTickTickRenamedVaultLine(
		this: TaskModificationDetector,
		_lineTask: ITask,
		_savedTask: ITask,
		_taskId: string,
		_filepath: string,
	): Promise<boolean> {
		return false;
	}

	/**
	 * Check if task moved to a different file/project
	 */
	async checkForTaskMove(this: TaskModificationDetector, taskId: string, currentPath: string): Promise<{
		moved: boolean;
		oldFilePath: string
	}> {
		const oldFilePath = await this.plugin.fileMetadataService.getFilepathForTask(taskId);
		const moved = !!(oldFilePath && oldFilePath !== currentPath);
		return { moved, oldFilePath: oldFilePath || '' };
	}

	/**
	 * Handle task moving between projects/files
	 * Also checks if project groups differ and moves file if necessary
	 */
	async handleProjectMove(this: TaskModificationDetector, newTask: ITask, oldTask: ITask, oldPath: string, newPath: string): Promise<void> {
		await this.plugin.tickTickRestAPI?.moveTaskProject(newTask, oldTask.projectId, newTask.projectId);

		const message = `Task ${newTask.id} moved from ${oldPath} to ${newPath}`;
		new Notice(message, 5000);
		log.debug(message);
	}

	/**
	 * Handle moving a task's file when its project group changes
	 * @param task - The updated task with new projectId
	 * @param localTask - The local task record with current file path
	 */
	async handleProjectGroupMove(this: TaskModificationDetector, task: ITask, localTask: LocalTask): Promise<void> {
		if (!this.folderSyncService) {
			return;
		}

		try {
			const oldPath = localTask.file;
			if (!oldPath) { return; }

			// Get the new folder path based on task's new project
			const newFolderPath = await this.folderSyncService.getFolderPathForTask(task);

			// Extract filename from old path
			const filename = oldPath.split('/').pop() || 'Unknown.md';

			// Move the file
			const newPath = await this.folderSyncService.moveFileToProjectFolder(
				oldPath,
				newFolderPath,
				filename
			);

			if (newPath) {
				const message = `Task ${task.id} file moved from ${oldPath} to ${newPath} due to project group change`;
				new Notice(message, 5000);
				log.info(message);
			}
		} catch (error) {
			log.error(`Error handling project group move for task ${task.id}:`, error);
			new Notice(`Error moving task file: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Handle task parent change (subtask hierarchy)
	 */
	async handleParentChange(this: TaskModificationDetector, lineTask: ITask, savedTask: ITask, taskId: string): Promise<void> {
		await this.plugin.tickTickRestAPI?.moveTaskParent(taskId, savedTask.parentId, lineTask.parentId, lineTask.projectId);

		const oldParent = await this.plugin.taskRepository.loadTaskById(savedTask.parentId);
		const newParent = await this.plugin.taskRepository.loadTaskById(lineTask.parentId);

		const message = `Task ${taskId} parent changed from "${oldParent?.title || 'none'}" to "${newParent?.title || 'none'}"`;
		new Notice(message, 5000);
		log.debug(message);
	}

	/**
	 * Handle task status change (complete/incomplete)
	 */
	async handleStatusChange(this: TaskModificationDetector, lineTask: ITask, filepath?: string): Promise<void> {
		if (lineTask.status != 0 && lineTask.repeatFlag && filepath && await this.rollRecurring(lineTask, filepath)) return;
		if (lineTask.status != 0) {
			await this.plugin.tickTickRestAPI?.CloseTask(lineTask.id, lineTask.projectId);
			await this.plugin.taskRepository.closeTask(lineTask.id);
		} else {
			await this.plugin.tickTickRestAPI?.OpenTask(lineTask.id, lineTask.projectId);
			await this.plugin.taskRepository.reopenTask(lineTask.id);
		}
		new Notice(`Task ${lineTask.id} status updated`);
	}

	/** Completed a recurring task: move TickTick to the next date (API close would end the series). */
	async rollRecurring(this: TaskModificationDetector, lineTask: ITask, filepath: string): Promise<boolean> {
		const api = this.plugin.tickTickRestAPI;
		const remote = await api?.getTaskById(lineTask.id, lineTask.projectId);
		const base = remote?.dueDate || remote?.startDate;
		const next = nextOccurrence(remote?.repeatFlag, base);
		if (!remote || !base || !next) return false;
		const delta = new Date(next.replace(/([+-]\d{2})(\d{2})$/, '$1:$2')).getTime() - new Date(base.replace(/([+-]\d{2})(\d{2})$/, '$1:$2')).getTime();
		const shift = (d?: string) => d ? new Date(new Date(d.replace(/([+-]\d{2})(\d{2})$/, '$1:$2')).getTime() + delta).toISOString().replace('Z', '+0000') : d;
		const upd = { ...remote, status: 0, dueDate: shift(remote.dueDate), startDate: shift(remote.startDate), completedTime: undefined } as ITask;
		const saved = await api?.updateTask(upd) as ITask;
		const f = this.app.vault.getAbstractFileByPath(filepath);
		if (f instanceof TFile) {
			const snapshot = await readNoteForWrite(this.app, f);
			const lines = snapshot.split('\n');
			const fl = fencedLines(lines);
			const i = lines.findIndex((l, j) => !fl.has(j) && l.includes(`ticktick_id:: ${lineTask.id}`));
			if (i >= 0) {
				const [open, done] = rollRecurringLines(lines[i], base, next, remote.timeZone);
				lines.splice(i, 1, open, done);
				await commitVaultText(this.app, f, snapshot, lines.join('\n'));
			}
		}
		if (saved) { this.plugin.dateMan?.addDateHolderToTask(saved, undefined); await this.plugin.taskRepository.upsertTask(saved, filepath, Date.now()); }
		new Notice(`Recurring task rolled to ${next.slice(0, 10)}`);
		return true;
	}

	/**
	 * Notify user of what changed
	 */
	notifyUserOfChanges(this: TaskModificationDetector, taskId: string, modifications: TaskModifications): void {
		const changes: string[] = [];
		if (modifications.titleModified) changes.push('content');
		if (modifications.statusModified) changes.push('status');
		if (modifications.datesModified) changes.push('dates');
		if (modifications.tagsModified) changes.push('tags');
		if (modifications.projectMoved) changes.push('project');
		if (modifications.priorityModified) changes.push('priority');
		if (modifications.parentIdModified) changes.push('parent');
		if (modifications.taskItemsModified) changes.push('items');
		if (modifications.notesModified) changes.push('notes');

		const message = `Task ${taskId} updated: ${changes.join(', ')}`;
		new Notice(message);
		if (getSettings().debugMode) {
			log.debug(message);
		}
	}

	/**
	 * Check for task item (sub-task) modifications
	 */
	async checkTaskItemModification(this: TaskModificationDetector, lineText: string, fileMap: NewFileMap, lineNumber: number | undefined): Promise<boolean> {
		if (!this.plugin.taskParser?.isMarkdownTask(lineText)) {
			return false;
		}

		const lineItemId = this.plugin.taskParser.getLineItemId(lineText);
		let currentObject: ITaskItemRecord | undefined;

		if (lineItemId) {
			currentObject = fileMap.getTaskItemRecord(lineItemId);
		} else if (lineNumber !== undefined) {
			currentObject = fileMap.getTaskItemRecordByLine(lineNumber);
		}

		if (!currentObject) {
			log.warn('Item not found in file map:', lineText);
			return false;
		}

		if (!currentObject.parentId || currentObject.parentId === '' || currentObject.parentId.length < 1) {
			return false;
		}

		const parentID = currentObject.parentId;
		const itemId = currentObject.ID;
		let modified = false;

		const newItem = this.plugin.taskParser?.taskFromLine(lineText);
		const parentTask = await this.plugin.taskRepository.loadTaskById(parentID);

		if (parentTask && parentTask.items) {
			if (itemId) {
				// Existing item - check for modifications
				const oldItem = parentTask.items.find((item) => item.id == itemId);
				if (oldItem) {
					if (oldItem.title.trim() != newItem!.description.trim() ||
						oldItem.status != (newItem!.status ? 2 : 0)) {
						oldItem.title = newItem!.description.trim();
						oldItem.status = newItem!.status ? 2 : 0;
						modified = true;
					}
				} else {
					// Item ID not found - force add it
					log.warn('Item', newItem, 'not found in parent items. Forcibly adding...');
					parentTask.items.push({
						id: itemId,
						title: newItem!.description,
						status: newItem!.status ? 2 : 0
					});
					modified = true;
				}
			} else {
				// New item - generate ID and add
				const Oid = ObjectID();
				const OidHexString = Oid.toHexString();
				parentTask.items.push({
					id: OidHexString,
					title: newItem!.description,
					status: newItem!.status ? 2 : 0
				});

				// CRITICAL: Get the file from fileMap, not from active workspace
				const filepath = fileMap.getFilePath();
				const file = this.app.vault.getAbstractFileByPath(filepath);
			if (!(file instanceof TFile)) { return false; }

				if (file && lineNumber !== undefined) {
					try {
						const fileContent = await readNoteForWrite(this.app, file);
						const lines = fileContent.split('\n');
						if (lines[lineNumber] !== lineText) {
							log.info(`Deferring item id write in ${filepath}: the line changed`);
						} else {
							const updated = lines.slice();
							updated[lineNumber] = `${lineText} %%${OidHexString}%%`;
							await commitVaultText(this.app, file, fileContent, updated.join('\n'));
						}
					} catch (error) {
						log.error(`Error updating item in file ${filepath}:`, error);
					}
				}
				modified = true;
			}
		} else {
			return false;
		}

		// Update parent task if modified
		if (modified) {
			try {
				const updatedTask = await this.plugin.tickTickRestAPI?.updateTask(parentTask);
				if (updatedTask) {
					await this.plugin.taskRepository.upsertTask(updatedTask, undefined, Date.now());
					await this.plugin.taskRepository.markVaultInSync?.(updatedTask.id);
				}
			} catch (error) {
				log.error('Error updating parent task:', error);
			}
		}

		return modified;
	}

	/**
	 * Check if a task's project changed to a different project group
	 * If so, trigger file movement to the new project group's folder
	 * @param task - The updated task from TickTick
	 * @param localTask - The local task record from database
	 */
	async checkForProjectGroupChange(this: TaskModificationDetector, task: ITask, localTask: LocalTask): Promise<void> {
		// Only check if folder organization is enabled
		if (!getSettings().keepProjectFolders) {
			return;
		}

		// Don't move unassociated files
		if (!this.folderSyncService) {
			return;
		}

		const shouldManage = await this.folderSyncService.shouldManageFile(localTask.file ?? undefined);
		if (!shouldManage) {
			log.debug(`File ${localTask.file} is user-managed, skipping project group change check`);
			return;
		}

		try {
			// Check if projects are in different groups
			const groupsAreDifferent = await this.folderSyncService.projectsInDifferentGroups(
				localTask.task.projectId,
				task.projectId
			);

			if (groupsAreDifferent) {
				log.info(`Task ${task.id} moved to different project group`);
				await this.handleProjectGroupMove(task, localTask);
			}
		} catch (error) {
			log.error(`Error checking for project group change for task ${task.id}:`, error);
		}
	}
}
