import { db } from '@/db/dexie';
import { markTaskDeleted } from '@/db/tasks';
import { healTagListMappings } from '@/listMapping';
import { getSettings, updateSettings } from '@/settings';
import { deletionConfirmMode } from '@/sync/massDeleteGuard';
import type { SyncPhaseDeps } from '@/sync/phases/types';
import { syncTickTickWithDexie } from '@/sync/sync';
import { resolveProjectsList } from '@/syncScope';
import log from '@/utils/logger';

/** Delta/full pull into Dexie, list-mapping heal, vanished-list detach. */
export async function runPullPhase(deps: SyncPhaseDeps): Promise<void> {
	const { plugin, ui, ctx, tickApi } = deps;
	if (!tickApi) throw new Error('pull phase requires tickApi');

	ui.setFullStep(ctx.fullSync ? 'Full sync from TickTick…' : 'Pulling updates from TickTick…');
	await syncTickTickWithDexie(tickApi, ctx.fullSync, ctx.guardedPull);

	const projects = ctx.projects;
	if (projects?.length) {
		const healed = healTagListMappings(getSettings().tagListMappings, projects);
		const pl = resolveProjectsList(projects, getSettings().projectsListName, getSettings().projectsListId);
		const plUpd =
			pl && (pl.id !== getSettings().projectsListId || pl.name !== getSettings().projectsListName)
				? { projectsListId: pl.id, projectsListName: pl.name }
				: {};
		if (healed || Object.keys(plUpd).length) {
			updateSettings({ ...(healed ? { tagListMappings: healed } : {}), ...plUpd }, { persist: false });
			await plugin.saveSettings();
			log.info('List mapping refreshed (rename-safe)');
		}
	}

	// A list deleted in TickTick takes its tasks with it but they are not reported as deleted:
	// treat tasks of vanished lists as deleted (guarded against a partial/failed project fetch).
	try {
		const live = new Set((projects ?? []).map((p) => p.id));
		if (projects && live.size > 0) {
			const all = (await db.tasks.toArray()).filter((lt) => !lt.deleted && lt.task?.projectId);
			const gone = all.filter(
				(lt) => !lt.task.projectId.startsWith('inbox') && !live.has(lt.task.projectId),
			);
			const mode = deletionConfirmMode();
			if (mode === 'skip') {
				if (gone.length) log.warn(`Mass-delete guard held ${gone.length} task(s) from missing TickTick lists`);
			} else if (gone.length && (mode === 'force' || gone.length <= Math.max(5, all.length / 2))) {
				for (const lt of gone) await markTaskDeleted(lt.task.id);
				log.warn(
					`${gone.length} task(s) belonged to deleted TickTick lists; detaching`,
					gone.map((g) => g.task.id),
				);
			} else if (gone.length) {
				log.error(`Refusing to detach ${gone.length} tasks of missing lists (looks like a partial fetch)`);
			}
		}
	} catch (e) {
		log.warn('vanished-list check failed', e);
	}
}
