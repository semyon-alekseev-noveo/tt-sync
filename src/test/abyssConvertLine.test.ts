import { describe, expect, it, vi } from 'vitest';
import { TaskParser } from '@/taskParser';
import { DateMan } from '@/dateMan';
import { getSettings } from '@/settings';

vi.mock('@/db/projects', () => ({ getAllProjects: vi.fn().mockResolvedValue([]) }));
vi.mock('@/utils/logger', () => ({ default: { debug: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn() } }));

const S = () => (getSettings as unknown as () => Record<string, unknown>)();

describe('convertLineToTask with Abyss settings', () => {
	it('maps tags via table, ⏳ → startDate, Abyss note lines → content', async () => {
		Object.assign(S(), { noteDelimiter: '', fileLinksInTickTick: 'noLink', stopInjectingTickTickTag: true,
			abyssTasksFormat: true, scheduledAsStartDate: true, syncNotes: true,
			tagMappings: [{ obsidian: 'type/next', ticktick: 'next' }] });
		const id = 'abcdefabcdefabcdefabcdef';
		const line = `- [ ] Отчёт #type/next ⏳ 2026-10-15 📅 2026-10-20 #ticktick %%[ticktick_id:: ${id}]%%`;
		const parser = new TaskParser({} as unknown, {} as unknown);
		const dm = new DateMan();
		parser.plugin = { taskParser: parser, dateMan: dm,
			fileMetadataService: { getFilepathForTask: () => 'p.md' },
			app: { vault: { getName: () => 'V' } } } as unknown as typeof parser.plugin;
		const fileMap = { getTaskItems: () => [], getTaskRecord: () => ({ task: line, parentId: '',
			taskLines: ['\t- > описание', '\t- 2026-10-14 09:00: коммент'] }) } as unknown;
		const task = await parser.convertLineToTask(line, 0, 'p.md', fileMap as never, null);
		expect(task.tags).toEqual(['next']);
		expect(task.startDate?.slice(0, 10)).toBe(task.dateHolder?.scheduled_date?.isoDate?.slice(0, 10));
		expect(task.startDate).not.toBe(task.dueDate);
		expect(task.content).toBe('описание\n\nComments:\n2026-10-14 09:00: коммент');
		Object.assign(S(), { abyssTasksFormat: false, scheduledAsStartDate: false, tagMappings: [] });
	});
});
