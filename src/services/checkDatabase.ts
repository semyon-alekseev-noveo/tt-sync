/**
 * Manual "Check database" maintenance (settings). Extracted from TickTickService (#66).
 */
import type { PluginContext } from '@/pluginContext';
import type { Tick } from '@/api';
import type { ITask } from '@/api/types/Task';
import type { IProject } from '@/api/types/Project';
import type { FileOperation } from '@/fileOperation';
import { NewFileMap } from '@/services/NewFileMap';
import { CleanupDatabaseModal } from '@/modals/CleanupDatabaseModal';
import { TaskDeletionModal } from '@/modals/TaskDeletionModal';
import { OrphanTaskModal, type OrphanItem } from '@/modals/OrphanTaskModal';
import { db } from '@/db/dexie';
import { getAllFiles, getFile, upsertFile } from '@/db/files';
import { getDefaultFolder, getSettings } from '@/settings';
import { doWithLock } from '@/utils/locks';
import { Notice, TFile } from 'obsidian';
import log from '@/utils/logger';

const LOCK_TASKS = 'LOCK_TASKS';

export interface CheckDatabaseHost {
	plugin: PluginContext;
	api?: Tick;
	fileOperation?: FileOperation;
	getProjects(): Promise<IProject[]>;
	registerNewVaultFile(file: TFile, allProjects: IProject[]): Promise<void>;
}

export async function runCheckDatabase(host: CheckDatabaseHost): Promise<void> {
		return await host.plugin.syncActivity.runInline('Checking database…', async () => {
		const vault = host.plugin.app.vault;
		const markdownFiles = vault.getMarkdownFiles();
		const allProjects = await host.getProjects();
		const dbFiles = await getAllFiles();

		log.debug(`Checking database for ${markdownFiles.length} markdown files and ${dbFiles.length} DB entries.`);

		const tasksToDelete: { filepath: string, taskId: string, title: string }[] = [];
		const tasksToResolve: { filepath: string, taskId: string, title: string, projectId: string, task: ITask, inFile: boolean }[] = [];
		const deletedFiles: string[] = [];
		const allLocalIds = new Set<string>();

		await doWithLock(LOCK_TASKS, async () => {
			// 0. Fetch fresh project groups and verify file locations against projects/groups
			{
				const freshGroups = await host.api?.getProjectGroups();
				if (freshGroups && freshGroups.length > 0) {
					await db.projectGroups.clear();
					await db.projectGroups.bulkPut(freshGroups.map(g => ({ id: g.id, group: g })));
					log.debug(`Cached ${freshGroups.length} project groups from API`);
				}
			}
			if (getSettings().keepProjectFolders && host.plugin.folderSyncService) {
				const basePath = getDefaultFolder();
				let movedCount = 0;
				for (const file of markdownFiles) {
					const dbFile = await getFile(file.path);
					if (!dbFile?.defaultProjectId) continue;
					if (dbFile.managedByPlugin === false) continue;

					const project = allProjects.find(p => p.id === dbFile.defaultProjectId);
					if (!project) continue;

					const expectedFolderPath = await host.plugin.folderSyncService.getFolderPathForProject(project.id);
					const expectedPath = await host.plugin.folderSyncService.getFilePathForProject(project.id, project.name);

					// If group lookup failed (expected == base path) and file is in a subfolder,
					// we can't determine the correct location — skip to avoid pulling files to root
					const fileFolder = file.path.contains('/') ? file.path.substring(0, file.path.lastIndexOf('/')) : '';
					if (expectedFolderPath === basePath && fileFolder !== basePath) {
						log.debug(`[checkDB] Skipping ${file.path}: cannot determine project group for ${project.id}`);
						continue;
					}

					if (file.path !== expectedPath) {
						log.debug(`[checkDB] Moving file ${file.path} to ${expectedPath}`);
						const result = await host.plugin.folderSyncService.moveFileToProjectFolder(
							file.path, expectedFolderPath, file.name
						);
						if (result) movedCount++;
					}
				}
				if (movedCount > 0) {
					log.info(`[checkDB] Reorganized ${movedCount} file(s) to match project group structure`);
				}
			}

			// 1. Handle files that were moved/renamed (have tasks but wrong path in DB)
			for (const dbFile of dbFiles) {
				const vaultFile = vault.getAbstractFileByPath(dbFile.path);
				if (!vaultFile || !(vaultFile instanceof TFile)) {
					const metadata = await host.plugin.fileMetadataService.getFileMetadata(dbFile.path);
					if (metadata && metadata.TickTickTasks && metadata.TickTickTasks.length > 0) {
						const task1 = metadata.TickTickTasks[0];
						const searchResult = await host.fileOperation?.searchFilepathsByTaskidInVault(task1.taskId);
						if (searchResult) {
							log.debug(`File ${dbFile.path} moved to ${searchResult}. Updating DB.`);
							await host.plugin.fileMetadataService.updateFilePath(dbFile.path, searchResult);
							continue;
						}
					}
					log.debug(`Found DB entry for non-existent file: ${dbFile.path}`);
					deletedFiles.push(dbFile.path);
				}
			}

			// 2. Ensure all vault files are in DB and match with projects if possible
			for (const file of markdownFiles) {
				const dbFile = await getFile(file.path);
				if (!dbFile) {
					await host.registerNewVaultFile(file, allProjects);
				} else {
					const fileName = file.basename;
					const matchingProject = allProjects.find(p => p.name === fileName);
					if (matchingProject?.id != dbFile.defaultProjectId) {
						log.debug(`Project mismatch  DB entry: ${file.path} -> ${matchingProject?.id} vs ${dbFile.defaultProjectId}`);
						await upsertFile(file.path, matchingProject?.id);
					}
				}
			}

			// 3. Consistency check for tasks and missed tasks
			const metadatas = await host.plugin.fileMetadataService?.getAllFileMetadata();
			if (!metadatas) return;

			for (const filepath in metadatas) {
				const value = metadatas[filepath];
				const obsidianURL = host.plugin.taskParser.getObsidianUrlFromFilepath(filepath);

				const file = vault.getAbstractFileByPath(filepath);
				if (!(file instanceof TFile)) {
					log.debug(`[checkDB] SKIP file ${filepath} — not a valid TFile`);
					continue;
				}

			const fileMap = new NewFileMap(host.plugin.app, host.plugin, file);
				await fileMap.init();
				
				// We check tasks actually in the file and tasks the DB thinks are in the file
				const dbTaskIds = value.TickTickTasks.map(t => t.taskId);
				const physicalTaskIds = fileMap.getTasks();
				log.debug(`[checkDB] File ${filepath}: dbTaskIds=${dbTaskIds.length}, physicalTaskIds=${physicalTaskIds.length}, allTaskIds=${Array.from(new Set([...dbTaskIds, ...physicalTaskIds])).length}`);
				//NEW: Use FileTaskQueries for duplicate detection
				const duplicates = await host.plugin.fileTaskQueries.findDuplicateTasks() as unknown as Array<{ taskId: string }>;
				if (duplicates.length > 0) {
					log.warn(`Found ${duplicates.length} duplicate tasks in ${filepath}:`, duplicates.map(d => d.taskId));
				}
				const allTaskIds = Array.from(new Set([...dbTaskIds, ...physicalTaskIds]));
				for (const id of allTaskIds) allLocalIds.add(id);

				// Track whether any task in this file needs an Obsidian URL update
				let needsUrlUpdate = false;

			for (const taskId of allTaskIds) {
				log.debug(`[checkDB] Processing task ${taskId} in file ${filepath} (inDB=${dbTaskIds.includes(taskId)}, inFile=${physicalTaskIds.includes(taskId)})`);

				// Skip tasks without #ticktick tag
				if (!dbTaskIds.includes(taskId) && physicalTaskIds.includes(taskId)) {
					const taskLine = fileMap.getTaskRecord(taskId).task;
					if (!host.plugin.taskParser?.isLineTrackedForSync(taskLine, filepath)) {
						log.debug(`[checkDB] SKIP task ${taskId} — line not tracked for sync: "${taskLine}"`);
						continue;
					}
				}

				const localTask = await host.plugin.taskRepository.loadLocalTaskById(taskId);
				let taskObject = localTask?.task;

				log.debug(`[checkDB] task ${taskId}: localTask exists=${!!localTask}, taskObject exists=${!!taskObject}, localTask.deleted=${localTask?.deleted}, taskObject.deleted=${taskObject?.deleted}`);

				const inFile = physicalTaskIds.includes(taskId);

				// If the task is locally deleted, data is missing, or absent from the file, verify with TickTick
				if (!taskObject || localTask?.deleted === true || taskObject?.deleted === 1 || !inFile) {
					log.debug(`[checkDB] ENTER TickTick check for ${taskId}: reason=!taskObj=${!taskObject}, localDel=${localTask?.deleted === true}, objDel=${taskObject?.deleted === 1}, inFile=${inFile}`);
					try {
						const tickTickTask = await host.plugin.tickTickRestAPI?.getTaskById(taskId);
						if (tickTickTask && tickTickTask.deleted !== 1) {
							// getTaskById may not return parentId; supplement from local DB if needed
							if (!tickTickTask.parentId && taskObject?.parentId) {
								tickTickTask.parentId = taskObject.parentId;
							}
							// Task is alive on TickTick — treat as orphan and let user decide
							log.debug(`[checkDB] ORPHAN task ${taskId} — alive on TickTick (title="${tickTickTask.title}", projectId=${tickTickTask.projectId}), adding to resolve list`);
							tasksToResolve.push({
								filepath,
								taskId: taskId,
								title: tickTickTask.title || taskId,
								projectId: tickTickTask.projectId,
								task: tickTickTask,
								inFile
							});
							continue;
						} else if (tickTickTask && tickTickTask.deleted === 1) {
							// Deleted on TickTick too
							log.debug(`[checkDB] DELETE task ${taskId} — also deleted in TickTick (title="${tickTickTask.title}")`);
							tasksToDelete.push({ filepath, taskId: taskId, title: tickTickTask.title || taskId });
							continue;
						}
						// tickTickTask was null/undefined — can't confirm with API
						log.debug(`[checkDB] NULL/UNDEFINED from TickTick API for ${taskId} — falling through to local-state check`);
					} catch (error) {
						if (error instanceof Error && error.message?.includes('404')) {
							log.debug(`[checkDB] DELETE task ${taskId} — 404 from TickTick API (task not found)`);
							tasksToDelete.push({ filepath, taskId: taskId, title: taskId });
							continue;
						}
						log.error(`[checkDB] Error loading task ${taskId} from API:`, error);
						continue;
					}
					// If locally marked as deleted, proceed with deletion
					if (localTask?.deleted === true || taskObject?.deleted === 1) {
						log.debug(`[checkDB] DELETE task ${taskId} — API returned null, but locally marked as deleted`);
						tasksToDelete.push({ filepath, taskId: taskId, title: taskObject?.title || taskId });
						continue;
					}
					// Otherwise silently skip (can't verify status with TickTick)
					log.debug(`[checkDB] SKIP task ${taskId} — API returned null, not locally marked as deleted`);
					continue;
				}

					if (localTask && (!localTask.lastVaultSync || localTask.lastVaultSync < localTask.updatedAt || !localTask.file)) {
						log.debug(`Cleaning up sync timestamps for task ${taskId} in ${filepath}`);
						await host.plugin.taskRepository.upsertTask(localTask.task, filepath, Date.now());
					}

					// Check if Obsidian URL needs updating in TickTick (defer the actual call to after the loop)
					if (taskObject) {
						const title = taskObject.title || '';
						if (!title.includes(obsidianURL)) {
							needsUrlUpdate = true;
						}
					}
				}

				// 3b. Update Obsidian URLs in TickTick — do ONCE per file, not once per task
				if (needsUrlUpdate) {
					try {
						await host.plugin.taskOperationsService.updateTaskContentForFile(filepath);
					} catch (error) {
						log.warn(`Error updating task content for ${filepath}:`, error);
					}
				}

				// 4. Scan for missed/unsynced tasks in the file — do ONCE per file
				try {
					log.debug(`Scanning file ${filepath}`);
					if (getSettings().taskLinksInObsidian === "taskLink") {
						await host.plugin.fileOperation?.addTickTickLinkToFile(filepath);
					}

					//NEW: Use TaskModificationDetector
					await host.plugin.taskModificationDetector.checkFileForNewTasks(filepath);
					await host.plugin.taskModificationDetector.checkFileForModifications(filepath);

				} catch (error) {
					log.error(`Error scanning file ${filepath}:`, error);
				}
			}
		});
		log.debug(`Finished checking database for ${markdownFiles.length} markdown files and ${dbFiles.length} DB entries.`);
		log.debug(`Found ${tasksToDelete.length} tasks to be deleted.`);
		log.debug(`Known local task IDs: ${allLocalIds.size}.`);

		// Offer to clean up DB entries for files that no longer exist in the vault
		if (deletedFiles.length > 0) {
			log.debug(`Found ${deletedFiles.length} DB entries for non-existent files.`);
			const shouldCleanup = getSettings().autoCleanupDatabase
				|| await new CleanupDatabaseModal(host.plugin.app, deletedFiles).showModal();
			if (shouldCleanup) {
				for (const filepath of deletedFiles) {
					log.debug(`Removing DB entry for non-existent file: ${filepath}`);
					await host.plugin.fileMetadataService.deleteFileMetadata(filepath);
				}
				new Notice(`Removed ${deletedFiles.length} non-existent file(s) from the database.`);
			}
		}

		// Scan TickTick for tasks that have no local reference at all
		try {
			const allTickTickData = (await host.plugin.tickTickRestAPI?.getAllTasks()) as unknown as { update: ITask[] } | undefined;
			const allTickTickTasks = (allTickTickData?.update || []) as Array<ITask & { taskId?: string }>;
			log.debug(`[checkDB] TickTick-wide scan: got ${allTickTickTasks.length} live tasks from API`);
			if (allTickTickTasks.length > 0) {
				const resolveIds = new Set(tasksToResolve.map(t => t.taskId));
				for (const ttTask of allTickTickTasks) {
					const ttId = ttTask.id || ttTask.taskId;
					if (!ttId) { log.debug(`[checkDB] TT-scan: skip task with no id`); continue; }
					if (ttTask.deleted === 1) { log.debug(`[checkDB] TT-scan: skip ${ttId} — deleted on TickTick`); continue; }
					if (allLocalIds.has(ttId)) { log.debug(`[checkDB] TT-scan: skip ${ttId} — already in local IDs`); continue; }
					if (resolveIds.has(ttId)) { log.debug(`[checkDB] TT-scan: skip ${ttId} — already in resolve list`); continue; }
					const filepath = await host.plugin.fileMetadataService?.getFilepathForProjectId(ttTask.projectId) || '';
					log.debug(`[checkDB] TT-scan: ORPHAN ${ttId} — no local reference (title="${ttTask.title}", projectId=${ttTask.projectId}, filepath="${filepath}")`);
					tasksToResolve.push({
						filepath,
						taskId: ttId,
						title: ttTask.title || ttId,
						projectId: ttTask.projectId,
						task: ttTask,
						inFile: false
					});
				}
				log.debug(`[checkDB] TickTick-wide scan complete: ${tasksToResolve.length} total orphaned tasks.`);
			}
		} catch (err) {
			log.error('Error scanning all TickTick tasks:', err);
		}

		if (tasksToResolve.length > 0) {
			log.debug(`[checkDB] Showing OrphanTaskModal for ${tasksToResolve.length} tasks: ${tasksToResolve.map(t => `${t.taskId} (${t.title})`).join(', ')}`);
			const orphanItems: OrphanItem[] = await Promise.all(tasksToResolve.map(async (t) => {
				let projectName: string | undefined;
				if (!t.filepath) {
					const project = t.projectId ? await db.projects.get(t.projectId) : undefined;
					projectName = project?.project?.name || 'Unknown Project';
				}
				return {
					title: host.plugin.taskParser.stripOBSUrl(t.title),
					filePath: t.filepath || undefined,
					projectName
				};
			}));
			const modal = new OrphanTaskModal(host.plugin.app, orphanItems);
			const action = await modal.showModal();
			log.debug(`[checkDB] User chose action "${action}" for orphaned tasks`);
			if (action === 'add') {
				await doWithLock(LOCK_TASKS, async () => {
					for (const t of tasksToResolve) {
						const targetFilepath = t.filepath || (await host.plugin.fileMetadataService?.getFilepathForProjectId(t.projectId)) || '';
						await host.plugin.taskRepository.upsertTask(t.task, targetFilepath, Date.now());
						if (!t.inFile && targetFilepath) {
							try {
								await host.plugin.fileOperation?.synchronizeToVault(targetFilepath, [t.task], false);
							} catch (err) {
								log.warn(`Could not add task ${t.taskId} to file ${t.filepath}:`, err);
							}
						}
					}
				});
				new Notice(`Added ${tasksToResolve.length} orphaned task(s) to vault and database.`);
			} else if (action === 'delete') {
				await doWithLock(LOCK_TASKS, async () => {
					for (const t of tasksToResolve) {
						try {
							await host.plugin.tickTickRestAPI?.deleteTask(t.taskId, t.projectId);
							log.debug(`Deleted task ${t.taskId} from TickTick.`);
						} catch (err) {
							log.warn(`Failed to delete task ${t.taskId} from TickTick:`, err);
						}
						if (t.inFile && t.filepath) {
							const file = host.plugin.app.vault.getAbstractFileByPath(t.filepath);
							if (file instanceof TFile) {
								await host.plugin.fileOperation?.deleteTasksFromSpecificFile(file, [{ id: t.taskId } as ITask], false);
							}
						}
						if (t.filepath) {
							await host.plugin.fileMetadataService?.removeTaskFromFile(t.filepath, t.taskId);
						}
					}
				});
				new Notice(`Deleted ${tasksToResolve.length} orphaned task(s) from TickTick.`);
			}
		}

		if (tasksToDelete.length > 0) {
			log.debug(`[checkDB] Showing TaskDeletionModal for ${tasksToDelete.length} tasks: ${tasksToDelete.map(t => `${t.taskId} (${t.title})`).join(', ')}`);
			const items = tasksToDelete.map(t => ({
				title: host.plugin.taskParser.stripOBSUrl(t.title),
				filePath: t.filepath
			}));
			const modal = new TaskDeletionModal(host.plugin.app, items, 'they are deleted in TickTick or marked as deleted in the database.', (result) => { });
			const prompt = await modal.showModal();
			log.debug(`[checkDB] User confirmed deletion: ${prompt.confirmed}`);
			if (prompt.confirmed) {
				await doWithLock(LOCK_TASKS, async () => {
					const byFile: Record<string, Set<string>> = {};
					for (const t of tasksToDelete) {
						if (!byFile[t.filepath]) byFile[t.filepath] = new Set();
						byFile[t.filepath].add(t.taskId);
					}
					for (const [path, taskIdSet] of Object.entries(byFile)) {
						const taskIds = Array.from(taskIdSet);
						const file = host.plugin.app.vault.getAbstractFileByPath(path);
						if (file instanceof TFile) {
							log.debug(`Deleting ${taskIds.length} tasks from ${path}`);
							await host.plugin.fileOperation?.deleteTasksFromSpecificFile(file, taskIds.map(id => ({ id } as ITask)), false);
						}
						for (const taskId of taskIds) {
							await host.plugin.fileMetadataService?.removeTaskFromFile(path, taskId);
						}
					}
				});
			}
		}

		await host.plugin.saveSettings();
		new Notice(`Database check completed.`);
		log.debug('Done checking data.');
		});
}
