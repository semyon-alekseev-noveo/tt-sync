import { describe, it, expect } from 'vitest';
import { tagRenames, renameTagsInText } from '@/settingsMigration';

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
