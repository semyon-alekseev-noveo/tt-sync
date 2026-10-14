// Rollback planning/execution over the redo log. Pure w.r.t. the Env, so it is unit-testable.
import type { Entry } from './log';
import { isDetached } from '@/detach';
import { fencedLines } from '@/utils/vaultIdScan';

type T = Record<string, unknown> & { id?: string; projectId?: string };
export type Action =
	| { type: 'file-write'; file: string; expect: string; content: string; group?: string; src: string }
	| { type: 'file-delete'; file: string; expect: string; src: string }
	| { type: 'file-create'; file: string; content: string; src: string }
	| { type: 'file-rename'; from: string; to: string; src: string }
	| { type: 'line-set'; file: string; taskId: string; expect: string; line: string; group?: string; src: string }
	| { type: 'line-remove'; file: string; taskId: string; expect: string; group?: string; src: string }
	| { type: 'line-insert'; file: string; taskId: string; idx: number; line: string; group?: string; src: string }
	| { type: 'tt-restore'; taskId: string; task: T; src: string }
	| { type: 'tt-delete'; taskId: string; projectId: string; src: string }
	| { type: 'tt-recreate'; taskId: string; task: T; src: string }
	| { type: 'vault-place'; taskId: string; task: T; src: string };

export interface Env {
	read(file: string): Promise<string | null>; write(file: string, text: string): Promise<void>;
	remove(file: string): Promise<void>; rename(from: string, to: string): Promise<void>;
	ttGet(id: string, projectId?: string): Promise<T | null | undefined>;
	ttUpdate(t: T): Promise<void>; ttDelete(id: string, projectId: string): Promise<void>;
	ttCreate(t: T): Promise<T | null>; remapId(oldId: string, newId: string): Promise<void>;
	lineOf(taskId: string): Promise<string | null>;
	/** put a line for `task` into its note (the normal sync placement) */
	place(task: T): Promise<string | null>;
}

const s = (x: unknown) => (typeof x === 'string' ? x : x == null ? null : JSON.stringify(x));
/** Reverse of one record (null if nothing to undo). */
export function invert(e: Entry): Action | null {
	const src = e.id;
	if (e.kind === 'file' && e.file) {
		if (e.op === 'rename') return { type: 'file-rename', from: String(e.after), to: String(e.before), src };
		if (e.op === 'create') return { type: 'file-delete', file: e.file, expect: String(e.after ?? ''), src };
		if (e.op === 'delete') return { type: 'file-create', file: e.file, content: String(e.before ?? ''), src };
		return { type: 'file-write', file: e.file, expect: String(e.after ?? ''), content: String(e.before ?? ''), group: e.group, src };
	}
	if (e.kind === 'line' && e.file && e.taskId) {
		const b = s(e.before), a = s(e.after);
		if (b == null && a != null) return { type: 'line-remove', file: e.file, taskId: e.taskId, expect: a, group: e.group, src };
		if (a == null && b != null) return { type: 'line-insert', file: e.file, taskId: e.taskId, idx: e.line ?? 0, line: b, group: e.group, src };
		if (a != null && b != null) return { type: 'line-set', file: e.file, taskId: e.taskId, expect: a, line: b, group: e.group, src };
		return null;
	}
	if (e.kind === 'task' && e.taskId) {
		const before = e.before as T | undefined, after = e.after as T | undefined;
		if (e.op === 'create') return { type: 'tt-delete', taskId: String(after?.id ?? e.taskId), projectId: String(after?.projectId ?? ''), src };
		if (e.op === 'delete') return before ? { type: 'tt-recreate', taskId: e.taskId, task: before, src } : null;
		return before ? { type: 'tt-restore', taskId: e.taskId, task: before, src } : null;
	}
	return null;
}

/** All committed changes of one sync, newest first, inverted. */
export function planUndo(entries: Entry[], syncId: string): Action[] {
	const acts = entries.filter(e => e.syncId === syncId && e.committed).reverse().map(invert).filter((a): a is Action => !!a);
	// inside one write group try the whole-file revert first; its per-line actions are the fallback
	const out: Action[] = []; const seen = new Set<string>();
	for (const a of acts) {
		const g = 'group' in a ? a.group : undefined;
		if (g && !seen.has(g)) { seen.add(g); const f = acts.find(x => x.type === 'file-write' && x.group === g); if (f) out.push(f); }
		if (!(a.type === 'file-write' && g)) out.push(a);
	}
	return out;
}
export function lastSyncId(entries: Entry[], includeRollbacks = true): string | undefined {
	for (let i = entries.length - 1; i >= 0; i--) if (entries[i].committed && (includeRollbacks || !entries[i].syncId.startsWith('rollback'))) return entries[i].syncId;
	return undefined;
}

export interface Version { ts: string; syncId: string; label: string; task?: T; line?: string; file?: string; idx?: number }
/** History of one task: every state it had according to the log (oldest first). */
export function versionsOf(entries: Entry[], taskId: string): Version[] {
	const out: Version[] = [];
	for (const e of entries) {
		if (!e.committed || e.taskId !== taskId) continue;
		if (e.kind === 'task') {
			if (e.before && !out.some(v => v.task)) out.push({ ts: e.ts, syncId: e.syncId, label: `TickTick before ${e.op}`, task: e.before as T });
			if (e.after) out.push({ ts: e.ts, syncId: e.syncId, label: `TickTick after ${e.op}`, task: e.after as T });
		} else if (e.kind === 'line') {
			if (typeof e.before === 'string' && !out.some(v => v.line)) out.push({ ts: e.ts, syncId: e.syncId, label: `line before ${e.op}`, line: e.before, file: e.file, idx: e.line });
			if (typeof e.after === 'string') out.push({ ts: e.ts, syncId: e.syncId, label: `line after ${e.op}`, line: e.after, file: e.file, idx: e.line });
		}
	}
	return out;
}

const idx = (lines: string[], id: string) => { const f = fencedLines(lines); return lines.findIndex((l, i) => !f.has(i) && l.includes(`ticktick_id:: ${id}`)); };
export function describe(a: Action): string {
	switch (a.type) {
		case 'file-write': return `restore ${a.file} (whole file)`;
		case 'file-delete': return `delete created file ${a.file}`;
		case 'file-create': return `recreate deleted file ${a.file}`;
		case 'file-rename': return `rename ${a.from} back to ${a.to}`;
		case 'line-set': return `${a.file}: line of ${a.taskId} -> ${a.line.trim().slice(0, 60)}`;
		case 'line-remove': return `${a.file}: remove line of ${a.taskId}`;
		case 'line-insert': return `${a.file}: re-insert line of ${a.taskId} at ${a.idx + 1}`;
		case 'tt-restore': return `TickTick: restore ${a.taskId} "${String(a.task.title ?? '').slice(0, 40)}"`;
		case 'tt-delete': return `TickTick: delete ${a.taskId} (it was created by that sync)`;
		case 'vault-place': return `vault: add line for ${a.taskId} "${String(a.task.title ?? '').slice(0, 40)}" to its note`;
		case 'tt-recreate': return `TickTick: recreate deleted ${a.taskId} "${String(a.task.title ?? '').slice(0, 40)}" (new id, lines remapped)`;
	}
}

export interface Opts { dryRun?: boolean; resurrect?: boolean; force?: boolean }
/** Apply actions in order. Returns a human report; nothing is changed in dryRun. */
export async function execute(actions: Action[], env: Env, o: Opts = {}): Promise<string[]> {
	const rep: string[] = []; const doneGroups = new Set<string>(); const remap = new Map<string, string>();
	const say = (ok: boolean | 'skip', a: Action, why = '') => rep.push(`${ok === true ? (o.dryRun ? 'WOULD' : 'OK') : ok === 'skip' ? 'SKIP' : 'CONFLICT'} ${describe(a)}${why ? ` — ${why}` : ''}`);
	for (const a of actions) {
		const id = 'taskId' in a ? (remap.get(a.taskId) ?? a.taskId) : '';
		if ('group' in a && a.group && doneGroups.has(a.group) && a.type !== 'file-write') { continue; }
		if (a.type === 'file-write' || a.type === 'file-delete' || a.type === 'file-create' || a.type === 'file-rename') {
			if (a.type === 'file-rename') { if (!(await env.read(a.from))) { say(false, a, 'source missing'); continue; } if (await env.read(a.to)) { say(false, a, 'target exists'); continue; } if (!o.dryRun) await env.rename(a.from, a.to); say(true, a); continue; }
			const cur = await env.read(a.file);
			if (a.type === 'file-create') { if (cur != null) { say(false, a, 'file exists'); continue; } if (!o.dryRun) await env.write(a.file, a.content); say(true, a); continue; }
			if (a.type === 'file-write' && cur === a.content) { say('skip', a, 'already in that state'); a.group && doneGroups.add(a.group); continue; }
			if (cur !== a.expect && !o.force && (a.type === 'file-write' || a.type === 'file-delete')) { say(false, a, 'file changed since; falling back to per-line'); continue; }
			if (!o.dryRun) { if (a.type === 'file-delete') await env.remove(a.file); else await env.write(a.file, a.content); }
			if (a.type === 'file-write' && a.group) doneGroups.add(a.group);
			say(true, a); continue;
		}
		if (a.type === 'line-set' || a.type === 'line-remove' || a.type === 'line-insert') {
			const text = await env.read(a.file); if (text == null) { say(false, a, 'file missing'); continue; }
			const lines = text.split('\n'); const i = idx(lines, id);
			if (a.type === 'line-insert') {
				if (i >= 0) { say('skip', a, 'line already present'); continue; }
				lines.splice(Math.min(a.idx, lines.length), 0, a.line.replace(a.taskId, id));
			} else {
				if (i < 0) { say(a.type === 'line-remove' ? 'skip' : false, a, 'line not found'); continue; }
				if (a.type === 'line-set' && lines[i] === a.line.replace(a.taskId, id)) { say('skip', a, 'already in that state'); continue; }
				if (lines[i] !== a.expect.replace(a.taskId, id) && !o.force) { say(false, a, 'line edited since'); continue; }
				if (a.type === 'line-set') lines[i] = a.line.replace(a.taskId, id); else lines.splice(i, 1);
			}
			if (!o.dryRun) await env.write(a.file, lines.join('\n'));
			say(true, a); continue;
		}
		if (a.type === 'vault-place') {
			if (await env.lineOf(id)) { say('skip', a, 'line already in vault'); continue; }
			if (o.dryRun) { say(true, a); continue; }
			const at = await env.place({ ...a.task, id });
			say(at ? true : false, a, at ? `in ${at}` : 'no target note'); continue;
		}
		// TickTick side: never resurrect a task whose vault line is detached unless asked
		const line = await env.lineOf(id);
		if ((a.type === 'tt-recreate' || a.type === 'tt-restore') && line && isDetached(line) && !o.resurrect) { say('skip', a, 'line is detached [-]; use "resurrect" to push it back to TickTick'); continue; }
		if (a.type === 'tt-delete') { if (!o.dryRun) await env.ttDelete(id, a.projectId); say(true, a); continue; }
		const got = await env.ttGet(id, String(a.task.projectId ?? ''));
		const cur = got && !Number(got.deleted ?? 0) ? got : null; // TickTick still returns trashed tasks
		if (a.type === 'tt-restore' && cur) { if (!o.dryRun) await env.ttUpdate({ ...a.task, id, projectId: cur.projectId ?? a.task.projectId }); say(true, a); continue; }
		if (cur) { say('skip', a, 'task exists in TickTick'); continue; }
		if (o.dryRun) { say(true, a); continue; }
		const { id: _drop, ...rest } = a.task; void _drop;
		const made = await env.ttCreate({ ...rest, status: 0 });
		if (!made?.id) { say(false, a, 'create failed'); continue; }
		if (Number(a.task.status ?? 0) > 0) await env.ttUpdate({ ...made, status: a.task.status });
		await env.remapId(a.taskId, String(made.id)); remap.set(a.taskId, String(made.id));
		say(true, a, `new id ${made.id}`);
	}
	// lines restored after the recreate still carry the old id
	if (!o.dryRun) for (const [oldId, nid] of remap) if (await env.lineOf(oldId)) await env.remapId(oldId, nid);
	return rep;
}

/** Replace a TickTick id everywhere in a note (marker + TT web link). */
export function remapInText(text: string, oldId: string, newId: string): string {
	return text.split(oldId).join(newId);
}
