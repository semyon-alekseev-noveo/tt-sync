import type { App } from 'obsidian';

/** Ids (of `ids`) that already appear in some markdown note, mapped to the first note path containing them. */
export async function idsPresentInVault(app: App, ids: string[]): Promise<Map<string, string>> {
	const left = new Set(ids.filter(Boolean)), found = new Map<string, string>();
	if (!left.size) return found;
	for (const f of app.vault.getMarkdownFiles()) {
		const text = await app.vault.cachedRead(f);
		for (const id of [...left]) if (text.includes(id)) { left.delete(id); found.set(id, f.path); }
		if (!left.size) break;
	}
	return found;
}

const ID_RE = /%%\[ticktick_id:: ([0-9a-f]+)\]%%/;
/** Remove the TickTick id (and its TT link) from a task line, turning it into a new task. */
export function stripTaskId(line: string): string {
	const id = line.match(ID_RE)?.[1];
	if (!id) return line;
	return line.replace(ID_RE, '').replace(new RegExp(`\\s*\\[link\\]\\([^)]*${id}\\)`), '').replace(/[ \t]+$/, '');
}

/**
 * Duplicated task lines (same TickTick id twice): keep the occurrence in `owner(id)`'s file
 * (or the first one), strip the id from every other copy so it syncs as a new task.
 */
export function dedupeTaskIds(files: { path: string; text: string }[], owner: (id: string) => string | undefined) {
	const seen = new Map<string, string>(); // id -> path that keeps it
	for (const f of files) for (const m of f.text.matchAll(new RegExp(ID_RE, 'g'))) {
		const id = m[1];
		if (!seen.has(id)) seen.set(id, owner(id) && files.some(x => x.path === owner(id) && x.text.includes(id)) ? owner(id)! : f.path);
	}
	const changed: { path: string; text: string; ids: string[] }[] = [];
	for (const f of files) {
		const kept = new Set<string>(); const ids: string[] = [];
		const lines = f.text.split('\n').map(l => {
			const id = l.match(ID_RE)?.[1];
			if (!id) return l;
			if (seen.get(id) === f.path && !kept.has(id)) { kept.add(id); return l; }
			ids.push(id); return stripTaskId(l);
		});
		if (ids.length) changed.push({ path: f.path, text: lines.join('\n'), ids });
	}
	return changed;
}
