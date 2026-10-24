/**
 * BUG-PULL-COMMENT-STALE: a TickTick-only API comment must mark the vault line behind.
 * The cached task is compared first so an already-different copy does not call getTaskById.
 */
import { describe, expect, it, vi } from 'vitest';
import { TFile } from 'obsidian';
import { VaultSyncCoordinator } from '@/services/VaultSyncCoordinator';
import { updateSettings } from '@/settings';
import { apiCommentsDifferFromVault } from '@/abyssCommentSync';
import { listCommentMapsForTask } from '@/db/taskCommentMaps';

vi.mock('@/utils/logger', () => ({
	default: { debug: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));
vi.mock('@/db/projects', () => ({
	getAllProjects: vi.fn().mockResolvedValue([{ id: 'proj-1', name: 'TTS-Inbox' }]),
}));
vi.mock('@/db/taskCommentMaps', () => ({
	listCommentMapsForTask: vi.fn().mockResolvedValue([]),
	upsertCommentMap: vi.fn(),
	deleteCommentMap: vi.fn(),
	commentMapId: (taskId: string, fp: string) => `${taskId}:${fp}`,
}));

class NoteFile extends TFile {
	path: string;
	constructor(path: string) {
		super();
		this.path = path;
	}
}

describe('BUG-PULL-COMMENT-STALE', () => {
	it('apiCommentsDifferFromVault ignores order and matches equal sets', () => {
		const lines = ['\t- 2026-10-19 20:00: alpha', '\t- beta'];
		expect(apiCommentsDifferFromVault(lines, [
			{ title: 'beta' },
			{ title: '2026-10-19 20:00: alpha' },
		])).toBe(false);
		expect(apiCommentsDifferFromVault(lines, [{ title: '2026-10-19 20:00: alpha' }])).toBe(true);
	});

	it('TP-IDLE-ZERO does not fetch a task or its comments when the Dexie copy matches the line', async () => {
		updateSettings({
			syncNotes: true,
			abyssTasksFormat: true,
			syncAbyssCommentsViaApi: true,
			syncScopeFolders: ['notes/'],
			tagMappings: [],
			tagListMappings: [],
		}, { persist: false });

		const taskId = 'abcdefabcdefabcdefabcdef';
		const file = new NoteFile('notes/a.md');
		const text = `- [ ] same title %%[ticktick_id:: ${taskId}]%%\n`;
		const getTaskById = vi.fn().mockResolvedValue({
			id: taskId, projectId: 'proj-1', title: 'same title', content: '', desc: '', status: 0,
		});
		const getTaskComments = vi.fn().mockResolvedValue([{ id: 'c1', title: 'from ticktick' }]);
		const plugin = {
			tickTickRestAPI: { getTaskById, getTaskComments },
			taskParser: undefined as unknown,
			projectScheme: { isParentTask: () => false },
			fileOperation: { readFileContent: async () => text },
			dateMan: {
				parseDates: () => ({}),
				stripDatesFromLine: (s: string) => s,
				formatDateToISO: () => '',
				addDatesToLine: (s: string) => s,
			},
			fileTaskQueries: { getDefaultProjectIdForFilepath: async () => 'proj-1' },
			taskRepository: { loadTaskById: async () => undefined },
		};
		const { TaskParser } = await import('@/taskParser');
		const parser = new TaskParser({} as never, plugin as never);
		plugin.taskParser = parser;
		const app = {
			metadataCache: { getFileCache: () => ({ listItems: [] }) },
			vault: {
				getAbstractFileByPath: () => file,
				read: async () => text,
			},
		};
		const coordinator = new VaultSyncCoordinator(app as never, plugin as never);
		const behind = (coordinator as unknown as {
			vaultLineBehindTask(task: unknown, path: string): Promise<{ behind: boolean; task: { _apiComments?: unknown[] } }>;
		}).vaultLineBehindTask.bind(coordinator);

		const matched = await behind({
			id: taskId, projectId: 'proj-1', title: 'same title', content: '', desc: '', status: 0, commentCount: 0,
		}, file.path);
		expect(matched.behind).toBe(false);
		expect(getTaskById).not.toHaveBeenCalled();
		expect(getTaskComments).not.toHaveBeenCalled();

		const counted = await behind({
			id: taskId, projectId: 'proj-1', title: 'same title', content: '', desc: '', status: 0, commentCount: 1,
		}, file.path);
		expect(counted.behind).toBe(true);
		expect(getTaskById).not.toHaveBeenCalled();
		expect(getTaskComments).toHaveBeenCalledTimes(1);
		expect(counted.task._apiComments).toEqual([{ id: 'c1', title: 'from ticktick' }]);

		const already = await behind({
			id: taskId, projectId: 'proj-1', title: 'renamed on ticktick', content: '', desc: '', status: 0,
		}, file.path);
		expect(already.behind).toBe(true);
		expect(getTaskById).not.toHaveBeenCalled();
	});

	it('TP-IDLE-ZERO does not getTaskComments when vault threads already match commentCount', async () => {
		updateSettings({
			syncNotes: true,
			abyssTasksFormat: true,
			syncAbyssCommentsViaApi: true,
			syncScopeFolders: ['notes/'],
			tagMappings: [],
			tagListMappings: [],
		}, { persist: false });

		const taskId = 'abcdefabcdefabcdefabcdef';
		const file = new NoteFile('notes/idle-comments.md');
		const text = [
			`- [ ] same title %%[ticktick_id:: ${taskId}]%%`,
			'\t- 2026-10-21T11:25:21+07:00: comment 1',
			'\t- 2026-10-21T12:09:07+07:00: comment 2',
		].join('\n');
		const getTaskById = vi.fn();
		const getTaskComments = vi.fn().mockResolvedValue([
			{ id: 'c1', title: 'comment 1' },
			{ id: 'c2', title: 'comment 2' },
		]);
		const { TaskParser } = await import('@/taskParser');
		const { abyssLinesToNote } = await import('@/abyssFormat');
		const parser = new TaskParser({} as never, {} as never);
		const taskLine = text.split('\n')[0];
		const childLines = text.split('\n').slice(1);
		const lineHash = await parser.getLineHash(taskLine + abyssLinesToNote(childLines));
		const plugin = {
			tickTickRestAPI: { getTaskById, getTaskComments },
			taskParser: parser,
			projectScheme: { isParentTask: () => false },
			fileOperation: { readFileContent: async () => text },
			dateMan: {
				parseDates: () => ({}),
				stripDatesFromLine: (s: string) => s,
				formatDateToISO: () => '',
				addDatesToLine: (s: string) => s,
				areDatesChanged: () => false,
				addDateHolderToTask: () => undefined,
			},
			fileTaskQueries: { getDefaultProjectIdForFilepath: async () => 'proj-1' },
			taskRepository: {
				loadTaskById: async () => ({
					id: taskId,
					projectId: 'proj-1',
					title: 'same title',
					content: '',
					lineHash,
				}),
			},
		};
		parser.plugin = plugin as never;
		const app = {
			metadataCache: { getFileCache: () => ({ listItems: [] }) },
			vault: { getAbstractFileByPath: () => file, read: async () => text },
		};
		const coordinator = new VaultSyncCoordinator(app as never, plugin as never);
		const behind = (coordinator as unknown as {
			vaultLineBehindTask(task: unknown, path: string): Promise<{ behind: boolean; reason: string }>;
		}).vaultLineBehindTask.bind(coordinator);

		const result = await behind({
			id: taskId,
			projectId: 'proj-1',
			title: 'same title',
			content: '',
			desc: '',
			status: 0,
			commentCount: 2,
			lineHash,
		}, file.path);
		expect(result.behind).toBe(false);
		expect(result.reason).toBe('in-sync');
		expect(getTaskById).not.toHaveBeenCalled();
		expect(getTaskComments).not.toHaveBeenCalled();
	});

	it('BUG-COMMENT-RECONCILE-UPDATE runs comment probe when Dexie marks task update', async () => {
		updateSettings({
			syncNotes: true,
			abyssTasksFormat: true,
			syncAbyssCommentsViaApi: true,
			syncScopeFolders: ['00 Inbox/'],
			tagMappings: [],
			tagListMappings: [],
		}, { persist: false });

		const taskId = '6ad83bc73e30f4429d749e09';
		const file = new NoteFile('00 Inbox/2026-10-21.md');
		const text = [
			`- [ ] test-11-12 #note/2026-10-21 #obsidian #inbox %%[ticktick_id:: ${taskId}]%%`,
			'\t- > new',
			'\t- 2026-10-21T11:14:22+07:00: comment 1',
		].join('\n');
		const getTaskComments = vi.fn().mockResolvedValue([]);
		const addTaskComment = vi.fn().mockResolvedValue({ id: 'c-new', title: 'comment 1' });
		const { TaskParser } = await import('@/taskParser');
		const { abyssLinesToNote } = await import('@/abyssFormat');
		const parser = new TaskParser({} as never, {} as never);
		const taskLine = text.split('\n')[0];
		const childLines = text.split('\n').slice(1);
		const lineHash = await parser.getLineHash(taskLine + abyssLinesToNote(childLines));
		const updatedAt = Date.now();
		const lastVaultSync = updatedAt - 60_000;
		const plugin = {
			tickTickRestAPI: { getTaskComments, addTaskComment, deleteTaskComment: vi.fn() },
			taskParser: parser,
			projectScheme: { isParentTask: () => false },
			fileOperation: { readFileContent: async () => text },
			dateMan: {
				parseDates: () => ({}),
				stripDatesFromLine: (s: string) => s,
				formatDateToISO: () => '',
				addDatesToLine: (s: string) => s,
				areDatesChanged: () => false,
				addDateHolderToTask: () => undefined,
			},
			fileTaskQueries: { getDefaultProjectIdForFilepath: async () => 'proj-1' },
			taskRepository: {
				loadTaskById: async () => ({
					id: taskId,
					projectId: 'proj-1',
					title: 'test-11-12',
					content: 'new',
					lineHash,
				}),
			},
		};
		parser.plugin = plugin as never;
		const app = {
			metadataCache: { getFileCache: () => ({ listItems: [] }) },
			vault: { getAbstractFileByPath: () => file, read: async () => text },
		};
		const coordinator = new VaultSyncCoordinator(app as never, plugin as never);
		const behind = (coordinator as unknown as {
			vaultLineBehindTask(task: unknown, path: string): Promise<{ behind: boolean; localEdit: boolean; reason: string }>;
		}).vaultLineBehindTask.bind(coordinator);

		const result = await behind({
			id: taskId,
			projectId: 'proj-1',
			title: 'test-11-12',
			content: 'new',
			desc: '',
			status: 0,
			commentCount: 0,
			lineHash,
		}, file.path);
		expect(addTaskComment).toHaveBeenCalled();
		expect(result.localEdit).toBe(true);
		expect(result.reason).toBe('vault-comments-ahead');
	});

	it('BUG-COMMENT-VAULT-AHEAD pushes when vault has Abyss comments and TickTick has none', async () => {
		updateSettings({
			syncNotes: true,
			abyssTasksFormat: true,
			syncAbyssCommentsViaApi: true,
			syncScopeFolders: ['00 Inbox/'],
			tagMappings: [],
			tagListMappings: [],
		}, { persist: false });

		const taskId = '6ad83d003e30f4429d749e0a';
		const file = new NoteFile('00 Inbox/2026-10-19.md');
		const text = [
			`- [ ] task-11-16 #obsidian #note/2026-10-19 #inbox %%[ticktick_id:: ${taskId}]%%`,
			'\t- 2026-10-21T11:25:21+07:00: comment 1',
			'\t- 2026-10-21T12:09:07+07:00: comment 2',
		].join('\n');
		const getTaskComments = vi.fn().mockResolvedValue([]);
		const addTaskComment = vi.fn().mockResolvedValue({ id: 'c-new', title: 'comment 1' });
		const { TaskParser } = await import('@/taskParser');
		const { abyssLinesToNote } = await import('@/abyssFormat');
		const parser = new TaskParser({} as never, {} as never);
		const taskLine = text.split('\n')[0];
		const childLines = text.split('\n').slice(1);
		const lineHash = await parser.getLineHash(taskLine + abyssLinesToNote(childLines));
		const plugin = {
			tickTickRestAPI: { getTaskComments, addTaskComment, deleteTaskComment: vi.fn() },
			taskParser: parser,
			projectScheme: { isParentTask: () => false },
			fileOperation: { readFileContent: async () => text },
			dateMan: {
				parseDates: () => ({}),
				stripDatesFromLine: (s: string) => s,
				formatDateToISO: () => '',
				addDatesToLine: (s: string) => s,
				areDatesChanged: () => false,
				addDateHolderToTask: () => undefined,
			},
			fileTaskQueries: { getDefaultProjectIdForFilepath: async () => 'proj-1' },
			taskRepository: {
				loadTaskById: async () => ({
					id: taskId,
					projectId: 'proj-1',
					title: 'task-11-16',
					content: '',
					lineHash,
				}),
			},
		};
		parser.plugin = plugin as never;
		const app = {
			metadataCache: { getFileCache: () => ({ listItems: [] }) },
			vault: { getAbstractFileByPath: () => file, read: async () => text },
		};
		const coordinator = new VaultSyncCoordinator(app as never, plugin as never);
		const behind = (coordinator as unknown as {
			vaultLineBehindTask(task: unknown, path: string): Promise<{ behind: boolean; localEdit: boolean; reason: string }>;
		}).vaultLineBehindTask.bind(coordinator);

		const result = await behind({
			id: taskId,
			projectId: 'proj-1',
			title: 'task-11-16',
			content: '',
			desc: '',
			status: 0,
			commentCount: 0,
			lineHash,
		}, file.path);
		expect(result.behind).toBe(false);
		expect(result.localEdit).toBe(true);
		expect(result.reason).toBe('vault-comments-ahead');
		expect(getTaskComments).toHaveBeenCalled();
		expect(addTaskComment).toHaveBeenCalled();
	});

	it('BUG-COMMENT-RECONCILE-UPDATE does not pull when vault-ahead push returns no changes', async () => {
		updateSettings({
			syncNotes: true,
			abyssTasksFormat: true,
			syncAbyssCommentsViaApi: true,
			syncScopeFolders: ['00 Inbox/'],
			tagMappings: [],
			tagListMappings: [],
		}, { persist: false });

		const taskId = '6ad83bc73e30f4429d749e09';
		const file = new NoteFile('00 Inbox/2026-10-21.md');
		const text = [
			`- [ ] test-11-12 #inbox #note/2026-10-21 #obsidian %%[ticktick_id:: ${taskId}]%%`,
			'\t- > new',
			'\t- 2026-10-21T11:14:22+07:00: comment 1',
			'\t- 2026-10-21T15:16:11+07:00: test-new-verision',
		].join('\n');
		const getTaskComments = vi.fn().mockResolvedValue([]);
		const addTaskComment = vi.fn().mockResolvedValue(null);
		vi.mocked(listCommentMapsForTask).mockResolvedValue([
			{
				id: `${taskId}:c1`,
				taskId,
				projectId: 'proj-1',
				fingerprint: 'comment 1',
				ticktickCommentId: 'dead-1',
				body: 'comment 1',
				origin: 'remote',
			},
			{
				id: `${taskId}:c2`,
				taskId,
				projectId: 'proj-1',
				fingerprint: 'test-new-verision',
				ticktickCommentId: 'dead-2',
				body: '2026-10-21T15:16:11+07:00: test-new-verision',
				origin: 'remote',
			},
		]);
		const { TaskParser } = await import('@/taskParser');
		const { abyssLinesToNote } = await import('@/abyssFormat');
		const parser = new TaskParser({} as never, {} as never);
		const taskLine = text.split('\n')[0];
		const childLines = text.split('\n').slice(1);
		const lineHash = await parser.getLineHash(taskLine + abyssLinesToNote(childLines));
		const plugin = {
			tickTickRestAPI: { getTaskComments, addTaskComment, deleteTaskComment: vi.fn() },
			taskParser: parser,
			projectScheme: { isParentTask: () => false },
			fileOperation: { readFileContent: async () => text },
			dateMan: {
				parseDates: () => ({}),
				stripDatesFromLine: (s: string) => s,
				formatDateToISO: () => '',
				addDatesToLine: (s: string) => s,
				areDatesChanged: () => false,
				addDateHolderToTask: () => undefined,
			},
			fileTaskQueries: { getDefaultProjectIdForFilepath: async () => 'proj-1' },
			taskRepository: {
				loadTaskById: async () => ({
					id: taskId,
					projectId: 'proj-1',
					title: 'test-11-12',
					content: 'new',
					lineHash,
				}),
			},
		};
		parser.plugin = plugin as never;
		const app = {
			metadataCache: { getFileCache: () => ({ listItems: [] }) },
			vault: { getAbstractFileByPath: () => file, read: async () => text },
		};
		const coordinator = new VaultSyncCoordinator(app as never, plugin as never);
		const behind = (coordinator as unknown as {
			vaultLineBehindTask(task: unknown, path: string): Promise<{ behind: boolean; localEdit: boolean; reason: string }>;
		}).vaultLineBehindTask.bind(coordinator);

		const result = await behind({
			id: taskId,
			projectId: 'proj-1',
			title: 'test-11-12',
			content: 'new',
			desc: '',
			status: 0,
			commentCount: 0,
			lineHash,
		}, file.path);
		expect(addTaskComment).toHaveBeenCalled();
		expect(result.behind).toBe(false);
		expect(result.reason).not.toBe('behindComments');
		// Failed / no-op push must not look settled while vault is still ahead of TT.
		expect(result.reason).not.toBe('in-sync');
		expect(result.localEdit).toBe(true);
		expect(result.reason).toBe('vault-comments-ahead');
	});

	it('BUG-COMMENT-VAULT-AHEAD pushes when description already matches TickTick content (test-11-12)', async () => {
		updateSettings({
			syncNotes: true,
			abyssTasksFormat: true,
			syncAbyssCommentsViaApi: true,
			syncScopeFolders: ['00 Inbox/'],
			tagMappings: [],
			tagListMappings: [],
		}, { persist: false });

		const taskId = '6ad83bc73e30f4429d749e09';
		const file = new NoteFile('00 Inbox/2026-10-21.md');
		const text = [
			`- [ ] test-11-12 #note/2026-10-21 #obsidian #inbox %%[ticktick_id:: ${taskId}]%%`,
			'\t- > new',
			'\t- 2026-10-21T11:14:22+07:00: comment 1',
			'\t- 2026-10-21T15:16:11+07:00: test-new-verision',
		].join('\n');
		const getTaskComments = vi.fn().mockResolvedValue([]);
		const addTaskComment = vi.fn().mockResolvedValue({ id: 'c-new', title: 'comment 1' });
		const { TaskParser } = await import('@/taskParser');
		const { abyssLinesToNote } = await import('@/abyssFormat');
		const parser = new TaskParser({} as never, {} as never);
		const taskLine = text.split('\n')[0];
		const childLines = text.split('\n').slice(1);
		const lineHash = await parser.getLineHash(taskLine + abyssLinesToNote(childLines));
		const plugin = {
			tickTickRestAPI: { getTaskComments, addTaskComment, deleteTaskComment: vi.fn() },
			taskParser: parser,
			projectScheme: { isParentTask: () => false },
			fileOperation: { readFileContent: async () => text },
			dateMan: {
				parseDates: () => ({}),
				stripDatesFromLine: (s: string) => s,
				formatDateToISO: () => '',
				addDatesToLine: (s: string) => s,
				areDatesChanged: () => false,
				addDateHolderToTask: () => undefined,
			},
			fileTaskQueries: { getDefaultProjectIdForFilepath: async () => 'proj-1' },
			taskRepository: {
				loadTaskById: async () => ({
					id: taskId,
					projectId: 'proj-1',
					title: 'test-11-12',
					content: 'new',
					lineHash,
				}),
			},
		};
		parser.plugin = plugin as never;
		const app = {
			metadataCache: { getFileCache: () => ({ listItems: [] }) },
			vault: { getAbstractFileByPath: () => file, read: async () => text },
		};
		const coordinator = new VaultSyncCoordinator(app as never, plugin as never);
		const behind = (coordinator as unknown as {
			vaultLineBehindTask(task: unknown, path: string): Promise<{ behind: boolean; localEdit: boolean; reason: string }>;
		}).vaultLineBehindTask.bind(coordinator);

		const result = await behind({
			id: taskId,
			projectId: 'proj-1',
			title: 'test-11-12',
			content: 'new',
			desc: '',
			status: 0,
			lineHash,
		}, file.path);
		expect(result.behind).toBe(false);
		expect(result.localEdit).toBe(true);
		expect(result.reason).toBe('vault-comments-ahead');
		expect(addTaskComment).toHaveBeenCalled();
		expect(addTaskComment).toHaveBeenCalledWith('proj-1', taskId, 'comment 1');
		expect(addTaskComment).toHaveBeenCalledWith('proj-1', taskId, 'test-new-verision');
	});

	it('BUG-COMMENT-EMPTY-VAULT-WIPE: coordinator must not wipe TT on empty vault threads without hash flag', async () => {
		updateSettings({
			syncNotes: true,
			abyssTasksFormat: true,
			syncAbyssCommentsViaApi: true,
			syncScopeFolders: ['00 Inbox/'],
			tagMappings: [],
			tagListMappings: [],
		}, { persist: false });

		const taskId = '6ad83d003e30f4429d749e0a';
		const file = new NoteFile('00 Inbox/2026-10-19.md');
		const text = [
			`- [ ] task-11-16 #obsidian #note/2026-10-19 #inbox %%[ticktick_id:: ${taskId}]%%`,
			'\t- > коммент 6',
		].join('\n');
		const getTaskComments = vi.fn().mockResolvedValue([
			{ id: 'c1', title: 'comment 1' },
			{ id: 'c2', title: 'mcp-test' },
		]);
		const deleteTaskComment = vi.fn().mockResolvedValue(true);
		const vaultMaps = [
			{
				id: `${taskId}:comment 1`,
				taskId,
				projectId: 'proj-1',
				fingerprint: 'comment 1',
				ticktickCommentId: 'c1',
				body: 'comment 1',
				origin: 'vault' as const,
			},
		];
		vi.mocked(listCommentMapsForTask).mockImplementation(async () => vaultMaps);
		const { TaskParser } = await import('@/taskParser');
		const { abyssLinesToNote } = await import('@/abyssFormat');
		const parser = new TaskParser({} as never, {} as never);
		const taskLine = text.split('\n')[0];
		const childLines = text.split('\n').slice(1);
		const lineHash = await parser.getLineHash(taskLine + abyssLinesToNote(childLines));
		const plugin = {
			tickTickRestAPI: { getTaskComments, addTaskComment: vi.fn(), deleteTaskComment },
			taskParser: parser,
			projectScheme: { isParentTask: () => false },
			fileOperation: { readFileContent: async () => text },
			dateMan: {
				parseDates: () => ({}),
				stripDatesFromLine: (s: string) => s,
				formatDateToISO: () => '',
				addDatesToLine: (s: string) => s,
				areDatesChanged: () => false,
				addDateHolderToTask: () => undefined,
			},
			fileTaskQueries: { getDefaultProjectIdForFilepath: async () => 'proj-1' },
			taskRepository: {
				loadTaskById: async () => ({
					id: taskId,
					projectId: 'proj-1',
					title: 'task-11-16',
					content: '',
					lineHash,
				}),
			},
		};
		parser.plugin = plugin as never;
		const app = {
			metadataCache: { getFileCache: () => ({ listItems: [] }) },
			vault: { getAbstractFileByPath: () => file, read: async () => text },
		};
		const coordinator = new VaultSyncCoordinator(app as never, plugin as never);
		const behind = (coordinator as unknown as {
			vaultLineBehindTask(task: unknown, path: string): Promise<{ behind: boolean; localEdit: boolean; reason: string }>;
		}).vaultLineBehindTask.bind(coordinator);

		const result = await behind({
			id: taskId,
			projectId: 'proj-1',
			title: 'task-11-16',
			content: '',
			desc: '',
			status: 0,
			commentCount: 2,
			lineHash,
		}, file.path);
		expect(deleteTaskComment).not.toHaveBeenCalled();
		expect(result.behind).toBe(true);
		expect(result.reason).toBe('behindComments');
	});

	it('BUG-COMMENT-VAULT-DUP-KEY: twins-only hash mismatch marks behind instead of sticky local-edit', async () => {
		updateSettings({
			syncNotes: true,
			abyssTasksFormat: true,
			syncAbyssCommentsViaApi: true,
			syncScopeFolders: ['00 Inbox/'],
			tagMappings: [],
			tagListMappings: [],
		}, { persist: false });

		const taskId = '6ad83d003e30f4429d749e0a';
		const file = new NoteFile('00 Inbox/2026-10-19.md');
		const twinText = [
			`- [ ] task-11-16 #obsidian #note/2026-10-19 #inbox %%[ticktick_id:: ${taskId}]%%`,
			'\t- 2026-10-21 21:22: comment 1',
			'\t- 2026-10-21T21:11:41+07:00: comment 1',
			'\t- 2026-10-21 21:22: коммент 2',
			'\t- 2026-10-21T21:15:23+07:00: коммент 2',
		].join('\n');
		const cleanChildren = [
			'\t- 2026-10-21 21:22: comment 1',
			'\t- 2026-10-21 21:22: коммент 2',
		];
		const getTaskComments = vi.fn().mockResolvedValue([
			{ id: 'c1', title: 'comment 1' },
			{ id: 'c2', title: 'коммент 2' },
		]);
		const { TaskParser } = await import('@/taskParser');
		const { abyssLinesToNote } = await import('@/abyssFormat');
		const parser = new TaskParser({} as never, {} as never);
		const taskLine = twinText.split('\n')[0];
		// Dexie hash from the collapsed note; vault still has twins → hash mismatch.
		const lineHash = await parser.getLineHash(taskLine + abyssLinesToNote(cleanChildren));
		const plugin = {
			tickTickRestAPI: { getTaskComments, addTaskComment: vi.fn(), deleteTaskComment: vi.fn() },
			taskParser: parser,
			projectScheme: { isParentTask: () => false },
			fileOperation: { readFileContent: async () => twinText },
			dateMan: {
				parseDates: () => ({}),
				stripDatesFromLine: (s: string) => s,
				formatDateToISO: () => '',
				addDatesToLine: (s: string) => s,
				areDatesChanged: () => false,
				addDateHolderToTask: () => undefined,
			},
			fileTaskQueries: { getDefaultProjectIdForFilepath: async () => 'proj-1' },
			taskRepository: {
				loadTaskById: async () => ({
					id: taskId,
					projectId: 'proj-1',
					title: 'task-11-16',
					content: '',
					lineHash,
				}),
			},
		};
		parser.plugin = plugin as never;
		const app = {
			metadataCache: { getFileCache: () => ({ listItems: [] }) },
			vault: { getAbstractFileByPath: () => file, read: async () => twinText },
		};
		const coordinator = new VaultSyncCoordinator(app as never, plugin as never);
		const behind = (coordinator as unknown as {
			vaultLineBehindTask(task: unknown, path: string): Promise<{ behind: boolean; localEdit: boolean; reason: string }>;
		}).vaultLineBehindTask.bind(coordinator);

		const result = await behind({
			id: taskId,
			projectId: 'proj-1',
			title: 'task-11-16',
			content: '',
			desc: '',
			status: 0,
			commentCount: 2,
			lineHash,
		}, file.path);
		expect(result.localEdit).toBe(false);
		expect(result.behind).toBe(true);
		expect(result.reason).toBe('vault-comment-dup-keys');
	});

	it('BUG-COMMENT-VAULT-DUP-KEY: quiet sync marks behind when vault has stamp twins and TT keys already match', async () => {
		updateSettings({
			syncNotes: true,
			abyssTasksFormat: true,
			syncAbyssCommentsViaApi: true,
			syncScopeFolders: ['00 Inbox/'],
			tagMappings: [],
			tagListMappings: [],
		}, { persist: false });

		const taskId = '6ad83d003e30f4429d749e0a';
		const file = new NoteFile('00 Inbox/2026-10-19.md');
		// Wall-clock + ISO twins for the same two keys; TT already has one plain comment per key.
		const text = [
			`- [ ] task-11-16 #obsidian #note/2026-10-19 #inbox %%[ticktick_id:: ${taskId}]%%`,
			'\t- 2026-10-21 21:22: comment 1',
			'\t- 2026-10-21T21:11:41+07:00: comment 1',
			'\t- 2026-10-21 21:22: коммент 2',
			'\t- 2026-10-21T21:15:23+07:00: коммент 2',
		].join('\n');
		const getTaskComments = vi.fn().mockResolvedValue([
			{ id: 'c1', title: 'comment 1' },
			{ id: 'c2', title: 'коммент 2' },
		]);
		const addTaskComment = vi.fn();
		const deleteTaskComment = vi.fn();
		const { TaskParser } = await import('@/taskParser');
		const { abyssLinesToNote } = await import('@/abyssFormat');
		const parser = new TaskParser({} as never, {} as never);
		const taskLine = text.split('\n')[0];
		const childLines = text.split('\n').slice(1);
		// lineHash matches current twin-laden note (quiet sync / sticky twins after 2.0.79).
		const lineHash = await parser.getLineHash(taskLine + abyssLinesToNote(childLines));
		const plugin = {
			tickTickRestAPI: { getTaskComments, addTaskComment, deleteTaskComment },
			taskParser: parser,
			projectScheme: { isParentTask: () => false },
			fileOperation: { readFileContent: async () => text },
			dateMan: {
				parseDates: () => ({}),
				stripDatesFromLine: (s: string) => s,
				formatDateToISO: () => '',
				addDatesToLine: (s: string) => s,
				areDatesChanged: () => false,
				addDateHolderToTask: () => undefined,
			},
			fileTaskQueries: { getDefaultProjectIdForFilepath: async () => 'proj-1' },
			taskRepository: {
				loadTaskById: async () => ({
					id: taskId,
					projectId: 'proj-1',
					title: 'task-11-16',
					content: '',
					lineHash,
				}),
			},
		};
		parser.plugin = plugin as never;
		const app = {
			metadataCache: { getFileCache: () => ({ listItems: [] }) },
			vault: { getAbstractFileByPath: () => file, read: async () => text },
		};
		const coordinator = new VaultSyncCoordinator(app as never, plugin as never);
		const behind = (coordinator as unknown as {
			vaultLineBehindTask(task: unknown, path: string): Promise<{
				behind: boolean;
				localEdit: boolean;
				reason: string;
				task: { _apiComments?: unknown[] };
			}>;
		}).vaultLineBehindTask.bind(coordinator);

		const result = await behind({
			id: taskId,
			projectId: 'proj-1',
			title: 'task-11-16',
			content: '',
			desc: '',
			status: 0,
			commentCount: 2,
			lineHash,
		}, file.path);
		expect(addTaskComment).not.toHaveBeenCalled();
		expect(deleteTaskComment).not.toHaveBeenCalled();
		expect(result.localEdit).toBe(false);
		expect(result.behind).toBe(true);
		expect(result.reason).toBe('vault-comment-dup-keys');
		expect(result.task._apiComments).toEqual([
			{ id: 'c1', title: 'comment 1' },
			{ id: 'c2', title: 'коммент 2' },
		]);
	});

	it('BUG-COMMENT-BOTH-WAYS pushes vault-ahead then marks behindComments when TickTick also has extra comments', async () => {
		updateSettings({
			syncNotes: true,
			abyssTasksFormat: true,
			syncAbyssCommentsViaApi: true,
			syncScopeFolders: ['00 Inbox/'],
			tagMappings: [],
			tagListMappings: [],
		}, { persist: false });

		const taskId = '6ad83d003e30f4429d749e0a';
		const file = new NoteFile('00 Inbox/2026-10-19.md');
		const text = [
			`- [ ] task-11-16 #obsidian #note/2026-10-19 #inbox %%[ticktick_id:: ${taskId}]%%`,
			'\t- 2026-10-21T11:25:21+07:00: comment 1',
			'\t- 2026-10-21T12:09:07+07:00: comment 2',
			'\t- 2026-10-21T13:58:06+07:00: comment 3',
		].join('\n');
		const getTaskComments = vi.fn().mockResolvedValue([
			{ id: 'c1', title: 'comment 1' },
			{ id: 'c2', title: 'pilot-tt-second-comment' },
		]);
		const addTaskComment = vi.fn().mockResolvedValue({ id: 'c-new', title: 'comment 2' });
		const { TaskParser } = await import('@/taskParser');
		const { abyssLinesToNote } = await import('@/abyssFormat');
		const parser = new TaskParser({} as never, {} as never);
		const taskLine = text.split('\n')[0];
		const childLines = text.split('\n').slice(1);
		const lineHash = await parser.getLineHash(taskLine + abyssLinesToNote(childLines));
		const plugin = {
			tickTickRestAPI: { getTaskComments, addTaskComment, deleteTaskComment: vi.fn() },
			taskParser: parser,
			projectScheme: { isParentTask: () => false },
			fileOperation: { readFileContent: async () => text },
			dateMan: {
				parseDates: () => ({}),
				stripDatesFromLine: (s: string) => s,
				formatDateToISO: () => '',
				addDatesToLine: (s: string) => s,
				areDatesChanged: () => false,
				addDateHolderToTask: () => undefined,
			},
			fileTaskQueries: { getDefaultProjectIdForFilepath: async () => 'proj-1' },
			taskRepository: {
				loadTaskById: async () => ({
					id: taskId,
					projectId: 'proj-1',
					title: 'task-11-16',
					content: '',
					lineHash,
				}),
			},
		};
		parser.plugin = plugin as never;
		const app = {
			metadataCache: { getFileCache: () => ({ listItems: [] }) },
			vault: { getAbstractFileByPath: () => file, read: async () => text },
		};
		const coordinator = new VaultSyncCoordinator(app as never, plugin as never);
		const behind = (coordinator as unknown as {
			vaultLineBehindTask(task: unknown, path: string): Promise<{ behind: boolean; localEdit: boolean; reason: string }>;
		}).vaultLineBehindTask.bind(coordinator);

		const result = await behind({
			id: taskId,
			projectId: 'proj-1',
			title: 'task-11-16',
			content: '',
			desc: '',
			status: 0,
			commentCount: 2,
			lineHash,
		}, file.path);
		expect(addTaskComment).toHaveBeenCalled();
		expect(result.behind).toBe(true);
		expect(result.reason).toBe('behindComments');
		expect(result.task._apiComments).toEqual([
			{ id: 'c1', title: 'comment 1' },
			{ id: 'c2', title: 'pilot-tt-second-comment' },
		]);
	});

	it('BUG-COMMENT-DELETE-REPOST H5: behindComments attaches __ticktickComments for merge strip', async () => {
		updateSettings({
			syncNotes: true,
			abyssTasksFormat: true,
			syncAbyssCommentsViaApi: true,
			syncScopeFolders: ['00 Inbox/'],
			tagMappings: [],
			tagListMappings: [],
		}, { persist: false });

		const taskId = '6ad97afa24006c1f88d0aa13';
		const file = new NoteFile('00 Inbox/abyss-active.md');
		const text = [
			`- [ ] тест-абис-таск #obsidian #inbox %%[ticktick_id:: ${taskId}]%%`,
			'\t- > ',
			'\t- commetn 1',
		].join('\n');
		const getTaskComments = vi.fn().mockResolvedValue([]);
		const addTaskComment = vi.fn();
		vi.mocked(listCommentMapsForTask).mockResolvedValue([
			{
				id: `${taskId}:commetn 1`,
				taskId,
				projectId: 'proj-1',
				fingerprint: 'commetn 1',
				ticktickCommentId: 'c-deleted',
				body: 'commetn 1',
				origin: 'vault' as const,
			},
		]);
		const { TaskParser } = await import('@/taskParser');
		const { abyssLinesToNote } = await import('@/abyssFormat');
		const parser = new TaskParser({} as never, {} as never);
		const taskLine = text.split('\n')[0];
		const childLines = text.split('\n').slice(1);
		const lineHash = await parser.getLineHash(taskLine + abyssLinesToNote(childLines));
		const plugin = {
			tickTickRestAPI: { getTaskComments, addTaskComment, deleteTaskComment: vi.fn() },
			taskParser: parser,
			projectScheme: { isParentTask: () => false },
			fileOperation: { readFileContent: async () => text },
			dateMan: {
				parseDates: () => ({}),
				stripDatesFromLine: (s: string) => s,
				formatDateToISO: () => '',
				addDatesToLine: (s: string) => s,
				areDatesChanged: () => false,
				addDateHolderToTask: () => undefined,
			},
			fileTaskQueries: { getDefaultProjectIdForFilepath: async () => 'proj-1' },
			taskRepository: {
				loadTaskById: async () => ({
					id: taskId,
					projectId: 'proj-1',
					title: 'тест-абис-таск',
					content: '',
					lineHash,
				}),
			},
		};
		parser.plugin = plugin as never;
		const app = {
			metadataCache: { getFileCache: () => ({ listItems: [] }) },
			vault: { getAbstractFileByPath: () => file, read: async () => text },
		};
		const coordinator = new VaultSyncCoordinator(app as never, plugin as never);
		const behind = (coordinator as unknown as {
			vaultLineBehindTask(task: unknown, path: string): Promise<{
				behind: boolean;
				localEdit: boolean;
				reason: string;
				task: {
					_apiComments?: unknown[];
					__ticktickComments?: {
						knownBodies: string[];
						apiBodies: string[];
						remoteCommentCount?: number;
					};
				};
			}>;
		}).vaultLineBehindTask.bind(coordinator);

		// Dexie count already 0 after TT delete while vault still has the mapped bullet
		// (count mismatch forces comment probe; matched count would idle-skip GET).
		const result = await behind({
			id: taskId,
			projectId: 'proj-1',
			title: 'тест-абис-таск',
			content: '',
			desc: '',
			status: 0,
			commentCount: 0,
			lineHash,
		}, file.path);

		expect(addTaskComment).not.toHaveBeenCalled();
		expect(result.behind).toBe(true);
		expect(result.reason).toBe('behindComments');
		expect(result.task._apiComments).toEqual([]);
		expect(result.task.__ticktickComments).toEqual({
			knownBodies: ['commetn 1'],
			apiBodies: [],
			remoteCommentCount: 0,
		});
	});

	it('BUG-COMMENT-DELETE-REPOST H6: hint from behindComments strips vault bullet before flush', async () => {
		const { mergeAbyssBlock } = await import('@/abyssFormat');
		const gen = '- [ ] T %%[ticktick_id:: abcdefabcdefabcdefabcdef]%%\n\t- > ';
		const old = ['\t- > ', '\t- commetn 1'];
		const hint = {
			knownBodies: ['commetn 1'],
			apiBodies: [] as string[],
			remoteCommentCount: 0,
		};
		const out = mergeAbyssBlock(gen, old, undefined, hint);
		expect(out).not.toContain('commetn 1');
	});

	it('BUG-COMMENT-DELETE-REPOST H5b: tag rewrite copy keeps __ticktickComments (dropStaleStageTags spread)', () => {
		const coordinator = new VaultSyncCoordinator({} as never, {} as never);
		const copy = (coordinator as unknown as {
			copyCommentPullState(from: object, to: object): void;
		}).copyCommentPullState.bind(coordinator);

		const from = { id: 't1', tags: ['obsidian'] };
		Object.defineProperty(from, '_apiComments', { value: [], enumerable: false, configurable: true });
		Object.defineProperty(from, '__ticktickComments', {
			value: { knownBodies: ['gone'], apiBodies: [], remoteCommentCount: 0 },
			enumerable: false,
			configurable: true,
		});
		const to = { ...from, tags: ['inbox'] };
		expect((to as { __ticktickComments?: unknown }).__ticktickComments).toBeUndefined();
		copy(from, to);
		expect((to as { __ticktickComments?: unknown }).__ticktickComments).toEqual({
			knownBodies: ['gone'],
			apiBodies: [],
			remoteCommentCount: 0,
		});
		expect((to as { _apiComments?: unknown })._apiComments).toEqual([]);
	});
});
