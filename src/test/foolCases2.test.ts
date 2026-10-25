import { describe, it, expect } from 'vitest';
import { abyssTagConflicts, flatTagName } from '@/taskParser';
import { dedupeTaskIds, stripTaskId } from '@/utils/vaultIdScan';
import { planTitle } from '@/projectScheme';
import { descendantsOf } from '@/detach';
import { mergeTask, conflictNote } from '@/merge3';

const smap = [{ char: '/', tag: 'status/in-progress' }, { char: '-', tag: 'status/cancelled' }];
const lmap = [{ tag: 'type/next', list: 'nextAction' }, { tag: 'type/waiting', list: 'waitingFor' }];

describe('fool cases 2', () => {
	it('reports losing status and extra type tags', () => {
		expect(abyssTagConflicts(['status/cancelled', 'x'], '/', smap, lmap)).toEqual(['status/cancelled']);
		expect(abyssTagConflicts(['status/in-progress'], '/', smap, lmap)).toEqual([]);
		expect(abyssTagConflicts(['type/next', 'type/waiting'], ' ', smap, lmap)).toEqual(['type/next']);
	});
	it('keeps the full tag path', () => {
		expect(flatTagName('foo/Bar')).toBe('foo-bar');
		expect(flatTagName('a/b/c')).toBe('a-b-c');
	});
	it('duplicated marker line: first kept, copy becomes new task', () => {
		const l = '- [ ] X  [link](https://ticktick.com/webapp/#p/p1/tasks/abc123) #ticktick %%[ticktick_id:: abc123]%%';
		expect(stripTaskId(l)).toBe('- [ ] X #ticktick');
		const r = dedupeTaskIds([{ path: 'a.md', text: `${l}\n${l}` }], () => undefined);
		expect(r).toHaveLength(1);
		expect(r[0].text.split('\n')).toEqual([l, '- [ ] X #ticktick']);
		const r2 = dedupeTaskIds([{ path: 'a.md', text: l }, { path: 'b.md', text: l }], () => 'b.md');
		expect(r2.map(c => c.path)).toEqual(['a.md']);
	});
	it('project rename direction', () => {
		expect(planTitle('B2', 'B', 'B')).toEqual({ to: 'tt', title: 'B2' });
		expect(planTitle('B', 'B3', 'B')).toEqual({ to: 'note', title: 'B3' });
		expect(planTitle('B', 'B', 'B')).toBeUndefined();
		expect(planTitle('B2', 'B', undefined)).toEqual({ to: 'tt', title: 'B2' });
	});
	it('descendants of a deleted parent', () => {
		const t = [{ id: 'a' }, { id: 'b', parentId: 'a' }, { id: 'c', parentId: 'b' }, { id: 'd' }];
		expect(descendantsOf(['a'], t).map(x => x.id)).toEqual(['b', 'c']);
	});
	it('three-way merge per field', () => {
		const base = { title: 'T', content: '', dueDate: '2026-10-20T00:00:00.000+0000', tags: ['a'] };
		const local = { title: 'T obs [f.md](obsidian://open?file=f.md)', content: '', dueDate: base.dueDate, tags: ['a'] };
		const remote = { title: 'T tt', content: 'note from tt', dueDate: '2026-10-25T00:00:00.000+0000', tags: ['a'] };
		const r = mergeTask(base, local, remote);
		expect(r.taken.sort()).toEqual(['content', 'dueDate']);
		expect(local.content).toBe('note from tt');
		expect(local.title).toContain('T obs');
		expect(r.conflicts).toEqual([{ field: 'title', remote: 'T tt' }]);
		expect(conflictNote(r.conflicts, new Date('2026-10-14T05:00:00Z'))).toContain('версия TickTick (title): T tt');
		const l2 = { title: 'T' }; expect(mergeTask({ title: 'T' }, l2, { title: 'T2' }).taken).toEqual(['title']);
		expect(l2.title).toBe('T2');
	});
});

import { childIdsInContent } from '@/detach';
it('subtree ids under a parent line', () => {
	const c = '- [ ] P %%[ticktick_id:: aa1]%%\n\t- [ ] C %%[ticktick_id:: bb2]%%\n\t\t- [ ] G %%[ticktick_id:: cc3]%%\n- [ ] N %%[ticktick_id:: dd4]%%';
	expect(childIdsInContent(c, 'aa1')).toEqual(['bb2', 'cc3']);
	expect(childIdsInContent(c, 'dd4')).toEqual([]);
});

import { mergeAbyssBlock } from '@/abyssFormat';
it('pull keeps local comments TickTick does not have yet', () => {
	const out = mergeAbyssBlock('- [ ] T\n\t- 2026-10-14 12:40: первый', ['\t- 2026-10-14 12:40: первый', '\t- 2026-10-14 12:58: пятый', '\t  продолжение'], 'Comments:\n2026-10-14 12:40: первый');
	expect(out.split('\n')).toEqual(['- [ ] T', '\t- 2026-10-14 12:40: первый', '\t- 2026-10-14 12:58: пятый', '\t  продолжение']);
});

import { fencedLines } from '@/utils/vaultIdScan';
it('code-block lines are excluded', () => {
	expect([...fencedLines(['a', '```', '- [ ] x #ticktick', '```', '- [ ] y', '~~~md', 'z', '~~~'])]).toEqual([1, 2, 3, 5, 6, 7]);
});

import { healTagListMappings, listForTags } from '@/listMapping';
it('list mapping survives a TickTick list rename', () => {
	const map = [{ tag: 'type/waiting', list: 'waitingFor' }];
	const learned = healTagListMappings(map, [{ id: 'w1', name: 'waitingFor' }])!;
	expect(learned[0].listId).toBe('w1');
	const renamed = [{ id: 'w1', name: 'Ждём' }];
	expect(listForTags(['type/waiting'], learned, renamed)).toBe('w1');
	expect(healTagListMappings(learned, renamed)![0].list).toBe('Ждём');
});
