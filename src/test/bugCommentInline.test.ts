/**
 * BUG-COMMENT-INLINE: editing only a child comment or description line must push the parent task.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { abyssLinesToNote } from '@/abyssFormat';
import { TaskParser } from '@/taskParser';
import { getSettings } from '@/settings';

const syncMock = vi.fn().mockResolvedValue(true);
const updateTask = vi.fn().mockImplementation(async (task: { id: string }) => ({ ...task }));

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

describe('BUG-COMMENT-INLINE', () => {
	const taskId = 'abcdefabcdefabcdefabcdef';
	const filepath = '00 Inbox/abyss-active.md';

	beforeEach(() => {
		syncMock.mockClear();
		updateTask.mockClear();
		Object.assign(getSettings() as Record<string, unknown>, {
			syncNotes: true,
			abyssTasksFormat: true,
			syncAbyssCommentsViaApi: true,
			syncNoteContextTags: false,
			syncScopeFolders: ['00 Inbox/'],
			stopInjectingTickTickTag: true,
			noteDelimiter: '',
			fileLinksInTickTick: 'noLink',
			tagMappings: [],
			tagListMappings: [],
		});
	});

	function harness(lineText: string, taskLines: string[], lineHash: string) {
		const fileContent = [lineText, ...taskLines, ''].join('\n');
		const parser = new TaskParser({} as never, {} as never);
		parser.plugin = {
			taskParser: parser,
			fileMetadataService: { getFilepathForTask: async () => filepath },
			dateMan: {
				parseDates: () => ({}),
				stripDatesFromLine: (s: string) => s,
				formatDateToISO: () => '2026-10-19T00:00:00.000+0000',
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
				loadLocalTaskById: vi.fn().mockResolvedValue(null),
				upsertTask: vi.fn().mockResolvedValue(undefined),
			},
			tickTickRestAPI: {
				updateTask,
				getTaskById: vi.fn().mockResolvedValue({ id: taskId, projectId: 'in', title: 'parent', content: '', items: [] }),
			},
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
		const app = {
			metadataCache: { getFileCache: () => ({ listItems: [] }) },
			vault: { getAbstractFileByPath: () => ({ path: filepath }) },
		};
		return { parser, plugin, app, fileContent };
	}

	it('pushes the parent when only a child comment line changes', async () => {
		const lineText = `- [ ] parent #tts-test %%[ticktick_id:: ${taskId}]%%`;
		const taskLines = ['\t- 2026-10-19 20:00: comment only on vault'];
		const { parser, plugin, app, fileContent } = harness(
			lineText,
			taskLines,
			await new TaskParser({} as never, {} as never).getLineHash(lineText + abyssLinesToNote(taskLines)),
		);
		const fileMap = new NewFileMap(app as never, plugin as never, { path: filepath } as never);
		await fileMap.init(fileContent);
		const detector = new TaskModificationDetector(app as never, plugin as never);
		await detector.checkLineForModifications(filepath, taskLines[0], 1, fileMap);
		expect(syncMock).toHaveBeenCalledWith(
			plugin.tickTickRestAPI,
			taskId,
			'in',
			taskLines,
			'',
			{ remoteCommentCount: undefined },
		);
	});

	it('pushes the parent when only a child description line changes', async () => {
		const lineText = `- [ ] parent #tts-test %%[ticktick_id:: ${taskId}]%%`;
		const taskLines = ['\t- > only the description'];
		const { parser, plugin, app, fileContent } = harness(lineText, taskLines, 'stale-hash');
		vi.spyOn(parser, 'convertLineToTask').mockResolvedValue({
			id: taskId,
			title: 'parent',
			projectId: 'in',
			content: 'only the description',
			desc: '',
			status: 0,
			tags: [],
			items: [],
			priority: 0,
		} as never);
		const fileMap = new NewFileMap(app as never, plugin as never, { path: filepath } as never);
		await fileMap.init(fileContent);
		const detector = new TaskModificationDetector(app as never, plugin as never);
		const modified = await detector.checkLineForModifications(filepath, taskLines[0], 1, fileMap);
		expect(modified).toBe(true);
		expect(updateTask).toHaveBeenCalled();
	});
});
