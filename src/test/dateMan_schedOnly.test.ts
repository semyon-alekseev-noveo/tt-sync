import { it, expect, vi } from 'vitest';
vi.mock('@/utils/logger', () => ({ default: { debug: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn() } }));
import { DateMan } from '../dateMan';
vi.mock('@/settings', () => ({ getSettings: () => ({ scheduledAsStartDate: true }) }));

it('⏳-only line does not gain a 📅 when TickTick mirrors startDate into dueDate', () => {
	const d = new DateMan();
	const sd = { hasATime: false, date: '2026-10-18', time: '', isoDate: '2026-10-18T00:00:00.000+0000', emoji: '⏳' };
	const old = { id: '1', title: 't', dateHolder: { isAllDay: true, scheduled_date: sd, cancelled_date: null, createdTime: null, completedTime: null, dueDate: null, startDate: null } };
	const t = { id: '1', title: 't', isAllDay: true, startDate: '2026-10-20T17:00:00.000+0000', dueDate: '2026-10-20T17:00:00.000+0000' };
	d.addDateHolderToTask(t as never, old as never);
	expect((t as never as { dateHolder: { dueDate: unknown; scheduled_date: unknown } }).dateHolder.dueDate).toBeFalsy();
	expect((t as never as { dateHolder: { scheduled_date: unknown } }).dateHolder.scheduled_date).toBeTruthy();
});
