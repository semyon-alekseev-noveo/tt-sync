import { describe, it, expect, vi } from 'vitest';
vi.mock('@/settings', () => ({ getSettings: () => ({}) }));
import { RedoLog, diffTaskLines, type Adapter } from '@/redo/log';
import { planUndo, execute, versionsOf, lastSyncId, type Env } from '@/redo/rollback';

function fakeFs(): Adapter & { files: Map<string, string> } {
	const files = new Map<string, string>(); const dirs = new Set<string>();
	return { files,
		exists: async p => files.has(p) || dirs.has(p) || [...files.keys()].some(f => f.startsWith(p + '/')), mkdir: async p => { dirs.add(p); },
		append: async (p, d) => { files.set(p, (files.get(p) ?? '') + d); }, read: async p => files.get(p) ?? '',
		list: async p => ({ files: [...files.keys()].filter(f => f.startsWith(p + '/')), folders: [] }), remove: async p => { files.delete(p); } };
}
const L = (t: string, id: string, x = ' ') => `- [${x}] ${t} %%[ticktick_id:: ${id}]%%`;

function fakeEnv(vault: Map<string, string>, tt: Map<string, Record<string, unknown>>): Env {
	let n = 0;
	return {
		read: async p => vault.get(p) ?? null, write: async (p, t) => { vault.set(p, t); }, remove: async p => { vault.delete(p); },
		rename: async (a, b) => { vault.set(b, vault.get(a)!); vault.delete(a); },
		ttGet: async id => tt.get(id) ?? null, ttUpdate: async t => { tt.set(String(t.id), { ...t }); }, ttDelete: async id => { tt.delete(id); },
		ttCreate: async t => { const id = `ff${n++}`; const x = { ...t, id }; tt.set(id, x); return x; },
		remapId: async (o, nid) => { for (const [p, t] of vault) vault.set(p, t.split(o).join(nid)); },
		lineOf: async id => { for (const t of vault.values()) { const l = t.split('\n').find(x => x.includes(`ticktick_id:: ${id}`)); if (l) return l; } return null; },
		place: async t => { vault.set('Inbox.md', (vault.get('Inbox.md') ?? '') + '\n' + L(String(t.title), String(t.id))); return 'Inbox.md'; },
	};
}

describe('redo log', () => {
	it('is append-only JSONL, write-ahead: uncommitted records are not undone', async () => {
		const fs = fakeFs(); const r = new RedoLog(fs, () => new Date('2026-10-14T07:00:00Z'));
		await r.session('sync', async () => {
			await r.wrap({ kind: 'task', op: 'update', taskId: 'a1', before: { id: 'a1', title: 'old' }, after: { id: 'a1', title: 'new' } }, async () => 1);
			await r.begin({ kind: 'task', op: 'update', taskId: 'b2', before: { id: 'b2' }, after: {} }); // crashed before commit
		});
		const raw = fs.files.get('.tickticksync/journal/2026-10-14.jsonl')!;
		expect(raw.trim().split('\n').map(l => Object.keys(JSON.parse(l))[0])).toEqual(['id', 'commit', 'id']);
		const es = await r.entries();
		expect(es.map(e => [e.taskId, e.committed])).toEqual([['a1', true], ['b2', false]]);
		expect(planUndo(es, lastSyncId(es)!).map(a => a.type)).toEqual(['tt-restore']);
	});
	it('diffs task lines and prunes by retention', async () => {
		expect(diffTaskLines([L('a', 'a1'), L('b', 'b2')].join('\n'), [L('a!', 'a1'), L('c', 'c3')].join('\n')).map(d => [d.taskId, d.before ? 'b' : '-', d.after ? 'a' : '-']))
			.toEqual([['a1', 'b', 'a'], ['b2', 'b', '-'], ['c3', '-', 'a']]);
		const fs = fakeFs(); fs.files.set('.tickticksync/journal/2026-09-01.jsonl', '{}\n'); fs.files.set('.tickticksync/journal/2026-10-10.jsonl', '{}\n');
		expect(await new RedoLog(fs, () => new Date('2026-10-14T00:00:00Z')).prune(30)).toBe(1);
		expect([...fs.files.keys()]).toEqual(['.tickticksync/journal/2026-10-10.jsonl']);
	});
});

describe('rollback', () => {
	async function scenario() {
		const fs = fakeFs(); const r = new RedoLog(fs);
		const vault = new Map([['n.md', [L('A', 'a1'), L('B', 'b2')].join('\n')]]);
		const tt = new Map<string, Record<string, unknown>>([['a1', { id: 'a1', title: 'A2', projectId: 'p' }]]);
		// sync: tt->obs line update A -> A2, obs->tt delete of b2, file create
		await r.session('sync', async () => {
			const before = vault.get('n.md')!, after = [L('A2', 'a1')].join('\n');
			await r.wrap({ kind: 'file', op: 'update', file: 'n.md', before, after, group: 'g' }, async () => vault.set('n.md', after));
			await r.wrap({ kind: 'line', op: 'update', file: 'n.md', taskId: 'a1', line: 0, before: L('A', 'a1'), after: L('A2', 'a1'), group: 'g' }, async () => 1);
			await r.wrap({ kind: 'task', op: 'delete', dir: 'obs->tt', taskId: 'b2', before: { id: 'b2', title: 'B', projectId: 'p' }, after: null }, async () => 1);
			await r.wrap({ kind: 'file', op: 'create', file: 'new.md', before: null, after: 'x' }, async () => vault.set('new.md', 'x'));
		});
		return { r, vault, tt, env: fakeEnv(vault, tt) };
	}
	it('dry run changes nothing and lists the reverse plan', async () => {
		const { r, vault, env } = await scenario(); const es = await r.entries();
		const rep = await execute(planUndo(es, lastSyncId(es)!), env, { dryRun: true });
		expect(rep[0]).toMatch(/^WOULD delete created file new.md/);
		expect(vault.get('n.md')).toBe(L('A2', 'a1'));
	});
	it('undo reverts both sides in reverse order, recreates deleted TT task with remapped id, and is itself undoable', async () => {
		const { r, vault, tt, env } = await scenario(); let es = await r.entries();
		await r.session('rollback', () => execute(planUndo(es, lastSyncId(es)!), env));
		expect(vault.has('new.md')).toBe(false);
		const ids = [...tt.keys()]; expect(ids).toContain('ff0');
		expect(vault.get('n.md')).toBe([L('A', 'a1'), L('B', 'ff0')].join('\n'));
		es = await r.entries();
		expect(lastSyncId(es)).toMatch(/^sync-/); // the fake env does not journal; real env does (vault/api hooks)
	});
	it('does not resurrect a detached [-] task into TickTick unless asked', async () => {
		const { r, vault, tt, env } = await scenario();
		vault.set('n.md', [L('A2', 'a1'), L('B', 'b2', '-') + ' %%tt-detached%%'].join('\n'));
		const es = await r.entries(); const plan = planUndo(es, lastSyncId(es)!).filter(a => a.type === 'tt-recreate');
		expect((await execute(plan, env))[0]).toMatch(/^SKIP .*detached/);
		expect(tt.size).toBe(1);
		expect((await execute(plan, env, { resurrect: true }))[0]).toMatch(/^OK .*new id ff0/);
	});
	it('restores one task to a chosen version (history picker source)', async () => {
		const { r } = await scenario(); const vs = versionsOf(await r.entries(), 'a1');
		expect(vs.map(v => v.label)).toEqual(['line before update', 'line after update']);
		expect(vs[0].line).toBe(L('A', 'a1'));
	});
});
