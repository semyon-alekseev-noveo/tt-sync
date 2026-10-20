import type { App } from 'obsidian';
import { TFile } from 'obsidian';

/**
 * mtime this plugin left on a file. A later user save has a greater mtime and is
 * still a local edit. The push-phase marker is not moved to the end of the sync
 * to hide these writes.
 */
const pluginWriteMtime = new Map<string, number>();

export function notePluginWrite(path: string, mtime: number): void {
	if (!path || !Number.isFinite(mtime)) return;
	const prev = pluginWriteMtime.get(path) ?? 0;
	if (mtime > prev) pluginWriteMtime.set(path, mtime);
}

export function pluginWriteMtimes(): Record<string, number> {
	return Object.fromEntries(pluginWriteMtime);
}

export function loadPluginWrites(saved: Record<string, number> | undefined): void {
	if (!saved) return;
	for (const [path, mtime] of Object.entries(saved)) notePluginWrite(path, mtime);
}

export function clearPluginWritesForTests(): void {
	pluginWriteMtime.clear();
}

/** Vault files (from `paths`) modified after `since` (ms epoch), excluding our own writes. */
export function editedSince(app: App, paths: string[], since: number): string[] {
	return paths.filter(p => {
		const f = app.vault.getAbstractFileByPath(p);
		if (!(f instanceof TFile) || f.stat.mtime <= since) return false;
		const own = pluginWriteMtime.get(p);
		if (own != null && f.stat.mtime <= own) return false;
		return true;
	});
}
