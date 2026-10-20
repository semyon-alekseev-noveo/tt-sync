/**
 * BUG-PULL-COMMENT-STALE: a TickTick-only API comment must mark the vault line behind.
 * The cached task is compared first so an already-different copy does not call getTaskById.
 */
import { describe, expect, it, vi } from 'vitest';
import { TFile } from 'obsidian';
import { VaultSyncCoordinator } from '@/services/VaultSyncCoordinator';
import { updateSettings } from '@/settings';
import { apiCommentsDifferFromVault } from '@/abyssCommentSync';

vi.mock('@/utils/logger', () => ({
	default: { debug: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

class NoteFile extends TFile {
	path: string;
	constructor(path: string) {
		super();
		this.path = path;
	}
}

describe('BUG-PULL-COMMENT-STALE', () => {
	it('apiCommentsDifferFromVault ignores order and matches equal sets', () => {
		const lines = ['\t- 2026-10-19 20:00: alpha', '\t- beta'];
		expect(apiCommentsDifferFromVault(lines, [
			{ title: 'beta' },
			{ title: '2026-10-19 20:00: alpha' },
		])).toBe(false);
		expect(apiCommentsDifferFromVault(lines, [{ title: '2026-10-19 20:00: alpha' }])).toBe(true);
	});

	it('TP-IDLE-ZERO does not fetch a task or its comments when the Dexie copy matches the line', async () => {
		updateSettings({
			syncNotes: true,
			abyssTasksFormat: true,
			syncAbyssCommentsViaApi: true,
			syncScopeFolders: ['notes/'],
			tagMappings: [],
			tagListMappings: [],
		}, { persist: false });

		const taskId = 'abcdefabcdefabcdefabcdef';
		const file = new NoteFile('notes/a.md');
		const text = `- [ ] same title %%[ticktick_id:: ${taskId}]%%\n`;
		const getTaskById = vi.fn().mockResolvedValue({
			id: taskId, projectId: 'proj-1', title: 'same title', content: '', desc: '', status: 0,
		});
		const getTaskComments = vi.fn().mockResolvedValue([{ id: 'c1', title: 'from ticktick' }]);
		const plugin = {
			tickTickRestAPI: { getTaskById, getTaskComments },
			taskParser: undefined as unknown,
			projectScheme: { isParentTask: () => false },
			fileOperation: { readFileContent: async () => text },
			dateMan: {
				parseDates: () => ({}),
				stripDatesFromLine: (s: string) => s,
				formatDateToISO: () => '',
				addDatesToLine: (s: string) => s,
			},
			fileTaskQueries: { getDefaultProjectIdForFilepath: async () => 'proj-1' },
			taskRepository: { loadTaskById: async () => undefined },
		};
		const { TaskParser } = await import('@/taskParser');
		const parser = new TaskParser({} as never, plugin as never);
		plugin.taskParser = parser;
		const app = {
			metadataCache: { getFileCache: () => ({ listItems: [] }) },
			vault: {
				getAbstractFileByPath: () => file,
				read: async () => text,
			},
		};
		const coordinator = new VaultSyncCoordinator(app as never, plugin as never);
		const behind = (coordinator as unknown as {
			vaultLineBehindTask(task: unknown, path: string): Promise<{ behind: boolean; task: { _apiComments?: unknown[] } }>;
		}).vaultLineBehindTask.bind(coordinator);

		const matched = await behind({
			id: taskId, projectId: 'proj-1', title: 'same title', content: '', desc: '', status: 0, commentCount: 0,
		}, file.path);
		expect(matched.behind).toBe(false);
		expect(getTaskById).not.toHaveBeenCalled();
		expect(getTaskComments).not.toHaveBeenCalled();

		const counted = await behind({
			id: taskId, projectId: 'proj-1', title: 'same title', content: '', desc: '', status: 0, commentCount: 1,
		}, file.path);
		expect(counted.behind).toBe(true);
		expect(getTaskById).not.toHaveBeenCalled();
		expect(getTaskComments).toHaveBeenCalledTimes(1);
		expect(counted.task._apiComments).toEqual([{ id: 'c1', title: 'from ticktick' }]);

		const already = await behind({
			id: taskId, projectId: 'proj-1', title: 'renamed on ticktick', content: '', desc: '', status: 0,
		}, file.path);
		expect(already.behind).toBe(true);
		expect(getTaskById).not.toHaveBeenCalled();
	});
});
