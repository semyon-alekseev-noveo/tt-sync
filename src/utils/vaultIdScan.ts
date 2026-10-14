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
