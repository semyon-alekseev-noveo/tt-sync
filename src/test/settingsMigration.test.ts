import { describe, it, expect } from 'vitest';
import { tagRenames, renameTagsInText, migrateTypeStagePrefixToGtd, typeStageToGtd } from '@/settingsMigration';

describe('settings change migrates existing lines', () => {
	const prev = { tagListMappings: [{ tag: 'type/next', list: 'nextAction', listId: 'L1' }], statusMappings: [{ char: '/', tag: 'status/in-progress' }] };
	it('detects renamed tags per mapping row', () => {
		expect(tagRenames(prev, { tagListMappings: [{ tag: '#type/now', list: 'Next', listId: 'L1' }], statusMappings: [{ char: '/', tag: 'status/doing' }] }))
			.toEqual({ 'type/next': 'type/now', 'status/in-progress': 'status/doing' });
		expect(tagRenames(prev, prev)).toEqual({});
	});
	it('rewrites only synced lines outside code blocks, exact tag only', () => {
		const t = ['- [ ] a #type/next %%[ticktick_id:: ab]%%', '- [ ] b #type/next', '- [ ] c #type/nextweek %%[ticktick_id:: cd]%%', '```', '- [ ] d #type/next %%[ticktick_id:: ef]%%', '```'].join('\n');
		const out = renameTagsInText(t, { 'type/next': 'type/now' }).split('\n');
		expect(out[0]).toContain('#type/now'); expect(out[1]).toContain('#type/next');
		expect(out[2]).toContain('#type/nextweek'); expect(out[4]).toContain('#type/next ');
	});
});

describe('AF-GTD-PREFIX type→gtd', () => {
	it('maps type/leaf to gtd/leaf only', () => {
		expect(typeStageToGtd('type/next')).toBe('gtd/next');
		expect(typeStageToGtd('#type/waiting')).toBe('gtd/waiting');
		expect(typeStageToGtd('gtd/next')).toBeNull();
		expect(typeStageToGtd('context/work')).toBeNull();
		expect(typeStageToGtd('type')).toBeNull();
	});
	it('rewrites tagListMappings and tagMappings; builds renames for vault', () => {
		const mig = migrateTypeStagePrefixToGtd({
			tagListMappings: [
				{ tag: 'type/next', list: 'nextAction', listId: 'na' },
				{ tag: 'inbox', list: 'Inbox', listId: 'in' },
				{ tag: 'type/waiting', list: 'waitingFor', listId: 'wf' },
			],
			tagMappings: [{ obsidian: 'type/next', ticktick: 'next' }, { obsidian: 'context/work', ticktick: 'work' }],
		});
		expect(mig.changed).toBe(true);
		expect(mig.tagListMappings?.map(m => m.tag)).toEqual(['gtd/next', 'inbox', 'gtd/waiting']);
		expect(mig.tagMappings?.map(m => m.obsidian)).toEqual(['gtd/next', 'context/work']);
		expect(mig.renames).toEqual({ 'type/next': 'gtd/next', 'type/waiting': 'gtd/waiting' });
		const line = '- [ ] x #type/next #type/waiting %%[ticktick_id:: abcdefabcdefabcdefabcdef]%%';
		expect(renameTagsInText(line, mig.renames)).toContain('#gtd/next');
		expect(renameTagsInText(line, mig.renames)).toContain('#gtd/waiting');
		expect(renameTagsInText(line, mig.renames)).not.toMatch(/#type\//);
	});
	it('is a no-op when already gtd/', () => {
		expect(migrateTypeStagePrefixToGtd({
			tagListMappings: [{ tag: 'gtd/next', list: 'nextAction', listId: 'na' }],
		}).changed).toBe(false);
	});
});
