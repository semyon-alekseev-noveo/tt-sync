// Per-field three-way merge for a task edited on both sides between syncs.
// base = last synced copy (DB), local = Obsidian line, remote = current TickTick task.
import { stripFileLinks } from '@/projectScheme';

type T = Record<string, unknown>;
export const MERGE_FIELDS = ['title', 'content', 'startDate', 'dueDate', 'priority', 'tags'] as const;

const norm = (f: string, v: unknown): string => {
	if (v === undefined || v === null || v === '') return '';
	if (f === 'title') return stripFileLinks(String(v)).trim();
	if (f === 'content') return String(v).replace(/\r/g, '').trim();
	if (f === 'tags') return [...(v as string[])].map(s => s.toLowerCase()).sort().join(',');
	if (f === 'startDate' || f === 'dueDate') { const d = new Date(String(v)); return isNaN(+d) ? String(v) : d.toISOString().slice(0, 10); }
	return String(v);
};

export interface MergeResult { taken: string[]; conflicts: { field: string; remote: unknown }[] }

/** Mutates `local`: fields changed only in TickTick are taken from remote; true conflicts keep local. */
export function mergeTask(base: T, local: T, remote: T): MergeResult {
	const res: MergeResult = { taken: [], conflicts: [] };
	for (const f of MERGE_FIELDS) {
		const b = norm(f, base[f]), l = norm(f, local[f]), r = norm(f, remote[f]);
		if (r === b || r === l) continue;            // TickTick did not change it (or agrees)
		if (l === b) {                               // only TickTick changed it
			local[f] = f === 'title' ? stripFileLinks(String(remote[f] ?? '')).trim() + (String(local.title ?? '').match(/\s\[[^\]]*\]\(obsidian:\/\/[^)]*\)/)?.[0] ?? '') : remote[f];
			res.taken.push(f);
		} else res.conflicts.push({ field: f, remote: remote[f] });
	}
	return res;
}

export function conflictNote(conflicts: MergeResult['conflicts'], when: Date): string {
	const z = (n: number) => String(n).padStart(2, '0');
	const stamp = `${when.getFullYear()}-${z(when.getMonth() + 1)}-${z(when.getDate())} ${z(when.getHours())}:${z(when.getMinutes())}`;
	return conflicts.map(c => `⚠ ${stamp} конфликт, версия TickTick (${c.field}): ${c.field === 'title' ? stripFileLinks(String(c.remote ?? '')) : Array.isArray(c.remote) ? c.remote.join(', ') : String(c.remote ?? '')}`).join('\n');
}
