import type { App } from 'obsidian';
import { TFile } from 'obsidian';

/** Vault files (from `paths`) modified after `since` (ms epoch). */
export function editedSince(app: App, paths: string[], since: number): string[] {
	return paths.filter(p => {
		const f = app.vault.getAbstractFileByPath(p);
		return f instanceof TFile && f.stat.mtime > since;
	});
}
