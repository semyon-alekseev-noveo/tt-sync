/**
 * UX-RESET-1 / BUG-RESET-TASKS-PARTIAL: Reset local sync database must wipe Dexie
 * sync state + checkPoint, keep device identity, and leave vault notes alone.
 */
import 'fake-indexeddb/auto';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { db, initDB } from '@/db/dexie';
import { clearLocalSyncDatabase } from '@/db/clearLocalSyncDatabase';
import { DEFAULT_SETTINGS, getSettings, updateSettings } from '@/settings';
import { upsertCommentMap, commentMapId } from '@/db/taskCommentMaps';
import { commentFingerprint } from '@/abyssFormat';
import { resetTasks } from '@/ui/settings/utils/ResetSynchronization';
import { getTick } from '@/api/tick_singleton_factory';
import { notePluginWrite, pluginWriteMtimes, clearPluginWrites } from '@/utils/editedSince';
import {
	registerPendingMarkerTaskId,
	pendingMarkerTaskIdCount,
	clearPendingMarkerTaskIds,
} from '@/sync/vault-io/pendingMarkerTaskIds';
import { evaluateMassDeleteGuard } from '@/sync/massDeleteGuard';

vi.mock('@/utils/logger', () => ({
	default: { debug: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), trace: vi.fn() },
}));

vi.mock('obsidian', async () => {
	const actual = await vi.importActual<typeof import('obsidian')>('obsidian');
	return {
		...actual,
		Notice: class Notice {
			constructor(_msg?: string, _timeout?: number) {}
		},
	};
});

const saved = { ...getSettings() };

async function seedStaleSyncState() {
	await db.tasks.clear();
	await db.files.clear();
	await db.projects.clear();
	await db.projectGroups.clear();
	await db.mappings.clear();
	await db.tags.clear();
	await db.journal.clear();
	await db.taskCommentMaps.clear();

	await db.tasks.put({
		localId: 'tt:abc',
		taskId: 'abcdefabcdefabcdefabcdef',
		task: { id: 'abcdefabcdefabcdefabcdef', projectId: 'p1', title: 'stale' } as never,
		updatedAt: 1,
		file: '00 Inbox/keep.md',
		source: 'ticktick',
	});
	await db.files.put({ path: '00 Inbox/keep.md', defaultProjectId: 'p1' });
	await db.projects.put({ id: 'p1', project: { id: 'p1', name: 'P' } as never });
	await db.projectGroups.put({ id: 'g1', group: { id: 'g1', name: 'G' } as never });
	await db.mappings.put({
		id: 'tt:abc:00 Inbox/keep.md',
		localId: 'tt:abc',
		taskId: 'abcdefabcdefabcdefabcdef',
		file: '00 Inbox/keep.md',
		createdAt: 1,
	});
	await db.tags.put({ name: 'x', tag: { name: 'x' } as never });
	await db.journal.add({ timestamp: Date.now(), deviceId: 'd', action: 'test' });
	const fp = commentFingerprint('hello');
	await upsertCommentMap({
		id: commentMapId('abcdefabcdefabcdefabcdef', fp),
		taskId: 'abcdefabcdefabcdefabcdef',
		projectId: 'p1',
		fingerprint: fp,
		ticktickCommentId: 'c1',
		body: 'hello',
		origin: 'vault',
	});
	await db.meta.update('sync', {
		lastFullSync: 99,
		lastDeltaSync: 88,
		lastVaultPushWallMs: 77,
		pluginWriteMtimes: { '00 Inbox/keep.md': 123 },
	});
}

describe('UX-RESET-1 / BUG-RESET-TASKS-PARTIAL clear local sync database', () => {
	beforeAll(async () => {
		updateSettings(
			{ ...DEFAULT_SETTINGS, ...saved, vaultName: 'ux-reset-test', checkPoint: 42, token: 't' },
			{ persist: false },
		);
		await initDB();
	});

	beforeEach(async () => {
		updateSettings({ checkPoint: 42, token: 't' }, { persist: false });
		clearPluginWrites();
		clearPendingMarkerTaskIds();
		await seedStaleSyncState();
	});

	it('UX-RESET-1: clearLocalSyncDatabase empties sync tables and preserves deviceId', async () => {
		const before = await db.meta.get('sync');
		const deviceId = before!.deviceId;
		expect(await db.tasks.count()).toBeGreaterThan(0);

		const result = await clearLocalSyncDatabase();

		expect(result.deviceId).toBe(deviceId);
		expect(await db.tasks.count()).toBe(0);
		expect(await db.files.count()).toBe(0);
		expect(await db.projects.count()).toBe(0);
		expect(await db.projectGroups.count()).toBe(0);
		expect(await db.mappings.count()).toBe(0);
		expect(await db.tags.count()).toBe(0);
		expect(await db.journal.count()).toBe(0);
		expect(await db.taskCommentMaps.count()).toBe(0);

		const after = await db.meta.get('sync');
		expect(after?.deviceId).toBe(deviceId);
		expect(after?.lastFullSync).toBe(0);
		expect(after?.lastDeltaSync).toBe(0);
		expect(after?.lastVaultPushWallMs).toBe(0);
		expect(after?.pluginWriteMtimes).toEqual({});
	});

	it('BUG-RESET-TASKS-PARTIAL: resetTasks clears Dexie and checkPoint, not vault paths', async () => {
		updateSettings({ checkPoint: 999 }, { persist: false });
		notePluginWrite('00 Inbox/keep.md', 111);
		registerPendingMarkerTaskId('abcdefabcdefabcdefabcdef');
		getTick({ baseUrl: 'ticktick.com', token: 't', checkPoint: 999 });

		const vaultDelete = vi.fn();
		const plugin = {
			saveSettings: vi.fn(async () => undefined),
			taskCache: { clear: vi.fn() },
			tickTickRestAPI: {
				checkpoint: 999,
				api: { checkpoint: 999 },
			},
			app: { vault: { delete: vaultDelete } },
			service: { syncFiles: vi.fn(), scheduledSynchronization: vi.fn() },
		};

		await resetTasks(plugin as never);

		expect(getSettings().checkPoint).toBe(0);
		expect(plugin.tickTickRestAPI.checkpoint).toBe(0);
		expect(plugin.tickTickRestAPI.api.checkpoint).toBe(0);
		expect(getTick({}).checkpoint).toBe(0);
		expect(await db.tasks.count()).toBe(0);
		expect(await db.taskCommentMaps.count()).toBe(0);
		expect(await db.files.count()).toBe(0);
		expect(plugin.taskCache.clear).toHaveBeenCalled();
		expect(pluginWriteMtimes()).toEqual({});
		expect(pendingMarkerTaskIdCount()).toBe(0);
		expect(vaultDelete).not.toHaveBeenCalled();
		expect(plugin.service.syncFiles).not.toHaveBeenCalled();
		expect(plugin.saveSettings).toHaveBeenCalled();
	});

	it('UX-RESET-1: empty Dexie still blocks invented deletions (empty-dexie guard)', async () => {
		await clearLocalSyncDatabase();
		const decision = evaluateMassDeleteGuard(
			[{
				id: 'dead',
				kind: 'task',
				direction: 'vault-to-ticktick',
				action: 'delete',
				taskId: 'dead',
				title: 'x',
			}],
			{
				dexieTaskCount: 0,
				vaultTrackedCount: 5,
				ticktickSnapshotEmpty: false,
				vaultIndexIncomplete: false,
			},
			{ enabled: true, taskCountThreshold: 10, taskPercentThreshold: 20, previewCount: 20 },
		);
		expect(decision.block).toBe(true);
		expect(decision.reason).toBe('empty-dexie');
	});
});
