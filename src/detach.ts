import { fencedLines } from '@/utils/vaultIdScan';
import { syncCachedRead } from '@/sync/vault-io';
// Detach a task line from TickTick sync after the task was deleted in TickTick.
// Result: `[-]` (cancelled), no ticktick_id, no TickTick link, no sync-marker tag,
// plus DETACH_MARK so the line is never tagged/pushed again (even in full-vault mode).
export const DETACH_MARK = '%%tt-detached%%';

export function isDetached(line: string): boolean {
	return line.includes(DETACH_MARK);
}

export function detachLine(line: string, marker: string): string {
	const esc = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	let out = line
		.replace(/^([\s>]*[-*+] )\[.\]/, '$1[-]')
		.replace(/\s*%%\[ticktick_id::\s*[^\]]*\]%%/g, '')
		.replace(/\s*\[link\]\(https?:\/\/[^)]*ticktick[^)]*\)/gi, '')
		.replace(new RegExp(`\\s#${esc}(?![\\w/-])`, 'gi'), '')
		.replace(/[ \t]+$/, '');
	if (!isDetached(out)) out += ' ' + DETACH_MARK;
	return out;
}

/** Apply to file content: detach the line carrying this ticktick id. Returns null if not found. */
export function detachInContent(content: string, taskId: string, marker: string): string | null {
	const lines = content.split('\n');
	const fenced = fencedLines(lines);
	const idx = lines.findIndex((l, i) => !fenced.has(i) && l.includes(`ticktick_id:: ${taskId}`));
	if (idx < 0) return null;
	lines[idx] = detachLine(lines[idx], marker);
	return lines.join('\n');
}

interface VaultLike { getAbstractFileByPath(p: string): unknown; cachedRead(f: never): Promise<string> }
/** Add the current line text to each deletion item (path + id already present). */
export async function enrichDeletionItems<T extends { filePath?: string; id?: string; line?: string }>(
	app: { vault: VaultLike }, items: T[]): Promise<T[]> {
	for (const it of items) {
		if (!it.id || !it.filePath) continue;
		const f = app.vault.getAbstractFileByPath(it.filePath);
		if (!f || typeof f !== 'object' || !('extension' in (f as object))) continue;
		const text = await syncCachedRead(app.vault as never, f as { path: string });
		const line = text.split('\n').find(l => l.includes(`ticktick_id:: ${it.id}`));
		if (line) it.line = line.trim();
	}
	return items;
}

/** All descendants (by parentId) of the given roots, excluding the roots themselves. */
export function descendantsOf<T extends { id: string; parentId?: string | null }>(rootIds: string[], tasks: T[]): T[] {
	const out: T[] = []; const seen = new Set(rootIds); let frontier = [...rootIds];
	while (frontier.length) {
		const kids = tasks.filter(t => t.parentId && frontier.includes(t.parentId) && !seen.has(t.id));
		kids.forEach(k => seen.add(k.id)); out.push(...kids); frontier = kids.map(k => k.id);
	}
	return out;
}

/** Ids of task lines indented under the line carrying `taskId` (its subtree in the note). */
export function childIdsInContent(content: string, taskId: string): string[] {
	const lines = content.split('\n');
	const fenced = fencedLines(lines);
	const idx = lines.findIndex((l, i) => !fenced.has(i) && l.includes(`ticktick_id:: ${taskId}`));
	if (idx < 0) return [];
	const ind = (l: string) => (l.match(/^[\t ]*/)?.[0] ?? '').replace(/ {4}/g, '\t').length;
	const base = ind(lines[idx]); const out: string[] = [];
	for (let i = idx + 1; i < lines.length; i++) {
		if (!lines[i].trim()) continue;
		if (ind(lines[i]) <= base) break;
		const m = lines[i].match(/ticktick_id::\s*([0-9a-f]+)/); if (m) out.push(m[1]);
	}
	return out;
}
