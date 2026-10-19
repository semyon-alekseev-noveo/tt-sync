/** Outcome of one `synchronization()` run. Callers use this for the notice; a thrown error is not required. */
export type SyncRunResult = { ok: true } | { ok: false; error: string };

/** Load notice. The backup clause must be parenthesized: `+` binds tighter than `?:`. */
export function formatPluginLoadedNotice(skipBackup: boolean): string {
	const tail = skipBackup ? 'Skipping backup.' : 'TickTick data has been backed up.';
	return `TickTickSync loaded successfully. ${tail}`;
}

/** Manual Synchronize notice. Success and failure are different strings. */
export function formatSyncResultNotice(result: SyncRunResult): string {
	if (result.ok) return 'Sync completed.';
	return `Sync failed: ${result.error || 'unknown error'}`;
}
