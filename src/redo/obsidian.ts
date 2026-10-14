// Wiring of the redo log into Obsidian (vault writes = tt->obs) and the TickTick API (obs->tt).
import { TFile, type App } from 'obsidian';
import { RedoLog, diffTaskLines, newId, type Adapter } from './log';
import { remapInText, type Env } from './rollback';
import { isDetached } from '@/detach';
import { TickTickRestAPI } from '@/services/TicktickRestAPI';
import type TickTickSync from '@/main';
import type { ITask } from '@/api/types/Task';
import log from '@/utils/logger';

const MAX_FILE = 256 * 1024;
const clean = (t: unknown) => { if (!t || typeof t !== 'object') return t ?? null; const { dateHolder: _a, lineHash: _b, ...r } = t as Record<string, unknown>; void _a; void _b; return JSON.parse(JSON.stringify(r)); };

export function makeAdapter(app: App): Adapter {
	const a = app.vault.adapter;
	return { exists: p => a.exists(p), mkdir: p => a.mkdir(p), append: (p, d) => a.append(p, d), read: p => a.read(p), list: p => a.list(p), remove: p => a.remove(p) };
}

/** Journal records for one file write (file-level + per task line). Returns record ids. */
async function recordWrite(r: RedoLog, path: string, before: string | null, after: string | null, op: 'create' | 'update' | 'delete'): Promise<string[]> {
	const g = newId(); const ids: string[] = [];
	if ((before?.length ?? 0) + (after?.length ?? 0) < MAX_FILE) ids.push(await r.begin({ kind: 'file', op, file: path, before, after, group: g, dir: 'tt->obs' }));
	for (const d of diffTaskLines(before ?? '', after ?? '')) {
		const lop = d.before == null ? 'create' : d.after == null ? 'delete' : (d.after && isDetached(d.after) && !isDetached(d.before)) ? 'detach' : 'update';
		ids.push(await r.begin({ kind: 'line', op: lop, taskId: d.taskId, file: path, line: d.idx, field: 'line', before: d.before, after: d.after, group: g, dir: 'tt->obs' }));
	}
	return ids;
}
const journaled = (p: string) => p.endsWith('.md') && !p.startsWith('.tickticksync/');

export function instrumentVault(app: App, r: RedoLog) {
	const v = app.vault as unknown as Record<string, (...a: unknown[]) => Promise<unknown>>;
	const orig = { process: v.process.bind(v), modify: v.modify.bind(v), create: v.create.bind(v), delete: v.delete.bind(v), trash: v.trash.bind(v), rename: v.rename.bind(v) };
	const commitAll = async (ids: string[]) => { for (const id of ids) await r.commit(id); };
	v.process = async (file: unknown, fn: unknown, opts?: unknown) => {
		const f = file as TFile; const fx = fn as (d: string) => string;
		if (!r.active() || !journaled(f.path)) return orig.process(file, fn, opts);
		const before = await app.vault.read(f); const after = fx(before);
		if (after === before) return orig.process(file, fn, opts);
		const ids = await recordWrite(r, f.path, before, after, 'update');
		const res = await orig.process(file, (d: string) => (d === before ? after : fx(d)), opts);
		await commitAll(ids); return res;
	};
	v.modify = async (file: unknown, data: unknown, opts?: unknown) => {
		const f = file as TFile;
		if (!r.active() || !journaled(f.path)) return orig.modify(file, data, opts);
		const before = await app.vault.read(f); if (before === data) return orig.modify(file, data, opts);
		const ids = await recordWrite(r, f.path, before, String(data), 'update');
		const res = await orig.modify(file, data, opts); await commitAll(ids); return res;
	};
	v.create = async (path: unknown, data: unknown, opts?: unknown) => {
		if (!r.active() || !journaled(String(path))) return orig.create(path, data, opts);
		const ids = await recordWrite(r, String(path), null, String(data), 'create');
		const res = await orig.create(path, data, opts); await commitAll(ids); return res;
	};
	for (const k of ['delete', 'trash'] as const) v[k] = async (file: unknown, x?: unknown) => {
		const f = file as TFile;
		if (!r.active() || !(f instanceof TFile) || !journaled(f.path)) return orig[k](file, x);
		const ids = await recordWrite(r, f.path, await app.vault.read(f), null, 'delete');
		const res = await orig[k](file, x); await commitAll(ids); return res;
	};
	v.rename = async (file: unknown, to: unknown) => {
		const f = file as TFile;
		if (!r.active() || !journaled(f.path)) return orig.rename(file, to);
		return r.wrap({ kind: 'file', op: 'rename', file: f.path, before: f.path, after: String(to), dir: 'tt->obs' }, () => orig.rename(file, to));
	};
}

/** obs->tt: journal every TickTick write the plugin makes (prototype-level, survives API re-creation). */
export function instrumentApi(plugin: TickTickSync, r: RedoLog) {
	const P = TickTickRestAPI.prototype as unknown as Record<string, (...a: unknown[]) => Promise<unknown>>;
	const db = (id: string) => !id ? Promise.resolve(null) : plugin.taskRepository.loadTaskById(id).then(clean).catch(() => null);
	const run = <X>(fn: () => Promise<X>) => (r.active() ? fn() : r.session('edit', fn));
	const wrapM = (name: string, rec: (args: unknown[]) => Promise<Parameters<RedoLog['begin']>[0]>, after?: (res: unknown, args: unknown[]) => unknown) => {
		const o = P[name]; if (!o) return;
		P[name] = async function (this: unknown, ...args: unknown[]) {
			return run(async () => r.wrap({ dir: 'obs->tt', ...(await rec(args)) }, () => o.apply(this, args), after ? (res => after(res, args)) : undefined));
		};
	};
	wrapM('createTask', async ([t]) => ({ kind: 'task', op: 'create', taskId: String((t as ITask).id ?? ''), before: null, after: clean(t) }), res => clean(res) ?? undefined);
	wrapM('updateTask', async ([t]) => { const b = await db((t as ITask).id) as ITask | null; return { kind: 'task', op: b && b.projectId !== (t as ITask).projectId ? 'move' : 'update', taskId: (t as ITask).id, before: b, after: clean(t) }; });
	wrapM('deleteTask', async ([id]) => ({ kind: 'task', op: 'delete', taskId: String(id), before: await db(String(id)), after: null }));
	for (const [m, st] of [['CloseTask', 2], ['OpenTask', 0]] as const)
		wrapM(m, async ([id]) => { const b = await db(String(id)); return { kind: 'task', op: 'update', field: 'status', taskId: String(id), before: b, after: b ? { ...(b as object), status: st } : null }; });
	wrapM('moveTaskProject', async ([t, , to]) => { const b = await db((t as ITask).id); return { kind: 'task', op: 'move', field: 'projectId', taskId: (t as ITask).id, before: b, after: b ? { ...(b as object), projectId: to } : null }; });
	wrapM('moveTaskParent', async ([id, , np]) => { const b = await db(String(id)); return { kind: 'task', op: 'move', field: 'parentId', taskId: String(id), before: b, after: b ? { ...(b as object), parentId: np } : null }; });
}

/** Env used by rollback/restore against the real vault + TickTick. */
export function makeEnv(plugin: TickTickSync): Env {
	const app = plugin.app; const api = () => plugin.tickTickRestAPI!;
	const file = (p: string) => { const f = app.vault.getAbstractFileByPath(p); return f instanceof TFile ? f : null; };
	const findLine = async (id: string) => {
		for (const f of app.vault.getMarkdownFiles()) { const t = await app.vault.cachedRead(f); if (t.includes(`ticktick_id:: ${id}`)) return { f, line: t.split('\n').find(l => l.includes(`ticktick_id:: ${id}`)) ?? null }; }
		return null;
	};
	return {
		read: async p => { const f = file(p); return f ? app.vault.read(f) : null; },
		write: async (p, text) => {
			const f = file(p); if (f) { await app.vault.modify(f, text); return; }
			const dir = p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '';
			if (dir && !app.vault.getAbstractFileByPath(dir)) await app.vault.createFolder(dir).catch(() => undefined);
			await app.vault.create(p, text);
		},
		remove: async p => { const f = file(p); if (f) await app.vault.trash(f, true); },
		rename: async (a, b) => { const f = file(a); if (f) await app.vault.rename(f, b); },
		ttGet: (id, pid) => api().getTaskById(id, pid || undefined) as never,
		ttUpdate: async t => {
			const upd = await api().updateTask(t as unknown as ITask) as ITask | undefined;
			const at = await findLine(String(t.id));
			if (upd) {
				plugin.dateMan?.addDateHolderToTask(upd, undefined);
				await plugin.taskRepository.upsertTask(upd, at?.f.path, Date.now());
				// keep the note in step, otherwise the next sync would push the old line back
				if (at) await plugin.fileOperation?.synchronizeToVault(at.f.path, [upd], true);
			}
		},
		ttDelete: async (id, pid) => { await api().deleteTask(id, pid); await plugin.taskRepository.deleteTask(id).catch(() => undefined); },
		ttCreate: t => api().createTask(t as unknown as ITask) as never,
		remapId: async (oldId, nid) => {
			for (const f of app.vault.getMarkdownFiles()) {
				if (!(await app.vault.cachedRead(f)).includes(oldId)) continue;
				await app.vault.process(f, d => remapInText(d, oldId, nid));
				await r0(plugin).begin({ kind: 'file', op: 'remap', file: f.path, taskId: oldId, before: oldId, after: nid }).then(id => r0(plugin).commit(id));
			}
			const lt = await plugin.taskRepository.loadLocalTaskById(oldId);
			const fresh = await api().getTaskById(nid);
			if (fresh) { plugin.dateMan?.addDateHolderToTask(fresh, undefined); await plugin.taskRepository.upsertTask(fresh, lt?.file, Date.now()); }
			await plugin.taskRepository.deleteTask(oldId).catch(() => undefined);
		},
		lineOf: async id => (await findLine(id))?.line ?? null,
		place: async t => {
			const task = t as unknown as ITask;
			const lt = await plugin.taskRepository.loadLocalTaskById(task.id);
			const target = plugin.projectScheme?.noteForParent(task.parentId)
				?? (lt?.file && file(lt.file) ? lt.file : undefined)
				?? await plugin.fileMetadataService.getFilepathForProjectId(task.projectId) ?? undefined;
			if (!target) return null;
			plugin.dateMan?.addDateHolderToTask(task, undefined);
			await plugin.fileOperation?.synchronizeToVault(target, [task], false);
			await plugin.taskRepository.upsertTask(task, target, Date.now());
			return target;
		},
	};
}
const r0 = (p: TickTickSync) => (p as unknown as { redo: RedoLog }).redo;
export { log };
