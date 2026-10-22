import { idsPresentInVault } from '@/utils/vaultIdScan';
import { scanVaultForDeletionGuard } from '@/sync/vaultDeletionScan';
import { stripFileLinks } from '@/projectScheme';
/**
 * TaskDeletionHandler - Handles task deletion detection and execution
 * Extracts deletion logic from SyncModule (lines ~39-156, 791-834)
 *
 * Responsibilities:
 * - Detect tasks deleted from markdown files
 * - Detect task items (sub-tasks) deleted from tasks
 * - Confirm deletions with user
 * - Execute deletions in TickTick and database
 */

import { App, MarkdownView, Notice, TFile, TFolder } from 'obsidian';
import type { PluginContext } from '@/pluginContext';
import type { ITask } from '@/api/types/Task';
import type { FileTaskQueriesPort } from '@/repositories/ports';
import { TaskDeletionModal, type DeletionPromptResult } from '@/modals/TaskDeletionModal';
import { getSettings } from '@/settings';
import { syncCachedRead } from '@/sync/vault-io';
import { isPathInPushScope } from '@/syncScope';
import { db } from '@/db/dexie';
import { classifyFileRead, deletionConfirmMode, obsidianSyncFileState } from '@/sync/massDeleteGuard';
import type { SyncRunContext } from '@/sync/SyncRunContext';
import log from '@/utils/logger';

export class TaskDeletionHandler {
	private app: App;
	private plugin: PluginContext;
	private fileTaskQueries: FileTaskQueriesPort;

	constructor(app: App, plugin: PluginContext) {
		this.app = app;
		this.plugin = plugin;
		this.fileTaskQueries = plugin.fileTaskQueries;
	}

	/**
	 * Check a file for deleted tasks and handle them
	 */
	async checkFileForDeletedTasks(file_path: string | null): Promise<void> {
		// Get file and content
		let file;
		let currentFileValue: string;
		let filepath: string;

		if (file_path) {
			file = this.app.vault.getAbstractFileByPath(file_path);
			if (!file || file instanceof TFolder) {
				return;
			}
			filepath = file_path;
			if (file instanceof TFile) {
				currentFileValue = await this.plugin.fileOperation.readFileContent(file);
			} else {
				return;
			}
		} else {
			// Use active file
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			file = this.app.workspace.getActiveFile();
			if (!file) {
				return;
			}
			filepath = file.path;
			currentFileValue = view?.data || '';
		}

		// Outside syncScopeFolders: a removed line must not delete the TickTick task.
		if (!isPathInPushScope(filepath)) {
			return;
		}

		// Check if file has tasks
		const hasTasks = await this.fileTaskQueries.fileHasTasks(filepath);
		if (!hasTasks) {
			return;
		}

		const trust = classifyFileRead({
			path: filepath,
			readOk: typeof currentFileValue === 'string',
			syncState: obsidianSyncFileState(this.app, file),
		});
		if (!currentFileValue || trust !== 'ok') {
			// Never infer deletions from a file we could not read, or one that is
			// conflicted, sync-pending, or skipped: every task the DB places in it
			// would be treated as deleted and removed from TickTick.
			const why = !currentFileValue ? 'unreadable' : trust;
			const message = `TickTickSync: could not read ${filepath} (${why}). Skipping the deleted-task check for it, so no tasks will be removed from TickTick.`;
			log.error(message);
			new Notice(message, 5000);
			return;
		}

		// Remove frontmatter from content
		const contentWithoutFrontmatter = currentFileValue.replace(/^---[\s\S]*?---\n/, '');

		const deletedTaskIds = await this.findMissingTaskIds(contentWithoutFrontmatter, filepath);
		if (deletedTaskIds.length > 0) {
			await this.deleteTasksByIds(deletedTaskIds);
		}
		await this.checkForDeletedTaskItems(filepath, contentWithoutFrontmatter);
	}

	/**
	 * Collect task ids that were removed from a file (sync phase 2, aggregated confirm).
	 */
	async collectMissingTaskIdsForFile(file_path: string): Promise<string[]> {
		const file = this.app.vault.getAbstractFileByPath(file_path);
		if (!file || !(file instanceof TFile) || !isPathInPushScope(file_path)) {
			return [];
		}
		if (!(await this.fileTaskQueries.fileHasTasks(file_path))) {
			return [];
		}
		let currentFileValue = '';
		let readOk = true;
		try {
			const read = await this.plugin.fileOperation.readFileContent(file);
			if (typeof read !== 'string') readOk = false;
			else currentFileValue = read;
		} catch (error) {
			readOk = false;
			log.warn(`TickTickSync: not inferring deletions from ${file_path}`, error);
		}
		const trust = classifyFileRead({
			path: file_path,
			readOk,
			syncState: obsidianSyncFileState(this.app, file),
		});
		if (!readOk || !currentFileValue || trust !== 'ok') {
			return [];
		}
		const contentWithoutFrontmatter = currentFileValue.replace(/^---[\s\S]*?---\n/, '');
		return await this.findMissingTaskIds(contentWithoutFrontmatter, file_path);
	}

	/**
	 * Local DB tasks with no ticktick_id line anywhere in the vault (orphans after line removal).
	 */
	async collectTaskIdsAbsentFromVault(): Promise<string[]> {
		const localTasks = await db.tasks.toArray();
		const candidates = localTasks.filter(
			lt => !lt.deleted && lt.taskId && !this.plugin.projectScheme?.isParentTask(lt.task)
		);
		if (!candidates.length) {
			return [];
		}
		const scan = await scanVaultForDeletionGuard(this.app);
		if (scan.incomplete) {
			log.warn('TickTickSync: vault index incomplete; not inferring deletions from missing task lines');
			return [];
		}
		return candidates
			.filter(lt => {
				if (scan.presentIds.has(lt.taskId)) {
					return false;
				}
				if (lt.file && scan.untrustedFiles.has(lt.file)) {
					return false;
				}
				if (lt.file && isPathInPushScope(lt.file)) {
					return true;
				}
				return (lt.task?.tags ?? []).includes('obsidian');
			})
			.map(lt => lt.taskId);
	}

	/**
	 * After phase 1: one deletion dialog for all removed/orphan tasks, then per-file checklist item cleanup.
	 * Pending-marker checks go through SyncRunContext only (no direct pendingMarkerTaskIds import).
	 */
	async processSyncRemovedTasks(
		filePaths: string[],
		ctx: Pick<SyncRunContext, 'isPendingMarker'>,
	): Promise<void> {
		const mode = deletionConfirmMode();
		if (mode === 'skip') {
			log.info('TickTickSync: mass-delete guard skipped vault→TickTick deletions for this run');
			return;
		}
		const taskIds = new Set<string>();
		for (const filePath of filePaths) {
			for (const id of await this.collectMissingTaskIdsForFile(filePath)) {
				taskIds.add(id);
			}
		}
		for (const id of await this.collectTaskIdsAbsentFromVault()) {
			taskIds.add(id);
		}
		for (const id of [...taskIds]) {
			if (ctx.isPendingMarker(id)) {
				log.info(`TickTickSync: skipping deletion prompt for ${id}; vault marker write is still pending`);
				taskIds.delete(id);
			}
		}
		if (taskIds.size > 0) {
			await this.deleteTasksByIds(
				[...taskIds],
				'Their task lines were removed from Obsidian (or are no longer in the vault)',
				mode === 'force' ? { skipConfirm: true } : undefined,
			);
		}
		for (const filePath of filePaths) {
			const file = this.app.vault.getAbstractFileByPath(filePath);
			if (!(file instanceof TFile) || !isPathInPushScope(filePath)) {
				continue;
			}
			if (!(await this.fileTaskQueries.fileHasTasks(filePath))) {
				continue;
			}
			const content = await this.plugin.fileOperation.readFileContent(file);
			if (!content) {
				continue;
			}
			const body = content.replace(/^---[\s\S]*?---\n/, '');
			await this.checkForDeletedTaskItems(filePath, body);
		}
	}

	/**
	 * Find task IDs that were in the database but are missing from file content
	 */
	private async findMissingTaskIds(currentContent: string, filePath: string): Promise<string[]> {
		// Extract all taskIds currently in the file
		const regex = /%%\[ticktick_id::\s*([a-zA-Z0-9]+)\]%%/gi;
		const matches = currentContent.matchAll(regex);
		const existingTaskIds = new Set([...matches].map((match) => match[1].toLowerCase()));

		// Get taskIds that should be in this file (from database)
		const tasksInFile = await this.fileTaskQueries.getTasksInFile(filePath);
		// Tombstoned tasks (deleted in TickTick, e.g. detached lines) are not "missing".
		// Project parents live as project notes, never as lines: never treat them as removed.
		const dbTaskIds = tasksInFile.filter(lt => !lt.deleted && !this.plugin.projectScheme?.isParentTask(lt.task)).map(lt => lt.taskId).filter(id => !!id);

		// Find tasks in DB but not in file
		let missingTaskIds = dbTaskIds.filter(taskId =>
			!existingTaskIds.has(taskId.toLowerCase())
		);

		// Check if tasks were just moved to another file (not actually deleted)
		if (missingTaskIds.length > 0) {
			const actuallyDeleted: string[] = [];

			for (const taskId of missingTaskIds) {
				// First check if task exists in another file in the vault
				const foundInAnotherFile = await this.findTaskInVault(taskId, filePath);

				if (foundInAnotherFile === 'inconclusive') {
					log.warn(`TickTickSync: not inferring deletion of ${taskId}; a file could not be read or is in conflict/sync-pending`);
				} else if (foundInAnotherFile) {
					log.trace(`Task ${taskId} moved from ${filePath} to ${foundInAnotherFile}`);
				} else {
					// Task not found anywhere in vault - it's actually deleted
					actuallyDeleted.push(taskId);
				}
			}

			missingTaskIds = actuallyDeleted;
		}

		return missingTaskIds;
	}

	/**
	 * Search for a task ID in all vault files (except the specified excluded file)
	 * Returns the file path if found, undefined otherwise
	 */
	private async findTaskInVault(taskId: string, excludeFilePath: string): Promise<string | undefined | 'inconclusive'> {
		const allMarkdownFiles = this.app.vault.getMarkdownFiles();
		const taskIdPattern = new RegExp(`%%\\[ticktick_id::\\s*${taskId}\\]%%`, 'i');
		let inconclusive = false;

		for (const file of allMarkdownFiles) {
			// Skip the file we're checking deletions from
			if (file.path === excludeFilePath) {
				continue;
			}

			const trust = classifyFileRead({
				path: file.path,
				readOk: true,
				syncState: obsidianSyncFileState(this.app, file),
			});
			if (trust !== 'ok') {
				inconclusive = true;
				continue;
			}
			try {
				const content = await syncCachedRead(this.app.vault, file);
				if (taskIdPattern.test(content)) {
					return file.path;
				}
			} catch (error) {
				log.warn(`Error reading file ${file.path} while searching for task ${taskId}:`, error);
				inconclusive = true;
			}
		}

		return inconclusive ? 'inconclusive' : undefined;
	}

	/**
	 * Check for deleted task items (sub-tasks) within tasks
	 */
	private async checkForDeletedTaskItems(filepath: string, currentContent: string): Promise<void> {
		const tasksInFile = await this.fileTaskQueries.getTasksInFile(filepath);

		for (const localTask of tasksInFile) {
			const task = localTask.task;
			if (!task.items || task.items.length === 0) {
				continue;
			}

			// Check which items are missing from the file
			const deletedItems: string[] = [];
			for (const item of task.items) {
				// Task items have their IDs in the markdown as %%itemId%%
				if (!currentContent.includes(item.id)) {
					deletedItems.push(item.id);
				}
			}

			// Remove deleted items from task
			if (deletedItems.length > 0) {
				await this.removeTaskItems(task, deletedItems, filepath);
			}
		}
	}

	/**
	 * Remove task items from a task
	 */
	private async removeTaskItems(task: ITask, itemIds: string[], filepath: string): Promise<void> {
		try {
			// Filter out deleted items
			task.items = task.items?.filter(item => !itemIds.includes(item.id)) || [];

			// Update task in TickTick
			task.modifiedTime = this.plugin.dateMan?.formatDateToISO(new Date());

			// Add Obsidian URL if configured
			const taskURL = this.plugin.taskParser.getObsidianUrlFromFilepath(filepath);
			if (taskURL && getSettings().fileLinksInTickTick === 'taskLink') {
				task.title = stripFileLinks(task.title) + ' ' + taskURL;
			}

			const updatedTask = await this.plugin.tickTickRestAPI?.updateTask(task);

			// Update in database
			if (updatedTask) {
				await this.plugin.taskRepository.upsertTask(updatedTask, filepath, Date.now());
			}

			log.debug(`Removed ${itemIds.length} items from task ${task.id}`);
		} catch (error) {
			log.error('Task item removal failed:', error);
		}
	}

	private async filterStillReferenced(ids: string[]): Promise<string[]> {
		const present = await idsPresentInVault(this.app, ids);
		return ids.filter(id => !present.has(id));
	}

	/**
	 * Delete tasks by their IDs with user confirmation
	 */
	async deleteTasksByIds(taskIds: string[], reason = 'The tasks were removed from the file', opts?: { skipConfirm?: boolean }): Promise<string[]> {
		if (taskIds.length === 0) {
			return [];
		}

		// Never delete project parents; skip ids that still exist in some note (file recreated / task moved).
		taskIds = await this.filterStillReferenced(taskIds.filter(id => !this.plugin.projectScheme?.isParentId(id)));
		if (taskIds.length === 0) return [];
		if (deletionConfirmMode() === 'skip') {
			log.info('TickTickSync: mass-delete guard skipped TickTick deletions for this run');
			return [];
		}
		// Get confirmation from user. Apply-once already confirmed in the guard dialog.
		if (!opts?.skipConfirm && deletionConfirmMode() !== 'force') {
		const prompt = await this.confirmDeletion(taskIds, reason);
		if (!prompt.confirmed) {
			if (!prompt.suppressedPending) {
				const msg = prompt.timedOut
					? 'TickTickSync: TickTick tasks were not deleted (dialog timed out). Run sync again and choose Confirm Deletion.'
					: 'TickTickSync: TickTick tasks were not deleted. Choose Confirm Deletion on the dialog, restore the task lines in Obsidian, or delete the tasks in TickTick manually.';
				new Notice(msg, 8000);
			}
			return [];
		}
		}

		const deletedTaskIds: string[] = [];

		// Delete each task from TickTick and database
		for (const taskId of taskIds) {
			try {
				const projectId = await this.plugin.taskRepository?.getProjectIdForTask(taskId);

				// Delete from TickTick
				if (projectId) {
					await this.plugin.tickTickRestAPI?.deleteTask(taskId, projectId);
				}

				// Mark as deleted in database (tombstone pattern)
				await this.plugin.taskRepository.deleteTask(taskId);
				deletedTaskIds.push(taskId);

			} catch (error) {
				log.error(`Failed to delete task ${taskId}:`, error);
			}
		}

		if (deletedTaskIds.length > 0) {
			await this.plugin.saveSettings();
			log.debug(`Deleted ${deletedTaskIds.length} tasks`);
			new Notice(`TickTickSync: deleted ${deletedTaskIds.length} task(s) on TickTick.`, 6000);
		}

		return deletedTaskIds;
	}

	/**
	 * Confirm deletion with user via modal
	 */
	private async confirmDeletion(taskIds: string[], reason: string): Promise<DeletionPromptResult> {
		const items = await this.fileTaskQueries.getDeletionItems(taskIds);

		const modal = new TaskDeletionModal(
			this.app,
			items,
			reason,
			() => {}
		);

		return await modal.showModal();
	}

	/**
	 * Delete a task from a specific file (used when task is invalid)
	 */
	async deleteTaskFromFile(task: ITask): Promise<void> {
		try {
			const filepath = await this.fileTaskQueries.getFilepathForTask(task.id);
			if (filepath) {
				const file = this.app.vault.getAbstractFileByPath(filepath);
				if (file instanceof TFile) {
					await this.plugin.fileOperation?.deleteTaskFromSpecificFile(file, task, true);
				}
			}
		} catch (error) {
			log.error(`Error deleting task ${task.id} from file:`, error);
		}
	}

	/**
	 * Delete multiple tasks from a specific file
	 */
	async deleteTasksFromFile(filepath: string, tasks: ITask[]): Promise<void> {
		try {
			const file = this.app.vault.getAbstractFileByPath(filepath);
			if (file instanceof TFile) {
				await this.plugin.fileOperation?.deleteTasksFromSpecificFile(file, tasks, false);
			}
		} catch (error) {
			log.error(`Error deleting tasks from file ${filepath}:`, error);
		}
	}

	/**
	 * Handle file deletion - delete all tasks in the file
	 */
	async handleFileDeleted(filepath: string): Promise<void> {
		const hasTasks = await this.fileTaskQueries.fileHasTasks(filepath);
		if (!hasTasks) {
			return;
		}

		const taskIds = await this.fileTaskQueries.getTaskIdsInFile(filepath);
		if (taskIds.length > 0) {
			const mode = deletionConfirmMode();
			if (mode === 'skip') return;
			await this.deleteTasksByIds(taskIds, 'The tasks were removed from the file', mode === 'force' ? { skipConfirm: true } : undefined);
		}

		// Clean up file metadata
		await this.plugin.fileMetadataService?.deleteFileMetadata(filepath);
	}

	/**
	 * Clean up orphaned tasks (tasks in DB with no file mapping)
	 */
	async cleanupOrphanedTasks(): Promise<number> {
		try {
			const allTasks = await this.plugin.taskRepository?.loadAllTasks();
			let orphanedCount = 0;

			for (const task of allTasks || []) {
				const filepath = await this.fileTaskQueries.getFilepathForTask(task.id);
				if (!filepath || filepath.length === 0) {
					log.debug(`Orphaned task found: ${task.id} - ${task.title}`);
					orphanedCount++;
				}
			}

			if (orphanedCount > 0) {
				log.warn(`Found ${orphanedCount} orphaned tasks (no file mapping)`);
			}

			return orphanedCount;
		} catch (error) {
			log.error('Error checking for orphaned tasks:', error);
			return 0;
		}
	}
}
