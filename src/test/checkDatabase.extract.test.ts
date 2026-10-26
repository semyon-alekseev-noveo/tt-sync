import { describe, it, expect, vi } from 'vitest';

vi.mock('@/settings', () => ({
	getSettings: () => ({
		keepProjectFolders: false,
		autoCleanupDatabase: true,
		taskLinksInObsidian: 'none',
	}),
	getDefaultFolder: () => 'Projects',
}));

vi.mock('@/db/dexie', () => ({
	db: {
		projectGroups: { clear: vi.fn(), bulkPut: vi.fn() },
		projects: { get: vi.fn() },
	},
}));

vi.mock('@/db/files', () => ({
	getAllFiles: vi.fn(async () => []),
	getFile: vi.fn(),
	upsertFile: vi.fn(),
}));

vi.mock('@/utils/locks', () => ({
	doWithLock: vi.fn((_n: string, fn: () => Promise<unknown>) => fn()),
}));

describe('TECH-SYNC-MODULARIZATION checkDatabase extract (#66)', () => {
	it('runCheckDatabase completes with empty vault/metadata', async () => {
		const { runCheckDatabase } = await import('@/services/checkDatabase');
		const { getAllFiles } = await import('@/db/files');
		(getAllFiles as ReturnType<typeof vi.fn>).mockResolvedValue([]);

		const host = {
			plugin: {
				syncActivity: {
					runInline: vi.fn(async (_label: string, fn: () => Promise<void>) => fn()),
				},
				app: {
					vault: {
						getMarkdownFiles: () => [],
						getAbstractFileByPath: () => null,
					},
				},
				folderSyncService: undefined,
				fileMetadataService: {
					getAllFileMetadata: vi.fn(async () => ({})),
					getFileMetadata: vi.fn(),
					deleteFileMetadata: vi.fn(),
					getFilepathForProjectId: vi.fn(async () => ''),
				},
				taskRepository: {
					loadLocalTaskById: vi.fn(),
					upsertTask: vi.fn(),
				},
				fileTaskQueries: {
					findDuplicateTasks: vi.fn(async () => []),
				},
				tickTickRestAPI: {
					getAllTasks: vi.fn(async () => ({ update: [] })),
				},
				taskParser: { stripOBSUrl: (t: string) => t },
				taskModificationDetector: {
					checkFileForNewTasks: vi.fn(),
					checkFileForModifications: vi.fn(),
				},
				taskOperationsService: { updateTaskContentForFile: vi.fn() },
				fileOperation: undefined,
				saveSettings: vi.fn(async () => undefined),
			},
			api: { getProjectGroups: vi.fn(async () => []) },
			fileOperation: undefined,
			getProjects: vi.fn(async () => []),
			registerNewVaultFile: vi.fn(async () => undefined),
		};

		await expect(runCheckDatabase(host as never)).resolves.toBeUndefined();
		expect(host.plugin.syncActivity.runInline).toHaveBeenCalled();
		expect(host.getProjects).toHaveBeenCalled();
	});
});
