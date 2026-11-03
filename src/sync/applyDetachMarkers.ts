/**
 * ARCH-SYNC #258 — apply DetachMarker (снять id, текст оставить) for remote-gone
 * rows so detach-heavy holds drain after the identity/Link pass.
 */
import { TFile } from 'obsidian';
import { detachInContent } from '@/detach';
import { plannedDeletionToSyncIntent, type PlannedDeletionLike } from '@/sync/syncIntent';
import { commitVaultText, syncRead } from '@/sync/vault-io';
import type { App } from 'obsidian';
import log from '@/utils/logger';

export interface DetachMarkerHost {
	app: App;
	markerName: string;
	clearTaskFile(taskId: string): Promise<void>;
	deleteTask(taskId: string): Promise<void>;
}

export function selectDetachMarkerPlanned<T extends PlannedDeletionLike>(planned: readonly T[]): T[] {
	return planned.filter(item => plannedDeletionToSyncIntent(item).kind === 'DetachMarker');
}

export function withoutDetachMarkerPlanned<T extends PlannedDeletionLike>(planned: readonly T[]): T[] {
	return planned.filter(item => plannedDeletionToSyncIntent(item).kind !== 'DetachMarker');
}

/**
 * Strip ticktick_id from vault lines, keep checklist text, clear Dexie file link.
 * Does not delete TickTick tasks (already gone / remote-gone provenance).
 */
export async function applyDetachMarkerPlanned(
	host: DetachMarkerHost,
	planned: readonly PlannedDeletionLike[],
): Promise<{ applied: number; skipped: number }> {
	const rows = selectDetachMarkerPlanned(planned);
	let applied = 0;
	let skipped = 0;
	for (const item of rows) {
		const taskId = (item.taskId || item.id || '').trim();
		if (!taskId) {
			skipped += 1;
			continue;
		}
		const filePath = (item.file || '').trim();
		try {
			await host.clearTaskFile(taskId);
			await host.deleteTask(taskId);
			if (filePath) {
				const f = host.app.vault.getAbstractFileByPath(filePath);
				if (f instanceof TFile) {
					const snapshot = await syncRead(host.app.vault, f);
					const next = detachInContent(snapshot, taskId, host.markerName);
					if (next && next !== snapshot) {
						await commitVaultText(host.app, f, snapshot, next);
					}
				}
			}
			applied += 1;
		} catch (error) {
			skipped += 1;
			log.warn(`TickTickSync DetachMarker: failed for ${taskId}`, error);
		}
	}
	return { applied, skipped };
}
