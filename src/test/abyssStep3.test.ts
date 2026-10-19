import { describe, expect, it, vi } from 'vitest';
import { abyssRegionEnd, abyssLinesToNote, classifyChildren, mergeAbyssBlock, noteToAbyssLines } from '@/abyssFormat';
import { restoreStatus, tagForStatusChar, checkboxChar, parseStatusMappingText, DEFAULT_STATUS_MAPPINGS } from '@/statusMapping';
import { projectIdForPath, pathForProjectId, parseProjectMappingText } from '@/projectMapping';
import { TaskParser } from '@/taskParser';
import { getSettings } from '@/settings';

vi.mock('@/db/projects', () => ({ getAllProjects: vi.fn().mockResolvedValue([]) }));
vi.mock('@/utils/logger', () => ({ default: { debug: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn() } }));

// Abyss appends comments/subtasks at the end, so descriptions & comments interleave with subtasks.
const FILE = [
	'# Клиент',
	'- [/] Отчёт #ticktick %%[ticktick_id:: 6700aaaabbbbccccdddd0001]%%',
	'\t- > описание 1',
	'\t- [ ] собрать данные',
	'\t\t- > описание подзадачи',
	'\t- 2026-10-14 09:12: первый коммент',
	'\t- [x] шаблон ✅ 2026-10-13',
	'\t- > описание 2',
	'\t- 2026-10-14 10:00: второй,',
	'\t  продолжение',
	'\t- [ ] пункт чек-листа %%aaaaaaaaaaaaaaaaaaaaaaaa%%',
	'\t- [ ] дочерняя TT задача %%[ticktick_id:: 6700aaaabbbbccccdddd0002]%%',
	'- [ ] next',
];

describe('Abyss child block anywhere', () => {
	const end = abyssRegionEnd(FILE, 1);
	const child = FILE.slice(2, end + 1);
	it('region stops before child TickTick task', () => expect(end).toBe(10));
	it('classifies, subtask children kept', () => {
		expect(classifyChildren(child)).toEqual(['desc', 'keep', 'keep', 'comment', 'keep', 'desc', 'comment', 'cont', 'item']);
	});
	const note = abyssLinesToNote(child);
	it('note collects all descriptions/comments', () => {
		expect(note).toBe('описание 1\nописание 2\n\nComments:\n2026-10-14 09:12: первый коммент\n2026-10-14 10:00: второй,\n  продолжение');
	});
	it('merge: canonical order, no loss, no duplicates', () => {
		const gen = ['- [/] Отчёт #ticktick %%[ticktick_id:: 6700aaaabbbbccccdddd0001]%%',
			...noteToAbyssLines(note, '\t'), '\t- [ ] пункт чек-листа %%aaaaaaaaaaaaaaaaaaaaaaaa%%'].join('\n');
		const merged = mergeAbyssBlock(gen, child).split('\n');
		expect(merged).toEqual([
			FILE[1], '\t- > описание 1', '\t- > описание 2', '\t- [ ] пункт чек-листа %%aaaaaaaaaaaaaaaaaaaaaaaa%%',
			'\t- [ ] собрать данные', '\t\t- > описание подзадачи', '\t- [x] шаблон ✅ 2026-10-13',
			'\t- 2026-10-14 09:12: первый коммент', '\t- 2026-10-14 10:00: второй,', '\t  продолжение']);
		expect(merged.length).toBe(child.length + 1);
		// idempotent: merging again gives same block
		expect(mergeAbyssBlock(merged.join('\n'), merged.slice(1)).split('\n')).toEqual(merged);
	});
	it('note edited in TickTick replaces descriptions only', () => {
		const gen = [FILE[1], ...noteToAbyssLines('новое', '\t')].join('\n');
		const merged = mergeAbyssBlock(gen, child).split('\n');
		expect(merged.filter(l => l.includes('- >') && !l.startsWith('\t\t'))).toEqual(['\t- > новое']);
		expect(merged).toContain('\t\t- > описание подзадачи');
		expect(merged.some(l => l.includes('коммент'))).toBe(false);
	});
});

describe('status mapping', () => {
	it('defaults and parsing', () => {
		expect(tagForStatusChar(checkboxChar('\t- [/] x'), DEFAULT_STATUS_MAPPINGS)).toBe('status/in-progress');
		expect(tagForStatusChar(' ', DEFAULT_STATUS_MAPPINGS)).toBeUndefined();
		expect(parseStatusMappingText('/ = status/doing\n? = #status/question')).toEqual(
			[{ char: '/', tag: 'status/doing' }, { char: '?', tag: 'status/question' }]);
	});
	it('restore from any TickTick spelling', () => {
		for (const t of ['status/in-progress', 'status-in-progress', 'in-progress', 'In-Progress'])
			expect(restoreStatus(0, [t, 'work'], DEFAULT_STATUS_MAPPINGS)).toEqual({ char: '/', tags: ['work'] });
		expect(restoreStatus(2, ['cancelled'], DEFAULT_STATUS_MAPPINGS)).toEqual({ char: 'x', tags: [] });
	});
	it('round-trip through TaskParser', async () => {
		const S = (getSettings as unknown as () => Record<string, unknown>)();
		Object.assign(S, { noteDelimiter: '', fileLinksInTickTick: 'noLink', stopInjectingTickTickTag: true,
			abyssTasksFormat: true, syncNoteContextTags: false, statusMappings: DEFAULT_STATUS_MAPPINGS, tagMappings: [], syncNotes: false });
		const id = 'abcdefabcdefabcdefabcdef';
		const line = `- [-] Старый план #work %%[ticktick_id:: ${id}]%%`;
		const parser = new TaskParser({} as unknown, {} as unknown);
		parser.plugin = { taskParser: parser, fileMetadataService: { getFilepathForTask: () => 'p.md' },
			dateMan: { parseDates: () => ({}), stripDatesFromLine: (s: string) => s, formatDateToISO: () => '', addDatesToLine: (s: string) => s },
			app: { vault: { getName: () => 'V' } } } as unknown as typeof parser.plugin;
		const fm = { getTaskItems: () => [], getTaskRecord: () => ({ task: line, parentId: '', taskLines: [] }) };
		const task = await parser.convertLineToTask(line, 0, 'p.md', fm as never, null);
		expect(task.status).toBe(0);
		expect(task.tags).toEqual(['work', 'status-cancelled']);
		expect(task.title.trim()).toBe('Старый план');
		const back = await parser.convertTaskToLine({ ...task, items: [] }, 0);
		expect(back.startsWith('- [-] Старый план')).toBe(true);
		expect(back).not.toMatch(/cancelled/);
		Object.assign(S, { abyssTasksFormat: false });
	});
});

describe('project mapping', () => {
	const projects = [{ id: 'p1', name: 'Клиент' }, { id: 'p2', name: 'Work' }];
	const map = parseProjectMappingText('projects/Клиент.md = Клиент\nprojects/ = p2');
	it('exact file beats folder prefix; name or id', () => {
		expect(projectIdForPath('projects/Клиент.md', map, projects)).toBe('p1');
		expect(projectIdForPath('projects/Other.md', map, projects)).toBe('p2');
		expect(projectIdForPath('Inbox.md', map, projects)).toBeUndefined();
	});
	it('reverse uses exact entries only', () => {
		expect(pathForProjectId('p1', map, projects)).toBe('projects/Клиент.md');
		expect(pathForProjectId('p2', map, projects)).toBeUndefined();
	});
});

describe('merge tidies whitespace', () => {
	it('strips trailing spaces and double space before item id', () => {
		const out = mergeAbyssBlock('- [ ] t\n\t- [ ] item  %%aaaaaaaaaaaaaaaaaaaaaaaa%%\n\t- comment ', []).split('\n');
		expect(out).toEqual(['- [ ] t', '\t- [ ] item %%aaaaaaaaaaaaaaaaaaaaaaaa%%', '\t- comment']);
	});
});
