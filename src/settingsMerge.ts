import { DEFAULT_SETTINGS, type ITickTickSyncSettings } from '@/settings';
import { migrateSyncedLists } from '@/syncScope';

/** Merge on-disk data.json with defaults; user keys always win over DEFAULT_SETTINGS. */
export function mergeSettingsWithDefaults(data: Record<string, unknown>): ITickTickSyncSettings {
	const migrated = migrateSyncedLists(data as { syncedLists?: unknown; SyncProject?: unknown });
	return { ...DEFAULT_SETTINGS, ...migrated } as ITickTickSyncSettings;
}
