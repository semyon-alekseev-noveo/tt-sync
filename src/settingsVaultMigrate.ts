/**
 * Apply tag/list mapping renames and projects-folder moves in the vault (#66).
 */
import { Notice, TFolder, type App } from 'obsidian';
import { tagRenames, renameTagsInText, folderOf } from '@/settingsMigration';
import { commitVaultText, readNoteForWrite } from '@/sync/vault-io';
import log from '@/utils/logger';

export type SettingsSnap = {
	tagListMappings?: unknown;
	statusMappings?: unknown;
	tagMappings?: unknown;
	projectsFolder?: string;
};

/** Tag/status/list mapping renamed or projects folder changed: carry existing notes over. */
export async function migrateSettingsVaultChange(
	app: App,
	prev: SettingsSnap,
	next: SettingsSnap,
): Promise<void> {
	const renames = tagRenames(prev, next);
	if (Object.keys(renames).length) {
		let n = 0;
		for (const f of app.vault.getMarkdownFiles()) {
			const snapshot = await readNoteForWrite(app, f);
			const rewritten = renameTagsInText(snapshot, renames);
			if (rewritten === snapshot) continue;
			n++;
			await commitVaultText(app, f, snapshot, rewritten);
		}
		log.info('Tag mapping change migrated', renames, n, 'file(s)');
		new Notice(`TickTickSync: renamed ${Object.entries(renames).map(([a, b]) => `#${a} → #${b}`).join(', ')} in ${n} note(s)`);
	}
	const from = folderOf(prev), to = folderOf(next);
	if (from !== to && to) {
		const old = app.vault.getAbstractFileByPath(from);
		if (old instanceof TFolder) {
			let moved = 0;
			const files = app.vault.getMarkdownFiles().filter(f => f.path.startsWith(from + '/'));
			for (const f of files) {
				const dest = to + f.path.slice(from.length);
				if (app.vault.getAbstractFileByPath(dest)) { log.warn('Projects folder move: target exists, kept', f.path); continue; }
				const dir = dest.slice(0, dest.lastIndexOf('/'));
				if (dir && !app.vault.getAbstractFileByPath(dir)) await app.vault.createFolder(dir).catch(() => undefined);
				await app.vault.rename(f, dest); moved++; // vault.rename: fileManager.renameFile may block on an 'Update links?' prompt
			}
			if (moved) new Notice(`TickTickSync: moved ${moved} project note(s) from ${from} to ${to}`);
			log.info(`Projects folder ${from} -> ${to}: moved ${moved}`);
		}
	}
}
