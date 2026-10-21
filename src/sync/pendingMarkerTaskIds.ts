/**
 * TickTick tasks upserted to Dexie before %%[ticktick_id:: …]%% lands in the vault
 * (e.g. commitVaultText deferred while the caret is on the new line).
 */
const pending = new Set<string>();

export function registerPendingMarkerTaskId(taskId: string): void {
	if (taskId) pending.add(taskId.toLowerCase());
}

export function clearPendingMarkerTaskIds(): void {
	pending.clear();
}

export function isPendingMarkerTaskId(taskId: string): boolean {
	return pending.has(taskId.toLowerCase());
}

/** Drop ids whose marker now appears anywhere in the vault (per-sync reconcile). */
export async function prunePendingMarkerTaskIds(
	present: (ids: string[]) => Promise<Map<string, string>>,
): Promise<void> {
	if (pending.size === 0) return;
	const ids = [...pending];
	const where = await present(ids);
	for (const id of ids) {
		if (where.has(id.toLowerCase())) pending.delete(id.toLowerCase());
	}
}

export function pendingMarkerTaskIdCount(): number {
	return pending.size;
}
