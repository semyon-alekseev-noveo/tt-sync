/**
 * BUG-RESET-CACHE-DELETE: after Reset (empty Dexie / checkPoint 0), a vault
 * `ticktick_id` that is missing from Dexie and 404s on TickTick must NOT open
 * the «task not found in local cache» deletion modal or strip the line.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getSettings } from '@/settings';
import { TaskParser } from '@/taskParser';

vi.mock('@/utils/logger', () => ({
	default: { debug: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));
vi.mock('@/db/projects', () => ({
	getAllProjects: vi.fn().mockResolvedValue([{ id: 'in', name: 'TTS-Inbox' }]),
}));
vi.mock('@/abyssCommentSync', async importOriginal => {
	const actual = await importOriginal<typeof import('@/abyssCommentSync')>();
	return {
		...actual,
		syncAbyssCommentsToTickTick: vi.fn().mockResolvedValue(true),
		useAbyssCommentsApi: () => false,
	};
});

import { TFile } from 'obsidian';
import { TaskModificationDetector } from '@/services/TaskModificationDetector';
import { NewFileMap } from '@/services/NewFileMap';
import { shouldSkipOrphanVaultLineDelete } from '@/sync/massDeleteGuard';

function mockTFile(path: string): TFile {
	const f = { path } as TFile;
	Object.setPrototypeOf(f, TFile.prototype);
	return f;
}

describe('BUG-RESET-CACHE-DELETE', () => {
	const taskId = 'aaaaaaaaaaaaaaaaaaaaaaaa';
	const filepath = '30 Tasks/301 Noveo_tasks/DON-253.md';

	beforeEach(() => {
		Object.assign(getSettings() as Record<string, unknown>, {
			syncNotes: true,
			abyssTasksFormat: true,
			syncAbyssCommentsViaApi: false,
			syncScopeFolders: ['30 Tasks/'],
			syncedLists: ['TTS-Inbox'],
			SyncTag: 'tts-test',
			checkPoint: 0,
			tagListMappings: [],
			tagMappings: [],
		});
	});

	it('helper: empty Dexie / checkPoint 0 / sticky bootstrap skip vault-line strip', () => {
		expect(shouldSkipOrphanVaultLineDelete({ dexieTaskCount: 0, checkPoint: 99 })).toBe(true);
		expect(shouldSkipOrphanVaultLineDelete({ dexieTaskCount: 50, checkPoint: 0 })).toBe(true);
		expect(shouldSkipOrphanVaultLineDelete({
			dexieTaskCount: 50,
			checkPoint: 12345,
			syncBootstrapSkip: true,
		})).toBe(true);
		expect(shouldSkipOrphanVaultLineDelete({ dexieTaskCount: 50, checkPoint: 12345 })).toBe(false);
	});

	it('scan: post-reset sticky skip does not queue or delete on cache miss + TT 404', async () => {
		const lineText = `- [?] Merge MR… #tts-test %%[ticktick_id:: ${taskId}]%%`;
		const fileContent = `${lineText}\n`;
		const file = mockTFile(filepath);
		const deleteTaskFromSpecificFile = vi.fn().mockResolvedValue(undefined);
		const parser = new TaskParser({} as never, {} as never);
		const plugin = {
			taskParser: parser,
			fileMetadataService: { getFilepathForTask: async () => filepath },
			dateMan: {
				parseDates: () => ({}),
				stripDatesFromLine: (s: string) => s,
				formatDateToISO: () => '2026-10-28T00:00:00.000+0000',
				addDatesToLine: (s: string) => s,
				areDatesChanged: () => false,
				addDateHolderToTask: () => undefined,
			},
			app: {
				vault: {
					getName: () => 'V',
					getAbstractFileByPath: () => file,
					cachedRead: async () => fileContent,
					read: async () => fileContent,
				},
			},
			projectScheme: {
				ensurePushContext: vi.fn(),
				isParentTask: () => false,
				isParentId: () => false,
				enabled: () => false,
				lineDuplicatesProjectParent: () => false,
			},
			taskRepository: {
				loadTaskById: vi.fn().mockResolvedValue(undefined),
				getTaskCount: vi.fn().mockResolvedValue(12),
				upsertTask: vi.fn().mockResolvedValue(undefined),
			},
			tickTickRestAPI: {
				getTaskById: vi.fn().mockResolvedValue(null),
			},
			fileOperation: { deleteTaskFromSpecificFile },
		};
		parser.plugin = plugin as never;

		const detector = new TaskModificationDetector(
			plugin.app as never,
			plugin as never,
		);
		vi.spyOn(NewFileMap.prototype, 'init').mockImplementation(async function (this: NewFileMap) {
			(this as unknown as { fileContent: string }).fileContent = fileContent;
			(this as unknown as { fileLines: string }).fileLines = fileContent;
			return undefined;
		});
		vi.spyOn(NewFileMap.prototype, 'getFileLines').mockReturnValue(fileContent);
		vi.spyOn(NewFileMap.prototype, 'getTaskRecord').mockReturnValue({
			task: { id: taskId, title: 'Merge MR…', projectId: 'in' },
			taskLines: [],
		} as never);

		const pending: Array<{ filepath: string }> = [];
		await detector.checkFileForModifications(filepath, pending as never, {
			skipOrphanVaultLineDeletes: true,
		});

		expect(pending).toHaveLength(0);
		expect(deleteTaskFromSpecificFile).not.toHaveBeenCalled();
		expect(plugin.tickTickRestAPI.getTaskById).toHaveBeenCalled();
	});

	it('scan: empty Dexie alone still fail-closes without sticky flag', async () => {
		Object.assign(getSettings() as Record<string, unknown>, { checkPoint: 99999 });
		const lineText = `- [?] Merge MR… #tts-test %%[ticktick_id:: ${taskId}]%%`;
		const fileContent = `${lineText}\n`;
		const file = mockTFile(filepath);
		const deleteTaskFromSpecificFile = vi.fn().mockResolvedValue(undefined);
		const parser = new TaskParser({} as never, {} as never);
		const plugin = {
			taskParser: parser,
			fileMetadataService: { getFilepathForTask: async () => filepath },
			dateMan: {
				parseDates: () => ({}),
				stripDatesFromLine: (s: string) => s,
				formatDateToISO: () => '2026-10-28T00:00:00.000+0000',
				addDatesToLine: (s: string) => s,
				areDatesChanged: () => false,
				addDateHolderToTask: () => undefined,
			},
			app: {
				vault: {
					getName: () => 'V',
					getAbstractFileByPath: () => file,
					cachedRead: async () => fileContent,
					read: async () => fileContent,
				},
			},
			projectScheme: {
				ensurePushContext: vi.fn(),
				isParentTask: () => false,
				isParentId: () => false,
				enabled: () => false,
				lineDuplicatesProjectParent: () => false,
			},
			taskRepository: {
				loadTaskById: vi.fn().mockResolvedValue(undefined),
				getTaskCount: vi.fn().mockResolvedValue(0),
				upsertTask: vi.fn().mockResolvedValue(undefined),
			},
			tickTickRestAPI: {
				getTaskById: vi.fn().mockResolvedValue(null),
			},
			fileOperation: { deleteTaskFromSpecificFile },
		};
		parser.plugin = plugin as never;

		const detector = new TaskModificationDetector(
			plugin.app as never,
			plugin as never,
		);
		vi.spyOn(NewFileMap.prototype, 'init').mockImplementation(async function (this: NewFileMap) {
			(this as unknown as { fileContent: string }).fileContent = fileContent;
			(this as unknown as { fileLines: string }).fileLines = fileContent;
			return undefined;
		});
		vi.spyOn(NewFileMap.prototype, 'getFileLines').mockReturnValue(fileContent);
		vi.spyOn(NewFileMap.prototype, 'getTaskRecord').mockReturnValue({
			task: { id: taskId, title: 'Merge MR…', projectId: 'in' },
			taskLines: [],
		} as never);

		const pending: Array<{ filepath: string }> = [];
		await detector.checkFileForModifications(filepath, pending as never);

		expect(pending).toHaveLength(0);
		expect(deleteTaskFromSpecificFile).not.toHaveBeenCalled();
	});
});
