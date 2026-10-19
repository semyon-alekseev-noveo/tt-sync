/**
 * BUG-COMMENT-1 (2.0.47): comment API sync must run when checkbox hash is unchanged.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { abyssLinesToNote } from '@/abyssFormat';
import { TaskParser } from '@/taskParser';
import { getSettings } from '@/settings';

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

import { TaskModificationDetector } from '@/services/TaskModificationDetector';
import { NewFileMap } from '@/services/NewFileMap';

describe('NOTE-C2 — comment sync when line hash unchanged (BUG-COMMENT-1)', () => {
	const taskId = 'abcdefabcdefabcdefabcdef';
	const filepath = '00 Inbox/abyss-active.md';

	beforeEach(() => {
		syncMock.mockClear();
		Object.assign(getSettings() as Record<string, unknown>, {
			syncNotes: true,
			abyssTasksFormat: true,
			syncAbyssCommentsViaApi: true,
			syncScopeFolders: ['00 Inbox/'],
			stopInjectingTickTickTag: true,
			noteDelimiter: '',
			fileLinksInTickTick: 'noLink',
			tagMappings: [],
			tagListMappings: [],
		});
	});

	it('calls syncAbyssCommentsToTickTick on early-exit path when hash matches', async () => {
		const lineText = `- [ ] hash unchanged #tts-test %%[ticktick_id:: ${taskId}]%%`;
		const taskLines = ['\t- 2026-10-19 20:00: comment only on vault'];
		const fileContent = `${lineText}\n${taskLines[0]}\n`;

		const parser = new TaskParser({} as unknown, {} as unknown);
		const lineHash = await parser.getLineHash(lineText + abyssLinesToNote(taskLines));
		parser.plugin = {
			taskParser: parser,
			fileMetadataService: { getFilepathForTask: () => filepath },
			dateMan: {
				parseDates: () => ({}),
				stripDatesFromLine: (s: string) => s,
				formatDateToISO: () => '',
				addDatesToLine: (s: string) => s,
			},
			app: { vault: { getName: () => 'V', getAbstractFileByPath: () => ({ path: filepath }) } },
			projectScheme: { ensurePushContext: vi.fn(), isParentTask: () => false },
			taskRepository: {
				loadTaskById: vi.fn().mockResolvedValue({
					id: taskId,
					title: 'hash unchanged',
					projectId: 'in',
					lineHash,
					parentId: '',
					content: '',
					tags: [],
					status: 0,
				}),
				loadLocalTaskById: vi.fn().mockResolvedValue(null),
				upsertTask: vi.fn().mockResolvedValue(undefined),
			},
			tickTickRestAPI: {},
		} as unknown as typeof parser.plugin;

		const plugin = {
			taskParser: parser,
			projectScheme: parser.plugin.projectScheme,
			taskRepository: parser.plugin.taskRepository,
			tickTickRestAPI: parser.plugin.tickTickRestAPI,
			dateMan: parser.plugin.dateMan,
			fileMetadataService: { getFilepathForTask: async () => filepath },
			fileOperation: undefined,
			saveSettings: vi.fn(),
		};

		const app = {
			metadataCache: { getFileCache: () => ({ listItems: [] }) },
			vault: {
				getAbstractFileByPath: () => ({ path: filepath }),
			},
		};

		const fileMap = new NewFileMap(app as never, plugin as never, { path: filepath } as never);
		await fileMap.init(fileContent);

		const detector = new TaskModificationDetector(app as never, plugin as never);
		const modified = await detector.checkLineForModifications(filepath, lineText, 0, fileMap);

		expect(modified).toBe(false);
		expect(syncMock).toHaveBeenCalledWith(
			plugin.tickTickRestAPI,
			taskId,
			'in',
			taskLines,
			'',
		);
	});
});
