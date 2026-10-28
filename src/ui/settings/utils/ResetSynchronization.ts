import { getSettings, updateSettings } from '@/settings';
import type TickTickSync from '@/main';
import log from '@/utils/logger';
import { Notice } from 'obsidian';
import { clearLocalSyncDatabase } from '@/db/clearLocalSyncDatabase';
import { getTick } from '@/api/tick_singleton_factory';
import { clearPluginWrites } from '@/utils/editedSince';
import { clearPendingMarkerTaskIds } from '@/sync/vault-io/pendingMarkerTaskIds';

/**
 * UX-RESET-1 / BUG-RESET-TASKS-PARTIAL: real local wipe + checkPoint 0.
 * Does not delete vault notes. Does not auto-sync (use Manual Sync after TT restore).
 */
export async function resetTasks(plugin: TickTickSync, setIsWorking?: (val: boolean) => void) {
	setIsWorking?.(true);
	try {
		log.debug('## UX-RESET-1 clear local sync database');
		const result = await clearLocalSyncDatabase();

		updateSettings({ checkPoint: 0 });
		getTick({
			baseUrl: getSettings().baseURL,
			token: getSettings().token ?? '',
			checkPoint: 0,
		});
		if (plugin.tickTickRestAPI) {
			plugin.tickTickRestAPI.checkpoint = 0;
			if (plugin.tickTickRestAPI.api) {
				plugin.tickTickRestAPI.api.checkpoint = 0;
			}
		}

		clearPluginWrites();
		clearPendingMarkerTaskIds();
		plugin.taskCache?.clear();

		await plugin.saveSettings();

		new Notice(
			'Local sync database cleared. Vault notes were not deleted. ' +
				'Restore TickTick from backup if needed, then run Synchronize to re-link.',
			8000,
		);
		log.info('UX-RESET-1 cleared tables', result.clearedTables.join(','), 'deviceId', result.deviceId);
	} catch (e) {
		log.error('UX-RESET-1 failed', e);
		new Notice(`Reset local sync database failed: ${e instanceof Error ? e.message : String(e)}`, 8000);
		throw e;
	} finally {
		setIsWorking?.(false);
	}
}
