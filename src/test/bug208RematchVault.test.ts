import { describe, expect, it, vi } from 'vitest';
import { insertRematchLines, rematchVaultFromPlanned } from '@/sync/rematchVault';
import type { PlannedDeletion } from '@/sync/massDeleteGuard';

describe('BUG-208-REMATCH rematchVaultFromPlanned', () => {
	it('inserts missing markers under Active Zone without calling TickTick', async () => {
		const planned: PlannedDeletion[] = [
			{ id: 'a1', taskId: 'a1', kind: 'task', direction: 'vault-to-ticktick', action: 'delete', file: '10 Projects/p.md', title: 'A' },
			{ id: 'b1', taskId: 'b1', kind: 'task', direction: 'vault-to-ticktick', action: 'delete', file: '10 Projects/p.md', title: 'B' },
		];
		const files = new Map<string, string>([[
			'10 Projects/p.md',
			'# P\n\n## Active Zone\n\n## Done\n',
		]]);
		const writeFile = vi.fn(async (path: string, text: string) => { files.set(path, text); });
		const result = await rematchVaultFromPlanned(planned, {
			loadLiveTask: async (taskId) => ({
				taskId,
				deleted: false,
				task: { id: taskId, projectId: 'p', title: taskId === 'a1' ? 'A' : 'B', content: '', items: [] },
			}),
			readFile: async (path) => files.get(path) ?? null,
			writeFile,
			convertTaskToLine: async (task) =>
				`- [ ] ${task.title} #ticktick %%[ticktick_id:: ${task.id}]%%`,
		});
		expect(result.written).toBe(2);
		expect(result.files).toBe(1);
		expect(result.skipped).toBe(0);
		expect(writeFile).toHaveBeenCalledTimes(1);
		const next = files.get('10 Projects/p.md')!;
		expect(next).toContain('%%[ticktick_id:: a1]%%');
		expect(next).toContain('%%[ticktick_id:: b1]%%');
		expect(next.indexOf('## Active Zone')).toBeLessThan(next.indexOf('a1'));
		expect(next.indexOf('a1')).toBeLessThan(next.indexOf('## Done'));
	});

	it('skips missing Dexie rows and ids already in the note', async () => {
		const planned: PlannedDeletion[] = [
			{ id: 'gone', taskId: 'gone', kind: 'task', direction: 'vault-to-ticktick', action: 'delete', file: 'p.md', title: 'Gone' },
			{ id: 'have', taskId: 'have', kind: 'task', direction: 'vault-to-ticktick', action: 'delete', file: 'p.md', title: 'Have' },
		];
		const writeFile = vi.fn(async () => {});
		const result = await rematchVaultFromPlanned(planned, {
			loadLiveTask: async (taskId) => taskId === 'gone'
				? null
				: { taskId, deleted: false, task: { id: taskId, projectId: 'p', title: 'Have', content: '', items: [] } },
			readFile: async () => '# n\n## Active Zone\n- [ ] Have %%[ticktick_id:: have]%%\n',
			writeFile,
			convertTaskToLine: async (task) => `- [ ] ${task.title} %%[ticktick_id:: ${task.id}]%%`,
		});
		expect(result.written).toBe(0);
		expect(result.skipped).toBe(2);
		expect(writeFile).not.toHaveBeenCalled();
	});

	it('insertRematchLines creates Active Zone when missing', () => {
		const out = insertRematchLines('# n\n', ['- [ ] x %%[ticktick_id:: x]%%']);
		expect(out).toContain('## Active Zone');
		expect(out).toContain('ticktick_id:: x');
	});
});
