import { stripFileLinks } from '@/projectScheme';
import { idsPresentInVault } from '@/utils/vaultIdScan';
import { detachInContent, enrichDeletionItems, childIdsInContent } from '@/detach';
import { markerName } from '@/taskParser';
/**
 * VaultSyncCoordinator - Coordinates syncing between database and vault files
 * Extracts vault sync logic from SyncModule
 */

import { App, Notice, TFile, TFolder } from 'obsidian';
import type { PluginContext } from '@/pluginContext';
import type { ITask } from '@/api/types/Task';
import type { LocalTask } from '@/db/schema';
import { vaultLineBehindTask } from '@/sync/vault-pull/vaultLineBehind';
import { db } from "@/db/dexie";
import { getSettings } from '@/settings';
import { deletionConfirmMode } from '@/sync/massDeleteGuard';
import { getAllProjects } from '@/db/projects';
import { tagsForCurrentList } from '@/listMapping';
import { upsertFile } from '@/db/files';
import { allowVaultUpdate, fileForNewTickTickTask, isListAllowed, normalizeSyncTag, resolveSyncedListIds, taskMatchesSyncLimit, unmatchedEntries } from '@/syncScope';
import { TaskDeletionModal } from '@/modals/TaskDeletionModal';
import { FolderSyncService } from '@/services/FolderSyncService';
import log from '@/utils/logger';
import { commitVaultText, readNoteForWrite, syncCachedRead, syncRead } from '@/sync/vault-io';
import { isNotebookTask } from '@/sync/notebookGuard';
import { traceWrite } from '@/services/writeTrace';
import { deferActiveFilePush } from '@/services/activeFilePush';
import { addCount } from '@/sync/perf';
import { notePluginWrite } from '@/utils/editedSince';
import type { ITaskComment } from '@/api/types/TaskComment';

export class VaultSyncCoordinator {
	private app: App;
	private plugin: PluginContext;
	private folderSyncService?: FolderSyncService;

	constructor(app: App, plugin: PluginContext, folderSyncService?: FolderSyncService) {
		this.app = app;
		this.plugin = plugin;
		this.folderSyncService = folderSyncService;
	}

	/**
	 * Sync the vault with the database state
	 * Groups tasks by file and performs additions, updates, and deletions
	 */
	async syncVaultWithDatabase(): Promise<void> {
		const tasks = await db.tasks.toArray();
		addCount('tasksTotal', tasks.length);
		// GTD scope: only tasks of allow-listed lists are written to the vault. Empty = nothing.
		const syncedEntries = getSettings().syncedLists ?? [];
		const allLists = await getAllProjects();
		const allowedListIds = resolveSyncedListIds(syncedEntries, allLists);
		if (!syncedEntries.length) {
			log.warn('syncedLists is empty: nothing is pulled from TickTick.');
			new Notice('TickTickSync: no lists are selected for sync, so nothing was pulled. Choose lists in the GTD settings.', 8000);
		} else {
			const unknown = unmatchedEntries(syncedEntries, allLists);
			if (unknown.length) log.warn('syncedLists entries match no TickTick list:', unknown);
		}
		const scheme = this.plugin.projectScheme;
		if (scheme?.enabled()) await scheme.run(tasks.filter(lt => !lt.deleted).map(lt => lt.task));
		const syncTag = normalizeSyncTag(getSettings().SyncTag);
		const syncProject = getSettings().SyncProject;
		const andOr = getSettings().tagAndOr;

		// Group tasks by file
		const fileGroups: Map<string, { toAdd: ITask[], toUpdate: ITask[], toDelete: ITask[] }> = new Map();
		const dbUpdates: { localId: string, changes: Partial<LocalTask> }[] = [];
		const projectIdToFilepathCache: Map<string, string> = new Map();
		const movedTaskIds: Set<string> = new Set();

		// Where each task id actually sits in the vault right now (self-heals a stale DB `file`).
		const presentAt = await idsPresentInVault(this.app, tasks.filter(lt => !lt.deleted).map(lt => lt.task?.id ?? ''));

		// Categorize tasks by their target file and action needed
		for (const lt of tasks) {
			addCount('tasksChecked', 1);
			let task = lt.task;
			// Project parents are represented by project notes, never by task lines.
			if (scheme?.isParentTask(task)) continue;
			// Notebook NOTES are never checkbox lines (FEAT-NOTEBOOK MVP uses a folder).
			if (isNotebookTask(task)) continue;
			let targetFile: string | undefined;
			const actualFile = !lt.deleted ? presentAt.get(task.id) : undefined;
			const linkedInVault = !!(actualFile || lt.file);
			// Linked lines follow TickTick even without SyncTag. New tasks still need the tag.
			const matchesFilter = allowVaultUpdate(task, linkedInVault, {
				syncTag, syncProject, andOr, allowedListIds,
			});

			// Step 4: line already in vault wins over list-file / DB path (Abyss-first in place).
			if (actualFile) {
				targetFile = actualFile;
			} else if (matchesFilter && !lt.deleted) {
				// Project children belong in the parent note's Active Zone, even if an
				// earlier sync wrote them into the flat list file.
				const schemeNote = task.parentId ? scheme?.noteForParent(task.parentId) : undefined;
				if (schemeNote) {
					targetFile = schemeNote;
				} else if (lt.file) {
					const existingFile = this.app.vault.getAbstractFileByPath(lt.file);
					if (existingFile instanceof TFile) {
						targetFile = lt.file;
					}
				}
				if (!targetFile) {
					targetFile = await this.determineTargetFile(task, projectIdToFilepathCache);
				}
			} else {
				targetFile = lt.file;
			}

			if (actualFile && actualFile !== lt.file && actualFile !== targetFile) {
				dbUpdates.push({ localId: lt.localId, changes: { file: actualFile, lastVaultSync: Date.now() } });
				targetFile = actualFile;
				lt.file = actualFile;
			}

			if (!targetFile) continue;

			// Normalize targetFile to existing mapping if it only differs by case
			if (lt.file && lt.file.toLowerCase() === targetFile.toLowerCase()) {
				targetFile = lt.file;
			}

			if (!fileGroups.has(targetFile)) {
				fileGroups.set(targetFile, { toAdd: [], toUpdate: [], toDelete: [] });
			}
			const group = fileGroups.get(targetFile)!;

			if (lt.deleted) {
				if (lt.file) {
					group.toDelete.push(task);
				}
			} else if (matchesFilter) {
				let actionNeeded = this.determineActionNeeded(lt, targetFile);
				if (targetFile && (actionNeeded.action === 'none' || actionNeeded.action === 'update')) {
					const behind = await vaultLineBehindTask({ app: this.app, plugin: this.plugin }, task, targetFile);
					traceWrite(this.app, 'syncVaultWithDatabase', targetFile, 'decision', {
						reason: actionNeeded.action === 'update' && !behind.behind && !behind.localEdit
							? 'hasChanged'
							: behind.reason,
						taskIds: [task.id],
					});
					if (behind.localEdit) {
						deferActiveFilePush(targetFile);
					} else if (behind.behind) {
						actionNeeded = { action: 'update' };
						task = await this.dropStaleStageTags(behind.task);
						lt.task = task;
					}
				}
				const realFile = presentAt.get(task.id);
				if (actionNeeded.action === 'add' && realFile && realFile !== targetFile) {
					// Line already exists in another note: adopt that location instead of writing a duplicate.
					dbUpdates.push({ localId: lt.localId, changes: { file: realFile, lastVaultSync: Date.now() } });
				} else if (actionNeeded.action === 'add') {
					group.toAdd.push(await this.dropStaleStageTags(task));
					dbUpdates.push({ localId: lt.localId, changes: { file: targetFile, lastVaultSync: Date.now() } });
				} else if (actionNeeded.action === 'move') {
					// Task moved to a different file (project change)
					const oldFile = lt.file;
					const taskId = (task.id || (task as { taskId?: string }).taskId) ?? '';
					movedTaskIds.add(taskId);
					if (!fileGroups.has(oldFile)) {
						fileGroups.set(oldFile, { toAdd: [], toUpdate: [], toDelete: [] });
					}
					fileGroups.get(oldFile)!.toDelete.push(task);
					group.toAdd.push(task);
					dbUpdates.push({ localId: lt.localId, changes: { file: targetFile, lastVaultSync: Date.now() } });
				} else if (actionNeeded.action === 'update') {
					group.toUpdate.push(await this.dropStaleStageTags(lt.task));
					dbUpdates.push({ localId: lt.localId, changes: { lastVaultSync: Date.now() } });
				}
			} else if (lt.file) {
				// Task doesn't match current filter but already exists in vault.
				// Leave it alone -- do not delete user's existing tasks.
				continue;
			}
		}

		// Line moved to another note / note renamed: fix the file link in the TickTick title.
		if (getSettings().fileLinksInTickTick === 'taskLink') {
			for (const lt of tasks) {
				const t = lt.task; const at = t?.id ? presentAt.get(t.id) : undefined;
				if (!at || lt.deleted || scheme?.isParentTask(t)) continue;
				const url = this.plugin.taskParser.getObsidianUrlFromFilepath(at);
				if (!url || t.title?.includes(url) || !/\]\(obsidian:\/\//.test(t.title ?? '')) continue;
				try {
					const upd = await this.plugin.tickTickRestAPI?.updateTask({ ...t, title: stripFileLinks(t.title) + ' ' + url } as ITask);
					if (upd) { upd.dateHolder = t.dateHolder; upd.lineHash = t.lineHash; await this.plugin.taskRepository.upsertTask(upd, at, Date.now()); }
				} catch (e) { log.warn('file link refresh failed', t.id, e); }
			}
		}

		// Handle deletions with user confirmation
		const proceedWithDeletions = await this.confirmDeletions(fileGroups, movedTaskIds);

		// Process each file group
		await this.processFileGroups(fileGroups, proceedWithDeletions, tasks, dbUpdates);

		// Bulk update DB at the end
		if (dbUpdates.length > 0) {
			await db.transaction("rw", db.tasks, async () => {
				for (const update of dbUpdates) {
					await db.tasks.update(update.localId, update.changes);
				}
			});
			log.debug(`VaultSync: Updated ${dbUpdates.length} task records in DB`);
		}

		// Ensure all projects with DB file mappings have their vault files
		await this.ensureProjectFilesExist();
	}

	/**
	 * Determine the target file for a task based on its project
	 *
	 * Priority:
	 * 1. If task has default project ID, check if it exists in any unassociated vault files
	 *    (handles multi-device sync where files arrive before DB is updated)
	 * 2. File associated with the task's specific project (with folder structure if enabled)
	 * 3. File associated with the default project
	 */
	private async determineTargetFile(
		task: ITask,
		cache: Map<string, string>
	): Promise<string | undefined> {
		const defaultProjectId = getSettings().defaultProjectId;

		// Special handling for tasks with default project ID:
		// Check if this task exists in a vault file that isn't yet in the DB
		// This handles the case where files sync via external mechanism before DB updates
		if (task.projectId === defaultProjectId) {
			const fileWithTask = await this.findTaskInUnassociatedFiles(task.id);
			if (fileWithTask) {
				log.debug(`Found task ${task.id} in unassociated file: ${fileWithTask}`);
				return fileWithTask;
			}
			const capture = fileForNewTickTickTask(task.projectId, defaultProjectId, await this.abyssCaptureFile(), undefined);
			if (capture) {
				cache.set(task.projectId, capture);
				return capture;
			}
		}

		if (cache.has(task.projectId)) {
			return cache.get(task.projectId)!;
		}

		// Use FolderSyncService if available (handles folder structure)
		let targetFile: string | undefined;
		if (this.folderSyncService && getSettings().keepProjectFolders) {
			const projectRecord = await db.projects.get(task.projectId);
			const projectName = projectRecord?.project?.name;
			if (projectName) {
				targetFile = await this.folderSyncService.getFilePathForTask(task, projectName);
				log.debug(`Determined target file for task ${task.id}: ${targetFile}`);
				// Ensure the folder exists
				const folderPath = await this.folderSyncService.getFolderPathForTask(task);
				if (folderPath) {
					log.debug(`Ensuring folder exists: ${folderPath}`);
					await this.folderSyncService.ensureFolderExists(folderPath);
				}
			}
		}

		// Fallback to legacy behavior
		if (!targetFile) {
			targetFile = await this.plugin.fileMetadataService.getFilepathForProjectId(task.projectId);
			if (!targetFile) {
				targetFile = await this.plugin.fileMetadataService.getFilepathForProjectId(defaultProjectId);
			}
		}

		if (!targetFile && task.projectId !== defaultProjectId) {
			const rec = await db.projects.get(task.projectId);
			const name = rec?.project?.name;
			const list = name ? { id: task.projectId, name } : undefined;
			if (list && isListAllowed(getSettings().syncedLists, list)) {
				const folder = (getSettings().TickTickTasksFilePath || 'TickTick').replace(/^\/+|\/+$/g, '');
				const safe = name!.replace(/[\\/:*?"<>|]/g, ' ').trim();
				targetFile = `${folder}/${safe}.md`;
				await upsertFile(targetFile, task.projectId);
			}
		}

		if (targetFile) {
			cache.set(task.projectId, targetFile);
		}

		return targetFile;
	}

	/**
	 * Search for a task in vault files that don't have a project association
	 * This handles multi-device sync scenarios where files arrive before DB is updated
	 */
	private async findTaskInUnassociatedFiles(taskId: string): Promise<string | undefined> {
		const allFiles = await db.files.toArray();
		const unassociatedFiles = allFiles.filter(f => !f.defaultProjectId);

		for (const fileRecord of unassociatedFiles) {
			const file = this.app.vault.getAbstractFileByPath(fileRecord.path);
			if (file instanceof TFile) {
				try {
					const content = await syncCachedRead(this.app.vault, file);
					// Check if this file contains the task ID in TickTick metadata format
					const pattern = new RegExp(`%%\\[ticktick_id::\\s*${taskId}\\]%%`, 'i');
					if (pattern.test(content)) {
						return fileRecord.path;
					}
				} catch (error) {
					log.warn(`Error reading file ${fileRecord.path}:`, error);
				}
			}
		}

		return undefined;
	}

	private determineActionNeeded(
		lt: LocalTask,
		targetFile: string
	): { action: 'add' | 'move' | 'update' | 'none' } {
		const isNew = !lt.file;
		const hasChanged = lt.updatedAt > (lt.lastVaultSync || 0);
		const fileMoved = lt.file && lt.file !== targetFile;

		if (isNew) {
			return { action: 'add' };
		} else if (fileMoved) {
			return { action: 'move' };
		} else if (hasChanged) {
			return { action: 'update' };
		}

		return { action: 'none' };
	}

	/**
	 * Check if a task matches the sync filter (tag/project)
	 */
	private matchesFilter(task: ITask, syncTag?: string, syncProject?: string, andOr?: number, allowedListIds?: Set<string>): boolean {
		return taskMatchesSyncLimit(task, { syncTag, syncProject, andOr, allowedListIds });
	}

	/**
	 * Confirm deletions with the user
	 */
	private async confirmDeletions(
		fileGroups: Map<string, { toAdd: ITask[], toUpdate: ITask[], toDelete: ITask[] }>,
		movedTaskIds: Set<string> = new Set()
	): Promise<boolean> {
		const tasksToConfirmDeletionIds: string[] = [];
		for (const group of fileGroups.values()) {
			for (const task of group.toDelete) {
				const id = (task.id || (task as { taskId?: string }).taskId) ?? '';
				if (!movedTaskIds.has(id)) {
					tasksToConfirmDeletionIds.push(id);
				}
			}
		}

		if (tasksToConfirmDeletionIds.length === 0) {
			return true;
		}

		if (deletionConfirmMode() === 'skip') {
			const held = new Set(tasksToConfirmDeletionIds);
			for (const group of fileGroups.values()) {
				group.toDelete = group.toDelete.filter(task => !held.has((task.id || (task as { taskId?: string }).taskId) ?? ''));
			}
			log.info(`TickTickSync: mass-delete guard skipped ${held.size} vault deletion(s)`);
			return true;
		}

		if (getSettings().onTickTickDeletion === 'cancel') {
			// No modal: detach these lines ([-], no id) and drop them from the delete lists.
			const ids = new Set(tasksToConfirmDeletionIds);
			for (const [filePath, group] of fileGroups) {
				const mine = group.toDelete.filter(t => ids.has((t.id || (t as { taskId?: string }).taskId) ?? ''));
				if (!mine.length) continue;
				group.toDelete = group.toDelete.filter(t => !mine.includes(t));
				const f = this.app.vault.getAbstractFileByPath(filePath);
				// subtasks of a deleted parent go with it (TickTick UI does the same)
				const content = f instanceof TFile ? await syncRead(this.app.vault, f) : '';
				const kidIds = new Set<string>();
				for (const t of mine) {
					const pid = (t.id || (t as { taskId?: string }).taskId) ?? '';
					if (this.plugin.projectScheme?.isParentId(pid)) continue;
					for (const k of childIdsInContent(content, pid)) if (!ids.has(k)) kidIds.add(k);
				}
				for (const k of kidIds) {
					const pr = await this.plugin.taskRepository.getProjectIdForTask(k);
					try { if (pr) await this.plugin.tickTickRestAPI?.deleteTask(k, pr); } catch (e) { log.warn('child delete failed', k, e); }
				}
				const allIds = [...mine.map(t => (t.id || (t as { taskId?: string }).taskId) ?? ''), ...kidIds];
				for (const id of allIds) {
					await this.plugin.fileMetadataService.clearTaskFile(id);
					await this.plugin.taskRepository.deleteTask(id);
					if (f instanceof TFile) {
						const snapshot = await readNoteForWrite(this.app, f);
						const next = detachInContent(snapshot, id, markerName());
						if (next && next !== snapshot) await commitVaultText(this.app, f, snapshot, next);
					}
				}
			}
			return true;
		}

		if (deletionConfirmMode() === 'force') {
			return true;
		}

		const items = await enrichDeletionItems(this.app, await this.plugin.fileMetadataService.getDeletionItems(tasksToConfirmDeletionIds));
		const modal = new TaskDeletionModal(
			this.app,
			items,
			'tasks deleted from TickTick',
			() => {}
		);
		const prompt = await modal.showModal();

		if (!prompt.confirmed && !prompt.suppressedPending) {
			new Notice('Tasks will not be deleted from vault.', 5000);
		}

		return prompt.confirmed;
	}

	private fileMtime(filePath: string): number | undefined {
		const file = this.app.vault.getAbstractFileByPath(filePath);
		return file instanceof TFile && typeof file.stat?.mtime === 'number' ? file.stat.mtime : undefined;
	}

	/** Record mtime only when this write moved it. A user save during the sync keeps its own mtime. */
	private noteOwnWrite(filePath: string, before: number | undefined): void {
		const mtime = this.fileMtime(filePath);
		if (typeof mtime === 'number' && mtime !== before) notePluginWrite(filePath, mtime);
	}

	/**
	 * Process file groups - handle deletions, updates, and additions
	 */
	private async processFileGroups(
		fileGroups: Map<string, { toAdd: ITask[], toUpdate: ITask[], toDelete: ITask[] }>,
		proceedWithDeletions: boolean,
		allTasks: LocalTask[],
		dbUpdates: { localId: string, changes: Partial<LocalTask> }[]
	): Promise<void> {
		for (const [filePath, group] of fileGroups) {
			const file = this.app.vault.getAbstractFileByPath(filePath);

			// 1. Handle Deletions
			if (proceedWithDeletions && group.toDelete.length > 0) {
				if (file instanceof TFile) {
					await this.plugin.fileOperation?.deleteTasksFromSpecificFile(file, group.toDelete, false);
				}
				for (const task of group.toDelete) {
					const lt = allTasks.find(t => t.taskId === (task.id || (task as { taskId?: string }).taskId));
					if (lt) {
						// Clear the file field (tombstone pattern)
						dbUpdates.push({ localId: lt.localId, changes: { file: "" } });
					}
				}
			}

			// 2. Handle Updates
			if (group.toUpdate.length > 0) {
				const before = this.fileMtime(filePath);
				await this.plugin.fileOperation?.synchronizeToVault(filePath, group.toUpdate, true);
				this.noteOwnWrite(filePath, before);
			}

			// 3. Handle Additions
			if (group.toAdd.length > 0) {
				const before = this.fileMtime(filePath);
				await this.plugin.fileOperation?.synchronizeToVault(filePath, group.toAdd, false);
				this.noteOwnWrite(filePath, before);
			}
		}
	}

	/** Abyss quick-capture note. Inbox tasks born in TickTick are written here with `#inbox`. */
	private async abyssCaptureFile(): Promise<string | undefined> {
		try {
			const raw = await this.app.vault.adapter.read('.obsidian/plugins/abyss-tasks/data.json');
			const path = (JSON.parse(raw) as { taskFilePath?: unknown }).taskFilePath;
			if (typeof path === 'string' && path.trim()) return path.trim();
		} catch (e) {
			log.debug('No Abyss capture file', e);
		}
		return '00 Inbox/abyss-active.md';
	}

	/** Remove a stage tag that belongs to a different list, including `#inbox` after leaving the inbox list. */
	private async dropStaleStageTags(task: ITask): Promise<ITask> {
		const s = getSettings();
		const nextTags = tagsForCurrentList(task.tags, task.projectId, s.tagListMappings, {
			defaultProjectId: s.defaultProjectId,
			via: s.gtdStageVia ?? 'list',
		});
		const same = nextTags.length === (task.tags?.length ?? 0) && nextTags.every((t, i) => t === task.tags?.[i]);
		if (same) return task;
		const next = { ...task, tags: nextTags };
		// Spread drops non-enumerable pull state (TP-COMMENT-TT-DELETE F1): keep merge hint + API list.
		this.copyCommentPullState(task, next);
		try {
			await this.plugin.tickTickRestAPI?.updateTask(next);
		} catch (e) {
			log.warn('Could not drop stale stage tag', task.id, e);
		}
		return next;
	}

	private copyCommentPullState(from: ITask, to: ITask): void {
		const src = from as ITask & { _apiComments?: ITaskComment[]; __ticktickComments?: unknown };
		if (Object.prototype.hasOwnProperty.call(src, '_apiComments')) {
			Object.defineProperty(to, '_apiComments', {
				value: src._apiComments,
				enumerable: false,
				configurable: true,
			});
		}
		if (Object.prototype.hasOwnProperty.call(src, '__ticktickComments')) {
			Object.defineProperty(to, '__ticktickComments', {
				value: src.__ticktickComments,
				enumerable: false,
				configurable: true,
			});
		}
	}

	/**
	 * Ensure all projects with DB file mappings have their vault files.
	 * This covers projects that have no tasks yet but still need a file created.
	 */
	private async ensureProjectFilesExist(): Promise<void> {
		if (getSettings().newTasksFile?.trim()) return; // single-file mode: no per-list files
		const allFileRecords = await db.files.toArray();
		// Only allow-listed lists get (re-created) files; the Projects list lives in project notes.
		const s = getSettings();
		const lists = await getAllProjects();
		const managedFiles = allFileRecords.filter(f => {
			if (!f.defaultProjectId) return false;
			const list = lists.find(l => l.id === f.defaultProjectId);
			return !!(list && isListAllowed(s.syncedLists, list));
		});

		for (const fileRecord of managedFiles) {
			const file = this.app.vault.getAbstractFileByPath(fileRecord.path);
			if (file instanceof TFile) {
				continue;
			}

			log.debug(`Ensuring project file exists: ${fileRecord.path}`);
			try {
				let normalizedPath = fileRecord.path;
				if (normalizedPath.startsWith('/')) {
					normalizedPath = normalizedPath.substring(1);
				}

				const parentPath = normalizedPath.includes('/') ? normalizedPath.substring(0, normalizedPath.lastIndexOf('/')) : '';
				if (parentPath) {
					const parts = parentPath.split('/').filter(Boolean);
					let current = '';
					for (const part of parts) {
						current = current ? `${current}/${part}` : part;
						const folder = this.app.vault.getAbstractFileByPath(current);
						if (!folder) {
							await this.app.vault.createFolder(current);
						} else if (!(folder instanceof TFolder)) {
							log.error(`Path conflict: ${current} exists and is not a folder`);
							return;
						}
					}
				}

				const whoAdded = `${this.plugin.manifest.name} -- ${this.plugin.manifest.version}`;
				await this.app.vault.create(normalizedPath, `== Added by ${whoAdded} == `);
			} catch (error) {
				if ((error as Error).message?.includes('File already exists')) {
					log.debug(`File already exists: ${fileRecord.path}`);
				} else {
					log.error(`Error creating project file ${fileRecord.path}:`, error);
				}
			}
		}
	}
}
