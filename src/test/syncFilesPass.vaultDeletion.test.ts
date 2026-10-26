import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSyncRunContext } from '@/sync/SyncRunContext';
import { resetSyncPerfForTests, startSyncPerf, finishSyncPerf } from '@/sync/perf';

const processSyncRemovedTasks = vi.fn(async () => undefined);
const checkFileForNewTasks = vi.fn(async () => undefined);
const checkFileForModifications = vi.fn(async () => undefined);

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

vi.mock('@/settings', () => ({
	getSettings: () => ({ SyncProject: '', autoCleanupDatabase: true }),
}));

vi.mock('@/sync/vault-io', () => ({
	syncCachedRead: vi.fn(async () => ''),
	commitVaultText: vi.fn(async () => undefined),
}));

describe('TECH-SYNC-MODULARIZATION timed vaultDeletion (#66)', () => {
	beforeEach(() => {
		resetSyncPerfForTests();
		processSyncRemovedTasks.mockClear();
		checkFileForNewTasks.mockClear();
		checkFileForModifications.mockClear();
	});

	it('times vaultDeletion separately from syncFiles under the same pass', async () => {
		const { runSyncFilesPass } = await import('@/sync/phases/syncFilesPass');
		const filesToSync = {
			'Projects/A.md': { defaultProjectId: 'p1', TickTickTasks: [] },
		};
		const plugin = {
			app: {
				vault: {
					getMarkdownFiles: () => [],
					getAbstractFileByPath: (path: string) => ({ path }),
				},
			},
			fileMetadataService: {
				getAllFileMetadata: vi.fn(async () => filesToSync),
				checkForDuplicates: vi.fn(async () => ({ duplicates: {}, taskIds: {} })),
				deleteFileMetadata: vi.fn(),
			},
			fileOperation: {
				checkForDuplicates: vi.fn(async () => ({ duplicates: {} })),
			},
			taskModificationDetector: {
				checkFileForNewTasks,
				checkFileForModifications,
			},
			taskDeletionHandler: { processSyncRemovedTasks },
			taskParser: { stripOBSUrl: (t: string) => t },
			projectScheme: { enabled: () => false },
			taskRepository: {
				loadAllLocalTasks: vi.fn(async () => []),
			},
		};
		const service = { tickTickSync: undefined };
		const ctx = createSyncRunContext({ trigger: 'manual', fullSync: false });

		const run = startSyncPerf({ trigger: 'manual', fullSync: false });
		await runSyncFilesPass(
			{ plugin: plugin as never, service: service as never, ctx },
			false,
		);
		const report = finishSyncPerf(run, true);

		expect(processSyncRemovedTasks).toHaveBeenCalledWith(
			['Projects/A.md'],
			ctx,
		);
		expect(report.phaseMs.syncFiles).toBeGreaterThanOrEqual(0);
		expect(report.phaseMs.vaultDeletion).toBeGreaterThanOrEqual(0);
		expect(Object.keys(report.phaseMs)).toEqual(
			expect.arrayContaining(['syncFiles', 'vaultDeletion']),
		);
	});
});
