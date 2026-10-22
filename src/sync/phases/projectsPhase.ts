import type { IProject } from '@/api/types/Project';
import { db } from '@/db/dexie';
import type { SyncPhaseDeps } from '@/sync/phases/types';
import log from '@/utils/logger';

/**
 * Load TickTick projects into Dexie; reorganize vault folders when TT moved lists
 * since the last sync.
 */
export async function runProjectsPhase(deps: SyncPhaseDeps): Promise<IProject[] | undefined> {
	const { service, ui, ctx } = deps;
	ui.setFullStep('Loading TickTick projects…');
	const loaded = await service.saveProjectsToCache();
	if (loaded) {
		const mostRecentModifiedTime = loaded.reduce((latest, project) => {
			return new Date(project.modifiedTime) > new Date(latest)
				? project.modifiedTime
				: latest;
		}, loaded[0].modifiedTime);
		const mostRecentModifiedTimeDate = new Date(mostRecentModifiedTime);
		log.debug(`Most recent modified time: ${mostRecentModifiedTime}`);
		const meta = await db.meta.get('sync');
		const lastFullSync = meta?.lastFullSync ?? 0;
		const lastDeltaSync = meta?.lastDeltaSync ?? 0;
		const lastSync = lastFullSync > lastDeltaSync ? lastFullSync : lastDeltaSync;
		const lastSyncDate = lastSync ? new Date(lastSync) : null;
		if (lastSyncDate && mostRecentModifiedTimeDate > lastSyncDate) {
			log.debug('TT Folder move detected. Moving all project files to new location.');
			ui.setFullStep('Reorganizing project folders…');
			await service.reorganizeFilesToFolders();
		}
	}
	ctx.projects = loaded;
	return loaded;
}
