// IO side of the pilot project scheme (see src/projectScheme.ts).
import { TFile, type App } from 'obsidian';
import type TickTickSync from '@/main';
import type { ITask } from '@/api/types/Task';
import { getSettings, updateSettings } from '@/settings';
import { getAllProjects } from '@/db/projects';
import log from '@/utils/logger';
import {
	isProjectNote, linkTarget, isDoneStatus, planProjects, renderProjectNote, sanitizeTitle,
	STATUS_ACTIVE, STATUS_DONE, type NoteSide, type ParentSide, type Snap, stripFileLinks,
} from '@/projectScheme';

export class ProjectSchemeService {
	/** parent task id -> project note path */
	private parents = new Map<string, string>();
	listId = '';

	constructor(private app: App, private plugin: TickTickSync) {}

	enabled(): boolean { return !!getSettings().projectSchemeEnabled; }
	private folder() { return (getSettings().projectsFolder ?? '10 Projects').replace(/^\/+|\/+$/g, ''); }
	private tags() { return getSettings().projectTaskTags?.length ? getSettings().projectTaskTags : ['project', 'obsidian']; }

	isParentId(id: string | undefined | null): boolean { return !!id && this.parents.has(id); }
	noteForParent(id: string | undefined | null): string | undefined { return id ? this.parents.get(id) : undefined; }
	/** A TickTick task that represents a project (never written as a line). */
	isParentTask(t: ITask): boolean {
		if (!this.enabled()) return false;
		if (this.parents.has(t.id)) return true;
		return t.projectId === this.listId && (t.tags ?? []).map(x => x.toLowerCase()).includes(this.tags()[0]) && !t.parentId;
	}

	private fm(path: string): Record<string, unknown> | undefined {
		const f = this.app.vault.getAbstractFileByPath(path);
		return f instanceof TFile ? this.app.metadataCache.getFileCache(f)?.frontmatter as Record<string, unknown> | undefined : undefined;
	}

	/** Project of a file: the note itself, or the note its `project:` frontmatter links to. */
	resolveForFile(path: string): { parentId: string; listId: string } | undefined {
		if (!this.enabled() || !this.listId) return undefined;
		let fm = this.fm(path);
		let projPath = path;
		if (!fm || !isProjectNote(path, fm, this.folder())) {
			const target = linkTarget(fm?.project);
			if (!target) return undefined;
			const dest = this.app.metadataCache.getFirstLinkpathDest(target, path);
			if (!dest) return undefined;
			projPath = dest.path;
			fm = this.fm(projPath);
			if (!isProjectNote(projPath, fm, this.folder())) return undefined;
		}
		const id = fm?.ticktick_id ? String(fm.ticktick_id) : '';
		return id ? { parentId: id, listId: this.listId } : undefined;
	}

	private projectNotes(): NoteSide[] {
		return this.app.vault.getMarkdownFiles()
			.filter(f => isProjectNote(f.path, this.fm(f.path), this.folder()))
			.map(f => {
				const fm = this.fm(f.path);
				return { path: f.path, title: f.basename, id: fm?.ticktick_id ? String(fm.ticktick_id) : undefined, done: isDoneStatus(fm?.status) };
			});
	}

	/** Run before upstream processes `updated` (TickTick tasks changed since checkpoint). */
	async run(updated: ITask[]): Promise<void> {
		if (!this.enabled()) return;
		const lists = await getAllProjects();
		this.listId = lists.find(p => p.name.toLowerCase() === (getSettings().projectsListName || 'Projects').toLowerCase())?.id ?? '';
		if (!this.listId) { log.warn('ProjectScheme: list not found'); return; }
		const api = this.plugin.tickTickRestAPI;
		const notes = this.projectNotes();
		this.parents = new Map(notes.filter(n => n.id).map(n => [n.id as string, n.path]));
		const parents: ParentSide[] = [];
		for (const n of notes) {
			if (!n.id) continue;
			const t = await api?.getTaskById(n.id, this.listId);
			if (t && stripFileLinks(t.title) !== t.title) {
				// repair titles polluted by a file link (parent once tracked as an inbox line)
				t.title = stripFileLinks(t.title);
				try { await api?.updateTask(t); } catch (e) { log.error('ProjectScheme: title repair failed', e); }
			}
			if (t) parents.push({ id: t.id, title: t.title, done: (t.status ?? 0) > 0, content: t.content });
		}
		for (const t of updated) {
			if (!this.parents.has(t.id) && this.isParentTask(t) && !parents.some(p => p.id === t.id))
				parents.push({ id: t.id, title: t.title, done: (t.status ?? 0) > 0, content: t.content || t.desc });
		}
		const snap: Record<string, Snap> = { ...(getSettings().projectSnapshot ?? {}) };
		for (const a of planProjects(notes, parents, snap)) {
			try {
				if (a.type === 'createParent') {
					const created = await api?.createTask({
						title: a.note.title, projectId: this.listId, tags: this.tags(), content: '', desc: '',
						items: [], status: 0, priority: 0, parentId: '', childIds: [],
					} as unknown as ITask);
					if (!created) continue;
					const f = this.app.vault.getAbstractFileByPath(a.note.path);
					if (f instanceof TFile) await this.app.fileManager.processFrontMatter(f, fm => { fm.ticktick_id = created.id; });
					if (a.note.done) await api?.CloseTask(created.id, this.listId);
					this.parents.set(created.id, a.note.path);
					snap[created.id] = { noteDone: a.note.done, ttDone: a.note.done };
				} else if (a.type === 'createNote') {
					const title = sanitizeTitle(a.parent.title) || a.parent.id;
					const path = `${this.folder()}/${title}.md`;
					if (!this.app.vault.getAbstractFileByPath(this.folder())) await this.app.vault.createFolder(this.folder());
					if (!this.app.vault.getAbstractFileByPath(path))
						await this.app.vault.create(path, renderProjectNote({ title, ticktickId: a.parent.id, note: a.parent.content, done: a.parent.done, now: new Date() }));
					this.parents.set(a.parent.id, path);
					snap[a.parent.id] = { noteDone: a.parent.done, ttDone: a.parent.done };
				} else if (a.type === 'setParentDone') {
					if (a.done) await api?.CloseTask(a.id, this.listId); else await api?.OpenTask(a.id, this.listId);
					snap[a.id] = { noteDone: a.done, ttDone: a.done };
				} else if (a.type === 'setNoteDone') {
					const f = this.app.vault.getAbstractFileByPath(a.path);
					if (f instanceof TFile) await this.app.fileManager.processFrontMatter(f, fm => { fm.status = a.done ? STATUS_DONE : STATUS_ACTIVE; });
					const id = [...this.parents].find(([, p]) => p === a.path)?.[0];
					if (id) snap[id] = { noteDone: a.done, ttDone: a.done };
				}
			} catch (e) { log.error('ProjectScheme action failed', a, e); }
		}
		// record steady state for unchanged pairs
		for (const p of parents) {
			const n = notes.find(x => x.id === p.id);
			if (n && n.done === p.done) snap[p.id] = { noteDone: n.done, ttDone: p.done };
		}
		updateSettings({ projectSnapshot: snap });
		await this.plugin.saveSettings();
	}
}
