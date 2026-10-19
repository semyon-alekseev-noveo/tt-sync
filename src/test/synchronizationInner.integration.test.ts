/**
 * Full synchronizationInner against a fake TickTick API and fake-indexeddb.
 * Covers pull, push, comments, deletion, and a failed pull.
 */
import 'fake-indexeddb/auto';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { TFile } from 'obsidian';
import { db, initDB } from '@/db/dexie';
import { TickTickService } from '@/services';
import { VaultSyncCoordinator } from '@/services/VaultSyncCoordinator';
import { TaskModificationDetector } from '@/services/TaskModificationDetector';
import { TaskRepository } from '@/repositories/TaskRepository';
import { TaskParser } from '@/taskParser';
import { DEFAULT_SETTINGS, getSettings, updateSettings } from '@/settings';
import { upsertCommentMap, listCommentMapsForTask, commentMapId } from '@/db/taskCommentMaps';

vi.mock('@/utils/logger', () => ({
	default: { debug: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), trace: vi.fn() },
}));

class MemFile extends TFile {
	path: string;
	name: string;
	basename: string;
	stat: { mtime: number; ctime: number; size: number };
	constructor(path: string, mtime = Date.now()) {
		super();
		this.path = path;
		this.name = path.split('/').pop() ?? path;
		this.basename = this.name.replace(/\.md$/, '');
		this.stat = { mtime, ctime: 0, size: 1 };
	}
}

const TASK = 'abcdefabcdefabcdefabcdef';
const savedSettings = { ...getSettings() };

interface World {
	service: TickTickService;
	api: {
		checkpoint: number;
		getUpdatedTasks: ReturnType<typeof vi.fn>;
		getTaskById: ReturnType<typeof vi.fn>;
		getTaskComments: ReturnType<typeof vi.fn>;
		addTaskComment: ReturnType<typeof vi.fn>;
		deleteTaskComment: ReturnType<typeof vi.fn>;
		updateTask: ReturnType<typeof vi.fn>;
		deleteTask: ReturnType<typeof vi.fn>;
	};
	writes: { path: string; tasks: { id?: string }[]; updating: boolean }[];
	files: Map<string, { file: MemFile; text: string }>;
	metadata: Record<string, { TickTickTasks: { taskId: string }[]; defaultProjectId?: string }>;
}

function putFile(world: World, path: string, text: string, mtime = Date.now()) {
	world.files.set(path, { file: new MemFile(path, mtime), text });
}

async function makeWorld(opts?: { realDetector?: boolean }): Promise<World> {
	const files = new Map<string, { file: MemFile; text: string }>();
	const metadata: World['metadata'] = {};
	const writes: World['writes'] = [];
	const api = {
		checkpoint: 10,
		getUpdatedTasks: vi.fn(async () => {
			api.checkpoint = 50;
			return { update: [] as unknown[], delete: [] as unknown[] };
		}),
		getTaskById: vi.fn(async (id: string) => ({
			id, projectId: 'proj-1', title: 'same title', content: '', desc: '', status: 0, tags: [], items: [],
		})),
		getTaskComments: vi.fn(async () => [] as { id: string; title: string }[]),
		addTaskComment: vi.fn(async (_p: string, _t: string, body: string) => ({ id: 'c-new', title: body })),
		deleteTaskComment: vi.fn(async () => true),
		updateTask: vi.fn(async (task: { id: string }) => ({ ...task, modifiedTime: '2026-10-19T12:00:00.000+0000' })),
		deleteTask: vi.fn(async () => true),
		moveTaskProject: vi.fn(async () => true),
		getAllTasks: vi.fn(async () => ({ update: [] })),
		plugin: undefined as unknown,
	};

	const plugin = {
		syncRunning: false,
		syncActivity: {
			beginFull: () => undefined,
			setFullStep: () => undefined,
			endFull: () => undefined,
			runInline: async (_label: string, fn: () => Promise<unknown>) => fn(),
		},
		applyExternalSettings: async () => undefined,
		checkSettingsMigration: async () => undefined,
		saveSettings: async () => undefined,
		taskCache: { fill: async () => undefined, clear: () => undefined },
		tickTickRestAPI: api,
		redo: undefined,
		projectScheme: {
			enabled: () => false,
			isParentTask: () => false,
			isParentId: () => false,
			ensurePushContext: async () => undefined,
			run: async () => undefined,
			noteForParent: () => undefined,
		},
		dateMan: {
			parseDates: () => ({}),
			stripDatesFromLine: (s: string) => s,
			formatDateToISO: () => '2026-10-19T00:00:00.000+0000',
			addDatesToLine: (s: string) => s,
			areDatesChanged: () => false,
			addDateHolderToTask: () => undefined,
		},
		fileTaskQueries: { getDefaultProjectIdForFilepath: async () => 'proj-1' },
		taskRepository: new TaskRepository(),
		fileMetadataService: {
			getAllFileMetadata: async () => metadata,
			checkForDuplicates: async () => ({ duplicates: {}, taskIds: {} }),
			deleteFileMetadata: vi.fn(),
			clearTaskFile: vi.fn(),
			getFilepathForTask: async (id: string) => {
				const row = await db.tasks.where('taskId').equals(id).first();
				return row?.file || '';
			},
			getDeletionItems: async () => [],
		},
		fileOperation: {
			isMarkdownFile: (name: string) => name.endsWith('.md'),
			readFileContent: async (file: { path: string }) => files.get(file.path)?.text ?? '',
			checkForDuplicates: async () => ({ duplicates: {} }),
			synchronizeToVault: vi.fn(async (path: string, tasks: { id?: string }[], updating: boolean) => {
				writes.push({ path, tasks, updating });
				return true;
			}),
			deleteTasksFromSpecificFile: vi.fn(async () => []),
		},
		taskDeletionHandler: { processSyncRemovedTasks: vi.fn(async () => undefined), checkFileForDeletedTasks: vi.fn() },
		folderSyncService: undefined,
		tagService: { saveTags: async () => undefined, loadFromDb: async () => undefined },
	} as unknown as ConstructorParameters<typeof TickTickService>[0];
	api.plugin = plugin;

	const app = {
		metadataCache: { getFileCache: () => ({ listItems: [] }) },
		vault: {
			getMarkdownFiles: () => [...files.values()].map(f => f.file),
			getAbstractFileByPath: (p: string) => files.get(p)?.file,
			read: async (f: { path: string }) => files.get(f.path)?.text ?? '',
			cachedRead: async (f: { path: string }) => files.get(f.path)?.text ?? '',
			process: async (f: { path: string }, fn: (d: string) => string) => {
				const row = files.get(f.path);
				if (row) row.text = fn(row.text);
			},
			modify: async (f: { path: string }, text: string) => {
				const row = files.get(f.path);
				if (row) row.text = text;
			},
			adapter: { read: async () => { throw new Error('no abyss preset'); } },
		},
		workspace: { getActiveFile: () => null },
	};
	(plugin as { app: unknown }).app = app;
	const parser = new TaskParser(app as never, plugin as never);
	(plugin as { taskParser: TaskParser }).taskParser = parser;
	parser.plugin = plugin as never;

	const world: World = { service: undefined as never, api, writes, files, metadata };
	(plugin as { vaultSyncCoordinator: VaultSyncCoordinator }).vaultSyncCoordinator =
		new VaultSyncCoordinator(app as never, plugin as never);
	if (opts?.realDetector) {
		(plugin as { taskModificationDetector: TaskModificationDetector }).taskModificationDetector =
			new TaskModificationDetector(app as never, plugin as never);
	} else {
		(plugin as { taskModificationDetector: { checkFileForModifications: ReturnType<typeof vi.fn>; checkFileForNewTasks: ReturnType<typeof vi.fn> } }).taskModificationDetector = {
			checkFileForModifications: vi.fn(async () => undefined),
			checkFileForNewTasks: vi.fn(async () => undefined),
		};
	}
	const service = new TickTickService(plugin as never);
	(plugin as { service: TickTickService }).service = service;
	world.service = service;
	return world;
}

describe('synchronizationInner integration', () => {
	beforeAll(async () => {
		updateSettings({
			...DEFAULT_SETTINGS,
			vaultName: 'vitest-sync-inner',
			token: 'test-token',
			checkPoint: 10,
			syncedLists: ['proj-1'],
			syncScopeFolders: ['notes/'],
			syncNotes: true,
			abyssTasksFormat: true,
			syncAbyssCommentsViaApi: true,
			syncNoteContextTags: false,
			defaultProjectId: 'proj-1',
			inboxID: 'proj-1',
			onTickTickDeletion: 'cancel',
			autoCleanupDatabase: true,
			fileLinksInTickTick: 'noLink',
			stopInjectingTickTickTag: true,
			tagMappings: [],
			tagListMappings: [],
			devices: [],
		}, { persist: false });
		await initDB();
	});

	afterAll(() => {
		updateSettings(savedSettings, { persist: false });
	});

	beforeEach(async () => {
		await db.tasks.clear();
		await db.taskCommentMaps.clear();
		await db.files.clear();
		await db.projects.clear();
		await db.journal.clear();
		await db.projects.put({
			id: 'proj-1',
			project: { id: 'proj-1', name: 'TTS-Inbox', modifiedTime: '2020-01-01T00:00:00.000+0000' } as never,
		});
		await db.meta.update('sync', { lastFullSync: 1000, lastDeltaSync: 1000 });
		updateSettings({ checkPoint: 10 }, { persist: false });
	});

	it('pulls a remote task into dexie and asks the vault to add it', async () => {
		const world = await makeWorld();
		world.api.getUpdatedTasks.mockImplementation(async () => {
			world.api.checkpoint = 80;
			return {
				update: [{
					id: TASK,
					projectId: 'proj-1',
					title: 'from ticktick',
					content: '',
					status: 0,
					modifiedTime: '2026-10-19T01:00:00.000+0000',
					tags: [],
				}],
				delete: [],
			};
		});
		const result = await world.service.synchronizationInner(false, 'manual');
		expect(result).toEqual({ ok: true });
		const row = await db.tasks.where('taskId').equals(TASK).first();
		expect(row?.task.title).toBe('from ticktick');
		expect(row?.deleted).toBeFalsy();
		const meta = await db.meta.get('sync');
		expect(meta?.lastDeltaSync).toBe(80);
		expect(world.writes.some(w => w.tasks.some(t => t.id === TASK))).toBe(true);
	});

	it('marks a remote deletion and drops taskCommentMaps', async () => {
		const world = await makeWorld();
		putFile(world, 'notes/a.md', `- [ ] gone %%[ticktick_id:: ${TASK}]%%\n`);
		await db.tasks.put({
			localId: `tt:${TASK}`,
			taskId: TASK,
			task: { id: TASK, projectId: 'proj-1', title: 'gone', content: '', status: 0, modifiedTime: '2026-10-18T00:00:00.000+0000' } as never,
			updatedAt: 500,
			lastVaultSync: 500,
			file: 'notes/a.md',
			source: 'ticktick',
			deleted: false,
		});
		await upsertCommentMap({
			id: commentMapId(TASK, 'note'),
			taskId: TASK,
			projectId: 'proj-1',
			fingerprint: 'note',
			ticktickCommentId: 'c1',
			body: 'note',
		});
		world.api.getUpdatedTasks.mockImplementation(async () => {
			world.api.checkpoint = 90;
			return { update: [], delete: [TASK] };
		});
		const result = await world.service.synchronizationInner(false, 'manual');
		expect(result.ok).toBe(true);
		const row = await db.tasks.where('taskId').equals(TASK).first();
		expect(row?.deleted).toBe(true);
		expect(await listCommentMapsForTask(TASK)).toEqual([]);
	});

	it('BUG-SYNC-SILENT-FAIL returns a failed result and does not advance the checkpoint', async () => {
		const world = await makeWorld();
		world.api.getUpdatedTasks.mockRejectedValue(new Error('network down'));
		const result = await world.service.synchronizationInner(false, 'manual');
		expect(result).toEqual({ ok: false, error: 'network down' });
		const meta = await db.meta.get('sync');
		expect(meta?.lastDeltaSync).toBe(1000);
		expect(getSettings().checkPoint).toBe(10);
	});

	it('pushes a locally edited file before pull', async () => {
		const world = await makeWorld();
		world.metadata['notes/push.md'] = { TickTickTasks: [{ taskId: TASK }], defaultProjectId: 'proj-1' };
		putFile(world, 'notes/push.md', `- [ ] parent %%[ticktick_id:: ${TASK}]%%\n`, Date.now());
		const result = await world.service.synchronizationInner(false, 'manual');
		expect(result.ok).toBe(true);
		const detector = (world.service.plugin as { taskModificationDetector: { checkFileForModifications: ReturnType<typeof vi.fn> } }).taskModificationDetector;
		expect(detector.checkFileForModifications).toHaveBeenCalledWith('notes/push.md');
	});

	it('BUG-PULL-COMMENT-STALE rewrites the vault line when TickTick has an API comment the note lacks', async () => {
		const world = await makeWorld();
		const line = `- [ ] same title %%[ticktick_id:: ${TASK}]%%\n`;
		putFile(world, 'notes/a.md', line);
		world.metadata['notes/a.md'] = { TickTickTasks: [{ taskId: TASK }], defaultProjectId: 'proj-1' };
		await db.tasks.put({
			localId: `tt:${TASK}`,
			taskId: TASK,
			task: {
				id: TASK, projectId: 'proj-1', title: 'same title', content: '', desc: '', status: 0,
				modifiedTime: '2026-10-18T00:00:00.000+0000', tags: [],
			} as never,
			updatedAt: 1000,
			lastVaultSync: 5000,
			file: 'notes/a.md',
			source: 'ticktick',
			deleted: false,
		});
		world.api.getTaskComments.mockResolvedValue([{ id: 'c1', title: 'from ticktick' }]);
		const result = await world.service.synchronizationInner(false, 'manual');
		expect(result.ok).toBe(true);
		expect(world.api.getTaskComments).toHaveBeenCalled();
		expect(world.writes.some(w => w.updating && w.tasks.some(t => t.id === TASK))).toBe(true);
	});

	it('BUG-COMMENT-INLINE push path sends a child comment through synchronizationInner', async () => {
		const world = await makeWorld({ realDetector: true });
		const line = `- [ ] parent %%[ticktick_id:: ${TASK}]%%`;
		const text = `${line}\n\t- 2026-10-19 20:00: hello from the note\n`;
		putFile(world, 'notes/push.md', text, Date.now());
		world.metadata['notes/push.md'] = { TickTickTasks: [{ taskId: TASK }], defaultProjectId: 'proj-1' };
		await db.tasks.put({
			localId: `tt:${TASK}`,
			taskId: TASK,
			task: {
				id: TASK, projectId: 'proj-1', title: 'parent', content: '', desc: '', status: 0,
				lineHash: 'stale', tags: [], items: [], priority: 0,
				modifiedTime: '2026-10-18T00:00:00.000+0000',
			} as never,
			updatedAt: 1000,
			lastVaultSync: 1000,
			file: 'notes/push.md',
			source: 'obsidian',
			deleted: false,
		});
		const result = await world.service.synchronizationInner(false, 'manual');
		expect(result.ok).toBe(true);
		const pushed = world.api.updateTask.mock.calls.length + world.api.addTaskComment.mock.calls.length;
		expect(pushed).toBeGreaterThan(0);
	});
});
