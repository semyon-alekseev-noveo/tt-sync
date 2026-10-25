import { describe, it, expect } from 'vitest';
import { childBlocks, sortOrdersFromLines, reorderLinesBySortOrder } from '@/subtaskOrder';
const t = (tabs: number, n: string, id: string) => `${'\t'.repeat(tabs)}- [ ] ${n} %%[ticktick_id:: ${id}]%%`;
const doc = [t(0, 'P', 'a0'), t(1, 'S3', 'c3'), '\t\tnote', t(1, 'S1', 'c1'), t(2, 'G', 'e1'), t(1, 'S2', 'c2'), 'after'];

describe('subtask order', () => {
	it('finds direct children with their subtrees', () => {
		expect(childBlocks(doc).get('a0')!.map(b => [b.id, b.start, b.end])).toEqual([['c3', 1, 2], ['c1', 3, 4], ['c2', 5, 5]]);
	});
	it('Obsidian -> TickTick: line order becomes sortOrder', () => {
		const so = sortOrdersFromLines(['c3', 'c1', 'c2'], { c1: 1, c2: 2, c3: 3 });
		expect(so.c3 < so.c1 && so.c1 < so.c2).toBe(true);
		expect(sortOrdersFromLines(['c1', 'c2'], { c1: 1, c2: 2 })).toEqual({});
	});
	it('TickTick -> Obsidian: lines follow sortOrder, subtrees move along', () => {
		const out = reorderLinesBySortOrder(doc, { c1: 1, c2: 2, c3: 3 })!;
		expect(out).toEqual([doc[0], doc[3], doc[4], doc[5], doc[1], doc[2], 'after']);
		expect(reorderLinesBySortOrder(out, { c1: 1, c2: 2, c3: 3 })).toBeNull();
	});

	it('BUG-ACTIVEZONE-COMMENT-SHUFFLE: reorder keeps comment bullets with each sibling', () => {
		const lines = [
			t(0, 'P', 'a0'),
			t(1, 'A', 'aa'),
			'\t\t- comment A',
			t(1, 'B', 'bb'),
			'\t\t- comment B',
		];
		const out = reorderLinesBySortOrder(lines, { aa: 2, bb: 1 })!;
		expect(out).toEqual([
			lines[0],
			lines[3],
			lines[4],
			lines[1],
			lines[2],
		]);
		expect(out[2]).toMatch(/comment B/);
		expect(out[4]).toMatch(/comment A/);
	});
});
