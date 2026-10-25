import { describe, expect, it, vi } from 'vitest';
import {
	listForTags, tagForList, parseTagListText, isListTag, pickLastStageTag, pickWinningStageTag,
	hasMultipleStageTags, stageNeedsPushDespiteHash, rewriteLineExclusiveStage,
} from '@/listMapping';
import { TaskParser } from '@/taskParser';
import { getSettings } from '@/settings';

const PROJECTS = [
	{ id: 'inbox1', name: 'Inbox' }, { id: 'na', name: 'nextAction' }, { id: 'wf', name: 'waitingFor' },
	{ id: 'sd', name: 'someDay' }, { id: 'pl', name: 'Planned' }, { id: 'kb', name: 'KB' },
];
vi.mock('@/db/projects', () => ({ getAllProjects: vi.fn().mockImplementation(async () => PROJECTS) }));
vi.mock('@/utils/logger', () => ({ default: { debug: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn() } }));

const MAP = parseTagListText('gtd/next = nextAction\n#gtd/waiting = waitingFor\ngtd/someday = someDay\ngtd/planned = Planned');

describe('tag -> list mapping', () => {
	it('pure helpers', () => {
		expect(listForTags(['context/work', 'gtd/waiting'], MAP, PROJECTS)).toBe('wf');
		expect(listForTags(['context/work'], MAP, PROJECTS)).toBeUndefined();
		expect(tagForList('sd', MAP, PROJECTS)).toBe('gtd/someday');
		expect(tagForList('kb', MAP, PROJECTS)).toBeUndefined();
		expect(isListTag('gtd-next', MAP)).toBe(true);
	});

	it('AF-GTD-TAG-ADD: stage that changes list wins (Abyss may sort tags)', () => {
		expect(pickLastStageTag(['gtd/next', 'gtd/waiting'], MAP)).toBe('gtd/waiting');
		// No current list → last on line
		expect(listForTags(['gtd/next', 'gtd/waiting'], MAP, PROJECTS)).toBe('wf');
		expect(listForTags(['gtd/waiting', 'gtd/next'], MAP, PROJECTS)).toBe('na');
		// On nextAction; Abyss sorted both tags so waiting is last — still move to waiting
		expect(pickWinningStageTag(['gtd/next', 'gtd/waiting'], MAP, PROJECTS, 'na')).toBe('gtd/waiting');
		expect(listForTags(['gtd/next', 'gtd/waiting'], MAP, PROJECTS, 'na')).toBe('wf');
		// On waitingFor; DnD added next but sort put next first — must not keep waiting
		expect(pickWinningStageTag(['gtd/next', 'gtd/waiting'], MAP, PROJECTS, 'wf')).toBe('gtd/next');
		expect(listForTags(['gtd/next', 'gtd/waiting'], MAP, PROJECTS, 'wf')).toBe('na');
		expect(hasMultipleStageTags(['gtd/next', 'gtd/waiting'], MAP)).toBe(true);
		expect(hasMultipleStageTags(['gtd/next', 'context/work'], MAP)).toBe(false);
		expect(stageNeedsPushDespiteHash(['gtd/next', 'gtd/waiting'], MAP, 'wf', 'na')).toBe(true);
		expect(stageNeedsPushDespiteHash(['gtd/next'], MAP, 'na', 'na')).toBe(false);
	});

	it('AF-GTD-TAG-ADD: surgical line rewrite keeps non-stage tags', () => {
		const line = `- [ ] stage-dnd #obsidian #gtd/next #context/work #gtd/waiting %%[ticktick_id:: abcdefabcdefabcdefabcdef]%%`;
		const out = rewriteLineExclusiveStage(line, MAP, 'gtd/waiting');
		expect(out).toMatch(/#gtd\/waiting/);
		expect(out).not.toMatch(/gtd\/next/);
		expect(out).toMatch(/#obsidian/);
		expect(out).toMatch(/#context\/work/);
		expect(out).toMatch(/ticktick_id:: abcdefabcdefabcdefabcdef/);
	});

	function mkParser(fileDefault: string, savedProjectId?: string) {
		const parser = new TaskParser({} as unknown, {} as unknown);
		parser.plugin = { taskParser: parser, fileMetadataService: { getFilepathForTask: () => 'p.md' },
			fileTaskQueries: { getDefaultProjectIdForFilepath: async () => fileDefault },
			taskRepository: {
				loadTaskById: async () => (savedProjectId ? { projectId: savedProjectId, parentId: '' } : null),
			},
			dateMan: { parseDates: () => ({}), stripDatesFromLine: (s: string) => s, formatDateToISO: () => '', addDatesToLine: (s: string) => s },
			app: { vault: { getName: () => 'V' } } } as unknown as typeof parser.plugin;
		return parser;
	}

	it('push: tag beats file default, tag not sent; pull: list rewrites tag', async () => {
		const S = (getSettings as unknown as () => Record<string, unknown>)();
		Object.assign(S, { noteDelimiter: '', fileLinksInTickTick: 'noLink', stopInjectingTickTickTag: true,
			abyssTasksFormat: true, syncNoteContextTags: false, tagMappings: [], tagListMappings: MAP, syncNotes: false });
		const id = 'abcdefabcdefabcdefabcdef';
		const line = `- [ ] Позвонить #gtd/next #context/work %%[ticktick_id:: ${id}]%%`;
		const parser = mkParser('inbox1');
		const fm = { getTaskItems: () => [], getTaskRecord: () => ({ task: line, parentId: '', taskLines: [] }) };
		const task = await parser.convertLineToTask(line, 0, 'p.md', fm as never, null);
		expect(task.projectId).toBe('na');
		expect(task.tags).toEqual(['context-work']);
		// moved to waitingFor in TickTick
		const back = await parser.convertTaskToLine({ ...task, projectId: 'wf', items: [] }, 0);
		expect(back).toMatch(/#gtd\/waiting/);
		expect(back).not.toMatch(/gtd\/next/);
		// moved to a non-mapped list: type tag removed
		const kb = await parser.convertTaskToLine({ ...task, projectId: 'kb', items: [] }, 0);
		expect(kb).not.toMatch(/#gtd\//);
		Object.assign(S, { abyssTasksFormat: false, tagListMappings: [] });
	});

	it('AF-GTD-TAG-ADD: dual stage tags → mover wins list + exclusive rewrite flag', async () => {
		const S = (getSettings as unknown as () => Record<string, unknown>)();
		Object.assign(S, { noteDelimiter: '', fileLinksInTickTick: 'noLink', stopInjectingTickTickTag: true,
			abyssTasksFormat: true, syncNoteContextTags: false, gtdStageVia: 'list', tagMappings: [], tagListMappings: MAP, syncNotes: false });
		const id = 'abcdefabcdefabcdefabcdef';
		// Abyss-sorted order: next before waiting; Dexie still on nextAction → waiting is the mover
		const line = `- [ ] stage-dnd #gtd/next #gtd/waiting %%[ticktick_id:: ${id}]%%`;
		const parser = mkParser('inbox1', 'na');
		const fm = { getTaskItems: () => [], getTaskRecord: () => ({ task: line, parentId: '', taskLines: [] }) };
		const task = await parser.convertLineToTask(line, 0, 'p.md', fm as never, null);
		expect(task.projectId).toBe('wf');
		expect((task as { __exclusiveStageRewrite?: boolean }).__exclusiveStageRewrite).toBe(true);
		expect((task as { __exclusiveStageWinner?: string }).__exclusiveStageWinner).toBe('gtd/waiting');
		const back = await parser.convertTaskToLine({ ...task, projectId: 'wf', items: [] }, 0);
		expect(back).toMatch(/#gtd\/waiting/);
		expect(back).not.toMatch(/gtd\/next/);
		// Reverse DnD: still on waitingFor; sorted line keeps waiting last — next must win
		const backToNext = `- [ ] stage-dnd #gtd/next #gtd/waiting %%[ticktick_id:: ${id}]%%`;
		const parser2 = mkParser('inbox1', 'wf');
		const task2 = await parser2.convertLineToTask(backToNext, 0, 'p.md', fm as never, null);
		expect(task2.projectId).toBe('na');
		expect((task2 as { __exclusiveStageWinner?: string }).__exclusiveStageWinner).toBe('gtd/next');
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
		const line = `- [ ] Позвонить #gtd/next #context/work %%[ticktick_id:: ${id}]%%`;
		const parser = mkParser('inbox1');
		const fm = { getTaskItems: () => [], getTaskRecord: () => ({ task: line, parentId: '', taskLines: [] }) };
		const task = await parser.convertLineToTask(line, 0, 'p.md', fm as never, null);
		expect(task.projectId).toBe('inbox1');
		expect(task.tags).toContain('nextaction');
		expect(task.tags).not.toContain('gtd-next');
		const back = await parser.convertTaskToLine({ ...task, tags: ['waitingfor', 'context-work'], items: [] }, 0);
		expect(back).toMatch(/#gtd\/waiting/);
		expect(back).not.toMatch(/gtd\/next/);
		Object.assign(S, { abyssTasksFormat: false, gtdStageVia: 'list', tagListMappings: [] });
	});
});
