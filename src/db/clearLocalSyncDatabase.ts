import { db } from '@/db/dexie';
import type { SyncMeta } from '@/db/schema';
import { getSettings } from '@/settings';
import { getCurrentDeviceInfo } from '@/db/device';

export type ClearLocalSyncResult = {
	/** Rows removed from Dexie task/map/file tables (approximate; meta kept). */
	clearedTables: string[];
	deviceId: string;
};

/**
 * Wipe local sync IndexedDB state so the next Synchronize is a clean re-bootstrap.
 * Does not touch vault markdown. Preserves device identity in `meta`.
 */
export async function clearLocalSyncDatabase(): Promise<ClearLocalSyncResult> {
	if (!db) {
		throw new Error('Local sync database is not initialized');
	}

	const existing = await db.meta.get('sync');
	const device = getCurrentDeviceInfo();
	const settings = getSettings();
	const deviceId =
		existing?.deviceId ||
		device?.deviceId ||
		settings.devices[0]?.deviceId ||
		'';
	const deviceLabel =
		existing?.deviceLabel ||
		device?.deviceLabel ||
		settings.devices.find(d => d.deviceId === deviceId)?.deviceLabel ||
		device?.deviceLabel;
	const devices =
		(existing?.devices?.length ? existing.devices : undefined) ||
		(settings.devices?.length ? settings.devices : undefined) ||
		(deviceId ? [{ deviceId, deviceLabel: deviceLabel || '' }] : []);

	const clearedTables = [
		'tasks',
		'mappings',
		'projects',
		'projectGroups',
		'files',
		'tags',
		'journal',
		'taskCommentMaps',
	] as const;

	const nextMeta: SyncMeta & { key: 'sync' } = {
		key: 'sync',
		lastFullSync: 0,
		lastDeltaSync: 0,
		lastVaultPushWallMs: 0,
		pluginWriteMtimes: {},
		deviceId,
		deviceLabel,
		devices,
		schemaVersion: existing?.schemaVersion ?? 2,
	};

	await db.transaction(
		'rw',
		db.tasks,
		db.mappings,
		db.projects,
		db.projectGroups,
		db.files,
		db.tags,
		db.journal,
		db.taskCommentMaps,
		db.meta,
		async () => {
			await Promise.all([
				db.tasks.clear(),
				db.mappings.clear(),
				db.projects.clear(),
				db.projectGroups.clear(),
				db.files.clear(),
				db.tags.clear(),
				db.journal.clear(),
				db.taskCommentMaps.clear(),
			]);
			await db.meta.put(nextMeta);
		},
	);

	return { clearedTables: [...clearedTables], deviceId };
}
