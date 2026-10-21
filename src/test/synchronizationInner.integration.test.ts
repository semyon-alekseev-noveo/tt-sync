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
import { commentFingerprint } from '@/abyssFormat';
import { FileOperation } from '@/fileOperation';
import { lastSyncPerf } from '@/sync/perf';
import { noteEditorActivity, clearEditorActivity } from '@/services/editorActivity';
import { commitVaultText, readNoteForWrite } from '@/services/vaultWrite';

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
				modifiedTime: '2026-10-18T00:00:00.000+0000', tags: [], commentCount: 1,
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

	it('BUG-COMMENT-NO-PUSH pushes comments when vault mtime is below TickTick checkpoint', async () => {
		const world = await makeWorld({ realDetector: true });
		await db.meta.update('sync', {
			lastFullSync: 5000,
			lastDeltaSync: 5000,
			lastVaultPushWallMs: 1000,
		});
		const line = `- [ ] parent %%[ticktick_id:: ${TASK}]%%`;
		const text = `${line}\n\t- 2026-10-19 20:00: gate-comment-push\n`;
		// Mtime after last push but before checkpoint — old code skipped pre-pull push.
		putFile(world, 'notes/push.md', text, 2000);
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
		expect(world.api.addTaskComment).toHaveBeenCalled();
		const meta = await db.meta.get('sync');
		expect(meta?.lastVaultPushWallMs).toBeGreaterThan(0);
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

	it('TP-IDLE-ZERO idle sync does not probe each quiet task', async () => {
		const world = await makeWorld();
		let reads = 0;
		const vault = (world.service.plugin as { app: { vault: { read: (f: { path: string }) => Promise<string> } } }).app.vault;
		const origRead = vault.read;
		vault.read = async (f: { path: string }) => { reads++; return origRead(f); };
		const ids = ['aaaaaaaaaaaaaaaaaaaaaaaa', 'bbbbbbbbbbbbbbbbbbbbbbbb', 'cccccccccccccccccccccccc'];
		const lines = ids.map(id => `- [ ] same title %%[ticktick_id:: ${id}]%%`).join('\n')
			+ '\n- [ ] local title %%[ticktick_id:: dddddddddddddddddddddddd]%%'
			+ '\n- [ ] gone %%[ticktick_id:: eeeeeeeeeeeeeeeeeeeeeeee]%%\n';
		putFile(world, 'notes/idle.md', lines, 0);
		const quiet = (id: string, title: string, deleted = false) => db.tasks.put({
			localId: `tt:${id}`,
			taskId: id,
			task: {
				id, projectId: 'proj-1', title, content: '', desc: '', status: 0,
				modifiedTime: '2026-10-18T00:00:00.000+0000', tags: [],
			} as never,
			updatedAt: 1000,
			lastVaultSync: 5000,
			file: 'notes/idle.md',
			source: 'ticktick',
			deleted,
		});
		for (const id of ids) await quiet(id, 'same title');
		await quiet('dddddddddddddddddddddddd', 'ticktick title');
		await quiet('eeeeeeeeeeeeeeeeeeeeeeee', 'gone', true);
		const result = await world.service.synchronizationInner(false, 'manual');
		expect(result.ok).toBe(true);
		expect(world.api.getTaskById.mock.calls.length).toBe(0);
		expect(world.api.getTaskComments.mock.calls.length).toBe(0);
		const perf = lastSyncPerf();
		expect(perf?.ok).toBe(true);
		expect(perf?.trigger).toBe('manual');
		expect(perf?.counts.tasksProbedById).toBe(0);
		expect(perf?.counts.commentsFetched).toBe(0);
		expect(perf?.counts.tasksTotal).toBe(5);
		expect(perf?.counts.tasksChecked).toBe(5);
		expect(perf?.counts.tasksDelta).toBe(0);
		expect(perf?.phaseMs.pull).toBeGreaterThanOrEqual(0);
		expect(perf?.phaseMs.vaultReconcile).toBeGreaterThanOrEqual(0);
		expect(perf?.phaseMs.push).toBeGreaterThanOrEqual(0);
		expect(perf?.phaseMs.syncFiles).toBeGreaterThanOrEqual(0);
		expect(perf?.counts.httpByEndpoint.getTaskById ?? 0).toBe(0);
		// One shared plugin read of the note. The closed detach of the deleted line reads the file from disk again; vault.read itself is not cached.
		expect(reads).toBe(2);
		expect(reads).toBeLessThan(5);
	});

	function vaultWriteCount(world: World): { count: () => number } {
		let n = 0;
		const vault = (world.service.plugin as { app: { vault: { process: (...a: unknown[]) => Promise<unknown>; modify: (...a: unknown[]) => Promise<unknown> } } }).app.vault;
		const process = vault.process.bind(vault);
		const modify = vault.modify.bind(vault);
		vault.process = async (...args: unknown[]) => { n++; return process(...args); };
		vault.modify = async (...args: unknown[]) => { n++; return modify(...args); };
		return { count: () => n };
	}

	it('TP-IDLE-ZERO a quiet sync performs zero vault writes', async () => {
		const world = await makeWorld();
		const id = 'aaaaaaaaaaaaaaaaaaaaaaaa';
		putFile(world, 'notes/quiet.md', `- [ ] same title %%[ticktick_id:: ${id}]%%\n`, 0);
		world.metadata['notes/quiet.md'] = { TickTickTasks: [{ taskId: id }], defaultProjectId: 'proj-1' };
		await db.tasks.put({
			localId: `tt:${id}`,
			taskId: id,
			task: {
				id, projectId: 'proj-1', title: 'same title', content: '', desc: '', status: 0,
				modifiedTime: '2026-10-18T00:00:00.000+0000', tags: [], commentCount: 0,
			} as never,
			updatedAt: 1000,
			lastVaultSync: 5000,
			file: 'notes/quiet.md',
			source: 'ticktick',
			deleted: false,
		});
		const writes = vaultWriteCount(world);
		const result = await world.service.synchronizationInner(false, 'manual');
		expect(result.ok).toBe(true);
		expect(world.writes).toEqual([]);
		expect(writes.count()).toBe(0);
		expect(world.api.getTaskById).not.toHaveBeenCalled();
		expect(world.api.getTaskComments).not.toHaveBeenCalled();
	});

	it('TP-NO-CARET-REWRITE does not roll the open line back to the copy just pushed', async () => {
		vi.useFakeTimers({ toFake: ['Date'] });
		try {
			const world = await makeWorld({ realDetector: true });
			const plugin = world.service.plugin as {
				app: {
					vault: { getAbstractFileByPath: (p: string) => unknown };
					workspace: {
						activeEditor: unknown;
						getActiveFile: () => unknown;
						iterateAllLeaves?: (cb: (leaf: { view?: unknown }) => void) => void;
					};
				};
				fileOperation: { synchronizeToVault: (path: string, tasks: { id?: string; title?: string }[], updating: boolean) => Promise<unknown> };
			};
			const path = 'notes/open.md';
			const v1 = `- [ ] title v1 %%[ticktick_id:: ${TASK}]%%`;
			putFile(world, path, `${v1}\n`, 1_000);
			world.metadata[path] = { TickTickTasks: [{ taskId: TASK }], defaultProjectId: 'proj-1' };
			await db.tasks.put({
				localId: `tt:${TASK}`,
				taskId: TASK,
				task: {
					id: TASK, projectId: 'proj-1', title: 'title v1', content: '', desc: '', status: 0,
					lineHash: 'stale', tags: [], items: [], priority: 0,
					modifiedTime: '2026-10-18T00:00:00.000+0000',
				} as never,
				updatedAt: 1000,
				lastVaultSync: 1000,
				file: path,
				source: 'obsidian',
				deleted: false,
			});
			const row = world.files.get(path)!;
			let buffer = `${v1}\n`;
			const transactions: string[] = [];
			const editor = {
				getValue: () => buffer,
				getLine: (i: number) => buffer.split('\n')[i] ?? '',
				lineCount: () => buffer.split('\n').length,
				hasFocus: () => true,
				getCursor: () => ({ line: 0, ch: 4 }),
				transaction: ({ changes }: { changes: { text: string }[] }) => {
					transactions.push(changes.map(c => c.text).join('\n'));
					for (const change of changes) {
						if (change.text) buffer = change.text.endsWith('\n') ? change.text : `${change.text}\n`;
					}
				},
				replaceRange: () => { transactions.push('replaceRange'); },
			};
			plugin.app.workspace.activeEditor = { file: row.file, editor };
			plugin.app.workspace.getActiveFile = () => row.file;
			plugin.app.workspace.iterateAllLeaves = (cb) => { cb({ view: { file: row.file, editor } }); };
			clearEditorActivity();
			await world.service.pushSettledActiveFile(path);
			transactions.length = 0;
			buffer = `- [ ] title v2 %%[ticktick_id:: ${TASK}]%%\n`;
			noteEditorActivity(path);
			vi.advanceTimersByTime(3000);
			plugin.fileOperation.synchronizeToVault = async (filePath, tasks, updating) => {
				world.writes.push({ path: filePath, tasks, updating });
				const file = plugin.app.vault.getAbstractFileByPath(filePath);
				if (!file) return false;
				const snapshot = await readNoteForWrite(plugin.app as never, file as never);
				const next = snapshot.split('\n').map(line => line.includes(TASK) ? v1 : line).join('\n');
				await commitVaultText(plugin.app as never, file as never, snapshot, next);
				return true;
			};
			const result = await world.service.synchronizationInner(false, 'manual');
			expect(result.ok).toBe(true);
			expect(buffer).toContain('title v2');
			expect(transactions.some(text => text.includes('title v1'))).toBe(false);
		} finally {
			vi.useRealTimers();
			clearEditorActivity();
		}
	});

	it('TP-ACTIVE-PUSH-DURING-SYNC treats a save during sync as a local edit next time', async () => {
		const world = await makeWorld({ realDetector: true });
		const path = 'notes/during.md';
		putFile(world, path, `- [ ] quiet %%[ticktick_id:: ${TASK}]%%\n`, 1_000);
		world.metadata[path] = { TickTickTasks: [{ taskId: TASK }], defaultProjectId: 'proj-1' };
		await db.meta.update('sync', { lastFullSync: 0, lastDeltaSync: 0, lastVaultPushWallMs: 0 });
		let second = false;
		let pushesOnSecondPrePull = 0;
		world.api.getUpdatedTasks.mockImplementation(async () => {
			if (!second) {
				// A user save during this sync, after the push marker and before the sync ends.
				// The wait keeps the mtime later than that marker.
				await new Promise(r => setTimeout(r, 5));
				const row = world.files.get(path);
				if (row) row.file.stat.mtime = Date.now();
			}
			world.api.checkpoint = 60;
			return { update: [], delete: [] };
		});
		const first = await world.service.synchronizationInner(false, 'manual');
		expect(first.ok).toBe(true);
		second = true;
		const det = (world.service.plugin as { taskModificationDetector: { checkFileForModifications: (...args: unknown[]) => Promise<void> } }).taskModificationDetector;
		const spy = vi.spyOn(det, 'checkFileForModifications');
		// The mock replaces the method, so call through the prototype to avoid recursion.
		// Count only the pre-pull push. checkDB calls the same method with one argument later.
		spy.mockImplementation(async (...args: unknown[]) => {
			const stack = new Error().stack ?? '';
			if (args[0] === path && args.length === 1 && stack.includes('pushLocalEditsFirst')) pushesOnSecondPrePull++;
			return Object.getPrototypeOf(det).checkFileForModifications.apply(det, args);
		});
		const secondResult = await world.service.synchronizationInner(false, 'manual');
		expect(secondResult.ok).toBe(true);
		expect(pushesOnSecondPrePull).toBeGreaterThan(0);
		spy.mockRestore();
	});

	it('TP-NO-SELF-REPUSH does not rescan a file the plugin just wrote', async () => {
		const world = await makeWorld();
		putFile(world, 'notes/wrote.md', `- [ ] vault title %%[ticktick_id:: ${TASK}]%%\n`, 5_000);
		world.metadata['notes/wrote.md'] = { TickTickTasks: [{ taskId: TASK }], defaultProjectId: 'proj-1' };
		await db.tasks.put({
			localId: `tt:${TASK}`,
			taskId: TASK,
			task: {
				id: TASK, projectId: 'proj-1', title: 'ticktick title', content: '', desc: '', status: 0,
				modifiedTime: '2026-10-18T00:00:00.000+0000', tags: [],
			} as never,
			updatedAt: 1000,
			lastVaultSync: 5000,
			file: 'notes/wrote.md',
			source: 'ticktick',
			deleted: false,
		});
		const plugin = world.service.plugin as {
			fileOperation: { synchronizeToVault: (...args: unknown[]) => Promise<unknown> };
			taskModificationDetector: { checkFileForModifications: ReturnType<typeof vi.fn> };
		};
		plugin.fileOperation.synchronizeToVault = vi.fn(async (path: unknown, tasks: unknown, updating: unknown) => {
			world.writes.push({ path: String(path), tasks: tasks as { id?: string }[], updating: Boolean(updating) });
			const row = world.files.get(String(path));
			if (row) row.file.stat.mtime = Date.now();
			return true;
		});
		const first = await world.service.synchronizationInner(false, 'manual');
		expect(first.ok).toBe(true);
		expect(world.writes.some(w => w.path === 'notes/wrote.md')).toBe(true);
		plugin.taskModificationDetector.checkFileForModifications.mockClear();
		const second = await world.service.synchronizationInner(false, 'manual');
		expect(second.ok).toBe(true);
		// pushLocalEditsFirst calls with the path only. syncFiles still walks registered notes.
		const pushCalls = plugin.taskModificationDetector.checkFileForModifications.mock.calls
			.filter((call: unknown[]) => call.length === 1);
		expect(pushCalls).toEqual([]);
	});

	it('TP-COMMENT-TT-DELETE removes a TickTick-deleted comment and the next sync writes nothing', async () => {
		const world = await makeWorld();
		const plugin = world.service.plugin as {
			app: unknown;
			lastLines?: Map<string, number>;
			fileOperation: unknown;
			fileTaskQueries: { filepathHasDefaultProjectID?: () => Promise<boolean> };
		};
		plugin.lastLines = new Map();
		plugin.fileTaskQueries.filepathHasDefaultProjectID = async () => true;
		const tagged = plugin as { tagService?: Record<string, unknown> };
		tagged.tagService = {
			...(tagged.tagService ?? {}),
			resolveHierarchicalLabel: () => null,
			getLabel: (name: string) => name,
			getParent: () => null,
			isKnownTag: () => true,
			resolveToName: (raw: string) => raw,
			addTag: async () => undefined,
		};
		plugin.fileOperation = new FileOperation(plugin.app as never, plugin as never);
		const body = '2026-10-20 12:00: deleted-in-ticktick';
		const text = `- [ ] same title %%[ticktick_id:: ${TASK}]%%\n\t- ${body}\n`;
		putFile(world, 'notes/a.md', text, 0);
		world.metadata['notes/a.md'] = { TickTickTasks: [{ taskId: TASK }], defaultProjectId: 'proj-1' };
		await upsertCommentMap({
			id: commentMapId(TASK, commentFingerprint(body)),
			taskId: TASK,
			projectId: 'proj-1',
			fingerprint: commentFingerprint(body),
			ticktickCommentId: 'c-old',
			body,
		});
		await db.tasks.put({
			localId: `tt:${TASK}`,
			taskId: TASK,
			task: {
				id: TASK, projectId: 'proj-1', title: 'same title', content: '', desc: '', status: 0,
				modifiedTime: '2026-10-18T00:00:00.000+0000', tags: [], commentCount: 0,
			} as never,
			updatedAt: 1000,
			lastVaultSync: 5000,
			file: 'notes/a.md',
			source: 'ticktick',
			deleted: false,
		});
		world.api.getTaskComments.mockResolvedValue([]);
		const writes = vaultWriteCount(world);
		const first = await world.service.synchronizationInner(false, 'manual');
		expect(first.ok).toBe(true);
		const after = world.files.get('notes/a.md')?.text ?? '';
		if (after.includes('deleted-in-ticktick')) {
			const log = (await import('@/utils/logger')).default as { error: { mock: { calls: unknown[] } } };
			throw new Error(`writes=${writes.count()} err=${JSON.stringify(log.error.mock.calls).slice(0, 2500)}`);
		}
		expect(after).not.toContain('deleted-in-ticktick');
		expect(writes.count()).toBeGreaterThan(0);
		const afterFirst = writes.count();
		world.api.getTaskComments.mockClear();
		const second = await world.service.synchronizationInner(false, 'manual');
		expect(second.ok).toBe(true);
		expect(writes.count()).toBe(afterFirst);
		expect(world.api.getTaskComments).not.toHaveBeenCalled();
	}, 20_000);
});
