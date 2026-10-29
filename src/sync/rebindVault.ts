/**
 * ID-REBIND-RESTORE / ID-REBIND-DEDUP (#216) — vault-wide tt-id alignment after
 * TT restore: rewrite markers in place when a line matches by title; insert only
 * when no candidate. Never deletes TickTick tasks.
 *
 * No `@/db/dexie` import — call from rematch phase with injected deps.
 */
import type { ITask } from '@/api/types/Task';
import { insertRematchLines } from '@/sync/rematchVault';
import type { RematchLiveTask, RematchVaultDeps } from '@/sync/rematchVault';
import { isConflictCopyPath, type PlannedDeletion } from '@/sync/massDeleteGuard';
import log from '@/utils/logger';

/** TickTick ids are usually 24 hex; allow alnum so unit fixtures stay readable. */
const MARKER_FULL = /%%\[\s*ticktick_id::\s*([A-Za-z0-9]+)\s*\]%%/;
const MARKER_RE = (id: string) =>
	new RegExp(`ticktick_id::\\s*${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);

/** Title key for matching vault lines ↔ Dexie/TT tasks after restore. */
export function normalizeRebindTitle(raw: string): string {
	let s = (raw || '').trim();
	s = s.replace(MARKER_FULL, '');
	s = s.replace(/^[-*+]\s+\[[^\]]*\]\s*/, ''); // checkbox
	s = s.replace(/#[^\s#]+/g, ''); // tags
	s = s.replace(/\s+/g, ' ').trim().toLowerCase();
	return s;
}

export function lineHasCheckbox(line: string): boolean {
	return /^\s*[-*+]\s+\[[^\]]*\]/.test(line);
}

/** Replace existing marker or append one on a checkbox line. */
export function replaceOrAttachMarker(line: string, newId: string): string {
	const marker = `%%[ticktick_id:: ${newId}]%%`;
	if (MARKER_FULL.test(line)) {
		return line.replace(MARKER_FULL, marker);
	}
	return `${line.replace(/\s+$/, '')} ${marker}`;
}

/**
 * Prefer a line whose title matches and whose marker is missing or not in liveIds
 * (stale post-restore id). Returns -2 if the new task id is already on a line.
 */
export function findRebindLineIndex(
	lines: readonly string[],
	taskTitle: string,
	taskId: string,
	liveIds: ReadonlySet<string>,
): number {
	const want = normalizeRebindTitle(taskTitle);
	if (!want) return -1;
	let fallback = -1;
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]!;
		if (!lineHasCheckbox(line)) continue;
		if (MARKER_RE(taskId).test(line)) return -2; // already bound
		if (normalizeRebindTitle(line) !== want) continue;
		const m = line.match(MARKER_FULL);
		if (!m) {
			if (fallback < 0) fallback = i;
			continue;
		}
		const oldId = m[1]!;
		if (!liveIds.has(oldId)) return i; // stale id → rewrite
		// live other task with same title — do not steal
	}
	return fallback;
}

export interface RebindFileResult {
	next: string;
	rebound: number;
	needInsert: ITask[];
	skipped: number;
}

/**
 * Rewrite stale/missing markers in one note. Callers convert `needInsert` to lines
 * and pass through `insertRematchLines`.
 */
export function rebindFileContent(
	snapshot: string,
	tasks: readonly ITask[],
	liveIds: ReadonlySet<string>,
): RebindFileResult {
	const lines = snapshot.split('\n');
	let rebound = 0;
	let skipped = 0;
	const needInsert: ITask[] = [];
	/** ID-VAULT-RESTORE-CONFLICT: one title claim per rebind pass — no second bind/insert. */
	const claimedTitles = new Set<string>();
	const textNow = () => lines.join('\n');

	for (const task of tasks) {
		const id = task.id;
		if (!id) {
			skipped += 1;
			continue;
		}
		if (MARKER_RE(id).test(textNow())) {
			skipped += 1;
			continue;
		}
		const titleKey = normalizeRebindTitle(task.title ?? '');
		const idx = findRebindLineIndex(lines, task.title ?? '', id, liveIds);
		if (idx === -2) {
			skipped += 1;
			continue;
		}
		if (idx >= 0) {
			lines[idx] = replaceOrAttachMarker(lines[idx]!, id);
			rebound += 1;
			if (titleKey) claimedTitles.add(titleKey);
			continue;
		}
		// No line candidate: insert only if this title was not already claimed
		// (one unmarked line + two same-title TT tasks → bind once, skip invent dup).
		if (titleKey && claimedTitles.has(titleKey)) {
			skipped += 1;
			continue;
		}
		needInsert.push(task);
		if (titleKey) claimedTitles.add(titleKey);
	}

	return {
		next: lines.join('\n'),
		rebound,
		needInsert,
		skipped,
	};
}

export interface RebindVaultResult {
	written: number;
	rebound: number;
	inserted: number;
	skipped: number;
	files: number;
}

/**
 * Rematch-as-intended: for held vault→TT candidates, rewrite stale markers by title
 * in the named files, then insert only what is still missing.
 */
export async function rebindVaultFromPlanned(
	planned: readonly PlannedDeletion[],
	deps: RematchVaultDeps,
): Promise<RebindVaultResult> {
	let written = 0;
	let rebound = 0;
	let inserted = 0;
	let skipped = 0;
	const byFile = new Map<string, ITask[]>();
	const liveIds = new Set<string>();

	for (const item of planned) {
		const taskId = item.taskId ?? item.id;
		const file = item.file;
		if (!taskId || !file) {
			skipped += 1;
			continue;
		}
		const row: RematchLiveTask | null | undefined = await deps.loadLiveTask(taskId);
		const task = row?.task;
		if (!task || row?.deleted) {
			skipped += 1;
			log.warn(`TickTickSync rebind: no live Dexie task for ${taskId}`);
			continue;
		}
		if (task.id) liveIds.add(task.id);
		const list = byFile.get(file) ?? [];
		list.push(task);
		byFile.set(file, list);
	}

	let files = 0;
	for (const [file, tasks] of byFile) {
		try {
			// ID-VAULT-RESTORE-CONFLICT: never rewrite Obsidian Sync conflict copies.
			if (isConflictCopyPath(file)) {
				skipped += tasks.length;
				log.warn(`TickTickSync rebind: skip conflict path ${file}`);
				continue;
			}
			const snapshot = await deps.readFile(file);
			if (snapshot == null) {
				skipped += tasks.length;
				log.warn(`TickTickSync rebind: missing file ${file}`);
				continue;
			}
			const partial = rebindFileContent(snapshot, tasks, liveIds);
			const insertLines: string[] = [];
			for (const task of partial.needInsert) {
				insertLines.push(await deps.convertTaskToLine(task, 0));
			}
			const next = insertLines.length
				? insertRematchLines(partial.next, insertLines)
				: partial.next;
			if (next === snapshot) {
				skipped += partial.skipped + partial.rebound + insertLines.length;
				continue;
			}
			await deps.writeFile(file, next);
			rebound += partial.rebound;
			inserted += insertLines.length;
			skipped += partial.skipped;
			written += partial.rebound + insertLines.length;
			files += 1;
		} catch (error) {
			skipped += tasks.length;
			log.error(`TickTickSync rebind: failed writing ${file}`, error);
		}
	}

	return { written, rebound, inserted, skipped, files };
}
