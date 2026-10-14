import { describe, expect, it } from 'vitest';
import { isProjectNote, linkTarget, isDoneStatus, planProjects, renderProjectNote, activeZoneInsertLine, sanitizeTitle, fmTags } from '@/projectScheme';

describe('project scheme helpers', () => {
	it('detects project notes by tag + folder', () => {
		expect(isProjectNote('10 Projects/A.md', { tags: ['system/moc', 'system/project'] }, '10 Projects')).toBe(true);
		expect(isProjectNote('10 Projects/A.md', { tags: '#system/project' }, '10 Projects/')).toBe(true);
		expect(isProjectNote('40 KB/A.md', { tags: ['system/project'] }, '10 Projects')).toBe(false);
		expect(isProjectNote('10 Projects/A.md', { tags: ['system/moc'] }, '10 Projects')).toBe(false);
		expect(fmTags(undefined)).toEqual([]);
	});
	it('parses project links and statuses', () => {
		expect(linkTarget('[[10 Projects/Foo|Foo]]')).toBe('10 Projects/Foo');
		expect(linkTarget(['[[Foo]]'])).toBe('Foo');
		expect(linkTarget('')).toBeUndefined();
		expect(isDoneStatus('✅ Done')).toBe(true);
		expect(isDoneStatus('🟢 In Progress')).toBe(false);
		expect(sanitizeTitle('A/B [x.md](obsidian://open?x)')).toBe('A-B');
	});
	it('template has frontmatter, sections, note in Overview', () => {
		const t = renderProjectNote({ title: 'P', ticktickId: 'abc', note: 'hello', now: new Date(2026, 9, 14, 10, 5) });
		expect(t).toContain('id: "202610141005"');
		expect(t).toContain('status: 🟢 In Progress');
		expect(t).toContain('  - system/project');
		expect(t).toContain('ticktick_id: abc');
		expect(t).toMatch(/## Overview\nhello\n/);
		for (const h of ['## Основные разделы', '## Active Zone', '## Источники и связанные заметки', '> [!info] Metadata']) expect(t).toContain(h);
	});
	it('inserts at end of Active Zone', () => {
		const L = ['# P', '## Active Zone', '- [ ] a', '', '## Next', 'x'];
		expect(activeZoneInsertLine(L)).toBe(3);
		expect(activeZoneInsertLine(['## Active Zone', ''])).toBe(1);
		expect(activeZoneInsertLine(['# none'])).toBe(-1);
	});
	it('plans create/status actions', () => {
		const acts = planProjects(
			[{ path: 'a.md', title: 'A', done: false }, { path: 'b.md', title: 'B', id: 'b', done: true }, { path: 'c.md', title: 'C', id: 'c', done: false }],
			[{ id: 'b', title: 'B', done: false }, { id: 'c', title: 'C', done: true }, { id: 'n', title: 'New', done: false }, { id: 'old', title: 'Old', done: true }],
			{ b: { noteDone: false, ttDone: false }, c: { noteDone: false, ttDone: false } });
		expect(acts).toEqual([
			{ type: 'createParent', note: { path: 'a.md', title: 'A', done: false } },
			{ type: 'setParentDone', id: 'b', done: true },      // note changed
			{ type: 'setNoteDone', path: 'c.md', done: true },  // TickTick changed
			{ type: 'createNote', parent: { id: 'n', title: 'New', done: false } },
		]);
	});
});
