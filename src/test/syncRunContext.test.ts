import { describe, it, expect, beforeEach } from 'vitest';
import { createSyncRunContext } from '@/sync/SyncRunContext';
import { clearPendingMarkerTaskIds, isPendingMarkerTaskId } from '@/sync/vault-io';

describe('SyncRunContext', () => {
	beforeEach(() => {
		clearPendingMarkerTaskIds();
	});

	it('creates a stable identity and bridges pending marker helpers', async () => {
		const ctx = createSyncRunContext({ trigger: 'manual', fullSync: false });
		expect(ctx.syncId).toMatch(/^sync-/);
		expect(ctx.trigger).toBe('manual');
		expect(ctx.locallyEdited.size).toBe(0);

		ctx.registerPendingMarker('AbCdEf');
		expect(ctx.isPendingMarker('abcdef')).toBe(true);
		expect(isPendingMarkerTaskId('abcdef')).toBe(true);

		await ctx.reconcilePendingMarkers(async (ids) => {
			const map = new Map<string, string>();
			if (ids.includes('abcdef')) map.set('abcdef', 'note.md');
			return map;
		});
		expect(ctx.isPendingMarker('abcdef')).toBe(false);
	});

	it('resetLifecycle clears guarded pull handle', () => {
		const ctx = createSyncRunContext({ trigger: 'startup', fullSync: true });
		ctx.guardedPull = { applyDeletions: true, advanceCheckpoint: true };
		ctx.resetLifecycle();
		expect(ctx.guardedPull).toBeUndefined();
	});
});
