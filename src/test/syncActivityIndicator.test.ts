import { describe, expect, it } from 'vitest';
import { shouldShowFullSyncProgress } from '@/services/SyncActivityIndicator';
import { updateSettings } from '@/settings';

describe('shouldShowFullSyncProgress', () => {
	it('shows progress for manual and startup', () => {
		updateSettings({ showSyncProgressOnScheduledSync: false }, { persist: false });
		expect(shouldShowFullSyncProgress('manual')).toBe(true);
		expect(shouldShowFullSyncProgress('startup')).toBe(true);
	});

	it('hides scheduled sync when setting is off', () => {
		updateSettings({ showSyncProgressOnScheduledSync: false }, { persist: false });
		expect(shouldShowFullSyncProgress('scheduled')).toBe(false);
	});

	it('shows scheduled sync when setting is on', () => {
		updateSettings({ showSyncProgressOnScheduledSync: true }, { persist: false });
		expect(shouldShowFullSyncProgress('scheduled')).toBe(true);
	});
});
