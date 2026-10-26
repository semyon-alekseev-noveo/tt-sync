import { childBlocks, sortOrdersFromLines, reorderLinesBySortOrder } from '@/subtaskOrder';
import { beginFileRun, commitVaultText, editorsForFile, readNoteForWrite, syncRead } from '@/sync/vault-io';
import { deferActiveFilePush, releaseDeferredActiveFilePushes } from '@/services/activeFilePush';
import { loadPluginWrites, pluginWriteMtimes } from '@/utils/editedSince';
import { idsPresentInVault } from '@/utils/vaultIdScan';
import { shouldBackupToday } from '@/backupPolicy';
import type { PluginContext } from '@/pluginContext';
import { Tick } from '@/api';
import { getDefaultFolder, getSettings, updateSettings } from '@/settings';
import { doWithLock } from '@/utils/locks';
import { SyncMan } from '@/services/syncModule';
import { Editor, type MarkdownFileInfo, MarkdownView, Notice, TFile } from 'obsidian';
import { FileOperation } from '@/fileOperation';
import { NewFileMap } from '@/services/NewFileMap';
//Logging
import log from '@/utils/logger';
import { OrphanTaskModal, type OrphanItem } from '@/modals/OrphanTaskModal';
import type { SyncTrigger } from '@/services/SyncActivityIndicator';
import type { ITask } from '@/api/types/Task';
import { getTick } from '@/api/tick_singleton_factory'
import { clearGuardRun } from '@/sync/massDeleteGuard';
import { createSyncRunContext, type SyncRunContext } from '@/sync/SyncRunContext';
import {
	runDeletionGuardPhase,
	runPreparePhase,
	runProjectsPhase,
	runPullPhase,
	runPushPhase,
	runRegisterPhase,
	runSubtasksPhase,
	runSyncFilesPhase,
	runVaultReconcilePhase,
} from '@/sync/phases';
import { runSyncFilesPass } from '@/sync/phases/syncFilesPass';
import { runCheckDatabase } from '@/services/checkDatabase';
import { pathsForPrePullPush } from '@/sync/vault-push/pushLocalPaths';
import type { SyncRunResult } from '@/sync/result';
import { db, initDB } from "@/db/dexie";
import { getAllProjects, getProjectById, upsertProjects } from '@/db/projects';
import { loadTasksFromCache } from "@/db/tasks";
import { getAllFiles, getFile, upsertFile } from "@/db/files";
import type { IProject } from '@/api/types/Project';
import { isPathInPushScope } from '@/syncScope';
import { finishSyncPerf, formatSyncPerf, formatSyncPerfShort, observeSyncApi, startSyncPerf, timePhase } from '@/sync/perf';

const LOCK_TASKS = 'LOCK_TASKS';


//TODO: encapsulate all api and cache
export class TickTickService {
	initialized: boolean = false;
	plugin: PluginContext;
	tickTickSync!: SyncMan;
	api?: Tick;
	fileOperation?: FileOperation;

	constructor(plugin: PluginContext) {
		this.plugin = plugin;
	}

	initialize(): boolean {
		try {
			const token = getSettings().token;
			if (!token) {
				log.debug('Please login from settings.');
				return false;
			}
			if (getSettings().inboxID.length === 0) {
				log.warn('Something is wrong with your inbox ID.');
				//TODO re login or ask user?
			}

			this.api = getTick({
				baseUrl: getSettings().baseURL,
				token: token,
				checkPoint: getSettings().checkPoint
			});
			//initialize file operation
			this.fileOperation = new FileOperation(this.plugin.app, this.plugin);
			this.tickTickSync = new SyncMan(this.plugin.app, this.plugin);
			this.initialized = true;
			return true;
		} catch (error) {
			log.error('Error on initialization: ', error);
		}
		return false;
	}

	/** Startup backup, at most once per local day (settings.lastBackupDate). */
	backup() {
		const today = shouldBackupToday(getSettings().lastBackupDate, new Date());
		if (!today) return;
		updateSettings({ lastBackupDate: today }, { persist: false });
		void this.plugin.saveSettings();
		void this.tickTickSync?.backupTickTickAllResources();
	}

	//MB can be static
	async login(baseUrl: string, username: string, password: string):
		Promise<{ inboxId: string; token: string } | null> {
		try {
			const api = getTick({
				username: username,
				password: password,
				baseUrl: baseUrl,
				token: '',
				checkPoint: 0
			});
			//try login
			const result = await api.login();
			let error: { operation: string, statusCode: string, errorMessage: string };
			if (!result) {
				error = api.lastError as { operation: string; statusCode: string; errorMessage: string; };
				const errorString = 'Login Failed. ' + JSON.stringify(error.errorMessage, null, 4);
				new Notice(errorString, 5000);
				log.error("Login Fail!: ", errorString);
				throw new Error(error.errorMessage);
			}
			const defaultProjectId = getSettings().defaultProjectId;
			const defaultProjectName = getSettings().defaultProjectName;
			if (!defaultProjectId || defaultProjectId == '' || (defaultProjectName == "Inbox" && (defaultProjectId != result.inboxId))) {
				//no default project id or blank default project id or (default project is inbox, but the ID is different.
				updateSettings({ defaultProjectId: result.inboxId }, { persist: false });
			}
			//reset the checkpoint so next time they get ALL the tasks.
			updateSettings({ checkPoint: 0 }, { persist: false });
			await this.plugin.saveSettings();
			return result;
		} catch (error) {
			log.error('Error on login: ', error);
		}
		return null;
	}

	private locallyEdited = new Set<string>();
	async pushLocalEditsFirst(since?: number, trigger: SyncTrigger = 'manual'): Promise<Set<string>> {
		this.locallyEdited = new Set();
		const meta = since == null ? await db.meta.get("sync") : undefined;
		if (meta?.pluginWriteMtimes) loadPluginWrites(meta.pluginWriteMtimes);
		// BUG-COMMENT-NO-PUSH: vault mtime must compare to last push time, not TickTick checkpoint
		// (checkpoint often exceeds file mtime after pull, so comment-only edits were skipped).
		const last = since ?? meta?.lastVaultPushWallMs ?? 0;
		const files = await this.plugin.fileMetadataService?.getAllFileMetadata();
		const registered = Object.keys(files ?? {});
		const edited = pathsForPrePullPush(this.plugin.app, registered, last, {
			manualSync: trigger === 'manual',
		});
		this.locallyEdited = new Set(edited);
		for (const path of edited) {
			try { await this.plugin.taskModificationDetector.checkFileForModifications(path); }
			catch (e) { log.warn('pre-pull push failed', path, e); }
			try { await this.pushSubtaskOrder(path); } catch (e) { log.warn('subtask order push failed', path, e); }
		}
		return this.locallyEdited;
	}

	/** Obsidian -> TickTick: sibling line order under a parent becomes child sortOrder. */
	async pushSubtaskOrder(path: string) {
		const f = this.plugin.app.vault.getAbstractFileByPath(path);
		if (!(f instanceof TFile)) return;
		const lines = (await syncRead(this.plugin.app.vault, f)).split('\n');
		const upd: { id: string; projectId: string; sortOrder: number }[] = [];
		for (const [, blocks] of childBlocks(lines)) {
			const so: Record<string, number | undefined> = {}; const pid: Record<string, string> = {};
			for (const b of blocks) { const t = await this.plugin.taskRepository.loadTaskById(b.id); so[b.id] = t?.sortOrder; pid[b.id] = t?.projectId ?? ''; }
			for (const [id, sortOrder] of Object.entries(sortOrdersFromLines(blocks.map(b => b.id), so))) {
				upd.push({ id, projectId: pid[id], sortOrder });
				const t = await this.plugin.taskRepository.loadTaskById(id);
				if (t) { t.sortOrder = sortOrder; await this.plugin.taskRepository.upsertTask(t, path, Date.now()); }
			}
		}
		if (upd.length) { await this.plugin.tickTickRestAPI?.api?.setSortOrders(upd); log.info(`Subtask order pushed for ${upd.length} task(s) in ${path}`); }
	}

	/** TickTick -> Obsidian: reorder sibling lines to TickTick sortOrder (files not edited locally). */
	async pullSubtaskOrder(skip: Set<string>) {
		const files = await this.plugin.fileMetadataService?.getAllFileMetadata();
		for (const path of Object.keys(files ?? {})) {
			if (skip.has(path)) continue;
			const f = this.plugin.app.vault.getAbstractFileByPath(path);
			if (!(f instanceof TFile)) continue;
			const text = await readNoteForWrite(this.plugin.app, f);
			const lines = text.split('\n'); const so: Record<string, number | undefined> = {};
			for (const [, blocks] of childBlocks(lines)) for (const b of blocks) so[b.id] = (await this.plugin.taskRepository.loadTaskById(b.id))?.sortOrder;
			const out = reorderLinesBySortOrder(lines, so);
			if (out) { await commitVaultText(this.plugin.app, f, text, out.join('\n')); log.info(`Subtasks reordered from TickTick in ${path}`); }
		}
	}

	async synchronization(fullSync: boolean = false, trigger: SyncTrigger = 'manual'): Promise<SyncRunResult> {
		if (this.plugin.redo) {
			return this.plugin.redo.session('sync', () => this.synchronizationInner(fullSync, trigger));
		}
		return this.synchronizationInner(fullSync, trigger);
	}

	/**
	 * Push settled edits for a note after the quiet period.
	 * Markdown editor: `identifiedOnly` (skip unfinished new checkboxes; comment sweep only via hash).
	 * BUG-COMMENT-ABYSS-VIEW: Abyss / background vault.modify passes `identifiedOnly: false` so comment sweep runs.
	 */
	async pushSettledActiveFile(
		filepath: string,
		skipLines: number[] = [],
		opts?: { identifiedOnly?: boolean },
	): Promise<void> {
		if (!filepath || !isPathInPushScope(filepath)) return;
		if (this.plugin.syncRunning) {
			deferActiveFilePush(filepath);
			return;
		}
		const identifiedOnly = opts?.identifiedOnly !== false;
		const perfRun = startSyncPerf({ trigger: 'active-file', fullSync: false });
		let endFiles: () => void = () => undefined;
		let endApi: () => void = () => undefined;
		let ok = true;
		try {
			endFiles = beginFileRun(this.plugin.app.vault, { editorOpen: (path) => editorsForFile(this.plugin.app, path).length > 0 });
			endApi = observeSyncApi(this.plugin.tickTickRestAPI);
			const run = async () => {
				await doWithLock(LOCK_TASKS, async () => {
					await this.plugin.taskModificationDetector.checkFileForModifications(filepath, undefined, {
						skipLines: new Set(skipLines),
						identifiedOnly,
					});
				});
			};
			await timePhase('activeFile', async () => {
				if (this.plugin.syncActivity) {
					await this.plugin.syncActivity.runInline('Updating open note…', run);
				} else {
					await run();
				}
			});
		} catch (error) {
			ok = false;
			throw error;
		} finally {
			endApi();
			endFiles();
			log.info(`[perf] ${formatSyncPerf(finishSyncPerf(perfRun, ok))}`);
		}
	}

	async synchronizationInner(fullSync: boolean = false, trigger: SyncTrigger = 'manual'): Promise<SyncRunResult> {
		const startTime = performance.now();
		const perfRun = startSyncPerf({ trigger, fullSync });
		const ui = this.plugin.syncActivity;
		ui.beginFull(trigger);
		let endFiles: () => void = () => undefined;
		let endApi: () => void = () => undefined;
		let syncOk = true;
		let errorMessage = '';
		clearGuardRun();
		const syncCtx = createSyncRunContext({ trigger, fullSync });
		const phaseDeps = { plugin: this.plugin, service: this, ui, ctx: syncCtx };
		await syncCtx.reconcilePendingMarkers((ids) => idsPresentInVault(this.plugin.app, ids));
		log.debug(`TickTickSync run ${syncCtx.syncId} (${trigger}, fullSync=${fullSync})`);
		try {
			endFiles = beginFileRun(this.plugin.app.vault, { editorOpen: (path) => editorsForFile(this.plugin.app, path).length > 0 });
			endApi = observeSyncApi(this.plugin.tickTickRestAPI);

			log.debug(`TickTick scheduled synchronization task started at ${new Date().toLocaleString()}`);
			// NEW: Use TaskCache
			this.plugin.syncRunning = true;
			await timePhase('prepare', async () => {
				await runPreparePhase(phaseDeps);
			});

			await doWithLock(LOCK_TASKS, async () => {
				if (this.plugin.tickTickRestAPI) {
					const lockedDeps = { ...phaseDeps, tickApi: this.plugin.tickTickRestAPI };
					await timePhase('projects', () => runProjectsPhase(lockedDeps));
					await timePhase('register', () => runRegisterPhase(lockedDeps));
					await timePhase('deletionGuard', () => runDeletionGuardPhase(lockedDeps));
					await timePhase('push', () => runPushPhase(lockedDeps));
					await timePhase('pull', () => runPullPhase(lockedDeps));
					await timePhase('vaultReconcile', () => runVaultReconcilePhase(lockedDeps));
					await timePhase('subtasks', () => runSubtasksPhase(lockedDeps));
				}
			});
			// syncFilesPass times `syncFiles` + `vaultDeletion` under one LOCK_TASKS (#66).
			await runSyncFilesPhase(phaseDeps);
		} catch (error) {
			syncOk = false;
			errorMessage = error instanceof Error ? error.message : String(error);
			ui.setFullStep('Sync failed', errorMessage);
			log.error('Error on synchronization: ', error);
		} finally {
			syncCtx.resetLifecycle();
			clearGuardRun();
			endApi();
			endFiles();
			const report = finishSyncPerf(perfRun, syncOk);
			log.info(`[perf] ${formatSyncPerf(report)}`);
			ui.endFull(syncOk, formatSyncPerfShort(report));
			// NEW: Clear TaskCache
			this.plugin.taskCache?.clear();
			try { await db.meta.update('sync', { pluginWriteMtimes: pluginWriteMtimes() }); }
			catch (e) { log.warn('plugin write map save failed', e); }
			this.plugin.syncRunning = false;
			releaseDeferredActiveFilePushes();
			try { await this.plugin.applyExternalSettings(); } catch (e) { log.error('Applying external settings failed', e); }
			const endTime = performance.now();
			log.debug(`TickTick scheduled synchronization task completed at ${new Date().toLocaleString()}, took ${(endTime - startTime).toFixed(2)} ms`);
		}
		return syncOk ? { ok: true } : { ok: false, error: errorMessage || 'Sync failed' };
	}

	async ensureVaultFilesRegistered(): Promise<void> {
		const vault = this.plugin.app.vault;
		const markdownFiles = vault.getMarkdownFiles();
		const allProjects = await this.getProjects();

		for (const file of markdownFiles) {
			const dbFile = await getFile(file.path);
			if (!dbFile) {
				await this.registerNewVaultFile(file, allProjects);
			}
		}
	}

	/**
	 * Register a new (previously unseen) vault file in the database.
	 * Also used by `runCheckDatabase` (#66). When keepProjectFolders is on and the
	 * basename matches a project but the path differs, presents a location conflict.
	 */
	async registerNewVaultFile(file: TFile, allProjects: IProject[]): Promise<void> {
		// Look up file name in projects cache to auto-associate
		const fileName = file.basename;
		const matchingProject = allProjects.find(p => p.name === fileName);

		if (matchingProject && getSettings().keepProjectFolders && this.plugin.folderSyncService) {
			const basePath = getDefaultFolder();
			const expectedFolderPath = await this.plugin.folderSyncService.getFolderPathForProject(matchingProject.id);
			const fileFolder = file.path.includes('/') ? file.path.substring(0, file.path.lastIndexOf('/')) : '';

			// If group lookup failed (expected == base path) and file is in a subfolder,
			// we can't determine the correct location — fall back to plain auto-association
			// (mirrors the guard used in checkDataBase).
			const canDetermineGroup = !(expectedFolderPath === basePath && fileFolder !== basePath);

			if (canDetermineGroup) {
				const expectedPath = await this.plugin.folderSyncService.getFilePathForProject(matchingProject.id, matchingProject.name);
				if (expectedPath !== file.path) {
					log.debug(`Found new file ${file.path} matching project "${matchingProject.name}" but expected at ${expectedPath}. Presenting location conflict.`);
					await this.plugin.folderSyncService.resolveFileLocationConflict(file.path, expectedPath, matchingProject);
					return;
				}
			}
		}

		if (matchingProject) {
			log.debug(`Auto-associating file with project: ${file.path} -> ${matchingProject.name}`);
			await upsertFile(file.path, matchingProject.id);
		} else {
			log.debug(`Registering file without project association: ${file.path}`);
			await upsertFile(file.path);
		}
	}

	async saveProjectsToCache(): Promise<IProject[] | undefined> {
		await initDB();
		let projects = await this.api?.getProjects();
		if (projects) {
			// Also get project groups
			const groups = await this.api?.getProjectGroups();
			if (groups && groups.length > 0) {
				await db.projectGroups.clear();
				await db.projectGroups.bulkPut(groups.map(g => ({ id: g.id, group: g })));
			}
			// Also fetch tags and cache them
			const tags = await this.api?.getTags();
			if (tags) {
				await this.plugin.tagService.saveTags(tags);
			}
			if (!await this.plugin.projectSyncService.saveProjectsToCache(projects)) {
				projects = undefined;
			}
		}
		return projects;
	}

	async getProjects() {
		return await getAllProjects();
	}

	async getTasks(filter: string) {
		log.debug('getTasks', filter);
		return await loadTasksFromCache();
	}

	async deletedTaskCheck(filePath: string | null) {
		return await doWithLock(LOCK_TASKS, async () => {
			//NEW: Use TaskDeletionHandler
			await this.plugin.taskDeletionHandler.checkFileForDeletedTasks(filePath);
		});
	}

	async deletedFileCheck(filePath: string): Promise<boolean> {
		//NEW: Use FileTaskQueries
		const hasTasks = await this.plugin.fileTaskQueries.fileHasTasks(filePath);
		if (!hasTasks) {
			return false;
		}

		await doWithLock(LOCK_TASKS, async () => {
			//NEW: Use TaskDeletionHandler
			await this.plugin.taskDeletionHandler.handleFileDeleted(filePath);
		});
		return true;
	}

	async renamedFileCheck(filePath: string, oldPath: string): Promise<boolean> {
		//NEW: Use FileTaskQueries
		const hasTasks = await this.plugin.fileTaskQueries.fileHasTasks(oldPath);
		const hasDefaultProjectId = await this.plugin.fileTaskQueries.filepathHasDefaultProjectID(oldPath);

		// Only process rename if file has tasks OR has a default project ID
		if (!hasTasks && !hasDefaultProjectId) {
			return false;
		}

		await doWithLock(LOCK_TASKS, async () => {
			// Check if file was moved between folders (project groups), or got renamed.
			const groupChange = await this.plugin.folderSyncService?.detectProjectGroupChange(oldPath, filePath);

			if (groupChange?.changed) {
				log.info(`File moved or renamed, updating tasks`);
				//TODO: IS this the right place to do this?
				if (groupChange.newGroupId) {
					log.debug("group move ", groupChange)
					const project = await getProjectById(groupChange.newProjectId!);
					if (!project) {
						log.error("No project found for ID: ", groupChange.newProjectId)
						return false;
					}
					if (project) {
						project.groupId = groupChange.newGroupId
						project.name = groupChange.newProjectName ?? ''
						await this.plugin.tickTickRestAPI?.updateProject(project)
						const aProjects: IProject[] = [];
						aProjects.push(project);
						await upsertProjects(aProjects)
					}
				}

				// Get all tasks in this file
				const tasks = await this.plugin.fileTaskQueries.getTasksInFile(oldPath);

				// Move each task to the new project
				for (const currentTask of tasks) {
					try {
						const task = await this.plugin.taskRepository.loadTaskById(currentTask.taskId);
						const newProjectId = groupChange.newProjectId;
						if (task && newProjectId && task.projectId !== newProjectId) {
							// Update project in TickTick
							await this.plugin.tickTickRestAPI?.moveTaskProject(
								task,
								task.projectId,
								newProjectId
							);

							// Update local cache
							task.projectId = newProjectId;
							await this.plugin.taskRepository.upsertTask(task, filePath, Date.now());

							log.debug(`Moved task ${task.id} to project ${groupChange.newProjectId}`);
						}
					} catch (error) {
						log.error(`Error moving task ${currentTask.taskId} to new project:`, error);
					}
				}

				new Notice(`File moved to different project group. ${tasks.length} task(s) updated.`);
			}

			//NEW: Use TaskOperationsService
			await this.plugin.taskOperationsService.updateTaskContentForFile(filePath);
			await this.plugin.fileMetadataService.updateFilePath(oldPath, filePath);
		});
		return true;
	}

	async fullTextNewTaskCheck(filepath: string) {
		await this.plugin.syncActivity.runInline('Pushing new tasks…', async () => {
			await doWithLock(LOCK_TASKS, async () => {
				await this.plugin.taskModificationDetector.checkFileForNewTasks(filepath);
			});
		});
	}

	async lineNewContentTaskCheck(editor: Editor, info: MarkdownView | MarkdownFileInfo) {
		return await this.plugin.syncActivity.runInline('Creating task…', async () => {
			return await doWithLock(LOCK_TASKS, async () => {
				await this.plugin.taskModificationDetector.checkLineForNewTask(editor, info);
			});
		});
	}

	/** The caret left this line, so the line is finished enough to create or update. */
	async lineSettledCheck(filepath: string, lastLineText: string, lastLine: number): Promise<boolean> {
		return await this.plugin.syncActivity.runInline('Updating task…', async () => {
			return await doWithLock(LOCK_TASKS, async () => {
				const file = this.plugin.app.vault.getAbstractFileByPath(filepath);
				if (!(file instanceof TFile)) { return false; }
				const fileMap = new NewFileMap(this.plugin.app, this.plugin, file);
				await fileMap.init();
				await this.plugin.projectScheme?.ensurePushContext?.();
				const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
				const editor = view?.editor ?? null;
				await this.plugin.taskModificationDetector.addNewTask(
					lastLineText,
					lastLine,
					editor,
					editor ? { line: lastLine, ch: 0 } : null,
					fileMap,
				);
				return await this.plugin.taskModificationDetector.checkLineForModifications(filepath, lastLineText, lastLine, fileMap);
			});
		});
	}

	async lineModifiedTaskCheck(filepath: string, lastLineText: string, lastLine: number): Promise<boolean> {
		return await this.plugin.syncActivity.runInline('Updating task…', async () => {
			return await doWithLock(LOCK_TASKS, async () => {
				const file = this.plugin.app.vault.getAbstractFileByPath(filepath);
				if (!(file instanceof TFile)) { return false; }
				const fileMap = new NewFileMap(this.plugin.app, this.plugin, file);
				await fileMap.init();
				return await this.plugin.taskModificationDetector.checkLineForModifications(filepath, lastLineText, lastLine, fileMap);
			});
		});
	}


	/*
	 * called only from settings tab
	 */

	async checkDataBase() {
		return runCheckDatabase({
			plugin: this.plugin,
			api: this.api,
			fileOperation: this.fileOperation,
			getProjects: () => this.getProjects(),
			registerNewVaultFile: (file, projects) => this.registerNewVaultFile(file, projects),
		});
	}

	async reorganizeFilesToFolders(): Promise<number> {
		if (!this.plugin.folderMigrationService) {
			throw new Error('FolderMigrationService is not initialized');
		}
		return await this.plugin.folderMigrationService.reorganizeFilesToFolders();
	}

	async closeTask(taskId: string) {
		await this.plugin.syncActivity.runInline('Completing task…', async () => {
			await this.plugin.taskOperationsService.closeTask(taskId);
		});
	}

	async openTask(taskId: string): Promise<void> {
		await this.plugin.syncActivity.runInline('Reopening task…', async () => {
			await this.plugin.taskOperationsService.reopenTask(taskId);
		});
	}

	// private async syncTickTickToObsidian(): Promise<boolean> {
	// 	return this.tickTickSync.syncTickTickToObsidian();
	// }

	/**
	 * Project-note file pass + vault→TT deletion. Body lives in
	 * `sync/phases/syncFilesPass` (#66); Phase 1→2 stay under one LOCK_TASKS.
	 */
	async syncFiles(bForceUpdate: boolean, ctx?: SyncRunContext) {
		const syncCtx = ctx ?? createSyncRunContext({ trigger: 'manual', fullSync: false });
		await runSyncFilesPass(
			{ plugin: this.plugin, service: this, ctx: syncCtx },
			bForceUpdate,
		);
	}
}
