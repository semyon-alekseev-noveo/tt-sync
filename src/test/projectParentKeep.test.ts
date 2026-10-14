import { describe, expect, it, vi } from 'vitest';
import { TaskParser } from '@/taskParser';
import { getSettings } from '@/settings';

vi.mock('@/db/projects', () => ({ getAllProjects: vi.fn().mockResolvedValue([{ id: 'na', name: 'nextAction' }, { id: 'pr', name: 'Projects' }]) }));
vi.mock('@/utils/logger', () => ({ default: { debug: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn() } }));

function mk(resolve: unknown, cached: unknown) {
	const p = new TaskParser({} as unknown, {} as unknown);
	p.plugin = { taskParser: p, fileMetadataService: { getFilepathForTask: () => 'x.md' },
		fileTaskQueries: { getDefaultProjectIdForFilepath: async () => 'inbox' },
		taskRepository: { loadTaskById: async () => cached },
		projectScheme: { enabled: () => true, resolveForFile: () => resolve, isParentId: (id: string) => id === 'PARENT' },
		dateMan: { parseDates: () => ({}), stripDatesFromLine: (s: string) => s, formatDateToISO: () => '', addDatesToLine: (s: string) => s },
		app: { vault: { getName: () => 'V' } } } as unknown as typeof p.plugin;
	return p;
}
const ID = 'abcdefabcdefabcdefabcdef';
const LINE = `- [ ] step #type/next #ticktick %%[ticktick_id:: ${ID}]%%`;
const fm = { getTaskItems: () => [], getTaskRecord: () => ({ task: LINE, parentId: '', taskLines: [] }) };

describe('project subtasks', () => {
	Object.assign((getSettings as unknown as () => Record<string, unknown>)(), { noteDelimiter: '', fileLinksInTickTick: 'noLink',
		stopInjectingTickTickTag: true, abyssTasksFormat: true, syncNotes: false, tagMappings: [],
		tagListMappings: [{ tag: 'type/next', list: 'nextAction' }] });
	it('task in project note: parent + Projects list, type tag kept as tag', async () => {
		const t = await mk({ parentId: 'PARENT', listId: 'pr' }, undefined).convertLineToTask(LINE, 0, 'p.md', fm as never, null);
		expect([t.parentId, t.projectId, t.tags]).toEqual(['PARENT', 'pr', ['type-next']]);
	});
	it('line moved to a non-project file keeps its project parent', async () => {
		const t = await mk(undefined, { parentId: 'PARENT', projectId: 'pr' }).convertLineToTask(LINE, 0, 'inbox.md', fm as never, null);
		expect([t.parentId, t.projectId]).toEqual(['PARENT', 'pr']);
	});
	it('non-project task: tag decides list', async () => {
		const t = await mk(undefined, { parentId: '' }).convertLineToTask(LINE, 0, 'inbox.md', fm as never, null);
		expect([t.parentId, t.projectId]).toEqual(['', 'na']);
	});
});
