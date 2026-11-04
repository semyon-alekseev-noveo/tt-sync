/**
 * ID-REBIND-RESTORE / ID-REBIND-DEDUP (#216)
 */
import { describe, expect, it, vi } from 'vitest';
import {
	findRebindLineIndex,
	normalizeRebindTitle,
	rebindFileContent,
	rebindVaultFromPlanned,
	replaceOrAttachMarker,
} from '@/sync/rebindVault';
import type { PlannedDeletion } from '@/sync/massDeleteGuard';

describe('ID-REBIND normalize / marker', () => {
	it('normalizeRebindTitle strips checkbox, tags, marker', () => {
		expect(
			normalizeRebindTitle('- [ ] Foo bar #ticktick #obsidian %%[ticktick_id:: deadbeefdeadbeefdeadbeef]%%'),
		).toBe('foo bar');
	});

	it('replaceOrAttachMarker rewrites or appends', () => {
		expect(replaceOrAttachMarker('- [ ] X %%[ticktick_id:: oldoldoldoldoldoldoldold]%%', 'newnewnewnewnewnewnewnew')).toContain(
			'ticktick_id:: newnewnewnewnewnewnewnew',
		);
		expect(replaceOrAttachMarker('- [ ] X', 'aaaaaaaaaaaaaaaaaaaaaaaa')).toContain('%%[ticktick_id:: aaaaaaaaaaaaaaaaaaaaaaaa]%%');
	});
});

describe('ID-REBIND-RESTORE rebindFileContent', () => {
	it('rewrites stale marker by title instead of inserting a duplicate', () => {
		const live = new Set(['newid01newid01newid01new1']);
		const snapshot = [
			'# P',
			'## Active Zone',
			'- [ ] смеситель #ticktick %%[ticktick_id:: oldid01oldid01oldid01old1]%%',
			'',
		].join('\n');
		const tasks = [
			{ id: 'newid01newid01newid01new1', title: 'смеситель', projectId: 'p', content: '', items: [] },
		];
		const r = rebindFileContent(snapshot, tasks as never, live);
		expect(r.rebound).toBe(1);
		expect(r.needInsert).toHaveLength(0);
		expect(r.next).toContain('ticktick_id:: newid01newid01newid01new1');
		expect(r.next).not.toContain('oldid01oldid01oldid01old1');
		expect(r.next.split('смеситель').length - 1).toBe(1);
	});

	it('ID-REBIND-DEDUP: skips insert when title line already has the new id', () => {
		const id = 'havehavehavehavehavehave12';
		const live = new Set([id]);
		const snapshot = `# n\n## Active Zone\n- [ ] Have %%[ticktick_id:: ${id}]%%\n`;
		const r = rebindFileContent(
			snapshot,
			[{ id, title: 'Have', projectId: 'p', content: '', items: [] }] as never,
			live,
		);
		expect(r.rebound).toBe(0);
		expect(r.needInsert).toHaveLength(0);
		expect(r.skipped).toBe(1);
	});

	it('inserts when no title candidate exists', () => {
		const live = new Set(['brandnewbrandnewbrandnew01']);
		const snapshot = '# P\n\n## Active Zone\n\n';
		const r = rebindFileContent(
			snapshot,
			[{ id: 'brandnewbrandnewbrandnew01', title: 'Brand', projectId: 'p', content: '', items: [] }] as never,
			live,
		);
		expect(r.needInsert).toHaveLength(1);
		expect(r.rebound).toBe(0);
	});
});

describe('ID-REBIND findRebindLineIndex', () => {
	it('prefers stale marker over unmarked same title', () => {
		const lines = [
			'- [ ] Foo %%[ticktick_id:: stale1stale1stale1stal]%%',
			'- [ ] Foo',
		];
		const live = new Set(['liveid01liveid01liveid01li']);
		expect(findRebindLineIndex(lines, 'Foo', 'liveid01liveid01liveid01li', live)).toBe(0);
	});

	it('BUG-CONFIRM-REBIND-DUP: default does not steal live same-title marker (ID-REBIND-DEDUP)', () => {
		const lines = ['- [ ] Journal %%[ticktick_id:: oldliveoldliveoldliveold1]%%'];
		const live = new Set([
			'oldliveoldliveoldliveold1',
			'confirmconfirmconfirmconf1',
		]);
		expect(
			findRebindLineIndex(lines, 'Journal', 'confirmconfirmconfirmconf1', live),
		).toBe(-1);
	});

	it('BUG-CONFIRM-REBIND-DUP: allowDisplaceLiveSameTitle reclaims live same-title line', () => {
		const lines = ['- [ ] Journal %%[ticktick_id:: oldliveoldliveoldliveold1]%%'];
		const live = new Set([
			'oldliveoldliveoldliveold1',
			'confirmconfirmconfirmconf1',
		]);
		expect(
			findRebindLineIndex(lines, 'Journal', 'confirmconfirmconfirmconf1', live, {
				allowDisplaceLiveSameTitle: true,
			}),
		).toBe(0);
	});
});

describe('BUG-CONFIRM-REBIND-DUP rebindFileContent displace vs insert', () => {
	it('without allowDisplace: live same-title → InsertLine (held / multi-task safe)', () => {
		const confirmId = '6ae82058d07c7a23f9eed592';
		const siblingId = '6ae82058d07c7a23f9eed586';
		const live = new Set([confirmId, siblingId]);
		const snapshot = [
			'# PKM',
			'## Active Zone',
			`- [ ] journaling #ticktick %%[ticktick_id:: ${siblingId}]%%`,
			'',
		].join('\n');
		const r = rebindFileContent(
			snapshot,
			[{ id: confirmId, title: 'journaling', projectId: 'p', content: '', items: [] }] as never,
			live,
		);
		expect(r.rebound).toBe(0);
		expect(r.needInsert).toHaveLength(1);
		expect(r.displacedIds).toEqual([]);
	});

	it('with allowDisplace: live same-title → Link displace, not InsertLine', () => {
		const confirmId = '6ae82058d07c7a23f9eed592';
		const siblingId = '6ae82058d07c7a23f9eed586';
		const live = new Set([confirmId, siblingId]);
		const snapshot = [
			'# PKM',
			'## Active Zone',
			`- [ ] journaling #ticktick %%[ticktick_id:: ${siblingId}]%%`,
			'',
		].join('\n');
		const r = rebindFileContent(
			snapshot,
			[{ id: confirmId, title: 'journaling', projectId: 'p', content: '', items: [] }] as never,
			live,
			{ allowDisplaceLiveSameTitle: true },
		);
		expect(r.rebound).toBe(1);
		expect(r.needInsert).toHaveLength(0);
		expect(r.displacedIds).toEqual([siblingId]);
		expect(r.next).toContain(`ticktick_id:: ${confirmId}`);
		expect(r.next).not.toContain(siblingId);
		expect(r.next.split('journaling').length - 1).toBe(1);
	});

	it('with allowDisplace: three Confirm ids displace three live same-title siblings (no dups)', () => {
		const confirms = [
			'6ae82058d07c7a23f9eed592',
			'6ae82059d07c7a23f9eed593',
			'6ae9baf1eec3d823f964606e',
		];
		const siblings = [
			'6ae82058d07c7a23f9eed586',
			'6ae82059d07c7a23f9eed587',
			'6ae9baf1eec3d823f9646059',
		];
		const titles = ['Alpha', 'Beta', 'Gamma'];
		const live = new Set([...confirms, ...siblings]);
		const snapshot = [
			'# PKM',
			'## Active Zone',
			...siblings.map((id, i) => `- [ ] ${titles[i]} #ticktick %%[ticktick_id:: ${id}]%%`),
			'',
		].join('\n');
		const r = rebindFileContent(
			snapshot,
			confirms.map((id, i) => ({
				id,
				title: titles[i],
				projectId: 'p',
				content: '',
				items: [],
			})) as never,
			live,
			{ allowDisplaceLiveSameTitle: true },
		);
		expect(r.rebound).toBe(3);
		expect(r.needInsert).toHaveLength(0);
		expect(r.displacedIds).toEqual(siblings);
		for (const id of confirms) expect(r.next).toContain(`ticktick_id:: ${id}`);
		for (const id of siblings) expect(r.next).not.toContain(id);
		for (const t of titles) expect(r.next.split(t!).length - 1).toBe(1);
	});
});

describe('ID-REBIND-RESTORE rebindVaultFromPlanned', () => {
	it('rewrites then does not duplicate', async () => {
		const planned: PlannedDeletion[] = [
			{
				id: 'new1new1new1new1new1new1ne',
				taskId: 'new1new1new1new1new1new1ne',
				kind: 'task',
				direction: 'vault-to-ticktick',
				action: 'delete',
				file: '10 Projects/p.md',
				title: 'A',
			},
		];
		const files = new Map<string, string>([[
			'10 Projects/p.md',
			'# P\n\n## Active Zone\n- [ ] A #ticktick %%[ticktick_id:: old1old1old1old1old1old1ol]%%\n',
		]]);
		const result = await rebindVaultFromPlanned(planned, {
			loadLiveTask: async (taskId) => ({
				taskId,
				deleted: false,
				task: { id: taskId, projectId: 'p', title: 'A', content: '', items: [] },
			}),
			readFile: async (path) => files.get(path) ?? null,
			writeFile: async (path, text) => { files.set(path, text); },
			convertTaskToLine: async (task) =>
				`- [ ] ${task.title} #ticktick %%[ticktick_id:: ${task.id}]%%`,
		});
		expect(result.rebound).toBe(1);
		expect(result.inserted).toBe(0);
		expect(result.written).toBe(1);
		const next = files.get('10 Projects/p.md')!;
		expect(next).toContain('ticktick_id:: new1new1new1new1new1new1ne');
		expect(next).not.toContain('old1old1old1old1old1old1ol');
		expect(next.split('\n').filter(l => /^\s*[-*+]\s+\[[^\]]*\]\s*A\b/.test(l)).length).toBe(1);
	});

	it('BUG-CONFIRM-REBIND-DUP: allowDisplaceLiveSameTitle Link-displaces live sibling (no insert)', async () => {
		const confirmId = '6ae82058d07c7a23f9eed592';
		const siblingId = '6ae82058d07c7a23f9eed586';
		const planned: PlannedDeletion[] = [
			{
				id: confirmId,
				taskId: confirmId,
				kind: 'task',
				direction: 'vault-to-ticktick',
				action: 'delete',
				file: '10 Projects/PKM - journaling.md',
				title: 'journaling',
			},
		];
		const files = new Map<string, string>([[
			'10 Projects/PKM - journaling.md',
			`# PKM\n\n## Active Zone\n- [ ] journaling #ticktick %%[ticktick_id:: ${siblingId}]%%\n`,
		]]);
		const result = await rebindVaultFromPlanned(
			planned,
			{
				loadLiveTask: async (taskId) => ({
					taskId,
					deleted: false,
					task: { id: taskId, projectId: 'p', title: 'journaling', content: '', items: [] },
				}),
				readFile: async (path) => files.get(path) ?? null,
				writeFile: async (path, text) => { files.set(path, text); },
				convertTaskToLine: async (task) =>
					`- [ ] ${task.title} #ticktick %%[ticktick_id:: ${task.id}]%%`,
			},
			{
				allLiveIds: new Set([confirmId, siblingId]),
				allowDisplaceLiveSameTitle: true,
			},
		);
		expect(result.rebound).toBe(1);
		expect(result.inserted).toBe(0);
		expect(result.displacedIds).toEqual([siblingId]);
		const next = files.get('10 Projects/PKM - journaling.md')!;
		expect(next).toContain(`ticktick_id:: ${confirmId}`);
		expect(next).not.toContain(siblingId);
		expect(next.split('\n').filter(l => /journaling/.test(l) && /^\s*[-*+]/.test(l)).length).toBe(1);
	});
});
