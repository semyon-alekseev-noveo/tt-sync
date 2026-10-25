import { describe, expect, it } from 'vitest';
import { isBlankTitle } from '@/projectScheme';
import { TaskParser } from '@/taskParser';
import { listForTags, obsidianTagForStageTag, parseTagListText, tagForList, tickTickTagForStage } from '@/listMapping';
import { pushScopeAllows, tickTickTaskEntersVault } from '@/syncScope';

const LISTS = [
	{ id: 'in', name: 'TTS-Inbox' },
	{ id: 'na', name: 'TTS-nextAction' },
	{ id: 'wf', name: 'TTS-waitingFor' },
];
const MAP = parseTagListText('inbox = TTS-Inbox\ngtd/next = TTS-nextAction\ngtd/waiting = TTS-waitingFor');
const FOLDERS = ['00 Inbox/', '10 Projects/', '30 Tasks/'];

describe('settled sync logic', () => {
	const parser = new TaskParser({} as never, {} as never);

	it('LOGIC-1 wiki-link placeholder is not a checkbox', () => {
		expect(parser.isMarkdownTask('- [[]]')).toBe(false);
		expect(parser.isMarkdownTask('- [ ] call')).toBe(true);
		expect(parser.isMarkdownTask('- [/] call')).toBe(true);
	});

	it('LOGIC-2 a checkbox with no words is not pushed', () => {
		expect(isBlankTitle('')).toBe(true);
		expect(isBlankTitle('#inbox #obsidian')).toBe(true);
		expect(isBlankTitle('call #inbox')).toBe(false);
	});

	it('LOGIC-3 only the three pilot folders push', () => {
		expect(pushScopeAllows('00 Inbox/abyss-active.md', FOLDERS)).toBe(true);
		expect(pushScopeAllows('10 Projects/P.md', FOLDERS)).toBe(true);
		expect(pushScopeAllows('30 Tasks/a.md', FOLDERS)).toBe(true);
		expect(pushScopeAllows('40 KB/note.md', FOLDERS)).toBe(false);
	});

	it('LOGIC-4 TickTick → vault is list OR tts-test', () => {
		const opts = { allowedListIds: new Set(['in']), syncTag: 'tts-test' };
		expect(tickTickTaskEntersVault({ projectId: 'in', tags: ['obsidian'] }, opts)).toBe(true);
		expect(tickTickTaskEntersVault({ projectId: 'live', tags: ['tts-test'] }, opts)).toBe(true);
		expect(tickTickTaskEntersVault({ projectId: 'live', tags: ['obsidian'] }, opts)).toBe(false);
	});

	it('LOGIC-5 tag → list, both directions', () => {
		expect(listForTags(['inbox'], MAP, LISTS)).toBe('in');
		expect(listForTags(['gtd/next'], MAP, LISTS)).toBe('na');
		expect(tagForList('wf', MAP, LISTS)).toBe('gtd/waiting');
		expect(tagForList('in', MAP, LISTS)).toBe('inbox');
	});

	it('LOGIC-6 tag → tag, both directions, list unchanged by the helper', () => {
		const tags = parseTagListText('inbox = inbox\ngtd/next = gtd/next\ngtd/waiting = gtd/waiting');
		expect(tickTickTagForStage('gtd/next', tags)).toBe('gtd-next');
		expect(obsidianTagForStageTag('gtd-waiting', tags)).toBe('gtd/waiting');
		expect(listForTags(['gtd/next'], tags, LISTS)).toBeUndefined();
	});
});
