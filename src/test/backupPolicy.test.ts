import { describe, expect, it } from 'vitest';
import { shouldBackupToday } from '@/backupPolicy';
describe('backup once per day', () => {
	const d = new Date(2026, 9, 14, 10, 0);
	it('due when never or other day', () => {
		expect(shouldBackupToday('', d)).toBe('2026-10-14');
		expect(shouldBackupToday('2026-10-13', d)).toBe('2026-10-14');
	});
	it('skipped same day', () => expect(shouldBackupToday('2026-10-14', new Date(2026, 9, 14, 23, 59))).toBeUndefined());
});
