import { describe, expect, it, vi } from 'vitest';
import { listForTags, tagForList, parseTagListText, isListTag } from '@/listMapping';
import { TaskParser } from '@/taskParser';
import { getSettings } from '@/settings';

const PROJECTS = [
	{ id: 'inbox1', name: 'Inbox' }, { id: 'na', name: 'nextAction' }, { id: 'wf', name: 'waitingFor' },
	{ id: 'sd', name: 'someDay' }, { id: 'pl', name: 'Planned' }, { id: 'kb', name: 'KB' },
];
vi.mock('@/db/projects', () => ({ getAllProjects: vi.fn().mockImplementation(async () => PROJECTS) }));
vi.mock('@/utils/logger', () => ({ default: { debug: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn() } }));

const MAP = parseTagListText('type/next = nextAction\n#type/waiting = waitingFor\ntype/someday = someDay\ntype/planned = Planned');

describe('tag -> list mapping', () => {
	it('pure helpers', () => {
		expect(listForTags(['context/work', 'type/waiting'], MAP, PROJECTS)).toBe('wf');
		expect(listForTags(['context/work'], MAP, PROJECTS)).toBeUndefined();
		expect(tagForList('sd', MAP, PROJECTS)).toBe('type/someday');
		expect(tagForList('kb', MAP, PROJECTS)).toBeUndefined();
		expect(isListTag('type-next', MAP)).toBe(true);
	});

	function mkParser(fileDefault: string) {
		const parser = new TaskParser({} as unknown, {} as unknown);
		parser.plugin = { taskParser: parser, fileMetadataService: { getFilepathForTask: () => 'p.md' },
			fileTaskQueries: { getDefaultProjectIdForFilepath: async () => fileDefault },
			dateMan: { parseDates: () => ({}), stripDatesFromLine: (s: string) => s, formatDateToISO: () => '', addDatesToLine: (s: string) => s },
			app: { vault: { getName: () => 'V' } } } as unknown as typeof parser.plugin;
		return parser;
	}

	it('push: tag beats file default, tag not sent; pull: list rewrites tag', async () => {
		const S = (getSettings as unknown as () => Record<string, unknown>)();
		Object.assign(S, { noteDelimiter: '', fileLinksInTickTick: 'noLink', stopInjectingTickTickTag: true,
			abyssTasksFormat: true, syncNoteContextTags: false, tagMappings: [], tagListMappings: MAP, syncNotes: false });
		const id = 'abcdefabcdefabcdefabcdef';
		const line = `- [ ] Позвонить #type/next #context/work %%[ticktick_id:: ${id}]%%`;
		const parser = mkParser('inbox1');
		const fm = { getTaskItems: () => [], getTaskRecord: () => ({ task: line, parentId: '', taskLines: [] }) };
		const task = await parser.convertLineToTask(line, 0, 'p.md', fm as never, null);
		expect(task.projectId).toBe('na');
		expect(task.tags).toEqual(['context-work']);
		// moved to waitingFor in TickTick
		const back = await parser.convertTaskToLine({ ...task, projectId: 'wf', items: [] }, 0);
		expect(back).toMatch(/#type\/waiting/);
		expect(back).not.toMatch(/type\/next/);
		// moved to a non-mapped list: type tag removed
		const kb = await parser.convertTaskToLine({ ...task, projectId: 'kb', items: [] }, 0);
		expect(kb).not.toMatch(/#type\//);
		Object.assign(S, { abyssTasksFormat: false, tagListMappings: [] });
	});

	it('#inbox does not jump to a list named Inbox when the mapping table omits it', async () => {
		const S = (getSettings as unknown as () => Record<string, unknown>)();
		Object.assign(S, { noteDelimiter: '', fileLinksInTickTick: 'noLink', stopInjectingTickTickTag: true,
			abyssTasksFormat: true, syncNoteContextTags: false, gtdStageVia: 'list', tagMappings: [], tagListMappings: MAP, syncNotes: false });
		const projects = [...PROJECTS, { id: 'real-inbox', name: 'Inbox' }, { id: 'tts', name: 'TTS-Inbox' }];
		const { getAllProjects } = await import('@/db/projects');
		vi.mocked(getAllProjects).mockResolvedValue(projects as never);
		const id = 'abcdefabcdefabcdefabcdef';
		const line = `- [ ] capture #inbox %%[ticktick_id:: ${id}]%%`;
		const parser = mkParser('tts');
		const fm = { getTaskItems: () => [], getTaskRecord: () => ({ task: line, parentId: '', taskLines: [] }) };
		const task = await parser.convertLineToTask(line, 0, 'p.md', fm as never, null);
		expect(task.projectId).toBe('tts');
		vi.mocked(getAllProjects).mockResolvedValue(PROJECTS as never);
		Object.assign(S, { abyssTasksFormat: false, tagListMappings: [] });
	});

	it('tag mode: stage stays a TickTick tag and rewrites both ways', async () => {
		const S = (getSettings as unknown as () => Record<string, unknown>)();
		Object.assign(S, { noteDelimiter: '', fileLinksInTickTick: 'noLink', stopInjectingTickTickTag: true,
			abyssTasksFormat: true, syncNoteContextTags: false, gtdStageVia: 'tag', tagMappings: [], tagListMappings: MAP, syncNotes: false });
		const id = 'abcdefabcdefabcdefabcdef';
		const line = `- [ ] Позвонить #type/next #context/work %%[ticktick_id:: ${id}]%%`;
		const parser = mkParser('inbox1');
		const fm = { getTaskItems: () => [], getTaskRecord: () => ({ task: line, parentId: '', taskLines: [] }) };
		const task = await parser.convertLineToTask(line, 0, 'p.md', fm as never, null);
		expect(task.projectId).toBe('inbox1');
		expect(task.tags).toContain('nextaction');
		expect(task.tags).not.toContain('type-next');
		const back = await parser.convertTaskToLine({ ...task, tags: ['waitingfor', 'context-work'], items: [] }, 0);
		expect(back).toMatch(/#type\/waiting/);
		expect(back).not.toMatch(/type\/next/);
		Object.assign(S, { abyssTasksFormat: false, gtdStageVia: 'list', tagListMappings: [] });
	});
});
