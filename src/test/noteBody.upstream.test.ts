/**
 * NOTE-BODY — upstream delimiter note ↔ TickTick task body (`content`/`desc`).
 * Spec: docs/pilot/NOTE-BODY.md; catalog ABYSS_FIRST_CASES.md.
 * Distinct from Abyss Comments API (NOTE-L3b) and from `- >` Abyss description when abyssTasksFormat.
 */
import { describe, expect, it, vi, afterEach } from 'vitest';
import { TaskParser } from '@/taskParser';
import type { ITask } from '@/api/types/Task';
import { getSettings } from '@/settings';

vi.mock('@/db/projects', () => ({
	getAllProjects: vi.fn().mockResolvedValue([]),
}));

const DELIM = '-------------------------------------------------------------';
const ID = 'abcdefabcdefabcdefabcdef';

const S = () => (getSettings as unknown as () => Record<string, unknown>)();

function setUpstreamNotes() {
	Object.assign(S(), {
		syncNotes: true,
		noteDelimiter: DELIM,
		abyssTasksFormat: false,
		syncAbyssCommentsViaApi: true,
		fileLinksInTickTick: 'noLink',
		taskLinksInObsidian: 'taskLink',
		stopInjectingTickTickTag: true,
		tagMappings: [],
	});
}

function makePlugin(parser: TaskParser) {
	return {
		taskParser: parser,
		fileTaskQueries: {
			getDefaultProjectIdForFilepath: (_: string) => 'proj-1',
		},
		fileMetadataService: {
			getFilepathForTask: (_: string) => 'Inbox/note-body.md',
		},
		dateMan: {
			parseDates: (_: string) => ({}),
			stripDatesFromLine: (s: string) => s,
			formatDateToISO: (_: Date) => '2025-01-01T00:00:00.000Z',
			addDatesToLine: (s: string) => s,
		},
		app: { vault: { getName: () => 'TestVault' } },
	} as unknown;
}

describe('NOTE-BODY upstream delimiter note', () => {
	afterEach(() => {
		Object.assign(S(), {
			abyssTasksFormat: true,
			syncNotes: true,
			noteDelimiter: DELIM,
		});
	});

	it('NOTE-BODY-1: vault delimiter note → TT content (no checklist items)', async () => {
		setUpstreamNotes();
		const line = `- [ ] NOTE-BODY fixture #ticktick  %%[ticktick_id:: ${ID}]%%`;
		const parser = new TaskParser({} as unknown, {} as unknown);
		parser.plugin = makePlugin(parser);

		const fileMap = {
			getTaskItems: () => [],
			getTaskRecord: () => ({
				task: line,
				parentId: '',
				taskLines: [
					`  ${DELIM}`,
					'  Hello from vault note',
					'  second line',
					`  ${DELIM}`,
				],
			}),
		};

		const task = await parser.convertLineToTask(line, 0, 'Inbox/note-body.md', fileMap as never, null);

		expect(task.title).toContain('NOTE-BODY fixture');
		expect(task.content).toBe('Hello from vault note\nsecond line');
		expect(task.desc).toBe('');
	});

	it('NOTE-BODY-1b: vault delimiter note → TT desc when checklist items exist', async () => {
		setUpstreamNotes();
		const line = `- [ ] NOTE-BODY with items #ticktick  %%[ticktick_id:: ${ID}]%%`;
		const parser = new TaskParser({} as unknown, {} as unknown);
		parser.plugin = makePlugin(parser);

		const fileMap = {
			getTaskItems: () => ['\t- [ ] child %%111111111111111111111111%%'],
			getTaskRecord: () => ({
				task: line,
				parentId: '',
				taskLines: [
					`  ${DELIM}`,
					'  Note before items',
					`  ${DELIM}`,
				],
			}),
		};

		const task = await parser.convertLineToTask(line, 0, 'Inbox/note-body.md', fileMap as never, null);

		expect(task.desc).toBe('Note before items');
		expect(task.content).toBe('');
	});

	it('NOTE-BODY-2: TT content → vault delimiter note block (pull shape)', async () => {
		setUpstreamNotes();
		const parser = new TaskParser({} as unknown, {} as unknown);
		parser.plugin = makePlugin(parser);

		const remote = {
			id: ID,
			projectId: 'proj-1',
			title: 'NOTE-BODY fixture',
			status: 0,
			tags: [],
			priority: 0,
			content: 'Edited in TickTick body',
			desc: '',
			items: [],
		} as ITask;

		const line = await parser.convertTaskToLine(remote, 0);

		expect(line).toContain('NOTE-BODY fixture');
		expect(line).toContain(DELIM);
		expect(line).toContain('Edited in TickTick body');
		// Abyss comment stamps are not invented from body text
		expect(line).not.toMatch(/- \d{4}-\d{2}-\d{2} /);
	});

	it('NOTE-BODY-3: Abyss comment bullets stay out of content when Comments API is on (abyss format)', async () => {
		Object.assign(S(), {
			syncNotes: true,
			abyssTasksFormat: true,
			syncAbyssCommentsViaApi: true,
			fileLinksInTickTick: 'noLink',
			noteDelimiter: '',
			stopInjectingTickTickTag: true,
			tagMappings: [],
		});
		const line = `- [ ] mix #ticktick  %%[ticktick_id:: ${ID}]%%`;
		const parser = new TaskParser({} as unknown, {} as unknown);
		parser.plugin = makePlugin(parser);
		const fileMap = {
			getTaskItems: () => [],
			getTaskRecord: () => ({
				task: line,
				parentId: '',
				taskLines: [
					'\t- > short desc',
					'\t- 2026-10-26 12:00: abyss chatter',
				],
			}),
		};
		const task = await parser.convertLineToTask(line, 0, 'Inbox/note-body.md', fileMap as never, null);
		expect(task.content).toBe('short desc');
		expect(task.content).not.toContain('abyss chatter');
		expect(task.content).not.toContain('Comments:');
	});
});
