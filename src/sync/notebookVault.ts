/**
 * FEAT-NOTEBOOK MVP — opt-in TickTick Notebook (`kind: NOTE`) → vault markdown folder.
 * One-way TT→vault. Distinct from task-body `syncNotes` / NOTE-BODY.
 */
import type { App } from 'obsidian';
import { TFile } from 'obsidian';
import type { ITask } from '@/api/types/Task';
import type { PluginContext } from '@/pluginContext';
import { getSettings } from '@/settings';
import { isNotebookTask } from '@/sync/notebookGuard';
import { commitVaultText, syncRead } from '@/sync/vault-io';
import { db } from '@/db/dexie';
import log from '@/utils/logger';

const ID_FM = /^ticktick_id:\s*([^\s#]+)\s*$/m;

/** Collapse duplicate slashes; trim leading/trailing `/` (no Obsidian normalizePath — unit-testable). */
function vaultPath(...parts: string[]): string {
	return parts
		.join('/')
		.replace(/\\/g, '/')
		.replace(/\/+/g, '/')
		.replace(/^\/+|\/+$/g, '');
}

/** Safe single-segment basename (no path separators). */
export function sanitizeNotebookBasename(title: string, id: string): string {
	const raw = (title || 'untitled').trim() || 'untitled';
	const cleaned = raw
		.replace(/[/\\?%*:|"<>]/g, '-')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, 80);
	const base = cleaned || 'untitled';
	const short = (id || 'unknown').slice(-8);
	return `${base} (${short})`;
}

export function notebookVaultPath(folder: string, title: string, id: string): string {
	const dir = (folder || 'TickTick Notebook').replace(/^\/+|\/+$/g, '');
	return vaultPath(dir, `${sanitizeNotebookBasename(title, id)}.md`);
}

export function renderNotebookMarkdown(task: Pick<ITask, 'id' | 'title' | 'content'>): string {
	const title = (task.title ?? '').trim() || 'Untitled';
	const body = task.content ?? '';
	const lines = [
		'---',
		`ticktick_id: ${task.id}`,
		'ticktick_kind: NOTE',
		'---',
		'',
		`# ${title}`,
		'',
	];
	if (body.length) lines.push(body.replace(/\s+$/, ''), '');
	return lines.join('\n');
}

export function parseNotebookFrontmatterId(text: string): string | undefined {
	const m = text.match(ID_FM);
	return m?.[1]?.trim() || undefined;
}

/** Expected body after the H1 title line for equality checks. */
export function notebookBodyFromMarkdown(text: string): { title: string; body: string } | null {
	const parts = text.split(/^---\s*$/m);
	if (parts.length < 3) return null;
	const rest = parts.slice(2).join('---').replace(/^\s+/, '');
	const m = rest.match(/^#\s+(.+)\n([\s\S]*)$/);
	if (!m) return null;
	return { title: m[1].trim(), body: m[2].replace(/^\n/, '').replace(/\s+$/, '') };
}

async function ensureFolder(app: App, folderPath: string): Promise<void> {
	const norm = vaultPath(folderPath);
	if (!norm || app.vault.getAbstractFileByPath(norm)) return;
	const bits = norm.split('/');
	let cur = '';
	for (const bit of bits) {
		cur = cur ? `${cur}/${bit}` : bit;
		if (!app.vault.getAbstractFileByPath(cur)) {
			await app.vault.createFolder(cur);
		}
	}
}

async function findExistingNotebookFile(app: App, folder: string, taskId: string): Promise<TFile | null> {
	const dir = vaultPath(folder);
	const abstract = app.vault.getAbstractFileByPath(dir);
	if (!abstract || !('children' in abstract)) {
		// Folder missing or not a folder — scan all md via metadata when possible.
		for (const f of app.vault.getMarkdownFiles()) {
			if (!f.path.startsWith(dir + '/') && f.path !== dir) continue;
			const cache = app.metadataCache.getFileCache(f);
			const id = cache?.frontmatter?.ticktick_id;
			if (id != null && String(id) === taskId) return f;
		}
		return null;
	}
	for (const f of app.vault.getMarkdownFiles()) {
		if (!f.path.startsWith(dir + '/')) continue;
		const cache = app.metadataCache.getFileCache(f);
		const id = cache?.frontmatter?.ticktick_id;
		if (id != null && String(id) === taskId) return f;
		try {
			const text = await syncRead(app.vault, f);
			if (parseNotebookFrontmatterId(text) === taskId) return f;
		} catch {
			/* skip unreadable */
		}
	}
	return null;
}

/**
 * Write/update markdown files for TickTick Notebook notes when `syncNotebook` is on.
 * @returns number of files created or updated
 */
export async function syncNotebooksToVault(app: App, _plugin: PluginContext): Promise<number> {
	const s = getSettings();
	if (!s.syncNotebook) return 0;
	const folder = (s.notebookFolder || 'TickTick Notebook').trim() || 'TickTick Notebook';
	await ensureFolder(app, folder);

	const locals = await db.tasks.filter(lt => !lt.deleted && isNotebookTask(lt.task)).toArray();
	let changed = 0;
	for (const lt of locals) {
		const task = lt.task;
		if (!task?.id) continue;
		const next = renderNotebookMarkdown(task);
		const existing = await findExistingNotebookFile(app, folder, task.id);
		if (existing) {
			let prev = '';
			try {
				prev = await syncRead(app.vault, existing);
			} catch {
				continue;
			}
			if (prev === next) continue;
			const result = await commitVaultText(app, existing, prev, next);
			if (result.status === 'written') {
				changed++;
				log.debug('notebook vault update', existing.path, task.id);
			}
		} else {
			const path = notebookVaultPath(folder, task.title ?? '', task.id);
			const parent = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
			if (parent) await ensureFolder(app, parent);
			if (app.vault.getAbstractFileByPath(path)) {
				// Collision: append more of the id.
				const alt = vaultPath(
					folder,
					`${sanitizeNotebookBasename(task.title ?? '', task.id)}-${task.id.slice(0, 6)}.md`,
				);
				await app.vault.create(alt, next);
			} else {
				await app.vault.create(path, next);
			}
			changed++;
			log.debug('notebook vault create', path, task.id);
		}
	}
	if (changed) log.info(`Notebook MVP: wrote ${changed} note file(s) under ${folder}`);
	return changed;
}
