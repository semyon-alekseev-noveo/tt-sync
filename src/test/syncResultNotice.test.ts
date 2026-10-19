import { describe, expect, it } from 'vitest';
import { formatPluginLoadedNotice, formatSyncResultNotice } from '@/sync/result';

describe('sync result notices', () => {
	it('BUG-NOTICE-1 load notice follows skipBackup instead of always saying backup was skipped', () => {
		expect(formatPluginLoadedNotice(false)).toBe('TickTickSync loaded successfully. TickTick data has been backed up.');
		expect(formatPluginLoadedNotice(true)).toBe('TickTickSync loaded successfully. Skipping backup.');
		expect(formatPluginLoadedNotice(false)).not.toContain('Skipping backup');
	});

	it('BUG-SYNC-SILENT-FAIL sync notice names a failure instead of claiming completion', () => {
		expect(formatSyncResultNotice({ ok: true })).toBe('Sync completed.');
		expect(formatSyncResultNotice({ ok: false, error: 'Get Updated Tasks failed: no response' }))
			.toBe('Sync failed: Get Updated Tasks failed: no response');
	});
});
