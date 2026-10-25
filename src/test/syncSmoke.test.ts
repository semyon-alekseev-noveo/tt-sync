import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TaskParser } from '@/taskParser';
import { getSettings } from '@/settings';
import { parseTagListText, listForTags, tagForList, tagsForCurrentList } from '@/listMapping';
import {
	allowVaultUpdate,
	fileForNewTickTickTask,
	listMoveSource,
	tickTickTaskEntersVault,
} from '@/syncScope';
import { isUnfinishedCapture } from '@/projectScheme';
import { VaultSyncCoordinator } from '@/services/VaultSyncCoordinator';

const PILOT_LISTS = [
	{ id: 'in', name: 'TTS-Inbox' },
	{ id: 'na', name: 'TTS-nextAction' },
	{ id: 'wf', name: 'TTS-waitingFor' },
];
const PILOT_MAP = parseTagListText(
	'inbox = TTS-Inbox\ngtd/next = TTS-nextAction\ngtd/waiting = TTS-waitingFor',
);

const PROJECTS = [
	...PILOT_LISTS,
	{ id: 'inbox1', name: 'Inbox' },
	{ id: 'real-inbox', name: 'Inbox' },
];
vi.mock('@/db/projects', () => ({ getAllProjects: vi.fn().mockImplementation(async () => PROJECTS) }));
vi.mock('@/utils/logger', () => ({ default: { debug: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn() } }));

function mkParser(fileDefault: string) {
	const parser = new TaskParser({} as unknown, {} as unknown);
	parser.plugin = {
		taskParser: parser,
		fileMetadataService: { getFilepathForTask: () => 'p.md' },
		fileTaskQueries: { getDefaultProjectIdForFilepath: async () => fileDefault },
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

describe('bidirectional sync smoke (SYNC-*)', () => {
	const pullOpts = { allowedListIds: new Set(['in']), syncTag: 'tts-test' };

	it('SYNC-1 TT-Inbox birth → Abyss capture note', () => {
		expect(
			fileForNewTickTickTask('in', 'in', '00 Inbox/abyss-active.md', '30 Tasks/TickTick/TTS-Inbox.md'),
		).toBe('00 Inbox/abyss-active.md');
	});

	it('SYNC-2 TT birth on another pilot list → mirror list file', () => {
		expect(
			fileForNewTickTickTask('na', 'in', '00 Inbox/abyss-active.md', '30 Tasks/TickTick/TTS-nextAction.md'),
		).toBe('30 Tasks/TickTick/TTS-nextAction.md');
	});

	it('SYNC-3 TT → vault: allow-listed list OR sync tag', () => {
		expect(tickTickTaskEntersVault({ projectId: 'in', tags: ['obsidian'] }, pullOpts)).toBe(true);
		expect(tickTickTaskEntersVault({ projectId: 'live', tags: ['tts-test'] }, pullOpts)).toBe(true);
		expect(tickTickTaskEntersVault({ projectId: 'live', tags: ['obsidian'] }, pullOpts)).toBe(false);
		expect(allowVaultUpdate({ projectId: 'in', tags: ['obsidian'] }, false, pullOpts)).toBe(true);
	});

	it('SYNC-4 stale #inbox tag stripped when task sits on a non-inbox list', () => {
		expect(
			tagsForCurrentList(['inbox', 'obsidian'], 'na', PILOT_MAP, { defaultProjectId: 'in', via: 'list' }),
		).toEqual(['obsidian']);
		expect(
			tagsForCurrentList(['inbox', 'obsidian'], 'in', PILOT_MAP, { defaultProjectId: 'in', via: 'list' }),
		).toEqual(['inbox', 'obsidian']);
	});

	it('SYNC-5 list move detection when local DB lags remote', () => {
		expect(listMoveSource('in', 'na', 'na')).toBe('in');
		expect(listMoveSource('na', 'in', 'na')).toBeUndefined();
		expect(listMoveSource(undefined, 'in', 'na')).toBe('in');
	});

	it('SYNC-6 Obs #gtd/next pushes to TTS-nextAction (stage tag not sent as TT tag)', async () => {
		const S = (getSettings as unknown as () => Record<string, unknown>)();
		Object.assign(S, {
			noteDelimiter: '',
			fileLinksInTickTick: 'noLink',
			stopInjectingTickTickTag: true,
			abyssTasksFormat: true,
			gtdStageVia: 'list',
			tagMappings: [],
			tagListMappings: PILOT_MAP,
			syncNotes: false,
		});
		const id = 'abcdefabcdefabcdefabcdef';
		const line = `- [ ] next step #gtd/next %%[ticktick_id:: ${id}]%%`;
		const parser = mkParser('in');
		const fm = {
			getTaskItems: () => [],
			getTaskRecord: () => ({ task: line, parentId: '', taskLines: [] }),
		};
		const task = await parser.convertLineToTask(line, 0, '00 Inbox/abyss-active.md', fm as never, null);
		expect(task.projectId).toBe('na');
		expect(task.tags).not.toContain('gtd-next');
		Object.assign(S, { abyssTasksFormat: false, tagListMappings: [] });
	});

	it('SYNC-7 TT list move rewrites Obs stage tag on the line', async () => {
		const S = (getSettings as unknown as () => Record<string, unknown>)();
		Object.assign(S, {
			noteDelimiter: '',
			fileLinksInTickTick: 'noLink',
			stopInjectingTickTickTag: true,
			abyssTasksFormat: true,
			gtdStageVia: 'list',
			tagMappings: [],
			tagListMappings: PILOT_MAP,
			syncNotes: false,
		});
		const id = 'abcdefabcdefabcdefabcdef';
		const line = `- [ ] call #inbox %%[ticktick_id:: ${id}]%%`;
		const parser = mkParser('in');
		const fm = {
			getTaskItems: () => [],
			getTaskRecord: () => ({ task: line, parentId: '', taskLines: [] }),
		};
		const task = await parser.convertLineToTask(line, 0, '00 Inbox/abyss-active.md', fm as never, null);
		const moved = await parser.convertTaskToLine({ ...task, projectId: 'na', items: [] }, 0);
		expect(moved).toMatch(/#gtd\/next/);
		expect(moved).not.toMatch(/#inbox/);
		Object.assign(S, { abyssTasksFormat: false, tagListMappings: [] });
	});

	it('SYNC-8 #inbox on TTS-Inbox file default does not route to live Inbox list', async () => {
		const S = (getSettings as unknown as () => Record<string, unknown>)();
		const mapNoInboxRow = parseTagListText('gtd/next = TTS-nextAction\ngtd/waiting = TTS-waitingFor');
		Object.assign(S, {
			noteDelimiter: '',
			fileLinksInTickTick: 'noLink',
			stopInjectingTickTickTag: true,
			abyssTasksFormat: true,
			gtdStageVia: 'list',
			tagMappings: [],
			tagListMappings: mapNoInboxRow,
			syncNotes: false,
		});
		const { getAllProjects } = await import('@/db/projects');
		vi.mocked(getAllProjects).mockResolvedValue(PROJECTS as never);
		const id = 'abcdefabcdefabcdefabcdef';
		const line = `- [ ] capture #inbox %%[ticktick_id:: ${id}]%%`;
		const parser = mkParser('in');
		const fm = {
			getTaskItems: () => [],
			getTaskRecord: () => ({ task: line, parentId: '', taskLines: [] }),
		};
		const task = await parser.convertLineToTask(line, 0, 'p.md', fm as never, null);
		expect(task.projectId).toBe('in');
		vi.mocked(getAllProjects).mockResolvedValue(PROJECTS as never);
		Object.assign(S, { abyssTasksFormat: false, tagListMappings: [] });
	});

	it('SYNC-9 partial lines (`%%`) are not treated as ready to push', () => {
		expect(isUnfinishedCapture('%%', '- [ ] %%')).toBe(true);
		expect(isUnfinishedCapture('call', '- [ ] call')).toBe(false);
	});

	it('SYNC-10 tag → list helpers match pilot mapping table', () => {
		expect(listForTags(['inbox'], PILOT_MAP, PILOT_LISTS)).toBe('in');
		expect(listForTags(['gtd/next'], PILOT_MAP, PILOT_LISTS)).toBe('na');
		expect(tagForList('na', PILOT_MAP, PILOT_LISTS)).toBe('gtd/next');
		expect(tagForList('in', PILOT_MAP, PILOT_LISTS)).toBe('inbox');
	});

	it('SYNC-12 Abyss context tags on push when syncNoteContextTags is on', async () => {
		const S = (getSettings as unknown as () => Record<string, unknown>)();
		Object.assign(S, {
			noteDelimiter: '',
			fileLinksInTickTick: 'noLink',
			stopInjectingTickTickTag: true,
			abyssTasksFormat: true,
			syncNoteContextTags: true,
			gtdStageVia: 'list',
			tagMappings: [],
			tagListMappings: PILOT_MAP,
			syncNotes: false,
		});
		const id = 'abcdefabcdefabcdefabcdef';
		const line = `- [ ] log task #tts-test %%[ticktick_id:: ${id}]%%`;
		const parser = mkParser('in');
		const parentId = '6ad1dc711befa8582aceadd7';
		parser.plugin.projectScheme = {
			isParentId: (pid: string) => pid === parentId,
			noteForParent: (pid: string) =>
				pid === parentId ? '10 Projects/TTS-PILOT- Phase C test.md' : undefined,
		};
		parser.plugin.taskRepository = {
			loadTaskById: async () => ({ projectId: 'proj', title: 'parent' }),
		};
		const fm = {
			getTaskItems: () => [],
			getTaskRecord: () => ({ task: line, parentId, taskLines: [] }),
		};
		const task = await parser.convertLineToTask(
			line,
			0,
			'40 KB/46 Logs/log-202601271650.md',
			fm as never,
			null,
		);
		expect(task.tags).toContain('note/log-202601271650');
		expect(task.tags).toContain('proj/tts-pilot-phase-c-test');
		Object.assign(S, { syncNoteContextTags: false, abyssTasksFormat: false, tagListMappings: [] });
	});
});

describe('SYNC-11 Abyss capture path resolution', () => {
	let coordinator: VaultSyncCoordinator;

	beforeEach(() => {
		coordinator = new VaultSyncCoordinator({} as never, {} as never, undefined);
	});

	it('uses Abyss taskFilePath when data.json is readable', async () => {
		const read = vi.fn().mockResolvedValue(JSON.stringify({ taskFilePath: '00 Inbox/custom-capture.md' }));
		(coordinator as unknown as { app: { vault: { adapter: { read: typeof read } } } }).app = {
			vault: { adapter: { read } },
		};
		const path = await (coordinator as unknown as { abyssCaptureFile(): Promise<string> }).abyssCaptureFile();
		expect(path).toBe('00 Inbox/custom-capture.md');
	});

	it('falls back to abyss-active.md when Abyss settings are missing', async () => {
		const read = vi.fn().mockRejectedValue(new Error('missing'));
		(coordinator as unknown as { app: { vault: { adapter: { read: typeof read } } } }).app = {
			vault: { adapter: { read } },
		};
		const path = await (coordinator as unknown as { abyssCaptureFile(): Promise<string> }).abyssCaptureFile();
		expect(path).toBe('00 Inbox/abyss-active.md');
	});
});
