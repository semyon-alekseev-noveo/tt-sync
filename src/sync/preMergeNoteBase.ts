/**
 * Last vault-synced note `content` before a TickTick pull overwrites Dexie.
 *
 * `mergeAbyssBlock` treats `__baseContent` as the last synced note text so it can
 * tell an unpushed vault `- >` edit from a remote body change. After pull,
 * `loadTaskById` already has the new remote `content`, so persist must use this
 * map instead (NOTE-BODY-2).
 */
const preMergeByTaskId = new Map<string, string>();

export function clearPreMergeNoteBase(): void {
	preMergeByTaskId.clear();
}

/** Remember Dexie note content for `taskId` before applying a remote update. */
export function rememberPreMergeNoteBase(taskId: string, content: string | undefined | null): void {
	if (!taskId) return;
	preMergeByTaskId.set(taskId, content ?? '');
}

/** Consume the remembered base (once). Missing → undefined (caller falls back). */
export function takePreMergeNoteBase(taskId: string): string | undefined {
	if (!taskId || !preMergeByTaskId.has(taskId)) return undefined;
	const value = preMergeByTaskId.get(taskId)!;
	preMergeByTaskId.delete(taskId);
	return value;
}
