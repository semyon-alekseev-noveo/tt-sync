import { markerName } from '@/taskParser';
import { App, Notice, TFile, TFolder } from 'obsidian';
import type { PluginContext } from '@/pluginContext';
import type { ITask } from './api/types/Task';
import { getSettings } from '@/settings';
import {
	canSkipAbyssCommentNetwork,
	syncAbyssCommentsToTickTick,
	useAbyssCommentsApi,
} from '@/abyssCommentSync';
import { stripLegacyCommentsBlock, tickTickCommentMergeHint } from '@/abyssFormat';
import type { ITaskComment } from '@/api/types/TaskComment';
import { listCommentMapsForTask } from '@/db/taskCommentMaps';
import { NewFileMap } from '@/services/NewFileMap';
import { commitVaultText, readNoteForWrite, syncCachedRead } from '@/sync/vault-io';
import log from '@/utils/logger';
import type { DeletionItem } from './modals/TaskDeletionModal';
import { TaskDeletionModal } from './modals/TaskDeletionModal';
import { getProjectById } from '@/db/projects';
import { db } from '@/db/dexie';
import { persistToFile } from '@/sync/vault-pull/persistTasksToFile';
import { doTheSortMambo } from '@/sync/vault-pull/taskSort';

export class FileOperation {
	app: App;
	plugin: PluginContext;


	constructor(app: App, plugin: PluginContext) {
		//super(app,settings);
		this.app = app;
		this.plugin = plugin;

	}


	/**
	 * Read file content from the editor only when that editor is showing this file.
	 * A hover or popout leaf can be the active editor for a different path; its buffer is not this file.
	 */
	async readFileContent(file: TFile): Promise<string> {
		return readNoteForWrite(this.app, file);
	}

	/** Flip one task checkbox through commitVaultText. Never vault.modify of the whole note. */
	private async setTaskCheckbox(taskId: string, done: boolean): Promise<void> {
		const filepath = await this.plugin.fileMetadataService?.getFilepathForTask(taskId);
		if (!filepath) return;
		const file = this.app.vault.getAbstractFileByPath(filepath);
		if (!(file instanceof TFile)) return;
		const snapshot = await this.readFileContent(file);
		const lines = snapshot.split('\n');
		let modified = false;
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			if (line.includes(taskId) && this.plugin.taskParser?.hasTickTickTag(line)) {
				lines[i] = done ? line.replace('[ ]', '[x]') : line.replace(/- \[([xX])]/g, '- [ ]');
				modified = true;
				break;
			}
		}
		if (!modified) return;
		await commitVaultText(this.app, file, snapshot, lines.join('\n'));
	}

	//Complete a task and mark it as completed
	async completeTaskInTheFile(taskId: string) {
		await this.setTaskCheckbox(taskId, true);
	}

	// uncheck completed tasks,
	async uncompleteTaskInTheFile(taskId: string) {
		await this.setTaskCheckbox(taskId, false);
	}

	//add #TickTick at the end of task line, if full vault sync enabled
	async addTickTickTagToFile(fileMap: NewFileMap) {
		const snapshot = fileMap.getFileLines();
		if (fileMap.markAllTasks()) {
			await commitVaultText(this.app, fileMap.file, snapshot, fileMap.getFileLines());
			new Notice('New tasks will be added to ticktick on next sync.');
		}
	}


	//add TickTick at the line
	async addTickTickLinkToFile(filepath: string) {
		// Get the file object and update the content
		const file = this.app.vault.getAbstractFileByPath(filepath);
		if (!(file instanceof TFile)) return;
		const snapshot = await this.readFileContent(file);

		const lines = snapshot.split('\n');
		let modified = false;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			if (this.plugin.taskParser?.hasTickTickId(line) && this.plugin.taskParser?.hasTickTickTag(line)) {
				if (this.plugin.taskParser?.hasTickTickLink(line)) {
					return;
				}
				const taskID = this.plugin.taskParser?.getTickTickId(line) ?? '';
				const taskObject = await this.plugin.taskRepository.loadTaskById(taskID);
				if (!taskObject) continue;
				const newLine = this.plugin.taskParser?.addTickTickLink(line, taskObject.id, taskObject.projectId);
				lines[i] = newLine ?? line;
				modified = true;
			}
		}

		if (modified) {
			await commitVaultText(this.app, file, snapshot, lines.join('\n'));
		}
	}

	// sync updated task content to file
	async synchronizeToVault(taskFile: string, tasks: ITask[], bUpdating: boolean): Promise<boolean> {
		if (!tasks || tasks.length === 0) {
			log.error('No tasks to process.');
			return false;
		}

		// Sort the tasks for that file so that Parents are processed first
		const sortedTasks = doTheSortMambo(tasks);
		// log.debug('Sorted Tasks:');
		// sortedTasks.forEach(t => {
		// 	log.debug(`Task: id=${t.id}, ParentID=${t.parentId}, title=${t.title.substring(0, 20)}`);
		// });
		const result = await this.synchronizeToFile(taskFile, sortedTasks, bUpdating);

		// Sleep for 1 second if successful to allow vault to settle
		if (result) {
			await new Promise(resolve => window.setTimeout(resolve, 1000));
		}

		if (getSettings().debugMode) {
			const opString = bUpdating ? 'updating' : 'adding';
			log.debug('===', taskFile, tasks, result ? `Completed ${opString} task(s).` : ` Failed ${opString} task(s).`);
		}
		return result;
	}

	async getOrCreateDefaultFile(taskFile: string, projectId?: string) {
		let file;
		// Normalize taskFile path (remove leading slash)
		if (taskFile.startsWith('/')) {
			taskFile = taskFile.substring(1);
		}

		//TODO: Debug only.
		// log.debug('Taskfile: ', taskFile);
		// log.debug('doit exist: ', this.app.vault.getAbstractFileByPath(taskFile));
		// log.debug('ProjectId', projectId);
		// log.debug('ProjectName', await getProjectById(projectId));

		try {
			//do we have one?
			if (taskFile) {
				file = this.app.vault.getAbstractFileByPath(taskFile);
				//does it exist?
				if (file && projectId) {
					const project = await getProjectById(projectId);
					if (project) {
						const projectName = project.name;
						//assume can't have duplicate project names in one group
						if (file.name.includes(projectName)) {
							return file;
						}
					}
				}

			}
			// Ensure all parent folders exist (supports TickTick folder structure)
			const parentPath = taskFile.includes('/') ? taskFile.substring(0, taskFile.lastIndexOf('/')) : '';
			if (parentPath) {
				const parts = parentPath.split('/').filter(Boolean);
				let current = '';
				for (const part of parts) {
					current = current ? `${current}/${part}` : part;
					const folder = this.app.vault.getAbstractFileByPath(current);
					if (!folder) {
						log.warn(`Folder ${current} does not exit. It will be created`);
						await this.app.vault.createFolder(current);
					} else if (!(folder instanceof TFolder)) {
						throw new Error(`Path conflict: ${current} exists and is not a folder`);
					}
				}
			}

			new Notice(`Creating new file: ${taskFile}`);
			log.warn(`Creating new file: ${taskFile}`);
			const whoAdded = `${this.plugin.manifest.name} -- ${this.plugin.manifest.version}`;
			try {
				//TODO: Do the thing with saving the project id to the DB here.
				file = await this.app.vault.create(taskFile, `== Added by ${whoAdded} == `);
				if (projectId) {
					// Associate this file with the project in DB (used for folder management decisions)
					await this.plugin.fileMetadataService.updateFileMetadata(taskFile, { defaultProjectId: projectId, TickTickTasks: [], TickTickCount: 0 });
				}
			} catch (error) {
				if ((error as Error).message.includes('File already exists')) {
					log.debug('Attempting to find existing file', taskFile);
					file = this.app.vault.getAbstractFileByPath(taskFile);
					if (projectId) {
						await this.plugin.fileMetadataService.updateFileMetadata(taskFile, { defaultProjectId: projectId, TickTickTasks: [], TickTickCount: 0 });
					}
					if (!file) {
						const fileName = taskFile.split('/').pop();
						if (fileName) {
							//there's a file on the filesystem. But we can't get to it by name.
							//try to find the file by name case insensitively
							const files = this.app.vault.getMarkdownFiles();
							for (const f of files) {
								log.debug('Checking file', f.path);
								if (f.path.toLowerCase() === taskFile.toLowerCase()) {
									log.debug('Found existing file', f.path);
									file = f;
									break;
								}
							}
						}
					}

				} else {
					throw error;
				}
			}
			return file;
		} catch (error) {
			log.error('Error on create file: ', error);
			throw new Error(String(error));
		}
	}

	// update task content to file
	async checkForDuplicates(fileMetadata: Record<string, unknown>, taskList: Record<string, string> | undefined) {
		const taskIds: Record<string, string> = {};
		const duplicates: Record<string, string[]> = {};
		const notFoundFiles: string[] = [];

		if (!fileMetadata) {
			return { duplicates, notFoundFiles };
		}

		let fileName;
		try {

			for (const file in fileMetadata) {
				fileName = file;
				const currentFile = this.app.vault.getAbstractFileByPath(file);
				if ((!currentFile)) {
					log.debug('Duplicate check Skipping ', file, ' because it\'s not found.');
					notFoundFiles.push(file);
					continue;
				}
				if (currentFile instanceof TFolder) {
					log.debug('Duplicate check Skipping ', file, ' because it\'s a folder.');
					continue;
				}
				if (!(currentFile instanceof TFile)) { continue; }
				try {
					const content = await this.readFileContent(currentFile);
					for (let taskListKey in taskList) {
						// Only consider task ids that appear in the exact TickTick metadata pattern
						// %%[ticktick_id:: <hex>]%% where <hex> is 24 hex chars
						const pattern = new RegExp(`%%\\[ticktick_id::\\s*${taskListKey}\\]%%`, 'i');
						if (pattern.test(content)) {
							if (taskIds[taskListKey]) {
								if (!duplicates[taskListKey]) {
									duplicates[taskListKey] = [taskIds[taskListKey]];
								}
								duplicates[taskListKey].push(file);
							} else {
								taskIds[taskListKey] = file;
							}

						}
					}
				} catch {
					log.error('Duplicate check Skipping ', file, ' because it\'s not readable.');
				}

			}
			return { duplicates, notFoundFiles };
		} catch (Fail) {
			const errMsg = `File [${fileName}] not found, or is locked. If file exists, Please try again later.`;
			log.error(Fail, errMsg);
			throw new Error(errMsg);
		}
	}

	// delete task from file
	async deleteTaskFromSpecificFile(filePath: TFile, task: ITask, bConfirmDialog: boolean) {
		await this.deleteTasksFromSpecificFile(filePath, [task], bConfirmDialog);
	}

	async deleteTasksFromSpecificFile(filePath: TFile, tasks: ITask[], bConfirmDialog: boolean): Promise<string[]> {
		// Get the file object and update the content
		if (bConfirmDialog) {
			const items: DeletionItem[] = tasks.map(t => ({
				title: this.plugin.taskParser.stripOBSUrl(t.title),
				filePath: filePath.path
			}));
			const bConfirm = await this.confirmDeletion(items);
			if (!bConfirm) {
				new Notice('Tasks will not be deleted. Please rectify the issue before the next sync.', 5000);
				return [];
			}
		}
		log.info(`Deleting ${tasks.length} tasks from file: `, filePath.path);

		const fileMap: NewFileMap = new NewFileMap(this.app, this.plugin, filePath);
		const snapshot = await this.readFileContent(filePath);
		await fileMap.init(snapshot);

		const oldContent = fileMap.getFileLines();
		const deletedIds = fileMap.deleteTasks(tasks.map(t => (t.id ?? '')));
		const newContent = fileMap.getFileLines();

		if (oldContent !== newContent) {
			const committed = await commitVaultText(this.app, filePath, oldContent, newContent);
			if (committed.status === 'deferred') {
				log.info(`Deletion write deferred for ${filePath.path}`);
			} else {
				log.info(`File ${filePath.path} modified with deletions.`);
			}
		} else {
			log.warn(`No changes made to file ${filePath.path} during deletion attempt. Could not find tasks in file.`);
		}
		this.plugin.lastLines.set(filePath.path, newContent.length);
		return deletedIds;
	}

	async deleteTaskFromFile(task: ITask) {
		const taskId = task.id;
		// Get the task file path

		const filepath = await this.plugin.fileMetadataService?.getFilepathForTask(taskId);
		if (!filepath) {
			throw new Error(`File not found for ${task.title}. File path found is ${filepath}`);
		}
		const file = this.app.vault.getAbstractFileByPath(filepath);
		if (!(file instanceof TFile)) {
			throw new Error(`File not found for ${task.title}. File path found is ${filepath}`);
		}
		await this.deleteTaskFromSpecificFile(file, task, false);

	}

	//search TickTick_id by content
	async searchTickTickIdFromFilePath(filepath: string, searchTerm: string): Promise<string | null> {
		const file = this.app.vault.getAbstractFileByPath(filepath);
		if (!(file instanceof TFile)) return null;
		const fileContent = await this.readFileContent(file);
		const fileLines = fileContent.split('\n');
		let TickTickId: string | null = null;

		for (let i = 0; i < fileLines.length; i++) {
			const line = fileLines[i];

			if (line.includes(searchTerm)) {
				const regexResult = /\[ticktick_id::\s*([a-zA-Z0-9]+)]/.exec(line);

				if (regexResult) {
					TickTickId = regexResult[1];
				}

				break;
			}
		}

		return TickTickId;
	}

	//get all files in the vault
	async getAllFilesInTheVault() {
		const files = this.app.vault.getFiles();
		return (files);
	}

	async searchFilepathsByTaskidInVault(taskId: string) {
		const files = await this.getAllFilesInTheVault();
		const tasks = files.map(async (file) => {
			if (!this.isMarkdownFile(file.path)) {
				return;
			}
			const fileContent = await syncCachedRead(this.app.vault, file);
			if (fileContent.includes(taskId)) {
				return file.path;
			}
		});

		const results = await Promise.all(tasks);
		const filePaths = results.filter((filePath) => filePath !== undefined);
		return filePaths[0] || null;
		//return filePaths || null
	}

	//search filepath by taskid in vault

	isMarkdownFile(filename: string) {
		const extension = filename.split('.').pop() ?? '';
		return extension.toLowerCase() === 'md';
	}

	private async synchronizeToFile(taskFile: string, projectTasks: ITask[], bUpdating: boolean) {
		let file;
		let result;

		if (taskFile) {
			// Normalize taskFile path (remove leading slash)
			if (taskFile.startsWith('/')) {
				taskFile = taskFile.substring(1);
			}

			file = this.app.vault.getAbstractFileByPath(taskFile);
			if (!(file instanceof TFile)) {
				file = await this.getOrCreateDefaultFile(taskFile, projectTasks[0].projectId);
				if (file && file instanceof TFile) {
					log.debug('Created/found new file: ', file.path);
				}
			} else {
				// File exists on disk. Ensure it's in our database association.
				const hasAssociation = await this.plugin.fileTaskQueries.filepathHasDefaultProjectID(taskFile);
				if (!hasAssociation && projectTasks.length > 0) {
					const projectId = projectTasks[0].projectId;
					// Only associate if this file is actually the one intended for this project,
					// or if it's the global default project file.
					const expectedFilepath = await this.plugin.fileMetadataService.getFilepathForProjectId(projectId);
					if (expectedFilepath && expectedFilepath.replace(/^\//, '') === taskFile) {
						await this.plugin.fileMetadataService.updateFileMetadata(taskFile, { defaultProjectId: projectId, TickTickTasks: [], TickTickCount: 0 });
					}
				}
			}
		}

		if (!file || !(file instanceof TFile)) {
			log.error('Could not find or create file: ', taskFile);
			return false;
		}

		result = await this.syncTasks(file, projectTasks, bUpdating);
		return result;
	}

	private async syncTasks(file: TFile, tasks: ITask[], bUpdating: boolean): Promise<boolean> {
		try {
			// Network first. The write snapshot is taken after these calls return.
			await this.preparePersistNetwork(tasks, file);
			const snapshot = await this.readFileContent(file);
			const built = await persistToFile({
				app: this.app,
				plugin: this.plugin,
				handleTickTickStructureMove: (n, o, line, map) => this.handleTickTickStructureMove(n, o, line, map),
			}, tasks, file, bUpdating, snapshot);
			if (built.text === snapshot) {
				log.debug(`No changes to write for ${file.path}, skipping write`);
				await built.afterWrite();
				return true;
			}
			const committed = await commitVaultText(this.app, file, snapshot, built.text);
			if (committed.status === 'deferred' || committed.skipped > 0) {
				log.info(`Vault write deferred for ${file.path}`, committed);
				return true;
			}
			await built.afterWrite();
			return true;
		} catch (error) {
			log.error(`Could not ${bUpdating ? 'update' : 'add'} Tasks to file ${file.path} \n Error: ${String(error)}`);
			return false;
		}
	}

	/**
	 * Comments API before the note is read for writing.
	 * TP-IDLE-ZERO-SWEEP / #62 slice 2: skip GET (and idle sync) when Dexie
	 * `commentCount` matches vault threads and maps cover keys — merge keeps
	 * vault bullets without `_apiComments`.
	 */
	private async preparePersistNetwork(tasks: ITask[], file: TFile): Promise<void> {
		if (!useAbyssCommentsApi() || !this.plugin.tickTickRestAPI) return;
		const prep = new NewFileMap(this.app, this.plugin, file);
		await prep.init();
		for (const task of tasks) {
			if (!task.id || !task.projectId) continue;
			const rec = prep.getTaskRecord(task.id);
			const taskLines = rec?.taskLines ?? [];
			const mapsBefore = await listCommentMapsForTask(task.id);
			const commentCount = (task as ITask & { commentCount?: number }).commentCount;
			const idleSkip = canSkipAbyssCommentNetwork(taskLines, mapsBefore, commentCount);
			if (idleSkip) {
				task.content = stripLegacyCommentsBlock(task.content ?? '');
				task.desc = stripLegacyCommentsBlock(task.desc ?? '');
				continue;
			}
			if (taskLines.length) {
				try {
					await syncAbyssCommentsToTickTick(
						this.plugin.tickTickRestAPI,
						task.id,
						task.projectId,
						taskLines,
						task.content,
						{ remoteCommentCount: commentCount },
					);
				} catch (e) {
					log.warn('Abyss comment push before vault write failed', task.id, e);
				}
			}
			const comments = await this.plugin.tickTickRestAPI.getTaskComments(task.projectId, task.id);
			// BUG-COMMENT-GET-FAIL-OPEN: unknown remote → omit _apiComments so merge keeps vault bullets.
			if (comments !== null) {
				Object.defineProperty(task, '_apiComments', { value: comments, enumerable: false, configurable: true });
			}
			const maps = await listCommentMapsForTask(task.id);
			Object.defineProperty(task, '__ticktickComments', {
				value: tickTickCommentMergeHint(maps, comments, commentCount),
				enumerable: false,
				configurable: true,
			});
			task.content = stripLegacyCommentsBlock(task.content ?? '');
			task.desc = stripLegacyCommentsBlock(task.desc ?? '');
		}
	}

	private hasChildren(currentTask: ITask) {

		if (currentTask.childIds) {
			return currentTask.childIds?.length > 0;
		} else {
			return false;
		}
	}

	private async confirmDeletion(items: DeletionItem[]) {
		const reason: string = 'task not found in local cache.';
		const myModal = new TaskDeletionModal(this.app, items, reason, (result) => {
		});
		return (await myModal.showModal()).confirmed;
	}


	//Just the notification now.
	private async handleTickTickStructureMove(newTask: ITask, oldTask: ITask, lineText: string, fileMap: NewFileMap) {
		log.debug('deleting old task: ', oldTask.id, oldTask.title, ' from file');
		let filePathForNewProject = await this.plugin.fileMetadataService?.getFilepathForProjectId(newTask.projectId);
		if (!filePathForNewProject) {
			let errmsg = `File not found for moved newTask:  ${newTask.id}, ${newTask.title}`;
			throw new Error(errmsg);
		}
		const tFilePathForProject = await this.plugin.fileOperation.getOrCreateDefaultFile(filePathForNewProject, newTask.projectId);
		if (!tFilePathForProject || (!(tFilePathForProject instanceof TFile))) {
			let errmsg = `File not found for moved newTask:  ${newTask.id}, ${newTask.title}, ${filePathForNewProject}`;
			throw new Error(errmsg);
		}
		log.debug('oldFilePath: ', fileMap.getFilePath());
		if (!fileMap || !fileMap.getFilePath()) {
			let errmsg = `File not found for moved newTask:  ${newTask.id}, ${newTask.title}`;
			throw new Error(errmsg);
		}
		fileMap.deleteTask(oldTask.id);
		log.debug('deleted from: ', fileMap.getFilePath());

		await this.plugin.taskRepository.deleteTask(oldTask.id);

		const destFileMap = new NewFileMap(this.app, this.plugin, tFilePathForProject);
		await destFileMap.init();
		const destSnapshot = destFileMap.getFileLines();
		//insert into the new file.
		log.debug('Adding Task: ', newTask.id, newTask.title, ' to new file: ', destFileMap.getFilePath());
		destFileMap.addTask(newTask, lineText);
		const newData = destFileMap.getFileLines();
		await commitVaultText(this.app, tFilePathForProject, destSnapshot, newData);

		//task is updated to cache in the caller....!


		const cleanTitle = this.plugin.taskParser?.stripOBSUrl(newTask.title);
		let message = '';
		if (newTask.projectId != oldTask.projectId) {
			const newProject = newTask.projectId ? await db.projects.get(newTask.projectId) : undefined;
			const oldProject = oldTask.projectId ? await db.projects.get(oldTask.projectId) : undefined;
			const newProjectName = newProject?.project?.name || 'Unknown Project';
			const oldProjectName = oldProject?.project?.name || 'Unknown Project';
			message = 'Task Moved.\nTask: ' + cleanTitle + '\nwas moved from\n ' + oldProjectName + '\nto\n' + newProjectName;
		} else {
			if (newTask.parentId) {
				const parentTask = (await this.plugin.taskRepository.loadTaskById(newTask.parentId))!;
				const cleanParentTaskTitle = this.plugin.taskParser?.stripOBSUrl(parentTask.title);
				message = 'Task has new Parent.\nTask: ' + cleanTitle + '\nis now a child of\n ' + cleanParentTaskTitle;
			} else {
				message = 'Task is now a top level task.\nTask: ' + cleanTitle;
			}
		}

		new Notice(message, 5000);
		return filePathForNewProject;

	}


	private async deleteTaskFromOldFile(oldTask: ITask, newTask: ITask, fileMap: NewFileMap) {
		const oldFilePath = await this.plugin.fileMetadataService?.getFilepathForTask(oldTask.id);
		log.debug('oldFilePath: ', oldFilePath);
		if (!oldFilePath) {
			let errmsg = `File not found for moved newTask:  ${newTask.id}, ${newTask.title}`;
			throw new Error(errmsg);
		}
		fileMap.deleteTask(oldTask.id);
		log.debug('deleted from: ', fileMap.getFilePath());
		return oldFilePath;
	}

	private async moveChildTasks(newTask: ITask, toBeProcessed: string[], filepath: string) {
		for (const childId of newTask.childIds) {
			//Are they going to be processed later?
			if (toBeProcessed.includes(childId)) {
				//We'll deal with it in the downloaded list.
				continue;
			}
			//get it from cache
			const currentChild = await this.plugin.taskRepository.loadTaskById(childId);
			if (currentChild) {
				currentChild.parentId = newTask.id;
				currentChild.projectId = newTask.projectId;
				const numChildTaskItems = currentChild.items?.length;

				await this.moveTask(filepath, currentChild, numChildTaskItems, currentChild.id, currentChild.projectId);
				const currentChildHasChildren = this.hasChildren(currentChild);
				if (currentChildHasChildren) {
					const currentChild = (await this.plugin.taskRepository.loadTaskById(childId))!;
					await this.moveChildTasks(currentChild, toBeProcessed, filepath);
				}
			} else {
				//weird move. Don't break. Assume it will be taken care of on the next sync
				log.warn('Child not found: ', childId);
			}

		}
	}

	//TODO: Possibly not needed any longer.
	private async moveTask(filepath: string, task: ITask, oldtaskItemNum: number, oldTaskId: string, oldProjectId: string) {
		const tFilePath = this.app.vault.getAbstractFileByPath(filepath);
		if (!(tFilePath instanceof TFile)) return;
		await this.deleteTaskFromSpecificFile(tFilePath, task, false);
		await this.plugin.taskRepository.deleteTask(oldTaskId);

		await this.synchronizeToVault(filepath, [task], false);
		const cleanTitle = this.plugin.taskParser?.stripOBSUrl(task.title);
		let message = '';
		if (task.projectId != oldProjectId) {
			const newProject = task.projectId ? await db.projects.get(task.projectId) : undefined;
			const oldProject = oldProjectId ? await db.projects.get(oldProjectId) : undefined;
			const newProjectName = newProject?.project?.name || 'Unknown Project';
			const oldProjectName = oldProject?.project?.name || 'Unknown Project';
			message = 'Task Moved.\nTask: ' + cleanTitle + '\nwas moved from\n ' + oldProjectName + '\nto\n' + newProjectName;
		} else {
			if (task.parentId) {
				const parentTask = (await this.plugin.taskRepository.loadTaskById(task.parentId))!;
				const cleanParentTaskTitle = this.plugin.taskParser?.stripOBSUrl(parentTask.title);
				message = 'Task has new Parent.\nTask: ' + cleanTitle + '\nis now a child of\n ' + cleanParentTaskTitle;
			} else {
				message = 'Task is now a top level task.\nTask: ' + cleanTitle;
			}
		}

		new Notice(message, 5000);
	}

	//TODO: Get rid of extraneous sorts!
}
