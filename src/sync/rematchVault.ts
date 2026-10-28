/**
 * BUG-208-REMATCH — rewrite missing vault markers from Dexie/TickTick tasks
 * without deleting anything on TickTick.
 *
 * Vault-only: do **not** call `synchronizeToVault(..., false)` — that add path
 * runs Comments API + post-write `updateTask` and was returning false on the
 * pilot rematch (no AZ lines, write-trace only vaultReconcile in-sync).
 *
 * No `@/db/dexie` import — keeps phases → rematch off the Dexie cycle.
 */
import type { ITask } from '@/api/types/Task';
import { activeZoneInsertLine } from '@/projectScheme';
import type { PlannedDeletion } from '@/sync/massDeleteGuard';
import log from '@/utils/logger';

export interface RematchLiveTask {
	taskId: string;
	deleted?: boolean;
	task?: ITask | null;
}

export interface RematchVaultDeps {
	loadLiveTask: (taskId: string) => Promise<RematchLiveTask | null | undefined>;
	/** Full note text, or null if the path is missing. */
	readFile: (path: string) => Promise<string | null>;
	writeFile: (path: string, text: string) => Promise<void>;
	convertTaskToLine: (task: ITask, parentTabs: number) => Promise<string>;
}

const MARKER_RE = (id: string) => new RegExp(`ticktick_id::\\s*${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);

export function insertRematchLines(snapshot: string, lines: string[]): string {
	if (lines.length === 0) return snapshot;
	const parts = snapshot.split('\n');
	let ins = activeZoneInsertLine(parts);
	if (ins < 0) {
		while (parts.length && parts[parts.length - 1].trim() === '') parts.pop();
		parts.push('', '## Active Zone', '');
		ins = parts.length;
	}
	parts.splice(ins, 0, ...lines);
	return parts.join('\n');
}

export async function rematchVaultFromPlanned(
	planned: readonly PlannedDeletion[],
	deps: RematchVaultDeps,
): Promise<{ written: number; skipped: number; files: number }> {
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

	let files = 0;
	for (const [file, tasks] of byFile) {
		try {
			const snapshot = await deps.readFile(file);
			if (snapshot == null) {
				skipped += tasks.length;
				log.warn(`TickTickSync rematch: missing file ${file}`);
				continue;
			}
			const toAdd: string[] = [];
			for (const task of tasks) {
				if (!task.id) {
					skipped += 1;
					continue;
				}
				if (MARKER_RE(task.id).test(snapshot) || toAdd.some(l => MARKER_RE(task.id!).test(l))) {
					skipped += 1;
					continue;
				}
				toAdd.push(await deps.convertTaskToLine(task, 0));
			}
			if (toAdd.length === 0) continue;
			const next = insertRematchLines(snapshot, toAdd);
			if (next === snapshot) {
				skipped += toAdd.length;
				continue;
			}
			await deps.writeFile(file, next);
			written += toAdd.length;
			files += 1;
		} catch (error) {
			skipped += tasks.length;
			log.error(`TickTickSync rematch: failed writing ${file}`, error);
		}
	}

	return { written, skipped, files };
}
