import { db } from './dexie';
import type { TaskCommentMap } from './schema';

export async function listCommentMapsForTask(taskId: string): Promise<TaskCommentMap[]> {
	return db.taskCommentMaps.where('taskId').equals(taskId).toArray();
}

export async function upsertCommentMap(row: TaskCommentMap): Promise<void> {
	await db.taskCommentMaps.put(row);
}

export async function deleteCommentMap(id: string): Promise<void> {
	await db.taskCommentMaps.delete(id);
}

export async function deleteCommentMapsForTask(taskId: string): Promise<void> {
	await db.taskCommentMaps.where('taskId').equals(taskId).delete();
}

export function commentMapId(taskId: string, fingerprint: string): string {
	return `${taskId}:${fingerprint}`;
}
