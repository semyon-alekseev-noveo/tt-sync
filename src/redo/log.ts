// Write-ahead redo log: .tickticksync/journal/YYYY-MM-DD.jsonl, append-only, one record per atomic change.
// A record is written BEFORE the change ({state:'pending'}) and a {commit:id} line is appended after it succeeded.
export type Dir = 'obs->tt' | 'tt->obs';
export type Op = 'create' | 'update' | 'delete' | 'detach' | 'move' | 'rename' | 'remap';
export interface RedoRecord {
	id: string; syncId: string; ts: string; dir: Dir; op: Op;
	taskId?: string; file?: string; line?: number; field?: string;
	before?: unknown; after?: unknown; group?: string; kind?: 'task' | 'line' | 'file';
	rollbackOf?: string;
}
export interface Entry extends RedoRecord { committed: boolean }

export interface Adapter {
	exists(p: string): Promise<boolean>; mkdir(p: string): Promise<void>;
	append(p: string, d: string): Promise<void>; read(p: string): Promise<string>;
	list(p: string): Promise<{ files: string[]; folders: string[] }>; remove(p: string): Promise<void>;
}

export const DIR = '.tickticksync/journal';
const day = (d: Date) => d.toISOString().slice(0, 10);
let seq = 0;
export const newId = (now = Date.now()) => `${now.toString(36)}-${(seq++).toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export class RedoLog {
	syncId: string | null = null;
	dir: Dir = 'tt->obs';
	private queue: Promise<unknown> = Promise.resolve();
	constructor(private a: Adapter, private now: () => Date = () => new Date()) {}

	private async file() {
		if (!(await this.a.exists('.tickticksync'))) await this.a.mkdir('.tickticksync');
		if (!(await this.a.exists(DIR))) await this.a.mkdir(DIR);
		return `${DIR}/${day(this.now())}.jsonl`;
	}
	private write(obj: unknown) {
		const p = this.queue.then(async () => this.a.append(await this.file(), JSON.stringify(obj) + '\n'));
		this.queue = p.catch(() => undefined);
		return p;
	}
	/** Run `fn` as one journaled session (sync or rollback). Nested sessions reuse the outer id. */
	async session<T>(prefix: string, fn: (syncId: string) => Promise<T>): Promise<T> {
		if (this.syncId) return fn(this.syncId);
		this.syncId = `${prefix}-${newId()}`;
		try { return await fn(this.syncId); } finally { await this.queue; this.syncId = null; }
	}
	active() { return !!this.syncId; }
	/** Write-ahead: returns the record id; call commit(id) once the change is applied. */
	async begin(r: Omit<RedoRecord, 'id' | 'syncId' | 'ts' | 'dir'> & { dir?: Dir }): Promise<string> {
		const rec: RedoRecord & { state: 'pending' } = { id: newId(), syncId: this.syncId ?? 'manual', ts: this.now().toISOString(), dir: r.dir ?? this.dir, ...r, state: 'pending' } as never;
		await this.write(rec); return rec.id;
	}
	async commit(id: string) { await this.write({ commit: id }); }
	/** begin + apply + commit; nothing is committed if apply throws. */
	async wrap<T>(r: Parameters<RedoLog['begin']>[0], apply: () => Promise<T>, after?: (res: T) => unknown): Promise<T> {
		const id = await this.begin(r);
		const res = await apply();
		if (after) { const a = after(res); if (a !== undefined) await this.write({ commit: id, after: a }); else await this.commit(id); }
		else await this.commit(id);
		return res;
	}

	async entries(): Promise<Entry[]> {
		await this.queue;
		if (!(await this.a.exists(DIR))) return [];
		const files = (await this.a.list(DIR)).files.filter(f => f.endsWith('.jsonl')).sort();
		const recs: Entry[] = []; const byId = new Map<string, Entry>();
		for (const f of files) for (const l of (await this.a.read(f)).split('\n')) {
			if (!l.trim()) continue;
			let o: Record<string, unknown>; try { o = JSON.parse(l); } catch { continue; }
			if (o.commit) { const e = byId.get(String(o.commit)); if (e) { e.committed = true; if ('after' in o) e.after = o.after; } continue; }
			const e = { ...(o as unknown as RedoRecord), committed: false } as Entry; delete (e as never as Record<string, unknown>).state;
			recs.push(e); byId.set(e.id, e);
		}
		return recs;
	}
	async prune(days: number): Promise<number> {
		if (!(days > 0) || !(await this.a.exists(DIR))) return 0;
		const cut = day(new Date(this.now().getTime() - days * 86400000)); let n = 0;
		for (const f of (await this.a.list(DIR)).files) {
			const d = f.split('/').pop()!.slice(0, 10);
			if (/^\d{4}-\d{2}-\d{2}$/.test(d) && d < cut) { await this.a.remove(f); n++; }
		}
		return n;
	}
}

const ID = /%%\[ticktick_id:: ([0-9a-f]+)\]%%/;
/** Task-line level diff of a file write: id -> {before line, after line, index}. */
export function diffTaskLines(before: string, after: string) {
	const map = (t: string) => { const m = new Map<string, { line: string; idx: number }>(); t.split('\n').forEach((l, i) => { const id = l.match(ID)?.[1]; if (id && !m.has(id)) m.set(id, { line: l, idx: i }); }); return m; };
	const b = map(before), a = map(after); const out: { taskId: string; before: string | null; after: string | null; idx: number }[] = [];
	for (const [id, x] of b) { const y = a.get(id); if (!y) out.push({ taskId: id, before: x.line, after: null, idx: x.idx }); else if (y.line !== x.line) out.push({ taskId: id, before: x.line, after: y.line, idx: y.idx }); }
	for (const [id, y] of a) if (!b.has(id)) out.push({ taskId: id, before: null, after: y.line, idx: y.idx });
	return out;
}
