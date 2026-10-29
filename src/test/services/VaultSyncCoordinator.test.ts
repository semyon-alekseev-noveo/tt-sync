import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { VaultSyncCoordinator } from '@/services/VaultSyncCoordinator';
import type { LocalTask } from '@/db/schema';
import type { ITask } from '@/api/types/Task';
import { db } from '@/db/dexie';
import { getSettings } from '@/settings';

// Mock Obsidian dependencies
vi.mock('obsidian', () => ({
	App: vi.fn(),
	AbstractInputSuggest: class AbstractInputSuggest {
		constructor() {}
	},
	Modal: vi.fn(),
	Notice: vi.fn(),
	Plugin: vi.fn(),
	PluginSettingTab: vi.fn(),
	TFile: vi.fn(),
	TFolder: vi.fn(),
	MarkdownView: vi.fn(),
}));

vi.mock('@/db/dexie', () => ({
	db: {
		tasks: {
			where: vi.fn(),
			toArray: vi.fn(),
			update: vi.fn(),
		},
		meta: {
			update: vi.fn(),
		},
		files: { toArray: vi.fn() },
		projects: { toArray: vi.fn() },
		transaction: vi.fn((_mode: string, _table: string, callback: () => void) => callback()),
	},
}));

const deleteFileMock = vi.hoisted(() => vi.fn(async () => undefined));
vi.mock('@/db/files', () => ({
	upsertFile: vi.fn(),
	deleteFile: (...args: unknown[]) => deleteFileMock(...args),
	getAllFiles: vi.fn(async () => []),
	getFile: vi.fn(),
	updateFilePath: vi.fn(),
}));

vi.mock('@/settings', () => ({
	getSettings: vi.fn(() => ({
		SyncTag: undefined,
		SyncProject: undefined,
		tagAndOr: 0,
		defaultProjectId: 'default-project-id',
		keepProjectFolders: false,
	})),
}));

vi.mock('@/modals/TaskDeletionModal', () => ({
	TaskDeletionModal: vi.fn(function () {
		return { showModal: vi.fn().mockResolvedValue({ confirmed: true }) };
	}),
}));

vi.mock('@/utils/logger', () => ({
	default: {
		debug: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		info: vi.fn(),
	},
}));

function makeLocalTask(overrides: Partial<LocalTask> = {}): LocalTask {
	return {
		localId: 'local-1',
		taskId: 'task-1',
		task: { id: 'task-1', projectId: 'proj-1' } as ITask,
		updatedAt: 1000,
		file: '',
		source: 'obsidian',
		...overrides,
	};
}

describe('VaultSyncCoordinator', () => {
	let coordinator: VaultSyncCoordinator;

	beforeEach(() => {
		vi.clearAllMocks();
		coordinator = new VaultSyncCoordinator(
			{} as unknown,
			{} as unknown,
			undefined
		);
	});

	describe('determineActionNeeded', () => {
		let fn: (...args: unknown[]) => { action: string };

		beforeEach(() => {
			fn = (coordinator as unknown as { determineActionNeeded(...args: unknown[]): { action: string } }).determineActionNeeded.bind(coordinator);
		});

		it('should return add for a task with no file', () => {
			const lt = makeLocalTask({ file: '' });
			const result = fn(lt, 'Projects/New.md');
			expect(result).toEqual({ action: 'add' });
		});

		it('should return move when targetFile differs from lt.file', () => {
			const lt = makeLocalTask({
				file: 'Projects/Old.md',
				updatedAt: 1000,
				lastVaultSync: 1000,
			});
			const result = fn(lt, 'Projects/New.md');
			expect(result).toEqual({ action: 'move' });
		});

		it('should return update when file is same but content changed', () => {
			const lt = makeLocalTask({
				file: 'Projects/Same.md',
				updatedAt: 2000,
				lastVaultSync: 1000,
			});
			const result = fn(lt, 'Projects/Same.md');
			expect(result).toEqual({ action: 'update' });
		});

		it('should return none when nothing changed', () => {
			const lt = makeLocalTask({
				file: 'Projects/Same.md',
				updatedAt: 1000,
				lastVaultSync: 1000,
			});
			const result = fn(lt, 'Projects/Same.md');
			expect(result).toEqual({ action: 'none' });
		});

		it('should treat undefined lastVaultSync as changed', () => {
			const lt = makeLocalTask({
				file: 'Projects/Same.md',
				updatedAt: 1000,
				lastVaultSync: undefined,
			});
			const result = fn(lt, 'Projects/Same.md');
			expect(result).toEqual({ action: 'update' });
		});

		it('should prefer move over update when both changed and file moved', () => {
			const lt = makeLocalTask({
				file: 'Projects/Old.md',
				updatedAt: 2000,
				lastVaultSync: 1000,
			});
			const result = fn(lt, 'Projects/New.md');
			expect(result).toEqual({ action: 'move' });
		});
	});

	describe('matchesFilter', () => {
		let fn: (...args: unknown[]) => boolean;

		beforeEach(() => {
			fn = (coordinator as unknown as { matchesFilter(...args: unknown[]): boolean }).matchesFilter.bind(coordinator);
		});

		it('should return true when no filter is set', () => {
			const task = { id: 't1', projectId: 'p1', tags: ['work'] } as ITask;
			expect(fn(task, undefined, undefined, 0)).toBe(true);
		});

		it('should return true when task matches syncTag', () => {
			const task = { id: 't1', projectId: 'p1', tags: ['work'] } as ITask;
			expect(fn(task, 'work', undefined, 0)).toBe(true);
		});

		it('should return false when task does not match syncTag', () => {
			const task = { id: 't1', projectId: 'p1', tags: ['personal'] } as ITask;
			expect(fn(task, 'work', undefined, 0)).toBe(false);
		});

		it('should return true when task matches syncProject', () => {
			const task = { id: 't1', projectId: 'p1', tags: [] } as ITask;
			expect(fn(task, undefined, 'p1', 0)).toBe(true);
		});

		it('should return false when task does not match syncProject', () => {
			const task = { id: 't1', projectId: 'p2', tags: [] } as ITask;
			expect(fn(task, undefined, 'p1', 0)).toBe(false);
		});

		it('should return true with AND filter when both match', () => {
			const task = { id: 't1', projectId: 'p1', tags: ['work'] } as ITask;
			expect(fn(task, 'work', 'p1', 1)).toBe(true);
		});

		it('should return false with AND filter when only one matches', () => {
			const task = { id: 't1', projectId: 'p1', tags: ['personal'] } as ITask;
			expect(fn(task, 'work', 'p1', 1)).toBe(false);
		});

		it('should return true with OR filter when one matches', () => {
			const task = { id: 't1', projectId: 'p1', tags: ['personal'] } as ITask;
			expect(fn(task, 'work', 'p1', 0)).toBe(true);
		});

		it('should return false with OR filter when neither matches', () => {
			const task = { id: 't1', projectId: 'p2', tags: ['personal'] } as ITask;
			expect(fn(task, 'work', 'p1', 0)).toBe(false);
		});
	});

	describe('syncedLists gate (GTD scope)', () => {
		let fn: (...args: unknown[]) => boolean;
		beforeEach(() => {
			fn = (coordinator as unknown as { matchesFilter(...args: unknown[]): boolean }).matchesFilter.bind(coordinator);
		});

		it('rejects tasks of lists outside the allow-list', () => {
			const task = { id: 't1', projectId: 'p2', tags: [] } as ITask;
			expect(fn(task, undefined, undefined, 0, new Set(['p1']))).toBe(false);
		});

		it('accepts tasks of allow-listed lists', () => {
			const task = { id: 't1', projectId: 'p1', tags: [] } as ITask;
			expect(fn(task, undefined, undefined, 0, new Set(['p1']))).toBe(true);
		});

		it('empty allow-list pulls nothing (not everything)', () => {
			const task = { id: 't1', projectId: 'p1', tags: [] } as ITask;
			expect(fn(task, undefined, undefined, 0, new Set())).toBe(false);
		});

		it('SyncTag still narrows inside an allowed list', () => {
			const allowed = new Set(['p1']);
			expect(fn({ id: 'a', projectId: 'p1', tags: ['work'] } as ITask, 'work', undefined, 0, allowed)).toBe(true);
			expect(fn({ id: 'b', projectId: 'p1', tags: ['home'] } as ITask, 'work', undefined, 0, allowed)).toBe(false);
		});
	});

	describe('ensureProjectFilesExist (no stub files for non-synced lists)', () => {
		const run = async (
			syncedLists: string[],
			opts?: {
				files?: Array<{ path: string; defaultProjectId?: string }>;
				settings?: Record<string, unknown>;
			},
		) => {
			const create = vi.fn(async () => undefined);
			deleteFileMock.mockClear();
			(getSettings as Mock).mockReturnValue({
				syncedLists,
				projectSchemeEnabled: false,
				abyssTasksFormat: false,
				syncScopeFolders: [],
				newTasksFile: '',
				...(opts?.settings ?? {}),
			});
			(db.files.toArray as Mock).mockResolvedValue(opts?.files ?? [
				{ path: 'Tasks/Inbox.md', defaultProjectId: 'inbox-1' },
				{ path: 'Tasks/KB.md', defaultProjectId: 'kb' },
				{ path: 'Tasks/Loose.md' },
			]);
			(db.projects.toArray as Mock).mockResolvedValue([
				{ id: 'inbox-1', project: { id: 'inbox-1', name: 'Inbox' } },
				{ id: 'kb', project: { id: 'kb', name: 'KB' } },
			]);
			const c = new VaultSyncCoordinator({
				vault: { getAbstractFileByPath: () => null, create, createFolder: vi.fn() },
			} as unknown as never, { manifest: { name: 'TTS', version: 't' } } as unknown as never, undefined);
			await (c as unknown as { ensureProjectFilesExist(): Promise<void> }).ensureProjectFilesExist();
			return { created: create.mock.calls.map(c => (c as unknown[])[0]) as string[] };
		};

		it('re-creates only files of allow-listed lists', async () => {
			expect((await run(['Inbox'])).created).toEqual(['Tasks/Inbox.md']);
		});

		it('creates nothing when syncedLists is empty', async () => {
			expect((await run([])).created).toEqual([]);
		});

		it('UX-STUB-1: Abyss/GTD path creates no list stub files', async () => {
			const { created } = await run(['Inbox'], {
				settings: {
					projectSchemeEnabled: true,
					abyssTasksFormat: true,
					syncScopeFolders: ['00 Inbox/', '10 Projects/'],
				},
			});
			expect(created).toEqual([]);
			expect(deleteFileMock).not.toHaveBeenCalled();
		});

		it('BUG-LIST-STUB-RECREATE: drops parked Dexie path instead of recreating stub', async () => {
			const { created } = await run(['Inbox'], {
				files: [{ path: 'zz-parked-17/30 Tasks/TickTick/TTS-Inbox.md', defaultProjectId: 'inbox-1' }],
			});
			expect(created).toEqual([]);
			expect(deleteFileMock).toHaveBeenCalledWith('zz-parked-17/30 Tasks/TickTick/TTS-Inbox.md');
		});
	});

	describe('confirmDeletions', () => {
		type Privates = {
			confirmDeletions(fileGroups: Map<string, unknown>, movedTaskIds?: Set<string>): Promise<boolean>;
			detachRemoteGoneTasks: Mock;
			plugin: Record<string, unknown>;
			app: { vault: { getAbstractFileByPath: Mock } };
		};
		const privates = (): Privates => coordinator as unknown as Privates;

		beforeEach(() => {
			vi.spyOn(privates(), 'detachRemoteGoneTasks').mockResolvedValue(undefined);
			vi.mocked(getSettings).mockReturnValue({
				SyncTag: undefined,
				SyncProject: undefined,
				tagAndOr: 0,
				defaultProjectId: 'default-project-id',
				keepProjectFolders: false,
				onTickTickDeletion: 'ask',
			} as ReturnType<typeof getSettings>);
		});

		it('ID-TT-GONE-DETACH: detaches remote-gone lines; skips moved ids; no wipe modal', async () => {
			const movedTask = { id: 'moved-1' } as ITask;
			const deletedTask = { id: 'deleted-1' } as ITask;

			const fileGroups = new Map();
			fileGroups.set('OldFile.md', {
				toAdd: [],
				toUpdate: [],
				toDelete: [movedTask, deletedTask],
			});

			const result = await privates().confirmDeletions(fileGroups as Map<string, unknown>, new Set(['moved-1']));

			expect(result).toBe(true);
			expect(privates().detachRemoteGoneTasks).toHaveBeenCalledTimes(1);
			const mine = privates().detachRemoteGoneTasks.mock.calls[0]?.[2] as ITask[];
			expect(mine.map(t => t.id)).toEqual(['deleted-1']);
		});

		it('should no-op when all toDelete are moved tasks', async () => {
			const movedTask = { id: 'moved-1' } as ITask;
			const fileGroups = new Map();
			fileGroups.set('OldFile.md', {
				toAdd: [],
				toUpdate: [],
				toDelete: [movedTask],
			});

			const result = await privates().confirmDeletions(fileGroups as Map<string, unknown>, new Set(['moved-1']));

			expect(result).toBe(true);
			expect(privates().detachRemoteGoneTasks).not.toHaveBeenCalled();
		});

		it('ID-TT-GONE-DETACH: detaches when movedTaskIds omitted', async () => {
			const deletedTask = { id: 'deleted-1' } as ITask;
			const fileGroups = new Map<string, unknown>();
			fileGroups.set('File.md', {
				toAdd: [],
				toUpdate: [],
				toDelete: [deletedTask],
			});

			const result = await privates().confirmDeletions(fileGroups);

			expect(result).toBe(true);
			expect(privates().detachRemoteGoneTasks).toHaveBeenCalled();
		});
	});
});
