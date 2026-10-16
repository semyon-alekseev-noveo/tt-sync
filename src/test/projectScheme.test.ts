import { describe, expect, it } from 'vitest';
import { isProjectNote, isListRoot, isSchemeParentTask, isProjectParentDuplicateLine, linkTarget, isDoneStatus, planProjects, renderProjectNote, renderProjectTemplate, activeZoneInsertLine, sanitizeTitle, stripActiveZonePlaceholders, stripProjectParentDuplicateLines, fmTags } from '@/projectScheme';

describe('project scheme helpers', () => {
	it('detects duplicate parent checkbox lines (P6)', () => {
		const fm = { tags: ['system/project'], ticktick_id: 'parent1' };
		expect(isProjectParentDuplicateLine('10 Projects/P.md', fm, '10 Projects', 'parent1')).toBe(true);
		expect(isProjectParentDuplicateLine('10 Projects/P.md', fm, '10 Projects', 'child1')).toBe(false);
		const lines = [
			'## Active Zone',
			'- [ ] parent dup %%[ticktick_id:: parent1]%%',
			'- [ ] real child %%[ticktick_id:: child1]%%',
		];
		const out = stripProjectParentDuplicateLines(lines, 'parent1', l => /^- \[[ x]\]/.test(l), l => l.match(/ticktick_id:: (\w+)/)?.[1] ?? null);
		expect(out).toHaveLength(2);
		expect(out[1]).toContain('child1');
	});

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
		expect(t).toContain('  - ticktick');
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
	it('treats every root task in the Projects list as a project', () => {
		expect(isListRoot({ projectId: 'P', parentId: '' }, 'P')).toBe(true);
		expect(isListRoot({ projectId: 'P', parentId: null }, 'P')).toBe(true);
		expect(isListRoot({ projectId: 'P', parentId: 'parent' }, 'P')).toBe(false);
		expect(isListRoot({ projectId: 'other', parentId: '' }, 'P')).toBe(false);
		expect(isListRoot({ projectId: 'P' }, '')).toBe(false);
	});

	it('scheme parent requires list root + sync limits', () => {
		const limit = { allowedListIds: new Set(['P']), syncTag: 'tts-test' };
		const root = { projectId: 'P', parentId: '', tags: ['tts-test'] };
		expect(isSchemeParentTask(root, 'P', limit)).toBe(true);
		expect(isSchemeParentTask({ ...root, tags: ['work'] }, 'P', limit)).toBe(false);
		expect(isSchemeParentTask({ ...root, projectId: 'other' }, 'P', limit)).toBe(false);
	});

	it('strips placeholder Active Zone checkboxes from templates', () => {
		const lines = ['## Active Zone', '- [ ] 1', '- [ ] 2', '- [ ] a real task', '## Next'];
		expect(stripActiveZonePlaceholders(lines)).toEqual(['## Active Zone', '- [ ] a real task', '## Next']);
		const out = renderProjectTemplate('---\ntags:\n  - system/project\n---\n## Active Zone\n- [ ] 1\n- [ ] 2\n', {
			title: 'P', ticktickId: 'x', now: new Date(2026, 0, 1),
		});
		expect(out).not.toMatch(/- \[ \] 1/);
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

describe('project note from user template (no Templater)', () => {
	const MOC = [
		'<%*',
		'let newTitle = await tp.system.prompt("Enter MOC title");',
		'let chosenMocKind = await tp.system.suggester(["a"], ["a"]);',
		'let id = tp.date.now("YYYYMMDDHHmm");',
		'let status = "🟢 In Progress";',
		'-%>',
		'---',
		'id: <% id %>',
		'created: <% tp.file.creation_date("YYYY-MM-DD") %>',
		'status: <% status %>',
		'areas: [[<% chosenArea %>]]',
		'tags:',
		'  - system/moc',
		'<%* if (chosenTopic) { %>  - topic/<% chosenTopic.toLowerCase() %><%* } %>',
		'<%* if (chosenMocKind === "project MOC") { %>  - system/project<%* } %>',
		'---',
		'',
		'> Тип: <% chosenMocKind %>',
		'',
		'## Overview',
		'',
		'- Цель',
		'<%* if (chosenMocKind === "project MOC") { %>',
		'- Временные рамки',
		'<%* } %>',
		'',
		'## Основные разделы',
	].join('\n');
	const o = { title: 'My Project', ticktickId: 'tt123', note: 'from TickTick', now: new Date(2026, 9, 14, 10, 5) };

	it('strips Templater blocks and prompts, fills id/date/status', () => {
		const out = renderProjectTemplate(MOC, o);
		expect(out.startsWith('---\n')).toBe(true);
		expect(out).not.toContain('<%');
		expect(out).not.toContain('tp.');
		expect(out).toContain('id: 202610141005');
		expect(out).toContain('created: 2026-10-14');
		expect(out).toContain('status: 🟢 In Progress');
		expect(out).not.toContain('Временные рамки'); // conditional block skipped
	});

	it('forces a valid project note: tags, ticktick_id, Active Zone, TickTick note in Overview', () => {
		const out = renderProjectTemplate(MOC, o);
		expect(fmTags(fmOf(out))).toEqual(expect.arrayContaining(['system/moc', 'system/project', 'ticktick']));
		expect(out).toMatch(/^ticktick_id: tt123$/m);
		expect(out).toMatch(/## Overview\nfrom TickTick\n/);
		expect(out).toContain('## Active Zone');
		expect(activeZoneInsertLine(out.split('\n'))).toBeGreaterThan(0);
	});

	it('fills {{title}} / {{ticktick_id}} and repairs a template without frontmatter', () => {
		const out = renderProjectTemplate('# {{title}}\n\nref {{ticktick_id}}\n', o);
		expect(out).toContain('# My Project');
		expect(out).toContain('ref tt123');
		expect(out.startsWith('---\n')).toBe(true);
		expect(out).toMatch(/^ticktick_id: tt123$/m);
		expect(out).toContain('  - system/project');
	});

	it('marks a done project done, keeps an existing status otherwise', () => {
		expect(renderProjectTemplate('---\nstatus: Later\n---\n# x', { ...o, done: true })).toContain('status: ✅ Done');
		expect(renderProjectTemplate('---\nstatus: Later\n---\n# x', o)).toContain('status: Later');
		expect(renderProjectTemplate('---\ntags: [a, b]\n---\n# x', o)).toMatch(/tags:\n {2}- a\n {2}- b\n {2}- system\/project\n {2}- ticktick/);
	});

	it('an empty template still yields a project note', () => {
		const out = renderProjectTemplate('', o);
		expect(isProjectNote('10 Projects/x.md', fmOf(out), '10 Projects')).toBe(true);
		expect(out).toContain('# My Project');
	});
});

/** tiny frontmatter reader for assertions: `key:` lists / scalars only */
function fmOf(text: string): Record<string, unknown> {
	const m = text.match(/^---\n([\s\S]*?)\n---/);
	const out: Record<string, unknown> = {};
	let key = '';
	for (const l of (m?.[1] ?? '').split('\n')) {
		const item = l.match(/^\s+-\s+(.*)$/);
		if (item && key) (out[key] as string[]).push(item[1].trim());
		else { const kv = l.match(/^([\w-]+):\s*(.*)$/); if (kv) { key = kv[1]; out[key] = kv[2] ? kv[2] : []; } }
	}
	return out;
}
