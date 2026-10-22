import { describe, it, expect, vi } from 'vitest';
import { runVaultDeletionPhase } from '@/sync/lifecycle/runVaultDeletionPhase';
import { createSyncRunContext } from '@/sync/SyncRunContext';

vi.mock('@/modals/TaskDeletionModal', () => ({
	clearPendingDeletions: vi.fn(),
}));

describe('runVaultDeletionPhase (TECH-SYNC-MODULARIZATION PR 2)', () => {
	it('clears pending deletion prompts then calls processSyncRemovedTasks with ctx', async () => {
		const { clearPendingDeletions } = await import('@/modals/TaskDeletionModal');
		const processSyncRemovedTasks = vi.fn(async () => undefined);
		const plugin = {
			taskDeletionHandler: { processSyncRemovedTasks },
		};
		const ctx = createSyncRunContext({ trigger: 'manual', fullSync: false });
		const paths = ['Projects/A.md'];

		await runVaultDeletionPhase({ plugin: plugin as never, ctx }, paths);

		expect(clearPendingDeletions).toHaveBeenCalled();
		expect(processSyncRemovedTasks).toHaveBeenCalledWith(paths, ctx);
	});
});
