/**
 * Smoke tests for Abyss descriptions + comments ↔ TickTick `content` (not native TT Comments API).
 * Live matrix: SMOKE_TESTS.md § Abyss notes / COMMENT; spec: ABYSS_NOTES_ALIGNMENT.md §4.
 */
import { describe, expect, it, vi } from 'vitest';
import { abyssLinesToNote, noteToAbyssLines, mergeAbyssBlock, childIndent } from '@/abyssFormat';
import { TaskParser } from '@/taskParser';
import { getSettings } from '@/settings';

vi.mock('@/db/projects', () => ({ getAllProjects: vi.fn().mockResolvedValue([]) }));
vi.mock('@/utils/logger', () => ({ default: { debug: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn() } }));

const S = () => (getSettings as unknown as () => Record<string, unknown>)();

describe('notes smoke (NOTE-A*) — content field only', () => {
	it('NOTE-A1: Abyss comment lines → Comments: block in TT content', () => {
		const lines = ['\t- > описание', '\t- 2026-10-14 09:00: первый', '\t  продолжение'];
		expect(abyssLinesToNote(lines)).toBe(
			'описание\n\nComments:\n2026-10-14 09:00: первый\n  продолжение',
		);
	});

	it('NOTE-A2: TT content Comments: block → Abyss `- stamp:` lines (pull)', () => {
		const ind = childIndent(0, 'tab');
		const note = 'описание\n\nComments:\n2026-10-14 09:00: первый\n  продолжение';
		expect(noteToAbyssLines(note, ind)).toEqual([
			`${ind}- > описание`,
			`${ind}- 2026-10-14 09:00: первый`,
			`${ind}  продолжение`,
		]);
	});

	it('NOTE-A3: merge keeps local comment not yet on TickTick', () => {
		const base = 'Comments:\n2026-10-14 12:40: первый';
		const out = mergeAbyssBlock(
			'- [ ] T\n\t- 2026-10-14 12:40: первый',
			['\t- 2026-10-14 12:40: первый', '\t- 2026-10-14 12:58: пятый', '\t  продолжение'],
			base,
		);
		expect(out).toContain('12:58: пятый');
	});

	it('NOTE-A4: convertLineToTask pushes comment into content (syncNotes + Abyss)', async () => {
		Object.assign(S(), {
			noteDelimiter: '',
			fileLinksInTickTick: 'noLink',
			stopInjectingTickTickTag: true,
			abyssTasksFormat: true,
			syncNoteContextTags: false,
			syncAbyssCommentsViaApi: false,
			syncNotes: true,
			tagMappings: [],
		});
		const id = 'abcdefabcdefabcdefabcdef';
		const line = `- [ ] smoke comment #tts-test %%[ticktick_id:: ${id}]%%`;
		const parser = new TaskParser({} as unknown, {} as unknown);
		parser.plugin = {
			taskParser: parser,
			fileMetadataService: { getFilepathForTask: () => '00 Inbox/abyss-active.md' },
			dateMan: {
				parseDates: () => ({}),
				stripDatesFromLine: (s: string) => s,
				formatDateToISO: () => '',
				addDatesToLine: (s: string) => s,
			},
			app: { vault: { getName: () => 'V' } },
		} as unknown as typeof parser.plugin;
		const fm = {
			getTaskItems: () => [],
			getTaskRecord: () => ({
				task: line,
				parentId: '',
				taskLines: ['\t- 2026-10-19 18:00: vault comment'],
			}),
		};
		const task = await parser.convertLineToTask(line, 0, '00 Inbox/abyss-active.md', fm as never, null);
		expect(task.content).toBe('Comments:\n2026-10-19 18:00: vault comment');
		Object.assign(S(), { abyssTasksFormat: false, syncNotes: false });
	});

	it('NOTE-A5: convertTaskToLine pulls Comments: block under checkbox (Abyss)', async () => {
		Object.assign(S(), {
			noteDelimiter: '',
			fileLinksInTickTick: 'noLink',
			stopInjectingTickTickTag: true,
			abyssTasksFormat: true,
			syncNotes: true,
			abyssIndent: 'tab',
			tagMappings: [],
		});
		const id = 'abcdefabcdefabcdefabcdef';
		const parser = new TaskParser({} as unknown, {} as unknown);
		parser.plugin = {
			taskParser: parser,
			fileMetadataService: { getFilepathForTask: () => 'p.md' },
			dateMan: {
				parseDates: () => ({}),
				stripDatesFromLine: (s: string) => s,
				formatDateToISO: () => '',
				addDatesToLine: (s: string) => s,
			},
			app: { vault: { getName: () => 'V' } },
		} as unknown as typeof parser.plugin;
		const task = {
			id,
			title: 'smoke',
			content: 'Comments:\n2026-10-19 18:05: from ticktick',
			desc: '',
			status: 0,
			projectId: 'in',
			tags: [],
			items: [],
		};
		const line = await parser.convertTaskToLine(task as never, 0);
		expect(line).toMatch(/%%\[ticktick_id::/);
		expect(line.split('\n').some(l => l.includes('18:05: from ticktick'))).toBe(true);
		Object.assign(S(), { abyssTasksFormat: false, syncNotes: false });
	});
});
