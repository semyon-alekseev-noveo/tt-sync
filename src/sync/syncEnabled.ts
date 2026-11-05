/**
 * UX-SET-SYNC-MASTER-OFF — kill switch for automatic / reactive sync.
 *
 * Interval 0 only stops the scheduled timer. When `syncEnabled` is false,
 * startup, open-note debounce, file-modify push, checkbox→TT, and other
 * background paths no-op. Explicit Synchronize (`trigger: 'manual'`) still runs.
 *
 * Default is on (`syncEnabled !== false`) so existing installs keep prior behavior.
 */

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
