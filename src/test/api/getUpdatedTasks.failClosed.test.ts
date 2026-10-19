import { describe, expect, it } from 'vitest';
import { Tick, TickTickPullError } from '@/api';
import { TickTickRestAPI } from '@/services/TicktickRestAPI';
import { updateSettings } from '@/settings';

describe('getUpdatedTasks fail-closed', () => {
	it('BUG-SYNC-SILENT-FAIL throws and keeps the previous checkpoint when the request fails', async () => {
		const tick = new Tick({ token: 't', baseUrl: 'ticktick.com', checkPoint: 42 });
		await expect(tick.getUpdatedTasks(1)).rejects.toBeInstanceOf(TickTickPullError);
		expect(tick.checkpoint).toBe(42);
	});

	it('BUG-SYNC-SILENT-FAIL TicktickRestAPI does not turn an API failure into an empty delta', async () => {
		updateSettings({ token: 'test-token', checkPoint: 7 }, { persist: false });
		const api = {
			getUpdatedTasks: async () => {
				throw new TickTickPullError('Get Updated Tasks failed: no response');
			},
			checkpoint: 99,
		};
		const rest = new TickTickRestAPI({} as never, { dateMan: { addDateHolderToTask: () => undefined } } as never, api as never);
		await expect(rest.getUpdatedTasks(1)).rejects.toBeInstanceOf(TickTickPullError);
		expect(rest.checkpoint).toBe(7);
	});
});
