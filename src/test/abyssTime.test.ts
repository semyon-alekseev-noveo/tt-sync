import { it, expect, vi } from 'vitest';
vi.mock('@/utils/logger', () => ({ default: { debug: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock('@/settings', () => ({ getSettings: () => ({ abyssTasksFormat: true }) }));
import { DateMan } from '../dateMan';

const d = new DateMan();
it('parses Abyss `⏰ HH:MM` as time of the due date', () => {
	const h = d.parseDates('- [ ] Т 📅 2026-10-20 ⏰ 14:30', 'Asia/Novosibirsk');
	expect(h.dueDate?.hasATime).toBe(true);
	expect(h.dueDate?.time).toBe('14:30');
	expect(h.isAllDay).toBe(false);
});
it('still parses the legacy [HH:MM] prefix and inline date time', () => {
	expect(d.parseDates('- [ ] [09:00] Т 📅 2026-10-21', 'Asia/Novosibirsk').dueDate?.time).toBe('09:00');
	expect(d.parseDates('- [ ] Т 📅 2026-10-21 10:15', 'Asia/Novosibirsk').dueDate?.hasATime).toBe(true);
});
it('a reminder `⏰ 30m` is not a time', () => {
	expect(d.parseDates('- [ ] Т 📅 2026-10-20 ⏰ 30m', 'Asia/Novosibirsk').dueDate?.hasATime).toBe(false);
});
it('renders `📅 date ⏰ HH:MM` in Abyss mode and strips it from the title', () => {
	const line = d.addDatesToLine('- [ ] Т', { isAllDay: false, dateHolder: { isAllDay: false, dueDate: { isoDate: '2026-10-20T07:30:00.000+0000', emoji: '📅' } } } as never);
	expect(line).toMatch(/^- \[ \] Т 📅 2026-10-20 ⏰ \d{2}:30$/);
	expect(d.stripDatesFromLine(line)!.trim()).toBe('- [ ] Т');
});
