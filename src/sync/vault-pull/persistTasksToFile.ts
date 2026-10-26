/**
 * Persist TickTick tasks into a vault note (#66 / vault-pull).
 * Extracted from FileOperation.persistToFile — behavior unchanged.
 */
import { markerName } from '@/taskParser';
import type { App } from 'obsidian';
import { TFile } from 'obsidian';
import type { PluginContext } from '@/pluginContext';
import type { ITask } from '@/api/types/Task';
import { getSettings } from '@/settings';
import { NewFileMap } from '@/services/NewFileMap';
import log from '@/utils/logger';

export interface PersistTasksHost {
	app: App;
	plugin: PluginContext;
	handleTickTickStructureMove(
		newTask: ITask,
		oldTask: ITask,
		lineText: string,
		fileMap: NewFileMap,
	): Promise<string>;
}

export async function persistToFile(host: PersistTasksHost, 
	tasks: ITask[],
	file: TFile,
	bUpdating: boolean,
	snapshot: string,
): Promise<{ text: string; afterWrite: () => Promise<void> }> {
	// Go through the tasks.
	// For every task
	// 	if it has a parent, add it after the parent.
	//  else add at the the insertion point in lines.
	log.debug('Processing File: ', file.path);
	const fileMap = new NewFileMap(host.app, host.plugin, file);
	await fileMap.init(snapshot);
	let bTaskMove: boolean = false;
	const after: Array<() => Promise<void>> = [];


	// log.debug('================');
	// log.debug('Tasks: ', tasks);
	// log.debug('Data: \n', fileMap.getFileLines());
	// log.debug('file: ', file);
	// log.debug('================');
	for (const task of tasks) {
		let numParentTabs = 0;
		const parentID = task.parentId;
		const schemeParent = parentID && host.plugin.projectScheme?.isParentId(parentID);
		if (parentID && !schemeParent && fileMap.getTaskIndex(parentID) >= 0) {
			const parentTabs = fileMap.getNumParentTabs(parentID);
			numParentTabs = parentTabs + 1;
		}

		let lineText = '';
		let filePath = fileMap.getFilePath();
		//Did this task's line actually make it into the file? Only then may we
		//record a vault sync for it.
		let bLinePersisted = true;

		lineText = await host.plugin.taskParser?.convertTaskToLine(task, numParentTabs);
		//Tired of seeing duplicates because of Sync conflicts.
		if (!bUpdating) {
			if (fileMap.getTaskIndex(task.id) != -1) {
				log.warn('A Task was being added but was already in file: ', task.id, task.title);
				//it's in the file, but not in cache. Just update it.
				await recordVaultSync(host, task, file, fileMap.updateTask(task, lineText));
				continue;
			} else {
				fileMap.addTask(task, lineText);
			}
		} else if (fileMap.getTaskIndex(task.id) == -1 && fileMap.isFencedOnly(task.id)) {
			log.debug('Task only appears inside a code block, leaving it alone: ', task.id);
			bLinePersisted = false;
		} else if (fileMap.getTaskIndex(task.id) == -1) {
			//it's in the cache, but not in the file. Just add it.
			//Mirrors the add branch above: without this the update is a silent
			//no-op, and the task is then read back as deleted from the vault.
			log.warn('A Task was being updated but was not in file: ', task.id, task.title);
			fileMap.addTask(task, lineText);
		} else {
			//For updates doing the dateHolder mambo here because we need to make sure we get old dates....
			const oldTask = await host.plugin.taskRepository.loadTaskById(task.id);
			host.plugin.dateMan?.addDateHolderToTask(task, oldTask);
			// last-synced note text, so the merge can tell new local comments from ones deleted in TickTick
			Object.defineProperty(task, '__baseContent', { value: oldTask?.content ?? '', enumerable: false, configurable: true });
			if (oldTask) {
				// Compare incoming task (from DB/TickTick) with current vault state
				const vaultProjectId = await host.plugin.fileTaskQueries?.getDefaultProjectIdForFilepath(file.path);
				const vaultParentId = fileMap.getParentId(task.id);
				const vaultTask: ITask = { ...task, projectId: vaultProjectId ?? '', parentId: vaultParentId ?? '' };

				//Only check for Project/Parent change if task is in cache.
				const keepLineInPlace = !!getSettings().newTasksFile?.trim() || getSettings().abyssTasksFormat;
				if (!keepLineInPlace && (await host.plugin.taskParser?.isProjectIdChanged(vaultTask, task))) {
					log.debug('Moving Task: ', task.id, task.title, ' from Project: ', vaultTask.projectId, ' to Project: ', task.projectId);
					filePath = await host.handleTickTickStructureMove(task, vaultTask, lineText, fileMap);
					//because we need to update the OBS URL in TT and fix up the cache.
					bTaskMove = true;

					// Check if project groups differ and move file if necessary
					const localTaskRecord = await host.plugin.taskRepository.loadLocalTaskById(task.id);
					if (localTaskRecord) {
						await host.plugin.taskModificationDetector?.checkForProjectGroupChange(task, localTaskRecord);
					}
				} else {
					const bParentUpdate = host.plugin.taskParser?.isParentIdChanged(vaultTask, task);
					bLinePersisted = fileMap.updateTask(task, lineText, bParentUpdate);
				}
			} else {
				//how would that happen???? The task has no DB record, so we
				//never touched the file -- don't record a vault sync that
				//would make it look user-deleted on the next scan.
				log.warn('No Old Task found for: ', task.id);
				bLinePersisted = false;
			}
		}

		// Calculate hash for change detection
		//TODO:consider getting the taskRecord from getTaskPayload and be done....
		let taskRecord = fileMap.getTaskRecord(task.id);
		const taskString = taskRecord?.task ?? '';
		const stringToHash = taskString + (taskRecord ? host.plugin.taskParser.getNoteString(taskRecord, task.id) : '');
		let lineHash = await host.plugin.taskParser?.getLineHash(stringToHash);
		if (!lineHash) {
			lineHash = '';
		}

		//we've made changes. Let's get the TTversion of the task right.
		const linkLoc = host.plugin.taskParser.getLinkLocation(filePath)
		if (linkLoc.taskURL) {
			task.title = task.title + ' ' + linkLoc.taskURL;
		} else if (linkLoc.noteURL) {
			const taskPayLoad = host.plugin.taskParser.getTaskPayLoad(fileMap, task.id, linkLoc.noteURL);
			task.content = taskPayLoad.content ? taskPayLoad.content : '';
			task.desc = taskPayLoad.description ? taskPayLoad.description : '';

		}

		// Backwards compatibility: keep the "ticktick" tag injected on
		// the TickTick task unless the user opted out (see
		// stopInjectingTickTickTag setting).
		if (!getSettings().stopInjectingTickTickTag && !task.tags?.includes(markerName())) {
			task.tags = [...(task.tags || []), markerName()];
		}

		const persisted = bLinePersisted;
		const hash = lineHash;
		const pathForTask = filePath;
		const moved = bTaskMove;
		if (!bUpdating) {
			after.push(async () => {
				// OBS URL is pushed after the note write, so the HTTP call is not inside the write window.
				let addedTask = (await host.plugin.tickTickRestAPI?.updateTask(task))!;
				addedTask.lineHash = hash;
				await host.plugin.taskRepository.upsertTask(addedTask, file.path, Date.now());
			});
		} else if (!moved) {
			after.push(async () => {
				task.lineHash = hash;
				await recordVaultSync(host, task, file, persisted);
			});
		} else {
			after.push(async () => {
				task.lineHash = hash;
				let addedTask = (await host.plugin.tickTickRestAPI?.updateTask(task))!;
				await host.plugin.taskRepository.upsertTask(addedTask, pathForTask, Date.now());
			});
		}
	}

	const resultLines = fileMap.getFileLines();
	host.plugin.lastLines.set(file.path, resultLines.length);
	return {
		text: resultLines,
		afterWrite: async () => {
			for (const job of after) await job();
		},
	};
}

/**
 * Record that a task was synced to the vault -- but only when its line was
 * actually written to the file. Recording a vault sync for a write that
 * never happened makes the task look user-deleted on the next scan, and it
 * gets offered up for deletion in TickTick.
 */
export async function recordVaultSync(host: PersistTasksHost, task: ITask, file: TFile, bLinePersisted: boolean): Promise<void> {
	if (bLinePersisted) {
		await host.plugin.taskRepository.upsertTask(task, file.path, Date.now());
	} else {
		log.warn(`Not recording a vault sync for ${task.id}: its line was not written to ${file.path}`);
		await host.plugin.taskRepository.upsertTask(task);
	}
}

