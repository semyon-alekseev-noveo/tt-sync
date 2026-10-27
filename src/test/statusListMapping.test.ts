import { describe, expect, it, vi } from 'vitest';
import {
	listForStatusChar, charForList, parseStatusListText, isTerminalStatusChar,
	restoreStatusFromList, healStatusListMappings,
} from '@/statusListMapping';
import { stripAllStageTags, parseTagListText } from '@/listMapping';
import { TaskParser } from '@/taskParser';
import { getSettings } from '@/settings';

const PROJECTS = [
	{ id: 'inbox', name: 'TTS-Inbox' },
	{ id: 'wip', name: 'TTS-WIP' },
	{ id: 'na', name: 'TTS-nextAction' },
	{ id: 'wf', name: 'TTS-waitingFor' },
	{ id: 'pl', name: 'TTS-Planned' },
	{ id: 'sd', name: 'TTS-someDay' },
];

vi.mock('@/db/projects', () => ({ getAllProjects: vi.fn().mockImplementation(async () => PROJECTS) }));
vi.mock('@/utils/logger', () => ({ default: { debug: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn() } }));

const STATUS_MAP = parseStatusListText(
	'  = TTS-Inbox\n/ = TTS-WIP\n! = TTS-nextAction\n? = TTS-waitingFor\n= = TTS-Planned\n~ = TTS-someDay',
);
const TAG_MAP = parseTagListText(
	'gtd/next = TTS-nextAction\ngtd/waiting = TTS-waitingFor\ngtd/planned = TTS-Planned\ngtd/someday = TTS-someDay',
);

describe('UX-STATUS-MAP-1: symbol → list table', () => {
	it('maps owner table symbols to TTS lists', () => {
		expect(listForStatusChar(' ', STATUS_MAP, PROJECTS)).toBe('inbox');
		expect(listForStatusChar('/', STATUS_MAP, PROJECTS)).toBe('wip');
		expect(listForStatusChar('!', STATUS_MAP, PROJECTS)).toBe('na');
		expect(listForStatusChar('?', STATUS_MAP, PROJECTS)).toBe('wf');
		expect(listForStatusChar('=', STATUS_MAP, PROJECTS)).toBe('pl');
		expect(listForStatusChar('~', STATUS_MAP, PROJECTS)).toBe('sd');
	});

	it('UX-STATUS-MAP-4: terminal chars do not select a list', () => {
		expect(isTerminalStatusChar('x')).toBe(true);
		expect(isTerminalStatusChar('-')).toBe(true);
		expect(listForStatusChar('x', STATUS_MAP, PROJECTS)).toBeUndefined();
		expect(listForStatusChar('-', STATUS_MAP, PROJECTS)).toBeUndefined();
	});

	it('pull: list → checkbox char', () => {
		expect(charForList('na', STATUS_MAP, PROJECTS)).toBe('!');
		expect(charForList('wip', STATUS_MAP, PROJECTS)).toBe('/');
		expect(charForList('inbox', STATUS_MAP, PROJECTS)).toBe(' ');
		expect(restoreStatusFromList(2, [], 'na', STATUS_MAP, PROJECTS, () => false).char).toBe('x');
		expect(restoreStatusFromList(0, ['status/cancelled'], 'na', STATUS_MAP, PROJECTS,
			t => t.includes('cancelled')).char).toBe('-');
		expect(restoreStatusFromList(0, [], 'wf', STATUS_MAP, PROJECTS, () => false).char).toBe('?');
	});

	it('strips leftover #gtd stage tags when status is SoT', () => {
		const line = `- [!] next #obsidian #gtd/next #gtd/waiting %%[ticktick_id:: abcdefabcdefabcdefabcdef]%%`;
		const out = stripAllStageTags(line, TAG_MAP);
		expect(out).toMatch(/\[!\]/);
		expect(out).toMatch(/#obsidian/);
		expect(out).not.toMatch(/gtd\/next/);
		expect(out).not.toMatch(/gtd\/waiting/);
	});

	it('heals listId from name', () => {
		const raw = [{ char: '!', list: 'TTS-nextAction' }];
		const healed = healStatusListMappings(raw, PROJECTS)!;
		expect(healed[0].listId).toBe('na');
	});
});

describe('UX-STATUS-MAP push via convertLineToTask', () => {
	function mkParser(fileDefault: string, savedProjectId?: string) {
		const parser = new TaskParser({} as unknown, {} as unknown);
		parser.plugin = {
			taskParser: parser,
			fileMetadataService: { getFilepathForTask: () => 'p.md' },
			fileTaskQueries: { getDefaultProjectIdForFilepath: async () => fileDefault },
			taskRepository: {
				loadTaskById: async () => (savedProjectId ? { projectId: savedProjectId, parentId: '' } : null),
			},
			dateMan: {
				parseDates: () => ({}),
				stripDatesFromLine: (s: string) => s,
				formatDateToISO: () => '',
				addDatesToLine: (s: string) => s,
			},
			app: { vault: { getName: () => 'V' } },
		} as unknown as typeof parser.plugin;
		return parser;
	}

	it('UX-STATUS-MAP-1: [!] lands on TTS-nextAction without #gtd/next', async () => {
		const S = (getSettings as unknown as () => Record<string, unknown>)();
		Object.assign(S, {
			noteDelimiter: '', fileLinksInTickTick: 'noLink', stopInjectingTickTickTag: true,
			abyssTasksFormat: true, syncNoteContextTags: false, tagMappings: [],
			tagListMappings: TAG_MAP, statusListMappings: STATUS_MAP, syncNotes: false, gtdStageVia: 'list',
		});
		const id = 'abcdefabcdefabcdefabcdef';
		const line = `- [!] next action %%[ticktick_id:: ${id}]%%`;
		const parser = mkParser('inbox');
		const fm = { getTaskItems: () => [], getTaskRecord: () => ({ task: line, parentId: '', taskLines: [] }) };
		const task = await parser.convertLineToTask(line, 0, 'p.md', fm as never, null);
		expect(task.projectId).toBe('na');
		Object.assign(S, { abyssTasksFormat: false, tagListMappings: [], statusListMappings: [] });
	});

	it('UX-STATUS-MAP-2: [/] lands on TTS-WIP', async () => {
		const S = (getSettings as unknown as () => Record<string, unknown>)();
		Object.assign(S, {
			noteDelimiter: '', fileLinksInTickTick: 'noLink', stopInjectingTickTickTag: true,
			abyssTasksFormat: true, syncNoteContextTags: false, tagMappings: [],
			tagListMappings: TAG_MAP, statusListMappings: STATUS_MAP, syncNotes: false, gtdStageVia: 'list',
		});
		const id = 'abcdefabcdefabcdefabcdef';
		const line = `- [/] in progress %%[ticktick_id:: ${id}]%%`;
		const parser = mkParser('inbox');
		const fm = { getTaskItems: () => [], getTaskRecord: () => ({ task: line, parentId: '', taskLines: [] }) };
		const task = await parser.convertLineToTask(line, 0, 'p.md', fm as never, null);
		expect(task.projectId).toBe('wip');
		Object.assign(S, { abyssTasksFormat: false, tagListMappings: [], statusListMappings: [] });
	});

	it('UX-STATUS-MAP-3: #gtd/next with [ ] does not move to nextAction when status map active', async () => {
		const S = (getSettings as unknown as () => Record<string, unknown>)();
		Object.assign(S, {
			noteDelimiter: '', fileLinksInTickTick: 'noLink', stopInjectingTickTickTag: true,
			abyssTasksFormat: true, syncNoteContextTags: false, tagMappings: [],
			tagListMappings: TAG_MAP, statusListMappings: STATUS_MAP, syncNotes: false, gtdStageVia: 'list',
		});
		const id = 'abcdefabcdefabcdefabcdef';
		const line = `- [ ] still inbox #gtd/next %%[ticktick_id:: ${id}]%%`;
		const parser = mkParser('inbox', 'inbox');
		const fm = { getTaskItems: () => [], getTaskRecord: () => ({ task: line, parentId: '', taskLines: [] }) };
		const task = await parser.convertLineToTask(line, 0, 'p.md', fm as never, null);
		expect(task.projectId).toBe('inbox');
		expect((task as { __stripStageTagsRewrite?: boolean }).__stripStageTagsRewrite).toBe(true);
		Object.assign(S, { abyssTasksFormat: false, tagListMappings: [], statusListMappings: [] });
	});

	it('UX-STATUS-MAP-4: [-] keeps saved list', async () => {
		const S = (getSettings as unknown as () => Record<string, unknown>)();
		Object.assign(S, {
			noteDelimiter: '', fileLinksInTickTick: 'noLink', stopInjectingTickTickTag: true,
			abyssTasksFormat: true, syncNoteContextTags: false, tagMappings: [],
			tagListMappings: TAG_MAP, statusListMappings: STATUS_MAP,
			statusMappings: [{ char: '/', tag: 'status/in-progress' }, { char: '-', tag: 'status/cancelled' }],
			syncNotes: false, gtdStageVia: 'list',
		});
		const id = 'abcdefabcdefabcdefabcdef';
		const line = `- [-] cancelled %%[ticktick_id:: ${id}]%%`;
		const parser = mkParser('inbox', 'na');
		const fm = { getTaskItems: () => [], getTaskRecord: () => ({ task: line, parentId: '', taskLines: [] }) };
		const task = await parser.convertLineToTask(line, 0, 'p.md', fm as never, null);
		expect(task.projectId).toBe('na');
		expect(task.status).toBe(0);
		Object.assign(S, { abyssTasksFormat: false, tagListMappings: [], statusListMappings: [] });
	});

	it('UX-STATUS-MAP-PULL: TT list rewrite sets checkbox, not #gtd tag', async () => {
		const S = (getSettings as unknown as () => Record<string, unknown>)();
		Object.assign(S, {
			noteDelimiter: '', fileLinksInTickTick: 'noLink', stopInjectingTickTickTag: true,
			abyssTasksFormat: true, syncNoteContextTags: false, tagMappings: [],
			tagListMappings: TAG_MAP, statusListMappings: STATUS_MAP, syncNotes: false, gtdStageVia: 'list',
			defaultProjectId: 'inbox',
		});
		const parser = mkParser('inbox');
		const back = await parser.convertTaskToLine({
			id: 'abcdefabcdefabcdefabcdef',
			projectId: 'wf',
			title: 'waiting',
			content: '',
			desc: '',
			items: [],
			parentId: '',
			childIds: [],
			status: 0,
			tags: ['obsidian'],
		} as never, 0);
		expect(back).toMatch(/- \[\?\]/);
		expect(back).not.toMatch(/#gtd\//);
		Object.assign(S, { abyssTasksFormat: false, tagListMappings: [], statusListMappings: [], defaultProjectId: '' });
	});
});
