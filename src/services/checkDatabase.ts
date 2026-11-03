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
import {
	fileHasSameTitleOtherId,
	isOpenTaskEligibleForVaultImport,
	normalizeVaultImportTitle,
	resolveOrphanAddFilepath,
} from '@/sync/vaultImportEligibility';
import { resolveSyncedListIds } from '@/syncScope';
import { applyDetachMarkerPlanned } from '@/sync/applyDetachMarkers';
import {
	enumerateSyncPlannedDeletions,
	residualDestructivesForApply,
} from '@/sync/enumerateSyncIntents';
import { plannedDeletionToSyncIntent } from '@/sync/syncIntent';
import { Notice, TFile } from 'obsidian';
import { markerName } from '@/taskParser';
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
		/** Titles already linked in vault — BUG-ORPHAN-STALE-REMATCH TT-scan guard. */
		const vaultLinkedTitles = new Set<string>();

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

				const physicalTitleLines: Array<{ id: string; title: string }> = physicalTaskIds.map((pid) => {
					const line = fileMap.getTaskString(pid) || '';
					const title = host.plugin.taskParser?.getTaskContentFromLineText(line) ?? '';
					const norm = normalizeVaultImportTitle(title);
					if (norm) vaultLinkedTitles.add(norm);
					return { id: pid, title };
				});

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
							// UX-ORPHAN-SKIP-DONE on metadata path (not only TT-scan)
							if (!isOpenTaskEligibleForVaultImport(tickTickTask)) {
								log.debug(`[checkDB] SKIP orphan ${taskId} — not eligible for vault import (status=${tickTickTask.status})`);
								if (!inFile) {
									await host.plugin.fileMetadataService?.removeTaskFromFile(filepath, taskId);
								}
								continue;
							}
							// BUG-ORPHAN-STALE-REMATCH: same title already linked with a newer id in this file
							if (!inFile && fileHasSameTitleOtherId(
								physicalTitleLines,
								taskId,
								host.plugin.taskParser?.stripOBSUrl(tickTickTask.title || '') || tickTickTask.title || '',
							)) {
								log.debug(`[checkDB] STALE-REMATCH prune ${taskId} — title already in file under another id`);
								await host.plugin.fileMetadataService?.removeTaskFromFile(filepath, taskId);
								continue;
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
		// BUG-ORPHAN-ADD-STICKY: include Dexie-only ids (Add may have upserted before vault write).
		try {
			for (const lt of await db.tasks.toArray()) {
				if (lt.taskId) allLocalIds.add(lt.taskId);
			}
		} catch (e) {
			log.warn('[checkDB] could not seed allLocalIds from Dexie tasks', e);
		}
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
				new Notice(`Removed ${deletedFiles.length} non-existent file(s) from the local sync cache.`);
			}
		}

		// Scan TickTick for tasks with no local reference — only syncedLists (AF-1 / UX-ORPHAN-SYNCED-LISTS).
		try {
			const syncedEntries = getSettings().syncedLists ?? [];
			const allowedListIds = resolveSyncedListIds(syncedEntries, allProjects);
			if (!allowedListIds.size) {
				log.debug('[checkDB] TT-scan skipped: syncedLists empty — nothing to orphan-import (same as Synchronize).');
			} else {
				const allTickTickData = (await host.plugin.tickTickRestAPI?.getAllTasks()) as unknown as { update: ITask[] } | undefined;
				const allTickTickTasks = (allTickTickData?.update || []) as Array<ITask & { taskId?: string }>;
				log.debug(`[checkDB] TickTick-wide scan: got ${allTickTickTasks.length} live tasks from API; allow-list size=${allowedListIds.size}`);
				if (allTickTickTasks.length > 0) {
					const resolveIds = new Set(tasksToResolve.map(t => t.taskId));
					for (const ttTask of allTickTickTasks) {
						const ttId = ttTask.id || ttTask.taskId;
						if (!ttId) { log.debug(`[checkDB] TT-scan: skip task with no id`); continue; }
						if (ttTask.deleted === 1) { log.debug(`[checkDB] TT-scan: skip ${ttId} — deleted on TickTick`); continue; }
						if (!allowedListIds.has(ttTask.projectId)) {
							log.debug(`[checkDB] TT-scan: skip ${ttId} — list ${ttTask.projectId} not in syncedLists`);
							continue;
						}
						// UX-ORPHAN-SKIP-DONE: completed / abandoned / recurrence instances / Notebook ≠ Add-to-vault orphans
						if (!isOpenTaskEligibleForVaultImport(ttTask)) {
							log.debug(`[checkDB] TT-scan: skip ${ttId} — not eligible for vault import (status=${ttTask.status}, kind=${ttTask.kind}, repeatTaskId=${(ttTask as { repeatTaskId?: string }).repeatTaskId ?? ''})`);
							continue;
						}
						if (allLocalIds.has(ttId)) { log.debug(`[checkDB] TT-scan: skip ${ttId} — already in local IDs`); continue; }
						if (resolveIds.has(ttId)) { log.debug(`[checkDB] TT-scan: skip ${ttId} — already in resolve list`); continue; }
						// BUG-ORPHAN-STALE-REMATCH: title already on a vault line with another id
						{
							const ttTitle = host.plugin.taskParser?.stripOBSUrl(ttTask.title || '') || ttTask.title || '';
							const norm = normalizeVaultImportTitle(ttTitle);
							if (norm && vaultLinkedTitles.has(norm)) {
								log.debug(`[checkDB] TT-scan: skip ${ttId} — title already linked in vault (stale rematch)`);
								continue;
							}
						}
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
				let wrote = 0;
				let dexieOnly = 0;
				await doWithLock(LOCK_TASKS, async () => {
					let abyssCapture: string | undefined;
					try {
						const raw = await host.plugin.app.vault.adapter.read('.obsidian/plugins/abyss-tasks/data.json');
						const path = (JSON.parse(raw) as { taskFilePath?: unknown }).taskFilePath;
						if (typeof path === 'string' && path.trim()) abyssCapture = path.trim();
					} catch { /* default via resolveOrphanAddFilepath */ }

					for (const t of tasksToResolve) {
						const parentNote = t.task.parentId
							? host.plugin.projectScheme?.noteForParent?.(t.task.parentId)
							: undefined;
						const projectMapped = await host.plugin.fileMetadataService?.getFilepathForProjectId(t.projectId);
						const defaultMapped = getSettings().defaultProjectId
							? await host.plugin.fileMetadataService?.getFilepathForProjectId(getSettings().defaultProjectId)
							: undefined;
						const targetFilepath = await resolveOrphanAddFilepath({
							filepath: t.filepath,
							projectId: t.projectId,
							parentNote,
							projectMappedFile: projectMapped,
							defaultProjectFile: defaultMapped,
							abyssCaptureFile: abyssCapture,
							newTasksFile: getSettings().newTasksFile,
						});
						// BUG-ORPHAN-STALE-REMATCH: do not Add a duplicate when the target already has the title
						if (targetFilepath && !t.inFile) {
							const targetFile = vault.getAbstractFileByPath(targetFilepath);
							if (targetFile instanceof TFile) {
								const map = new NewFileMap(host.plugin.app, host.plugin, targetFile);
								await map.init();
								const lines = map.getTasks().map((pid) => ({
									id: pid,
									title: host.plugin.taskParser?.getTaskContentFromLineText(map.getTaskString(pid) || '') ?? '',
								}));
								const orphanTitle = host.plugin.taskParser?.stripOBSUrl(t.title) || t.title;
								if (fileHasSameTitleOtherId(lines, t.taskId, orphanTitle)) {
									log.debug(`[checkDB] STALE-REMATCH skip Add ${t.taskId} — title already in ${targetFilepath}`);
									if (t.filepath) {
										await host.plugin.fileMetadataService?.removeTaskFromFile(t.filepath, t.taskId);
									}
									continue;
								}
							}
						}
						await upsertFile(targetFilepath, t.projectId);
						await host.plugin.taskRepository.upsertTask(t.task, targetFilepath, Date.now());
						if (!t.inFile && targetFilepath) {
							try {
								const ok = await host.plugin.fileOperation?.synchronizeToVault(targetFilepath, [t.task], false);
								if (ok) wrote++;
								else dexieOnly++;
							} catch (err) {
								dexieOnly++;
								log.warn(`Could not add task ${t.taskId} to file ${targetFilepath}:`, err);
							}
						} else if (t.inFile) {
							wrote++;
						} else {
							dexieOnly++;
						}
					}
				});
				new Notice(
					`Added ${tasksToResolve.length} orphaned task(s) (${wrote} to vault lines, ${dexieOnly} cache-only).`,
					8000,
				);
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
			// ARCH-SYNC #260 — same enumerator as Synchronize: remote-gone → DetachMarker
			// (снять id, текст оставить), not a second vault-line wipe dialect.
			const remoteAction = getSettings().onTickTickDeletion === 'cancel' ? 'detach' : 'mark-cancelled';
			const localById = new Map(
				tasksToDelete.map(t => [t.taskId, { title: t.title, file: t.filepath, deleted: false }]),
			);
			const planned = enumerateSyncPlannedDeletions({
				vaultTasks: [],
				presentIds: new Set<string>(),
				untrustedFiles: new Set<string>(),
				indexIncomplete: false,
				remoteDeleteIds: tasksToDelete.map(t => t.taskId),
				localById,
				remoteAction,
			});
			let dexieTaskCount = 0;
			try {
				dexieTaskCount = (await db.tasks.toArray()).filter(r => !r.deleted && r.taskId).length;
			} catch {
				dexieTaskCount = 0;
			}
			const checkPoint = getSettings().checkPoint ?? 0;
			const residual = residualDestructivesForApply(planned, { dexieTaskCount, checkPoint });
			const detachRows = planned.filter(p => plannedDeletionToSyncIntent(p).kind === 'DetachMarker');
			log.debug(
				`[checkDB] #260 enumerator: planned=${planned.length} DetachMarker=${detachRows.length} `
					+ `residualDestructives=${residual.length} (failClosed dexie=${dexieTaskCount} cp=${checkPoint})`,
			);

			if (detachRows.length > 0) {
				await doWithLock(LOCK_TASKS, async () => {
					const result = await applyDetachMarkerPlanned(
						{
							app: host.plugin.app,
							markerName: markerName(),
							clearTaskFile: (id) => host.plugin.fileMetadataService!.clearTaskFile(id),
							deleteTask: (id) => host.plugin.taskRepository!.deleteTask(id),
						},
						detachRows,
					);
					log.info(`[checkDB] DetachMarker applied=${result.applied} skipped=${result.skipped}`);
				});
				new Notice(
					`TickTickSync: detached ${detachRows.length} gone-from-TT marker(s) (text kept). Same as Synchronize.`,
					8000,
				);
			}

			// Residual PullStripVault / PushDeleteTT only when not fail-closed — same Sync discrepancies surface.
			if (residual.length > 0) {
				log.debug(`[checkDB] Showing Sync discrepancies for ${residual.length} residual destructives`);
				const items = residual.map(t => ({
					title: host.plugin.taskParser.stripOBSUrl(t.title || t.id),
					filePath: t.file,
					id: t.taskId || t.id,
				}));
				const modal = new TaskDeletionModal(
					host.plugin.app,
					items,
					'residual destructive plan after Check scan (same enumerator as Synchronize).',
					() => { },
				);
				const prompt = await modal.showModal();
				log.debug(`[checkDB] User confirmed residual destructives: ${prompt.confirmed}`);
				if (prompt.confirmed) {
					await doWithLock(LOCK_TASKS, async () => {
						const byFile: Record<string, Set<string>> = {};
						for (const t of residual) {
							const path = t.file || '';
							const id = t.taskId || t.id;
							if (!path || !id) continue;
							if (!byFile[path]) byFile[path] = new Set();
							byFile[path].add(id);
						}
						for (const [path, taskIdSet] of Object.entries(byFile)) {
							const taskIds = Array.from(taskIdSet);
							const file = host.plugin.app.vault.getAbstractFileByPath(path);
							if (file instanceof TFile) {
								log.debug(`Deleting ${taskIds.length} residual tasks from ${path}`);
								await host.plugin.fileOperation?.deleteTasksFromSpecificFile(
									file,
									taskIds.map(id => ({ id } as ITask)),
									false,
								);
							}
							for (const taskId of taskIds) {
								await host.plugin.fileMetadataService?.removeTaskFromFile(path, taskId);
							}
						}
					});
				}
			}
		}

		await host.plugin.saveSettings();
		new Notice(`Local sync cache check completed.`);
		log.debug('Done checking data.');
		});
}
