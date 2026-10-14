import { it, expect } from 'vitest';
import { nextOccurrence, rollRecurringLines } from '@/recurrence';
it('next occurrence', () => {
	expect(nextOccurrence('RRULE:FREQ=WEEKLY', '2026-10-19T17:00:00.000+0000')).toBe('2026-10-26T17:00:00.000+0000');
	expect(nextOccurrence('RRULE:FREQ=DAILY;INTERVAL=3', '2026-10-19T17:00:00.000+0000')).toBe('2026-10-22T17:00:00.000+0000');
	expect(nextOccurrence('RRULE:FREQ=MONTHLY', '2026-10-19T17:00:00.000+0000')).toBe('2026-11-19T17:00:00.000+0000');
	expect(nextOccurrence('RRULE:FREQ=WEEKLY;BYDAY=MO,WE', '2026-10-19T17:00:00.000+0000')).toBeUndefined();
});
it('roll lines', () => {
	const l = '- [x] Повтор  [link](https://ticktick.com/webapp/#p/x/tasks/abc) #ticktick %%[ticktick_id:: abc]%% 🔁 every week 📅 2026-10-20 ✅ 2026-10-14';
	const [open, done] = rollRecurringLines(l, '2026-10-19T17:00:00.000+0000', '2026-10-26T17:00:00.000+0000', 'Asia/Novosibirsk');
	expect(open).toContain('- [ ] Повтор');
	expect(open).toContain('📅 2026-10-27');
	expect(open).not.toContain('✅');
	expect(done).toBe('- [x] Повтор 🔁 every week 📅 2026-10-20 ✅ 2026-10-14 %%tt-detached%%');
});
