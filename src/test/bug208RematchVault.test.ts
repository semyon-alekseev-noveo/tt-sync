import { describe, expect, it, vi } from 'vitest';
import { rematchVaultFromPlanned } from '@/sync/rematchVault';
import type { PlannedDeletion } from '@/sync/massDeleteGuard';

describe('BUG-208-REMATCH rematchVaultFromPlanned', () => {
	it('groups Dexie tasks by file and calls synchronizeToVault once per file', async () => {
		const planned: PlannedDeletion[] = [
			{ id: 'a1', taskId: 'a1', kind: 'task', direction: 'vault-to-ticktick', action: 'delete', file: '10 Projects/p.md', title: 'A' },
			{ id: 'b1', taskId: 'b1', kind: 'task', direction: 'vault-to-ticktick', action: 'delete', file: '10 Projects/p.md', title: 'B' },
		];
		const synchronizeToVault = vi.fn(async () => true);
		const loadLiveTask = vi.fn(async (taskId: string) => ({
			taskId,
			deleted: false,
			task: { id: taskId, projectId: 'p', title: taskId, content: '', items: [] },
		}));
		const result = await rematchVaultFromPlanned(planned, { synchronizeToVault, loadLiveTask });
		expect(result.written).toBe(2);
		expect(result.skipped).toBe(0);
		expect(synchronizeToVault).toHaveBeenCalledTimes(1);
		expect(synchronizeToVault.mock.calls[0][0]).toBe('10 Projects/p.md');
		expect(synchronizeToVault.mock.calls[0][1]).toHaveLength(2);
		expect(synchronizeToVault.mock.calls[0][2]).toBe(false);
	});

	it('skips missing or deleted Dexie rows without calling the writer', async () => {
		const planned: PlannedDeletion[] = [
			{ id: 'gone', taskId: 'gone', kind: 'task', direction: 'vault-to-ticktick', action: 'delete', file: 'p.md', title: 'Gone' },
		];
		const synchronizeToVault = vi.fn(async () => true);
		const result = await rematchVaultFromPlanned(planned, {
			synchronizeToVault,
			loadLiveTask: async () => null,
		});
		expect(result.written).toBe(0);
		expect(result.skipped).toBe(1);
		expect(synchronizeToVault).not.toHaveBeenCalled();
	});
});
