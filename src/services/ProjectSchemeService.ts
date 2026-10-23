// IO side of the pilot project scheme (see src/projectScheme.ts).
import { TFile, type App } from 'obsidian';
import type { PluginContext } from '@/pluginContext';
import type { ITask } from '@/api/types/Task';
import { getSettings, updateSettings } from '@/settings';
import { getAllProjects } from '@/db/projects';
import { isListAllowed, normalizeSyncTag, resolveProjectsList, resolveSyncedListIds, type TaskSyncLimitOptions, taskMatchesSyncLimit } from '@/syncScope';
import log from '@/utils/logger';
import { commitFrontMatter, commitVaultText, readNoteForWrite, syncRead } from '@/sync/vault-io';
import { traceWrite } from '@/services/writeTrace';
import {
	isProjectNote, isSchemeParentTask, isProjectParentDuplicateLine, linkTarget, isDoneStatus, planProjects, renderProjectNote, renderProjectTemplate, sanitizeTitle, pickProjectNote, planTitle,
	STATUS_ACTIVE, STATUS_DONE, repairProjectNoteTasks, type NoteSide, type ParentSide, type Snap, stripFileLinks,
} from '@/projectScheme';

export class ProjectSchemeService {
	/** parent task id -> project note path */
	private parents = new Map<string, string>();
	listId = '';
	/** Projects list is not in syncedLists: the scheme does nothing (no pull, no push). */
	private blocked = false;
	private parentLimit: TaskSyncLimitOptions = {};

	constructor(private app: App, private plugin: PluginContext) {}

	enabled(): boolean { return !!getSettings().projectSchemeEnabled; }

	/**
	 * Hydrate projects-list id and parent map from settings + note frontmatter.
	 * `run()` does this only on a full TickTick pull. File-save pushes call
	 * `resolveForFile` earlier; without this they see an empty `listId` and
	 * create Active Zone lines on the inbox list.
	 */
	async ensurePushContext(): Promise<void> {
		if (!this.enabled()) return;
		const lists = await getAllProjects();
		const pl = resolveProjectsList(lists, getSettings().projectsListName, getSettings().projectsListId);
		this.listId = pl?.id ?? '';
		this.blocked = !pl || !isListAllowed(getSettings().syncedLists, pl);
		if (this.blocked || !this.listId) return;
		const next = new Map<string, string>();
		for (const n of this.projectNotes()) {
			if (n.id) next.set(n.id, n.path);
		}
		this.parents = next;
	}
	private folder() { return (getSettings().projectsFolder ?? '10 Projects').replace(/^\/+|\/+$/g, ''); }
	private tags() { return getSettings().projectTaskTags?.length ? getSettings().projectTaskTags : ['project', 'obsidian']; }

	isParentId(id: string | undefined | null): boolean { return !!id && this.parents.has(id); }
	noteForParent(id: string | undefined | null): string | undefined { return id ? this.parents.get(id) : undefined; }
	/** Checkbox line that reuses the note's `ticktick_id` (invalid; parent is not a line). */
	lineDuplicatesProjectParent(path: string, lineTaskId: string): boolean {
		return isProjectParentDuplicateLine(path, this.fm(path), this.folder(), lineTaskId);
	}
	/** A TickTick task that represents a project (never written as a line). */
	isParentTask(t: ITask): boolean {
		if (!this.enabled() || this.blocked || !this.listId) return false;
		if (this.parents.has(t.id)) return true;
		return isSchemeParentTask(t, this.listId, this.parentLimit);
	}

	private fm(path: string): Record<string, unknown> | undefined {
		const f = this.app.vault.getAbstractFileByPath(path);
		return f instanceof TFile ? this.app.metadataCache.getFileCache(f)?.frontmatter as Record<string, unknown> | undefined : undefined;
	}

	/** Project of a file: the note itself, or the note its `project:` frontmatter links to. */
	resolveForFile(path: string): { parentId: string; listId: string } | undefined {
		if (!this.enabled() || !this.listId || this.blocked) return undefined;
		let fm = this.fm(path);
		let projPath = path;
		if (!fm || !isProjectNote(path, fm, this.folder())) {
			const target = linkTarget(fm?.project);
			if (!target) return undefined;
			const dest = this.app.metadataCache.getFirstLinkpathDest(target, path);
			projPath = dest?.path ?? '';
			fm = projPath ? this.fm(projPath) : undefined;
			if (!projPath || !isProjectNote(projPath, fm, this.folder())) {
				// same-named non-project note shadows the project: fall back to project notes by name
				const alt = pickProjectNote(target, this.projectNotes().map(n => n.path));
				if (!alt) return undefined;
				projPath = alt; fm = this.fm(alt);
			}
		}
		const id = fm?.ticktick_id ? String(fm.ticktick_id) : '';
		return id ? { parentId: id, listId: this.listId } : undefined;
	}

	/** One source tag on a project note: `ticktick` if the plugin created it, else `obsidian`. */
	private async stampSourceTags(notes: NoteSide[]) {
		for (const n of notes) {
			const f = this.app.vault.getAbstractFileByPath(n.path);
			if (!(f instanceof TFile)) continue;
			const fm = this.fm(n.path);
			const tags = Array.isArray(fm?.tags) ? (fm!.tags as unknown[]).map(String) : [];
			if (tags.includes('ticktick') || tags.includes('obsidian')) continue;
			const body = await syncRead(this.app.vault, f);
			const source = body.includes('Source:: TickTick') ? 'ticktick' : 'obsidian';
			await commitFrontMatter(this.app, f, front => {
				const cur = Array.isArray(front.tags) ? front.tags.map(String) : [];
				if (!cur.includes('ticktick') && !cur.includes('obsidian')) front.tags = [...cur, source];
			});
		}
	}

	private projectNotes(): NoteSide[] {
		return this.app.vault.getMarkdownFiles()
			.filter(f => isProjectNote(f.path, this.fm(f.path), this.folder()))
			.map(f => {
				const fm = this.fm(f.path);
				return { path: f.path, title: f.basename, id: fm?.ticktick_id ? String(fm.ticktick_id) : undefined, done: isDoneStatus(fm?.status) };
			});
	}

	/** New project note text: user template (projectTemplatePath) if readable, else the built-in one. */
	private async renderNote(o: Parameters<typeof renderProjectNote>[0]): Promise<string> {
		const tp = getSettings().projectTemplatePath?.trim().replace(/^\/+/, '');
		if (tp) {
			try {
				const f = this.app.vault.getAbstractFileByPath(tp);
				if (f instanceof TFile) return renderProjectTemplate(await syncRead(this.app.vault, f), o);
				log.warn(`ProjectScheme: template not found: ${tp}; using built-in template`);
			} catch (e) { log.warn('ProjectScheme: template failed; using built-in template', e); }
		}
		return renderProjectNote(o);
	}

	/** Run before upstream processes `updated` (TickTick tasks changed since checkpoint). */
	async run(updated: ITask[]): Promise<void> {
		if (!this.enabled()) return;
		const lists = await getAllProjects();
		const pl = resolveProjectsList(lists, getSettings().projectsListName, getSettings().projectsListId);
		this.listId = pl?.id ?? '';
		if (!this.listId) { log.warn('ProjectScheme: list not found'); return; }
		this.blocked = !pl || !isListAllowed(getSettings().syncedLists, pl);
		if (this.blocked) { log.warn(`ProjectScheme: list "${pl?.name}" is not in syncedLists; project sync skipped`); return; }
		const syncedEntries = getSettings().syncedLists ?? [];
		this.parentLimit = {
			syncTag: normalizeSyncTag(getSettings().SyncTag),
			syncProject: getSettings().SyncProject?.trim() || undefined,
			andOr: getSettings().tagAndOr,
			allowedListIds: resolveSyncedListIds(syncedEntries, lists),
		};
		const api = this.plugin.tickTickRestAPI;
		const allNotes = this.projectNotes();
		this.parents = new Map();
		const notes: NoteSide[] = [];
		const parents: ParentSide[] = [];
		const titles = new Map<string, string>();
		// TP-IDLE-BYID-ZERO: prefer Dexie/`updated` batch — quiet vaultReconcile already
		// passes every local task. GET only when the parent id is missing from that batch.
		const localById = new Map<string, ITask>();
		for (const t of updated) {
			if (t?.id) localById.set(t.id, t);
		}
		for (const n of allNotes) {
			if (!n.id) { notes.push(n); continue; }
			let t: ITask | null | undefined = localById.get(n.id);
			if (!t) {
				t = await api?.getTaskById(n.id, this.listId);
			}
			if (!t || t.projectId !== this.listId || !isSchemeParentTask(t, this.listId, this.parentLimit)) {
				log.debug(`ProjectScheme: skip linked note ${n.path} (parent missing or out of sync scope)`);
				continue;
			}
			notes.push(n);
			this.parents.set(t.id, n.path);
			if (t && stripFileLinks(t.title) !== t.title) {
				// repair titles polluted by a file link (parent once tracked as an inbox line)
				t.title = stripFileLinks(t.title);
				try { await api?.updateTask(t); } catch (e) { log.error('ProjectScheme: title repair failed', e); }
			}
			if (t) {
				const snap0 = (getSettings().projectSnapshot ?? {})[t.id];
				const plan = planTitle(n.title, sanitizeTitle(t.title), snap0?.title);
				try {
					if (plan?.to === 'tt') { t.title = plan.title; await api?.updateTask(t); }
					else if (plan?.to === 'note') {
						const f = this.app.vault.getAbstractFileByPath(n.path);
						const dest = `${n.path.slice(0, n.path.lastIndexOf('/') + 1)}${plan.title}.md`;
						if (f instanceof TFile && !this.app.vault.getAbstractFileByPath(dest)) {
							traceWrite(this.app, 'ProjectSchemeService', n.path, 'renameFile', { to: dest, reason: 'title' });
							await this.app.fileManager.renameFile(f, dest);
							n.path = dest; n.title = plan.title; this.parents.set(t.id, dest);
						}
					}
				} catch (e) { log.error('ProjectScheme: title sync failed', e); }
				titles.set(t.id, n.title);
				parents.push({ id: t.id, title: t.title, done: (t.status ?? 0) > 0, content: t.content });
			}
		}
		for (const t of updated) {
			if (!this.parents.has(t.id) && isSchemeParentTask(t, this.listId, this.parentLimit) && !parents.some(p => p.id === t.id))
				parents.push({ id: t.id, title: t.title, done: (t.status ?? 0) > 0, content: t.content || t.desc });
		}
		await this.stampSourceTags(notes);
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
					if (f instanceof TFile) await commitFrontMatter(this.app, f, fm => {
						fm.ticktick_id = created.id;
						const tags = Array.isArray(fm.tags) ? fm.tags.map(String) : [];
						if (!tags.includes('obsidian') && !tags.includes('ticktick')) fm.tags = [...tags, 'obsidian'];
					});
					if (a.note.done) await api?.CloseTask(created.id, this.listId);
					this.parents.set(created.id, a.note.path);
					snap[created.id] = { noteDone: a.note.done, ttDone: a.note.done };
				} else if (a.type === 'createNote') {
					const title = sanitizeTitle(a.parent.title) || a.parent.id;
					const path = `${this.folder()}/${title}.md`;
					// note already exists elsewhere (e.g. projects folder changed mid-run): adopt and move it, never duplicate
					const existing = this.app.vault.getMarkdownFiles().find(f => String(this.fm(f.path)?.ticktick_id ?? '') === a.parent.id);
					if (existing) {
						if (!this.app.vault.getAbstractFileByPath(this.folder())) await this.app.vault.createFolder(this.folder());
						let at = existing.path;
						if (!this.app.vault.getAbstractFileByPath(path)) {
							traceWrite(this.app, 'ProjectSchemeService', existing.path, 'vault.rename', { to: path, reason: 'adopt' });
							await this.app.vault.rename(existing, path);
							at = path;
						}
						log.info(`ProjectScheme: adopted existing project note ${existing.path} -> ${at}`);
						this.parents.set(a.parent.id, at);
						continue;
					}
					if (!this.app.vault.getAbstractFileByPath(this.folder())) await this.app.vault.createFolder(this.folder());
					if (!this.app.vault.getAbstractFileByPath(path))
						await this.app.vault.create(path, await this.renderNote({ title, ticktickId: a.parent.id, note: a.parent.content, done: a.parent.done, now: new Date() }));
					this.parents.set(a.parent.id, path);
					snap[a.parent.id] = { noteDone: a.parent.done, ttDone: a.parent.done };
				} else if (a.type === 'setParentDone') {
					if (a.done) await api?.CloseTask(a.id, this.listId); else await api?.OpenTask(a.id, this.listId);
					snap[a.id] = { noteDone: a.done, ttDone: a.done };
				} else if (a.type === 'setNoteDone') {
					const f = this.app.vault.getAbstractFileByPath(a.path);
					if (f instanceof TFile) await commitFrontMatter(this.app, f, fm => { fm.status = a.done ? STATUS_DONE : STATUS_ACTIVE; });
					const id = [...this.parents].find(([, p]) => p === a.path)?.[0];
					if (id) snap[id] = { noteDone: a.done, ttDone: a.done };
				}
			} catch (e) { log.error('ProjectScheme action failed', a, e); }
		}
		// record steady state for unchanged pairs
		for (const p of parents) {
			const n = notes.find(x => x.id === p.id);
			if (n && n.done === p.done) snap[p.id] = { noteDone: n.done, ttDone: p.done };
			if (snap[p.id] && titles.has(p.id)) snap[p.id].title = titles.get(p.id);
		}
		for (const n of notes) {
			if (n.id) await this.repairNote(n.path, n.id);
		}
		updateSettings({ projectSnapshot: snap });
		await this.plugin.saveSettings();
	}

	/** Vault repair: Active Zone layout + no parent-id lines (safe before reset / on scheme run). */
	async repairAllProjectNotes(): Promise<void> {
		if (!this.enabled()) return;
		for (const n of this.projectNotes()) {
			if (n.id) await this.repairNote(n.path, n.id);
		}
	}

	private async repairNote(path: string, parentId: string) {
		const f = this.app.vault.getAbstractFileByPath(path);
		if (!(f instanceof TFile)) return;
		const text = await readNoteForWrite(this.app, f);
		const lines = text.split('\n');
		const tp = this.plugin.taskParser;
		const next = repairProjectNoteTasks(
			lines,
			parentId,
			l => tp.isMarkdownTask(l),
			l => tp.getTickTickId(l),
		);
		const out = next.join('\n');
		if (out !== text) {
			log.info(`ProjectScheme: repaired project task layout in ${path}`);
			await commitVaultText(this.app, f, text, out);
		}
	}
}
