import { describe, expect, it, vi, type Mock } from 'vitest';
import { Tick } from '@/api/index';
import type { ITask } from '@/api/types/Task';

vi.mock('obsidian', () => ({
	Platform: { isIosApp: false, isAndroidApp: false, isDesktopApp: true, isMobileApp: false },
	requestUrl: vi.fn(),
}));

vi.mock('@/settings', () => ({
	getSettings: vi.fn(() => ({})),
	updateSettings: vi.fn(),
}));

function task(id: string): ITask {
	return {
		id,
		projectId: 'p1',
		title: id,
		status: 0,
		priority: 0,
		isAllDay: false,
		timeZone: 'UTC',
		reminders: [],
	} as ITask;
}

describe('getUpdatedTasks delta parsing', () => {
	it('merges syncTaskBean.add into update (dida-cli / pyticktick shape)', async () => {
		const tick = new Tick({ token: 't', baseUrl: 'ticktick.com', checkPoint: 100 });
		const mock = vi.spyOn(tick, 'makeRequest') as unknown as Mock;
		mock.mockResolvedValue({
			checkPoint: 200,
			syncTaskBean: {
				update: [task('u1')],
				add: [task('a1')],
				delete: ['d1'],
			},
		});

		const result = await tick.getUpdatedTasks(100);
		expect(result.update.map(t => t.id)).toEqual(['u1', 'a1']);
		expect(result.delete).toEqual(['d1']);
		expect(tick.checkpoint).toBe(200);
	});
});
