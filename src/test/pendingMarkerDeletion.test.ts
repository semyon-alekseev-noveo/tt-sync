import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskDeletionHandler } from '@/services/TaskDeletionHandler';
import { createSyncRunContext } from '@/sync/SyncRunContext';
import { clearPendingMarkerTaskIds } from '@/sync/vault-io';

describe('BUG-DEFERRED-ID-PHASE2-DELETE', () => {
	beforeEach(() => {
		clearPendingMarkerTaskIds();
	});

	it('processSyncRemovedTasks skips ids whose vault marker write is still pending', async () => {
		const filePath = '00 Inbox/2026-10-21.md';
		const taskId = '6ad8330e7c73b3429dd8cb76';
		const app = {
			vault: {
				getAbstractFileByPath: (p: string) => (p === filePath ? { path: filePath } : null),
				getMarkdownFiles: () => [],
			},
		};
		const plugin = {
			projectScheme: { isParentTask: () => false },
			fileOperation: {
				readFileContent: async () => '# day\n- [ ] test-10-35\n',
			},
		};
		const handler = new TaskDeletionHandler(app as never, plugin as never);
		const queries = {
			getTasksInFile: async () => [{ taskId, deleted: false, task: { id: taskId } }],
			fileHasTasks: async () => true,
		};
		(handler as unknown as { fileTaskQueries: typeof queries }).fileTaskQueries = queries;
		(handler as unknown as { collectTaskIdsAbsentFromVault: () => Promise<string[]> }).collectTaskIdsAbsentFromVault =
			async () => [taskId];
		(handler as unknown as { collectMissingTaskIdsForFile: () => Promise<string[]> }).collectMissingTaskIdsForFile =
			async () => [taskId];
		const deleteTasksByIds = vi.fn(async () => []);
		(handler as unknown as { deleteTasksByIds: typeof deleteTasksByIds }).deleteTasksByIds = deleteTasksByIds;
		(handler as unknown as { checkForDeletedTaskItems: () => Promise<void> }).checkForDeletedTaskItems =
			async () => undefined;

		const ctx = createSyncRunContext({ trigger: 'manual', fullSync: false });
		ctx.registerPendingMarker(taskId);
		await handler.processSyncRemovedTasks([filePath], ctx);

		expect(deleteTasksByIds).not.toHaveBeenCalled();
	});
});
