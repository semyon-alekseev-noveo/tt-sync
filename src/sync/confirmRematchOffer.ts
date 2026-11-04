/**
 * Pure Confirm→Rebind offer helpers (no PluginContext).
 * Kept separate from confirmRematch.ts so TaskDeletionModal can call them
 * without closing a madge cycle through pluginContext → fileOperation → modal.
 */
import {
	canOfferRematch,
	type PlannedDeletion,
} from '@/sync/massDeleteGuard';

/** Minimal Confirm modal row (matches TaskDeletionModal.DeletionItem). */
export type ConfirmDeletionItem = {
	title: string;
	filePath?: string;
	id?: string;
	line?: string;
};

/** Map Confirm list rows to rematchCandidates shape (vault→TT delete). */
export function plannedFromConfirmDeletionItems(
	items: readonly ConfirmDeletionItem[],
): PlannedDeletion[] {
	const out: PlannedDeletion[] = [];
	for (const it of items) {
		const id = (it.id ?? '').trim();
		const file = (it.filePath ?? '').trim();
		if (!id || !file) continue;
		out.push({
			id,
			taskId: id,
			kind: 'task',
			direction: 'vault-to-ticktick',
			action: 'delete',
			title: it.title,
			file,
		});
	}
	return out;
}

export function confirmOffersRematch(items: readonly ConfirmDeletionItem[]): boolean {
	return canOfferRematch(plannedFromConfirmDeletionItems(items));
}
