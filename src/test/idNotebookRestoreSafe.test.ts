/**
 * ID-NOTEBOOK-RESTORE-SAFE (#234 / E17) — Notebook out of vault→TT rematch delete set.
 */
import { describe, expect, it } from 'vitest';
import {
	planVaultTaskDeletions,
	canOfferRematch,
	rematchCandidates,
} from '@/sync/massDeleteGuard';
import { rebindVaultFromPlanned } from '@/sync/rebindVault';
import type { PlannedDeletion } from '@/sync/massDeleteGuard';

const NOTE_ID = 'note01note01note01note01no';
const TASK_ID = 'task01task01task01task01ta';

describe('ID-NOTEBOOK-RESTORE-SAFE', () => {
	it('planVaultTaskDeletions skips isNotebook even when markers absent', () => {
		const planned = planVaultTaskDeletions({
			tasks: [
				{
					taskId: NOTE_ID,
					title: 'Notebook page',
					file: 'Notebook/note.md',
					inPushScope: true,
					isNotebook: true,
				},
				{
					taskId: TASK_ID,
					title: 'Normal',
					file: '30 Tasks/n.md',
					inPushScope: true,
					isNotebook: false,
				},
			],
			presentIds: new Set(),
			untrustedFiles: new Set(),
			indexIncomplete: false,
		});
		expect(planned.map(p => p.taskId)).toEqual([TASK_ID]);
		expect(rematchCandidates(planned).every(c => c.taskId !== NOTE_ID)).toBe(true);
		expect(canOfferRematch(planned)).toBe(true);
	});

	it('rebindVaultFromPlanned skips kind NOTE live tasks', async () => {
		const planned: PlannedDeletion[] = [{
			id: NOTE_ID,
			taskId: NOTE_ID,
			kind: 'task',
			direction: 'vault-to-ticktick',
			action: 'delete',
			file: 'Notebook/note.md',
			title: 'Notebook page',
		}];
		const writes: string[] = [];
		const result = await rebindVaultFromPlanned(planned, {
			loadLiveTask: async (taskId) => ({
				taskId,
				deleted: false,
				task: {
					id: taskId,
					projectId: 'nb',
					title: 'Notebook page',
					kind: 'NOTE',
					content: '',
					items: [],
				} as never,
			}),
			readFile: async () => '#\n- [ ] Notebook page\n',
			writeFile: async (p) => { writes.push(p); },
			convertTaskToLine: async (task) =>
				`- [ ] ${task.title} %%[ticktick_id:: ${task.id}]%%`,
		});
		expect(writes).toEqual([]);
		expect(result.rebound).toBe(0);
		expect(result.inserted).toBe(0);
		expect(result.skipped).toBeGreaterThanOrEqual(1);
	});
});
