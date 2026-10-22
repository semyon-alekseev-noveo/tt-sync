/**
 * @deprecated Import from `@/sync/vault-io` (TECH-SYNC-MODULARIZATION PR 3).
 * Thin re-export so old paths keep compiling during the stack.
 */
export {
	clearPendingMarkerTaskIds,
	isPendingMarkerTaskId,
	pendingMarkerTaskIdCount,
	prunePendingMarkerTaskIds,
	registerPendingMarkerTaskId,
} from '@/sync/vault-io/pendingMarkerTaskIds';
