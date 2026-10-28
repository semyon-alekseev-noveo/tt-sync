/**
 * BUG-208-REMATCH — rewrite missing vault markers from Dexie/TickTick tasks
 * without deleting anything on TickTick.
 *
 * No `@/db/dexie` import here — keeps phases → rematch off the Dexie cycle (#209 CI).
 */
import type { ITask } from '@/api/types/Task';
import type { PlannedDeletion } from '@/sync/massDeleteGuard';
import log from '@/utils/logger';

export interface RematchLiveTask {
	taskId: string;
	deleted?: boolean;
	task?: ITask | null;
}

export interface RematchVaultDeps {
	synchronizeToVault: (file: string, tasks: ITask[], updating: boolean) => Promise<unknown>;
	loadLiveTask: (taskId: string) => Promise<RematchLiveTask | null | undefined>;
}

export async function rematchVaultFromPlanned(
	planned: readonly PlannedDeletion[],
	deps: RematchVaultDeps,
): Promise<{ written: number; skipped: number }> {
	let written = 0;
	let skipped = 0;
	const byFile = new Map<string, ITask[]>();

	for (const item of planned) {
		const taskId = item.taskId ?? item.id;
		const file = item.file;
		if (!taskId || !file) {
			skipped += 1;
			continue;
		}
		const row = await deps.loadLiveTask(taskId);
		const task = row?.task;
		if (!task || row?.deleted) {
			skipped += 1;
			log.warn(`TickTickSync rematch: no live Dexie task for ${taskId}`);
			continue;
		}
		const list = byFile.get(file) ?? [];
		list.push(task);
		byFile.set(file, list);
	}

	for (const [file, tasks] of byFile) {
		try {
			await deps.synchronizeToVault(file, tasks, false);
			written += tasks.length;
		} catch (error) {
			skipped += tasks.length;
			log.error(`TickTickSync rematch: failed writing ${file}`, error);
		}
	}

	return { written, skipped };
}
