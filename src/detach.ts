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
	const idx = lines.findIndex(l => l.includes(`ticktick_id:: ${taskId}`));
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
		const text = await app.vault.cachedRead(f as never);
		const line = text.split('\n').find(l => l.includes(`ticktick_id:: ${it.id}`));
		if (line) it.line = line.trim();
	}
	return items;
}
