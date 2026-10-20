/** Milliseconds to wait after layout-ready and Obsidian Sync idle, before the first sync. */
export function startupSyncDelayMs(seconds: number | undefined): number {
	if (seconds === undefined || seconds === null || Number.isNaN(Number(seconds))) return 30_000;
	const n = Number(seconds);
	if (n <= 0) return 0;
	return Math.round(n * 1000);
}

const defaultSleep = (ms: number) => new Promise<void>(resolve => {
	setTimeout(resolve, ms);
});

/**
 * Startup sync waits until the workspace layout is ready and Obsidian Sync is
 * idle (when that can be detected), then the configured delay.
 */
export async function waitForStartupSync(deps: {
	ensureLayoutReady: () => Promise<void>;
	waitForObsidianSync: () => Promise<void>;
	delaySeconds: number;
	sleep?: (ms: number) => Promise<void>;
}): Promise<{ delayMs: number }> {
	await deps.ensureLayoutReady();
	await deps.waitForObsidianSync();
	const delayMs = startupSyncDelayMs(deps.delaySeconds);
	if (delayMs > 0) await (deps.sleep ?? defaultSleep)(delayMs);
	return { delayMs };
}
