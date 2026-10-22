/**
 * Store port: task CRUD / soft-delete (TECH-SYNC-MODULARIZATION PR 7).
 * Sync layers and PluginContext depend on this, not on Dexie.
 */
import type { ITask } from '@/api/types/Task';
import type { LocalTask } from '@/db/schema';

export interface TaskRepositoryPort {
	loadTaskById(taskId: string): Promise<ITask | undefined>;
	loadLocalTaskById(taskId: string): Promise<LocalTask | undefined>;
	loadAllTasks(): Promise<ITask[]>;
	/** All LocalTask rows (including deleted). Used by orchestrator vanished-list detach. */
	loadAllLocalTasks(): Promise<LocalTask[]>;
	loadTasksForFile(filepath: string): Promise<ITask[]>;
	loadTasksByProjectId(projectId: string): Promise<ITask[]>;
	loadTasksByTag(tag: string): Promise<LocalTask[]>;
	upsertTask(task: ITask, filepath?: string, timestamp?: number): Promise<void>;
	markVaultInSync(taskId: string): Promise<void>;
	deleteTask(taskId: string): Promise<void>;
	deleteTasks(taskIds: string[]): Promise<void>;
	closeTask(taskId: string): Promise<string | undefined>;
	reopenTask(taskId: string): Promise<string | undefined>;
	bulkUpsertTasks(
		newTasks: ITask[],
		getFilepathForTask: (taskId: string) => Promise<string | null>,
	): Promise<void>;
	getTaskTitles(taskIds: string[], stripOBSUrl: (title: string) => string): Promise<string[]>;
	getProjectIdForTask(taskId: string): Promise<string | undefined>;
	getTaskCount(): Promise<number>;
	taskExists(taskId: string): Promise<boolean>;
	getDeletedTasks(): Promise<LocalTask[]>;
	hardDeleteTasks(taskIds: string[]): Promise<void>;
	recoverTask(taskId: string, file?: string): Promise<void>;
	purgeOldDeletedTasks(retentionDays: number): Promise<number>;
}
