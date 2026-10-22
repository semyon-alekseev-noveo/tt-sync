/**
 * Store port: file ↔ task queries (TECH-SYNC-MODULARIZATION PR 7).
 * Sync layers and PluginContext depend on this, not on Dexie.
 */
import type { LocalTask } from '@/db/schema';

export interface FileTaskQueriesPort {
	getTaskIdsInFile(filepath: string): Promise<string[]>;
	getTasksInFile(filepath: string): Promise<LocalTask[]>;
	getTaskCountInFile(filepath: string): Promise<number>;
	fileHasTasks(filepath: string): Promise<boolean>;
	getDefaultProjectForFile(filepath: string): Promise<string | undefined>;
	getDefaultProjectNameForFile(filepath: string): Promise<string | undefined>;
	getFilesWithTasks(): Promise<string[]>;
	getAllFiles(): Promise<Array<{ path: string; defaultProjectId?: string }>>;
	findMissingTaskIds(filepath: string, currentTaskIds: string[]): Promise<string[]>;
	getTaskItemIds(taskId: string): Promise<string[]>;
	findDuplicateTasks(): Promise<Map<string, string[]>>;
	getFilepathForTask(taskId: string): Promise<string | undefined>;
	getFilepathForProject(projectId: string): Promise<string | undefined>;
	getFileSummaries(): Promise<
		Array<{
			filepath: string;
			taskCount: number;
			defaultProject?: string;
		}>
	>;
	filepathHasDefaultProjectID(filepath: string): Promise<boolean>;
	getDefaultProjectIdForFilepath(filepath: string): Promise<string | undefined>;
	getDeletionItems(taskIds: string[]): Promise<Array<{ title: string; filePath: string; id: string }>>;
}
