/**
 * BUG-NOTEBOOK-NO-DELETE (#160): vault→TT deletion must never remove Notebook notes.
 */
import { describe, expect, it, vi } from 'vitest';
import {
	isNotebookProtectedFromVaultDelete,
	isNotebookProject,
	isNotebookTask,
	normalizeTickKind,
} from '@/sync/notebookGuard';
import { TaskDeletionHandler } from '@/services/TaskDeletionHandler';
import type { ITask } from '@/api/types/Task';

vi.mock('@/utils/logger', () => ({
	default: { debug: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), trace: vi.fn() },
}));

vi.mock('@/db/projects', () => ({
	getProjectById: vi.fn(async (id: string) => {
		if (id === 'note-proj') return { id, kind: 'NOTE', name: 'Notebook' };
		if (id === 'task-proj') return { id, kind: 'TASK', name: 'List' };
		return undefined;
	}),
}));

vi.mock('@/sync/massDeleteGuard', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@/sync/massDeleteGuard')>();
	return {
		...actual,
		deletionConfirmMode: () => 'force' as const,
	};
});

function task(partial: Partial<ITask>): ITask {
	return {
		id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
		projectId: 'task-proj',
		title: 'x',
		status: 0,
		tags: [],
		priority: 0,
		content: '',
		desc: '',
		items: [],
		childIds: [],
		parentId: '',
		sortOrder: 0,
		isAllDay: true,
		reminder: '',
		reminders: [],
		repeatFlag: '',
		progress: 0,
		modifiedTime: '',
		deleted: 0,
		dateHolder: {} as never,
		lineHash: '',
		...partial,
	} as ITask;
}

describe('BUG-NOTEBOOK-NO-DELETE', () => {
	it('normalizeTickKind treats NOTE case-insensitively', () => {
		expect(normalizeTickKind('NOTE')).toBe('NOTE');
		expect(normalizeTickKind('note')).toBe('NOTE');
		expect(normalizeTickKind('Task')).toBe('TASK');
	});

	it('isNotebookTask / isNotebookProject', () => {
		expect(isNotebookTask(task({ kind: 'NOTE' }))).toBe(true);
		expect(isNotebookTask(task({ kind: 'TEXT' }))).toBe(false);
		expect(isNotebookProject({ kind: 'NOTE' })).toBe(true);
		expect(isNotebookProject({ kind: 'TASK' })).toBe(false);
	});

	it('isNotebookProtectedFromVaultDelete: task kind NOTE', () => {
		expect(isNotebookProtectedFromVaultDelete(task({ kind: 'NOTE' }), { kind: 'TASK' })).toBe(true);
	});

	it('isNotebookProtectedFromVaultDelete: project kind NOTE', () => {
		expect(isNotebookProtectedFromVaultDelete(task({ kind: 'TEXT', projectId: 'note-proj' }), { kind: 'NOTE' })).toBe(true);
	});

	it('isNotebookProtectedFromVaultDelete: normal task', () => {
		expect(isNotebookProtectedFromVaultDelete(task({ kind: 'TEXT' }), { kind: 'TASK' })).toBe(false);
	});

	it('BUG-NOTEBOOK-NO-DELETE: deleteTasksByIds skips kind NOTE', async () => {
		const noteId = 'bbbbbbbbbbbbbbbbbbbbbbbb';
		const deleteTask = vi.fn(async () => true);
		const deleteTaskRepo = vi.fn(async () => undefined);
		const note = task({ id: noteId, kind: 'NOTE', projectId: 'note-proj', title: 'Keep notebook' });

		const handler = new TaskDeletionHandler(
			{
				vault: {
					getAbstractFileByPath: () => null,
					getMarkdownFiles: () => [],
				},
			} as never,
			{
				taskRepository: {
					loadTaskById: async (id: string) => (id === noteId ? note : undefined),
					deleteTask: deleteTaskRepo,
					getProjectIdForTask: async () => 'note-proj',
				},
				fileTaskQueries: {
					getDeletionItems: async () => [],
				},
				projectScheme: { isParentId: () => false },
				tickTickRestAPI: { deleteTask },
				saveSettings: async () => undefined,
			} as never,
		);

		// Avoid vault scan in filterStillReferenced
		vi.spyOn(handler as unknown as { filterStillReferenced: (ids: string[]) => Promise<string[]> }, 'filterStillReferenced')
			.mockResolvedValue([noteId]);

		const deleted = await handler.deleteTasksByIds([noteId], 'test', { skipConfirm: true });
		expect(deleted).toEqual([]);
		expect(deleteTask).not.toHaveBeenCalled();
		expect(deleteTaskRepo).not.toHaveBeenCalled();
	});
});
