import { describe, it, expect, vi } from 'vitest';
import { TaskDeletionHandler } from '@/services/TaskDeletionHandler';

describe('deleteTasksByIds guard', () => {
	it('skips project parents and ids still present in notes; no modal when nothing left', async () => {
		const files = [{ path: 'a.md' }];
		const app = { vault: { getMarkdownFiles: () => files, cachedRead: async () => '- [ ] x %%[ticktick_id:: restored1]%%' } };
		const plugin = { projectScheme: { isParentId: (id: string) => id === 'parent1' } };
		const h = new TaskDeletionHandler(app as never, plugin as never);
		const confirm = vi.fn(async () => false);
		(h as unknown as { confirmDeletion: unknown }).confirmDeletion = confirm;
		expect(await h.deleteTasksByIds(['parent1', 'restored1'])).toEqual([]);
		expect(confirm).not.toHaveBeenCalled();
		await h.deleteTasksByIds(['gone1', 'parent1']);
		expect(confirm).toHaveBeenCalledWith(['gone1'], expect.any(String));
	});
});
