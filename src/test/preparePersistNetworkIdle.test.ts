/**
 * TP-IDLE-ZERO-SWEEP / #62 slice 2: preparePersistNetwork must not call
 * getTaskComments when Dexie commentCount matches vault threads and maps cover.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App, TFile } from 'obsidian';
import type TickTickSync from '@/main';
import type { ITask } from '@/api/types/Task';
import { FileOperation } from '@/fileOperation';

vi.mock('obsidian', () => ({
	App: vi.fn(),
	AbstractInputSuggest: class {},
	Modal: vi.fn(),
	Notice: vi.fn(),
	Plugin: vi.fn(),
	PluginSettingTab: vi.fn(),
	TFile: vi.fn(),
	TFolder: vi.fn(),
	MarkdownView: vi.fn(),
}));

vi.mock('@/utils/logger', () => ({
	default: { debug: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), trace: vi.fn() },
}));

vi.mock('@/main', () => ({ default: class {} }));

vi.mock('@/db/dexie', () => ({
	db: {
		tasks: {
			where: vi.fn(() => ({
				equals: () => ({
					toArray: async () => [],
					first: async () => undefined,
					count: async () => 0,
				}),
			})),
			update: vi.fn(),
			toArray: vi.fn(async () => []),
		},
	},
}));

vi.mock('@/settings', () => ({
	getSettings: vi.fn(() => ({
		enableFullVaultSync: false,
		syncNotes: true,
		abyssTasksFormat: true,
		syncAbyssCommentsViaApi: true,
	})),
	getDefaultFolder: vi.fn(() => ''),
}));

const listMaps = vi.fn();
vi.mock('@/db/taskCommentMaps', () => ({
	listCommentMapsForTask: (...args: unknown[]) => listMaps(...args),
}));

const STUB = '== Added by TickTickSync -- 2.0.1 == ';
const TASK_LINE = '- [ ] a task #ticktick %%[ticktick_id:: task-1]%%';
const FILE =
	`${STUB}\n${TASK_LINE}\n\t- 2026-10-21 21:22: comment 1`;

function makeTFile(path: string): TFile {
	return Object.assign(Object.create(TFile.prototype), { path }) as TFile;
}

describe('preparePersistNetwork idle gate', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		listMaps.mockResolvedValue([
			{
				id: 'task-1:comment 1',
				taskId: 'task-1',
				projectId: 'proj-a',
				fingerprint: 'comment 1',
				ticktickCommentId: 'tt-c1',
				body: 'comment 1',
				origin: 'vault',
			},
		]);
	});

	it('TP-IDLE-ZERO-SWEEP: skips getTaskComments when commentCount matches maps', async () => {
		const file = makeTFile('TODO/Work.md');
		const getTaskComments = vi.fn().mockResolvedValue([{ id: 'tt-c1', title: 'comment 1' }]);

		const app = {
			workspace: { getActiveFile: () => null, activeEditor: null },
			vault: {
				getAbstractFileByPath: () => file,
				read: async () => FILE,
				cachedRead: async () => FILE,
				process: async (_f: TFile, cb: (data: string) => string) => {
					cb(FILE);
				},
			},
			metadataCache: { getFileCache: () => ({ listItems: [] }) },
		} as unknown as App;

		const task: ITask = {
			id: 'task-1',
			projectId: 'proj-a',
			title: 'a task',
			content: '',
			desc: '',
			commentCount: 1,
		} as ITask;

		const plugin = {
			app,
			fileOperation: { readFileContent: async () => FILE },
			taskParser: {
				isMarkdownTask: (line: string) => /^\s*[-*+] \[[x ]\]/i.test(line),
				getTickTickId: (line: string) => line.match(/%%\[ticktick_id::\s*(\S+?)\]%%/)?.[1] ?? null,
				getNumTabs: () => 0,
				getTabs: (line: string) => line.match(/^\s*/)?.[0] ?? '',
				convertTaskToLine: async () => TASK_LINE,
				isProjectIdChanged: async () => false,
				isParentIdChanged: () => false,
				getNoteString: () => '',
				getLineHash: async () => 'hash',
				getLinkLocation: () => ({ taskURL: null, noteURL: null }),
			},
			dateMan: { addDateHolderToTask: () => {} },
			taskRepository: {
				loadTaskById: async () => task,
				upsertTask: vi.fn(),
			},
			fileTaskQueries: {
				getDefaultProjectIdForFilepath: async () => 'proj-a',
				filepathHasDefaultProjectID: async () => true,
			},
			tickTickRestAPI: { updateTask: async (t: ITask) => t, getTaskComments },
			lastLines: new Map<string, number>(),
		} as unknown as TickTickSync;

		const fileOperation = new FileOperation(app, plugin);
		await fileOperation.synchronizeToVault('TODO/Work.md', [task], true);

		expect(getTaskComments).not.toHaveBeenCalled();
	});

	it('TP-IDLE-ZERO-SWEEP: still getTaskComments when commentCount unknown', async () => {
		const file = makeTFile('TODO/Work.md');
		const getTaskComments = vi.fn().mockResolvedValue([{ id: 'tt-c1', title: 'comment 1' }]);

		const app = {
			workspace: { getActiveFile: () => null, activeEditor: null },
			vault: {
				getAbstractFileByPath: () => file,
				read: async () => FILE,
				cachedRead: async () => FILE,
				process: async (_f: TFile, cb: (data: string) => string) => {
					cb(FILE);
				},
			},
			metadataCache: { getFileCache: () => ({ listItems: [] }) },
		} as unknown as App;

		const task: ITask = {
			id: 'task-1',
			projectId: 'proj-a',
			title: 'a task',
			content: '',
			desc: '',
		} as ITask;

		const plugin = {
			app,
			fileOperation: { readFileContent: async () => FILE },
			taskParser: {
				isMarkdownTask: (line: string) => /^\s*[-*+] \[[x ]\]/i.test(line),
				getTickTickId: (line: string) => line.match(/%%\[ticktick_id::\s*(\S+?)\]%%/)?.[1] ?? null,
				getNumTabs: () => 0,
				getTabs: (line: string) => line.match(/^\s*/)?.[0] ?? '',
				convertTaskToLine: async () => TASK_LINE,
				isProjectIdChanged: async () => false,
				isParentIdChanged: () => false,
				getNoteString: () => '',
				getLineHash: async () => 'hash',
				getLinkLocation: () => ({ taskURL: null, noteURL: null }),
			},
			dateMan: { addDateHolderToTask: () => {} },
			taskRepository: {
				loadTaskById: async () => task,
				upsertTask: vi.fn(),
			},
			fileTaskQueries: {
				getDefaultProjectIdForFilepath: async () => 'proj-a',
				filepathHasDefaultProjectID: async () => true,
			},
			tickTickRestAPI: { updateTask: async (t: ITask) => t, getTaskComments },
			lastLines: new Map<string, number>(),
		} as unknown as TickTickSync;

		const fileOperation = new FileOperation(app, plugin);
		await fileOperation.synchronizeToVault('TODO/Work.md', [task], true);

		expect(getTaskComments).toHaveBeenCalled();
	});
});
