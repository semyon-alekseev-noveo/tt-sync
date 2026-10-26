import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSyncRunContext } from '@/sync/SyncRunContext';
import {
	assessDualStoreDrift,
	formatDualStoreDriftLog,
	type DualStoreTaskRef,
} from '@/sync/dualStoreDrift';
import log from '@/utils/logger';

const MISSING = '6700aaaabbbbccccdddd0001';
const EMPTY = '6700aaaabbbbccccdddd0002';
const MOVED = '6700aaaabbbbccccdddd0003';
const ALIGNED = '6700aaaabbbbccccdddd0004';
const DELETED = '6700aaaabbbbccccdddd0005';
const ORPHAN = '6700aaaabbbbccccdddd0006';

const fileTexts = vi.hoisted(() => new Map<string, string>());
const settingsState = vi.hoisted(() => ({
	SyncProject: '' as string,
	autoCleanupDatabase: true,
}));

vi.mock('@/utils/logger', () => ({
	default: { debug: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('@/settings', () => ({
	getSettings: () => settingsState,
}));

vi.mock('@/sync/vault-io', () => ({
	syncCachedRead: vi.fn(async (_vault: unknown, file: { path: string }) => fileTexts.get(file.path) ?? ''),
	commitVaultText: vi.fn(async () => undefined),
}));

vi.mock('@/modals/TaskDeletionModal', () => ({
	clearPendingDeletions: vi.fn(),
	TaskDeletionModal: class {
		showModal = vi.fn(async () => ({ confirmed: false }));
	},
}));

vi.mock('@/modals/FoundDuplicateTasksModal', () => ({
	FoundDuplicateTasksModal: class {
		showModal = vi.fn(async () => true);
	},
}));

vi.mock('@/modals/CleanupDatabaseModal', () => ({
	CleanupDatabaseModal: class {
		showModal = vi.fn(async () => false);
	},
}));

function marker(id: string, title = 'task'): string {
	return `- [ ] ${title} %%[ticktick_id:: ${id}]%%`;
}

function task(taskId: string, file: string, deleted = false): DualStoreTaskRef {
	return { taskId, file, deleted };
}

describe('RISK-DUAL-STORE', () => {
	beforeEach(() => {
		fileTexts.clear();
		settingsState.SyncProject = '';
		settingsState.autoCleanupDatabase = true;
		vi.mocked(log.warn).mockClear();
		vi.mocked(log.error).mockClear();
	});

	it('RISK-DUAL-STORE counts a tasks.file path missing from files', () => {
		const tasks = [task(MISSING, 'notes/missing.md')];
		const notes = [{ path: 'notes/missing.md', text: marker(MISSING, 'SECRET-TITLE') }];
		const report = assessDualStoreDrift({
			tasks,
			filePaths: ['notes/other.md'],
			notes,
		});

		expect(report.fileMissingFromFiles).toBe(1);
		expect(report.emptyFileWithMarker).toBe(0);
		expect(report.markerInDifferentFile).toBe(0);
		expect(tasks[0].file).toBe('notes/missing.md');
		const line = formatDualStoreDriftLog(report);
		expect(line).toContain('RISK-DUAL-STORE:');
		expect(line).toContain('fileMissingFromFiles=1');
		expect(line).toContain(MISSING);
		expect(line).toContain('notes/missing.md');
		expect(line).not.toContain('SECRET-TITLE');
	});

	it('RISK-DUAL-STORE counts an empty tasks.file when the note has the marker', () => {
		const report = assessDualStoreDrift({
			tasks: [
				task(EMPTY, ''),
				task('6700aaaabbbbccccdddd0007', '   '),
				task(ALIGNED, ''),
			],
			filePaths: ['Inbox/orphan.md', 'Inbox/blank.md'],
			notes: [
				{ path: 'Inbox/orphan.md', text: marker(EMPTY) },
				{ path: 'Inbox/blank.md', text: marker('6700aaaabbbbccccdddd0007') },
			],
		});

		expect(report.emptyFileWithMarker).toBe(2);
		expect(report.fileMissingFromFiles).toBe(0);
		expect(report.markerInDifferentFile).toBe(0);
		expect(report.samples.emptyFileWithMarker.map(s => s.taskId)).toEqual([
			EMPTY,
			'6700aaaabbbbccccdddd0007',
		]);
	});

	it('RISK-DUAL-STORE counts a marker that is only in a different file', () => {
		const report = assessDualStoreDrift({
			tasks: [task(MOVED, 'notes/recorded.md')],
			filePaths: ['notes/recorded.md', 'notes/other.md'],
			notes: [
				{ path: 'notes/recorded.md', text: '- [ ] no marker here' },
				{ path: 'notes/other.md', text: marker(MOVED) },
			],
		});

		expect(report.markerInDifferentFile).toBe(1);
		expect(report.fileMissingFromFiles).toBe(0);
		expect(report.emptyFileWithMarker).toBe(0);
		expect(report.samples.markerInDifferentFile[0]).toMatchObject({
			taskId: MOVED,
			tasksFile: 'notes/recorded.md',
			markerPaths: ['notes/other.md'],
		});
	});

	it('RISK-DUAL-STORE does not count an aligned task or a second copy beside the recorded file', () => {
		const report = assessDualStoreDrift({
			tasks: [
				task(ALIGNED, 'notes/ok.md'),
				task(MOVED, 'notes/recorded.md'),
				task(EMPTY, ''),
				task(MISSING, 'notes/present.md'),
			],
			filePaths: ['notes/ok.md', 'notes/recorded.md', 'notes/present.md', 'notes/copy.md'],
			notes: [
				{ path: 'notes/ok.md', text: marker(ALIGNED) },
				{ path: 'notes/recorded.md', text: marker(MOVED) },
				{ path: 'notes/copy.md', text: marker(MOVED) },
				{ path: 'notes/present.md', text: '- [ ] local only' },
			],
		});

		expect(report).toMatchObject({
			fileMissingFromFiles: 0,
			emptyFileWithMarker: 0,
			markerInDifferentFile: 0,
		});
		expect(formatDualStoreDriftLog(report)).toBeNull();
	});

	it('RISK-DUAL-STORE counts file-missing and a different-file marker on the same task', () => {
		const tasks = [task(MISSING, 'notes/missing.md')];
		const filePaths = ['notes/other.md'];
		const notes = [{ path: 'notes/other.md', text: marker(MISSING) }];
		const before = JSON.stringify({ tasks, filePaths, notes });
		const report = assessDualStoreDrift({ tasks, filePaths, notes });

		expect(report.fileMissingFromFiles).toBe(1);
		expect(report.markerInDifferentFile).toBe(1);
		expect(report.emptyFileWithMarker).toBe(0);
		expect(JSON.stringify({ tasks, filePaths, notes })).toBe(before);
	});

	it('RISK-DUAL-STORE ignores deleted tasks, loose fragments, orphan markers, and non-canonical ids', () => {
		const report = assessDualStoreDrift({
			tasks: [
				task(DELETED, 'notes/gone.md', true),
				task(EMPTY, ''),
				task(MOVED, 'notes/recorded.md'),
			],
			filePaths: ['notes/recorded.md'],
			notes: [
				{ path: 'notes/gone.md', text: marker(DELETED) },
				{ path: 'Inbox/loose.md', text: `ticktick_id:: ${EMPTY}` },
				{ path: 'Inbox/short.md', text: '%%[ticktick_id:: abc]%%' },
				{ path: 'Inbox/orphan.md', text: marker(ORPHAN) },
				{
					path: 'notes/frontmatter.md',
					text: `---\nticktick_id: ${MOVED}\n---\n- [ ] project line`,
				},
			],
		});

		expect(report).toMatchObject({
			fileMissingFromFiles: 0,
			emptyFileWithMarker: 0,
			markerInDifferentFile: 0,
		});
	});

	it('RISK-DUAL-STORE caps each logged sample at five task ids', () => {
		const tasks = Array.from({ length: 6 }, (_, i) => task(
			`6700aaaabbbbccccdddd100${i}`,
			`notes/missing-${i}.md`,
		));
		const report = assessDualStoreDrift({
			tasks,
			filePaths: [],
			notes: [],
		});
		const line = formatDualStoreDriftLog(report) ?? '';

		expect(report.fileMissingFromFiles).toBe(6);
		expect(report.samples.fileMissingFromFiles).toHaveLength(5);
		expect(line).toContain('6700aaaabbbbccccdddd1000');
		expect(line).not.toContain('6700aaaabbbbccccdddd1005');
		expect(line).toContain('+1');
	});

	it('RISK-DUAL-STORE logs the three counts on the sync file pass and does not write tasks or files', async () => {
		const { runSyncFilesPass } = await import('@/sync/phases/syncFilesPass');
		const filesToSync = {
			'notes/recorded.md': { TickTickTasks: [] as { taskId: string }[], TickTickCount: 0, defaultProjectId: 'p1' },
			'notes/other.md': { TickTickTasks: [] as { taskId: string }[], TickTickCount: 0, defaultProjectId: 'p1' },
			'Inbox/orphan.md': { TickTickTasks: [] as { taskId: string }[], TickTickCount: 0, defaultProjectId: 'p1' },
		};
		const rows = [
			{ taskId: MISSING, task: { id: MISSING, title: 'SECRET-TITLE' }, file: 'notes/missing.md', deleted: false },
			{ taskId: EMPTY, task: { id: EMPTY, title: 'empty' }, file: '', deleted: false },
			{ taskId: MOVED, task: { id: MOVED, title: 'moved' }, file: 'notes/recorded.md', deleted: false },
		];
		fileTexts.set('notes/missing.md', marker(MISSING, 'SECRET-TITLE'));
		fileTexts.set('Inbox/orphan.md', marker(EMPTY, 'SECRET-TITLE'));
		fileTexts.set('notes/recorded.md', '- [ ] stale line');
		fileTexts.set('notes/other.md', marker(MOVED, 'SECRET-TITLE'));
		const filesBefore = JSON.stringify(filesToSync);
		const filesBeforeRows = rows.map(row => row.file);
		const updateFileMetadata = vi.fn();
		const deleteFileMetadata = vi.fn();
		const plugin = {
			app: {
				vault: {
					getMarkdownFiles: () => [...fileTexts.keys()].map(path => ({ path })),
					getAbstractFileByPath: (path: string) => ({ path }),
				},
			},
			fileMetadataService: {
				getAllFileMetadata: vi.fn(async () => filesToSync),
				checkForDuplicates: vi.fn(async () => ({ duplicates: {}, taskIds: {} })),
				updateFileMetadata,
				deleteFileMetadata,
			},
			fileOperation: {
				checkForDuplicates: vi.fn(async () => ({ duplicates: {} })),
			},
			taskModificationDetector: {
				checkFileForNewTasks: vi.fn(async () => undefined),
				checkFileForModifications: vi.fn(async () => undefined),
			},
			taskDeletionHandler: { processSyncRemovedTasks: vi.fn(async () => undefined) },
			taskParser: { stripOBSUrl: (t: string) => t },
			projectScheme: { enabled: () => false },
			taskRepository: {
				loadAllLocalTasks: vi.fn(async () => rows),
				upsertTask: vi.fn(),
			},
		};

		await runSyncFilesPass(
			{
				plugin: plugin as never,
				service: { tickTickSync: undefined } as never,
				ctx: createSyncRunContext({ trigger: 'manual', fullSync: false }),
			},
			false,
		);

		const line = vi.mocked(log.warn).mock.calls.map(call => String(call[0])).find(entry => entry.includes('RISK-DUAL-STORE:'));
		expect(line).toContain('fileMissingFromFiles=1');
		expect(line).toContain('emptyFileWithMarker=1');
		expect(line).toContain('markerInDifferentFile=1');
		expect(line).not.toContain('SECRET-TITLE');
		expect(JSON.stringify(filesToSync)).toBe(filesBefore);
		expect(filesToSync['notes/recorded.md'].TickTickTasks).toEqual([]);
		expect(rows.map(row => row.file)).toEqual(filesBeforeRows);
		expect(updateFileMetadata).not.toHaveBeenCalled();
		expect(deleteFileMetadata).not.toHaveBeenCalled();
		expect(plugin.taskRepository.upsertTask).not.toHaveBeenCalled();
	});

	it('RISK-DUAL-STORE does not warn when the three counts are zero', async () => {
		const { runSyncFilesPass } = await import('@/sync/phases/syncFilesPass');
		settingsState.SyncProject = 'not-this-project';
		fileTexts.set('notes/ok.md', marker(ALIGNED));
		const plugin = {
			app: {
				vault: {
					getMarkdownFiles: () => [{ path: 'notes/ok.md' }],
					getAbstractFileByPath: (path: string) => ({ path }),
				},
			},
			fileMetadataService: {
				getAllFileMetadata: vi.fn(async () => ({
					'notes/ok.md': { TickTickTasks: [], TickTickCount: 0, defaultProjectId: 'p1' },
				})),
				checkForDuplicates: vi.fn(async () => ({ duplicates: {}, taskIds: {} })),
				updateFileMetadata: vi.fn(),
				deleteFileMetadata: vi.fn(),
			},
			fileOperation: {
				checkForDuplicates: vi.fn(async () => ({ duplicates: {} })),
			},
			taskModificationDetector: {
				checkFileForNewTasks: vi.fn(async () => undefined),
				checkFileForModifications: vi.fn(async () => undefined),
			},
			taskDeletionHandler: { processSyncRemovedTasks: vi.fn(async () => undefined) },
			taskParser: { stripOBSUrl: (t: string) => t },
			projectScheme: { enabled: () => false },
			taskRepository: {
				loadAllLocalTasks: vi.fn(async () => [
					{ taskId: ALIGNED, task: { id: ALIGNED }, file: 'notes/ok.md', deleted: false },
					{ taskId: DELETED, task: { id: DELETED }, file: 'notes/gone.md', deleted: true },
				]),
			},
		};

		await runSyncFilesPass(
			{
				plugin: plugin as never,
				service: { tickTickSync: undefined } as never,
				ctx: createSyncRunContext({ trigger: 'manual', fullSync: false }),
			},
			false,
		);

		const warned = vi.mocked(log.warn).mock.calls.map(call => String(call[0]));
		expect(warned.some(entry => entry.includes('RISK-DUAL-STORE'))).toBe(false);
	});
});
