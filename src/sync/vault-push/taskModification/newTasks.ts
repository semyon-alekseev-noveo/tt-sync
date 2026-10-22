import { fencedLines } from '@/utils/vaultIdScan';
import { isBlankTitle, isUnfinishedCapture, stripFileLinks } from '@/projectScheme';
import { mergeAbyssBlock } from '@/abyssFormat';
import { syncAbyssCommentsToTickTick, useAbyssCommentsApi } from '@/abyssCommentSync';
import {
	Editor,
	type EditorPosition,
	type MarkdownFileInfo,
	MarkdownView,
	Notice,
	TFile,
	TFolder
} from 'obsidian';
import type { ITask } from '@/api/types/Task';
import { NewFileMap } from '@/services/NewFileMap';
import { commitVaultText, registerPendingMarkerTaskId, syncCachedRead } from '@/sync/vault-io';
import { getSettings } from '@/settings';
import { isPathInPushScope } from '@/syncScope';
import log from '@/utils/logger';
import type { TaskModificationDetector } from '@/sync/vault-push/taskModification/TaskModificationDetector';

/** Create / re-attach new vault tasks into TickTick and write markers back. */
export class TaskModificationNewTasks {
	/**
	 * Check for new task content in the current editor line
	 */
	async checkLineForNewTask(this: TaskModificationDetector, editor: Editor, view: MarkdownView | MarkdownFileInfo): Promise<boolean> {
		const fileContent: string | undefined = (view as MarkdownView)?.data;
		const cursor = editor.getCursor();
		const line = cursor.line;
		const linetxt = editor.getLine(line);
		const beforeLength: number | undefined = fileContent?.length;

		const fileMap = new NewFileMap(this.app, this.plugin, (view as MarkdownView).file!);
		await fileMap.init(fileContent);
		await this.plugin.projectScheme?.ensurePushContext?.();
		await this.addNewTask(linetxt, line, editor, cursor, fileMap);

		const afterLength: number | undefined = fileContent?.length;
		return (beforeLength != afterLength);
	}

	/**
	 * Add a new task from a markdown line
	 */
	async addNewTask(
		this: TaskModificationDetector,
		lineTxt: string,
		line: number,
		editor: Editor | null,
		cursor: EditorPosition | null,
		fileMap: NewFileMap
	): Promise<void> {
		if (!lineTxt || lineTxt.length == 0) {
			return;
		}

		// Outside syncScopeFolders: never push (GTD scope guard).
		if (!isPathInPushScope(fileMap.getFilePath())) {
			return;
		}

		// New task in push scope (marker optional when abyssTasksFormat / Step 4)
		if (!this.plugin.taskParser.hasTickTickId(lineTxt)
			&& this.plugin.taskParser.isLineTrackedForSync(lineTxt, fileMap.getFilePath())) {
			const captured = this.plugin.taskParser.getTaskContentFromLineText(lineTxt.trimStart());
			if (isBlankTitle(captured) || isUnfinishedCapture(captured, lineTxt)) {
				log.warn('Skipping unfinished task line:', lineTxt);
				return;
			}
			try {
				// Convert markdown to task object
				const currentTask = await this.plugin.taskParser.convertLineToTask(
					lineTxt,
					line,
					fileMap.getFilePath(),
					fileMap,
					null
				);

				// Marker removed by hand? Re-attach to the TickTick task that used to live here (same title+file).
				const orphan = await this.findOrphanByTitle(fileMap.getFilePath(), currentTask.title, fileMap);
				if (orphan) log.warn(`Re-attaching line to existing TickTick task ${orphan.id} (marker was removed)`);
				// Create task in TickTick
				const newTask = (orphan ?? await this.plugin.tickTickRestAPI?.createTask(currentTask)) as ITask | null;
				if (!newTask) {
					// createTask already surfaced the API error in a Notice.
					return;
				}

				// Handle parent-child relationship
				if (currentTask.parentId) {
					const parentTask2 = await this.plugin.taskRepository.loadTaskById(currentTask.parentId);
					if (parentTask2) {
						this.plugin.taskParser.addChildToParent(parentTask2, currentTask.parentId);
						const updatedParent = await this.plugin.tickTickRestAPI?.updateTask(parentTask2) as ITask;
						await this.plugin.taskRepository.upsertTask(updatedParent, undefined, Date.now());
					}
				}

				new Notice(`New task created: ${newTask.title} (ID: ${newTask.id})`);

				// If task was created as completed, close it in TickTick
				if (currentTask.status != 0) {
					await this.plugin.tickTickRestAPI?.CloseTask(newTask.id, newTask.projectId);
					await this.plugin.taskRepository.closeTask(newTask.id);
				}

				// Preserve date holder (Obsidian-specific data)
				newTask.dateHolder = currentTask.dateHolder;

				// Update the markdown line with TickTick ID
				await this.updateTaskLineInFile(newTask, lineTxt, editor, cursor, line, fileMap);

				// Calculate hash for change detection
				const taskRecord = fileMap.getTaskRecord(newTask.id);
				const taskString = taskRecord.task;
				const stringToHash = taskString + this.plugin.taskParser.getNoteString(taskRecord, newTask.id);
				newTask.lineHash = (await this.plugin.taskParser?.getLineHash(stringToHash))!;

				// Save to database
				await this.plugin.taskRepository.upsertTask(newTask, fileMap.getFilePath());
				await this.plugin.saveSettings();

				if (useAbyssCommentsApi() && taskRecord?.taskLines?.length) {
					try {
						await syncAbyssCommentsToTickTick(
							this.plugin.tickTickRestAPI,
							newTask.id,
							newTask.projectId,
							taskRecord.taskLines,
						);
					} catch (e) {
						log.warn('Abyss comment API sync failed after create', newTask.id, e);
					}
				}

			} catch (error) {
				log.error('Error adding task:', error);
				log.error(`The error occurred in file: ${fileMap.getFilePath()}`);
				new Notice(
					`Failed to add task to TickTick: ${error instanceof Error ? error.message : String(error)}. The task was not modified.`,
					8000
				);
			}
		}
	}

	async findOrphanByTitle(this: TaskModificationDetector, filepath: string, title: string, fileMap: NewFileMap): Promise<ITask | undefined> {
		const want = stripFileLinks(title ?? '').trim().toLowerCase();
		if (!want) return undefined;
		const f = this.app.vault.getAbstractFileByPath(filepath);
		if (!(f instanceof TFile)) return undefined;
		const text = await syncCachedRead(this.app.vault, f);
		const rows = await this.plugin.taskRepository.loadTasksForFile(filepath);
		const hits = (rows ?? []).filter(t => t?.id && !text.includes(t.id)
			&& stripFileLinks(t.title ?? '').trim().toLowerCase() === want);
		return hits.length === 1 ? hits[0] : undefined;
	}

	/**
	 * Check an entire file for new tasks
	 */
	async checkFileForNewTasks(this: TaskModificationDetector, file_path: string): Promise<boolean> {
		const file = this.app.vault.getAbstractFileByPath(file_path);

		if (!file || file instanceof TFolder) {
			return false;
		}

		// Ensure file is registered in metadata before scanning
		await this.plugin.fileMetadataService?.getFileMetadata(file_path);

		if (!(file instanceof TFile)) { return false; }
		if (!isPathInPushScope(file_path)) { return false; } // outside syncScopeFolders
		await this.plugin.projectScheme?.ensurePushContext?.();
		const fileMap = new NewFileMap(this.app, this.plugin, file);
		await fileMap.init();

		// Add TickTick tags if full vault sync is enabled
		if (getSettings().enableFullVaultSync) {
			await this.plugin.fileOperation?.addTickTickTagToFile(fileMap);
		}

		// Check each line for new tasks
		const lines = fileMap.getFileLines().split('\n');
		const fenced = fencedLines(lines);
		for (let line = 0; line < lines.length; line++) {
			if (fenced.has(line)) continue; // task inside a code block: documentation, not a task
			const linetxt = lines[line];
			await this.addNewTask(linetxt, line, null, null, fileMap);
		}

		return true;
	}

	/**
	 * Update task line in file with TickTick ID
	 */
	async updateTaskLineInFile(
		this: TaskModificationDetector,
		newTask: ITask,
		lineTxt: string,
		editor: Editor | null,
		cursor: EditorPosition | null,
		line: number | null,
		fileMap: NewFileMap
	): Promise<void> {
		const newTaskCopy = { ...newTask };
		newTaskCopy.items = [];

		const numTabs = this.plugin.taskParser.getNumTabs(lineTxt);
		let decoratedText = await this.plugin.taskParser?.convertTaskToLine(newTaskCopy, numTabs);


		try {
			const taskLine = line ?? cursor?.line ?? 0;
			const taskRec = await fileMap.getTaskRecordByLine(taskLine);
			const noteLineCount = taskRec.taskLines ? taskRec.taskLines.length : 0;
			if (getSettings().abyssTasksFormat) {
				decoratedText = mergeAbyssBlock(decoratedText, taskRec.taskLines ?? []);
			}

			if (editor && cursor) {
				const file = this.app.vault.getAbstractFileByPath(fileMap.getFilePath());
				const planned = [lineTxt, ...(taskRec.taskLines ?? [])];
				const stillThere = planned.every((text, i) => editor.getLine(cursor.line + i) === text);
				if (!stillThere) {
					log.info('Deferring new-task line write: the open line changed');
					registerPendingMarkerTaskId(newTask.id);
				} else if (file instanceof TFile) {
					const snapshot = typeof editor.getValue === 'function' ? editor.getValue() : fileMap.getFileLines();
					const lines = snapshot.split('\n');
					const start = cursor.line;
					const next = [
						...lines.slice(0, start),
						...decoratedText.split('\n'),
						...lines.slice(start + 1 + noteLineCount),
					].join('\n');
					const commit = await commitVaultText(this.app, file, snapshot, next);
					if (commit.status === 'deferred') {
						registerPendingMarkerTaskId(newTask.id);
					}
				}
			} else if (line !== null) {
				const file = this.app.vault.getAbstractFileByPath(fileMap.getFilePath());
				if (file instanceof TFile) {
					const snapshot = fileMap.getFileLines();
					fileMap.replaceLines(line, 1 + noteLineCount, decoratedText);
					const commit = await commitVaultText(this.app, file, snapshot, fileMap.getFileLines());
					if (commit.status === 'deferred') {
						registerPendingMarkerTaskId(newTask.id);
					}
				}
			}
		} catch (error) {
			log.error('Error updating task line in file:', error);
		}
	}
}
