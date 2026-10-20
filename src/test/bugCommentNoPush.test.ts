/**
 * BUG-COMMENT-NO-PUSH: checkFileForModifications must sweep Comments API for all tasks in the file.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { abyssLinesToNote } from '@/abyssFormat';
import { getSettings } from '@/settings';
import { TaskParser } from '@/taskParser';

const syncMock = vi.fn().mockResolvedValue(true);

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
		syncAbyssCommentsToTickTick: (...args: unknown[]) => syncMock(...args),
		useAbyssCommentsApi: () => true,
	};
});

import { TFile } from 'obsidian';
import { TaskModificationDetector } from '@/services/TaskModificationDetector';
import { NewFileMap } from '@/services/NewFileMap';

function mockTFile(path: string): TFile {
	const f = { path } as TFile;
	Object.setPrototypeOf(f, TFile.prototype);
	return f;
}

describe('BUG-COMMENT-NO-PUSH', () => {
	const taskId = 'abcdefabcdefabcdefabcdef';
	const filepath = '00 Inbox/manual-test.md';

	beforeEach(() => {
		syncMock.mockClear();
		Object.assign(getSettings() as Record<string, unknown>, {
			syncNotes: true,
			abyssTasksFormat: true,
			syncAbyssCommentsViaApi: true,
			syncScopeFolders: ['00 Inbox/'],
			syncedLists: ['TTS-Inbox'],
			SyncTag: 'tts-test',
			tagListMappings: [],
			tagMappings: [],
		});
	});

	it('sweeps comment API when parent hash is unchanged', async () => {
		const lineText = `- [ ] parent #tts-test %%[ticktick_id:: ${taskId}]%%`;
		const taskLines = ['\t- commetn1'];
		const fileContent = [lineText, ...taskLines, ''].join('\n');
		const lineHash = await new TaskParser({} as never, {} as never).getLineHash(
			lineText + abyssLinesToNote(taskLines),
		);
		const parser = new TaskParser({} as never, {} as never);
		parser.plugin = {
			taskParser: parser,
			fileMetadataService: { getFilepathForTask: async () => filepath },
			dateMan: {
				parseDates: () => ({}),
				stripDatesFromLine: (s: string) => s,
				formatDateToISO: () => '2026-10-20T00:00:00.000+0000',
				addDatesToLine: (s: string) => s,
				areDatesChanged: () => false,
				addDateHolderToTask: () => undefined,
			},
			app: { vault: { getName: () => 'V', getAbstractFileByPath: () => ({ path: filepath }) } },
			projectScheme: {
				ensurePushContext: vi.fn(),
				isParentTask: () => false,
				isParentId: () => false,
				enabled: () => false,
			},
			taskRepository: {
				loadTaskById: vi.fn().mockResolvedValue({
					id: taskId,
					title: 'parent',
					projectId: 'in',
					lineHash,
					parentId: '',
					content: '',
					desc: '',
					tags: [],
					status: 0,
					items: [],
					priority: 0,
				}),
				loadLocalTaskById: vi.fn().mockResolvedValue({
					task: { id: taskId },
					lastVaultSync: 1,
					updatedAt: 0,
					file: filepath,
				}),
				upsertTask: vi.fn().mockResolvedValue(undefined),
			},
			tickTickRestAPI: { updateTask: vi.fn(), getTaskById: vi.fn() },
			fileTaskQueries: { getDefaultProjectIdForFilepath: async () => 'in' },
		} as unknown as typeof parser.plugin;

		const plugin = {
			taskParser: parser,
			projectScheme: parser.plugin.projectScheme,
			taskRepository: parser.plugin.taskRepository,
			tickTickRestAPI: parser.plugin.tickTickRestAPI,
			dateMan: parser.plugin.dateMan,
			fileMetadataService: parser.plugin.fileMetadataService,
			fileOperation: { readFileContent: async () => fileContent },
			fileTaskQueries: parser.plugin.fileTaskQueries,
			saveSettings: vi.fn(),
		};
		const tfile = mockTFile(filepath);
		const app = {
			metadataCache: { getFileCache: () => ({ listItems: [] }) },
			vault: {
				getAbstractFileByPath: () => tfile,
				read: async () => fileContent,
			},
		};

		const fileMap = new NewFileMap(app as never, plugin as never, tfile);
		await fileMap.init(fileContent);
		const detector = new TaskModificationDetector(app as never, plugin as never);
		await detector.checkFileForModifications(filepath);

		expect(syncMock).toHaveBeenCalled();
		const call = syncMock.mock.calls.find(c => c[1] === taskId);
		expect(call).toBeTruthy();
		expect(call?.[3]).toEqual(taskLines);
	});
});
