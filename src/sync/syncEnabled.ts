/**
 * UX-SET-SYNC-MASTER-OFF — kill switch for automatic / reactive sync.
 *
 * Interval 0 only stops the scheduled timer. When `syncEnabled` is false,
 * startup, open-note debounce, file-modify push, checkbox→TT, and other
 * background paths no-op. Explicit Synchronize (`trigger: 'manual'`) still runs.
 *
 * Default is on (`syncEnabled !== false`) so existing installs keep prior behavior.
 *
 * BUG-SYNC-OFF-REACTIVE-CREATE: LiveSync / external data.json writes can leave
 * in-memory `syncEnabled` stale (true) while disk is false. Reactive paths must
 * re-check disk when memory still says on, and detector methods must refuse
 * TickTick writes unless a full Synchronize is running (`syncRunning`).
 */

import { getSettings, updateSettings } from '@/settings';

export type SyncEnabledSettings = { syncEnabled?: boolean };

/** True when automatic and reactive sync paths may run. */
export function isAutomaticSyncEnabled(
	settings: SyncEnabledSettings | null | undefined,
): boolean {
	return settings?.syncEnabled !== false;
}

/** Triggers that must honor the master-off kill switch. */
export function isAutomaticSyncTrigger(trigger: string): boolean {
	return trigger === 'scheduled' || trigger === 'startup';
}

/**
 * Whether a vault→TT write may proceed outside a full Synchronize.
 * Full sync (`syncRunning`) always may write (manual Synchronize while master off).
 */
export function mayPushTickTickReactively(opts: {
	settings?: SyncEnabledSettings | null;
	syncRunning?: boolean;
}): boolean {
	if (opts.syncRunning) return true;
	return isAutomaticSyncEnabled(opts.settings ?? getSettings());
}

type DiskSettings = { syncEnabled?: boolean } | null;

/**
 * If memory still allows reactive sync but disk says master off, adopt disk and
 * return false. Avoids LiveSync / hand-edit lag (BUG-SYNC-OFF-REACTIVE-CREATE).
 * When memory already says off, skip the disk read.
 */
export async function reconcileSyncEnabledFromDisk(
	loadDisk: () => Promise<DiskSettings>,
): Promise<boolean> {
	const memory = getSettings();
	if (!isAutomaticSyncEnabled(memory)) return false;
	try {
		const disk = await loadDisk();
		if (disk && disk.syncEnabled === false) {
			updateSettings({ syncEnabled: false }, { persist: false });
			return false;
		}
	} catch {
		// Keep memory decision if disk is unreadable.
	}
	return true;
}
