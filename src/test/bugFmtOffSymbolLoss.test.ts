/**
 * AF-FMT-OFF-SYMBOL-LOSS / BUG-TT-TAGFILTER-INBOX follow-up: #305
 * abyssTasksFormat OFF + statusListMappings set must not collapse checkbox
 * symbols on pull (lossless downgrade fix — R4).
 */
import { describe, expect, it, vi } from 'vitest';
import { TaskParser } from '@/taskParser';
import { getSettings } from '@/settings';
import { parseStatusListText } from '@/statusListMapping';

const PROJECTS = [
	{ id: 'inbox', name: 'TTS-Inbox' },
	{ id: 'wip', name: 'TTS-WIP' },
	{ id: 'na', name: 'TTS-nextAction' },
	{ id: 'wf', name: 'TTS-waitingFor' },
];

vi.mock('@/db/projects', () => ({ getAllProjects: vi.fn().mockResolvedValue([
	{ id: 'inbox', name: 'TTS-Inbox' },
	{ id: 'wip', name: 'TTS-WIP' },
	{ id: 'na', name: 'TTS-nextAction' },
	{ id: 'wf', name: 'TTS-waitingFor' },
]) }));
vi.mock('@/utils/logger', () => ({ default: { debug: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn() } }));

const STATUS_MAP = parseStatusListText('  = TTS-Inbox\n/ = TTS-WIP\n! = TTS-nextAction\n? = TTS-waitingFor\n~ = TTS-someDay');
const STATUS_MAPPINGS = [
	{ char: '/', tag: 'status/in-progress' },
	{ char: '-', tag: 'status/cancelled' },
];

function mkTask(overrides: Record<string, unknown> = {}): never {
	return {
		id: 'abcdefabcdefabcdefabcdef',
		projectId: 'na',
		childIds: [],
		parentId: '',
		sortOrder: 0,
		title: 'next action',
		desc: '',
		content: '',
		startDate: '',
		dueDate: '',
		isAllDay: true,
		reminder: '',
		reminders: [],
		repeatFlag: '',
		priority: 0,
		status: 0,
		items: [],
		progress: 0,
		modifiedTime: '',
		deleted: 0,
		tags: [],
		...overrides,
	} as never;
}

function mkParser(): TaskParser {
	const parser = new TaskParser({} as never, {} as never);
	parser.plugin = {
		taskParser: parser,
		dateMan: {
			addDatesToLine: (l: string) => l,
			stripDatesFromLine: (s: string) => s,
			formatDateToISO: () => '',
			addDatesToTask: () => undefined,
		},
		app: { vault: { getName: () => 'V' } },
	} as never;
	return parser;
}

function setSettings(patch: Record<string, unknown>): void {
	const S = (getSettings as unknown as () => Record<string, unknown>)();
	Object.assign(S, {
		noteDelimiter: '', fileLinksInTickTick: 'noLink', stopInjectingTickTickTag: true,
		taskLinksInTickTick: 'noLink', taskLinksInObsidian: 'noLink', abyssTasksFormat: false,
		syncNotes: false, abyssCommentsViaApi: false, scheduledAsStartDate: false,
		tagMappings: [], tagListMappings: [], statusListMappings: STATUS_MAP, statusMappings: STATUS_MAPPINGS,
		gtdStageVia: 'list', defaultProjectId: '', syncAbyssCommentsViaApi: false,
	});
	Object.assign(S, patch);
}

describe('AF-FMT-OFF-SYMBOL-LOSS (#305) — abyssTasksFormat OFF + statusListMappings', () => {
	it('restores the open checkbox char from the status→list map instead of collapsing to [ ]', async () => {
		setSettings({ abyssTasksFormat: false, statusListMappings: STATUS_MAP });
		const parser = mkParser();
		const task = mkTask({ projectId: 'na', status: 0, title: 'next action' });
		const line = await parser.convertTaskToLine(task, 0);
		expect(line).toContain('- [!] next action');
	});

	it('restores the completed char (x) for status > 0', async () => {
		setSettings({ abyssTasksFormat: false, statusListMappings: STATUS_MAP });
		const parser = mkParser();
		const task = mkTask({ projectId: 'na', status: 2, title: 'done action' });
		const line = await parser.convertTaskToLine(task, 0);
		expect(line).toContain('- [x] done action');
	});

	it('restores the cancelled char (-) from the cancelled status tag', async () => {
		setSettings({ abyssTasksFormat: false, statusListMappings: STATUS_MAP });
		const parser = mkParser();
		const task = mkTask({ projectId: 'na', status: 0, title: 'cancelled action', tags: ['status/cancelled'] });
		const line = await parser.convertTaskToLine(task, 0);
		expect(line).toContain('- [-] cancelled action');
	});

	it('falls back to the status tag when the list cannot be resolved', async () => {
		setSettings({ abyssTasksFormat: false, statusListMappings: STATUS_MAP });
		const parser = mkParser();
		const task = mkTask({ projectId: 'unknown-list', status: 0, title: 'tagged action', tags: ['status/in-progress'] });
		const line = await parser.convertTaskToLine(task, 0);
		expect(line).toContain('- [/] tagged action');
	});
});
