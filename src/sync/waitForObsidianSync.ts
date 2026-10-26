/**
 * Wait until Obsidian Sync is idle before startup sync (#66 main extract).
 */
import type { App } from 'obsidian';
import log from '@/utils/logger';

type SyncService = {
	isSyncing?: (() => boolean) | boolean;
	on?: (event: string, handler: () => void) => void;
	syncing?: boolean;
};

/**
 * If Obsidian Sync is installed and enabled, wait until it finishes
 * syncing before proceeding with plugin initialization.
 */
export async function waitForObsidianSync(app: App): Promise<void> {
	const appAny = app as unknown as {
		internalPlugins: { getPluginById(id: string): { enabled: boolean; instance?: unknown } | undefined };
		sync?: SyncService;
	};
	const internalPlugins = appAny.internalPlugins;
	if (!internalPlugins) return;

	const syncPlugin = internalPlugins.getPluginById('sync');
	if (!syncPlugin?.enabled) return;

	const syncService = appAny.sync ?? (syncPlugin.instance as SyncService | undefined);
	if (!syncService) return;

	log.debug('Obsidian Sync detected, waiting for sync to complete...');

	return new Promise<void>((resolve) => {
		const isSyncing = (): boolean => {
			try {
				const fn = syncService.isSyncing;
				return typeof fn === 'function' ? fn() : (fn ?? syncService.syncing ?? false);
			} catch {
				return false;
			}
		};

		if (!isSyncing()) {
			log.debug('Obsidian Sync already idle, proceeding.');
			resolve();
			return;
		}

		const poll = () => {
			if (!isSyncing()) {
				log.debug('Obsidian Sync finished, proceeding.');
				resolve();
				return;
			}
			window.setTimeout(poll, 500);
		};
		poll();

		try {
			if (typeof syncService.on === 'function') {
				syncService.on('status-change', () => {
					if (!isSyncing()) {
						resolve();
					}
				});
			}
		} catch {
			// event listener not available, polling alone is fine
		}
	});
}
