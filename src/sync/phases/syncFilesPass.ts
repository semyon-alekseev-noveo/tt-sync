/**
 * Project-note file pass (Phase 1) + vault→TT deletion (Phase 2).
 * Extracted from `TickTickService.syncFiles` (#66 / TECH-SYNC-MODULARIZATION).
 *
 * Phase 1 and Phase 2 stay under one `LOCK_TASKS` acquisition. Each is timed
 * separately (`syncFiles` / `vaultDeletion`) for perf reports.
 */
import type { PluginContext } from '@/pluginContext';
import type { TickTickService } from '@/services/index';
import type { PendingTickTickDeletion } from '@/services/TaskModificationDetector';
import type { SyncRunContext } from '@/sync/SyncRunContext';
import { runVaultDeletionPhase } from '@/sync/lifecycle/runVaultDeletionPhase';
import { assessDualStoreDrift, formatDualStoreDriftLog } from '@/sync/dualStoreDrift';
import { commitVaultText, syncCachedRead } from '@/sync/vault-io';
import { timePhase } from '@/sync/perf';
import { getSettings } from '@/settings';
import { doWithLock } from '@/utils/locks';
import { dedupeTaskIds, idsPresentInVault } from '@/utils/vaultIdScan';
import { FoundDuplicateTasksModal } from '@/modals/FoundDuplicateTasksModal';
import { CleanupDatabaseModal } from '@/modals/CleanupDatabaseModal';
import { TaskDeletionModal, type DeletionItem } from '@/modals/TaskDeletionModal';
import { Notice, TFile } from 'obsidian';
import log from '@/utils/logger';

const LOCK_TASKS = 'LOCK_TASKS';

export interface SyncFilesPassDeps {
	plugin: PluginContext;
	service: TickTickService;
	ctx: SyncRunContext;
}

export async function runSyncFilesPass(
	deps: SyncFilesPassDeps,
	bForceUpdate: boolean,
): Promise<void> {
	const { plugin, service, ctx: syncCtx } = deps;
	const filesToSync = await plugin.fileMetadataService?.getAllFileMetadata();
	if (!filesToSync) {
		log.warn('No sync files found.');
		return;
	}
	let newFilesToSync = filesToSync;

	if (getSettings().SyncProject) {
		newFilesToSync = Object.fromEntries(Object.entries(filesToSync).filter(([, value]) =>
			value.defaultProjectId === getSettings().SyncProject));
	}

	// Duplicated task lines (copy-pasted marker): keep the original, the copy becomes a new task.
	try {
		const mdFiles = plugin.app.vault.getMarkdownFiles();
		const texts: { path: string; text: string }[] = [];
		for (const f of mdFiles) {
			const text = await syncCachedRead(plugin.app.vault, f);
			if (text.includes('ticktick_id::')) texts.push({ path: f.path, text });
		}
		const localTasks = await plugin.taskRepository.loadAllLocalTasks();
		try {
			// Read-only. Keys are the files table, including rows SyncProject will skip.
			const line = formatDualStoreDriftLog(assessDualStoreDrift({
				tasks: localTasks.map(lt => ({
					taskId: lt.task?.id ?? lt.taskId,
					file: lt.file ?? '',
					deleted: lt.deleted,
				})),
				filePaths: Object.keys(filesToSync),
				notes: texts,
			}));
			if (line) log.warn(line);
		} catch (e) {
			log.error('RISK-DUAL-STORE check failed', e);
		}
		const owners = new Map<string, string>();
		for (const lt of localTasks) {
			if (lt.file && !lt.deleted) owners.set(lt.task?.id ?? lt.taskId, lt.file);
		}
		for (const c of dedupeTaskIds(texts, id => owners.get(id))) {
			const f = plugin.app.vault.getAbstractFileByPath(c.path);
			if (f instanceof TFile) {
				const original = texts.find(t => t.path === c.path)?.text;
				if (original != null) await commitVaultText(plugin.app, f, original, c.text);
				const msg = `TickTickSync: duplicated task line(s) in ${c.path} detached from ${c.ids.join(', ')} — they will sync as new tasks.`;
				log.warn(msg);
				new Notice(msg, 8000);
			}
		}
	} catch (e) {
		log.error('dedupe failed', e);
	}

	try {
		const taskList: Record<string, string> = {};
		for (const [, metadata] of Object.entries(newFilesToSync)) {
			if (!metadata.TickTickTasks) continue;
			for (const taskDetail of metadata.TickTickTasks) {
				taskList[taskDetail.taskId] = taskDetail.taskId;
			}
		}

		const [dbResult, fileResult] = await Promise.all([
			plugin.fileMetadataService?.checkForDuplicates(newFilesToSync),
			plugin.fileOperation?.checkForDuplicates(newFilesToSync, taskList),
		]);

		const duplicates: Record<string, string[]> = {};
		const taskIds: Record<string, string> = {};

		if (dbResult?.duplicates) {
			for (const [taskId, files] of Object.entries(dbResult.duplicates)) {
				duplicates[taskId] = files;
				taskIds[taskId] = dbResult.taskIds[taskId];
			}
		}

		if (fileResult?.duplicates) {
			for (const [taskId, files] of Object.entries(fileResult.duplicates)) {
				const fileList = files;
				if (fileList.length > 1) {
					const extraFiles = fileList.slice(1);
					if (duplicates[taskId]) {
						const existing = new Set(duplicates[taskId]);
						for (const f of extraFiles) {
							if (!existing.has(f)) {
								duplicates[taskId].push(f);
							}
						}
					} else {
						duplicates[taskId] = extraFiles;
						taskIds[taskId] = fileList[0];
					}
				}
			}
		}

		for (const taskId of Object.keys(duplicates)) {
			if (fileResult?.duplicates?.[taskId] && fileResult.duplicates[taskId].length > 1) continue;
			const where = await idsPresentInVault(plugin.app, [taskId]);
			if (where.size === 1) {
				log.warn('Ignoring stale metadata duplicate', taskId, duplicates[taskId]);
				delete duplicates[taskId];
			}
		}
		const hasDuplicates = Object.keys(duplicates).length > 0;
		if (hasDuplicates) {
			const modal = new FoundDuplicateTasksModal(plugin.app, plugin, duplicates, taskIds);
			const resolved = await modal.showModal();

			if (!resolved) {
				log.warn('User cancelled duplicate resolution. Sync aborted.');
				new Notice('Sync aborted. Please fix duplicates manually in metadata to prevent data corruption.', 10000);
				return;
			}

			newFilesToSync = await plugin.fileMetadataService?.getAllFileMetadata();
			if (!newFilesToSync) return;
		}
	} catch (error) {
		log.error(error);
		new Notice(`Duplicate check failed: ${error instanceof Error ? error.message : String(error)}`, 5000);
		return;
	}

	const filesMissingFromVault: string[] = [];
	for (const fileKey in newFilesToSync) {
		const file = plugin.app.vault.getAbstractFileByPath(fileKey);
		if (!file) {
			filesMissingFromVault.push(fileKey);
		}
	}

	if (filesMissingFromVault.length > 0) {
		const shouldCleanup = getSettings().autoCleanupDatabase
			|| await new CleanupDatabaseModal(plugin.app, filesMissingFromVault).showModal();

		for (const fileKey of filesMissingFromVault) {
			if (shouldCleanup) {
				log.debug('File ', fileKey, ' was deleted before last sync. Cleaning up database.');
				await plugin.fileMetadataService?.deleteFileMetadata(fileKey);
			} else {
				log.debug('File ', fileKey, ' was deleted before last sync. Skipped database cleanup.');
			}
			delete newFilesToSync[fileKey];
		}
	}

	if (bForceUpdate && plugin.projectScheme?.enabled()) {
		try {
			await plugin.projectScheme.repairAllProjectNotes();
		} catch (e) {
			log.error('Project note repair before reset failed', e);
		}
	}

	await doWithLock(LOCK_TASKS, async () => {
		await timePhase('syncFiles', async () => {
			const pendingTickTickDeletions: PendingTickTickDeletion[] = [];
			for (const fileKey in newFilesToSync) {
				if (bForceUpdate) {
					try {
						await service.tickTickSync?.forceUpdates(fileKey);
					} catch (error) {
						log.error('An error occurred in forceUpdates:', error);
					}
				}

				try {
					await plugin.taskModificationDetector.checkFileForNewTasks(fileKey);
				} catch (error) {
					log.error('An error occurred in fullTextNewTaskCheck:', error);
				}

				if (syncCtx.locallyEdited.has(fileKey)) {
					continue;
				}

				try {
					await plugin.taskModificationDetector.checkFileForModifications(
						fileKey,
						pendingTickTickDeletions,
						syncCtx.skipOrphanVaultLineDeletes
							? { skipOrphanVaultLineDeletes: true }
							: undefined,
					);
				} catch (error) {
					log.error('An error occurred in fullTextModifiedTaskCheck:', error);
				}
			}

			if (pendingTickTickDeletions.length > 0) {
				const items: DeletionItem[] = pendingTickTickDeletions.map(d => ({
					title: plugin.taskParser.stripOBSUrl(d.lineTask.title),
					filePath: d.filepath,
				}));
				const modal = new TaskDeletionModal(plugin.app, items, 'task(s) not found on TickTick', () => { });
				const prompt = await modal.showModal();
				if (prompt.confirmed) {
					for (const d of pendingTickTickDeletions) {
						try {
							log.info(`Deleting task ${d.lineTask.id} from ${d.filepath}`);
							await plugin.fileOperation?.deleteTaskFromSpecificFile(d.file, d.lineTask, false);
						} catch (error) {
							log.error(`Error deleting task ${d.lineTask.id} from ${d.filepath}:`, error);
						}
					}
				} else {
					new Notice('Tasks not found on TickTick will not be deleted.', 5000);
				}
			}
		});

		await timePhase('vaultDeletion', async () => {
			await runVaultDeletionPhase(
				{ plugin, ctx: syncCtx },
				Object.keys(newFilesToSync),
			);
		});
	});
}
